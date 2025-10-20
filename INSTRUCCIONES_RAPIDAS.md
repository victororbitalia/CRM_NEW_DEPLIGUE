# Instrucciones Rápidas para Iniciar el Proyecto

## Problema: Base de Datos no Conecta

El error "Can't reach database server at `localhost:5432`" significa que PostgreSQL no está corriendo.

## Solución Rápida (Windows)

### Opción 1: Usar el Script Automático
1. Abre una terminal como Administrador
2. Ejecuta el script:
   ```
   cd "c:\Users\Victor\Desktop\CRM NEW"
   scripts\start-database-windows.bat
   ```
3. Espera a que se complete el proceso
4. Inicia la aplicación: `npm run dev`

### Opción 2: Manualmente
1. **Busca PostgreSQL en tu sistema**:
   - Presiona `Win + R` y escribe `services.msc`
   - Busca "postgresql-x64-14" (o similar)
   - Clic derecho > Iniciar

2. **Verifica que el puerto 5432 esté activo**:
   - Abre una terminal y ejecuta: `netstat -an | findstr 5432`
   - Deberías ver una línea que dice `LISTENING`

3. **Si PostgreSQL no está instalado**:
   - Descárgalo desde: https://www.postgresql.org/download/windows/
   - Instálalo con la contraseña: `password`
   - Recuerda el usuario: `postgres`

### Opción 3: Usar Docker (Recomendado si tienes Docker)
1. Ejecuta este comando en una terminal:
   ```bash
   docker run --name postgres-crm -e POSTGRES_PASSWORD=password -e POSTGRES_DB=restaurant_crm_dev -p 5432:5432 -d postgres:14
   ```
2. Espera a que se inicie el contenedor
3. Inicia la aplicación: `npm run dev`

## Después de Iniciar la Base de Datos

1. **Ejecuta las migraciones** (solo la primera vez):
   ```bash
   npx prisma migrate dev
   ```

2. **Inicia la aplicación**:
   ```bash
   npm run dev
   ```

3. **Abre tu navegador** en: http://localhost:3000

## Probar la Solución del Layout de Mesas

Una vez que la aplicación esté funcionando:

1. Inicia sesión o regístrate
2. Ve a la página de Mesas
3. Cambia a "Vista Layout"
4. Arrastra una mesa a una nueva posición
5. Suelta la mesa - ¡debería mantenerse en su nueva posición!
6. Recarga la página para verificar que la posición se guardó

## Si Sigues Teniendo Problemas

1. **Verifica el archivo .env.local**:
   - Asegúrate que la contraseña sea correcta
   - El nombre de la base de datos debe ser `restaurant_crm_dev`

2. **Reinicia todo**:
   - Detén la aplicación (Ctrl+C)
   - Reinicia PostgreSQL
   - Vuelve a iniciar `npm run dev`

3. **Verifica los logs**:
   - Abre la consola del navegador (F12)
   - Busca errores relacionados con la base de datos

## Nota Importante

La solución del problema de las mesas ya está implementada. Una vez que la base de datos esté funcionando, las mesas deberían mantener su posición correctamente después de ser movidas.