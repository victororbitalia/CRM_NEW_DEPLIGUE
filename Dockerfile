# Multi-stage build para producción optimizada con Easypanel
# Stage 1: Instalar dependencias
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copiar archivos de paquetes
COPY package.json package-lock.json ./
# Instalar todas las dependencias (incluyendo las de desarrollo necesarias para el build)
RUN npm ci && npm cache clean --force

# Stage 2: Construir la aplicación
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependencias y código
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar cliente Prisma
RUN npx prisma generate

# Construir aplicación
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Limpiar dependencias de desarrollo después del build
RUN npm prune --production

# Stage 3: Imagen de producción optimizada para Easypanel
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Instalar curl para health checks
RUN apk add --no-cache curl

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos construidos
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copiar node_modules completo (incluyendo Prisma que ahora está en dependencies)
COPY --from=builder /app/node_modules ./node_modules

# Copiar archivos Prisma para runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Crear directorios necesarios con permisos correctos
RUN mkdir -p /app/public/uploads && chown nextjs:nodejs /app/public/uploads

# Asegurar permisos correctos para node_modules
RUN chown -R nextjs:nodejs /app/node_modules
RUN chmod -R 755 /app/node_modules

# Establecer permisos de usuario
USER nextjs

# Exponer puerto
EXPOSE 3000

# Health check mejorado para Easypanel
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Ejecutar migraciones y luego iniciar aplicación
CMD ["sh", "-c", "node prisma/migrations.js && node server.js"]