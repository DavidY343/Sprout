from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.schemas.history_chart import PortfolioPoint
from typing import List

async def get_portfolio_growth(db: AsyncSession, user_id: int):
    query = text("""
    WITH RECURSIVE daily_series AS (
        SELECT MIN(date)::date AS day, NOW()::date AS last_day
        FROM transactions t
        JOIN accounts a ON t.account_id = a.account_id
        WHERE a.user_id = :user_id
        UNION ALL
        SELECT (day + interval '1 day')::date, last_day
        FROM daily_series
        WHERE day < last_day
    ),
    raw_balances AS (
        SELECT 
            o.asset_id,
            o.date::date as op_date,
            SUM(SUM(CASE WHEN o.operation_type = 'buy' THEN o.quantity ELSE -o.quantity END)) 
                OVER (PARTITION BY o.asset_id ORDER BY o.date::date) as qty
        FROM operations o
        JOIN accounts a ON o.account_id = a.account_id
        WHERE a.user_id = :user_id
        GROUP BY o.asset_id, o.date::date
    ),
    price_steps AS (
        SELECT 
            d.day,
            ast.asset_id,
            ph.price,
            COUNT(ph.price) OVER (PARTITION BY ast.asset_id ORDER BY d.day) as price_grp
        FROM daily_series d
        CROSS JOIN (
            SELECT DISTINCT asset_id FROM operations o 
            JOIN accounts a ON o.account_id = a.account_id 
            WHERE a.user_id = :user_id
        ) ast
        LEFT JOIN price_history ph ON ph.asset_id = ast.asset_id AND ph.date::date = d.day
    ),
    filled_prices AS (
        SELECT 
            day, asset_id,
            FIRST_VALUE(price) OVER (PARTITION BY asset_id, price_grp ORDER BY day) as price_ffill
        FROM price_steps
    ),
    daily_portfolio_value AS (
        SELECT 
            d.day,
            SUM(COALESCE(rb.qty, 0) * COALESCE(fp.price_ffill, 0)) as total_assets_value
        FROM daily_series d
        LEFT JOIN LATERAL (
            SELECT DISTINCT ON (asset_id) qty, asset_id 
            FROM raw_balances 
            WHERE op_date <= d.day 
            ORDER BY asset_id, op_date DESC
        ) rb ON TRUE
        LEFT JOIN filled_prices fp ON fp.day = d.day AND fp.asset_id = rb.asset_id
        GROUP BY d.day
    ),
    cash_evolution AS (
    SELECT 
        d.day,
        -- CAPITAL INVERTIDO corregido:
        -- No suma 'income' si es 'Inversión' (ventas)
        -- No resta 'expense' si es 'Inversión' (compras)
        SUM(SUM(CASE 
            WHEN t.type = 'income' AND t.category != 'Inversión' THEN t.amount 
            WHEN t.type = 'expense' AND t.category != 'Inversión' THEN -t.amount 
            ELSE 0 END)) OVER (ORDER BY d.day) as capital_invertido,
            
        -- EFECTIVO TOTAL: Sigue igual (todo afecta a la caja)
        SUM(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END)) 
            OVER (ORDER BY d.day) as efectivo_total
    FROM daily_series d
    CROSS JOIN (SELECT account_id FROM accounts WHERE user_id = :user_id) a
    LEFT JOIN transactions t ON d.day = t.date::date AND t.account_id = a.account_id
    GROUP BY d.day
    )
    SELECT 
        ce.day as date,
        COALESCE(ce.capital_invertido, 0) as capital_invertido,
        (COALESCE(dpv.total_assets_value, 0) + COALESCE(ce.efectivo_total, 0)) as total_value
    FROM cash_evolution ce
    LEFT JOIN daily_portfolio_value dpv ON ce.day = dpv.day
    ORDER BY ce.day;
    """)

    result = await db.execute(query, {"user_id": user_id})
    return [
        {
            "date": row.date,
            "capital_invertido": float(row.capital_invertido),
            "total_value": float(row.total_value)
        }
        for row in result.all()
    ]


async def get_account_growth(db: AsyncSession, account_id: int):
    query = text("""
    WITH RECURSIVE daily_series AS (
        SELECT MIN(date)::date AS day, NOW()::date AS last_day
        FROM transactions
        WHERE account_id = :account_id
        UNION ALL
        SELECT (day + interval '1 day')::date, last_day
        FROM daily_series
        WHERE day < last_day
    ),
    raw_balances AS (
        SELECT 
            asset_id,
            date::date as op_date,
            SUM(SUM(CASE WHEN operation_type = 'buy' THEN quantity ELSE -quantity END)) 
                OVER (PARTITION BY asset_id ORDER BY date::date) as qty
        FROM operations
        WHERE account_id = :account_id
        GROUP BY asset_id, date::date
    ),
    price_steps AS (
        SELECT 
            d.day,
            ast.asset_id,
            ph.price,
            COUNT(ph.price) OVER (PARTITION BY ast.asset_id ORDER BY d.day) as price_grp
        FROM daily_series d
        CROSS JOIN (
            SELECT DISTINCT asset_id FROM operations 
            WHERE account_id = :account_id
        ) ast
        LEFT JOIN price_history ph ON ph.asset_id = ast.asset_id AND ph.date::date = d.day
    ),
    filled_prices AS (
        SELECT 
            day, asset_id,
            FIRST_VALUE(price) OVER (PARTITION BY asset_id, price_grp ORDER BY day) as price_ffill
        FROM price_steps
    ),
    daily_portfolio_value AS (
        SELECT 
            d.day,
            SUM(COALESCE(rb.qty, 0) * COALESCE(fp.price_ffill, 0)) as total_assets_value
        FROM daily_series d
        LEFT JOIN LATERAL (
            SELECT DISTINCT ON (asset_id) qty, asset_id 
            FROM raw_balances 
            WHERE op_date <= d.day 
            ORDER BY asset_id, op_date DESC
        ) rb ON TRUE
        LEFT JOIN filled_prices fp ON fp.day = d.day AND fp.asset_id = rb.asset_id
        GROUP BY d.day
    ),
    cash_evolution AS (
        SELECT 
            d.day,
            SUM(SUM(CASE 
                WHEN t.type = 'income' AND t.category != 'Inversión' THEN t.amount 
                WHEN t.type = 'expense' AND t.category != 'Inversión' THEN -t.amount 
                ELSE 0 END)) OVER (ORDER BY d.day) as capital_invertido,
            SUM(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END)) 
                OVER (ORDER BY d.day) as efectivo_total
        FROM daily_series d
        LEFT JOIN transactions t ON d.day = t.date::date AND t.account_id = :account_id
        GROUP BY d.day
    )
    SELECT 
        ce.day as date,
        COALESCE(ce.capital_invertido, 0) as capital_invertido,
        (COALESCE(dpv.total_assets_value, 0) + COALESCE(ce.efectivo_total, 0)) as total_value
    FROM cash_evolution ce
    LEFT JOIN daily_portfolio_value dpv ON ce.day = dpv.day
    ORDER BY ce.day;
    """)

    result = await db.execute(query, {"account_id": account_id})
    return [
        {
            "date": row.date,
            "capital_invertido": float(row.capital_invertido),
            "total_value": float(row.total_value)
        }
        for row in result.all()
    ]