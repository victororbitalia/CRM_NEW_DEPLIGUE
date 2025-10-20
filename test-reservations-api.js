// Script para testear la API de reservas localmente
// Usando el módulo https nativo de Node.js para evitar dependencias
const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:3000/api';

// Cargar token desde archivo
const fs = require('fs');
let token;
try {
  token = fs.readFileSync('.auth-token', 'utf8').trim();
  console.log('✅ Token cargado desde archivo .auth-token');
} catch (error) {
  console.error('❌ No se pudo cargar el token. Ejecuta primero: node get-token.js');
  process.exit(1);
}

const API_TOKEN = `Bearer ${token}`;

// Función auxiliar para hacer peticiones HTTP
function apiRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${endpoint}`);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const defaultOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_TOKEN,
      },
    };
    
    const requestOptions = { ...defaultOptions, ...options };
    
    const req = httpModule.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`\n=== ${requestOptions.method} ${endpoint} ===`);
          console.log(`Status: ${res.statusCode}`);
          console.log('Response:', JSON.stringify(jsonData, null, 2));
          resolve({ response: res, data: jsonData });
        } catch (error) {
          console.log(`\n=== ${requestOptions.method} ${endpoint} ===`);
          console.log(`Status: ${res.statusCode}`);
          console.log('Response (raw):', data);
          resolve({ response: res, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('\n❌ Error en la petición:', error.message);
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Función principal de prueba
async function testReservationsAPI() {
  console.log('Iniciando prueba de la API de Reservas...');
  
  try {
    // 1. Obtener todas las áreas
    console.log('\n--- Paso 1: Obtener áreas ---');
    const areasResult = await apiRequest('/areas?restaurantId=default-restaurant');
    
    if (!areasResult.data.length) {
      console.log('No hay áreas disponibles. Creando una área de prueba...');
      const newArea = await apiRequest('/areas', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Área de Prueba Reservas',
          description: 'Área creada para pruebas de reservas',
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
    
    let tableId;
    if (!tablesResult.data.length) {
      console.log('No hay mesas disponibles. Creando una mesa de prueba...');
      const newTableResult = await apiRequest('/tables', {
        method: 'POST',
        body: JSON.stringify({
          areaId,
          number: `Mesa Prueba ${Date.now()}`,
          capacity: 4,
          minCapacity: 1,
          shape: 'rectangle',
          positionX: 100,
          positionY: 100,
          width: 80,
          height: 80,
          isAccessible: false,
          isActive: true
        })
      });
      tableId = newTableResult.data.id || newTableResult.data.data?.id;
      console.log(`Mesa creada con ID: ${tableId}`);
    } else {
      // Usar la primera mesa disponible
      tableId = tablesResult.data[0].id;
      console.log(`Usando mesa ID: ${tableId} (Mesa ${tablesResult.data[0].number})`);
    }
    
    // 3. Obtener todos los clientes
    console.log('\n--- Paso 3: Obtener clientes ---');
    const customersResult = await apiRequest('/customers');
    
    let customerId;
    if (!customersResult.data.length) {
      console.log('No hay clientes disponibles. Creando un cliente de prueba...');
      const newCustomerResult = await apiRequest('/customers', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Cliente',
          lastName: 'de Prueba',
          email: `cliente${Date.now()}@prueba.com`,
          phone: '600123456',
        })
      });
      customerId = newCustomerResult.data.id || newCustomerResult.data.data?.id;
      console.log(`Cliente creado con ID: ${customerId}`);
    } else {
      customerId = customersResult.data[0].id;
      console.log(`Usando cliente ID: ${customerId}`);
    }
    
    console.log(`Verificación - customerId: ${customerId}, tableId: ${tableId}`);
    
    // 4. Obtener todas las reservas existentes
    console.log('\n--- Paso 4: Obtener reservas existentes ---');
    const reservationsResult = await apiRequest('/reservations');
    console.log(`Se encontraron ${reservationsResult.data?.length || 0} reservas existentes`);
    
    // 5. Crear una nueva reserva
    console.log('\n--- Paso 5: Crear nueva reserva ---');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const startTime = new Date(`${dateStr}T20:00:00`);
    const endTime = new Date(`${dateStr}T22:00:00`);
    
    const newReservationResult = await apiRequest('/reservations', {
      method: 'POST',
      body: JSON.stringify({
        customerId,
        tableId,
        date: dateStr,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        partySize: 4,
        status: 'pending',
        specialRequests: 'Mesa cerca de la ventana',
        occasion: 'birthday'
      })
    });
    
    if (newReservationResult.response.status !== 201 && newReservationResult.response.status !== 200) {
      throw new Error(`Error al crear reserva: ${JSON.stringify(newReservationResult.data)}`);
    }
    
    // Verificar si la respuesta tiene la estructura esperada
    const response = newReservationResult.data;
    if (!response.success) {
      throw new Error(`Error al crear reserva: ${JSON.stringify(response)}`);
    }
    
    const reservationId = response.data.id;
    console.log(`✅ Reserva creada con ID: ${reservationId}`);
    
    // 6. Obtener la reserva específica
    console.log('\n--- Paso 6: Obtener reserva específica ---');
    const specificReservationResult = await apiRequest(`/reservations/${reservationId}`);
    
    if (specificReservationResult.response.status !== 200) {
      throw new Error(`Error al obtener la reserva: ${JSON.stringify(specificReservationResult.data)}`);
    }
    
    console.log(`✅ Reserva obtenida correctamente`);
    
    // 7. Confirmar la reserva
    console.log('\n--- Paso 7: Confirmar reserva ---');
    const confirmResult = await apiRequest(`/reservations/${reservationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'confirmed'
      })
    });
    
    if (confirmResult.response.status !== 200) {
      throw new Error(`Error al confirmar la reserva: ${JSON.stringify(confirmResult.data)}`);
    }
    
    console.log(`✅ Reserva confirmada correctamente`);
    
    // 8. Actualizar la reserva (cambiar número de personas y solicitudes especiales)
    console.log('\n--- Paso 8: Actualizar reserva ---');
    const updateResult = await apiRequest(`/reservations/${reservationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        partySize: 6,
        specialRequests: 'Mesa actualizada - cerca de la ventana y con silla alta para niño'
      })
    });
    
    if (updateResult.response.status !== 200) {
      throw new Error(`Error al actualizar la reserva: ${JSON.stringify(updateResult.data)}`);
    }
    
    console.log(`✅ Reserva actualizada correctamente`);
    
    // 9. Cambiar el estado a "seated"
    console.log('\n--- Paso 9: Cambiar estado a seated ---');
    const seatedResult = await apiRequest(`/reservations/${reservationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'seated'
      })
    });
    
    if (seatedResult.response.status !== 200) {
      throw new Error(`Error al cambiar estado a seated: ${JSON.stringify(seatedResult.data)}`);
    }
    
    console.log(`✅ Estado cambiado a seated correctamente`);
    
    // 10. Cambiar el estado a "completed"
    console.log('\n--- Paso 10: Cambiar estado a completed ---');
    const completedResult = await apiRequest(`/reservations/${reservationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'completed'
      })
    });
    
    if (completedResult.response.status !== 200) {
      throw new Error(`Error al cambiar estado a completed: ${JSON.stringify(completedResult.data)}`);
    }
    
    console.log(`✅ Estado cambiado a completed correctamente`);
    
    // 11. Crear otra reserva para probar cancelación
    console.log('\n--- Paso 11: Crear segunda reserva para cancelación ---');
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const dateStr2 = dayAfterTomorrow.toISOString().split('T')[0];
    
    const startTime2 = new Date(`${dateStr2}T19:00:00`);
    const endTime2 = new Date(`${dateStr2}T21:00:00`);
    
    const newReservationResult2 = await apiRequest('/reservations', {
      method: 'POST',
      body: JSON.stringify({
        customerId,
        tableId,
        date: dateStr2,
        startTime: startTime2.toISOString(),
        endTime: endTime2.toISOString(),
        partySize: 2,
        status: 'confirmed',
        specialRequests: 'Mesa en zona tranquila',
        occasion: 'anniversary'
      })
    });
    
    if (newReservationResult2.response.status !== 201 && newReservationResult2.response.status !== 200) {
      throw new Error(`Error al crear segunda reserva: ${JSON.stringify(newReservationResult2.data)}`);
    }
    
    // Verificar si la respuesta tiene la estructura esperada
    const response2 = newReservationResult2.data;
    if (!response2.success) {
      throw new Error(`Error al crear segunda reserva: ${JSON.stringify(response2)}`);
    }
    
    const reservationId2 = response2.data.id;
    console.log(`✅ Segunda reserva creada con ID: ${reservationId2}`);
    
    // 12. Cancelar la segunda reserva
    console.log('\n--- Paso 12: Cancelar segunda reserva ---');
    const cancelResult = await apiRequest(`/reservations/${reservationId2}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'cancelled',
        cancellationReason: 'Cliente solicitó cancelación'
      })
    });
    
    if (cancelResult.response.status !== 200) {
      throw new Error(`Error al cancelar la reserva: ${JSON.stringify(cancelResult.data)}`);
    }
    
    console.log(`✅ Reserva cancelada correctamente`);
    
    // 13. Eliminar la segunda reserva
    console.log('\n--- Paso 13: Eliminar segunda reserva ---');
    const deleteResult = await apiRequest(`/reservations/${reservationId2}`, {
      method: 'DELETE'
    });
    
    if (deleteResult.response.status !== 200) {
      throw new Error(`Error al eliminar la reserva: ${JSON.stringify(deleteResult.data)}`);
    }
    
    console.log(`✅ Reserva eliminada correctamente`);
    
    // 14. Verificar que la reserva fue eliminada
    console.log('\n--- Paso 14: Verificar eliminación de reserva ---');
    const verifyDeleteResult = await apiRequest(`/reservations/${reservationId2}`);
    
    if (verifyDeleteResult.response.status !== 404) {
      console.log('⚠️ Advertencia: La reserva debería haber sido eliminada pero aún existe');
    } else {
      console.log('✅ Reserva eliminada correctamente');
    }
    
    // 15. Obtener lista final de reservas
    console.log('\n--- Paso 15: Obtener lista final de reservas ---');
    const finalReservationsResult = await apiRequest('/reservations');
    console.log(`Total de reservas después de las pruebas: ${finalReservationsResult.data?.length || 0}`);
    
    console.log('\n✅ Prueba de API de Reservas completada con éxito!');
    
  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error.message);
    process.exit(1);
  }
}

// Función para probar casos de error
async function testErrorCases() {
  console.log('\n\n=== INICIANDO PRUEBAS DE CASOS DE ERROR ===');
  
  try {
    // 1. Intentar crear una reserva sin datos requeridos
    console.log('\n--- Error Case 1: Crear reserva sin datos requeridos ---');
    const invalidReservationResult = await apiRequest('/reservations', {
      method: 'POST',
      body: JSON.stringify({
        // Faltan campos requeridos como customerId, date, startTime, partySize
        specialRequests: 'Reserva inválida'
      })
    });
    
    if (invalidReservationResult.response.status === 400) {
      console.log('✅ API rechaza correctamente reserva sin datos requeridos');
    } else {
      console.log('❌ API debería rechazar reserva sin datos requeridos');
    }
    
    // 2. Intentar obtener una reserva que no existe
    console.log('\n--- Error Case 2: Obtener reserva inexistente ---');
    const nonExistentResult = await apiRequest('/reservations/reservation-inexistente');
    
    if (nonExistentResult.response.status === 404) {
      console.log('✅ API maneja correctamente reserva no encontrada');
    } else {
      console.log('❌ API debería devolver 404 para reserva inexistente');
    }
    
    // 3. Intentar actualizar una reserva que no existe
    console.log('\n--- Error Case 3: Actualizar reserva inexistente ---');
    const updateNonExistentResult = await apiRequest('/reservations/reservation-inexistente', {
      method: 'PUT',
      body: JSON.stringify({
        status: 'confirmed'
      })
    });
    
    if (updateNonExistentResult.response.status === 404) {
      console.log('✅ API maneja correctamente actualización de reserva inexistente');
    } else {
      console.log('❌ API debería devolver 404 al actualizar reserva inexistente');
    }
    
    // 4. Intentar eliminar una reserva que no existe
    console.log('\n--- Error Case 4: Eliminar reserva inexistente ---');
    const deleteNonExistentResult = await apiRequest('/reservations/reservation-inexistente', {
      method: 'DELETE'
    });
    
    if (deleteNonExistentResult.response.status === 404) {
      console.log('✅ API maneja correctamente eliminación de reserva inexistente');
    } else {
      console.log('❌ API debería devolver 404 al eliminar reserva inexistente');
    }
    
    console.log('\n✅ Pruebas de casos de error completadas!');
    
  } catch (error) {
    console.error('\n❌ Error durante las pruebas de error:', error.message);
  }
}

// Ejecutar las pruebas
async function runAllTests() {
  await testReservationsAPI();
  await testErrorCases();
  console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS');
}

runAllTests();