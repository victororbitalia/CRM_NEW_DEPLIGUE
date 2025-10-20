// Script para testear la API localmente
const { fetch } = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

// Función auxiliar para hacer peticiones HTTP
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  
  console.log(`\n=== ${options.method || 'GET'} ${endpoint} ===`);
  console.log(`Status: ${response.status}`);
  console.log('Response:', JSON.stringify(data, null, 2));
  
  return { response, data };
}

// Función principal de prueba
async function testAPI() {
  console.log('Iniciando prueba de la API...');
  
  try {
    // 1. Obtener todas las áreas
    console.log('\n--- Paso 1: Obtener áreas ---');
    const areasResult = await apiRequest('/areas?restaurantId=default-restaurant');
    
    if (!areasResult.data.length) {
      console.log('No hay áreas disponibles. Creando una área de prueba...');
      const newArea = await apiRequest('/areas', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Área de Prueba',
          description: 'Área creada para pruebas',
          maxCapacity: 50,
          restaurantId: 'default-restaurant',
          isActive: true
        })
      });
      areasResult.data = [newArea.data];
    }
    
    const areaId = areasResult.data[0].id;
    console.log(`Usando área ID: ${areaId}`);
    
    // 2. Obtener todas las mesas
    console.log('\n--- Paso 2: Obtener mesas ---');
    const tablesResult = await apiRequest('/tables?restaurantId=default-restaurant');
    
    // 3. Crear una nueva mesa
    console.log('\n--- Paso 3: Crear mesa ---');
    const tableNumber = `Mesa Prueba ${Date.now()}`;
    const newTableResult = await apiRequest('/tables', {
      method: 'POST',
      body: JSON.stringify({
        areaId,
        number: tableNumber,
        capacity: 4,
        shape: 'rectangle',
        positionX: 100,
        positionY: 100,
        width: 80,
        height: 80,
        isAccessible: false,
        isActive: true
      })
    });
    
    const tableId = newTableResult.data.id;
    console.log(`Mesa creada con ID: ${tableId}`);
    
    // 4. Obtener todas las reservas
    console.log('\n--- Paso 4: Obtener reservas ---');
    const reservationsResult = await apiRequest('/reservations');
    
    // 5. Crear una nueva reserva
    console.log('\n--- Paso 5: Crear reserva ---');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const newReservationResult = await apiRequest('/reservations', {
      method: 'POST',
      body: JSON.stringify({
        tableId,
        customerName: 'Cliente de Prueba',
        customerPhone: '600123456',
        partySize: 4,
        date: dateStr,
        startTime: '20:00',
        endTime: '22:00',
        status: 'confirmed',
        specialRequests: 'Mesa cerca de la ventana',
        occasion: 'birthday'
      })
    });
    
    const reservationId = newReservationResult.data.id;
    console.log(`Reserva creada con ID: ${reservationId}`);
    
    // 6. Obtener la reserva específica
    console.log('\n--- Paso 6: Obtener reserva específica ---');
    await apiRequest(`/reservations/${reservationId}`);
    
    // 7. Actualizar la reserva
    console.log('\n--- Paso 7: Actualizar reserva ---');
    await apiRequest(`/reservations/${reservationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        partySize: 6,
        status: 'seated',
        specialRequests: 'Mesa actualizada - cerca de la ventana y con silla alta'
      })
    });
    
    // 8. Cambiar el estado de la mesa a "ocupada"
    console.log('\n--- Paso 8: Cambiar estado de mesa ---');
    await apiRequest(`/tables/${tableId}`, {
      method: 'PUT',
      body: JSON.stringify({
        currentStatus: 'occupied'
      })
    });
    
    // 9. Liberar la mesa
    console.log('\n--- Paso 9: Liberar mesa ---');
    await apiRequest(`/tables/${tableId}`, {
      method: 'PUT',
      body: JSON.stringify({
        currentStatus: 'available'
      })
    });
    
    // 10. Cancelar la reserva
    console.log('\n--- Paso 10: Cancelar reserva ---');
    await apiRequest(`/reservations/${reservationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'cancelled'
      })
    });
    
    // 11. Eliminar la reserva
    console.log('\n--- Paso 11: Eliminar reserva ---');
    await apiRequest(`/reservations/${reservationId}`, {
      method: 'DELETE'
    });
    
    // 12. Eliminar la mesa
    console.log('\n--- Paso 12: Eliminar mesa ---');
    await apiRequest(`/tables/${tableId}`, {
      method: 'DELETE'
    });
    
    console.log('\n✅ Prueba de API completada con éxito!');
    
  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error.message);
    process.exit(1);
  }
}

// Ejecutar la prueba
testAPI();