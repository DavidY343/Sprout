from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Asset, Operation, Account
from app.schemas.asset import AssetCreate

async def create_asset(db: AsyncSession, asset_data: AssetCreate) -> Asset:
    # Verificar si ya existe
    stmt = select(Asset).where(
        (Asset.name == asset_data.name) | 
        (Asset.ticker == asset_data.ticker if asset_data.ticker else False) |
        (Asset.isin == asset_data.isin if asset_data.isin else False)
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if existing:
        return existing

    db_asset = Asset(**asset_data.model_dump())
    db.add(db_asset)
    await db.commit()
    await db.refresh(db_asset)
    return db_asset

async def get_user_assets(db: AsyncSession, user_id: int):
    # Buscamos activos que tengan operaciones en cuentas del usuario
    stmt = (
        select(Asset)
        .join(Operation, Asset.asset_id == Operation.asset_id)
        .join(Account, Operation.account_id == Account.account_id)
        .where(Account.user_id == user_id)
        .distinct()
    )
    
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_asset_allocation(db, account_id: int, user_id: int, group_by: str):
    """
    Devuelve la asignación de activos agrupada por:
    - asset (detalle)
    - theme
    - type

    Incluye porcentaje sobre el total.
    """
    if group_by != 'asset' and group_by != 'theme' and group_by != 'type':
        group_by = 'asset'
    query = text("""
        WITH positions AS (
            SELECT
                o.asset_id,
                SUM(
                    CASE
                        WHEN o.operation_type = 'buy' THEN o.quantity
                        ELSE -o.quantity
                    END
                ) AS net_quantity
            FROM operations o
            JOIN accounts ac ON ac.account_id = o.account_id
            WHERE o.account_id = :account_id
                AND ac.user_id = :user_id
            GROUP BY o.asset_id
            HAVING SUM(
                CASE
                    WHEN o.operation_type = 'buy' THEN o.quantity
                    ELSE -o.quantity
                END
            ) > 0
        ),
        latest_prices AS (
            SELECT DISTINCT ON (asset_id)
                asset_id,
                price
            FROM price_history
            ORDER BY asset_id, date DESC
        ),
        valued_positions AS (
            SELECT
                a.asset_id,
                a.name,
                COALESCE(a.theme, 'Unclassified') AS theme,
                a.type,
                p.net_quantity * lp.price AS value
            FROM positions p
            JOIN assets a ON a.asset_id = p.asset_id
            JOIN latest_prices lp ON lp.asset_id = p.asset_id
        )
        SELECT
            CASE
                WHEN :group_by = 'theme' THEN theme
                WHEN :group_by = 'type'  THEN type
                ELSE name
            END AS group_key,

            SUM(value) AS total_value,

            SUM(value)
            / SUM(SUM(value)) OVER ()
            AS allocation_pct,
            COUNT(DISTINCT asset_id) AS asset_count
        FROM valued_positions
        GROUP BY group_key
        ORDER BY total_value DESC;
    """)
    result = await db.execute(query, {"account_id": account_id, "user_id": user_id, "group_by": group_by})
    return result.mappings().all()

async def get_global_asset_allocation(db, user_id: int, group_by: str):
    """
    Devuelve la asignación de activos glboal agrupada por:
    - asset (detalle)
    - theme
    - type

    Incluye porcentaje sobre el total.
    """
    if group_by != 'asset' and group_by != 'theme' and group_by != 'type':
        group_by = 'asset'
    query = text("""
        WITH positions AS (
            SELECT
                o.asset_id,
                SUM(
                    CASE
                        WHEN o.operation_type = 'buy' THEN o.quantity
                        ELSE -o.quantity
                    END
                ) AS net_quantity
            FROM operations o
            JOIN accounts ac ON ac.account_id = o.account_id
            WHERE ac.user_id = :user_id
            GROUP BY o.asset_id
            HAVING SUM(
                CASE
                    WHEN o.operation_type = 'buy' THEN o.quantity
                    ELSE -o.quantity
                END
            ) > 0
        ),
        latest_prices AS (
            SELECT DISTINCT ON (asset_id)
                asset_id,
                price
            FROM price_history
            ORDER BY asset_id, date DESC
        ),
        valued_positions AS (
            SELECT
                a.asset_id,
                a.name,
                COALESCE(a.theme, 'Unclassified') AS theme,
                a.type,
                p.net_quantity * lp.price AS value
            FROM positions p
            JOIN assets a ON a.asset_id = p.asset_id
            JOIN latest_prices lp ON lp.asset_id = p.asset_id
        )
        SELECT
            CASE
                WHEN :group_by = 'theme' THEN theme
                WHEN :group_by = 'type'  THEN type
                ELSE name
            END AS group_key,

            SUM(value) AS total_value,

            SUM(value)
            / SUM(SUM(value)) OVER ()
            AS allocation_pct,
            COUNT(DISTINCT asset_id) AS asset_count
        FROM valued_positions
        GROUP BY group_key
        ORDER BY total_value DESC;
    """)

    if group_by not in {"asset", "theme", "type"}:
        raise ValueError("group_by must be: asset, theme or type")

    result = await db.execute(
        query,
        {"user_id": user_id, "group_by": group_by}
    )
    return result.mappings().all()

async def get_all_assets(db, user_id: int):
    """
    Devuelve todos los activos del usuario con detalles completos
    """
    query = text("""
        WITH positions AS (
            SELECT
                o.account_id,
                o.asset_id,
                SUM(
                    CASE
                        WHEN o.operation_type = 'buy' THEN o.quantity
                        ELSE -o.quantity
                    END
                ) AS net_quantity
            FROM operations o
            JOIN accounts ac ON ac.account_id = o.account_id
            WHERE ac.user_id = :user_id
            GROUP BY o.account_id, o.asset_id
            HAVING SUM(
                CASE
                    WHEN o.operation_type = 'buy' THEN o.quantity
                    ELSE -o.quantity
                END
            ) > 0
        ),
        latest_prices AS (
            SELECT DISTINCT ON (asset_id)
                asset_id,
                price
            FROM price_history
            ORDER BY asset_id, date DESC
        ),
        asset_performance AS (
            SELECT
                o.account_id,
                o.asset_id,
                SUM(
                    CASE
                        WHEN o.operation_type = 'buy' THEN o.quantity * o.price
                        ELSE -o.quantity * o.price
                    END
                ) AS invested_value
            FROM operations o
            JOIN accounts ac ON ac.account_id = o.account_id
            WHERE ac.user_id = :user_id
            GROUP BY o.account_id, o.asset_id  -- ¡Importante: agrupa por account y asset!
        ),
        valued_positions AS (
            SELECT
                p.account_id,
                ac.name AS account_name,
                a.asset_id,
                a.name AS asset_name,
                a.ticker,
                a.isin,
                a.type,
                COALESCE(a.theme, 'Unclassified') AS theme,
                p.net_quantity,
                lp.price AS current_price,
                p.net_quantity * lp.price AS total_value,
                COALESCE(ap.invested_value, 0) AS invested_value,  -- Usa COALESCE para evitar NULL
                CASE 
                    WHEN COALESCE(ap.invested_value, 0) > 0 
                    THEN ((p.net_quantity * lp.price - ap.invested_value) / ap.invested_value * 100)
                    ELSE 0 
                END AS performance_pct
            FROM positions p
            JOIN accounts ac ON ac.account_id = p.account_id
            JOIN assets a ON a.asset_id = p.asset_id
            JOIN latest_prices lp ON lp.asset_id = p.asset_id
            LEFT JOIN asset_performance ap ON ap.account_id = p.account_id AND ap.asset_id = p.asset_id
            WHERE ac.user_id = :user_id
        )
        SELECT
            account_id,
            account_name,
            asset_id,
            asset_name AS name,
            ticker,
            isin,
            type,
            theme,
            net_quantity AS quantity,
            current_price,
            total_value,
            invested_value,
            ROUND(performance_pct, 2) AS performance
        FROM valued_positions
        ORDER BY account_name, total_value DESC;
    """)
    
    result = await db.execute(query, {"user_id": user_id})
    data = result.mappings().all()
    
    return data