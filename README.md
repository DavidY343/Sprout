# Sprout — Portfolio Tracker

Aplicación web para gestión y seguimiento de inversiones personales: portfolios, trades, transacciones y rebalanceo.

## Producción

| Servicio | URL |
|---|---|
| Frontend (Vercel) | https://sprout-bice.vercel.app |
| Backend API (Railway) | https://sprout-backend-production-3aff.up.railway.app |
| API Docs | https://sprout-backend-production-3aff.up.railway.app/docs |
| Base de datos | Supabase (PostgreSQL) |

## Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy (async)
- **Worker**: Python (actualización de precios)
- **DB**: PostgreSQL (Supabase)
- **Deploy**: Vercel · Railway · Supabase

## Desarrollo local (opcional)

### Requisitos
- Docker & Docker Compose (v2+)

### Levantar con Docker
```bash
git clone https://github.com/tuusuario/sprout.git
cd sprout
docker-compose up --build
```
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- API Docs: `http://localhost:8000/docs`

### Credenciales con datos dummy
- Correo: `demo@user.com`
- Contraseña: `admin123`