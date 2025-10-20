// Script simple para obtener token de autenticación
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
          resolve({ response: res, data: jsonData });
        } catch (error) {
          resolve({ response: res, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Función principal
async function main() {
  try {
    // Crear usuario de prueba y obtener token
    const testUser = {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };
    
    console.log('Registrando usuario de prueba...');
    const registerResult = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser)
    });
    
    let token;
    if (registerResult.data.token) {
      token = registerResult.data.token;
      console.log('✅ Token obtenido del registro');
    } else {
      console.log('Iniciando sesión...');
      const loginResult = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });
      
      if (loginResult.data.token) {
        token = loginResult.data.token;
        console.log('✅ Token obtenido del login');
      } else {
        throw new Error('No se pudo obtener el token');
      }
    }
    
    // Guardar el token en un archivo
    const fs = require('fs');
    fs.writeFileSync('.auth-token', token);
    console.log('\n✅ Token guardado en archivo .auth-token');
    console.log('Token:', token);
    
    console.log('\n🎉 Token de autenticación obtenido con éxito');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();