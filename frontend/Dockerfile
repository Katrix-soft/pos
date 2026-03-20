# ── Katrix POS — Frontend (multi-stage) ──────────────────────────
# Etapa 1: Build con Node
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Build de producción
RUN npm run build

# ──────────────────────────────────────────────────────────────────
# Etapa 2: Servir con Nginx
FROM nginx:1.27-alpine

# Copiar build estático
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración nginx personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
