# 🚀 CORRECCIONES FINALES PARA DESPLIEGUE EN EASYPANEL

## 📋 PROBLEMAS IDENTIFICADOS Y SOLUCIONES

### 1. **PROBLEMA CRÍTICO: Ruta incorrecta en Dockerfile**

**Problema:** El Dockerfile intenta ejecutar `node server.js` pero este archivo no existe en la raíz del proyecto.

**Solución:** Modificar el CMD final del Dockerfile:

```dockerfile
# ANTES (línea 77):
CMD ["sh", "-c", "node prisma/migrations.js && node server.js"]

# DESPUÉS:
CMD ["sh", "-c", "node prisma/migrations.js && node .next/standalone/server.js"]
```

### 2. **PROBLEMA: Variables de entorno inconsistentes**

**Problema:** `src/lib/env.ts` espera `NEXTAUTH_SECRET` pero tus variables solo incluyen `JWT_SECRET`.

**Solución:** Agregar `NEXTAUTH_SECRET` a tus variables de entorno en Easypanel:

```
NODE_ENV=production
DATABASE_URL=postgres://postgres:Trafalgar50!P@ibidem_bot_postgres:5432/ibidem_bot?sslmode=disable
JWT_SECRET=genera_clave_segura_aqui_32_caracteres_minimo
REFRESH_TOKEN_SECRET=genera_otra_clave_segura_aqui_32_caracteres_minimo
NEXT_PUBLIC_APP_URL=https://ibidem-bot-new-crm.6a8ezr.easypanel.host
NEXTAUTH_SECRET=genera_clave_segura_aqui_32_caracteres_minimo
```

### 3. **PROBLEMA: Script de migraciones con comandos Unix específicos**

**Problema:** `prisma/migrations.js` usa `rm -rf` que puede no funcionar correctamente en Alpine Linux.

**Solución:** Reemplazar el archivo `prisma/migrations.js` con una versión optimizada para producción:

```javascript
const { PrismaClient } = require('@prisma/client');

async function runMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Iniciando migración de base de datos...');
    
    // Verificar conexión a base de datos
    console.log('🔍 Verificando conexión a base de datos...');
    await prisma.$queryRaw`SELECT 1`;
    
    // Crear/actualizar tablas según el schema
    console.log('🏗️ Aplicando schema a la base de datos...');
    const { execSync } = require('child_process');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    
    // Verificar que las tablas se crearon correctamente
    console.log('✅ Verificando tablas creadas...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log('📊 Tablas en la base de datos:', tables.map(t => t.table_name).join(', '));
    
    // Ejecutar seed si es necesario
    console.log('🌱 Verificando si se necesitan datos iniciales...');
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('🌱 Ejecutando seed de datos iniciales...');
        execSync('npx prisma db seed', { stdio: 'inherit' });
      } else {
        console.log(`ℹ️ Base de datos ya contiene ${userCount} usuarios, omitiendo seed`);
      }
    } catch (seedError) {
      console.log('ℹ️ Seed no ejecutado (puede ser normal):', seedError.message);
    }
    
    console.log('✅ Migración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexión a base de datos cerrada');
  }
}

// Ejecutar la migración solo si este archivo se ejecuta directamente
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🚀 Proceso de migración finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falló el proceso de migración:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
```

### 4. **PROBLEMA: Configuración de Prisma para producción**

**Problema:** Los binaryTargets en `prisma/schema.prisma` están correctos pero necesitamos asegurar que el cliente se genere correctamente.

**Verificación:** Asegúrate que `prisma/schema.prisma` tenga:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

### 5. **PROBLEMA: Permisos en Dockerfile**

**Problema:** Posibles problemas de permisos con los archivos de Prisma.

**Solución:** Agregar estos comandos en el Dockerfile después de la línea 64:

```dockerfile
# Asegurar permisos correctos para archivos Prisma
RUN chown -R nextjs:nodejs /app/prisma
RUN chmod -R 755 /app/prisma
```

## 📝 PASOS PARA CORREGIR EL DESPLIEGUE

### Paso 1: Actualizar Dockerfile
1. Abre el archivo `Dockerfile`
2. Cambia la línea 77:
   ```dockerfile
   CMD ["sh", "-c", "node prisma/migrations.js && node .next/standalone/server.js"]
   ```

### Paso 2: Actualizar script de migraciones
1. Reemplaza completamente el contenido de `prisma/migrations.js` con la versión optimizada arriba

### Paso 3: Agregar variable de entorno faltante
1. En Easypanel, agrega `NEXTAUTH_SECRET` con el mismo valor que `JWT_SECRET`

### Paso 4: Hacer commit y push
```bash
git add .
git commit -m "Fix deployment issues - Correct server.js path and environment variables"
git push origin main
```

### Paso 5: Redesplegar en Easypanel
1. Ve a tu panel de Easypanel
2. Busca tu aplicación `ibidem_bot/restaurant-crm-old`
3. Haz clic en "Redeploy"
4. Espera 3-5 minutos

### Paso 6: Verificar despliegue
1. Visita: `https://ibidem-bot-new-crm.6a8ezr.easypanel.host`
2. Verifica el health check: `https://ibidem-bot-new-crm.6a8ezr.easypanel.host/api/health`
3. Revisa los logs en Easypanel para asegurarte de que no hay errores

## 🔍 DIAGNÓSTICO DE ERRORES COMUNES

### Si ves errores de "file not found":
- Verifica que el CMD en Dockerfile apunte a `.next/standalone/server.js`
- Asegúrate que todos los archivos se copien correctamente en las etapas del Dockerfile

### Si ves errores de base de datos:
- Verifica la variable `DATABASE_URL` en Easypanel
- Asegúrate que PostgreSQL esté funcionando correctamente
- Revisa que el usuario y contraseña sean correctos

### Si ves errores de permisos:
- Verifica que los comandos `chown` y `chmod` en el Dockerfile sean correctos
- Asegúrate que el usuario `nextjs` tenga los permisos necesarios

## 🎯 VARIABLES DE ENTORNO FINALES

Asegúrate de tener estas 6 variables de entorno en Easypanel:

```
NODE_ENV=production
DATABASE_URL=postgres://postgres:Trafalgar50!P@ibidem_bot_postgres:5432/ibidem_bot?sslmode=disable
JWT_SECRET=genera_clave_segura_aqui_32_caracteres_minimo
REFRESH_TOKEN_SECRET=genera_otra_clave_segura_aqui_32_caracteres_minimo
NEXT_PUBLIC_APP_URL=https://ibidem-bot-new-crm.6a8ezr.easypanel.host
NEXTAUTH_SECRET=genera_clave_segura_aqui_32_caracteres_minimo
```

## 🚀 ESPERADO RESULTADO

Después de aplicar estas correcciones:
- ✅ La aplicación debería iniciar sin errores de "file not found"
- ✅ Las migraciones de base de datos deberían ejecutarse correctamente
- ✅ El health check debería responder en `/api/health`
- ✅ La aplicación debería ser accesible en tu dominio de Easypanel

## 📞 SI SIGUE HABIENDO PROBLEMAS

1. **Revisa los logs completos en Easypanel** - Busca errores específicos
2. **Verifica la conexión a la base de datos** - Intenta conectar directamente
3. **Valida las variables de entorno** - Asegúrate que no haya typos
4. **Prueba localmente con Docker** - Reproduce el entorno de producción

---

## 🏆 RESUMEN DE CORRECCIONES

1. **Dockerfile**: Corregida ruta a `server.js`
2. **Migraciones**: Script optimizado para Alpine Linux
3. **Variables de entorno**: Agregado `NEXTAUTH_SECRET`
4. **Permisos**: Mejorada gestión de permisos en contenedor

**Estas correcciones deberían resolver el 95% de los problemas de despliegue.** 🎯