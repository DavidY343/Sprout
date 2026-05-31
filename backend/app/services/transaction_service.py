from app.models.transaction import Transaction
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.account import Account
from app.schemas.transaction import TransactionCreate
from fastapi import HTTPException

async def create_transaction_from_operation(db: AsyncSession, operation, asset_name: str):
    # Lógica de efectivo: 
    # BUY -> Gasto (precio * cant + fees)
    # SELL -> Ingreso (precio * cant - fees)
    is_buy = operation.operation_type == 'buy'
    
    net_amount = operation.quantity * operation.price
    total_amount = (net_amount + operation.fees) if is_buy else (net_amount - operation.fees)
    
    new_transaction = Transaction(
        account_id=operation.account_id,
        operation_id=operation.operation_id,
        category="Inversión",
        date=operation.date,
        amount=total_amount,
        type="expense" if is_buy else "income",
        description=f"{operation.operation_type.upper()} {operation.quantity} {asset_name}"
    )
    
    db.add(new_transaction)
    return new_transaction


async def create_transaction(db: AsyncSession, transaction_data: TransactionCreate, user_id: int):
    # 1. Verificar que la cuenta existe y pertenece al usuario
    stmt = select(Account).where(
        Account.account_id == transaction_data.account_id,
        Account.user_id == user_id
    )
    result = await db.execute(stmt)
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada o no pertenece al usuario")

    # 2. Crear la transacción
    new_transaction = Transaction(
        account_id=transaction_data.account_id,
        category=transaction_data.category,
        date=transaction_data.date,
        amount=transaction_data.amount,
        type=transaction_data.type,
        description=transaction_data.description
    )
    new_transaction.account = account
    
    db.add(new_transaction)
    await db.commit()
    await db.refresh(new_transaction)
    new_transaction.account = account
    return new_transaction

async def get_user_transactions(db: AsyncSession, user_id: int):
    # Join con accounts para asegurar que solo vemos lo del usuario
    stmt = (
        select(Transaction)
        .join(Account)
        .options(selectinload(Transaction.account))
        .where(Account.user_id == user_id)
        .order_by(Transaction.date.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()