from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_id
from app.core.dependencies import get_db

from app.services.account_service import get_accounts_with_balance, get_selected_account_with_balance
from app.services.assets_service import get_all_assets, get_asset_allocation, get_global_asset_allocation
from app.services.performance_service import get_performance_metrics

from app.schemas.allocation import AssetAllocation, AccountWithBalance, AssetTableRow
from app.schemas.performance import PerformanceResponse

router = APIRouter()

# 1 Saca una lista de mis cuentas y su balance (total, invertido, cash)
@router.get("/accounts", summary="Get accounts with balance for a user", response_model=list[AccountWithBalance])
async def accounts_with_balance(user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):    
    return await get_accounts_with_balance(db, user_id)


# 2 Saca el balance de una cuenta concreta (total, invertido, cash)
@router.get("/accounts/{account_id}", summary="Get the balance of one account for a user", response_model=list[AccountWithBalance])
async def accounts_with_balance(account_id: int, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await get_selected_account_with_balance(db, user_id, account_id)


# 5 Obtiene todos los assets de todas las cuentas del usuario con detalles completos
@router.get("/assets/all", summary="Get all assets from all accounts", response_model=list[AssetTableRow])
async def get_all_user_assets(user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db) ):
    return await get_all_assets(db, user_id)


# 3 Saca la asignacion de activos de una de mis cuentas agrupadas por tipo, temática o sin agrupar
@router.get("/assets/{group_by}/{account_id}", response_model=list[AssetAllocation])
async def get_detailed_assets(group_by: str, account_id: int, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    # GROUP_BY ::= asset | theme | type
    return await get_asset_allocation(db, account_id, user_id, group_by)


# 4 Saca la asignacion global de activos de todas mis cuentas agrupadas por tipo, temática o sin agrupar
@router.get("/assets/{group_by}", response_model=list[AssetAllocation])
async def get_assets_by_type(group_by: str, user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    # GROUP_BY ::= asset | theme | type
    return await get_global_asset_allocation(db, user_id, group_by)


@router.get("/performance", response_model=PerformanceResponse)
async def get_performance(user_id: int = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    try:
        # Nota: Aquí llamamos a una versión interna de tu query de crecimiento 
        # que devuelve el estado actual y los estados en fechas clave.
        metrics = await get_performance_metrics(db, user_id)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
