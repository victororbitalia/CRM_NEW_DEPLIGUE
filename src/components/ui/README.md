# Sistema de Componentes UI

Este directorio contiene todos los componentes UI reutilizables utilizados en la aplicación de CRM para restaurantes.

## Estructura

```
src/components/ui/
├── Button.tsx          # Componente de botón con múltiples variantes
├── Card.tsx            # Componente de tarjeta con contenido estructurado
├── Input.tsx           # Componente de entrada de datos con validación
├── Modal.tsx           # Componente de ventana modal
├── Table.tsx           # Componente de tabla con datos estructurados
├── Form.tsx            # Componente de formulario con campos estructurados
├── Select.tsx          # Componente de selección desplegable
├── DatePicker.tsx      # Componente de selector de fecha
├── Badge.tsx           # Componente de insignia con múltiples variantes
├── Loading.tsx         # Componentes de carga con diferentes estilos
├── Alert.tsx           # Componente de alerta con múltiples variantes
├── Toast.tsx           # Componente de notificación toast
├── NotificationSystem.tsx # Sistema de notificaciones integrado
└── index.ts            # Exportaciones de todos los componentes
```

## Componentes de Restaurante

```
src/components/restaurant/
├── ReservationCard.tsx  # Tarjeta de información de reserva
├── TableCard.tsx         # Tarjeta de información de mesa
├── CustomerInfo.tsx      # Tarjeta de información de cliente
└── StatusIndicator.tsx   # Indicador de estado con múltiples variantes
```

## Componentes de Layout

```
src/components/layout/
├── Layout.tsx    # Componente de layout principal
├── Header.tsx    # Componente de cabecera
└── Sidebar.tsx   # Componente de barra lateral
```

## Uso

### Importación

Puedes importar los componentes individualmente o desde el archivo de índice:

```typescript
// Importación individual
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

// Importación desde el índice
import { Button, Card, Modal } from '@/components/ui';
```

### Componentes de Restaurante

```typescript
import { ReservationCard, TableCard, CustomerInfo } from '@/components/ui';
```

### Sistema de Notificaciones

```typescript
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext';

// En el componente raíz de tu aplicación
<NotificationProvider>
  <App />
</NotificationProvider>

// En cualquier componente hijo
const { showSuccess, showError } = useNotifications();
```

## Personalización

### Tema

Los componentes utilizan Tailwind CSS con un tema personalizado definido en `tailwind.config.ts`. Puedes personalizar los colores, fuentes y otros estilos modificando este archivo.

### Animaciones

Las animaciones personalizadas están definidas en `src/styles/animations.css`. Puedes añadir nuevas animaciones o modificar las existentes según tus necesidades.

## Ejemplos

### Botón

```typescript
<Button variant="primary" size="md" onClick={handleClick}>
  Hacer clic
</Button>
```

### Tarjeta

```typescript
<Card>
  <CardHeader>
    <CardTitle>Título de la tarjeta</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Contenido de la tarjeta</p>
  </CardContent>
</Card>
```

### Modal

```typescript
<Modal isOpen={isOpen} onClose={handleClose} size="md">
  <ModalHeader>
    Título del modal
  </ModalHeader>
  <ModalBody>
    <p>Contenido del modal</p>
  </ModalBody>
  <ModalFooter>
    <Button onClick={handleClose}>Cerrar</Button>
  </ModalFooter>
</Modal>
```

### Tarjeta de Reserva

```typescript
<ReservationCard
  reservation={reservation}
  onEdit={handleEdit}
  onCancel={handleCancel}
  onConfirm={handleConfirm}
/>
```

## Contribución

Al añadir nuevos componentes, sigue estas directrices:

1. Crea un archivo separado para cada componente
2. Utiliza TypeScript con tipos adecuados
3. Añade documentación JSDoc para las props
4. Exporta el componente desde `index.ts`
5. Añade ejemplos de uso en este archivo README

## Accesibilidad

Todos los componentes están diseñados teniendo en cuenta la accesibilidad:

- Uso de elementos semánticos de HTML5
- Soporte para navegación con teclado
- Atributos ARIA apropiados
- Contraste de color adecuado