# Fintech Tracker - Sistema de Gestión Financiera

Aplicación web completa para tracking de gastos e ingresos construida con FastAPI, React y PostgreSQL.

## Requisitos Previos

- [Docker](https://www.docker.com/get-started) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- Git

## Inicio Rápido

### 1. Clonar el repositorio
```bash
git clone https://github.com/tuusuario/fintech-tracker.git
cd fintech-tracker
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```
(Opcional: Puedes dejar los valores por defecto para desarrollo)

### 3. Construir y levantar los contenedores
```bash
docker-compose up --build
```

### 4. Acceder a la aplicación
- Backend: `http://localhost:8000`
- Documentación API: `http://localhost:8000/docs`
- Frontend: `http://localhost:5173`

### Credenciales con datos dummy
- Correo: `demo@user.com`
- Contraseña: `hashed_password`