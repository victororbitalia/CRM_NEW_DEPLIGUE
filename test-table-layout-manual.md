# Pruebas Manuales para la Solución del Layout de Mesas

## Pasos para Probar la Solución

### 1. Abrir la Aplicación
1. Inicia la aplicación con `npm run dev`
2. Inicia sesión en la aplicación
3. Navega a la página de mesas (`/tables`)

### 2. Cambiar a Vista Layout
1. Haz clic en el botón "Vista Layout" para cambiar del modo grid al modo layout
2. Verifica que las mesas se muestran en sus posiciones guardadas

### 3. Probar Movimiento de Mesas
1. Selecciona una mesa y arrástrala a una nueva posición
2. Suelta la mesa
3. **Verificación clave**: La mesa debe mantenerse en la nueva posición después de soltarla
4. Espera 1-2 segundos para que se guarde automáticamente (deberías ver una notificación)

### 4. Probar Persistencia
1. Mueve varias mesas a diferentes posiciones
2. Recarga la página (F5)
3. Las mesas deben aparecer en las posiciones donde las dejaste

### 5. Probar Cambio entre Vistas
1. Mueve algunas mesas en la vista layout
2. Cambia a la vista grid
3. Vuelve a la vista layout
4. Las mesas deben mantener sus posiciones

### 6. Probar Creación de Nuevas Mesas
1. Crea una nueva mesa
2. La mesa debe aparecer en una posición automática dentro de su área
3. Mueve la nueva mesa a una posición diferente
4. La mesa debe mantener su nueva posición

## Comprobación de Errores

### Consola del Navegador
Abre la consola del navegador (F12) y busca los siguientes mensajes de debug:
- `DEBUG: initializeLayout called`
- `DEBUG: convertLayoutToDbCoordinates`
- `DEBUG: updateTablePosition called`
- `DEBUG: useLayoutSync - saving position`
- `DEBUG: useLayoutSync - position saved successfully`

### Posibles Errores y Soluciones

1. **Las mesas vuelven a su posición original después de soltarlas**
   - Verifica que no haya errores en la consola
   - Revisa que la API esté respondiendo correctamente

2. **Las mesas no se guardan al recargar la página**
   - Verifica que la API esté actualizando la base de datos
   - Revisa el endpoint `/api/tables/[id]`

3. **Error de coordenadas**
   - Los mensajes de debug deberían mostrar las coordenadas correctas
   - Verifica que la conversión entre coordenadas relativas y absolutas funcione

## Resultados Esperados

### ✅ Funcionamiento Correcto
- Las mesas se mantienen en su nueva posición después de soltarlas
- Las posiciones se guardan automáticamente en la base de datos
- Las mesas mantienen su posición al recargar la página
- No hay errores en la consola del navegador

### ❌ Problemas Detectados
- Las mesas vuelven a su posición original después de soltarlas
- Las posiciones no se guardan en la base de datos
- Errores en la consola relacionados con coordenadas o sincronización

## Notas Adicionales

- Los cambios se guardan automáticamente 1 segundo después de mover una mesa
- Si hay un error de conexión, las mesas volverán a su posición original y mostrarán un mensaje de error
- El sistema ahora usa coordenadas relativas a las áreas para un mejor manejo del layout