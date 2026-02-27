from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_current_user_id, get_db
from app.services.history_chart_service import get_account_growth, get_portfolio_growth 
from app.schemas.history_chart import PortfolioGrowthResponse

router = APIRouter()

@router.get("/growth", response_model=PortfolioGrowthResponse)
async def get_growth(user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    try:
        history = await get_portfolio_growth(db, user_id)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/growth/account/{account_id}", response_model=PortfolioGrowthResponse)
async def get_account_growth_endpoint(account_id: int, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    try:
        # Verificación de propiedad de la cuenta
        acc_query = await db.execute(
            text("SELECT 1 FROM accounts WHERE account_id = :aid AND user_id = :uid"),
            {"aid": account_id, "uid": user_id}
        )
        if not acc_query.scalar():
            raise HTTPException(status_code=404, detail="Cuenta no encontrada o no autorizada")

        history = await get_account_growth(db, account_id)
        return {"history": history}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))