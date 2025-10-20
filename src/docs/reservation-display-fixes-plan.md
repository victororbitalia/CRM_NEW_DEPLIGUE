# Plan para Corregir la Visualización de Reservas

## Problemas Identificados

1. **Formato de fecha y hora**: Las fechas se muestran en formato ISO (`2025-10-16T12:00:00.000Z`) en lugar de un formato legible.
2. **Nombre del cliente**: No se muestra el nombre del cliente porque los datos vienen en un objeto `customer` anidado.
3. **Estructura de datos**: La estructura de datos de la API no coincide con lo que espera el componente `ReservationList`.

## Plan de Solución

### 1. Modificar el hook `useReservations`

**Archivo**: `src/hooks/useReservations.ts`

**Cambios necesarios**:
- Transformar los datos de la API al formato esperado por el componente
- Extraer los datos del cliente del objeto `customer` anidado
- Formatear las fechas y horas para que sean legibles
- Asegurar que todos los campos necesarios se estén mapeando correctamente

### 2. Transformación de Datos

En la función `fetchReservations`, modificaremos el procesamiento de los datos:

```typescript
const processedReservations = data.data.map((reservation: any) => {
  // Extraer datos del cliente
  const customer = reservation.customer || {};
  const table = reservation.table || {};
  
  // Formatear fechas y horas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return {
    ...reservation,
    // Datos del cliente
    customerName: customer.firstName && customer.lastName 
      ? `${customer.firstName} ${customer.lastName}` 
      : 'Cliente sin nombre',
    customerEmail: customer.email || '',
    customerPhone: customer.phone || '',
    
    // Datos de la mesa
    tableName: table.name || 'No asignada',
    
    // Fechas y horas formateadas
    date: new Date(reservation.date),
    startTime: formatTime(reservation.startTime),
    endTime: formatTime(reservation.endTime),
    
    // Otras fechas
    createdAt: new Date(reservation.createdAt),
    updatedAt: new Date(reservation.updatedAt),
    confirmedAt: reservation.confirmedAt ? new Date(reservation.confirmedAt) : undefined,
    seatedAt: reservation.seatedAt ? new Date(reservation.seatedAt) : undefined,
    completedAt: reservation.completedAt ? new Date(reservation.completedAt) : undefined,
    cancelledAt: reservation.cancelledAt ? new Date(reservation.cancelledAt) : undefined,
  };
});
```

### 3. Actualización de las Funciones de Creación y Actualización

También necesitaremos actualizar las funciones `createReservation` y `updateReservation` para que transformen los datos de manera similar.

### 4. Pruebas

Después de implementar los cambios, probaremos:
1. Que las reservas se muestren correctamente en la lista
2. Que los nombres de los cliente aparezcan
3. Que las fechas y horas estén en un formato legible
4. Que todas las operaciones (crear, actualizar, eliminar) funcionen correctamente

## Implementación

1. Modificar `src/hooks/useReservations.ts` con las transformaciones de datos
2. Probar la visualización de reservas en la página `/reservations`
3. Verificar que todas las operaciones funcionen correctamente

## Consideraciones Adicionales

- Es importante manejar casos en los que el objeto `customer` o `table` puedan ser nulos
- El formato de fecha y hora debe ser consistente con la configuración regional del usuario
- Debemos asegurarnos de que los cambios no afecten a otras partes de la aplicación que usen el hook `useReservations`