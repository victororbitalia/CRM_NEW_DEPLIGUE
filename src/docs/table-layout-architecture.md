# Arquitectura de Solución para Gestión de Layout de Mesas

## Problemas Identificados

1. **Doble gestión de estados**: `useTableLayout` y `TableLayout` manejan estados duplicados de posición
2. **Falta de sincronización**: Los cambios en el UI no se persisten correctamente
3. **Problema en el manejo de coordenadas**: Confusión entre coordenadas relativas y absolutas
4. **Conversión incorrecta de coordenadas**: Las posiciones se guardan incorrectamente
5. **Falta de persistencia de estados**: Los cambios se pierden al recargar
6. **Inconsistencia en formatos**: Diferentes formatos de coordenadas en distintos componentes
7. **Falta de manejo de errores**: No hay rollback ante errores de actualización
8. **Eventos pasivos**: Error `Unable to preventDefault inside passive event listener`

## Solución Arquitectónica

### 1. Unificación de la Gestión de Estados

#### Componente Centralizado: `useUnifiedTableLayout`
- **Ubicación**: `/src/hooks/useUnifiedTableLayout.ts`
- **Responsabilidades**:
  - Gestión unificada de todo el estado del layout
  - Coordinación de coordenadas (relativas/absolutas)
  - Manejo de interacciones (drag, zoom, pan)
  - Estado de selección y arrastre

#### Patrón Reductor
```typescript
interface LayoutState {
  coordinateSystem: CoordinateSystem;
  tablePositions: Record<string, TablePosition>;
  areaPositions: Record<string, AreaPosition>;
  selectedTableId: string | null;
  draggedTableId: string | null;
  draggedAreaId: string | null;
  scale: number;
  offset: { x: number; y: number };
  isPanning: boolean;
  isDirty: boolean;
}
```

### 2. Normalización de Coordenadas

#### Sistema de Coordenadas Unificado
- **Tipo**: Coordenadas relativas por defecto (configurable a absolutas)
- **Conversión Automática**: 
  - `convertDbToLayoutCoordinates()`: DB → Layout
  - `convertLayoutToDbCoordinates()`: Layout → DB
- **Origen Coordenadas**: Esquina superior izquierda del contenedor principal

#### Manejo de Áreas
- Las áreas tienen posiciones absolutas en el layout
- Las mesas tienen posiciones relativas a su área
- Conversión automática al persistir en BD

### 3. Sistema de Sincronización Bidireccional

#### Hook: `useLayoutSync`
- **Ubicación**: `/src/hooks/useLayoutSync.ts`
- **Responsabilidades**:
  - Sincronización con backend
  - Optimistic updates
  - Rollback automático ante errores
  - Gestión de cambios pendientes

#### Flujo de Sincronización
```
Usuario mueve mesa → Actualización inmediata (optimistic) → Auto-guardado → Confirmación/Rollback
```

### 4. Estrategia de Manejo de Errores con Rollback

#### Estados Originales
- Guardado automático del estado original antes de cambios
- Almacenamiento en `Map<string, Partial<Table>>`

#### Rollback Automático
- Si falla la sincronización, restaura estado original
- Notificación al usuario del error y rollback
- Opción de forzar sincronización manual

### 5. Sistema de Persistencia

#### Auto-guardado
- Configurable (por defecto: 1 segundo después del último cambio)
- Prevención de múltiples peticiones simultáneas
- Indicador visual de cambios pendientes

#### Persistencia de Áreas
- Posiciones de áreas almacenadas en estado local
- Sincronización con backend cuando se implemente API

### 6. Optimistic Updates con Reversión

#### Implementación
- Actualización inmediata del UI
- Sincronización en background
- Rollback si falla la sincronización

#### Estados de Sincronización
- `hasPendingChanges`: Indica si hay cambios sin guardar
- `pendingChangesCount`: Número de cambios pendientes
- Controles manuales: Guardar ahora / Descartar cambios

### 7. Componente Unificado: `UnifiedTableLayout`

#### Ubicación: `/src/components/tables/UnifiedTableLayout.tsx`
- **Responsabilidades**:
  - Renderizado del layout
  - Manejo de eventos de usuario
  - Integración con hooks de gestión
  - Visualización de estado de sincronización

#### Características
- Manejo correcto de eventos pasivos
- Indicadores visuales de estado
- Controles de zoom y navegación
- Instrucciones contextualizadas

## Diagrama de Flujo de Datos

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Usuarios      │───▶│ UnifiedTableLayout│───▶│ useUnifiedTable │
│   Interacciones │    │   (Componente)    │    │     Layout      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Event Handlers │    │  State Reducer  │
                       └──────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   useLayoutSync  │◀───│   State Update  │
                       │  (Sincronización)│    │                 │
                       └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │     Backend API  │
                       │  (Persistencia)  │
                       └──────────────────┘
```

## Estrategia de Sincronización Frontend-Backend

### 1. Flujo Normal
1. Usuario arrastra mesa
2. `useUnifiedTableLayout` actualiza estado local
3. `useLayoutSync` detecta cambio
4. Después de delay, sincroniza con backend
5. Si éxito, limpia estado pendiente
6. Si error, hace rollback

### 2. Flujo con Errores
1. Usuario arrastra mesa
2. Actualización optimista local
3. Error al sincronizar con backend
4. `useLayoutSync` restaura estado original
5. Notificación de error al usuario
6. Opción de reintentar o descartar

### 3. Flujo de Cambios Múltiples
1. Usuario realiza varios cambios rápidos
2. Cada cambio actualiza estado local
3. Solo el último cambio se sincroniza (debounce)
4. Todos los cambios se agrupan en una sola petición

## Manejo de Estados y Errores

### 1. Estados del Layout
- `isDirty`: Indica si hay cambios no guardados
- `isDragging`: Indica si hay elemento siendo arrastrado
- `isPanning`: Indica si se está haciendo pan del viewport

### 2. Estados de Sincronización
- `pendingChanges`: Cambios esperando sincronización
- `syncInProgress`: Sincronización en curso
- `lastSyncTime`: Timestamp de última sincronización exitosa

### 3. Manejo de Errores
- **Errores de Conexión**: Rollback automático
- **Errores de Validación**: Feedback inmediato
- **Errores de Permiso**: Notificación y rollback
- **Timeout**: Reintento automático con límite

## Optimizaciones de Rendimiento

### 1. Debounce de Sincronización
- Agrupar cambios rápidos
- Prevención de peticiones múltiples

### 2. Memoización
- `useCallback` para handlers de eventos
- `useMemo` para cálculos complejos

### 3. Virtualización (futura)
- Renderizado solo de elementos visibles
- Lazy loading de áreas grandes

## Instrucciones de Implementación

### 1. Reemplazo Gradual
1. Implementar `useUnifiedTableLayout`
2. Crear `UnifiedTableLayout`
3. Reemplazar en página de tablas
4. Migrar otras páginas gradualmente

### 2. Configuración
- Definir tipo de coordenadas (relativas/absolutas)
- Configurar delays de auto-guardado
- Habilitar/deshabilitar optimistic updates

### 3. Pruebas
- Probar arrastre de mesas
- Verificar sincronización con backend
- Validar rollback ante errores
- Comprobar persistencia de cambios

## Conclusiones

Esta arquitectura soluciona todos los problemas identificados:

1. **Unificación de estados**: Single source of truth en `useUnifiedTableLayout`
2. **Sincronización bidireccional**: `useLayoutSync` maneja persistencia
3. **Coordinadas normalizadas**: Conversión automática entre relativas/absolutas
4. **Manejo de errores robusto**: Rollback automático con notificaciones
5. **Persistencia garantizada**: Auto-guardado con indicadores visuales
6. **Optimistic updates**: Experiencia de usuario fluida
7. **Eventos pasivos**: Manejo correcto para prevenir warnings

La solución es escalable, mantenible y proporciona una experiencia de usuario superior con feedback inmediato y recuperación automática de errores.