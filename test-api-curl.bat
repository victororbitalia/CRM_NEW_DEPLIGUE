@echo off
echo Iniciando prueba de la API con curl...
echo.

echo --- Paso 1: Obtener áreas ---
curl -s -X GET "http://localhost:3000/api/areas?restaurantId=default-restaurant" -H "Content-Type: application/json"
echo.

echo --- Paso 2: Obtener mesas ---
curl -s -X GET "http://localhost:3000/api/tables?restaurantId=default-restaurant" -H "Content-Type: application/json"
echo.

echo --- Paso 3: Crear mesa ---
set /p tableId="Introduce un ID de area valido de las areas mostradas arriba: "
curl -s -X POST "http://localhost:3000/api/tables" -H "Content-Type: application/json" -d "{\"areaId\":\"%tableId%\",\"number\":\"Mesa Prueba 99\",\"capacity\":4,\"shape\":\"rectangle\",\"positionX\":100,\"positionY\":100,\"width\":80,\"height\":80,\"isAccessible\":false,\"isActive\":true}"
echo.

echo --- Paso 4: Obtener reservas ---
curl -s -X GET "http://localhost:3000/api/reservations" -H "Content-Type: application/json"
echo.

echo --- Paso 5: Crear reserva ---
set /p reservationTableId="Introduce el ID de la mesa creada: "
curl -s -X POST "http://localhost:3000/api/reservations" -H "Content-Type: application/json" -d "{\"tableId\":\"%reservationTableId%\",\"customerName\":\"Cliente de Prueba\",\"customerPhone\":\"600123456\",\"partySize\":4,\"date\":\"2025-10-17\",\"startTime\":\"20:00\",\"endTime\":\"22:00\",\"status\":\"confirmed\",\"specialRequests\":\"Mesa cerca de la ventana\",\"occasion\":\"birthday\"}"
echo.

echo --- Paso 6: Actualizar reserva ---
set /p reservationId="Introduce el ID de la reserva creada: "
curl -s -X PUT "http://localhost:3000/api/reservations/%reservationId%" -H "Content-Type: application/json" -d "{\"partySize\":6,\"status\":\"seated\",\"specialRequests\":\"Mesa actualizada - cerca de la ventana y con silla alta\"}"
echo.

echo --- Paso 7: Cambiar estado de mesa ---
set /p tableId2="Introduce el ID de la mesa: "
curl -s -X PUT "http://localhost:3000/api/tables/%tableId2%" -H "Content-Type: application/json" -d "{\"currentStatus\":\"occupied\"}"
echo.

echo --- Paso 8: Liberar mesa ---
curl -s -X PUT "http://localhost:3000/api/tables/%tableId2%" -H "Content-Type: application/json" -d "{\"currentStatus\":\"available\"}"
echo.

echo --- Paso 9: Cancelar reserva ---
curl -s -X PUT "http://localhost:3000/api/reservations/%reservationId%" -H "Content-Type: application/json" -d "{\"status\":\"cancelled\"}"
echo.

echo --- Paso 10: Eliminar reserva ---
curl -s -X DELETE "http://localhost:3000/api/reservations/%reservationId%" -H "Content-Type: application/json"
echo.

echo --- Paso 11: Eliminar mesa ---
curl -s -X DELETE "http://localhost:3000/api/tables/%tableId2%" -H "Content-Type: application/json"
echo.

echo Prueba completada.
pause