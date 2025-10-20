#!/bin/bash

# Script de despliegue automatizado para Easypanel
# Uso: ./scripts/deploy-easypanel.sh [dominio-opcional]

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Configuración
DOMAIN=${1:-"tu-app.easypanel.host"}
APP_NAME="crm-restaurant"

print_header "🚀 Despliegue de CRM Restaurante en Easypanel"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Verificar que Docker está disponible
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado o no está en el PATH"
    exit 1
fi

# Verificar que git está configurado
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Este no es un repositorio Git. Inicializa git primero."
    exit 1
fi

print_status "📋 Verificando archivos necesarios..."

# Verificar archivos críticos
REQUIRED_FILES=(
    "Dockerfile"
    "package.json"
    "prisma/schema.prisma"
    "prisma/migrations.js"
    "next.config.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Archivo crítico faltante: $file"
        exit 1
    fi
done

print_status "✅ Todos los archivos críticos encontrados"

# Verificar configuración de Next.js
if ! grep -q "output: 'standalone'" next.config.ts; then
    print_error "next.config.ts debe tener 'output: 'standalone'"
    exit 1
fi

print_status "✅ Configuración de Next.js verificada"

# Build local para verificar que todo funciona
print_status "🔨 Verificando build local..."

# Instalar dependencias
print_status "📦 Instalando dependencias..."
npm ci

# Generar cliente Prisma
print_status "🗄️ Generando cliente Prisma..."
npx prisma generate

# Build de la aplicación
print_status "🏗️ Construyendo aplicación..."
if ! npm run build; then
    print_error "El build falló. Revisa los errores arriba."
    exit 1
fi

print_status "✅ Build local exitoso"

# Verificar health check local
print_status "🏥 Verificando health check..."
if command -v curl &> /dev/null; then
    # Iniciar la aplicación temporalmente para verificar health check
    print_status "Iniciando aplicación temporalmente para verificar health check..."
    npm start &
    APP_PID=$!
    
    # Esperar a que la aplicación inicie
    sleep 10
    
    # Verificar health check
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "✅ Health check funcionando correctamente"
    else
        print_warning "⚠️ Health check no respondió (puede ser normal si no hay base de datos local)"
    fi
    
    # Detener aplicación
    kill $APP_PID 2>/dev/null || true
    wait $APP_PID 2>/dev/null || true
fi

# Preparar para deploy
print_status "📝 Preparando para despliegue..."

# Verificar si hay cambios pendientes
if [ -n "$(git status --porcelain)" ]; then
    print_status "📋 Se detectaron cambios sin commit"
    
    # Hacer commit automático si se desea
    read -p "¿Quieres hacer commit de los cambios actuales? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Mensaje del commit: " COMMIT_MSG
        if [ -z "$COMMIT_MSG" ]; then
            COMMIT_MSG="Preparar para despliegue en Easypanel - $(date)"
        fi
        git commit -m "$COMMIT_MSG"
        print_status "✅ Cambios commitados"
    fi
fi

# Verificar si hay cambios para hacer push
if [ -n "$(git log origin/main..HEAD --oneline)" ]; then
    print_status "📤 Hay cambios para subir a GitHub"
    
    read -p "¿Quieres hacer push a GitHub ahora? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "📤 Haciendo push a GitHub..."
        git push origin main
        print_status "✅ Push completado"
    fi
else
    print_status "✅ No hay cambios pendientes para subir"
fi

# Resumen y siguientes pasos
print_header "🎉 Preparación Completa"

print_status "✅ Tu proyecto está listo para desplegar en Easypanel"
echo
print_status "📋 Siguientes pasos en Easypanel:"
echo "1. Crea una base de datos PostgreSQL en Easypanel"
echo "2. Crea una nueva aplicación conectada a tu GitHub"
echo "3. Configura las variables de entorno:"
echo "   - DATABASE_URL (de la base de datos que creaste)"
echo "   - JWT_SECRET (genera una clave segura)"
echo "   - REFRESH_TOKEN_SECRET (genera otra clave segura)"
echo "   - NEXT_PUBLIC_APP_URL=https://$DOMAIN"
echo "4. Haz deploy y espera 3-5 minutos"
echo "5. Tu app estará disponible en: https://$DOMAIN"
echo
print_status "📚 Consulta la documentación creada:"
echo "- GUIA_RAPIDA_DESPLIEGUE.md para pasos rápidos"
echo "- PLAN_DESPLIEGUE_EASYPANEL.md para detalles completos"
echo "- DIAGRAMA_DESPLIEGUE.md para visualización del proceso"
echo
print_warning "⚠️ No olvides:"
echo "- Crear la base de datos ANTES que la aplicación"
echo "- Configurar las variables de entorno EXACTAMENTE"
echo "- Esperar 2-3 minutos después del deploy para probar"
echo

print_status "🚀 ¡Tu CRM estará en producción en menos de 15 minutos!"