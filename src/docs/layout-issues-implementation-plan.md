# Plan de Implementación para Corregir Problemas del Layout

## Problemas Identificados y Soluciones Propuestas

### 1. **Problema: No se pueden mover las mesas en modo "Mover Mesas"**
- **Causa**: La función `startDraggingTable` está siendo llamada con parámetros incorrectos
- **Solución**: Corregir la llamada para que coincida con la API del hook

### 2. **Problema: Los botones de áreas no funcionan**
- **Causa**: La función `handleCenterArea` solo muestra un mensaje en la consola
- **Solución**: Implementar correctamente la función para centrar la vista

### 3. **Problema: Las mesas no muestran número**
- **Causa**: Posible problema con los tipos de datos o propiedades
- **Solución**: Asegurar que las mesas tengan la propiedad `number` correctamente definida

### 4. **Problema: No se puede ver información de reservas**
- **Causa**: Los datos de reservas no se están cargando o asignando correctamente
- **Solución**: Corregir la carga y asignación de datos de reservas

## Implementación Detallada

### Paso 1: Corregir movimiento de mesas
```typescript
// En ImprovedTableLayout.tsx
const handleMouseDown = useCallback(
  (e: React.MouseEvent, tableId: string) => {
    if (!editable) return;
    
    // Solo permitir dragging en move mode
    if (interactionMode !== 'move') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    startDraggingTable(tableId, e);
  },
  [editable, interactionMode, startDraggingTable]
);
```

### Paso 2: Implementar navegación a áreas
```typescript
// En ImprovedTableLayout.tsx
const handleCenterArea = useCallback((areaId: string) => {
  const areaPosition = state.areaPositions[areaId];
  if (!areaPosition) return;
  
  // Calcular centro del área
  const centerX = areaPosition.x + areaPosition.width / 2;
  const centerY = areaPosition.y + areaPosition.height / 2;
  
  // Centrar vista en esa posición
  const offsetX = (window.innerWidth / 2 - centerX * state.scale) / state.scale;
  const offsetY = (window.innerHeight / 2 - centerY * state.scale) / state.scale;
  
  dispatch({
    type: 'SET_OFFSET',
    payload: { offsetX, offsetY }
  });
}, [state.areaPositions, state.scale]);
```

### Paso 3: Asegurar que las mesas muestren el número
```typescript
// En ImprovedTableLayout.tsx
<div className="text-xs font-bold">{table.number || `Mesa ${table.id}`}</div>
```

### Paso 4: Corregir carga de reservas
```typescript
// En ImprovedTableLayout.tsx
const { reservations } = useReservations({ 
  date: new Date().toISOString().split('T')[0]
});

// Añadir logs para depuración
useEffect(() => {
  console.log('Reservations loaded:', reservations);
  console.log('Tables:', tables);
}, [reservations, tables]);
```

## Prioridad de Implementación

1. **Alta**: Corregir movimiento de mesas (funcionalidad básica)
2. **Alta**: Asegurar que las mesas muestren el número (UX básica)
3. **Media**: Implementar navegación a áreas (mejora de UX)
4. **Media**: Corregir carga de reservas (funcionalidad avanzada)

## Consideraciones Adicionales

1. **Errores de autenticación**: Los logs muestran muchos errores 401 en `/api/reservations`
   - Esto podría impedir la carga de datos de reservas
   - Necesitamos verificar el estado de autenticación

2. **Tipos de datos**: Hay inconsistencias entre los tipos de `Table` en diferentes hooks
   - Necesitamos estandarizar los tipos para evitar errores

3. **Depuración**: Añadiremos logs adicionales para identificar problemas
   - Esto nos ayudará a entender qué está sucediendo internamente

## Pruebas a Realizar

1. **Prueba de movimiento de mesas**
   - Cambiar a modo "Mover Mesas"
   - Intentar arrastrar una mesa
   - Verificar que se mueva y guarde la posición

2. **Prueba de navegación a áreas**
   - Hacer clic en los botones de áreas
   - Verificar que la vista se centre en el área seleccionada

3. **Prueba de visualización de información**
   - Verificar que las mesas muestren su número
   - Verificar que las mesas con reservas muestren la información

4. **Prueba de menú contextual**
   - Hacer clic derecho en una mesa
   - Verificar que aparezca el menú contextual
   - Probar las diferentes opciones del menú

## Siguientes Pasos

1. **Obtener tu validación** sobre este plan de implementación
2. **Implementar las correcciones** en orden de prioridad
3. **Probar cada corrección** antes de pasar a la siguiente
4. **Documentar los cambios** realizados

¿Estás de acuerdo con este plan? ¿Hay algún problema que debamos priorizar sobre los demás o alguna corrección que quieras hacer al enfoque?