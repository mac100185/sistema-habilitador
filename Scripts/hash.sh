#!/usr/bin/env node
/*
# Instala node primero
# luego ejecuta:
# npm install bcrypt
# npm install -g bcrypt
# node -e "console.log(require('bcrypt'))"
# si la salida es un json entonces todo esta ok
# luego ejecutas este script con node hash.sh
*/
const bcrypt = require('bcrypt');

async function generateHashes() {
    const passwords = {
        'admin': 'admin',
        'analista': 'analista'
    };

    console.log('Generando hashes bcrypt (10 rounds)...\n');

    for (const [username, password] of Object.entries(passwords)) {
        try {
            const hash = await bcrypt.hash(password, 10);
            const isValid = await bcrypt.compare(password, hash);

            console.log(`Usuario: ${username}`);
            console.log(`Contraseña: ${password}`);
            console.log(`Hash: ${hash}`);
            console.log(`Verificación: ${isValid ? '✓ CORRECTO' : '✗ FALLÓ'}`);
            console.log(''); // Separador entre usuarios
        } catch (error) {
            console.error(`Error generando hash para ${username}:`, error);
        }
    }
}

generateHashes().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
});
