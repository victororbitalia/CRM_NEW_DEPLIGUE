// Script para testear el token de API
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

// Reemplaza esto con tu token de API real
const API_TOKEN = 'rest_aquí_va_tu_token';

// Función auxiliar para hacer peticiones HTTP con el token de API
async function apiRequestWithToken(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
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
async function testApiToken() {
  console.log('Iniciando prueba del token de API...');
  
  try {
    // 1. Obtener todas las mesas (debería funcionar con el token)
    console.log('\n--- Paso 1: Obtener mesas con token de API ---');
    const tablesResult = await apiRequestWithToken('/tables?restaurantId=default-restaurant');
    
    if (tablesResult.response.status === 200) {
      console.log('✅ Token de API funciona correctamente');
    } else {
      console.log('❌ Token de API no funciona');
    }
    
    // 2. Intentar obtener mesas sin token (debería fallar)
    console.log('\n--- Paso 2: Intentar obtener mesas sin token ---');
    const response = await fetch(`${API_BASE}/tables?restaurantId=default-restaurant`);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ La API correctamente rechaza peticiones sin token');
    } else {
      console.log('❌ La API debería rechazar peticiones sin token');
    }
    
    console.log('\n¡Prueba completada!');
  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar la prueba
testApiToken();