import yfinance as yf
import psycopg2
import os
import sys
import math
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
import pytz
from urllib.parse import urlparse
import argparse

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

def backfill_prices(target_asset_id=None, target_ticker=None, custom_start_date=None, default_days=365):
    print("=== Iniciando proceso de backfill ===")
    conn = None
    try:
        conn = connect_db()
        cur = conn.cursor()

        # Obtener los activos a procesar
        query = """
            SELECT a.asset_id, a.ticker, a.isin, MIN(o.date)::date
            FROM assets a
            LEFT JOIN operations o ON a.asset_id = o.asset_id
            WHERE a.is_active = TRUE
              AND a.ticker NOT LIKE '%%\\_%%' ESCAPE '\\'
              AND a.ticker NOT LIKE 'TST%%'
        """
        
        params = []
        if target_asset_id:
            query += " AND a.asset_id = %s"
            params.append(target_asset_id)
        elif target_ticker:
            query += " AND a.ticker = %s"
            params.append(target_ticker)
            
        query += " GROUP BY a.asset_id, a.ticker, a.isin"
        
        cur.execute(query, params)
        assets = cur.fetchall()

        if not assets:
            print("No se encontraron activos activos para procesar.")
            return

        print(f"Se procesarán {len(assets)} activo(s).")
        
        for asset_id, ticker, isin, min_op_date in assets:
            identifier = ticker if ticker else isin
            if not identifier:
                continue

            print(f"\nProcesando {identifier} (ID: {asset_id})...")

            # Determinar fecha de inicio
            if custom_start_date:
                start_date = custom_start_date
                print(f"  -> Usando fecha de inicio provista: {start_date.strftime('%Y-%m-%d')}")
            elif min_op_date:
                # 7 días antes de la primera operación para asegurar FFILL correcto
                start_date = min_op_date - timedelta(days=7)
                print(f"  -> Primera operación registrada el: {min_op_date.strftime('%Y-%m-%d')}")
                print(f"  -> Solicitando historial desde (Op - 7 días): {start_date.strftime('%Y-%m-%d')}")
            else:
                start_date = datetime.now().date() - timedelta(days=default_days)
                print(f"  -> Sin operaciones registradas. Solicitando historial por defecto ({default_days} días): {start_date.strftime('%Y-%m-%d')}")

            # Fetch Yahoo Finance data
            try:
                asset = yf.Ticker(identifier)
                # Formato yfinance espera string YYYY-MM-DD o datetime
                data = asset.history(start=start_date.strftime("%Y-%m-%d"), end=datetime.now().strftime("%Y-%m-%d"))

                if data.empty:
                    print("  ⚠️ No se encontró historial para este activo.")
                    continue

                print(f"  -> Recibidos {len(data)} registros de precios de cierre.")
                
                from datetime import timezone
                records = []
                for date_index, row in data.iterrows():
                    price_val = float(row['Close'])
                    if math.isnan(price_val) or math.isinf(price_val) or price_val <= 0:
                        continue
                    
                    price_date = date_index.to_pydatetime()
                    if price_date.tzinfo is None:
                        price_date = price_date.replace(tzinfo=timezone.utc)
                    else:
                        price_date = price_date.astimezone(timezone.utc)
                    records.append((asset_id, price_date, price_val))

                if records:
                    # Insertar en base de datos en lote
                    cur.executemany("""
                        INSERT INTO price_history (asset_id, date, price)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (asset_id, date)
                        DO UPDATE SET price = EXCLUDED.price
                    """, records)
                    conn.commit()
                    print(f"  ✅ Guardados {len(records)} registros en base de datos.")
                
            except Exception as e:
                print(f"  ❌ Error al obtener/guardar datos para {identifier}: {e}")
                if conn:
                    conn.rollback()

            # Evitar saturar Yahoo Finance (antiban IP)
            time.sleep(1.5)

        cur.close()
    except Exception as e:
        print(f"Error de base de datos general: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Worker de Backfill de histórico de precios.")
    parser.add_argument("--asset-id", type=int, help="ID del activo específico a actualizar")
    parser.add_argument("--ticker", type=str, help="Ticker del activo específico a actualizar")
    parser.add_argument("--days", type=int, default=365, help="Días por defecto si el activo no tiene operaciones (default: 365)")
    parser.add_argument("--start-date", type=str, help="Fecha de inicio personalizada (formato AAAA-MM-DD)")

    args = parser.parse_args()

    custom_start = None
    if args.start_date:
        try:
            custom_start = datetime.strptime(args.start_date, "%Y-%m-%d").date()
        except ValueError:
            print("Formato de fecha inválido. Utilice AAAA-MM-DD.")
            sys.exit(1)

    backfill_prices(
        target_asset_id=args.asset_id,
        target_ticker=args.ticker,
        custom_start_date=custom_start,
        default_days=args.days
    )

    consolidate_history()
    print("\n✅ Proceso de Backfill completado.")
