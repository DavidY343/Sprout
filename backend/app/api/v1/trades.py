from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_id, get_db
from app.services.trade_service import get_trade_history
from app.schemas.trade import TradeHistoryResponse

router = APIRouter()

@router.get("/history", 
           summary="Get complete trade history for a user",
           response_model=list[TradeHistoryResponse])
async def get_user_trade_history(
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
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