Cannot read properties of undefined (reading 'create')# Guía para Testear la API Localmente

## Requisitos Previos

1. Asegúrate de que el servidor de desarrollo esté ejecutándose:
   ```bash
   npm run dev
   ```

2. La aplicación debe estar accesible en `http://localhost:3000`

## Autenticación

La API requiere un token de autenticación. Hay dos tipos de tokens disponibles:

### 1. Token JWT (para uso en la aplicación web)

Para obtener un token JWT:

#### Método 1: Desde el Navegador

1. Inicia sesión en la aplicación en `http://localhost:3000/login`
2. Abre las herramientas de desarrollador del navegador (F12)
3. Ve a la pestaña "Application" → "Local Storage"
4. Busca una clave llamada `auth_token` o similar
5. Copia el valor del token

#### Método 2: Desde la Consola del Navegador

1. Inicia sesión en la aplicación
2. Abre la consola del navegador (F12 → Console)
3. Ejecuta:
   ```javascript
   localStorage.getItem('auth_token')
   ```
4. Copia el token devuelto

### 2. Token de API (para integraciones externas)

Para obtener un token de API:

1. Inicia sesión en la aplicación en `http://localhost:3000/login`
2. Ve a Configuración → API
3. Haz clic en "Crear nuevo token"
4. Dale un nombre y selecciona el período de expiración
5. Copia el token generado (solo se muestra una vez)

Los tokens de API son ideales para integraciones con sistemas externos, scripts automatizados, o aplicaciones de terceros.

## Endpoints de la API

### Áreas

#### Obtener todas las áreas
```bash
curl -X GET "http://localhost:3000/api/areas?restaurantId=default-restaurant" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

#### Crear un área
```bash
curl -X POST "http://localhost:3000/api/areas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "name": "Área de Prueba",
    "description": "Área creada para pruebas",
    "maxCapacity": 50,
    "restaurantId": "default-restaurant",
    "isActive": true
  }'
```

### Mesas

#### Obtener todas las mesas
```bash
curl -X GET "http://localhost:3000/api/tables?restaurantId=default-restaurant" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

#### Crear una mesa
```bash
curl -X POST "http://localhost:3000/api/tables" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "areaId": "ID_DEL_AREA",
    "number": "Mesa Prueba 99",
    "capacity": 4,
    "shape": "rectangle",
    "positionX": 100,
    "positionY": 100,
    "width": 80,
    "height": 80,
    "isAccessible": false,
    "isActive": true
  }'
```

#### Actualizar una mesa
```bash
curl -X PUT "http://localhost:3000/api/tables/ID_DE_LA_MESA" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "capacity": 6,
    "currentStatus": "available"
  }'
```

#### Eliminar una mesa
```bash
curl -X DELETE "http://localhost:3000/api/tables/ID_DE_LA_MESA" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Reservas

#### Obtener todas las reservas
```bash
curl -X GET "http://localhost:3000/api/reservations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

#### Crear una reserva
```bash
curl -X POST "http://localhost:3000/api/reservations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "tableId": "ID_DE_LA_MESA",
    "customerName": "Cliente de Prueba",
    "customerPhone": "600123456",
    "partySize": 4,
    "date": "2025-10-17",
    "startTime": "20:00",
    "endTime": "22:00",
    "status": "confirmed",
    "specialRequests": "Mesa cerca de la ventana",
    "occasion": "birthday"
  }'
```

#### Obtener una reserva específica
```bash
curl -X GET "http://localhost:3000/api/reservations/ID_DE_LA_RESERVA" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

#### Actualizar una reserva
```bash
curl -X PUT "http://localhost:3000/api/reservations/ID_DE_LA_RESERVA" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "partySize": 6,
    "status": "seated",
    "specialRequests": "Mesa actualizada - cerca de la ventana y con silla alta"
  }'
```

#### Cancelar una reserva
```bash
curl -X PUT "http://localhost:3000/api/reservations/ID_DE_LA_RESERVA" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "status": "cancelled"
  }'
```

#### Eliminar una reserva
```bash
curl -X DELETE "http://localhost:3000/api/reservations/ID_DE_LA_RESERVA" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## Flujo de Prueba Completo

1. **Inicia sesión** en la aplicación para obtener un token
2. **Obén el token** desde el localStorage como se explicó arriba
3. **Reemplaza `TU_TOKEN_AQUI`** en los comandos con tu token real
4. **Ejecuta los comandos en orden** para probar el flujo completo:
   - Obtener áreas
   - Crear un área (si no hay ninguna)
   - Obtener mesas
   - Crear una mesa
   - Obtener reservas
   - Crear una reserva
   - Obtener la reserva específica
   - Actualizar la reserva
   - Cambiar el estado de la mesa
   - Cancelar la reserva
   - Eliminar la reserva
   - Eliminar la mesa

## Herramientas Alternativas

### Postman

1. Importa los endpoints en Postman
2. Configura una variable de entorno `token` con tu token JWT
3. Usa `{{token}}` en el header de autorización
4. Crea una colección con todos los endpoints

### VS Code REST Client

Crea un archivo `api-test.http` con el siguiente contenido:

```http
### Variables
@baseUrl = http://localhost:3000/api
@token = TU_TOKEN_AQUI

### Obtener áreas
GET {{baseUrl}}/areas?restaurantId=default-restaurant
Content-Type: application/json
Authorization: Bearer {{token}}

### Crear mesa
POST {{baseUrl}}/tables
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "areaId": "ID_DEL_AREA",
  "number": "Mesa Prueba 99",
  "capacity": 4,
  "shape": "rectangle"
}
```

## Verificación

Después de ejecutar las pruebas, verifica:

1. Que todas las peticiones devuelvan un código de estado adecuado (200, 201, etc.)
2. Que los datos se creen, actualicen y eliminen correctamente
3. Que la interfaz web refleje los cambios realizados a través de la API

## Problemas Comunes

1. **Token inválido o expirado**: Vuelve a iniciar sesión y obtén un nuevo token
2. **CORS**: Asegúrate de que las peticiones se hagan desde `localhost:3000` o que el servidor esté configurado para aceptar peticiones desde tu origen
3. **Base de datos no conectada**: Verifica que el servidor de base de datos esté funcionando

## Notas Finales

- Los IDs devueltos por la API deben usarse en las peticiones subsiguientes
- Las fechas deben estar en formato YYYY-MM-DD
- Las horas deben estar en formato HH:MM (24h)
- Algunos endpoints pueden requerir permisos específicos según el rol del usuario