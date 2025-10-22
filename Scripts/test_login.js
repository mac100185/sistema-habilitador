#!/usr/bin/env node

/**
 * Script de prueba de autenticación
 * Sistema Habilitador
 *
 * Este script verifica que el sistema de autenticación funciona correctamente
 * probando el login con las credenciales por defecto.
 *
 * Uso:
 *   node test_login.js [username] [password]
 *
 * Si no se proporcionan credenciales, usa las credenciales por defecto:
 *   Username: admin
 *   Password: Admin2024!
 */

const http = require('http');
const https = require('https');

// Configuración
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 7777;
const API_PROTOCOL = process.env.API_PROTOCOL || 'http';

// Credenciales por defecto
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'Admin2024!';

/**
 * Realizar petición HTTP
 */
function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const protocol = API_PROTOCOL === 'https' ? https : http;

        const req = protocol.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (postData) {
            req.write(postData);
        }

        req.end();
    });
}

/**
 * Probar health check
 */
async function testHealthCheck() {
    console.log('\n📋 Probando Health Check...');
    console.log('='.repeat(80));

    try {
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: '/api/health',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const response = await makeRequest(options);

        if (response.statusCode === 200) {
            console.log('✓ Health check exitoso');
            console.log('  Estado:', response.data.status);
            console.log('  Base de datos:', response.data.database);
            console.log('  Ambiente:', response.data.environment);
            console.log('  Versión:', response.data.version);
            return true;
        } else {
            console.log('✗ Health check falló');
            console.log('  Status Code:', response.statusCode);
            console.log('  Respuesta:', JSON.stringify(response.data, null, 2));
            return false;
        }
    } catch (error) {
        console.log('✗ Error en health check:', error.message);
        return false;
    }
}

/**
 * Probar login
 */
async function testLogin(username, password) {
    console.log('\n🔐 Probando Login...');
    console.log('='.repeat(80));
    console.log('  Usuario:', username);
    console.log('  Contraseña:', '*'.repeat(password.length));

    try {
        const postData = JSON.stringify({
            username: username,
            password: password
        });

        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const response = await makeRequest(options, postData);

        console.log('\n  Status Code:', response.statusCode);

        if (response.statusCode === 200 && response.data.success) {
            console.log('✓ Login exitoso');
            console.log('\n  Token recibido:', response.data.token ? 'Sí' : 'No');
            if (response.data.token) {
                console.log('  Token (primeros 50 chars):', response.data.token.substring(0, 50) + '...');
            }

            if (response.data.user) {
                console.log('\n  Información del usuario:');
                console.log('    ID:', response.data.user.id);
                console.log('    Username:', response.data.user.username);
                console.log('    Email:', response.data.user.email);
                console.log('    Role:', response.data.user.role);
            }

            return {
                success: true,
                token: response.data.token,
                user: response.data.user
            };
        } else {
            console.log('✗ Login fallido');
            console.log('  Mensaje:', response.data.message || 'Sin mensaje');
            if (response.data.error) {
                console.log('  Error:', response.data.error);
            }
            return {
                success: false,
                message: response.data.message
            };
        }
    } catch (error) {
        console.log('✗ Error en login:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Probar verificación de token
 */
async function testVerifyToken(token) {
    console.log('\n🔍 Probando verificación de token...');
    console.log('='.repeat(80));

    try {
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: '/api/auth/verify',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const response = await makeRequest(options);

        if (response.statusCode === 200 && response.data.success) {
            console.log('✓ Token válido');
            if (response.data.user) {
                console.log('  Usuario verificado:');
                console.log('    ID:', response.data.user.id);
                console.log('    Email:', response.data.user.email);
                console.log('    Role:', response.data.user.role);
            }
            return true;
        } else {
            console.log('✗ Token inválido');
            console.log('  Mensaje:', response.data.message || 'Sin mensaje');
            return false;
        }
    } catch (error) {
        console.log('✗ Error verificando token:', error.message);
        return false;
    }
}

/**
 * Probar ruta protegida
 */
async function testProtectedRoute(token) {
    console.log('\n🔒 Probando acceso a ruta protegida...');
    console.log('='.repeat(80));

    try {
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: '/api/seguridad_def',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const response = await makeRequest(options);

        if (response.statusCode === 200) {
            console.log('✓ Acceso autorizado a ruta protegida');
            console.log('  Registros recibidos:', Array.isArray(response.data) ? response.data.length : 'N/A');
            return true;
        } else if (response.statusCode === 401 || response.statusCode === 403) {
            console.log('✗ Acceso denegado (esperado sin token)');
            console.log('  Status Code:', response.statusCode);
            return false;
        } else {
            console.log('⚠ Respuesta inesperada');
            console.log('  Status Code:', response.statusCode);
            return false;
        }
    } catch (error) {
        console.log('✗ Error accediendo a ruta protegida:', error.message);
        return false;
    }
}

/**
 * Función principal
 */
async function main() {
    console.log('='.repeat(80));
    console.log('           PRUEBA DE AUTENTICACIÓN - SISTEMA HABILITADOR');
    console.log('='.repeat(80));
    console.log('  API Host:', API_HOST);
    console.log('  API Port:', API_PORT);
    console.log('  Protocol:', API_PROTOCOL);
    console.log('='.repeat(80));

    // Obtener credenciales
    const username = process.argv[2] || DEFAULT_USERNAME;
    const password = process.argv[3] || DEFAULT_PASSWORD;

    let allTestsPassed = true;

    // 1. Probar Health Check
    const healthCheckOk = await testHealthCheck();
    if (!healthCheckOk) {
        console.log('\n⚠ Advertencia: Health check falló. Continuando con las pruebas...');
    }

    // 2. Probar Login
    const loginResult = await testLogin(username, password);
    if (!loginResult.success) {
        console.log('\n✗ Login falló. No se pueden realizar más pruebas.');
        allTestsPassed = false;
    } else {
        // 3. Probar verificación de token
        const tokenValid = await testVerifyToken(loginResult.token);
        if (!tokenValid) {
            console.log('\n✗ Verificación de token falló.');
            allTestsPassed = false;
        }

        // 4. Probar ruta protegida
        const protectedRouteOk = await testProtectedRoute(loginResult.token);
        if (!protectedRouteOk) {
            console.log('\n⚠ Acceso a ruta protegida falló.');
        }
    }

    // Resumen
    console.log('\n' + '='.repeat(80));
    console.log('                            RESUMEN');
    console.log('='.repeat(80));

    if (allTestsPassed && loginResult.success) {
        console.log('✓ TODAS LAS PRUEBAS PASARON EXITOSAMENTE');
        console.log('\nEl sistema de autenticación está funcionando correctamente.');
        console.log('\nCredenciales probadas:');
        console.log('  Usuario:', username);
        console.log('  Contraseña: [OCULTA]');
        console.log('\nPuedes usar estas credenciales para acceder al sistema:');
        console.log(`  URL: ${API_PROTOCOL}://${API_HOST}:${API_PORT}/login.html`);
    } else {
        console.log('✗ ALGUNAS PRUEBAS FALLARON');
        console.log('\nPor favor, verifica:');
        console.log('  1. Que el servidor esté corriendo');
        console.log('  2. Que la base de datos esté activa');
        console.log('  3. Que las credenciales sean correctas');
        console.log('  4. Que la tabla de usuarios esté inicializada');
        console.log('\nPara inicializar la base de datos:');
        console.log('  mysql -u quanium -p sisthabpro < db/usuarios.sql');
    }

    console.log('='.repeat(80));

    process.exit(allTestsPassed && loginResult.success ? 0 : 1);
}

// Ejecutar
main().catch(error => {
    console.error('\n✗ Error fatal:', error);
    process.exit(1);
});
