# Análisis de Problemas en la Vista Layout Mejorada

## Problemas Identificados

### 1. **No se pueden mover las mesas en modo "Mover Mesas"**
- **Causa probable**: El evento `startDraggingTable` está recibiendo parámetros incorrectos
- **Solución**: Corregir la llamada a la función para que coincida con la API del hook

### 2. **Los botones de áreas no funcionan**
- **Causa probable**: La función `handleCenterArea` solo muestra un mensaje en la consola
- **Solución**: Implementar correctamente la función para centrar la vista en el área seleccionada

### 3. **Las mesas no muestran número**
- **Causa probable**: El componente está intentando acceder a una propiedad que no existe
- **Solución**: Asegurar que las mesas tengan la propiedad `number` correctamente definida

### 4. **No se puede ver información de reservas**
- **Causa probable**: Los datos de reservas no se están cargando o asignando correctamente a las mesas
- **Solución**: Implementar la carga y asignación correcta de datos de reservas

## Plan de Solución Detallado

### 1. **Corregir el movimiento de mesas**
```typescript
// Problema actual:
startDraggingTable(tableId, e);

// Solución:
startDraggingTable(tableId, e);
```
El problema está en cómo se está llamando a la función. Necesitamos verificar la API exacta del hook `useUnifiedTableLayout`.

### 2. **Implementar navegación a áreas**
```typescript
// Problema actual:
const handleCenterArea = useCallback((areaId: string) => {
  console.log('Center on area:', areaId);
}, []);

// Solución:
const handleCenterArea = useCallback((areaId: string) => {
  const areaPosition = state.areaPositions[areaId];
  if (!areaPosition) return;
  
  // Calcular centro del área
  const centerX = areaPosition.x + areaPosition.width / 2;
  const centerY = areaPosition.y + areaPosition.height / 2;
  
  // Centrar vista en esa posición
  dispatch({
    type: 'SET_OFFSET',
    payload: {
      offsetX: (window.innerWidth / 2 - centerX * state.scale) / state.scale,
      offsetY: (window.innerHeight / 2 - centerY * state.scale) / state.scale,
    }
  });
}, [state.areaPositions, state.scale]);
```

### 3. **Asegurar que las mesas muestren el número**
```typescript
// Problema actual:
<div className="text-xs font-bold">{table.number}</div>

// Solución:
<div className="text-xs font-bold">{table.number || `Mesa ${table.id}`}</div>
```

### 4. **Cargar y mostrar datos de reservas**
```typescript
// Problema actual:
const { reservations } = useReservations();

// Solución:
const { reservations } = useReservations({ 
  date: new Date().toISOString().split('T')[0]
});

// Asignar reservas a las mesas
const tablesWithReservations = tables.map(table => {
  const reservation = reservations.find(r => r.tableId === table.id);
  return {
    ...table,
    currentReservation: reservation,
    currentStatus: reservation ? 'reserved' : 'available'
  };
});
```

## Implementación por Fases

### Fase 1: Corregir problemas básicos (30 minutos)
1. Corregir el movimiento de mesas
2. Asegurar que las mesas muestren el número
3. Implementar navegación básica a áreas

### Fase 2: Integrar datos de reservas (45 minutos)
1. Cargar correctamente los datos de reservas
2. Asignar reservas a las mesas
3. Mostrar información básica de reservas en las mesas

### Fase 3: Mejorar la experiencia de usuario (30 minutos)
1. Implementar el menú contextual correctamente
2. Asegurar que el doble clic abra los detalles
3. Mejorar la visualización de información

## Componentes a Modificar

### 1. ImprovedTableLayout.tsx
- Corregir la llamada a `startDraggingTable`
- Implementar correctamente `handleCenterArea`
- Asegurar que las mesas muestren el número
- Integrar datos de reservas

### 2. LayoutControls.tsx
- Verificar que la función `onCenterArea` se esté llamando correctamente

### 3. TableContextMenu.tsx
- Asegurar que el menú contextual se muestre en la posición correcta
- Implementar correctamente las acciones del menú

## Pruebas a Realizar

### 1. Prueba de movimiento de mesas
- Cambiar a modo "Mover Mesas"
- Intentar arrastrar una mesa
- Verificar que la mesa se mueva y guarde la posición

### 2. Prueba de navegación a áreas
- Hacer clic en los botones de áreas
- Verificar que la vista se centre en el área seleccionada

### 3. Prueba de visualización de información
- Verificar que las mesas muestren su número
- Verificar que las mesas con reservas muestren la información
- Probar el menú contextual y el doble clic

## Consideraciones Adicionales

### 1. **Errores de autenticación**
Los logs muestran muchos errores 401 en las llamadas a `/api/reservations`. Esto puede deberse a que el usuario no está autenticado correctamente o el token ha expirado.

### 2. **Tipos de datos**
Hay inconsistencias entre los tipos de datos de las mesas en diferentes partes del código. Necesitamos asegurar que todos los componentes usen los mismos tipos.

### 3. **Rendimiento**
La vista layout puede volverse lenta con muchas mesas. Deberíamos considerar implementar virtualización si es necesario.

## Próximos Pasos

1. **Analizar el hook `useUnifiedTableLayout`** para entender su API exacta
2. **Verificar el hook `useReservations`** para entender cómo cargar los datos
3. **Corregir los problemas identificados** en orden de importancia
4. **Probar cada corrección** antes de pasar a la siguiente
5. **Documentar los cambios** para futuras referencias

¿Estás de acuerdo con este plan? ¿Hay algún problema que crees que debería priorizarse sobre los demás?