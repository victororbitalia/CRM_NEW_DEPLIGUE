#!/bin/bash

echo "🚀 Iniciando pruebas de despliegue local..."

# Colores para salida
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar si un comando se ejecutó correctamente
check_command() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 exitoso${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 falló${NC}"
        return 1
    fi
}

# 1. Limpiar instalación previa
echo -e "${YELLOW}🧹 Limpiando instalación previa...${NC}"
rm -rf node_modules package-lock.json .next

# 2. Instalar dependencias
echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
npm install
check_command "Instalación de dependencias" || exit 1

# 3. Generar cliente Prisma
echo -e "${YELLOW}🔧 Generando cliente Prisma...${NC}"
npx prisma generate
check_command "Generación de cliente Prisma" || exit 1

# 4. Verificar TypeScript
echo -e "${YELLOW}🔍 Verificando tipos TypeScript...${NC}"
npm run type-check
check_command "Verificación de tipos" || exit 1

# 5. Construir aplicación
echo -e "${YELLOW}🏗️ Construyendo aplicación...${NC}"
npm run build
check_command "Construcción de la aplicación" || exit 1

# 6. Iniciar aplicación en modo producción (background)
echo -e "${YELLOW}🚀 Iniciando aplicación en modo producción...${NC}"
npm start &
APP_PID=$!

# Esperar a que la aplicación inicie
echo -e "${YELLOW}⏳ Esperando a que la aplicación inicie...${NC}"
sleep 10

# 7. Probar health check
echo -e "${YELLOW}🏥 Probando health check...${NC}"
curl -f http://localhost:3000/api/health
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Health check exitoso${NC}"
else
    echo -e "${RED}❌ Health check falló${NC}"
    kill $APP_PID
    exit 1
fi

# 8. Probar página principal
echo -e "${YELLOW}🌐 Probando página principal...${NC}"
curl -f http://localhost:3000/
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Página principal responde correctamente${NC}"
else
    echo -e "${RED}❌ Página principal falló${NC}"
    kill $APP_PID
    exit 1
fi

# 9. Detener aplicación
echo -e "${YELLOW}🛑 Deteniendo aplicación...${NC}"
kill $APP_PID

echo -e "${GREEN}🎉 Todas las pruebas pasaron correctamente!${NC}"
echo -e "${YELLOW}📝 Los siguientes cambios están listos para desplegar:${NC}"
echo "   - Dependencias actualizadas en package.json"
echo "   - Componente Sidebar con directiva 'use client'"
echo "   - Next.js configurado en modo standalone"
echo "   - Dockerfile optimizado para producción"
echo "   - Configuración de Tailwind CSS v4 corregida"
echo "   - Health check implementado"

echo -e "${YELLOW}🚀 Ahora puedes hacer commit y push a GitHub para desplegar en Easypanel${NC}"