"""
Worker de actualización diaria de precios.

Diseñado para ejecutarse UNA VEZ al día (tras el cierre de mercados)
mediante un cron job externo (Supabase pg_cron, GitHub Actions, etc.).

Obtiene precios de cierre de Yahoo Finance y consolida el histórico.
"""

import yfinance as yf
import psycopg2
import os
import sys
from datetime import datetime
from dotenv import load_dotenv
import pytz
from urllib.parse import urlparse
load_dotenv()


def get_madrid_tz():
    return pytz.timezone('Europe/Madrid')


def connect_db():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        url = urlparse(database_url)
        return psycopg2.connect(
            dbname=url.path[1:],
            user=url.username,
            password=url.password,
            host=url.hostname,
            port=url.port or 5432,
            sslmode="require" if url.hostname not in ("db", "localhost") else "prefer"
        )
    else:
        return psycopg2.connect(
            dbname=os.getenv("POSTGRES_DB"),
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
            host=os.getenv("DB_HOST", "db"),
            port=int(os.getenv("DB_PORT", "5432"))
        )


def try_get_data(ticker):
    """Obtiene precio de cierre de Yahoo Finance usando el ticker tal cual.
    El ticker ya debe incluir el sufijo de bolsa si es necesario (ej: NXT.MC, VUSA.L)."""
    import math
    try:
        asset = yf.Ticker(ticker)
        data = asset.history(period="5d")

        if not data.empty:
            last_price = float(data['Close'].iloc[-1])
            if math.isnan(last_price) or math.isinf(last_price) or last_price <= 0:
                return None, None, None
            price_date = data.index[-1].to_pydatetime()
            return last_price, price_date, ticker
    except Exception:
        pass
    return None, None, None


def fetch_closing_prices():
    """
    Obtiene los precios de cierre de todos los activos activos.
    Pensado para ejecutarse después del cierre de mercados (US cierra 22:00 Madrid).
    """
    madrid_tz = get_madrid_tz()
    now = datetime.now(madrid_tz)
    print(f"=== Actualización de precios de cierre ===")
    print(f"Fecha/hora Madrid: {now.strftime('%Y-%m-%d %H:%M:%S')}")

    conn = None
    updated = 0
    errors = 0
    try:
        conn = connect_db()
        cur = conn.cursor()

        cur.execute("""
            SELECT asset_id, ticker, isin, type FROM assets
            WHERE is_active = TRUE
              AND ticker NOT LIKE '%%\\_%%' ESCAPE '\\'
              AND ticker NOT LIKE 'TST%%'
        """)
        assets = cur.fetchall()
        problem_assets = []

        for asset_id, ticker, isin, asset_type in assets:
            identifier = isin if isin else ticker
            if not identifier:
                continue

            print(f"  {identifier}...", end=" ")
            price, date, final_ticker = try_get_data(identifier)

            if price:
                try:
                    cur.execute("""
                        INSERT INTO price_history (asset_id, date, price)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (asset_id, date)
                        DO UPDATE SET price = EXCLUDED.price
                    """, (asset_id, date, price))
                    conn.commit()
                    print(f"OK {final_ticker} -> {price:.4f}")
                    updated += 1
                except Exception as e:
                    conn.rollback()
                    print(f"Error DB: {e}")
                    errors += 1
            else:
                print("No encontrado")
                problem_assets.append((ticker, isin, asset_type))
                errors += 1

        if problem_assets:
            print("\n⚠️ Activos no encontrados:")
            for ticker, isin, asset_type in problem_assets:
                print(f"   • {ticker or isin} ({asset_type})")

        cur.close()
    except Exception as e:
        print(f"Error de conexión: {e}")
        errors += 1
    finally:
        if conn:
            conn.close()

    print(f"\nResumen: {updated} actualizados, {errors} no encontrados")
    return errors


def consolidate_history():
    """
    Elimina duplicados intraday de días anteriores, dejando solo
    el último precio de cada día por activo.
    """
    print("\n🧹 Consolidando histórico...")
    conn = None
    try:
        conn = connect_db()
        cur = conn.cursor()

        cur.execute("""
            DELETE FROM price_history
            WHERE price_id NOT IN (
                SELECT DISTINCT ON (asset_id, date::date) price_id
                FROM price_history
                ORDER BY asset_id, date::date, date DESC
            )
            AND date::date < CURRENT_DATE;
        """)

        affected_rows = cur.rowcount
        conn.commit()
        print(f"  Filas eliminadas: {affected_rows}")

        cur.execute("""
            SELECT
                a.ticker,
                COUNT(ph.price_id) as total,
                MIN(ph.date)::date as desde,
                MAX(ph.date)::date as hasta
            FROM assets a
            LEFT JOIN price_history ph ON a.asset_id = ph.asset_id
            WHERE a.is_active = TRUE
            GROUP BY a.asset_id, a.ticker
            ORDER BY a.ticker
        """)

        for ticker, total, first, last in cur.fetchall():
            print(f"    {ticker}: {total} registros ({first} → {last})")

        cur.close()
    except Exception as e:
        print(f"Error consolidando: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    print("=" * 50)
    print("Worker de precios - Ejecución única")
    print("=" * 50)

    errors = fetch_closing_prices()
    consolidate_history()

    print("\n✅ Worker finalizado.")
    # Exit 0 always — unfound tickers are warnings, not failures.
    # Only connection/DB errors should cause a non-zero exit.
    sys.exit(0)