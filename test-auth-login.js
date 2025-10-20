// Script para obtener token de autenticación
const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:3000/api';

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

// Función para registrar un usuario de prueba
async function registerTestUser() {
  console.log('Registrando usuario de prueba...');
  
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  };
  
  try {
    const result = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser)
    });
    
    if (result.response.status === 200 || result.response.status === 201) {
      console.log('✅ Usuario registrado correctamente');
      // Si el registro devuelve un token, lo usamos directamente
      if (result.data.token) {
        console.log('Token obtenido del registro');
        return { ...testUser, token: result.data.token };
      }
      return testUser;
    } else {
      console.log('⚠️ El usuario ya existe o hubo un error en el registro');
      return testUser;
    }
  } catch (error) {
    console.error('❌ Error al registrar usuario:', error.message);
    throw error;
  }
}

// Función para iniciar sesión y obtener token
async function loginAndGetToken(user) {
  console.log('\nIniciando sesión para obtener token...');
  
  try {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
        password: user.password
      })
    });
    
    if (result.response.status === 200 && result.data.token) {
      console.log('✅ Token obtenido correctamente');
      console.log('Token:', result.data.token);
      return result.data.token;
    } else if (result.response.status === 200 && result.data.success && result.data.token) {
      console.log('✅ Token obtenido correctamente');
      console.log('Token:', result.data.token);
      return result.data.token;
    } else {
      console.log('Estructura de respuesta:', Object.keys(result.data));
      throw new Error('No se pudo obtener el token');
    }
  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error.message);
    throw error;
  }
}

// Función principal
async function main() {
  try {
    // Registrar usuario de prueba
    const testUser = await registerTestUser();
    
    // Si ya tenemos un token del registro, lo usamos
    let token;
    if (testUser.token) {
      token = testUser.token;
      console.log('\nUsando token del registro');
    } else {
      // Iniciar sesión y obtener token
      token = await loginAndGetToken(testUser);
    }
    
    // Guardar el token en un archivo para uso posterior
    const fs = require('fs');
    fs.writeFileSync('.auth-token', token);
    console.log('\n✅ Token guardado en archivo .auth-token');
    
    console.log('\n🎉 Token de autenticación obtenido con éxito');
    console.log('Usa este token en las variables de entorno o en los scripts de prueba');
    
  } catch (error) {
    console.error('\n❌ Error en el proceso de autenticación:', error.message);
    process.exit(1);
  }
}

main();