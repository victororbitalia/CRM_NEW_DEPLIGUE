# Wireframes y Mockups para Mejoras del Layout de Mesas

## Vista Layout Actual - Problemas Identificados

### Problema 1: Sin Asignación de Reservas
```
┌─────────────────────────────────────────────────────────────┐
│ [Vista Grid] [Vista Layout] [Gestionar Áreas] [Nueva Mesa] │
├─────────────────────────────────────────────────────────────┤
│ [+] [-] [Reset] [Fit] [🔍]                                  │
│                                                             │
│  ┌─────────────────────┐                                   │
│  │    Interior         │                                   │
│  │  ┌───┐ ┌───┐ ┌───┐  │                                   │
│  │  │ 1 │ │ 2 │ │ 3 │  │ ← Sin forma de asignar a reserva │
│  │  └───┘ └───┘ └───┘  │                                   │
│  │                     │                                   │
│  └─────────────────────┘                                   │
│                                                             │
│  ┌─────────────────────┐                                   │
│  │     Terraza         │                                   │
│  │  ┌───┐ ┌───┐        │                                   │
│  │  │ 4 │ │ 5 │        │                                   │
│  │  └───┘ └───┘        │                                   │
│  │                     │                                   │
│  └─────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

### Problema 2: Navegación Confusa
```
┌─────────────────────────────────────────────────────────────┐
│ Intenta mover el fondo → Se mueve la mesa en su lugar        │
│                                                             │
│      🖱️                                                     │
│      ↓                                                      │
│  ┌───┐                                                      │
│  │ 1 │ ← El usuario quería navegar pero movió la mesa      │
│  └───┘                                                      │
└─────────────────────────────────────────────────────────────┘
```

## Vista Layout Mejorada - Propuesta

### Mejora 1: Modos de Interacción Claros
```
┌─────────────────────────────────────────────────────────────┐
│ [Vista Grid] [Vista Layout] [Gestionar Áreas] [Nueva Mesa] │
├─────────────────────────────────────────────────────────────┤
│ [🖱️ Navegar] [📦 Mover Mesas] [🔄 Reset] [🔍 Zoom]        │
│                                                             │
│  ┌─────────────────────┐                                   │
│  │    Interior         │                                   │
│  │  ┌───┐ ┌───┐ ┌───┐  │                                   │
│  │  │ 1 │ │ 2 │ │ 3 │  │                                   │
│  │  └───┘ └───┘ └───┘  │                                   │
│  │                     │                                   │
│  └─────────────────────┘                                   │
│                                                             │
│  ┌─────────────────────┐                                   │
│  │     Terraza         │                                   │
│  │  ┌───┐ ┌───┐        │                                   │
│  │  │ 4 │ │ 5 │        │                                   │
│  │  └───┘ └───┘        │                                   │
│  │                     │                                   │
│  └─────────────────────┘                                   │
│                                                             │
│ Barra de estado: Modo actual: 🖱️ Navegar                     │
└─────────────────────────────────────────────────────────────┘
```

### Mejora 2: Menú Contextual para Asignación de Reservas
```
┌─────────────────────────────────────────────────────────────┐
│ Clic derecho en mesa                                        │
│                                                             │
│  ┌───┐                                                     │
│  │ 1 │ ─────────────────────────────────────────────────→┐ │
│  └───┘                                                   │ │
│                                                          │ │
│  ┌─────────────────────┐                                 │ │
│  │  Menu Contextual     │                                 │ │
│  │ ─────────────────────│                                 │ │
│  │ 📋 Ver Detalles       │                                 │ │
│  │ 📅 Asignar a Reserva │                                 │ │
│  │ ➕ Crear Reserva      │                                 │ │
│  │ 🔄 Liberar Mesa      │                                 │ │
│  │ ─────────────────────│                                 │ │
│  │ ✏️ Editar Mesa        │                                 │ │
│  │ 🗑️ Eliminar Mesa     │                                 │ │
│  └─────────────────────┘                                 │ │
└─────────────────────────────────────────────────────────────┘
```

### Mejora 3: Modal de Asignación de Reservas
```
┌─────────────────────────────────────────────────────────────┐
│ Asignar Mesa 1 a Reserva                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Reservas Disponibles Hoy:                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ Juan Pérez - 20:00 (4 personas)                    │ │
│ │ ✅ María García - 21:30 (2 personas)                  │ │
│ │ ⚠️ Carlos López - 19:00 (6 personas) [Capacidad: 4]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ O crear nueva reserva:                                     │
│ [➕ Crear Nueva Reserva]                                  │
│                                                             │
│ ┌─────────────────┐ ┌─────────────────────────────────────┐ │
│ │   Cancelar      │ │            Asignar                  │ │
│ └─────────────────┘ └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Mejora 4: Mesa con Reserva Activa
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────┐                                   │
│  │    Interior         │                                   │
│  │  ┌───┐ ┌───┐ ┌───┐  │                                   │
│  │  │ 1 │ │ 2 │ │ 3 │  │                                   │
│  │  │⏰ │ │   │ │   │  │ ← Mesa 1 reservada               │
│  │  └───┘ └───┘ └───┘  │                                   │
│  │    Juan Pérez        │                                   │
│  │    20:00-22:00       │                                   │
│  │    Restante: 1h 45m  │                                   │
│  │                     │                                   │
│  └─────────────────────┘                                   │
│                                                             │
│  ┌─────────────────────┐                                   │
│  │     Terraza         │                                   │
│  │  ┌───┐ ┌───┐        │                                   │
│  │  │ 4 │ │ 5 │        │                                   │
│  │  └───┘ └───┘        │                                   │
│  └─────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

### Mejora 5: Modal de Detalles de Mesa
```
┌─────────────────────────────────────────────────────────────┐
│ Detalles de Mesa 1                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────┐ ┌─────────────────────────────────────┐ │
│ │   Información    │ │           Reserva Activa              │ │
│ │   de la Mesa:    │ │                                       │ │
│ │                 │ │ ┌─────────────────────────────────────┐ │ │
│ │ Número: 1       │ │ │ Cliente: Juan Pérez                │ │ │
│ │ Capacidad: 4     │ │ | Hora: 20:00 - 22:00               │ │ │
│ │ Área: Interior  │ │ | Personas: 4                        │ │ │
│ │ Estado: Reservada│ │ | Ocasion: Cumpleaños               │ │ │
│ │                 │ │ | Notas: Mesa cerca de la ventana     │ │ │
│ │                 │ │ └─────────────────────────────────────┘ │ │
│ └─────────────────┘ └─────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                Historial del Día                       │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ 12:30-14:00  | Ana Martínez (3 personas)           │ │ │
│ │ │ 14:30-16:00  | Completo (4 personas)                │ │ │
│ │ │ 20:00-22:00  | Juan Pérez (4 personas) ← Actual     │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [🔄 Liberar Mesa] [📝 Editar Reserva] [❌ Cancelar]        │
└─────────────────────────────────────────────────────────────┘
```

### Mejora 6: Controles de Navegación Mejorados
```
┌─────────────────────────────────────────────────────────────┐
│ [Vista Grid] [Vista Layout] [Gestionar Áreas] [Nueva Mesa] │
├─────────────────────────────────────────────────────────────┤
│ [🖱️ Navegar] [📦 Mover Mesas] [🔄 Reset] [🔍 Zoom]        │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                 Mini-Mapa                               │ │
│ │ ┌───┐ ┌───┐                                              │ │
│ │ │ 1 │ │ 2 │  ← Vista general                            │ │
│ │ └───┘ └───┘                                              │ │
│ │                                                        │ │
│ │ ┌───┐                                                 │ │
│ │ │ 4 │                                                 │ │
│ │ └───┘                                                 │ │
│ │                                                        │ │
│ │ [🔺] ← Tu vista actual                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Controles de Zoom:                                          │
│ ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐        │
│ │  -  │  -  │  0  │  +  │  +  │  Fit │  Interior │ Terraza │        │
│ └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘        │
│                                                             │
│  ← Zoom deslizante →                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ●────────────────────────────────○──────────────────● │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────┐                                   │
│  │    Interior         │                                   │
│  │  ┌───┐ ┌───┐ ┌───┐  │                                   │
│  │  │ 1 │ │ 2 │ │ 3 │  │                                   │
│  │  └───┘ └───┘ └───┘  │                                   │
│  │                     │                                   │
│  └─────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

### Mejora 7: Formulario de Reserva Rápida
```
┌─────────────────────────────────────────────────────────────┐
│ Crear Reserva Rápida para Mesa 1                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────┐ ┌─────────────────────────────────────┐ │
│ │   Cliente:      │ │           Detalles de Reserva        │ │
│ │                 │ │                                       │ │
│ │ [Buscar 🔍]     │ │ Fecha: Hoy                          │ │
│ │                 │ │ Hora: 20:00                          │ │
│ │ Juan Pérez      │ │ Duración: 2h                        │ │
│ │ 600123456       │ │ Personas: 4                         │ │
│ │                 │ │                                       │ │
│ │ [➕ Nuevo Cliente] │ │ Ocasion: [Seleccionar...]           │ │
│ └─────────────────┘ └─────────────────────────────────────┘ │
│                                                             │
│ Notas especiales:                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Mesa cerca de la ventana                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────┐ ┌─────────────────────────────────────┐ │
│ │   Cancelar      │ │            Crear Reserva             │ │
│ └─────────────────┘ └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Flujo de Usuario Completo Mejorado

### Escenario 1: Asignar Mesa a Reserva Existente
```
1. Usuario abre vista layout
2. Cambia a modo "📦 Mover Mesas"
3. Busca mesa disponible (color verde)
4. Hace clic derecho en la mesa
5. Selecciona "📅 Asignar a Reserva"
6. Aparece modal con reservas disponibles
7. Selecciona reserva apropiada
8. Mesa cambia a estado "reservada" con temporizador
9. Mesa muestra información de la reserva
```

### Escenario 2: Crear Reserva Rápida
```
1. Usuario abre vista layout
2. Cambia a modo "🖱️ Navegar"
3. Busca mesa disponible (color verde)
4. Hace clic derecho en la mesa
5. Selecciona "➕ Crear Reserva"
6. Aparece formulario de reserva rápida
7. Completa datos básicos
8. Mesa cambia a estado "reservada"
9. Se crea nueva reserva en el sistema
```

### Escenario 3: Ver Detalles y Liberar Mesa
```
1. Usuario ve mesa reservada
2. Hace doble clic en la mesa
3. Aparece modal con detalles completos
4. Revisa información de la reserva
5. Hace clic en "🔄 Liberar Mesa"
6. Mesa cambia a estado "disponible"
7. Reserva se actualiza en el sistema
```

## Consideraciones de Diseño

### Indicadores Visuales
- **Disponible**: Verde claro con borde verde
- **Reservada**: Amarillo con contador de tiempo
- **Ocupada**: Rojo con información de cliente
- **Mantenimiento**: Gris con ícono de herramientas

### Información en las Mesas
- **Modo zoom alejado**: Solo número y estado
- **Modo zoom cercano**: Número, capacidad, estado, y si está reservada
- **Modo zoom muy cercano**: Toda la información disponible

### Interacciones Touch (para tablets)
- Mantener presionada para menú contextual
- Pinch para zoom
- Dos dedos para navegar

Estos wireframes muestran claramente cómo las mejoras propuestas resolverán los problemas actuales y crearán una experiencia de usuario mucho más intuitiva y eficiente.