# 🚀 Guía Rápida de Despliegue en Easypanel

## ⚡ Resumen Rápido (15 minutos)

**Tu CRM Restaurante → Easypanel en 15 minutos**

---

## 🎯 Paso 1: Preparar Archivos (5 minutos)

### 1.1 Crear archivo de migraciones
**Archivo**: `prisma/migrations.js`
```javascript
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function runMigration() {
  try {
    console.log('🔄 Iniciando migración...');
    
    // Generar cliente Prisma
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Crear tablas según schema
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    
    // Aplicar migraciones
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Seed si existe
    try {
      execSync('npx prisma db seed', { stdio: 'inherit' });
    } catch {}
    
    console.log('✅ Migración completada!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigration();
}
```

### 1.2 Actualizar Dockerfile
Reemplaza tu `Dockerfile` con:
```dockerfile
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /app/public/uploads && chown nextjs:nodejs /app/public/uploads
USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "node prisma/migrations.js && node server.js"]
```

---

## 🎯 Paso 2: Subir a GitHub (2 minutos)

```bash
git add .
git commit -m "Preparar para Easypanel"
git push origin main
```

---

## 🎯 Paso 3: Configurar Base de Datos en Easypanel (3 minutos)

### 3.1 Crear PostgreSQL
1. Easypanel → `Create` → `Database` → `PostgreSQL`
2. **Nombre**: `crm-restaurant-db`
3. **Usuario**: `postgres`
4. **Password**: Genera una segura (¡anótala!)
5. **Base de datos**: `restaurant_crm`
6. Click en `Deploy`

### 3.2 Obtener URL de Conexión
```
postgresql://postgres:TU_PASSWORD@postgres:5432/restaurant_crm
```

---

## 🎯 Paso 4: Crear Aplicación en Easypanel (5 minutos)

### 4.1 Nueva App
1. Easypanel → `Create` → `App`
2. **Source**: GitHub → selecciona tu repositorio
3. **Branch**: `main`

### 4.2 Configuración
- **Build Method**: Docker (automático)
- **Dockerfile**: `./Dockerfile`
- **Port**: `3000`

### 4.3 Variables de Entorno
```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:TU_PASSWORD@postgres:5432/restaurant_crm
JWT_SECRET=supersecreto123456789
REFRESH_TOKEN_SECRET=supersecreto987654321
NEXT_PUBLIC_APP_URL=https://tu-app.easypanel.host
```

### 4.4 Deploy
1. Click en `Deploy`
2. Espera 3-5 minutos
3. ¡Listo! Tu app estará en: `https://tu-app.easypanel.host`

---

## 🔧 Configuración Adicional (Opcional)

### Auto-Deploy (Recomendado)
1. Tu app → `Settings`
2. Activar `Auto Deploy`
3. Ahora cada `git push` actualiza automáticamente

### Dominio Personalizado
1. Tu app → `Domains`
2. `Add Domain` → tu-dominio.com
3. Configura DNS según instrucciones
4. SSL automático

---

## ✅ Verificación

### URLs para probar:
- **Inicio**: `https://tu-app.easypanel.host`
- **API Health**: `https://tu-app.easypanel.host/api/health`
- **Login**: `https://tu-app.easypanel.host/login`

### Si algo falla:
1. Ve a `Logs` en tu app Easypanel
2. Busca el último error en rojo
3. Revisa las variables de entorno
4. Verifica que el puerto sea 3000

---

## 🎉 ¡Felicidades!

Tu CRM Restaurante está ahora:
✅ En producción en Easypanel
✅ Con base de datos PostgreSQL
✅ Con HTTPS automático
✅ Accesible públicamente
✅ Listo para usar

---

## 🔄 Actualizar la App

```bash
# Hacer cambios
git add .
git commit -m "Nueva funcionalidad"
git push

# Easypanel actualiza automáticamente (si auto-deploy activado)
```

---

## 🆘 Problemas Comunes

### "Build Failed"
- Verifica que `next.config.ts` tenga `output: 'standalone'`
- Revisa que todas las dependencias estén en `package.json`

### "Application Crashed"
- Revisa logs en Easypanel
- Verifica que `DATABASE_URL` sea correcta
- Asegúrate que PostgreSQL esté corriendo

### "No puedo acceder"
- Espera 1-2 minutos después del deploy
- Verifica que el estado sea "Running" (verde)
- Refresca con `Ctrl + Shift + R`

---

**¡Tu CRM está funcionando en Easypanel!** 🚀

Para más detalles, revisa `PLAN_DESPLIEGUE_EASYPANEL.md`