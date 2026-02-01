from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Operation, Asset, Account, PriceHistory
from app.schemas.operation import OperationCreate
from datetime import datetime
from sqlalchemy.dialects.postgresql import insert
async def get_trade_history(db: AsyncSession, user_id: int):
    """
    Obtiene el historial completo de operaciones de un usuario
    Incluye: ticker, isin, nombre, currency, fecha, cantidad, precio, tipo, comisiones, cuenta
    """
    
    stmt = (
        select(
            Asset.ticker,
            Asset.isin,
            Asset.name.label("asset_name"),
            Asset.currency,
            Operation.date,
            Operation.quantity,
            Operation.price,
            Operation.operation_type,
            Operation.fees,
            Account.name.label("account_name")
        )
        .select_from(Operation)
        .join(Asset, Operation.asset_id == Asset.asset_id)
        .join(Account, Operation.account_id == Account.account_id)
        .where(Account.user_id == user_id)
        .order_by(Operation.date.desc(), Operation.operation_id.desc())
        .limit(100)
    )
    
    result = await db.execute(stmt)
    trades = result.all()
    
    return trades

async def create_operation(db: AsyncSession, operation_data: OperationCreate, user_id: int) -> Operation:
    # Verificar que la cuenta pertenece al usuario
    stmt = select(Account).where(
        (Account.account_id == operation_data.account_id) & 
        (Account.user_id == user_id)
    )
    result = await db.execute(stmt)
    account = result.scalar_one_or_none()
    
    if not account:
        raise ValueError("Account not found or doesn't belong to user")
    
    # Verificar que el asset existe
    stmt = select(Asset).where(Asset.asset_id == operation_data.asset_id)
    result = await db.execute(stmt)
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise ValueError("Asset not found")
    
    # Crear operación
    db_operation = Operation(**operation_data.model_dump())
    db.add(db_operation)
    
    # Preparar el Upsert
    stmt_upsert = insert(PriceHistory).values(
        asset_id=operation_data.asset_id,
        date=operation_data.date,
        price=operation_data.price
    )

    # Si hay conflicto en (asset_id, date), actualiza el precio
    stmt_upsert = stmt_upsert.on_conflict_do_update(
        index_elements=['asset_id', 'date'],
        set_=dict(price=operation_data.price)
    )

    await db.execute(stmt_upsert)
    await db.commit()
    
    await db.refresh(db_operation)
    return db_operation