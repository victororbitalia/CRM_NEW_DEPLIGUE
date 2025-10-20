// Script simplificado para probar la creación de reservas
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
async function testSimpleReservation() {
  console.log('Iniciando prueba simple de creación de reserva...');
  
  try {
    // 1. Obtener todos los clientes
    console.log('\n--- Paso 1: Obtener clientes ---');
    const customersResult = await apiRequest('/customers');
    
    if (!customersResult.data.data || !customersResult.data.data.length) {
      throw new Error('No hay clientes disponibles');
    }
    
    const customerId = customersResult.data.data[0].id;
    console.log(`Usando cliente ID: ${customerId}`);
    
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
    
    console.log('\n--- Analizando respuesta ---');
    console.log('Status:', newReservationResult.response.statusCode);
    console.log('Response:', JSON.stringify(newReservationResult.data, null, 2));
    
    if (newReservationResult.response.status !== 201 && newReservationResult.response.status !== 200) {
      throw new Error(`Error al crear reserva: Status ${newReservationResult.response.statusCode}`);
    }
    
    // Verificar si la respuesta tiene la estructura esperada
    const response = newReservationResult.data;
    console.log('Response.success:', response.success);
    console.log('Response.data:', response.data);
    
    if (!response.success) {
      throw new Error(`Error al crear reserva: ${JSON.stringify(response)}`);
    }
    
    const reservationId = response.data.id;
    console.log(`✅ Reserva creada con ID: ${reservationId}`);
    
    // 3. Obtener la reserva específica
    console.log('\n--- Paso 3: Obtener reserva específica ---');
    const specificReservationResult = await apiRequest(`/reservations/${reservationId}`);
    
    if (specificReservationResult.response.status !== 200) {
      throw new Error(`Error al obtener la reserva: ${JSON.stringify(specificReservationResult.data)}`);
    }
    
    console.log(`✅ Reserva obtenida correctamente`);
    
    // 4. Actualizar la reserva
    console.log('\n--- Paso 4: Actualizar reserva ---');
    const updateResult = await apiRequest(`/reservations/${reservationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'confirmed'
      })
    });
    
    if (updateResult.response.status !== 200) {
      throw new Error(`Error al actualizar la reserva: ${JSON.stringify(updateResult.data)}`);
    }
    
    console.log(`✅ Reserva actualizada correctamente`);
    
    console.log('\n✅ Prueba simple de API de Reservas completada con éxito!');
    
  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error.message);
    process.exit(1);
  }
}

testSimpleReservation();