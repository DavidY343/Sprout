import yfinance as yf
import psycopg2
import os
from datetime import datetime, time
import time
from dotenv import load_dotenv
import schedule

load_dotenv()

def connect_db():
    return psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        host="db"
    )

def try_get_data(identifier):
    """Intenta obtener datos de Yahoo Finance con varios sufijos si es necesario."""
    # Lista de sufijos por orden de probabilidad para fondos/ETFs en Europa
    suffixes = ["", ".F", ".MC", ".MI", ".L"]
    
    for suffix in suffixes:
        ticker_to_try = f"{identifier}{suffix}"
        try:
            # period="5d" para asegurar que pillamos el último cierre si es fin de semana
            asset = yf.Ticker(ticker_to_try)
            data = asset.history(period="5d") 
            
            if not data.empty:
                last_price = float(data['Close'].iloc[-1])
                price_date = data.index[-1].to_pydatetime()
                return last_price, price_date, ticker_to_try
        except Exception:
            continue
    return None, None, None

def update_prices():
    print(f"Iniciando actualización: {datetime.now()}")
    conn = None
    try:
        conn = connect_db()
        cur = conn.cursor()
        
        cur.execute("SELECT asset_id, ticker, isin FROM assets WHERE is_active = TRUE")
        assets = cur.fetchall()
        problem_assets = []
        for asset_id, ticker, isin in assets:
            identifier = isin if isin else ticker
            if not identifier: continue

            print(f"Buscando: {identifier}...", end=" ")
            
            price, date, final_ticker = try_get_data(identifier)
            if not price:
                problem_assets.append((ticker, isin, os.name))
            if price:
                try:
                    cur.execute("""
                        INSERT INTO price_history (asset_id, date, price)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (asset_id, date) 
                        DO UPDATE SET price = EXCLUDED.price
                    """, (asset_id, date, price))
                    conn.commit()
                    print(f"{final_ticker} -> {price:.4f}")
                except Exception as e:
                    conn.rollback()
                    print(f"Error DB: {e}")
            else:
                print(f"No encontrado.")

        if problem_assets:
            print("⚠️ ACTIVOS NO ENCONTRADOS:")
            for ticker, isin, name in problem_assets:
                print(f"   • {ticker or isin} - {name}")
        cur.close()
    except Exception as e:
        print(f"Error de conexión: {e}")
    finally:
        if conn:
            conn.close()
    print(f"Tarea finalizada: {datetime.now()}\n")

# --- PROGRAMACIÓN ---
# 1. Ejecución inmediata al iniciar
update_prices()

# 2. Ejecución nocturna (23:30)
schedule.every().day.at("23:30").do(update_prices)

# 3. Ejecución matutina (08:00)
schedule.every().day.at("08:00").do(update_prices)

if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)