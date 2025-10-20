# Correcciones para Despliegue en Easypanel

## Problemas Identificados

Durante el despliegue del proyecto en Easypanel, se identificaron los siguientes problemas críticos:

1. **Dependencias faltantes**: `bcryptjs`, `jsonwebtoken`, `@prisma/client`, `nanoid`
2. **Componente de cliente sin directiva**: `Sidebar.tsx` usaba `usePathname` sin `"use client"`
3. **Configuración de Tailwind CSS v4**: Formato incorrecto en `postcss.config.mjs`
4. **Dockerfile con instalación incompleta**: Solo instalaba dependencias de producción
5. **Next.js sin modo standalone**: Necesario para el contenedor Docker
6. **Ruta de health check faltante**: Requerida por el Dockerfile

## Cambios Realizados

### 1. Actualización de `package.json`

Se agregaron las siguientes dependencias de producción:
- `@prisma/client`: Cliente de Prisma para la base de datos
- `bcryptjs`: Para hash de contraseñas
- `jsonwebtoken`: Para manejo de tokens JWT
- `nanoid`: Para generación de IDs únicos

Y dependencias de desarrollo:
- `@types/bcryptjs`: Tipos para bcryptjs
- `@types/jsonwebtoken`: Tipos para jsonwebtoken
- `prisma`: CLI de Prisma

### 2. Corrección de `src/components/layout/Sidebar.tsx`

Se agregó la directiva `"use client"` al inicio del archivo para permitir el uso de hooks de Next.js como `usePathname`.

### 3. Configuración de `next.config.ts`

Se configuró el modo `standalone` y se agregó `@prisma/client` a los paquetes externos del servidor:
```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};
```

### 4. Modificación de `Dockerfile`

Se cambió la instalación de dependencias para incluir todas las necesarias durante el build:
```dockerfile
# Antes
RUN npm ci --only=production && npm cache clean --force

# Después
RUN npm ci && npm cache clean --force
RUN npm run build
RUN npm prune --production
```

### 5. Corrección de `postcss.config.mjs`

Se actualizó el formato de configuración de plugins para Tailwind CSS v4:
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### 6. Creación de `src/app/api/health/route.ts`

Se creó una ruta de health check para el monitoreo del contenedor en Easypanel.

## Pasos para el Nuevo Despliegue

1. **Commit y push de los cambios**:
   ```bash
   git add .
   git commit -m "Fix deployment issues for Easypanel"
   git push origin main
   ```

2. **Variables de entorno requeridas**:
   ```
   NODE_ENV=production
   DATABASE_URL=postgres://postgres:Trafalgar50!P@ibidem_bot_postgres:5432/ibidem_bot?sslmode=disable
   JWT_SECRET=genera_clave_segura_aqui_32_caracteres_minimo
   REFRESH_TOKEN_SECRET=genera_otra_clave_segura_aqui_32_caracteres_minimo
   NEXT_PUBLIC_APP_URL=https://tu-app.easypanel.host
   ```

3. **Verificar el despliegue**:
   - Revisar los logs en Easypanel
   - Verificar que el health check responda correctamente
   - Probar las funcionalidades básicas de la aplicación

## Recomendaciones Adicionales

1. **Secretos seguros**: Reemplazar los valores de ejemplo de `JWT_SECRET` y `REFRESH_TOKEN_SECRET` con claves seguras de al menos 32 caracteres.

2. **Monitoreo**: Configurar alertas en Easypanel para recibir notificaciones sobre el estado del contenedor.

3. **Backups**: Asegurar que la base de datos PostgreSQL tenga backups automáticos configurados.

4. **SSL**: Verificar que el dominio configurado en `NEXT_PUBLIC_APP_URL` tenga certificado SSL.

## Archivos Modificados

- `package.json`: Actualización de dependencias
- `src/components/layout/Sidebar.tsx`: Agregar directiva "use client"
- `next.config.ts`: Configuración modo standalone
- `Dockerfile`: Instalación completa de dependencias
- `postcss.config.mjs`: Formato correcto de plugins
- `src/app/api/health/route.ts`: Nueva ruta de health check

## Pruebas Locales Antes del Despliegue

Antes de hacer push a producción, se recomienda probar localmente:

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Construir aplicación
npm run build

# Iniciar en modo producción
npm start
```

Verificar que:
- La aplicación inicia sin errores
- Las rutas de API funcionan correctamente
- El health check responde en `http://localhost:3000/api/health`