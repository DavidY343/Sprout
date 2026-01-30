from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Operation, Asset, Account

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