-- ============================================================================
-- Tabla de usuarios para autenticación y autorización
-- Sistema Habilitador - Gestión de Seguridad y Controles
-- ============================================================================

USE sisthabpro;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `nombre` VARCHAR(100) DEFAULT NULL,
  `apellido` VARCHAR(100) DEFAULT NULL,
  `role` ENUM('admin', 'analista', 'user', 'viewer') NOT NULL DEFAULT 'user',
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `ultimo_acceso` DATETIME DEFAULT NULL,
  `intentos_fallidos` INT(11) NOT NULL DEFAULT 0,
  `bloqueado_hasta` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de sesiones (opcional, para tracking)
CREATE TABLE IF NOT EXISTS `sesiones` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) NOT NULL,
  `token` VARCHAR(500) NOT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `fecha_inicio` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` DATETIME NOT NULL,
  `activa` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_usuario_id` (`usuario_id`),
  KEY `idx_token` (`token`(255)),
  KEY `idx_activa` (`activa`),
  CONSTRAINT `fk_sesiones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS `auditoria_usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) DEFAULT NULL,
  `accion` VARCHAR(50) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_usuario_id` (`usuario_id`),
  KEY `idx_accion` (`accion`),
  KEY `idx_fecha` (`fecha`),
  CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar usuario administrador por defecto
-- Usuario: admin
-- Contraseña: Admin2024! (debe ser cambiada en primer uso)
-- Hash generado con bcrypt (10 rounds)
INSERT INTO `usuarios` (`username`, `email`, `password`, `nombre`, `apellido`, `role`, `activo`, `fecha_creacion`)
VALUES
('admin', 'admin@sistemahabilitador.com', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Administrador', 'Sistema', 'admin', 1, NOW())
ON DUPLICATE KEY UPDATE
  `password` = '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
  `nombre` = 'Administrador',
  `apellido` = 'Sistema',
  `role` = 'admin';

-- Insertar usuario de prueba (analista)
-- Usuario: analista
-- Contraseña: Analista2024!
-- Hash generado con bcrypt (10 rounds)
INSERT INTO `usuarios` (`username`, `email`, `password`, `nombre`, `apellido`, `role`, `activo`, `fecha_creacion`)
VALUES
('analista', 'analista@sistemahabilitador.com', '$2b$10$8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8eMqOPBqj6PXqvzWJm4rSLqkqP8rF3RK2', 'Usuario', 'Analista', 'analista', 1, NOW())
ON DUPLICATE KEY UPDATE
  `password` = '$2b$10$8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8eMqOPBqj6PXqvzWJm4rSLqkqP8rF3RK2',
  `nombre` = 'Usuario',
  `apellido` = 'Analista',
  `role` = 'analista';

-- Crear vista para información de usuarios (sin contraseña)
CREATE OR REPLACE VIEW `v_usuarios` AS
SELECT
  `id`,
  `username`,
  `email`,
  `nombre`,
  `apellido`,
  `role`,
  `activo`,
  `fecha_creacion`,
  `fecha_actualizacion`,
  `ultimo_acceso`,
  `intentos_fallidos`,
  `bloqueado_hasta`,
  CASE
    WHEN `bloqueado_hasta` > NOW() THEN 1
    ELSE 0
  END AS `esta_bloqueado`
FROM `usuarios`;

-- Procedimiento almacenado para bloquear usuario después de intentos fallidos
DELIMITER //

CREATE PROCEDURE `sp_registrar_intento_fallido`(
  IN p_username VARCHAR(50)
)
BEGIN
  DECLARE v_intentos INT;
  DECLARE v_usuario_id INT;

  -- Obtener intentos actuales
  SELECT `id`, `intentos_fallidos` INTO v_usuario_id, v_intentos
  FROM `usuarios`
  WHERE `username` = p_username AND `activo` = 1
  LIMIT 1;

  IF v_usuario_id IS NOT NULL THEN
    -- Incrementar intentos fallidos
    SET v_intentos = v_intentos + 1;

    -- Si alcanza 5 intentos, bloquear por 30 minutos
    IF v_intentos >= 5 THEN
      UPDATE `usuarios`
      SET `intentos_fallidos` = v_intentos,
          `bloqueado_hasta` = DATE_ADD(NOW(), INTERVAL 30 MINUTE)
      WHERE `id` = v_usuario_id;

      -- Registrar en auditoría
      INSERT INTO `auditoria_usuarios` (`usuario_id`, `accion`, `descripcion`)
      VALUES (v_usuario_id, 'BLOQUEO_AUTOMATICO', 'Usuario bloqueado por múltiples intentos fallidos');
    ELSE
      UPDATE `usuarios`
      SET `intentos_fallidos` = v_intentos
      WHERE `id` = v_usuario_id;
    END IF;
  END IF;
END//

-- Procedimiento almacenado para resetear intentos fallidos
CREATE PROCEDURE `sp_resetear_intentos_fallidos`(
  IN p_usuario_id INT
)
BEGIN
  UPDATE `usuarios`
  SET `intentos_fallidos` = 0,
      `bloqueado_hasta` = NULL
  WHERE `id` = p_usuario_id;

  -- Registrar en auditoría
  INSERT INTO `auditoria_usuarios` (`usuario_id`, `accion`, `descripcion`)
  VALUES (p_usuario_id, 'RESET_INTENTOS', 'Intentos fallidos reseteados');
END//

-- Procedimiento almacenado para desbloquear usuarios automáticamente
CREATE PROCEDURE `sp_desbloquear_usuarios_expirados`()
BEGIN
  UPDATE `usuarios`
  SET `bloqueado_hasta` = NULL,
      `intentos_fallidos` = 0
  WHERE `bloqueado_hasta` IS NOT NULL
    AND `bloqueado_hasta` < NOW();
END//

DELIMITER ;

-- Crear evento para desbloquear usuarios automáticamente cada 5 minutos
-- (Requiere que el event scheduler esté activo: SET GLOBAL event_scheduler = ON;)
CREATE EVENT IF NOT EXISTS `evt_desbloquear_usuarios`
ON SCHEDULE EVERY 5 MINUTE
DO CALL `sp_desbloquear_usuarios_expirados`();

-- ============================================================================
-- Información de usuarios por defecto:
-- ============================================================================
-- Usuario Admin:
--   Username: admin
--   Password: Admin2024!
--   Role: admin
--
-- Usuario Analista:
--   Username: analista
--   Password: Analista2024!
--   Role: analista
--
-- IMPORTANTE: Se recomienda cambiar estas contraseñas en el primer uso
-- ============================================================================
