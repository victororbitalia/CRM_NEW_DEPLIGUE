# Configuración del CRM para Desarrollo Local

## Requisitos Previos

1. **Node.js** (versión 18 o superior)
2. **PostgreSQL** (versión 14 o superior)
3. **npm** o **yarn**

## Configuración de la Base de Datos

1. Instala PostgreSQL en tu sistema si aún no lo tienes
2. Crea una base de datos para el desarrollo:

```sql
CREATE DATABASE restaurant_crm_dev;
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE restaurant_crm_dev TO postgres;
```

## Configuración del Proyecto

1. Clona el repositorio (si aún no lo has hecho)
2. Instala las dependencias:

```bash
npm install
```

3. Configura las variables de entorno:
   - El archivo `.env` ya está configurado para desarrollo local
   - Ajusta la URL de la base de datos si es necesario

4. Genera el cliente de Prisma:

```bash
npm run db:generate
```

5. Ejecuta las migraciones de la base de datos:

```bash
npm run db:migrate
```

6. Puebla la base de datos con datos de ejemplo:

```bash
npm run db:seed
```

## Ejecución de la Aplicación

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Usuarios de Prueba

El sistema incluye los siguientes usuarios de prueba:

- **Administrador**: admin@restaurant.com / admin123
- **Gerente**: manager@restaurant.com / manager123

## Flujo de Navegación

1. **Landing Page** (`http://localhost:3000/`)
   - Página principal accesible sin autenticación
   - Incluye información sobre el CRM y enlaces a login/registro

2. **Login** (`http://localhost:3000/login`)
   - Acceso para usuarios registrados
   - Después del login, redirige al dashboard

3. **Dashboard** (`http://localhost:3000/dashboard`)
   - Panel de control principal
   - Requiere autenticación

## Comandos Útiles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run db:studio` - Abre Prisma Studio para ver la base de datos
- `npm run db:reset` - Reinicia la base de datos (borra todos los datos)
- `npm run lint` - Verifica el código con ESLint
- `npm run format` - Formatea el código con Prettier

## Estructura del Proyecto

- `src/app/` - Páginas de la aplicación (Next.js App Router)
- `src/components/` - Componentes de React
- `src/lib/` - Utilidades y configuración
- `prisma/` - Esquema y migraciones de la base de datos
- `public/` - Archivos estáticos

## Solución de Problemas

### Problema: Error de conexión a la base de datos
- Asegúrate de que PostgreSQL está en ejecución
- Verifica que la URL de la base de datos en `.env` es correcta
- Confirma que la base de datos `restaurant_crm_dev` existe

### Problema: Error de dependencias
- Ejecuta `npm install` para reinstalar las dependencias
- Intenta eliminar `node_modules` y `package-lock.json` y reinstalar

### Problema: Error de migración
- Ejecuta `npm run db:reset` para reiniciar la base de datos
- Verifica que no haya bloqueos en la base de datos

## Características Principales

- Gestión de reservas
- Gestión de mesas y áreas
- Sistema de clientes
- Análisis y reportes
- Autenticación y autorización
- Notificaciones automáticas

## Desarrollo

Para agregar nuevas características:

1. Crea las rutas en `src/app/`
2. Agrega los componentes en `src/components/`
3. Actualiza el esquema de Prisma si es necesario
4. Ejecuta las migraciones: `npm run db:migrate`
5. Prueba los cambios

## Producción

Para desplegar en producción:

1. Configura las variables de entorno de producción
2. Ejecuta `npm run build`
3. Inicia con `npm run start`