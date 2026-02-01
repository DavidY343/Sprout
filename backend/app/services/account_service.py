from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from sqlalchemy import select
from app.models import Account
from app.schemas.account import AccountCreate

async def create_account(db: AsyncSession, account_data: AccountCreate, user_id: int) -> Account:
    # Verificar si ya existe para este usuario
    stmt = select(Account).where(
        (Account.user_id == user_id) & 
        (Account.name == account_data.name)
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if existing:
        return existing
    
    # Crear nuevo
    db_account = Account(**account_data.model_dump(), user_id=user_id)
    db.add(db_account)
    await db.commit()
    await db.refresh(db_account)
    return db_account

async def get_user_accounts(db: AsyncSession, user_id: int):
    """
    Simplemente devuelve todos los objetos Account del usuario.
    """
    stmt = (
        select(Account)
        .where(Account.user_id == user_id)
        .where(Account.is_active == True)
        .order_by(Account.name)
    )
    
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_accounts_with_balance(db, user_id: int):
    """
    Devuelve una lista de cuentas con su saldo efectivo, valor de inversiones y patrimonio total.
    Se seleccionan las cuentas del usuario especificado y se ordenan por tipo de cuenta y patrimonio total de manera descendente.
    La consulta utiliza dos CTEs: transaccion y inversiones. 
    La primera suma el valor de todas las transacciones de ingresos y egresos de cada cuenta.
    La segunda suma el valor de todas las operaciones de inversiones de cada cuenta (teniendo en cuenta el ultimo precio histórico).
    """
    query = text("""
        -- Cash
        WITH transacciones AS (
            SELECT 
                account_id,
                SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS saldo
            FROM transactions
            WHERE is_active = TRUE
            GROUP BY account_id
        ),
        inversiones AS (
            SELECT 
                o.account_id,
                SUM(
                    CASE 
                        WHEN o.operation_type = 'buy' THEN o.quantity 
                        ELSE -o.quantity 
                    END * ph.price
                ) AS valor
            FROM operations o
            LEFT JOIN price_history ph ON ph.asset_id = o.asset_id
            WHERE ph.date = (
                SELECT MAX(date) 
                FROM price_history 
                WHERE asset_id = o.asset_id
            )
            GROUP BY o.account_id
        )
        SELECT 
            a.account_id,
            a.name,
            a.type,
            a.currency,
            COALESCE(t.saldo, 0) AS cash_balance,
            COALESCE(i.valor, 0) AS invested_value,
            COALESCE(t.saldo, 0) + COALESCE(i.valor, 0) AS total_value
        FROM accounts a
        LEFT JOIN transacciones t ON t.account_id = a.account_id
        LEFT JOIN inversiones i ON i.account_id = a.account_id
        WHERE a.user_id = :user_id
          AND a.is_active = TRUE
        ORDER BY a.type, total_value DESC
    """)
    
    result = await db.execute(query, {"user_id": user_id})
    return result.mappings().all()

async def get_selected_account_with_balance(db, user_id: int, account_id: int):
    """
    Devuelve una lista de cuentas con su saldo efectivo, valor de inversiones y patrimonio total.
    Se seleccionan las cuentas del usuario especificado y se ordenan por tipo de cuenta y patrimonio total de manera descendente.
    La consulta utiliza dos CTEs: transaccion y inversiones. 
    La primera suma el valor de todas las transacciones de ingresos y egresos de cada cuenta.
    La segunda suma el valor de todas las operaciones de inversiones de cada cuenta (teniendo en cuenta el ultimo precio histórico).
    """
    query = text("""
        -- Cash
        WITH transacciones AS (
            SELECT 
                account_id,
                SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS saldo
            FROM transactions
            WHERE is_active = TRUE
            GROUP BY account_id
        ),
        inversiones AS (
            SELECT 
                o.account_id,
                SUM(
                    CASE 
                        WHEN o.operation_type = 'buy' THEN o.quantity 
                        ELSE -o.quantity 
                    END * ph.price
                ) AS valor
            FROM operations o
            LEFT JOIN price_history ph ON ph.asset_id = o.asset_id
            WHERE ph.date = (
                SELECT MAX(date) 
                FROM price_history 
                WHERE asset_id = o.asset_id
            )
            GROUP BY o.account_id
        )
        SELECT 
            a.account_id,
            a.name,
            a.type,
            a.currency,
            COALESCE(t.saldo, 0) AS cash_balance,
            COALESCE(i.valor, 0) AS invested_value,
            COALESCE(t.saldo, 0) + COALESCE(i.valor, 0) AS total_value
        FROM accounts a
        LEFT JOIN transacciones t ON t.account_id = a.account_id
        LEFT JOIN inversiones i ON i.account_id = a.account_id
        WHERE a.user_id = :user_id
          AND a.is_active = TRUE
          AND a.account_id = :account_id
        ORDER BY a.type, total_value DESC
    """)
    
    result = await db.execute(query, {"user_id": user_id, "account_id": account_id})
    return result.mappings().all()