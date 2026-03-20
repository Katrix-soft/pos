# ── Katrix POS — Backend ──────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Dependencias de compilación para sqlite3 (bindings nativos C++)
RUN apk add --no-cache python3 make g++

# Copiar solo package.json (sin package-lock para evitar conflictos cross-platform)
COPY package.json ./

# Instalar desde cero en Linux (genera lockfile propio)
RUN npm install --omit=dev

# Copiar código fuente
COPY . .

# Directorio para la base de datos SQLite (montado como volumen)
RUN mkdir -p /data

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "server.js"]
