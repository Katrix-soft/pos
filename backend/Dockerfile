# ── Katrix POS — Backend ──────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero (mejor cache de capas)
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar código fuente
COPY . .

# Directorio para la base de datos (montado como volumen)
RUN mkdir -p /data

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "server.js"]
