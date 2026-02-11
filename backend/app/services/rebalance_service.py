from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert
from app.models import Asset, Operation, Account, RebalanceSetting
from app.schemas.rebalance import RebalanceUpdate
from typing import List

async def get_rebalance_status(db: AsyncSession, user_id: int):
    # Query para traer Assets que tienen operaciones del usuario
    # Cruzamos con rebalance_settings para traer el % objetivo
    stmt = (
        select(
            Asset.asset_id,
            Asset.name.label("asset_name"),
            Asset.ticker,
            func.coalesce(RebalanceSetting.rebalance_id, 0).label("rebalance_id"),
            func.coalesce(RebalanceSetting.target_percentage, 0).label("target_percentage")
        )
        .join(Operation, Operation.asset_id == Asset.asset_id)
        .join(Account, Account.account_id == Operation.account_id)
        .outerjoin(
            RebalanceSetting, 
            (RebalanceSetting.asset_id == Asset.asset_id) & (RebalanceSetting.user_id == user_id)
        )
        .where(Account.user_id == user_id)
        .distinct()
    )
    
    result = await db.execute(stmt)
    return result.mappings().all()

async def update_rebalance_settings(db: AsyncSession, user_id: int, settings: List[RebalanceUpdate]):
    for item in settings:
        stmt = insert(RebalanceSetting).values(
            user_id=user_id,
            asset_id=item.asset_id,
            target_percentage=item.target_percentage,
            updated_at=func.now()
        )
        
        # Upsert: Si ya existe el % para ese user/asset, lo actualiza
        stmt = stmt.on_conflict_do_update(
            constraint='uq_user_rebalance_asset',
            set_={"target_percentage": item.target_percentage, "updated_at": func.now()}
        )
        
        await db.execute(stmt)
    
    await db.commit()