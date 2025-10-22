/**
 * Utilidad de Verificación de Configuración y Seguridad
 * Sistema Habilitador
 *
 * Verifica que las variables de entorno y configuraciones críticas
 * estén correctamente establecidas antes de iniciar el servidor
 */

const fs = require('fs');
const path = require('path');

class ConfigChecker {
    constructor() {
        this.warnings = [];
        this.errors = [];
        this.info = [];
    }

    /**
     * Ejecutar todas las verificaciones
     */
    checkAll() {
        console.log('\n🔍 Verificando configuración del sistema...\n');

        this.checkEnvironment();
        this.checkDatabaseConfig();
        this.checkSecurityConfig();
        this.checkDirectories();
        this.checkDependencies();
        this.checkNodeVersion();

        return this.displayResults();
    }

    /**
     * Verificar variables de entorno
     */
    checkEnvironment() {
        const env = process.env.NODE_ENV || 'development';

        if (env === 'production') {
            this.info.push('✓ Ambiente: PRODUCTION');
        } else {
            this.warnings.push(`⚠ Ambiente: ${env.toUpperCase()} (no es producción)`);
        }
    }

    /**
     * Verificar configuración de base de datos
     */
    checkDatabaseConfig() {
        const dbConfig = {
            host: process.env.DB_HOST || 'dbsh',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'quanium',
            database: process.env.DB_NAME || 'sisthabpro'
        };

        // Verificar que no se usen valores por defecto en producción
        if (process.env.NODE_ENV === 'production') {
            if (dbConfig.user === 'quanium' || process.env.DB_PASSWORD === 'quanium') {
                this.errors.push('❌ CRÍTICO: Usando credenciales de BD por defecto en producción');
            } else {
                this.info.push('✓ Credenciales de BD personalizadas');
            }
        }

        this.info.push(`✓ Base de datos: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
    }

    /**
     * Verificar configuración de seguridad
     */
    checkSecurityConfig() {
        // JWT Secret
        const jwtSecret = process.env.JWT_SECRET || 'sistema-habilitador-secret-key-2024';

        if (process.env.NODE_ENV === 'production') {
            if (jwtSecret === 'sistema-habilitador-secret-key-2024' ||
                jwtSecret === 'sistema-habilitador-secret-key-prod-2024-change-this') {
                this.errors.push('❌ CRÍTICO: JWT_SECRET usando valor por defecto en producción');
                this.errors.push('   Generar nuevo secret con: openssl rand -base64 32');
            } else if (jwtSecret.length < 32) {
                this.warnings.push('⚠ JWT_SECRET demasiado corto (mínimo 32 caracteres recomendado)');
            } else {
                this.info.push('✓ JWT_SECRET configurado correctamente');
            }
        }

        // JWT Expiration
        const jwtExpires = process.env.JWT_EXPIRES_IN || '8h';
        this.info.push(`✓ JWT expira en: ${jwtExpires}`);

        // CORS Origins
        const allowedOrigins = process.env.ALLOWED_ORIGINS;
        if (process.env.NODE_ENV === 'production' && (!allowedOrigins || allowedOrigins === '*')) {
            this.warnings.push('⚠ CORS permite todos los orígenes (*) en producción');
            this.warnings.push('   Recomendación: Configurar ALLOWED_ORIGINS con dominios específicos');
        } else if (allowedOrigins && allowedOrigins !== '*') {
            this.info.push(`✓ CORS configurado: ${allowedOrigins.split(',').length} origen(es) permitido(s)`);
        }
    }

    /**
     * Verificar directorios necesarios
     */
    checkDirectories() {
        const requiredDirs = [
            { path: './src/publico/imagen2', description: 'Evidencias' },
            { path: './src/publico/imagen4', description: 'Imágenes de seguridad' }
        ];

        requiredDirs.forEach(dir => {
            const fullPath = path.join(process.cwd(), dir.path);
            if (fs.existsSync(fullPath)) {
                this.info.push(`✓ Directorio ${dir.description}: OK`);
            } else {
                this.warnings.push(`⚠ Directorio ${dir.description} no existe: ${dir.path}`);
                this.warnings.push(`   Se creará automáticamente al subir archivos`);
            }
        });
    }

    /**
     * Verificar dependencias críticas
     */
    checkDependencies() {
        const criticalDeps = [
            'express',
            'mysql2',
            'bcrypt',
            'jsonwebtoken',
            'dotenv',
            'helmet',
            'cors'
        ];

        let allFound = true;
        criticalDeps.forEach(dep => {
            try {
                require.resolve(dep);
            } catch (e) {
                this.errors.push(`❌ Dependencia crítica no encontrada: ${dep}`);
                allFound = false;
            }
        });

        if (allFound) {
            this.info.push(`✓ Todas las dependencias críticas instaladas (${criticalDeps.length})`);
        }
    }

    /**
     * Verificar versión de Node.js
     */
    checkNodeVersion() {
        const currentVersion = process.version;
        const requiredVersion = '18.16.1';
        const currentMajor = parseInt(currentVersion.split('.')[0].substring(1));
        const requiredMajor = parseInt(requiredVersion.split('.')[0]);

        if (currentMajor === requiredMajor) {
            this.info.push(`✓ Node.js ${currentVersion} (compatible con v${requiredVersion})`);
        } else if (currentMajor < requiredMajor) {
            this.errors.push(`❌ Node.js ${currentVersion} es demasiado antiguo (requerido: v${requiredMajor}.x)`);
        } else {
            this.warnings.push(`⚠ Node.js ${currentVersion} es más nuevo que v${requiredMajor}.x (pueden haber incompatibilidades)`);
        }
    }

    /**
     * Mostrar resultados
     */
    displayResults() {
        // Mostrar información
        if (this.info.length > 0) {
            console.log('📋 INFORMACIÓN:');
            this.info.forEach(msg => console.log(`   ${msg}`));
            console.log('');
        }

        // Mostrar advertencias
        if (this.warnings.length > 0) {
            console.log('⚠️  ADVERTENCIAS:');
            this.warnings.forEach(msg => console.log(`   ${msg}`));
            console.log('');
        }

        // Mostrar errores
        if (this.errors.length > 0) {
            console.log('❌ ERRORES CRÍTICOS:');
            this.errors.forEach(msg => console.log(`   ${msg}`));
            console.log('');
        }

        // Resumen
        const hasErrors = this.errors.length > 0;
        const hasWarnings = this.warnings.length > 0;

        if (hasErrors) {
            console.log('❌ VERIFICACIÓN FALLIDA: Se encontraron errores críticos');
            console.log('   El sistema puede no funcionar correctamente\n');
            return false;
        } else if (hasWarnings) {
            console.log('⚠️  VERIFICACIÓN COMPLETADA CON ADVERTENCIAS');
            console.log('   El sistema funcionará pero hay aspectos a mejorar\n');
            return true;
        } else {
            console.log('✅ VERIFICACIÓN EXITOSA: Todo está correctamente configurado\n');
            return true;
        }
    }

    /**
     * Verificación rápida (solo errores críticos)
     */
    quickCheck() {
        this.checkSecurityConfig();
        this.checkDependencies();

        if (this.errors.length > 0) {
            console.error('\n❌ Errores críticos detectados:');
            this.errors.forEach(msg => console.error(`   ${msg}`));
            return false;
        }
        return true;
    }
}

/**
 * Exportar función principal
 */
function checkConfiguration(quick = false) {
    const checker = new ConfigChecker();
    return quick ? checker.quickCheck() : checker.checkAll();
}

/**
 * Si se ejecuta directamente
 */
if (require.main === module) {
    const quick = process.argv.includes('--quick');
    const success = checkConfiguration(quick);
    process.exit(success ? 0 : 1);
}

module.exports = {
    ConfigChecker,
    checkConfiguration
};
