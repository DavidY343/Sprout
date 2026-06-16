from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_current_user_id, get_db
from app.services.history_chart_service import get_account_growth, get_portfolio_growth 
from app.schemas.history_chart import PortfolioGrowthResponse
from app.core.cache import get_cached_value, set_cached_value

router = APIRouter()

@router.get("/growth", response_model=PortfolioGrowthResponse)
async def get_growth(user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    cache_key = "growth_all"
    cached = get_cached_value(user_id, cache_key)
    if cached is not None:
        return cached

    try:
        history = await get_portfolio_growth(db, user_id)
        result = {"history": history}
        set_cached_value(user_id, cache_key, result)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/growth/account/{account_id}", response_model=PortfolioGrowthResponse)
async def get_account_growth_endpoint(account_id: int, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    cache_key = f"growth_account_{account_id}"
    cached = get_cached_value(user_id, cache_key)
    if cached is not None:
        return cached

    try:
        # Verificación de propiedad de la cuenta
        acc_query = await db.execute(
            text("SELECT 1 FROM accounts WHERE account_id = :aid AND user_id = :uid"),
            {"aid": account_id, "uid": user_id}
        )
        if not acc_query.scalar():
            raise HTTPException(status_code=404, detail="Cuenta no encontrada o no autorizada")

        history = await get_account_growth(db, account_id)
        result = {"history": history}
        set_cached_value(user_id, cache_key, result)
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))