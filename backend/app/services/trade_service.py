from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models import Operation, Asset, Account, PriceHistory
from app.models.transaction import Transaction
from app.schemas.operation import OperationCreate, OperationUpdate
from datetime import datetime
from sqlalchemy.dialects.postgresql import insert


async def get_trade_history(db: AsyncSession, user_id: int):
    """
    Obtiene el historial completo de operaciones de un usuario
    Incluye: ticker, isin, nombre, currency, fecha, cantidad, precio, tipo, comisiones, cuenta
    """
    
    stmt = (
        select(
            Operation.operation_id,
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
    ).on_conflict_do_update(
        index_elements=['asset_id', 'date'],
        set_=dict(price=operation_data.price)
    )

    await db.execute(stmt_upsert)

    # Ensure user has visibility on this asset
    await db.execute(
        text("INSERT INTO user_assets (user_id, asset_id) VALUES (:uid, :aid) ON CONFLICT DO NOTHING"),
        {"uid": user_id, "aid": operation_data.asset_id}
    )
    
    return db_operation, asset


async def update_operation(db: AsyncSession, operation_id: int, update_data: OperationUpdate, user_id: int) -> Operation:
    # Fetch the operation and verify ownership
    stmt = (
        select(Operation)
        .join(Account, Operation.account_id == Account.account_id)
        .where(Operation.operation_id == operation_id, Account.user_id == user_id)
    )
    result = await db.execute(stmt)
    operation = result.scalar_one_or_none()

    if not operation:
        raise ValueError("Operation not found or doesn't belong to user")

    # Save original values for transaction lookup
    original_amount = operation.quantity * operation.price
    original_fees = operation.fees or 0
    original_is_buy = operation.operation_type == 'buy'
    original_total = (original_amount + original_fees) if original_is_buy else (original_amount - original_fees)
    original_date = operation.date

    # Apply updates to the operation
    update_dict = update_data.model_dump(exclude_unset=True, exclude_none=True)
    for key, value in update_dict.items():
        setattr(operation, key, value)

    # Find and update the associated cash transaction
    # Match by account, category, date, and original amount
    stmt_tx = (
        select(Transaction)
        .where(
            Transaction.account_id == operation.account_id,
            Transaction.category == "Inversión",
            Transaction.date == original_date,
            Transaction.amount == original_total,
            Transaction.is_active == True
        )
        .order_by(Transaction.created_at.desc())
        .limit(1)
    )
    result_tx = await db.execute(stmt_tx)
    transaction = result_tx.scalar_one_or_none()

    if transaction:
        is_buy = operation.operation_type == 'buy'
        net_amount = operation.quantity * operation.price
        new_fees = operation.fees or 0
        total_amount = (net_amount + new_fees) if is_buy else (net_amount - new_fees)
        transaction.amount = total_amount
        transaction.type = "expense" if is_buy else "income"
        transaction.date = operation.date

    # Update price_history with the new price
    stmt_upsert = insert(PriceHistory).values(
        asset_id=operation.asset_id,
        date=operation.date,
        price=operation.price
    ).on_conflict_do_update(
        index_elements=['asset_id', 'date'],
        set_=dict(price=operation.price)
    )
    await db.execute(stmt_upsert)

    return operation