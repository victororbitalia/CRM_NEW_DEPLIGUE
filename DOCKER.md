# Docker - CRM Restaurante

Esta documentación explica cómo utilizar Docker con el CRM Restaurante para desarrollo y producción.

## Arquitectura

La aplicación utiliza una arquitectura de microservicios con los siguientes contenedores:

- **app**: Aplicación Next.js
- **postgres**: Base de datos PostgreSQL
- **redis**: Caché Redis
- **nginx**: Proxy inverso y servidor web (solo producción)
- **backup**: Servicio de backups automáticos (solo producción)

## Imágenes Docker

### Imagen de Producción

La imagen de producción se construye con un multi-stage build optimizado:

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
# ... instalación de dependencias

# Stage 2: Build the application
FROM node:20-alpine AS builder
# ... construcción de la aplicación

# Stage 3: Production image
FROM node:20-alpine AS runner
# ... imagen final optimizada
```

### Imagen de Desarrollo

La imagen de desarrollo es más simple y permite hot-reload:

```dockerfile
FROM node:20-alpine
# ... configuración para desarrollo
```

## Comandos Docker

### Desarrollo

```bash
# Iniciar entorno de desarrollo
npm run docker:dev

# Ver logs
npm run docker:logs

# Detener servicios
npm run docker:dev:down
```

### Producción

```bash
# Iniciar entorno de producción
npm run docker:prod

# Ver logs de producción
npm run docker:prod:logs

# Detener servicios
npm run docker:prod:down
```

### Construcción

```bash
# Construir imagen localmente
npm run docker:build

# Construir sin caché
docker build --no-cache -t crm-restaurant:latest .
```

## Volúmenes

La aplicación utiliza los siguientes volúmenes:

### Desarrollo
- `.`: Código fuente (para hot-reload)
- `node_modules`: Dependencias de Node.js
- `postgres_data`: Datos de PostgreSQL
- `redis_data`: Datos de Redis

### Producción
- `uploads_data`: Archivos subidos por usuarios
- `postgres_data`: Datos de PostgreSQL
- `redis_data`: Datos de Redis
- `backups`: Copias de seguridad

## Redes

La aplicación utiliza una red Docker personalizada `crm-network` para aislar los servicios.

## Variables de Entorno

Las variables de entorno se configuran en los archivos `docker-compose.yml` y `docker-compose.prod.yml`.

### Variables Requeridas

- `DATABASE_URL`: URL de conexión a PostgreSQL
- `JWT_SECRET`: Secreto para tokens JWT
- `REFRESH_TOKEN_SECRET`: Secreto para tokens de refresco
- `NEXTAUTH_SECRET`: Secreto para NextAuth

### Variables Opcionales

- `REDIS_URL`: URL de conexión a Redis
- `EMAIL_*`: Configuración del servidor de correo
- `SENTRY_DSN`: Configuración de Sentry para monitoreo

## Health Checks

La aplicación incluye health checks para todos los servicios:

### Aplicación
```bash
curl -f http://localhost:3000/api/health
```

### PostgreSQL
```bash
docker-compose exec postgres pg_isready -U postgres
```

### Redis
```bash
docker-compose exec redis redis-cli ping
```

## Backup y Recuperación

### Backup Automático

Los backups se realizan automáticamente mediante el servicio `backup` que utiliza el crontab en `docker/crontab`.

### Backup Manual

```bash
# Ejecutar script de backup
./scripts/backup.sh

# Ver backups
ls -la backups/
```

### Recuperación

```bash
# Detener aplicación
docker-compose -f docker-compose.prod.yml down

# Restaurar base de datos
gunzip -c backups/backup_YYYYMMDD_HHMMSS.sql.gz | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d restaurant_crm

# Iniciar aplicación
docker-compose -f docker-compose.prod.yml up -d
```

## Optimización

### Imágenes

- Uso de imágenes Alpine Linux para reducir tamaño
- Multi-stage build para eliminar dependencias de construcción
- Limpieza de caché de npm

### Recursos

Los contenedores están configurados con límites de recursos:

```yaml
deploy:
  resources:
    limits:
      memory: 1G
    reservations:
      memory: 512M
```

### Red

- Uso de red interna para comunicación entre servicios
- Solo puertos necesarios expuestos
- Configuración de Nginx como proxy inverso

## Seguridad

### Imágenes

- Uso de imágenes oficiales y actualizadas
- Usuario no-root para ejecutar la aplicación
- Eliminación de herramientas innecesarias

### Red

- Aislamiento de servicios mediante redes Docker
- Configuración de firewall a nivel de host
- Uso de HTTPS/TLS

### Secrets

- Variables de entorno para datos sensibles
- No incluir secrets en la imagen
- Rotación regular de secrets

## Troubleshooting

### Problemas Comunes

#### 1. Contenedor no inicia

```bash
# Ver logs del contenedor
docker-compose logs app

# Ver estado de los contenedores
docker-compose ps
```

#### 2. Error de conexión a la base de datos

```bash
# Verificar conexión
docker-compose exec postgres psql -U postgres -d restaurant_crm -c "SELECT 1;"

# Ver logs de PostgreSQL
docker-compose logs postgres
```

#### 3. Error de permisos

```bash
# Verificar permisos de volúmenes
ls -la public/uploads/
ls -la backups/

# Corregir permisos
sudo chown -R 1001:1001 public/uploads/
sudo chown -R 1001:1001 backups/
```

#### 4. Imagen no se construye

```bash
# Construir sin caché
docker build --no-cache -t crm-restaurant:latest .

# Ver logs de construcción
docker build --progress=plain -t crm-restaurant:latest .
```

### Depuración

Para depurar problemas:

1. Ver logs de todos los servicios
2. Verificar estado de los contenedores
3. Probar conexión entre servicios
4. Verificar configuración de red
5. Revisar variables de entorno

## Actualización

### Actualización de la Aplicación

```bash
# Descargar cambios
git pull origin main

# Reconstruir imagen
docker-compose build --no-cache

# Reiniciar servicios
docker-compose up -d

# Ejecutar migraciones
./scripts/migrate.sh
```

### Actualización de Dependencias

```bash
# Reconstruir con nuevas dependencias
docker-compose build --no-cache

# Reiniciar servicios
docker-compose up -d
```

## Integración con EasyPanel

La aplicación está preparada para despliegue en EasyPanel mediante el archivo `easypanel.json`.

### Configuración

1. Importar configuración desde `easypanel.json`
2. Configurar variables de entorno
3. Configurar dominio y SSL
4. Activar backups automáticos

### Monitoreo

EasyPanel proporciona:
- Métricas de recursos
- Logs centralizados
- Health checks
- Alertas configurables

---

Para más información, consultar la [guía de despliegue](DEPLOYMENT.md).