import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def test():
    engine = create_async_engine('postgresql+asyncpg://postgres:nun9i0NBYCAP6FeO@db.sapyoprifklhmakewqhb.supabase.co:5432/postgres')
    try:
        async with engine.connect() as conn:
            res = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
            print(res.fetchall())
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test())
