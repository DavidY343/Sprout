FROM python:3.11-slim

# Evita .pyc y buffers raros
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Dependencias
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Código
COPY . .

# Puerto FastAPI
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
