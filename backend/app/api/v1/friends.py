from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_id, get_db, verify_csrf
from app.services.friend_service import (
    send_friend_request, accept_friend_request,
    reject_or_remove_friend, get_friends_list, is_friend,
)
from app.services.account_service import get_accounts_with_balance
from app.services.assets_service import get_all_assets, get_global_asset_allocation
from app.services.performance_service import get_performance_metrics
from app.schemas.friendship import FriendRequest, FriendshipOut

router = APIRouter()


@router.get("", response_model=list[FriendshipOut])
async def list_friends(user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await get_friends_list(db, user_id)


@router.post("", response_model=FriendshipOut, dependencies=[Depends(verify_csrf)])
async def request_friend(body: FriendRequest, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    try:
        return await send_friend_request(db, user_id, body.email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{friendship_id}/accept", response_model=FriendshipOut, dependencies=[Depends(verify_csrf)])
async def accept_request(friendship_id: int, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    try:
        return await accept_friend_request(db, friendship_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{friendship_id}", dependencies=[Depends(verify_csrf)])
async def remove_friend(friendship_id: int, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    try:
        await reject_or_remove_friend(db, friendship_id, user_id)
        return {"message": "ok"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- Friend's dashboard (read-only) ---

@router.get("/{friend_id}/portfolio/accounts")
async def friend_accounts(friend_id: int, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    if not await is_friend(db, user_id, friend_id):
        raise HTTPException(status_code=403, detail="No sois amigos")
    return await get_accounts_with_balance(db, friend_id)


@router.get("/{friend_id}/portfolio/assets/all")
async def friend_all_assets(friend_id: int, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    if not await is_friend(db, user_id, friend_id):
        raise HTTPException(status_code=403, detail="No sois amigos")
    return await get_all_assets(db, friend_id)


@router.get("/{friend_id}/portfolio/assets/{group_by}")
async def friend_assets_grouped(friend_id: int, group_by: str, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    if not await is_friend(db, user_id, friend_id):
        raise HTTPException(status_code=403, detail="No sois amigos")
    return await get_global_asset_allocation(db, friend_id, group_by)


@router.get("/{friend_id}/portfolio/performance")
async def friend_performance(friend_id: int, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    if not await is_friend(db, user_id, friend_id):
        raise HTTPException(status_code=403, detail="No sois amigos")
    return await get_performance_metrics(db, friend_id)
