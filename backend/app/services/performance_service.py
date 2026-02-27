from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

async def get_performance_metrics(db: AsyncSession, user_id: int):
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
            d.day, ast.asset_id, ph.price,
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
            SUM(SUM(CASE 
                WHEN t.type = 'income' AND t.category != 'Inversión' THEN t.amount 
                WHEN t.type = 'expense' AND t.category != 'Inversión' THEN -t.amount 
                ELSE 0 END)) OVER (ORDER BY d.day) as capital_invertido,
            SUM(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END)) 
                OVER (ORDER BY d.day) as efectivo_total
        FROM daily_series d
        CROSS JOIN (SELECT account_id FROM accounts WHERE user_id = :user_id) a
        LEFT JOIN transactions t ON d.day = t.date::date AND t.account_id = a.account_id
        GROUP BY d.day
    ),
    portfolio_history AS (
        SELECT 
            ce.day,
            ce.capital_invertido,
            (COALESCE(dpv.total_assets_value, 0) + COALESCE(ce.efectivo_total, 0)) as total_value
        FROM cash_evolution ce
        LEFT JOIN daily_portfolio_value dpv ON ce.day = dpv.day
    ),
    first_record AS (
        -- Buscamos el primer día que hubo actividad real
        SELECT total_value as val_start 
        FROM portfolio_history 
        ORDER BY day ASC LIMIT 1
    )
    SELECT 
        (SELECT total_value FROM portfolio_history ORDER BY day DESC LIMIT 1) as current_val,
        (SELECT capital_invertido FROM portfolio_history ORDER BY day DESC LIMIT 1) as current_cap,
        -- Si no hay datos hace X tiempo, COALESCE usa el valor del primer día registrado
        COALESCE(
            (SELECT total_value FROM portfolio_history WHERE day <= NOW() - interval '1 month' ORDER BY day DESC LIMIT 1),
            (SELECT val_start FROM first_record)
        ) as val_1m,
        COALESCE(
            (SELECT total_value FROM portfolio_history WHERE day <= NOW() - interval '3 month' ORDER BY day DESC LIMIT 1),
            (SELECT val_start FROM first_record)
        ) as val_3m,
        COALESCE(
            (SELECT total_value FROM portfolio_history WHERE day <= DATE_TRUNC('year', NOW()) ORDER BY day DESC LIMIT 1),
            (SELECT val_start FROM first_record)
        ) as val_ytd
    FROM portfolio_history, first_record
    LIMIT 1;
    """)

    result = await db.execute(query, {"user_id": user_id})
    row = result.fetchone()

    def calc_metrics(current, past):
        if past is None or past == 0: 
            return {"pct": 0.0, "abs": 0.0}
        abs_val = float(current - past)
        pct = (abs_val / float(past)) * 100
        return {"pct": round(pct, 2), "abs": round(abs_val, 2)}

    return {
        "month": calc_metrics(row.current_val, row.val_1m),
        "three_months": calc_metrics(row.current_val, row.val_3m),
        "ytd": calc_metrics(row.current_val, row.val_ytd),
        "total": {
            "pct": round(((row.current_val - row.current_cap) / row.current_cap * 100), 2) if row.current_cap > 0 else 0.0,
            "abs": round(float(row.current_val - row.current_cap), 2)
        }
    }