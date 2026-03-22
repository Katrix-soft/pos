# ── Katrix POS — Backend ──────────────────────────────────────────
# Usamos node:20-slim (Debian) — mucho más compatible con módulos nativos
# como sqlite3 que tienen bindings C++ (Alpine/musl da problemas con estos)
FROM node:20-slim

WORKDIR /app

# Herramientas de build para sqlite3 (Debian)
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential python3 && \
    rm -rf /var/lib/apt/lists/*

# Copiar solo package.json (sin lock de Windows para evitar conflictos)
COPY package.json ./

# Instalar dependencias
RUN npm install --omit=dev --legacy-peer-deps

# Copiar código fuente
COPY . .

# Directorio para la base de datos SQLite (montado como volumen)
RUN mkdir -p /data

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "server.js"]
