FROM python:3.11-slim

# Evitar que Python escriba archivos .pyc
ENV PYTHONDONTWRITEBYTECODE 1
# Asegurar que la salida de Python se envíe directamente al terminal
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Instalar dependencias del sistema necesarias para PostgreSQL y otros paquetes
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt /app/
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Copiar el proyecto
COPY . /app/

# El comando por defecto se sobreescribe en el docker-compose.yml, 
# pero es buena práctica tener uno aquí.
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
