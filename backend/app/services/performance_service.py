from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

async def get_performance_metrics(db: AsyncSession, user_id: int):
    query = text("""
    WITH RECURSIVE daily_series AS (
        SELECT MIN(date)::date AS day, NOW()::date AS last_day
        FROM transactions t
        JOIN accounts a ON t.account_id = a.account_id
        WHERE a.user_id = :user_id AND t.is_active = TRUE
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
        LEFT JOIN transactions t ON d.day = t.date::date AND t.account_id = a.account_id AND t.is_active = TRUE
        GROUP BY d.day
    ),
    portfolio_history AS (
        SELECT 
            ce.day,
            ce.capital_invertido,
            (COALESCE(dpv.total_assets_value, 0) + COALESCE(ce.efectivo_total, 0)) as total_value
        FROM cash_evolution ce
        LEFT JOIN daily_portfolio_value dpv ON ce.day = dpv.day
    )
    SELECT 
        (SELECT total_value FROM portfolio_history ORDER BY day DESC LIMIT 1) as current_val,
        (SELECT capital_invertido FROM portfolio_history ORDER BY day DESC LIMIT 1) as current_cap,

        COALESCE((SELECT total_value FROM portfolio_history WHERE day <= NOW() - interval '1 month' ORDER BY day DESC LIMIT 1), 0) as val_1m,
        COALESCE((SELECT capital_invertido FROM portfolio_history WHERE day <= NOW() - interval '1 month' ORDER BY day DESC LIMIT 1), 0) as cap_1m,

        COALESCE((SELECT total_value FROM portfolio_history WHERE day <= NOW() - interval '3 month' ORDER BY day DESC LIMIT 1), 0) as val_3m,
        COALESCE((SELECT capital_invertido FROM portfolio_history WHERE day <= NOW() - interval '3 month' ORDER BY day DESC LIMIT 1), 0) as cap_3m,

        COALESCE((SELECT total_value FROM portfolio_history WHERE day <= DATE_TRUNC('year', NOW()) ORDER BY day DESC LIMIT 1), 0) as val_ytd,
        COALESCE((SELECT capital_invertido FROM portfolio_history WHERE day <= DATE_TRUNC('year', NOW()) ORDER BY day DESC LIMIT 1), 0) as cap_ytd
    FROM portfolio_history
    LIMIT 1;
    """)

    result = await db.execute(query, {"user_id": user_id})
    row = result.fetchone()

    if not row or row.current_val is None or row.current_cap is None:
        return {
            "month": {"pct": 0.0, "abs": 0.0},
            "three_months": {"pct": 0.0, "abs": 0.0},
            "ytd": {"pct": 0.0, "abs": 0.0},
            "total": {"pct": 0.0, "abs": 0.0}
        }

    def calc_period(current_val, current_cap, past_val, past_cap):
        """Calculate period return adjusted for cash flows (deposits/withdrawals)."""
        deposits_in_period = float(current_cap) - float(past_cap)
        gain = float(current_val) - float(past_val) - deposits_in_period

        # Denominator: total capital committed = start value + new deposits
        denom = float(past_val) + deposits_in_period
        if denom <= 0:
            denom = float(current_cap)
        if denom <= 0:
            return {"pct": 0.0, "abs": 0.0}
        return {"pct": round((gain / denom) * 100, 2), "abs": round(gain, 2)}

    cv = row.current_val
    cc = row.current_cap

    return {
        "month": calc_period(cv, cc, row.val_1m, row.cap_1m),
        "three_months": calc_period(cv, cc, row.val_3m, row.cap_3m),
        "ytd": calc_period(cv, cc, row.val_ytd, row.cap_ytd),
        "total": calc_period(cv, cc, 0, 0),
    }