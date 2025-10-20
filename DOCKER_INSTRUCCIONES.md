# Instrucciones para Iniciar el Proyecto con Docker

## Paso 1: Iniciar Docker Desktop

1. **Busca Docker Desktop** en tu menú de inicio de Windows
2. **Inícialo** y espera a que esté completamente corriendo (deberías ver el icono de Docker en la bandeja del sistema)
3. **Verifica que esté funcionando**:
   - Abre una terminal (PowerShell o CMD)
   - Ejecuta: `docker --version`
   - Deberías mostrar la versión de Docker

## Paso 2: Iniciar la Base de Datos

Una vez que Docker Desktop esté corriendo:

1. **Abre una terminal** en la carpeta del proyecto:
   ```bash
   cd "c:\Users\Victor\Desktop\CRM NEW"
   ```

2. **Inicia solo la base de datos PostgreSQL**:
   ```bash
   docker-compose up -d postgres
   ```

3. **Verifica que el contenedor esté corriendo**:
   ```bash
   docker ps
   ```
   Deberías ver un contenedor llamado `crm-postgres-1` (o similar)

## Paso 3: Ejecutar las Migraciones

1. **Genera Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Ejecuta las migraciones**:
   ```bash
   npx prisma migrate dev
   ```

3. **Si hay problemas, resetea la base de datos**:
   ```bash
   npx prisma migrate reset
   ```

## Paso 4: Iniciar la Aplicación

1. **Inicia la aplicación**:
   ```bash
   npm run dev
   ```

2. **Abre tu navegador** en: http://localhost:3000

## Paso 5: Probar la Solución del Layout de Mesas

1. **Inicia sesión** o regístrate en la aplicación
2. **Ve a la página de Mesas**
3. **Cambia a "Vista Layout"**
4. **Arrastra una mesa** a una nueva posición
5. **Suelta la mesa** - ¡debería mantenerse en su nueva posición!
6. **Recarga la página** para verificar que la posición se guardó

## Si Docker Desktop No Está Instalado

1. **Descarga Docker Desktop** desde: https://www.docker.com/products/docker-desktop/
2. **Instálalo** y reinicia tu computadora
3. **Inicia Docker Desktop** y sigue los pasos anteriores

## Comandos Útiles de Docker

- **Ver contenedores corriendo**: `docker ps`
- **Ver logs de PostgreSQL**: `docker logs crm-postgres-1`
- **Detener PostgreSQL**: `docker-compose stop postgres`
- **Reiniciar PostgreSQL**: `docker-compose restart postgres`

## Solución de Problemas

### Error: "Docker Desktop is not running"
- Inicia Docker Desktop desde el menú de inicio
- Espera a que esté completamente cargado (puede tardar unos minutos)

### Error: "port 5432 is already allocated"
- Ejecuta: `netstat -ano | findstr 5432`
- Si hay otro proceso usando el puerto, detén ese servicio o cambia el puerto en docker-compose.yml

### Error: "database does not exist"
- Ejecuta: `npx prisma migrate reset`
- Esto creará la base de datos desde cero

## Nota Importante

La solución del problema de las mesas ya está implementada. Una vez que la base de datos esté funcionando con Docker, las mesas deberían mantener su posición correctamente después de ser movidas.

Los cambios realizados incluyen:
- Corrección del sistema de coordenadas
- Prevención de reinicialización innecesaria
- Mejora de la sincronización con la base de datos