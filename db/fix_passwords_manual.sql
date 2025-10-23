-- ============================================================================
-- Script Manual de Corrección de Contraseñas
-- Sistema Habilitador
-- ============================================================================
--
-- Este script verifica y corrige los hashes de contraseñas en la base de datos
-- para asegurar que el login funcione correctamente.
--
-- ⚠️ IMPORTANTE: GENERAR HASHES CORRECTOS PRIMERO
-- ============================================================================
--
-- PASO 0: Generar los hashes correctos usando el contenedor:
--   docker exec sist-hab-prod node Scripts/generate_correct_hashes.js
--
--   Copia los hashes generados y reemplázalos en las líneas 62 y 71 de este archivo
--   antes de ejecutarlo.
--
-- ============================================================================
-- USO (después de actualizar los hashes):
--   Opción 1 - Desde el host:
--     mysql -u root -pquanium sisthabpro < db/fix_passwords_manual.sql
--
--   Opción 2 - Desde Docker:
--     docker exec -i sist-hab-db-prod mysql -u root -pquanium sisthabpro < db/fix_passwords_manual.sql
--
--   Opción 3 - Desde MySQL CLI:
--     mysql -u root -pquanium sisthabpro
--     source /ruta/a/fix_passwords_manual.sql;
--
-- ============================================================================

USE sisthabpro;

-- Mostrar configuración actual
SELECT '============================================================' AS '';
SELECT 'VERIFICACIÓN INICIAL - ESTADO ACTUAL' AS '';
SELECT '============================================================' AS '';

SELECT
    username,
    email,
    role,
    activo,
    LEFT(password, 30) AS password_hash_preview,
    intentos_fallidos,
    bloqueado_hasta,
    DATE_FORMAT(fecha_creacion, '%Y-%m-%d %H:%i:%s') AS fecha_creacion,
    DATE_FORMAT(ultimo_acceso, '%Y-%m-%d %H:%i:%s') AS ultimo_acceso
FROM usuarios
WHERE username IN ('admin', 'analista')
ORDER BY username;

-- Limpiar intentos fallidos y bloqueos
SELECT '============================================================' AS '';
SELECT 'PASO 1: Limpiando intentos fallidos y bloqueos' AS '';
SELECT '============================================================' AS '';

UPDATE usuarios
SET intentos_fallidos = 0,
    bloqueado_hasta = NULL
WHERE username IN ('admin', 'analista');

SELECT CONCAT('✓ ', ROW_COUNT(), ' usuarios actualizados') AS resultado;

-- Actualizar hashes de contraseñas con valores correctos
SELECT '============================================================' AS '';
SELECT 'PASO 2: Actualizando hashes de contraseñas' AS '';
SELECT '============================================================' AS '';

-- Usuario admin
-- Contraseña: Admin2024!
-- Hash bcrypt (10 rounds): REEMPLAZAR_CON_HASH_GENERADO
-- ⚠️ Ejecuta: docker exec sist-hab-prod node Scripts/generate_correct_hashes.js
-- y copia el hash del usuario admin aquí ↓
UPDATE usuarios
SET password = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    fecha_actualizacion = NOW()
WHERE username = 'admin';

SELECT CONCAT('✓ Usuario admin actualizado (', ROW_COUNT(), ' filas)') AS resultado;

-- Usuario analista
-- Contraseña: Analista2024!
-- Hash bcrypt (10 rounds): REEMPLAZAR_CON_HASH_GENERADO
-- ⚠️ Ejecuta: docker exec sist-hab-prod node Scripts/generate_correct_hashes.js
-- y copia el hash del usuario analista aquí ↓
UPDATE usuarios
SET password = '$2b$10$X5Q4hIv/QEqAf6.p.ufYu.bX3XLQ7f5PXs5YvX5wnBPBVyZHLfPH6',
    fecha_actualizacion = NOW()
WHERE username = 'analista';

SELECT CONCAT('✓ Usuario analista actualizado (', ROW_COUNT(), ' filas)') AS resultado;

-- Verificar actualizaciones
SELECT '============================================================' AS '';
SELECT 'PASO 3: Verificación de hashes actualizados' AS '';
SELECT '============================================================' AS '';

SELECT
    username,
    CASE
        WHEN username = 'admin' AND password = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
            THEN '✓ CORRECTO'
        WHEN username = 'analista' AND password = '$2b$10$X5Q4hIv/QEqAf6.p.ufYu.bX3XLQ7f5PXs5YvX5wnBPBVyZHLfPH6'
            THEN '✓ CORRECTO'
        ELSE '✗ INCORRECTO'
    END AS estado_hash,
    LEFT(password, 30) AS password_preview,
    fecha_actualizacion
FROM usuarios
WHERE username IN ('admin', 'analista')
ORDER BY username;

-- Registrar en auditoría
SELECT '============================================================' AS '';
SELECT 'PASO 4: Registrando en auditoría' AS '';
SELECT '============================================================' AS '';

INSERT INTO auditoria_usuarios (usuario_id, accion, descripcion, fecha)
SELECT
    id,
    'PASSWORD_FIX',
    'Hash de contraseña corregido manualmente',
    NOW()
FROM usuarios
WHERE username IN ('admin', 'analista');

SELECT CONCAT('✓ ', ROW_COUNT(), ' registros de auditoría creados') AS resultado;

-- Resumen final
SELECT '============================================================' AS '';
SELECT 'RESUMEN FINAL - ESTADO DESPUÉS DE CORRECCIÓN' AS '';
SELECT '============================================================' AS '';

SELECT
    username,
    email,
    role,
    activo AS esta_activo,
    CASE
        WHEN intentos_fallidos = 0 THEN '✓ Sin intentos fallidos'
        ELSE CONCAT('⚠ ', intentos_fallidos, ' intentos fallidos')
    END AS estado_intentos,
    CASE
        WHEN bloqueado_hasta IS NULL THEN '✓ No bloqueado'
        WHEN bloqueado_hasta < NOW() THEN '✓ Bloqueo expirado'
        ELSE CONCAT('✗ Bloqueado hasta ', bloqueado_hasta)
    END AS estado_bloqueo,
    DATE_FORMAT(fecha_actualizacion, '%Y-%m-%d %H:%i:%s') AS ultima_actualizacion
FROM usuarios
WHERE username IN ('admin', 'analista')
ORDER BY username;

SELECT '' AS '';
SELECT '============================================================' AS '';
SELECT 'CREDENCIALES ACTUALIZADAS' AS '';
SELECT '============================================================' AS '';
SELECT '' AS '';
SELECT 'Usuario Admin:' AS '';
SELECT '  Username: admin' AS '';
SELECT '  Password: Admin2024!' AS '';
SELECT '  Role: admin' AS '';
SELECT '' AS '';
SELECT 'Usuario Analista:' AS '';
SELECT '  Username: analista' AS '';
SELECT '  Password: Analista2024!' AS '';
SELECT '  Role: analista' AS '';
SELECT '' AS '';
SELECT '⚠ IMPORTANTE: Cambia estas contraseñas después del primer acceso' AS '';
SELECT '============================================================' AS '';
SELECT 'CORRECCIÓN COMPLETADA' AS '';
SELECT '============================================================' AS '';
SELECT '' AS '';
SELECT 'Próximos pasos:' AS '';
SELECT '  1. Verifica que los hashes fueron actualizados correctamente' AS '';
SELECT '  2. Reinicia el contenedor de la aplicación web:' AS '';
SELECT '     docker compose restart websh' AS '';
SELECT '  3. Accede a: http://localhost:7777/login.html o http://hack_tool:7777/login.html' AS '';
SELECT '  4. Inicia sesión con las credenciales mostradas arriba' AS '';
SELECT '  5. Cambia las contraseñas desde el sistema' AS '';
SELECT '' AS '';
SELECT '============================================================' AS '';
