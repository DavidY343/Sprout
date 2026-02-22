from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_current_user_id, get_db
from app.services.history_chart_service import get_portfolio_growth 
from app.schemas.history_chart import PortfolioGrowthResponse

router = APIRouter()

@router.get("/growth", response_model=PortfolioGrowthResponse)
async def get_growth(user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    try:
        history = await get_portfolio_growth(db, user_id)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))