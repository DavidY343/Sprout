# 🌱 Sprout — Financial Tracker

Sistema de gestión financiera personal con tracking de inversiones, portfolios y rebalanceo automático.

**Stack:** React + TypeScript · FastAPI + Python · PostgreSQL · Yahoo Finance API

---

## 📐 Arquitectura

```
┌─────────────┐    ┌──────────────┐    ┌────────────┐
│   Vercel    │    │    Render    │    │  Supabase  │
│  (Frontend) │───▶│  (Backend)   │───▶│ (Postgres) │
│  React+Vite │    │   FastAPI    │    │            │
└─────────────┘    └──────────────┘    └────────────┘
                   ┌──────────────┐          │
                   │    Render    │──────────┘
                   │  (Worker)    │
                   │ Price Update │
                   └──────────────┘
```

| Servicio | Tecnología | Puerto | Deploy |
|---|---|---|---|
| Frontend | React 19 + Vite 7 + TailwindCSS 4 | 5173 | Vercel |
| Backend | FastAPI + SQLAlchemy 2 + asyncpg | 8000 | Render |
| Worker | Python + yfinance + schedule | — | Render |
| Database | PostgreSQL 16 | 5432 | Supabase |

---

## 🚀 Deploy a Producción

### Requisitos Previos

- Cuenta en [Vercel](https://vercel.com) (gratuito)
- Cuenta en [Render](https://render.com) (gratuito para el backend, de pago para el worker)
- Cuenta en [Supabase](https://supabase.com) (gratuito)
- Repositorio en GitHub

---

### Paso 1 — Supabase (Base de Datos)

1. **Crear proyecto** en [supabase.com/dashboard](https://supabase.com/dashboard)
   - Nombre: `sprout`
   - Región: la más cercana a ti (ej: `eu-central-1` para Europa)
   - Genera una contraseña segura y **guárdala**

2. **Ejecutar migration** — Ve a **SQL Editor** y pega el contenido de:
   ```
   db/supabase_migration.sql
   ```
   Haz clic en **Run** ▶ y verifica que se crean las 7 tablas sin errores.

3. **Copiar connection string** — Ve a **Settings > Database > Connection string** y copia la URI de conexión (modo `URI`):
   ```
   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```

> **⚠️ Importante:** Usa el **Connection Pooler** (puerto `6543`) para producción, no la conexión directa.

---

### Paso 2 — Render (Backend API & Worker)

Hemos configurado un archivo `render.yaml` (Infrastructure as Code) en el directorio raíz para hacer el despliegue automático en Render.

1. **Importar proyecto** en [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
   - Ve a la sección **Blueprints**.
   - Conecta tu repositorio de GitHub de Sprout.
   - Render detectará el archivo `render.yaml` automáticamente y creará los dos servicios (Backend y Worker).

2. **Configurar variables de entorno** en el dashboard de Render:
   Durante la creación (o después en la pestaña **Environment** del Web Service), asegúrate de rellenar:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | `postgresql+asyncpg://postgres.[REF]:[PASS]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres` |
   | `ALLOWED_ORIGINS` | `https://tu-app.vercel.app` (De momento pon el que vayas a usar, o actualízalo en el Paso 4) |

   *(Render generará automáticamente `SECRET_KEY` gracias al blueprint).*

3. **Verificar deploy:**
   - Render asignará una URL tipo `https://sprout-backend.onrender.com`
   - Comprueba: `https://sprout-backend.onrender.com/health` → `{"status": "healthy"}`
   - Docs: `https://sprout-backend.onrender.com/docs`

> **Nota sobre el Worker:** Render ofrece un plan gratuito para **Web Services** (el backend), pero los **Background Workers** requieren un plan de pago (desde ~$7/mes). Si no deseas pagar por el worker, puedes suspenderlo en Render y correrlo localmente o buscar alternativas para tareas en segundo plano.

---

### Paso 3 — Vercel (Frontend)

1. **Importar proyecto** en [vercel.com/new](https://vercel.com/new)
   - Conecta tu repo de GitHub
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

2. **Variables de entorno:**

   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | `https://sprout-backend.onrender.com/api/v1` |

3. **Deploy** → Vercel construirá y desplegará automáticamente.

4. **⚠️ Actualizar CORS en Render:**
   - Ve a tu Backend en Render > **Environment**.
   - Edita `ALLOWED_ORIGINS` para incluir tu dominio de Vercel:
     ```
     https://tu-app.vercel.app
     ```
   - Reinicia el servicio si no se aplica automáticamente.

---

### Paso 4 — Verificación Final

```bash
# 1. Health check del backend
curl https://sprout-backend.onrender.com/health

# 2. Docs del API
# Abre en el navegador: https://sprout-backend.onrender.com/docs

# 3. Frontend
# Abre en el navegador: https://tu-app.vercel.app

# 4. Registrar un usuario y probar la aplicación
```

---

## 💻 Desarrollo Local (Docker)

### Requisitos
- [Docker](https://www.docker.com/get-started) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/) (v2.0+)
- Git

### Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/tuusuario/sprout.git
cd sprout

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Levantar todos los servicios
docker-compose up --build

# 4. Acceder
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Sin Docker (Frontend solo)

```bash
cd frontend
npm install
cp .env.example .env
# Edita .env → VITE_API_URL=http://localhost:8000/api/v1
npm run dev
```

---

## 🧪 Tests

### Smoke Tests (requiere Docker corriendo)

```powershell
# Ejecutar el suite completo E2E
.\tests\smoke\e2e-flow.smoke.ps1

# Solo assets con precios
.\tests\smoke\assets-with-prices.smoke.ps1

# UI Theme test
.\tests\smoke\ui-theme.smoke.ps1
```

Los smoke tests cubren el flujo completo:
1. Registro de usuario
2. Login
3. Creación de cuentas
4. Creación de activos
5. Depósitos (transacciones)
6. Compra de trades
7. Dashboard: balance de cuentas
8. Dashboard: tabla de activos
9. Dashboard: performance
10. Assets con precios

---

## 📁 Estructura del Proyecto

```
Sprout/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/         # Endpoints (auth, portfolio, trades, etc.)
│   │   ├── core/           # Config, DB, JWT, Security
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # React + Vite Frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Login, Portfolio, Trades, Transactions
│   │   ├── services/       # API client, auth service
│   │   ├── styles/         # Theme system
│   │   └── types/          # TypeScript types
│   ├── Dockerfile
│   ├── vercel.json
│   └── package.json
├── worker/                  # Price Updater
│   ├── main.py             # Yahoo Finance price fetcher
│   ├── Dockerfile
│   └── requirements.txt
├── db/                      # Database
│   ├── schema.sql          # Schema DDL (Docker)
│   ├── supabase_migration.sql  # Migration para Supabase
│   ├── init.sql            # Init script (Docker)
│   └── sample.sql          # Datos de ejemplo
├── tests/smoke/            # Smoke tests (PowerShell)
├── docker-compose.yml      # Desarrollo local
├── render.yaml             # Configuración de despliegue en Render
├── .env.example            # Template de variables
└── README.md
```

---

## 🔑 API Endpoints

| Grupo | Método | Endpoint | Auth |
|---|---|---|---|
| Auth | POST | `/api/v1/auth/register` | ✗ |
| Auth | POST | `/api/v1/auth/login` | ✗ |
| Auth | POST | `/api/v1/auth/refresh` | ✗ |
| Accounts | GET | `/api/v1/accounts/user-accounts` | ✓ |
| Accounts | POST | `/api/v1/accounts/create` | ✓ |
| Transactions | GET | `/api/v1/transactions/me` | ✓ |
| Transactions | POST | `/api/v1/transactions/create` | ✓ |
| Assets | GET | `/api/v1/assets/with-prices` | ✓ |
| Assets | POST | `/api/v1/assets/create` | ✓ |
| Trades | GET | `/api/v1/trades/history` | ✓ |
| Trades | POST | `/api/v1/trades/create` | ✓ |
| Portfolio | GET | `/api/v1/portfolio/accounts` | ✓ |
| Portfolio | GET | `/api/v1/portfolio/assets/all` | ✓ |
| Portfolio | GET | `/api/v1/portfolio/performance` | ✓ |
| Rebalance | GET/POST | `/api/v1/rebalance/*` | ✓ |
| Chart | GET | `/api/v1/history_chart/*` | ✓ |
| Health | GET | `/health` | ✗ |

---

## 🔐 Variables de Entorno

### Backend (`.env`)
```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
ALLOWED_ORIGINS=https://tu-app.vercel.app
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=https://sprout-backend.onrender.com/api/v1
```

---

## 📜 Licencia

MIT