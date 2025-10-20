# Resumen de Corrección de Autenticación

## Problema Identificado

El error "Authorization token required" en la gestión de restaurantes era causado porque varios hooks de la aplicación no estaban incluyendo el token de autenticación en las cabeceras de las solicitudes a la API.

## Hooks Modificados

Se han modificado los siguientes hooks para incluir el token de autenticación:

### 1. useRestaurant.ts
- **Estado**: ✅ Modificado
- **Cambios**: Añadida función `getAuthHeaders()` y aplicada a todas las llamadas fetch
- **APIs afectadas**: `/api/restaurants/*`

### 2. useBusinessRules.ts
- **Estado**: ✅ Modificado
- **Cambios**: Añadida función `getAuthHeaders()` y aplicada a todas las llamadas fetch
- **APIs afectadas**: `/api/restaurants/{id}/rules/*`

### 3. useCustomers.ts
- **Estado**: ✅ Modificado
- **Cambios**: Añadida función `getAuthHeaders()` y aplicada a todas las llamadas fetch
- **APIs afectadas**: `/api/customers/*`

### 4. useOperatingHours.ts
- **Estado**: ✅ Modificado
- **Cambios**: Añadida función `getAuthHeaders()` y aplicada a todas las llamadas fetch
- **APIs afectadas**: `/api/restaurants/{id}/hours/*`

### 5. useMaintenance.ts
- **Estado**: ✅ Modificado
- **Cambios**: Añadida función `getAuthHeaders()` y aplicada a todas las llamadas fetch
- **APIs afectadas**: `/api/tables/maintenance/*`

### 6. useRestaurantSettings.ts
- **Estado**: ✅ Modificado
- **Cambios**: Añadida función `getAuthHeaders()` y aplicada a todas las llamadas fetch
- **APIs afectadas**: `/api/restaurants/{id}/settings/*`

### 7. useWaitlist.ts
- **Estado**: ✅ Modificado
- **Cambios**: Añadida función `getAuthHeaders()` y aplicada a todas las llamadas fetch
- **APIs afectadas**: `/api/reservations/waitlist/*`

## Hooks que No Necesitaban Modificación

### 1. useReservations.ts
- **Estado**: ✅ Ya incluía autenticación manual
- **Método**: Usaba función `getToken()` manual en cada llamada

### 2. useTables.ts
- **Estado**: ✅ Ya incluía autenticación
- **Método**: Usa el cliente API (`apiClient`) que maneja la autenticación automáticamente

## Implementación

La solución consistió en añadir una función helper en cada hook modificado:

```typescript
const getAuthHeaders = useCallback((): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}, []);
```

Y luego aplicarla en todas las llamadas fetch:

```typescript
const response = await fetch('/api/endpoint', {
  headers: {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  },
});
```

## Verificación

- **Antes**: Las llamadas a `/api/restaurants` devolvían `401 Unauthorized`
- **Después**: Las llamadas a `/api/restaurants` devuelven `200 OK`

## Recomendaciones Futuras

1. **Centralizar la autenticación**: Considerar crear un cliente API unificado que todos los hooks puedan usar
2. **Manejo de errores**: Implementar mejor manejo de errores de autenticación (redirección al login)
3. **Refresco automático de token**: Implementar refresco automático cuando el token expire

## Archivos Modificados

```
src/hooks/useRestaurant.ts
src/hooks/useBusinessRules.ts
src/hooks/useCustomers.ts
src/hooks/useOperatingHours.ts
src/hooks/useMaintenance.ts
src/hooks/useRestaurantSettings.ts
src/hooks/useWaitlist.ts