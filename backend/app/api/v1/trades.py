from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_id, get_db
from app.services.trade_service import get_trade_history, create_operation
from app.schemas.trade import TradeHistoryResponse
from app.schemas.operation import OperationCreate, OperationResponse
from typing import Optional

router = APIRouter()

@router.get("/history", summary="Get complete trade history for a user", response_model=list[TradeHistoryResponse])
async def get_user_trade_history(user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    """
    Retrieve all trade operations (buys/sells) for the authenticated user.
    
    Returns:
    - Ticker, ISIN, asset name and currency
    - Operation date, quantity, price and type (buy/sell)
    - Fees and account name
    - Ordered by date (newest first)
    """
    trades = await get_trade_history(db, user_id)
    return trades

@router.post("/create", response_model=OperationResponse, status_code=201, summary="Create a new trade operation")
async def create_new_operation(operation_data: OperationCreate, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    """
    Create a new trade operation (buy/sell).
    
    Requirements:
    - Asset must exist
    - Account must exist and belong to the user
    - Optional: update price history with this trade price
    """
    try:
        operation = await create_operation(
            db, 
            operation_data, 
            user_id
        )
        return operation
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")