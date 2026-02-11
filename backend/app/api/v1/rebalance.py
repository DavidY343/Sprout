from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.schemas.rebalance import RebalanceSettingRead, RebalanceBulkUpdate
from app.services.rebalance_service import get_rebalance_status, update_rebalance_settings
from app.core.dependencies import get_current_user_id, get_db

router = APIRouter()

@router.get("/", response_model=List[RebalanceSettingRead])
async def get_rebalance_table(
    user_id: int = Depends(get_current_user_id), 
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene la lista de activos del usuario cruzada con sus 
    objetivos de rebalanceo (poblado automático).
    """
    try:
        # Esta función hará el JOIN entre assets, operations y rebalance_settings
        return await get_rebalance_status(db, user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener datos: {str(e)}")

@router.post("/save")
async def save_rebalance(
    payload: RebalanceBulkUpdate,
    user_id: int = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Guarda o actualiza los porcentajes objetivos del usuario."""
    try:
        await update_rebalance_settings(db, user_id, payload.settings)
        return {"message": "Configuración guardada exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))