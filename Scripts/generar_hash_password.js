#!/usr/bin/env node

/**
 * Script para generar hashes de contraseñas usando bcrypt
 * Compatible con Node.js 18.16.1
 *
 * Uso:
 *   node generar_hash_password.js <contraseña>
 *   o ejecutar sin argumentos para modo interactivo
 */

const bcrypt = require('bcrypt');
const readline = require('readline');

// Número de rondas de salt (10 es estándar, más alto = más seguro pero más lento)
const SALT_ROUNDS = 10;

/**
 * Genera un hash bcrypt de una contraseña
 */
async function generateHash(password) {
    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        return hash;
    } catch (error) {
        console.error('Error generando hash:', error);
        return null;
    }
}

/**
 * Verifica una contraseña contra un hash
 */
async function verifyHash(password, hash) {
    try {
        const match = await bcrypt.compare(password, hash);
        return match;
    } catch (error) {
        console.error('Error verificando hash:', error);
        return false;
    }
}

/**
 * Modo interactivo
 */
async function interactiveMode() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Ingrese la contraseña a hashear: ', async (password) => {
            if (!password || password.trim() === '') {
                console.log('Error: La contraseña no puede estar vacía');
                rl.close();
                resolve();
                return;
            }

            console.log('\nGenerando hash...\n');
            const hash = await generateHash(password);

            if (hash) {
                console.log('='.repeat(80));
                console.log('Contraseña:', password);
                console.log('Hash bcrypt:', hash);
                console.log('='.repeat(80));
                console.log('\nSQL para insertar usuario:');
                console.log(`INSERT INTO usuarios (username, email, password, nombre, apellido, role, activo, fecha_creacion)`);
                console.log(`VALUES ('usuario', 'usuario@example.com', '${hash}', 'Nombre', 'Apellido', 'user', 1, NOW());`);
                console.log('='.repeat(80));

                // Verificar el hash generado
                console.log('\nVerificando hash generado...');
                const isValid = await verifyHash(password, hash);
                console.log('Verificación:', isValid ? '✓ VÁLIDO' : '✗ INVÁLIDO');
            }

            rl.close();
            resolve();
        });
    });
}

/**
 * Función principal
 */
async function main() {
    console.log('============================================================================');
    console.log('           GENERADOR DE HASHES BCRYPT - SISTEMA HABILITADOR');
    console.log('============================================================================\n');

    const password = process.argv[2];

    if (password) {
        // Modo comando con contraseña como argumento
        console.log('Generando hash para la contraseña proporcionada...\n');
        const hash = await generateHash(password);

        if (hash) {
            console.log('='.repeat(80));
            console.log('Contraseña:', password);
            console.log('Hash bcrypt:', hash);
            console.log('='.repeat(80));
            console.log('\nSQL para insertar usuario:');
            console.log(`INSERT INTO usuarios (username, email, password, nombre, apellido, role, activo, fecha_creacion)`);
            console.log(`VALUES ('usuario', 'usuario@example.com', '${hash}', 'Nombre', 'Apellido', 'user', 1, NOW());`);
            console.log('='.repeat(80));

            // Verificar el hash generado
            console.log('\nVerificando hash generado...');
            const isValid = await verifyHash(password, hash);
            console.log('Verificación:', isValid ? '✓ VÁLIDO' : '✗ INVÁLIDO');
        }
    } else {
        // Modo interactivo
        await interactiveMode();
    }

    console.log('\n============================================================================');
}

// Verificar si bcrypt está instalado
try {
    require.resolve('bcrypt');
} catch (e) {
    console.error('Error: El módulo "bcrypt" no está instalado.');
    console.error('Por favor ejecute: npm install bcrypt');
    process.exit(1);
}

// Ejecutar
main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
