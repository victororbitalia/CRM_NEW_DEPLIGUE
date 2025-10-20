# 🚀 Plan Completo de Despliegue para Easypanel

## 📋 Resumen Ejecutivo

Este documento contiene el plan completo para desplegar tu CRM Restaurante en Easypanel. Basado en el análisis comparativo con el proyecto ejemplo que funciona, hemos identificado los ajustes necesarios para un despliegue exitoso.

---

## 🎯 Objetivo del Despliegue

Desplegar tu aplicación CRM Restaurante con todas sus funcionalidades avanzadas (autenticación, gestión de usuarios, reservas, mesas, etc.) en Easypanel utilizando PostgreSQL como base de datos.

---

## 📊 Diferencias Clave Identificadas

### 1. **Puerto de Aplicación**
- **Tu Proyecto**: Puerto 3000 (estándar Next.js)
- **Recomendación**: Mantener puerto 3000 o cambiar a 3001 para evitar conflictos

### 2. **Complejidad del Schema**
- **Tu Proyecto**: 20+ modelos (completo y funcional)
- **Ventaja**: Mucho más completo que el ejemplo
- **Consideración**: Requiere migraciones más robustas

### 3. **Variables de Entorno**
- **Tu Proyecto**: Configuración avanzada (JWT, Email, Redis, etc.)
- **Recomendación**: Mantener todas para funcionalidad completa

---

## 🛠️ Archivos y Configuraciones Necesarias

### 1. Archivo de Migraciones Personalizado

**Archivo**: `prisma/migrations.js`

```javascript
const { PrismaClient } = require('@prisma/client');

// Función para ejecutar la migración completa del schema
async function runMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Iniciando migración completa del CRM Restaurante...');
    
    // Usar Prisma para aplicar el schema completo
    // Esto creará todas las tablas según tu schema.prisma
    await prisma.$executeRaw`
      -- Desactivar restricciones temporalmente
      SET session_replication_role = replica;
      
      -- El comando push creará todas las tablas según el schema
      -- Sin necesidad de SQL manual gracias a Prisma
    `;
    
    // Usar Prisma db push para crear las tablas
    const { execSync } = require('child_process');
    console.log('Creando tablas con Prisma...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    
    // Aplicar migraciones si existen
    console.log('Aplicando migraciones...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Generar cliente Prisma
    console.log('Generando cliente Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Ejecutar seed si existe
    console.log('Verificando datos iniciales...');
    try {
      execSync('npx prisma db seed', { stdio: 'inherit' });
    } catch (error) {
      console.log('Seed no ejecutado (puede ser normal si ya existe datos)');
    }
    
    console.log('✅ Migración completada exitosamente!');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
```

### 2. Variables de Entorno para Producción

**Archivo**: `.env.production`

```env
# Configuración del Servidor
NODE_ENV=production
PORT=3000

# URL de la aplicación
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
NEXT_PUBLIC_API_URL=https://tu-dominio.com/api

# Base de Datos (OBLIGATORIO)
DATABASE_URL=postgresql://postgres:TU_PASSWORD@postgres:5432/restaurant_crm

# Autenticación JWT
JWT_SECRET=TU_JWT_SECRET_SUPER_SEGURO_AQUI
REFRESH_TOKEN_SECRET=TU_REFRESH_TOKEN_SECRET_SUPER_SEGURO

# NextAuth (si usas)
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=TU_NEXAUTH_SECRET

# Email (opcional pero recomendado)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password
EMAIL_FROM=noreply@tu-dominio.com

# Redis (para caché y sesiones)
REDIS_URL=redis://redis:6379

# Monitoreo (opcional)
SENTRY_DSN=TU_SENTRY_DSN

# File Upload
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=5242880

# Timezone
DEFAULT_TIMEZONE=Europe/Madrid
```

### 3. Dockerfile Optimizado para Easypanel

**Archivo**: `Dockerfile` (reemplazar el actual)

```dockerfile
# Multi-stage build para producción optimizada
# Stage 1: Instalar dependencias
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de paquetes
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Construir la aplicación
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependencias
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar cliente Prisma
RUN npx prisma generate

# Construir aplicación
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Imagen de producción
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos construidos
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copiar archivos Prisma para runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/package.json ./package.json

# Crear directorios necesarios
RUN mkdir -p /app/public/uploads && chown nextjs:nodejs /app/public/uploads

# Establecer permisos
USER nextjs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Ejecutar migración y luego iniciar aplicación
CMD ["sh", "-c", "node prisma/migrations.js && node server.js"]
```

### 4. Docker Compose Simplificado para Easypanel

**Archivo**: `docker-compose.easypanel.yml`

```yaml
version: '3.8'

services:
  # Aplicación CRM
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: crm-restaurant-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/restaurant_crm
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    volumes:
      - uploads_data:/app/public/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - crm-network

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: crm-postgres
    environment:
      POSTGRES_DB: restaurant_crm
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - crm-network

  # Redis para caché
  redis:
    image: redis:7-alpine
    container_name: crm-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - crm-network

volumes:
  postgres_data:
  redis_data:
  uploads_data:

networks:
  crm-network:
    driver: bridge
```

---

## 🎯 Pasos de Despliegue en Easypanel

### Paso 1: Preparar el Repositorio

1. **Subir código a GitHub** (si no está ya)
```bash
git add .
git commit -m "Preparar para despliegue en Easypanel"
git push origin main
```

### Paso 2: Configurar Base de Datos en Easypanel

1. **Crear PostgreSQL**:
   - En Easypanel: `Create` → `Database` → `PostgreSQL`
   - **Nombre**: `crm-restaurant-db`
   - **Usuario**: `postgres`
   - **Password**: Generar una segura
   - **Base de datos**: `restaurant_crm`
   - Click en `Deploy`

2. **Obtener URL de conexión**:
   ```
   postgresql://postgres:TU_PASSWORD@postgres:5432/restaurant_crm
   ```

### Paso 3: Crear Aplicación en Easypanel

1. **Nueva Aplicación**:
   - `Create` → `App`
   - **Source**: GitHub (seleccionar tu repositorio)
   - **Branch**: `main`

2. **Configuración Build**:
   - **Build Method**: Docker (detectará automáticamente)
   - **Dockerfile**: `./Dockerfile`
   - **Port**: `3000`

3. **Variables de Entorno**:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres:TU_PASSWORD@postgres:5432/restaurant_crm
   JWT_SECRET=TU_JWT_SECRET_SUPER_SEGURO
   REFRESH_TOKEN_SECRET=TU_REFRESH_TOKEN_SECRET
   NEXT_PUBLIC_APP_URL=https://tu-dominio.easypanel.host
   ```

4. **Deploy**:
   - Click en `Deploy`
   - Esperar 3-5 minutos

### Paso 4: Configurar Dominio (Opcional)

1. **Dominio Automático**:
   - Easypanel te asignará: `tu-app.easypanel.host`
   - ¡Ya está funcionando!

2. **Dominio Personalizado**:
   - En tu app → `Domains`
   - `Add Domain` → tu-dominio.com
   - Configurar DNS según instrucciones
   - SSL automático con Let's Encrypt

---

## 🔧 Configuración Adicional

### Health Check Endpoint

Asegúrate de tener el endpoint `/api/health`:

**Archivo**: `src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar conexión a base de datos
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error.message 
      }, 
      { status: 503 }
    );
  }
}
```

### Auto-Deploy

1. En tu app Easypanel → `Settings`
2. Activar `Auto Deploy`
3. Ahora cada `git push` actualizará automáticamente

---

## 📊 Monitoreo y Mantenimiento

### Ver Logs

1. **En Easypanel**: Tu app → `Logs`
2. **En tiempo real**: Ver errores y actividad

### Backups

1. **Base de datos**: Easypanel backup automático
2. **Archivos**: Volume `uploads_data` persistente

### Actualizaciones

```bash
# Hacer cambios
git add .
git commit -m "Nueva funcionalidad"
git push

# Easypanel actualiza automáticamente (si auto-deploy activado)
```

---

## 🚨 Solución de Problemas Comunes

### Build Falla

**Verificar**:
1. `next.config.ts` tiene `output: 'standalone'`
2. Todas las dependencias en `package.json`
3. Build local funciona: `npm run build`

### App No Inicia

**Verificar Logs**:
1. Error de conexión a BD
2. Variables de entorno correctas
3. Puerto configurado (3000)

### Base de Datos No Conecta

**Verificar**:
1. `DATABASE_URL` correcta
2. PostgreSQL corriendo en Easypanel
3. Migraciones ejecutadas

---

## ✅ Checklist Pre-Despliegue

- [ ] Código en GitHub
- [ ] Dockerfile actualizado
- [ ] Variables de entorno preparadas
- [ ] Endpoint `/api/health` funcionando
- [ ] Build local exitoso: `npm run build`
- [ ] Prueba con Docker local: `docker-compose up`

- [ ] PostgreSQL creado en Easypanel
- [ ] URL de BD configurada
- [ ] App creada en Easypanel
- [ ] Variables de entorno configuradas
- [ ] Deploy exitoso
- [ ] App accesible en URL
- [ ] Auto-deploy configurado

---

## 🎉 Resultado Esperado

Al finalizar, tendrás:

✅ **CRM Restaurante completo** funcionando en Easypanel
✅ **URL pública** con HTTPS automático
✅ **Base de datos PostgreSQL** persistente
✅ **Auto-deploy** para actualizaciones automáticas
✅ **Monitoreo y logs** en tiempo real
✅ **Backups automáticos** de base de datos

---

## 📞 Soporte y Recursos

- **Easypanel Docs**: https://easypanel.io/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Prisma Docs**: https://www.prisma.io/docs

---

## 🔄 Próximos Pasos

1. **Configurar usuarios y roles** en tu CRM
2. **Personalizar configuración** del restaurante
3. **Probar todas las funcionalidades**
4. **Configurar notificaciones por email**
5. **Establecer rutinas de backup**

---

**¡Tu CRM Restaurante estará listo para producción en Easypanel!** 🚀