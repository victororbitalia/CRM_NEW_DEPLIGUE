// Script final para probar la API de reservas
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
      const statusCode = res.statusCode;
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ response: { statusCode }, data: jsonData });
        } catch (error) {
          resolve({ response: { statusCode }, data: data });
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
async function testReservationAPI() {
  console.log('Iniciando prueba de la API de Reservas...');
  
  try {
    // 1. Obtener clientes
    console.log('\n--- Paso 1: Obtener clientes ---');
    const customersResult = await apiRequest('/customers');
    
    if (!customersResult.data.success || !customersResult.data.data.length) {
      throw new Error('No hay clientes disponibles');
    }
    
    const customerId = customersResult.data.data[0].id;
    console.log(`✅ Usando cliente ID: ${customerId}`);
    
    // 2. Crear una nueva reserva
    console.log('\n--- Paso 2: Crear nueva reserva ---');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const startTime = new Date(`${dateStr}T20:00:00`);
    const endTime = new Date(`${dateStr}T22:00:00`);
    
    const newReservationResult = await apiRequest('/reservations', {
      method: 'POST',
      body: JSON.stringify({
        customerId,
        date: dateStr,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        partySize: 4,
        status: 'pending',
        specialRequests: 'Mesa cerca de la ventana',
        occasion: 'birthday'
      })
    });
    
    if (!newReservationResult.data.success) {
      throw new Error(`Error al crear reserva: ${JSON.stringify(newReservationResult.data)}`);
    }
    
    const reservationId = newReservationResult.data.data.id;
    console.log(`✅ Reserva creada con ID: ${reservationId}`);
    
    // 3. Obtener la reserva específica
    console.log('\n--- Paso 3: Obtener reserva específica ---');
    const specificReservationResult = await apiRequest(`/reservations/${reservationId}`);
    
    if (!specificReservationResult.data.success) {
      throw new Error(`Error al obtener la reserva: ${JSON.stringify(specificReservationResult.data)}`);
    }
    
    console.log(`✅ Reserva obtenida correctamente`);
    
    // 4. Actualizar la reserva (confirmar)
    console.log('\n--- Paso 4: Confirmar reserva ---');
    const confirmResult = await apiRequest(`/reservations/${reservationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'confirmed'
      })
    });
    
    if (!confirmResult.data.success) {
      throw new Error(`Error al confirmar la reserva: ${JSON.stringify(confirmResult.data)}`);
    }
    
    console.log(`✅ Reserva confirmada correctamente`);
    
    // 5. Actualizar la reserva (cambiar estado a seated)
    console.log('\n--- Paso 5: Cambiar estado a seated ---');
    const seatedResult = await apiRequest(`/reservations/${reservationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'seated'
      })
    });
    
    if (!seatedResult.data.success) {
      throw new Error(`Error al cambiar estado a seated: ${JSON.stringify(seatedResult.data)}`);
    }
    
    console.log(`✅ Estado cambiado a seated correctamente`);
    
    // 6. Actualizar la reserva (cambiar estado a completed)
    console.log('\n--- Paso 6: Cambiar estado a completed ---');
    const completedResult = await apiRequest(`/reservations/${reservationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'completed'
      })
    });
    
    if (!completedResult.data.success) {
      throw new Error(`Error al cambiar estado a completed: ${JSON.stringify(completedResult.data)}`);
    }
    
    console.log(`✅ Estado cambiado a completed correctamente`);
    
    // 7. Crear otra reserva para probar eliminación
    console.log('\n--- Paso 7: Crear segunda reserva para eliminación ---');
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const dateStr2 = dayAfterTomorrow.toISOString().split('T')[0];
    
    const startTime2 = new Date(`${dateStr2}T19:00:00`);
    const endTime2 = new Date(`${dateStr2}T21:00:00`);
    
    const newReservationResult2 = await apiRequest('/reservations', {
      method: 'POST',
      body: JSON.stringify({
        customerId,
        date: dateStr2,
        startTime: startTime2.toISOString(),
        endTime: endTime2.toISOString(),
        partySize: 2,
        status: 'confirmed',
        specialRequests: 'Mesa en zona tranquila',
        occasion: 'anniversary'
      })
    });
    
    if (!newReservationResult2.data.success) {
      throw new Error(`Error al crear segunda reserva: ${JSON.stringify(newReservationResult2.data)}`);
    }
    
    const reservationId2 = newReservationResult2.data.data.id;
    console.log(`✅ Segunda reserva creada con ID: ${reservationId2}`);
    
    // 8. Intentar eliminar la segunda reserva (solo admin/manager)
    console.log('\n--- Paso 8: Intentar eliminar segunda reserva ---');
    const deleteResult = await apiRequest(`/reservations/${reservationId2}`, {
      method: 'DELETE'
    });
    
    if (!deleteResult.data.success) {
      console.log(`⚠️ No se pudo eliminar la reserva (permisos insuficientes): ${JSON.stringify(deleteResult.data)}`);
      console.log('   Nota: La eliminación de reservas requiere rol de admin o manager');
    } else {
      console.log(`✅ Reserva eliminada correctamente`);
    }
    
    // 9. Cancelar la segunda reserva en lugar de eliminarla
    console.log('\n--- Paso 9: Cancelar segunda reserva ---');
    const cancelResult = await apiRequest(`/reservations/${reservationId2}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'cancelled',
        cancellationReason: 'Prueba de cancelación'
      })
    });
    
    if (!cancelResult.data.success) {
      throw new Error(`Error al cancelar la reserva: ${JSON.stringify(cancelResult.data)}`);
    }
    
    console.log(`✅ Reserva cancelada correctamente`);
    
    console.log('\n✅ Prueba de API de Reservas completada con éxito!');
    
  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error.message);
    process.exit(1);
  }
}

testReservationAPI();