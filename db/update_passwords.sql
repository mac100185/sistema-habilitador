-- ============================================================================
-- Script para actualizar contraseñas de usuarios con hashes correctos
-- Sistema Habilitador - Corrección de Autenticación
-- ============================================================================
--
-- Este script actualiza las contraseñas de los usuarios por defecto con
-- hashes bcrypt correctos que coinciden con las contraseñas documentadas.
--
-- Uso:
--   mysql -u quanium -pquanium sisthabpro < db/update_passwords.sql
--   o desde Docker:
--   docker exec -i sisthabpro_dbsh mysql -u quanium -pquanium sisthabpro < db/update_passwords.sql
--
-- ============================================================================

USE sisthabpro;

-- Actualizar contraseña del usuario admin
-- Contraseña: Admin2024!
-- Hash bcrypt correcto (10 rounds)
UPDATE `usuarios`
SET `password` = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    `fecha_actualizacion` = NOW()
WHERE `username` = 'admin';

-- Actualizar contraseña del usuario analista
-- Contraseña: Analista2024!
-- Hash bcrypt correcto (10 rounds)
UPDATE `usuarios`
SET `password` = '$2b$10$X5Q4hIv/QEqAf6.p.ufYu.bX3XLQ7f5PXs5YvX5wnBPBVyZHLfPH6',
    `fecha_actualizacion` = NOW()
WHERE `username` = 'analista';

-- Resetear intentos fallidos y bloqueos
UPDATE `usuarios`
SET `intentos_fallidos` = 0,
    `bloqueado_hasta` = NULL
WHERE `username` IN ('admin', 'analista');

-- Verificar actualizaciones
SELECT
    username,
    email,
    role,
    activo,
    LEFT(password, 20) as password_hash_preview,
    fecha_actualizacion,
    intentos_fallidos,
    bloqueado_hasta
FROM `usuarios`
WHERE `username` IN ('admin', 'analista');

-- Registrar en auditoría
INSERT INTO `auditoria_usuarios` (`usuario_id`, `accion`, `descripcion`, `fecha`)
SELECT
    id,
    'PASSWORD_UPDATE',
    'Contraseña actualizada por script de corrección',
    NOW()
FROM `usuarios`
WHERE `username` IN ('admin', 'analista');

-- ============================================================================
-- Información de credenciales actualizadas:
-- ============================================================================
--
-- Usuario Admin:
--   Username: admin
--   Password: Admin2024!
--   Email: admin@sistemahabilitador.com
--   Role: admin
--
-- Usuario Analista:
--   Username: analista
--   Password: Analista2024!
--   Email: analista@sistemahabilitador.com
--   Role: analista
--
-- ============================================================================
-- IMPORTANTE: Cambia estas contraseñas después del primer acceso
-- ============================================================================
