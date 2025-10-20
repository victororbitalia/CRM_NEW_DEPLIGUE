# 🚀 Guía de Despliegue con tu Base de Datos Existente

## ⚡ Despliegue en 10 minutos con tu PostgreSQL actual

---

## 🎯 Resumen para tu caso específico

- **Base de datos**: Ya existe (`ibidem_bot`)
- **Conexión**: `postgres://postgres:Trafalgar50!P@ibidem_bot_postgres:5432/ibidem_bot?sslmode=disable`
- **Resultado**: Se crearán las tablas del CRM en tu BD existente

---

## 📋 Pasos Exactos

### Paso 1: Preparar Código (2 minutos)

1. **Verificar que tienes los archivos creados**:
   - `prisma/migrations.js` ✅
   - `Dockerfile` actualizado ✅
   - `.dockerignore` ✅

2. **Subir a GitHub**:
   ```bash
   git add .
   git commit -m "Preparar para despliegue con BD existente"
   git push origin main
   ```

### Paso 2: Crear Aplicación en Easypanel (5 minutos)

1. **En Easypanel**:
   - `Create` → `App`
   - **Source**: GitHub → selecciona tu repositorio
   - **Branch**: `main`

2. **Configuración**:
   - **Build Method**: Docker (automático)
   - **Dockerfile**: `./Dockerfile`
   - **Port**: `3000`

3. **Variables de Entorno** (¡IMPORTANTE!):
   ```
   NODE_ENV=production
   DATABASE_URL=postgres://postgres:Trafalgar50!P@ibidem_bot_postgres:5432/ibidem_bot?sslmode=disable
   JWT_SECRET=genera_una_clave_super_segura_aqui_minimo_32_caracteres
   REFRESH_TOKEN_SECRET=genera_otra_clave_super_segura_aqui_minimo_32_caracteres
   NEXT_PUBLIC_APP_URL=https://tu-app.easypanel.host
   ```

4. **Deploy**:
   - Click en `Deploy`
   - Espera 3-5 minutos

### Paso 3: Verificación (3 minutos)

1. **Esperar 2-3 minutos** después del deploy
2. **Probar URLs**:
   - App: `https://tu-app.easypanel.host`
   - Health: `https://tu-app.easypanel.host/api/health`

3. **Verificar en tu base de datos**:
   ```sql
   -- Conéctate a tu BD ibidem_bot
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

---

## 🔍 Qué Sucederá Exactamente

### ✅ Lo que SÍ sucederá:
1. **Conexión** a tu BD `ibidem_bot`
2. **Creación automática de tablas**:
   - `users`, `user_profiles`, `roles`, `user_roles`
   - `restaurants`, `areas`, `tables`
   - `reservations`, `customers`
   - Y todas las demás tablas del CRM
3. **Inserción de datos iniciales** (si existe seed)
4. **App funcionando** con tu BD existente

### ❌ Lo que NO sucederá:
1. **NO se creará una nueva base de datos**
2. **NO se modificarán datos existentes** en tu BD
3. **NO se crearán servicios PostgreSQL** en Easypanel

---

## 📊 Estructura Final en tu Base de Datos

Después del deploy, tu BD `ibidem_bot` tendrá:

```sql
-- Tablas del sistema
users
user_profiles
roles
user_roles
user_sessions
api_tokens
activity_logs

-- Tablas del restaurante
restaurants
operating_hours
restaurant_settings
business_rules

-- Tablas de gestión
areas
tables
table_maintenance

-- Tablas de reservas
customers
reservations
waitlist_entries
reservation_notifications
```

---

## 🚨 Puntos Críticos

### 1. **Variables de Entorno OBLIGATORIAS**:
```
DATABASE_URL=postgres://postgres:Trafalgar50!P@ibidem_bot_postgres:5432/ibidem_bot?sslmode=disable
JWT_SECRET=clave_super_segura_minimo_32_caracteres
REFRESH_TOKEN_SECRET=otra_clave_super_segura_minimo_32_caracteres
```

### 2. **Conectividad**:
- Asegúrate que `ibidem_bot_postgres` sea accesible desde Easypanel
- Verifica firewall y red

### 3. **Seguridad**:
- Considera cambiar la contraseña de BD
- Usa variables secretas en Easypanel para mayor seguridad

---

## 🔧 Si Algo Falla

### Build Falla:
```bash
# Verificar localmente
npm run build
```

### App No Inicia:
1. **Revisar logs en Easypanel**
2. **Verificar DATABASE_URL exacta**
3. **Probar conexión manual**:
   ```bash
   # Desde cualquier lugar con acceso a la BD
   psql "postgres://postgres:Trafalgar50!P@ibidem_bot_postgres:5432/ibidem_bot?sslmode=disable"
   ```

### Tablas No se Crean:
1. **Verificar logs del contenedor**
2. **Revisar permisos del usuario postgres**
3. **Ejecutar migración manual**:
   ```bash
   # En el contenedor de la app
   node prisma/migrations.js
   ```

---

## ✅ Checklist Final

- [ ] Código subido a GitHub
- [ ] Variables de entorno configuradas con tu DATABASE_URL
- [ ] JWT_SECRET y REFRESH_TOKEN_SECRET generados
- [ ] App creada en Easypanel (SIN crear BD)
- [ ] Deploy completado
- [ ] Health check funcionando
- [ ] Tablas creadas en tu BD `ibidem_bot`
- [ ] App accesible en URL pública

---

## 🎉 Resultado Final

Al completar estos pasos tendrás:

✅ **CRM Restaurante funcionando** con tu base de datos existente
✅ **URL pública**: `https://tu-app.easypanel.host`
✅ **Tablas creadas** automáticamente en `ibidem_bot`
✅ **Sin costos adicionales** de base de datos
✅ **Control total** de tus datos
✅ **Listo para usar** inmediatamente

---

## 🔄 Actualizaciones Futuras

Para actualizar tu app:
```bash
git add .
git commit -m "Actualización"
git push
```

Easypanel actualizará automáticamente (si activas Auto-Deploy).

---

## 🆘 Soporte Rápido

Si tienes problemas:
1. **Revisa logs en Easypanel**
2. **Verifica DATABASE_URL exacta**
3. **Confirma conectividad a `ibidem_bot_postgres`**
4. **Consulta `CONFIGURACION_BDD_EXISTENTE.md`**

---

**¡Tu CRM estará funcionando con tu base de datos existente en 10 minutos!** 🚀

*Esta guía está específicamente diseñada para tu caso con base de datos PostgreSQL existente.*