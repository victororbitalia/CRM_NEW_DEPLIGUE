# Guía de Despliegue - CRM Restaurante

Esta guía documenta el proceso completo de despliegue del CRM Restaurante utilizando Docker y EasyPanel.

## Tabla de Contenidos

1. [Requisitos del Servidor](#requisitos-del-servidor)
2. [Configuración del Entorno](#configuración-del-entorno)
3. [Despliegue Local](#despliegue-local)
4. [Despliegue en Producción](#despliegue-en-producción)
5. [Configuración de EasyPanel](#configuración-de-easypanel)
6. [Monitoreo y Logging](#monitoreo-y-logging)
7. [Backup y Recuperación](#backup-y-recuperación)
8. [Troubleshooting](#troubleshooting)
9. [Checklist de Pre-despliegue](#checklist-de-pre-despliegue)

## Requisitos del Servidor

### Mínimos
- **CPU**: 2 núcleos
- **RAM**: 4GB
- **Almacenamiento**: 20GB SSD
- **Sistema Operativo**: Ubuntu 20.04+ o CentOS 8+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Recomendados
- **CPU**: 4 núcleos
- **RAM**: 8GB
- **Almacenamiento**: 50GB SSD
- **Red**: Ancho de banda dedicado

### Software Requerido
- Docker Engine
- Docker Compose
- Git
- Nginx (si no se usa el contenedor)
- EasyPanel (opcional)

## Configuración del Entorno

### 1. Clonar el Repositorio
```bash
git clone https://github.com/your-org/crm-restaurant.git
cd crm-restaurant
```

### 2. Variables de Entorno

Copiar el archivo de ejemplo de variables de entorno:
```bash
cp .env.example .env.local
```

Editar el archivo `.env.production` con los valores adecuados:
```bash
nano .env.production
```

Variables importantes a configurar:
- `DATABASE_URL`: URL de conexión a PostgreSQL
- `JWT_SECRET`: Secreto para tokens JWT (mínimo 32 caracteres)
- `REFRESH_TOKEN_SECRET`: Secreto para tokens de refresco
- `NEXTAUTH_SECRET`: Secreto para NextAuth
- `REDIS_PASSWORD`: Contraseña para Redis
- `EMAIL_*`: Configuración del servidor de correo

### 3. Generar SSL/TLS

Si se usan certificados SSL personalizados:
```bash
mkdir -p docker/nginx/ssl
# Copiar certificados a docker/nginx/ssl/
```

## Despliegue Local

### Para Desarrollo
```bash
# Iniciar servicios de desarrollo
npm run docker:dev

# Ver logs
npm run docker:logs

# Detener servicios
npm run docker:dev:down
```

### Para Producción Local
```bash
# Construir y levantar servicios de producción
npm run docker:prod

# Ver logs de producción
npm run docker:prod:logs

# Detener servicios
npm run docker:prod:down
```

## Despliegue en Producción

### 1. Preparación del Servidor

Instalar Docker y Docker Compose:
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Añadir usuario al grupo docker
sudo usermod -aG docker $USER
```

### 2. Configuración de Firewalls

Abrir puertos necesarios:
```bash
# HTTP
sudo ufw allow 80

# HTTPS
sudo ufw allow 443

# SSH (si es necesario)
sudo ufw allow 22

# Activar firewall
sudo ufw enable
```

### 3. Despliegue Automatizado

Usar el script de despliegue:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 4. Despliegue Manual

```bash
# Descargar código más reciente
git pull origin main

# Construir imagen
docker build -t crm-restaurant:latest .

# Levantar servicios
docker-compose -f docker-compose.prod.yml up -d

# Ejecutar migraciones
npm run migrate:prod
```

## Configuración de EasyPanel

### 1. Instalación de EasyPanel

```bash
bash <(curl -sSL https://easypanel.io/install.sh)
```

### 2. Configuración del Proyecto

1. Acceder a EasyPanel en `http://your-server-ip:3000`
2. Crear nuevo proyecto
3. Importar configuración desde `easypanel.json`
4. Configurar variables de entorno
5. Configurar dominio y SSL

### 3. Configuración de Servicios

En EasyPanel, configurar los siguientes servicios:
- **Aplicación**: Imagen `crm-restaurant:latest`
- **Base de Datos**: PostgreSQL 15
- **Caché**: Redis 7
- **Proxy**: Nginx

## Monitoreo y Logging

### Logs de la Aplicación

Ver logs en tiempo real:
```bash
docker-compose -f docker-compose.prod.yml logs -f app
```

Ver logs de todos los servicios:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Health Checks

Verificar estado de la aplicación:
```bash
curl http://localhost:3000/api/health
```

### Métricas de Rendimiento

La aplicación expone métricas en:
- CPU y memoria: Disponibles via Docker stats
- Base de datos: Métricas de PostgreSQL
- Aplicación: Logs estructurados con información de rendimiento

## Backup y Recuperación

### Backup Automático

Los backups se realizan automáticamente según la configuración en `docker/crontab`.

### Backup Manual

```bash
# Ejecutar script de backup
./scripts/backup.sh

# Ver backups existentes
ls -la backups/
```

### Recuperación

```bash
# Detener aplicación
docker-compose -f docker-compose.prod.yml down

# Restaurar base de datos
gunzip -c backups/backup_YYYYMMDD_HHMMSS.sql.gz | psql -h postgres -U postgres -d restaurant_crm

# Iniciar aplicación
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Problemas Comunes

#### 1. La aplicación no inicia

Verificar logs:
```bash
docker-compose -f docker-compose.prod.yml logs app
```

Posibles causas:
- Variables de entorno incorrectas
- Base de datos no accesible
- Permisos incorrectos

#### 2. Error de conexión a la base de datos

Verificar estado del contenedor de PostgreSQL:
```bash
docker-compose -f docker-compose.prod.yml logs postgres
```

Verificar conexión:
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d restaurant_crm -c "SELECT 1;"
```

#### 3. Error de permisos

Verificar permisos de directorios:
```bash
ls -la public/uploads/
ls -la backups/
```

Corregir permisos:
```bash
sudo chown -R 1001:1001 public/uploads/
sudo chown -R 1001:1001 backups/
```

#### 4. Certificados SSL

Verificar estado de SSL:
```bash
openssl s_client -connect your-domain.com:443
```

Renovar certificados (si se usa Let's Encrypt):
```bash
docker-compose -f docker-compose.prod.yml exec nginx certbot renew
```

### Depuración

Para habilitar modo depuración:
```bash
# Agregar a .env.production
NODE_ENV=development
DEBUG=crm-restaurant:*
```

## Checklist de Pre-despliegue

### Seguridad
- [ ] Cambiar todas las contraseñas por defecto
- [ ] Configurar secrets JWT y NextAuth
- [ ] Verificar configuración de firewall
- [ ] Configurar HTTPS/SSL
- [ ] Revisar permisos de archivos

### Base de Datos
- [ ] Configurar contraseña de PostgreSQL
- [ ] Verificar conexión a la base de datos
- [ ] Ejecutar migraciones
- [ ] Configurar backups automáticos

### Aplicación
- [ ] Configurar variables de entorno
- [ ] Verificar health checks
- [ ] Probar funcionalidad crítica
- [ ] Configurar logging

### Monitoreo
- [ ] Configurar alertas
- [ ] Verificar logs
- [ ] Configurar métricas
- [ ] Probar sistema de backup

### Rendimiento
- [ ] Optimizar imágenes Docker
- [ ] Configurar caché
- [ ] Verificar uso de recursos
- [ ] Probar bajo carga

### Documentación
- [ ] Documentar proceso de despliegue
- [ ] Crear guía de recuperación
- [ ] Documentar variables de entorno
- [ ] Preparar guía de troubleshooting

## Soporte

Para soporte técnico:
1. Revisar logs de la aplicación
2. Consultar esta guía de troubleshooting
3. Verificar issues conocidos en el repositorio
4. Contactar al equipo de desarrollo

---

**Nota**: Esta guía está diseñada para la versión 1.0.0 del CRM Restaurante. Asegúrese de estar utilizando la versión correcta de la documentación.