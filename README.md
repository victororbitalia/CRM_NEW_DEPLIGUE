# CRM Restaurante

Sistema de gestión de reservas para restaurantes construido con Next.js 14, TypeScript y Tailwind CSS.

## Características

- 🏪 Gestión de perfil del restaurante
- 🪑 Gestión de mesas y visualización de layout
- 📅 Sistema completo de reservas
- 🔐 Autenticación basada en JWT con control de roles
- 📱 Diseño responsivo optimizado para móviles
- 🎨 Sistema de diseño personalizado con Tailwind CSS
- 🌍 Soporte para español y zona horaria Europa/Madrid

## Stack Tecnológico

- **Frontend**: Next.js 14 con App Router, React 18, TypeScript
- **Backend**: Next.js API routes
- **Base de datos**: PostgreSQL con Prisma ORM (por configurar)
- **Estilos**: Tailwind CSS con sistema de diseño personalizado
- **Autenticación**: JWT basado con refresh tokens (por implementar)
- **Despliegue**: Docker con EasyPanel (por configurar)

## Requisitos Previos

- Node.js 18+ recomendado
- PostgreSQL (para desarrollo y producción)
- npm o yarn

## Instalación

1. Clonar el repositorio:
   ```bash
   git clone <repository-url>
   cd crm-restaurant
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   ```bash
   cp .env.example .env.local
   ```
   
   Editar `.env.local` con tus configuraciones específicas.

4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

5. Abrir [http://localhost:3000](http://localhost:3000) en tu navegador.

## Scripts Disponibles

- `npm run dev` - Iniciar servidor de desarrollo
- `npm run build` - Construir aplicación para producción
- `npm run start` - Iniciar servidor de producción
- `npm run lint` - Ejecutar ESLint
- `npm run lint:fix` - Ejecutar ESLint con auto-corrección
- `npm run format` - Formatear código con Prettier
- `npm run format:check` - Verificar formato del código
- `npm run type-check` - Verificar tipos de TypeScript

## Estructura del Proyecto

```
src/
├── app/                 # Páginas y layouts de Next.js 13+ App Router
│   ├── api/            # Rutas de la API
│   ├── auth/           # Páginas de autenticación
│   ├── dashboard/      # Dashboard principal
│   ├── reservations/   # Gestión de reservas
│   ├── tables/         # Gestión de mesas
│   ├── restaurant/     # Configuración del restaurante
│   └── settings/       # Configuración general
├── components/         # Componentes de React
│   ├── ui/            # Componentes UI reutilizables
│   ├── forms/         # Formularios
│   └── layout/        # Componentes de layout
├── lib/               # Utilidades y configuración
│   ├── utils/         # Funciones utilitarias
│   ├── api/           # Clientes de API
│   ├── auth/          # Configuración de autenticación
│   └── db/            # Configuración de base de datos
├── types/             # Definiciones de tipos TypeScript
├── hooks/             # Custom hooks de React
└── store/             # Gestión de estado (si es necesario)
```

## Variables de Entorno

Las siguientes variables de entorno están disponibles:

- `DATABASE_URL` - URL de conexión a PostgreSQL
- `NEXTAUTH_URL` - URL para NextAuth.js
- `NEXTAUTH_SECRET` - Secreto para NextAuth.js
- `JWT_SECRET` - Secreto para tokens JWT
- `DEFAULT_TIMEZONE` - Zona horaria por defecto (Europe/Madrid)

Ver `.env.example` para una lista completa de variables.

## Desarrollo

### Código Limpio

El proyecto incluye configuración para ESLint y Prettier. Antes de hacer commit:

```bash
npm run lint:fix
npm run format
```

### Tipos de TypeScript

El proyecto utiliza TypeScript estricto. Para verificar tipos:

```bash
npm run type-check
```

## Configuración de Base de Datos

Este proyecto está preparado para usar PostgreSQL con Prisma ORM. Para configurar:

1. Instalar Prisma CLI:
   ```bash
   npm install prisma --save-dev
   ```

2. Inicializar Prisma:
   ```bash
   npx prisma init
   ```

3. Configurar la URL de la base de datos en `.env.local`

4. Crear el esquema de base de datos en `prisma/schema.prisma`

5. Ejecutar migraciones:
   ```bash
   npx prisma migrate dev
   ```

## Despliegue

El proyecto está preparado para despliegue con Docker y EasyPanel.

### Construcción Docker

```bash
docker build -t crm-restaurant .
```

### Ejecución con Docker Compose (por configurar)

```bash
docker-compose up -d
```

## Contribuir

1. Hacer fork del proyecto
2. Crear una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Hacer commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Hacer push a la rama (`git push origin feature/amazing-feature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## Soporte

Para soporte, contacta a support@restaurant.com o abre un issue en el repositorio.

## Estado del Proyecto

Este es un proyecto en desarrollo. Actualmente se ha completado la configuración inicial y estructura básica. Las siguientes funcionalidades están pendientes de implementación:

- [ ] Configuración de base de datos con Prisma
- [ ] Sistema de autenticación
- [ ] API endpoints para todas las funcionalidades
- [ ] Implementación completa de reservas
- [ ] Gestión de mesas
- [ ] Configuración del restaurante
- [ ] Dashboard con analytics
- [ ] Sistema de notificaciones
- [ ] Pruebas unitarias y de integración
- [ ] Configuración de Docker para producción

Ver [start-from-scratch/tasks.md](./start-from-scratch/tasks.md) para una lista detallada de tareas pendientes.
