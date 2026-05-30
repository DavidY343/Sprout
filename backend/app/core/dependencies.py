from fastapi import Depends, HTTPException, Request
from jose import jwt, JWTError
from app.core.database import AsyncSessionLocal
from app.core.config import SECRET_KEY, ALGORITHM

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user_id(request: Request) -> int:
    """Extract user_id from access_token HttpOnly cookie."""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(user_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_csrf(request: Request):
    """Verify CSRF token for state-changing requests.
    The csrf_token cookie value must match the X-CSRF-Token header."""
    csrf_cookie = request.cookies.get("csrf_token")
    csrf_header = request.headers.get("X-CSRF-Token")
    if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
        raise HTTPException(status_code=403, detail="CSRF validation failed")
