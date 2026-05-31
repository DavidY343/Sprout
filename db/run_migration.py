import psycopg2
import os

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise SystemExit("Set DATABASE_URL environment variable")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

cur.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE')
cur.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE')
cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'email'")
cur.execute('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL')
cur.execute('UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL OR email_verified = FALSE')
cur.execute("UPDATE users SET auth_provider = 'email' WHERE auth_provider IS NULL")
conn.commit()

cur.execute("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position")
for r in cur.fetchall():
    print(f'  {r[0]:20s} {r[1]:15s} nullable={r[2]}')

cur.close()
conn.close()
print('Migration OK')
