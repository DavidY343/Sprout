from fastapi import APIRouter, Depends, HTTPException, Request, Response, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx as httpx_client

from app.core.dependencies import get_db, verify_csrf
from app.core.security import hash_password, verify_password
from app.core.jwt import (
    create_access_token, create_refresh_token, create_email_token,
    verify_token, generate_csrf_token
)
from app.core.config import (
    COOKIE_DOMAIN, COOKIE_SECURE, COOKIE_SAMESITE,
    ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS,
    REMEMBER_ME_EXPIRE_DAYS, FRONTEND_URL, SMTP_HOST,
    GOOGLE_CLIENT_ID
)
from app.models.user import User
from app.schemas.user import UserCreate

router = APIRouter()


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str, csrf_token: str, remember_me: bool = False):
    """Set HttpOnly cookies for access/refresh tokens and a readable CSRF cookie."""
    refresh_max_age = (REMEMBER_ME_EXPIRE_DAYS if remember_me else REFRESH_TOKEN_EXPIRE_DAYS) * 86400

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
        max_age=refresh_max_age,
        path="/api/v1/auth",  # Only sent to auth endpoints
    )
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,  # JS needs to read this
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
        max_age=refresh_max_age,
        path="/",
    )


def _clear_auth_cookies(response: Response):
    for name in ("access_token", "refresh_token", "csrf_token"):
        response.delete_cookie(
            key=name,
            domain=COOKIE_DOMAIN,
            path="/" if name != "refresh_token" else "/api/v1/auth",
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
        )


@router.post("/register")
async def register(user_data: UserCreate, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(email=user_data.email, password_hash=hash_password(user_data.password))
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    remember_me = getattr(user_data, 'remember_me', False)
    access = create_access_token({"sub": str(new_user.user_id)})
    refresh = create_refresh_token({"sub": str(new_user.user_id)}, remember_me=remember_me)
    csrf = generate_csrf_token()
    
    _set_auth_cookies(response, access, refresh, csrf, remember_me)

    # Send verification email (non-blocking, best-effort)
    if SMTP_HOST:
        from app.services.email_service import send_verification_email
        token = create_email_token({"sub": str(new_user.user_id), "purpose": "verify"})
        await send_verification_email(new_user.email, token)

    return {"message": "ok", "email": new_user.email}


@router.post("/login")
async def login(response: Response, db: AsyncSession = Depends(get_db), email: str = Body(...), password: str = Body(...), remember_me: bool = Body(False)):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user or not user.password_hash or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access = create_access_token({"sub": str(user.user_id)})
    refresh = create_refresh_token({"sub": str(user.user_id)}, remember_me=remember_me)
    csrf = generate_csrf_token()
    
    _set_auth_cookies(response, access, refresh, csrf, remember_me)

    return {"message": "ok", "email": user.email, "email_verified": user.email_verified}


@router.post("/refresh")
async def refresh_token_endpoint(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    
    payload = verify_token(token)
    if not payload or payload.get("type") != "refresh":
        _clear_auth_cookies(response)
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user_id = payload.get("sub")
    access = create_access_token({"sub": user_id})
    csrf = generate_csrf_token()

    response.set_cookie(
        key="access_token",
        value=access,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="csrf_token",
        value=csrf,
        httponly=False,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
        max_age=REMEMBER_ME_EXPIRE_DAYS * 86400,
        path="/",
    )

    return {"message": "ok"}


@router.post("/logout")
async def logout_endpoint(response: Response):
    _clear_auth_cookies(response)
    return {"message": "ok"}


@router.post("/verify-email")
async def verify_email(token: str = Body(..., embed=True), db: AsyncSession = Depends(get_db)):
    payload = verify_token(token)
    if not payload or payload.get("purpose") != "verify":
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")
    
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.user_id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.email_verified = True
    await db.commit()
    return {"message": "Email verified"}


@router.post("/forgot-password")
async def forgot_password(email: str = Body(..., embed=True), db: AsyncSession = Depends(get_db)):
    """Send password reset email. Always returns 200 to avoid email enumeration."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if user and SMTP_HOST:
        from app.services.email_service import send_password_reset_email
        token = create_email_token({"sub": str(user.user_id), "purpose": "reset"}, expires_hours=1)
        await send_password_reset_email(user.email, token)
    
    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(token: str = Body(...), new_password: str = Body(...), db: AsyncSession = Depends(get_db)):
    payload = verify_token(token)
    if not payload or payload.get("purpose") != "reset":
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.user_id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password_hash = hash_password(new_password)
    await db.commit()
    return {"message": "Password updated"}


@router.get("/me")
async def get_me(request: Request, db: AsyncSession = Depends(get_db)):
    """Returns current user info from cookie. Used to check auth status."""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = int(payload["sub"])
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return {"email": user.email, "email_verified": user.email_verified}


@router.post("/google")
async def google_login(response: Response, credential: str = Body(..., embed=True), db: AsyncSession = Depends(get_db)):
    """Authenticate with Google ID token. Creates user if first time."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google login not configured")

    # Verify the token via Google's tokeninfo endpoint (no google-auth dependency)
    async with httpx_client.AsyncClient() as client:
        resp = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    idinfo = resp.json()
    if idinfo.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Invalid token audience")

    google_id = idinfo["sub"]
    email = idinfo.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    # Look up user by google_id first, then by email
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if not user:
        # Check if email already exists (email/password user linking Google)
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            # Link Google to existing account
            user.google_id = google_id
            user.auth_provider = 'both' if user.password_hash else 'google'
            user.email_verified = True
        else:
            # Create new user
            user = User(
                email=email,
                password_hash=None,
                google_id=google_id,
                email_verified=True,
                auth_provider='google',
            )
            db.add(user)
        await db.commit()
        await db.refresh(user)

    access = create_access_token({"sub": str(user.user_id)})
    refresh = create_refresh_token({"sub": str(user.user_id)}, remember_me=True)
    csrf = generate_csrf_token()

    _set_auth_cookies(response, access, refresh, csrf, remember_me=True)

    return {"message": "ok", "email": user.email, "email_verified": user.email_verified}