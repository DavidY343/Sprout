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


def should_update(asset_type):
    now = datetime.now()
    is_weekend = now.weekday() >= 5
    
    if asset_type == 'crypto':
        # Cripto siempre abre
        return True  
    
    if asset_type == 'stock':
        # Si es fin de semana, no perdamos tiempo con acciones
        return not is_weekend 
        
    if asset_type == 'fund' or asset_type == 'bond':
        # Los fondos solo actualizan una vez al día
        return now.hour == 23 and now.minute < 15

    return True
def update_prices():
    print(f"Iniciando actualización: {datetime.now()}")
    conn = None
    try:
        conn = connect_db()
        cur = conn.cursor()
        
        cur.execute("SELECT asset_id, ticker, isin, type FROM assets WHERE is_active = TRUE")
        assets = cur.fetchall()
        problem_assets = []
        for asset_id, ticker, isin, asset_type in assets:
            identifier = isin if isin else ticker
            if not identifier:
                continue
            if not should_update(asset_type):
                print(f"{identifier} skipping (type: {asset_type})")
                continue
            

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


def consolidate_history():
    """
    Borra los puntos de alta frecuencia de días anteriores y deja solo 
    el último precio de cada día.
    """
    conn = connect_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            DELETE FROM price_history
            WHERE price_id NOT IN (
                SELECT DISTINCT ON (asset_id, date::date) price_id
                FROM price_history
                ORDER BY asset_id, date::date, date DESC
            )
            AND date::date < CURRENT_DATE;
        """)
        conn.commit()
        print("Consolidación completada: Historial optimizado.")
    except Exception as e:
        conn.rollback()
        print(f"Error consolidando: {e}")
    finally:
        cur.close()
        conn.close()




# --- PROGRAMACIÓN ---
# 1. Cada 15 minutos: Actualización de alta frecuencia
schedule.every(15).minutes.do(update_prices)

# 2. Cada noche: Limpieza de la base de datos
schedule.every().day.at("00:01").do(consolidate_history)

if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)