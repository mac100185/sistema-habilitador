#!/usr/bin/env node

/**
 * Script para generar hashes bcrypt correctos
 * Se ejecuta dentro del contenedor que tiene bcrypt instalado
 *
 * Uso:
 *   docker exec sist-hab-prod node Scripts/generate_correct_hashes.js
 */

const bcrypt = require('bcrypt');

async function generateHashes() {
    console.log('='.repeat(80));
    console.log('GENERADOR DE HASHES BCRYPT CORRECTOS');
    console.log('='.repeat(80));
    console.log('');

    const passwords = {
        'admin': 'Admin2024!',
        'analista': 'Analista2024!'
    };

    console.log('Generando hashes con bcrypt (10 rounds)...');
    console.log('');

    for (const [username, password] of Object.entries(passwords)) {
        try {
            // Generar hash
            const hash = await bcrypt.hash(password, 10);

            // Verificar que el hash funciona
            const isValid = await bcrypt.compare(password, hash);

            console.log(`Usuario: ${username}`);
            console.log(`Contraseña: ${password}`);
            console.log(`Hash: ${hash}`);
            console.log(`Verificación: ${isValid ? '✓ CORRECTO' : '✗ FALLÓ'}`);
            console.log('');
            console.log(`SQL para actualizar:`);
            console.log(`UPDATE usuarios SET password = '${hash}' WHERE username = '${username}';`);
            console.log('');
            console.log('-'.repeat(80));
            console.log('');
        } catch (error) {
            console.error(`Error generando hash para ${username}:`, error);
        }
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('Para aplicar estos hashes a la base de datos:');
    console.log('='.repeat(80));
    console.log('');
    console.log('1. Copia los comandos UPDATE de arriba');
    console.log('2. Ejecuta:');
    console.log('   docker exec -i sist-hab-db-prod mysql -u root -pquanium sisthabpro');
    console.log('3. Pega los comandos UPDATE');
    console.log('4. Ejecuta: COMMIT;');
    console.log('');
    console.log('O crea un archivo SQL y ejecútalo directamente.');
    console.log('');
}

generateHashes().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
});
