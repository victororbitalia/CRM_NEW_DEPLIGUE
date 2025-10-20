# Configuración de la Base de Datos para el CRM

## Requisitos Previos

1. **PostgreSQL** instalado en tu sistema
2. **Node.js** y **npm** instalados

## Pasos para Configurar la Base de Datos

### 1. Iniciar PostgreSQL

#### Windows:
1. Busca "pgAdmin" o "SQL Shell (psql)" en el menú de inicio
2. O si instalaste PostgreSQL como servicio:
   ```cmd
   net start postgresql-x64-14
   ```

#### macOS con Homebrew:
```bash
brew services start postgresql
```

#### Linux (Ubuntu/Debian):
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Verificar que PostgreSQL está corriendo

```bash
# Verificar si el puerto 5432 está en uso
netstat -an | grep 5432
```

### 3. Crear la Base de Datos

```sql
-- Conectarse a PostgreSQL
psql -U postgres

-- Crear la base de datos
CREATE DATABASE crm_db;

-- Crear el usuario (si no existe)
CREATE USER crm_user WITH PASSWORD 'crm_password';

-- Dar permisos al usuario
GRANT ALL PRIVILEGES ON DATABASE crm_db TO crm_user;

-- Salir de PostgreSQL
\q
```

### 4. Configurar las Variables de Entorno

Crea o actualiza el archivo `.env.local` en la raíz del proyecto:

```env
# Database
DATABASE_URL="postgresql://crm_user:crm_password@localhost:5432/crm_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secreto-aqui"

# Otros
NODE_ENV="development"
```

### 5. Ejecutar las Migraciones

```bash
# Generar Prisma Client
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# O si hay problemas, resetear la base de datos
npx prisma migrate reset
```

### 6. Sembrar la Base de Datos (Opcional)

```bash
# Ejecutar el seed
npx prisma db seed
```

## Iniciar la Aplicación

Una vez que la base de datos esté configurada y corriendo:

```bash
# Iniciar la aplicación
npm run dev
```

La aplicación debería estar disponible en `http://localhost:3000`

## Solución de Problemas

### Error: "Can't reach database server at `localhost:5432`"

1. **Verifica que PostgreSQL esté instalado**:
   ```bash
   psql --version
   ```

2. **Verifica que el servicio esté corriendo**:
   - Windows: `services.msc` y busca "postgresql"
   - macOS/Linux: `brew services list` o `systemctl status postgresql`

3. **Verifica el puerto**:
   ```bash
   netstat -an | grep 5432
   ```

4. **Verifica las credenciales** en `.env.local`

### Error: "FATAL: database does not exist"

1. Crea la base de datos:
   ```sql
   CREATE DATABASE crm_db;
   ```

### Error: "FATAL: role does not exist"

1. Crea el usuario:
   ```sql
   CREATE USER crm_user WITH PASSWORD 'crm_password';
   ```

## Alternativa: Usar Docker

Si prefieres usar Docker para PostgreSQL:

```bash
# Iniciar PostgreSQL con Docker
docker run --name postgres-crm -e POSTGRES_PASSWORD=crm_password -e POSTGRES_DB=crm_db -p 5432:5432 -d postgres:14

# Configurar .env.local
DATABASE_URL="postgresql://postgres:crm_password@localhost:5432/crm_db"
```

## Verificación Final

Para verificar que todo funciona correctamente:

1. Inicia PostgreSQL
2. Ejecuta `npx prisma migrate dev`
3. Inicia la aplicación con `npm run dev`
4. Abre `http://localhost:3000` en tu navegador
5. Intenta iniciar sesión o registrarte

Si todo está configurado correctamente, deberías poder acceder a la aplicación sin errores de base de datos.