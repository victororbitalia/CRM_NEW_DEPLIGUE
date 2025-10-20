# Plan para Deshabilitar Temporalmente la Funcionalidad de Layout Visual de Mesas

## Objetivo
Deshabilitar temporalmente la funcionalidad de layout visual de mesas para simplificar el sistema y asegurar que todo funcione correctamente. Esta funcionalidad se reactivará en el futuro.

## Componentes a Deshabilitar

### 1. Componentes Principales de Layout
- `src/components/tables/ImprovedTableLayout.tsx` - Componente actualmente en uso
- `src/components/tables/TableLayout.tsx` - Componente original
- `src/components/tables/UnifiedTableLayout.tsx` - Versión unificada

### 2. Hooks Relacionados
- `src/hooks/useUnifiedTableLayout.ts` - Hook principal para el layout
- `src/hooks/useLayoutSync.ts` - Hook para sincronización
- `src/hooks/useTableLayout.ts` - Hook alternativo de layout

### 3. Componentes de Soporte
- `src/components/tables/LayoutControls.tsx` - Controles del layout
- `src/components/tables/TableContextMenu.tsx` - Menú contextual
- `src/components/tables/TableDetailsModal.tsx` - Modal de detalles
- `src/components/tables/ReservationTimer.tsx` - Temporizador de reservas

## Cambios Necesarios

### 1. En `src/app/tables/page.tsx`
- [ ] Eliminar el estado `viewMode` y relacionado con el layout
- [ ] Eliminar los botones de cambio de vista (grid/layout)
- [ ] Eliminar la renderización condicional del componente de layout
- [ ] Eliminar las importaciones de los componentes de layout
- [ ] Eliminar los manejadores de eventos relacionados con el layout

### 2. En `src/hooks/useTables.ts`
- [ ] Eliminar el parámetro `viewMode` de las opciones
- [ ] Eliminar la lógica condicional basada en `viewMode`
- [ ] Simplificar el método `updateTablePosition`

### 3. Conservar la Vista de Grid
- [ ] Asegurar que la vista de grid funcione correctamente sin dependencias del layout
- [ ] Mantener toda la funcionalidad CRUD de mesas en la vista de grid

## Enfoque de Implementación

### 1. Estrategia de Conservación
En lugar de eliminar completamente los componentes, los renombraremos con el prefijo "_disabled_" para poder reutilizarlos en el futuro:
- `ImprovedTableLayout.tsx` → `_disabled_ImprovedTableLayout.tsx`
- `TableLayout.tsx` → `_disabled_TableLayout.tsx`
- `UnifiedTableLayout.tsx` → `_disabled_UnifiedTableLayout.tsx`
- Y así con el resto de componentes.

### 2. Mantener la Estructura de Datos
No modificaremos la estructura de datos de las mesas (posición, tamaño, etc.) para facilitar la reactivación de esta funcionalidad en el futuro.

### 3. Actualizaciones de Código
- Comentaremos las importaciones en lugar de eliminarlas
- Mantendremos la estructura de los componentes pero deshabilitaremos su uso
- Documentaremos los cambios con comentarios claros

## Pasos de Implementación

1. **Renombrar componentes de layout** con el prefijo "_disabled_"
2. **Modificar `src/app/tables/page.tsx`**:
   - Eliminar estado `viewMode`
   - Eliminar botones de cambio de vista
   - Eliminar renderizado condicional de layout
   - Comentar importaciones de componentes de layout
3. **Modificar `src/hooks/useTables.ts`**:
   - Eliminar parámetro `viewMode`
   - Simplificar lógica relacionada
4. **Verificar que no haya rotas de código** al eliminar estas funcionalidades
5. **Probar que la vista de grid funcione correctamente**
6. **Documentar los cambios realizados**

## Reactivación Futura

Para reactivar esta funcionalidad en el futuro:
1. Renombrar los componentes quitando el prefijo "_disabled_"
2. Restaurar las importaciones comentadas
3. Restaurar el estado `viewMode` en `src/app/tables/page.tsx`
4. Restaurar los botones de cambio de vista
5. Restaurar el parámetro `viewMode` en `src/hooks/useTables.ts`
6. Restaurar la renderización condicional del componente de layout

## Beneficios Esperados

- Simplificación del sistema
- Reducción de posibles errores
- Mejora del rendimiento
- Facilitación del mantenimiento
- Conservación del código para uso futuro

## Riesgos Mitigados

- Pérdida de código importante (mitigado mediante renombrado en lugar de eliminación)
- Dificultad para reactivar la funcionalidad (mitigado mediante documentación clara)
- Errores en la vista de grid (mitigado mediante pruebas exhaustivas)