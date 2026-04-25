FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY . .

EXPOSE 3000

# Usamos el comando de desarrollo de Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
