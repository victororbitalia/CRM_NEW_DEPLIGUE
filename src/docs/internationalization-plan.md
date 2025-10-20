# Plan de Internacionalización (i18n)

## Problema Identificado

Hay textos en inglés en la interfaz que deberían estar en español, y el idioma no cambia cuando se ajusta en la configuración.

## Componentes Afectados

### 1. ReservationList (`src/components/reservations/ReservationList.tsx`)
- Textos en inglés identificados:
  - "View"
  - "Edit"
  - "Change Status"
  - "Search reservations..."
  - "All Statuses"
  - "Date (Earliest first)"
  - "Date (Latest first)"
  - "Party Size (Smallest first)"
  - "Party Size (Largest first)"
  - "Created (Oldest first)"
  - "Created (Newest first)"
  - "Loading reservations..."
  - "No reservations found"
  - "Try adjusting your search or filters"
  - "No reservations have been created yet"
  - "Customer"
  - "Date & Time"
  - "Party Size"
  - "Table"
  - "Status"
  - "Actions"
  - "guest" / "guests"
  - "Not assigned"

### 2. Otros componentes por revisar
- `src/components/reservations/ReservationCalendar.tsx`
- `src/components/reservations/ReservationForm.tsx`
- `src/components/reservations/ReservationDetail.tsx`
- `src/components/tables/TableForm.tsx`
- `src/components/tables/TableList.tsx`
- Componentes de la página principal

## Plan de Solución

### Opción 1: Reemplazo Directo de Textos (Recomendado para implementación rápida)

1. **Reemplazar todos los textos en inglés por español** en los componentes afectados.
2. **Ventajas**:
   - Implementación rápida
   - No requiere bibliotecas adicionales
   - Solución inmediata

### Opción 2: Implementación de Sistema de Internacionalización (Recomendado a largo plazo)

1. **Instalar next-i18next**:
   ```bash
   npm install next-i18next react-i18next
   ```

2. **Crear archivos de traducción**:
   - `public/locales/es/common.json`
   - `public/locales/en/common.json`

3. **Configurar i18n**:
   - Crear `next-i18next.config.js`
   - Modificar `next.config.ts`

4. **Actualizar componentes** para usar el hook `useTranslation`

## Implementación Inmediata (Opción 1)

### 1. ReservationList.tsx

```typescript
// Reemplazar textos en inglés por español
const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  seated: 'Sentada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No se presentó',
};

const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'seated', label: 'Sentada' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'no_show', label: 'No se presentó' },
];

const sortOptions = [
  { value: 'date-asc', label: 'Fecha (Más antiguo primero)' },
  { value: 'date-desc', label: 'Fecha (Más reciente primero)' },
  { value: 'party-size-asc', label: 'Comensales (Menor primero)' },
  { value: 'party-size-desc', label: 'Comensales (Mayor primero)' },
  { value: 'created-asc', label: 'Creación (Más antiguo primero)' },
  { value: 'created-desc', label: 'Creación (Más reciente primero)' },
];

// En el JSX:
<Input
  placeholder="Buscar reservas..."
  // ...
/>

<th>Cliente</th>
<th>Fecha y Hora</th>
<th>Nº de Comensales</th>
<th>Mesa</th>
<th>Estado</th>
<th>Acciones</th>

<Button>Ver</Button>
<Button>Editar</Button>
<Select>
  <option value="">Cambiar Estado</option>
</Select>
<Button>Eliminar</Button>
```

### 2. Otros componentes

Aplicar cambios similares en otros componentes con textos en inglés.

## Pasos de Implementación

1. **Identificar todos los textos en inglés** en los componentes afectados.
2. **Reemplazar los textos por sus equivalentes en español**.
3. **Probar que todos los textos se muestren correctamente**.
4. **Verificar que la funcionalidad no se vea afectada**.

## Consideraciones Adicionales

1. **Consistencia**: Asegurarse de que los términos sean consistentes en toda la aplicación.
2. **Contexto**: Algunos términos pueden necesitar traducción contextual.
3. **Formularios**: Los placeholders y mensajes de validación también deben estar en español.
4. **Notificaciones**: Los mensajes de éxito y error deben estar en español.

## Pruebas

1. **Verificar visualmente** que todos los textos estén en español.
2. **Probar la funcionalidad** para asegurarse de que los cambios no afecten el comportamiento.
3. **Probar en diferentes navegadores** para asegurar compatibilidad.

## Implementación a Largo Plazo (Opción 2)

Si en el futuro se requiere soporte para múltiples idiomas, se puede implementar un sistema de internacionalización completo con next-i18next, pero por ahora la opción 1 es la más rápida y efectiva para solucionar el problema inmediato.