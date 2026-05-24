import yfinance as yf
import psycopg2
import os
from datetime import datetime, time as dt_time, timedelta 
import time as time_module 
from dotenv import load_dotenv
import schedule
import pytz
from urllib.parse import urlparse
load_dotenv()

def get_madrid_tz():
    """Obtiene la zona horaria de Madrid"""
    return pytz.timezone('Europe/Madrid')

def is_market_hours():
    """
    Verifica si estamos en horario de mercado europeo (9:00 - 17:30 Madrid)
    """
    madrid_tz = get_madrid_tz()
    now = datetime.now(madrid_tz)
    
    market_start = dt_time(9, 0) 
    market_end = dt_time(17, 30)
    
    is_weekday = now.weekday() < 5
    is_market_time = market_start <= now.time() <= market_end
    
    return is_weekday and is_market_time

def should_run_15min():
    """
    Decide si debe ejecutarse la actualización de 15 minutos
    """
    if is_market_hours():
        return True
    else:
        return False

def connect_db():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        # Parse the URL (works with Supabase/Railway connection strings)
        url = urlparse(database_url)
        return psycopg2.connect(
            dbname=url.path[1:],
            user=url.username,
            password=url.password,
            host=url.hostname,
            port=url.port or 5432,
            sslmode="require" if url.hostname != "db" and url.hostname != "localhost" else "prefer"
        )
    else:
        return psycopg2.connect(
            dbname=os.getenv("POSTGRES_DB"),
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
            host=os.getenv("DB_HOST", "db"),
            port=int(os.getenv("DB_PORT", "5432"))
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
    """
    Actualización de precios - solo se ejecuta si estamos en horario de mercado
    """
    if not should_run_15min():
        return
    
    print(f"Iniciando actualización de alta frecuencia: {datetime.now()}")
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
            
            print(f"Buscando: {identifier}...", end=" ")
            
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
                    print(f"{final_ticker} -> {price:.4f}")
                except Exception as e:
                    conn.rollback()
                    print(f"Error DB: {e}")
            else:
                print(f"No encontrado.")
                problem_assets.append((ticker, isin, asset_type))

        if problem_assets:
            print("⚠️ ACTIVOS NO ENCONTRADOS:")
            for ticker, isin, asset_type in problem_assets:
                print(f"   • {ticker or isin} - {asset_type}")
        
        cur.close()
    except Exception as e:
        print(f"Error de conexión: {e}")
    finally:
        if conn:
            conn.close()
    
    print(f"Tarea de alta frecuencia finalizada: {datetime.now()}\n")

def nightly_update():
    """
    Actualización nocturna - Obtiene un último precio y consolida
    """
    print(f"Iniciando tarea nocturna: {datetime.now()}")
    
    conn = None
    try:
        conn = connect_db()
        cur = conn.cursor()
        
        cur.execute("SELECT asset_id, ticker, isin, type FROM assets WHERE is_active = TRUE")
        assets = cur.fetchall()
        
        print("Obteniendo precios de cierre...")
        for asset_id, ticker, isin, asset_type in assets:
            identifier = isin if isin else ticker
            if not identifier:
                continue
            
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
                    print(f"  • {final_ticker}: {price:.4f}")
                except Exception as e:
                    conn.rollback()
                    print(f"  • Error con {identifier}: {e}")
        
        cur.close()
    except Exception as e:
        print(f"Error en actualización nocturna: {e}")
    finally:
        if conn:
            conn.close()
    
    consolidate_history()
    
    print(f"Tarea nocturna completada: {datetime.now()}\n")

def consolidate_history():
    """
    Borra los puntos de alta frecuencia de días anteriores y deja solo 
    el último precio de cada día.
    """
    print("🧹 Consolidando histórico...")
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
        print(f"  • Registros consolidados: {affected_rows} filas eliminadas")
        
        
        cur.execute("""
            SELECT 
                a.ticker,
                COUNT(ph.price_id) as total_registros,
                MIN(ph.date) as primera_fecha,
                MAX(ph.date) as ultima_fecha
            FROM assets a
            LEFT JOIN price_history ph ON a.asset_id = ph.asset_id
            WHERE a.is_active = TRUE
            GROUP BY a.asset_id, a.ticker
            ORDER BY a.ticker
        """)
        
        stats = cur.fetchall()
        print("  Estadísticas por activo:")
        for ticker, total, first, last in stats:
            print(f"    • {ticker}: {total} registros ({first.date()} - {last.date()})")
        
        cur.close()
    except Exception as e:
        print(f"Error consolidando: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

def run_initial_update():
    """Ejecuta una actualización inicial al arrancar el script"""
    print("Iniciando sistema de actualización de precios")
    print(f"Fecha actual: {datetime.now()}")
    print(f"Zona horaria: Europe/Madrid")
    
    if is_market_hours():
        print("Mercado abierto - Ejecutando actualización inicial")
        update_prices()
    else:
        print("Mercado cerrado - Esperando horario de mercado")
        print("Horario: Lunes-Viernes 9:00 - 17:30 (Madrid)")


# --- PROGRAMACIÓN ---
def setup_schedule():
    """Configura todas las tareas programadas"""
    
    schedule.clear()
    
    # 1. Cada 15 minutos: Actualización de alta frecuencia (solo en mercado abierto)
    schedule.every(15).minutes.do(update_prices)
    
    # 2. Cada noche: Actualización y consolidación
    schedule.every().day.at("23:59").do(nightly_update)
    
    # 3. También programamos una consolidación los fines de semana por si acaso
    schedule.every().saturday.at("02:00").do(consolidate_history)
    schedule.every().sunday.at("02:00").do(consolidate_history)
    
    print("Programación configurada:")
    print("  • Cada 15 minutos: Actualización (solo en mercado abierto)")
    print("  • 23:59 diario: Actualización nocturna + consolidación")
    print("  • Sábado 2:00: Consolidación adicional")
    print("  • Domingo 2:00: Consolidación adicional")

if __name__ == "__main__":
    run_initial_update()
    
    setup_schedule()
    
    while True:
        try:
            schedule.run_pending()
            time_module.sleep(60)
            
        except KeyboardInterrupt:
            print("\n Deteniendo el sistema...")
            break
        except Exception as e:
            print(f" Error en bucle principal: {e}")
            time_module.sleep(60)