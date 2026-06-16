import asyncio
import math
import traceback
from datetime import datetime, timedelta, timezone
import yfinance as yf
from sqlalchemy import select, func, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models import Operation, Asset, PriceHistory, Account

def fetch_yf_history(identifier: str, start_str: str, end_str: str):
    try:
        ticker = yf.Ticker(identifier)
        return ticker.history(start=start_str, end=end_str)
    except Exception as e:
        print(f"Error fetching yfinance history for {identifier}: {e}")
        return None

async def run_backfill_for_assets(db: AsyncSession, assets_data: list):
    """
    assets_data is a list of dicts: {"asset_id": int, "identifier": str, "min_op_date": datetime}
    """
    try:
        print(f"=== Starting DB backfill for {len(assets_data)} assets ===")
        
        for asset in assets_data:
            asset_id = asset["asset_id"]
            identifier = asset["identifier"]
            min_op_date = asset["min_op_date"]
            
            # Determine start date
            if min_op_date:
                # 7 days before the first operation
                start_date = min_op_date - timedelta(days=7)
            else:
                # Fallback to 365 days ago
                start_date = datetime.now() - timedelta(days=365)
                
            start_str = start_date.strftime("%Y-%m-%d")
            end_str = datetime.now().strftime("%Y-%m-%d")
            
            print(f"Backfilling {identifier} (ID: {asset_id}) from {start_str} to {end_str}")
            
            # Run blocking yfinance fetch in thread pool
            data = await asyncio.to_thread(fetch_yf_history, identifier, start_str, end_str)
            
            if data is None or data.empty:
                print(f"No history found or error for {identifier}")
                continue
                
            print(f"Received {len(data)} price records for {identifier}")
            
            # Prepare batch insert values
            inserted_count = 0
            for date_index, row in data.iterrows():
                price_val = float(row['Close'])
                if math.isnan(price_val) or math.isinf(price_val) or price_val <= 0:
                    continue
                    
                price_date = date_index.to_pydatetime()
                if price_date.tzinfo is None:
                    price_date = price_date.replace(tzinfo=timezone.utc)
                else:
                    price_date = price_date.astimezone(timezone.utc)
                
                # Upsert into price_history
                stmt = insert(PriceHistory).values(
                    asset_id=asset_id,
                    date=price_date,
                    price=price_val
                ).on_conflict_do_update(
                    index_elements=['asset_id', 'date'],
                    set_={'price': price_val}
                )
                await db.execute(stmt)
                inserted_count += 1
                
            await db.commit()
            print(f"Saved {inserted_count} price records for {identifier}")
            
            # Sleep to be polite to Yahoo Finance
            await asyncio.sleep(1.5)
            
        # Run history consolidation
        await consolidate_history_db(db)
    except Exception as e:
        print(f"Error general en run_backfill_for_assets: {e}")
        traceback.print_exc()

async def consolidate_history_db(db: AsyncSession):
    print("🧹 Consolidating database history...")
    try:
        await db.execute(text("""
            DELETE FROM price_history
            WHERE price_id NOT IN (
                SELECT DISTINCT ON (asset_id, date::date) price_id
                FROM price_history
                ORDER BY asset_id, date::date, date DESC
            )
            AND date::date < CURRENT_DATE;
        """))
        await db.commit()
        print("Consolidation done.")
    except Exception as e:
        print(f"Error during consolidation: {e}")
        await db.rollback()

async def backfill_account_prices(account_id: int):
    """
    Background task to backfill prices for all assets in a specific account.
    """
    try:
        async with AsyncSessionLocal() as db:
            # Check assets that have operations in this account
            stmt = (
                select(Asset.asset_id, Asset.ticker, Asset.isin, func.min(Operation.date).label("min_op_date"))
                .select_from(Asset)
                .join(Operation, Operation.asset_id == Asset.asset_id)
                .where(Operation.account_id == account_id)
                .group_by(Asset.asset_id, Asset.ticker, Asset.isin)
            )
            
            result = await db.execute(stmt)
            rows = result.all()
            
            assets_data = []
            for row in rows:
                identifier = row.ticker if row.ticker else row.isin
                if not identifier:
                    continue
                assets_data.append({
                    "asset_id": row.asset_id,
                    "identifier": identifier,
                    "min_op_date": row.min_op_date
                })
                
            if assets_data:
                await run_backfill_for_assets(db, assets_data)
    except Exception as e:
        print(f"Error en backfill_account_prices para account_id={account_id}: {e}")
        traceback.print_exc()

async def backfill_portfolio_prices(user_id: int):
    """
    Background task to backfill prices for all assets in a user's entire portfolio.
    """
    try:
        async with AsyncSessionLocal() as db:
            # Check assets that have operations in any of the user's accounts
            stmt = (
                select(Asset.asset_id, Asset.ticker, Asset.isin, func.min(Operation.date).label("min_op_date"))
                .select_from(Asset)
                .join(Operation, Operation.asset_id == Asset.asset_id)
                .join(Account, Operation.account_id == Account.account_id)
                .where(Account.user_id == user_id)
                .group_by(Asset.asset_id, Asset.ticker, Asset.isin)
            )
            
            result = await db.execute(stmt)
            rows = result.all()
            
            assets_data = []
            for row in rows:
                identifier = row.ticker if row.ticker else row.isin
                if not identifier:
                    continue
                assets_data.append({
                    "asset_id": row.asset_id,
                    "identifier": identifier,
                    "min_op_date": row.min_op_date
                })
                
            if assets_data:
                await run_backfill_for_assets(db, assets_data)
    except Exception as e:
        print(f"Error en backfill_portfolio_prices para user_id={user_id}: {e}")
        traceback.print_exc()
