from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.dependencies import get_current_user_id, get_db
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.services import transaction_service

router = APIRouter()

@router.post("/create", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_new_transaction(
    transaction_in: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    res = await transaction_service.create_transaction(db, transaction_in, current_user_id)
    from app.core.cache import clear_user_cache
    clear_user_cache(current_user_id)
    return res

@router.get("/me", response_model=List[TransactionResponse])
async def list_transactions(
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    return await transaction_service.get_user_transactions(db, current_user_id)