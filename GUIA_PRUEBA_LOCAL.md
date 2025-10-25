# 🧪 GUÍA DE PRUEBA LOCAL ANTES DEL DESPLIEGUE

## 🎯 OBJETIVO
Validar que las correcciones funcionan correctamente antes de hacer push a producción.

## 📋 REQUISITOS
- Docker instalado en tu máquina local
- Node.js 20+ instalado
- Acceso a la base de datos PostgreSQL

## 🔄 PASOS PARA PRUEBA LOCAL

### 1. **CONSTRUIR IMAGEN DOCKER LOCAL**

```bash
# Desde la raíz del proyecto
docker build -t crm-restaurant-test .
```

### 2. **CORRER CONTENEDOR LOCAL**

```bash
# Variables de entorno para prueba local
docker run -it --rm \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgres://postgres:Trafalgar50!P@localhost:5432/ibidem_bot?sslmode=disable" \
  -e JWT_SECRET="test_secret_32_characters_minimum" \
  -e REFRESH_TOKEN_SECRET="test_refresh_secret_32_chars_min" \
  -e NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="test_auth_secret_32_characters_minimum" \
  -p 3000:3000 \
  crm-restaurant-test
```

### 3. **VERIFICAR RESULTADOS**

#### ✅ Si funciona correctamente:
- Verás logs de migración ejecutándose
- La aplicación iniciará sin errores
- Podrás acceder a `http://localhost:3000/api/health`

#### ❌ Si hay errores:
- Anota el mensaje exacto del error
- Verifica las secciones de diagnóstico abajo

## 🔍 DIAGNÓSTICO DE ERRORES COMUNES

### Error: `server.js not found`
```bash
# Verifica que el archivo exista en el contenedor
docker run --rm crm-restaurant-test ls -la .next/standalone/
```

### Error: `Permission denied`
```bash
# Verifica permisos en el contenedor
docker run --rm crm-restaurant-test ls -la /app/
```

### Error: `Database connection failed`
```bash
# Testea conexión a PostgreSQL directamente
docker run --rm --network host postgres:15-alpine psql "postgres://postgres:Trafalgar50!P@localhost:5432/ibidem_bot" -c "SELECT 1;"
```

## 🛠️ PRUEBA DE MIGRACIONES POR SEPARADO

```bash
# Ejecutar solo las migraciones
docker run --rm \
  -e DATABASE_URL="postgres://postgres:Trafalgar50!P@localhost:5432/ibidem_bot?sslmode=disable" \
  crm-restaurant-test node prisma/migrations.js
```

## 📊 CHECKLIST DE VALIDACIÓN

### ✅ Build Exitoso
- [ ] Imagen Docker se construye sin errores
- [ ] Todos los archivos se copian correctamente
- [ ] Dependencias se instalan sin problemas

### ✅ Runtime Funcional
- [ ] Migraciones se ejecutan sin errores
- [ ] Server.js inicia correctamente
- [ ] Health check responde en `/api/health`
- [ ] Aplicación accesible en `http://localhost:3000`

### ✅ Base de Datos
- [ ] Conexión a PostgreSQL establecida
- [ ] Tablas creadas correctamente
- [ ] Seed data aplicada si es necesario

## 🚨 SOLUCIÓN DE PROBLEMAS

### Si el contenedor no inicia:
1. **Revisa el Dockerfile** - Asegúrate que todas las rutas sean correctas
2. **Verifica las variables de entorno** - Confirma que no haya typos
3. **Valida la conexión a la base de datos** - Testea con psql directamente

### Si las migraciones fallan:
1. **Verifica DATABASE_URL** - Asegúrate que PostgreSQL esté accesible
2. **Revisa el script de migraciones** - Confirma que los comandos sean compatibles con Alpine
3. **Verifica permisos** - Asegúrate que el contenedor pueda escribir en la base de datos

### Si el servidor no inicia:
1. **Verifica la ruta a server.js** - Debe ser `.next/standalone/server.js`
2. **Revisa los logs completos** - Busca errores específicos
3. **Valida el next.config.ts** - Asegúrate que `output: 'standalone'` esté configurado

## 🎯 RESULTADO ESPERADO

Si todo funciona correctamente, deberías ver logs similares a:

```
🔄 Iniciando migración de base de datos...
🔍 Verificando conexión a base de datos...
🏗️ Aplicando schema a la base de datos...
✅ Verificando tablas creadas...
📊 Tablas en la base de datos: users, restaurants, areas, tables, reservations...
🌱 Verificando si se necesitan datos iniciales...
✅ Migración completada exitosamente!
🔌 Conexión a base de datos cerrada
🚀 Proceso de migración finalizado
[Next.js] Starting server...
[Next.js] Ready on http://localhost:3000
```

## 📝 PRÓXIMOS PASOS

Una vez que la prueba local sea exitosa:

1. **Aplica las correcciones al proyecto real**
2. **Haz commit y push a GitHub**
3. **Redespliega en Easypanel**
4. **Verifica el despliegue en producción**

---

## 🏆 CONCLUSIÓN

Esta prueba local validará que:
- Las correcciones del Dockerfile funcionan
- Las variables de entorno son correctas
- El proceso de migraciones es funcional
- La aplicación inicia sin errores

**Si la prueba local funciona, el despliegue en producción debería funcionar también.** 🎯