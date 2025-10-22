const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const mysqlConnection = require("../database_seguridad_defen.js");
const { generateToken } = require("../middleware/auth");
const captcha = require("@bestdon/nodejs-captcha");

// Almacenamiento temporal de captchas (en producción usar Redis o sesiones)
const captchaStore = new Map();

/**
 * Generar captcha
 */
router.get("/api/auth/captcha", (req, res) => {
  try {
    const result = captcha();
    const captchaId =
      Date.now().toString() + Math.random().toString(36).substring(7);

    // Almacenar captcha con tiempo de expiración (5 minutos)
    captchaStore.set(captchaId, {
      value: result.value,
      expires: Date.now() + 5 * 60 * 1000,
    });

    // Limpiar captchas expirados
    for (const [key, data] of captchaStore.entries()) {
      if (data.expires < Date.now()) {
        captchaStore.delete(key);
      }
    }

    res.json({
      success: true,
      captchaId: captchaId,
      image: result.image,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error("Error generando captcha:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar captcha",
    });
  }
});

/**
 * Verificar captcha
 */
router.post("/api/auth/verify-captcha", (req, res) => {
  const { captchaId, captchaValue } = req.body;

  if (!captchaId || !captchaValue) {
    return res.status(400).json({
      success: false,
      message: "Datos de captcha incompletos",
    });
  }

  const storedCaptcha = captchaStore.get(captchaId);

  if (!storedCaptcha) {
    return res.status(400).json({
      success: false,
      message: "Captcha no encontrado o expirado",
    });
  }

  if (storedCaptcha.expires < Date.now()) {
    captchaStore.delete(captchaId);
    return res.status(400).json({
      success: false,
      message: "Captcha expirado",
    });
  }

  if (storedCaptcha.value.toLowerCase() !== captchaValue.toLowerCase()) {
    return res.status(400).json({
      success: false,
      message: "Captcha incorrecto",
    });
  }

  // Eliminar captcha usado
  captchaStore.delete(captchaId);

  res.json({
    success: true,
    message: "Captcha válido",
  });
});

/**
 * Login de usuario
 */
router.post("/api/auth/login", async (req, res) => {
  const { username, password, captchaId, captchaValue } = req.body;

  try {
    // Validar campos requeridos
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Usuario y contraseña son requeridos",
      });
    }

    // Verificar captcha
    if (captchaId && captchaValue) {
      const storedCaptcha = captchaStore.get(captchaId);
      if (!storedCaptcha || storedCaptcha.expires < Date.now()) {
        return res.status(400).json({
          success: false,
          message: "Captcha expirado o inválido",
        });
      }
      if (storedCaptcha.value.toLowerCase() !== captchaValue.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: "Captcha incorrecto",
        });
      }
      captchaStore.delete(captchaId);
    }

    // Buscar usuario en la base de datos
    mysqlConnection.query(
      "SELECT id, username, email, password, role, activo, ultimo_acceso FROM usuarios WHERE (username = ? OR email = ?) AND activo = 1",
      [username, username],
      async (err, rows) => {
        if (err) {
          console.error("Error en consulta de usuario:", err);
          return res.status(500).json({
            success: false,
            message: "Error al verificar credenciales",
          });
        }

        if (rows.length === 0) {
          return res.status(401).json({
            success: false,
            message: "Usuario o contraseña incorrectos",
          });
        }

        const user = rows[0];

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return res.status(401).json({
            success: false,
            message: "Usuario o contraseña incorrectos",
          });
        }

        // Actualizar último acceso
        mysqlConnection.query(
          "UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?",
          [user.id],
          (updateErr) => {
            if (updateErr) {
              console.error("Error actualizando último acceso:", updateErr);
            }
          },
        );

        // Generar token
        const token = generateToken({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        });

        // Responder con token y datos del usuario
        res.json({
          success: true,
          message: "Login exitoso",
          token: token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            ultimo_acceso: user.ultimo_acceso,
          },
        });
      },
    );
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error en el proceso de autenticación",
    });
  }
});

/**
 * Registro de usuario
 */
router.post("/api/auth/register", async (req, res) => {
  const { username, email, password, nombre, apellido } = req.body;

  try {
    // Validar campos requeridos
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Usuario, email y contraseña son requeridos",
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Formato de email inválido",
      });
    }

    // Validar longitud de contraseña
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 8 caracteres",
      });
    }

    // Verificar si el usuario ya existe
    mysqlConnection.query(
      "SELECT id FROM usuarios WHERE username = ? OR email = ?",
      [username, email],
      async (err, rows) => {
        if (err) {
          console.error("Error verificando usuario existente:", err);
          return res.status(500).json({
            success: false,
            message: "Error al verificar usuario",
          });
        }

        if (rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: "El usuario o email ya existe",
          });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar usuario
        mysqlConnection.query(
          "INSERT INTO usuarios (username, email, password, nombre, apellido, role, activo, fecha_creacion) VALUES (?, ?, ?, ?, ?, 'user', 1, NOW())",
          [username, email, hashedPassword, nombre || "", apellido || ""],
          (insertErr, result) => {
            if (insertErr) {
              console.error("Error creando usuario:", insertErr);
              return res.status(500).json({
                success: false,
                message: "Error al crear usuario",
              });
            }

            res.status(201).json({
              success: true,
              message: "Usuario registrado exitosamente",
              userId: result.insertId,
            });
          },
        );
      },
    );
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      success: false,
      message: "Error en el proceso de registro",
    });
  }
});

/**
 * Cambiar contraseña
 */
router.post("/api/auth/change-password", async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  try {
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe tener al menos 8 caracteres",
      });
    }

    // Buscar usuario
    mysqlConnection.query(
      "SELECT id, password FROM usuarios WHERE username = ? AND activo = 1",
      [username],
      async (err, rows) => {
        if (err) {
          console.error("Error buscando usuario:", err);
          return res.status(500).json({
            success: false,
            message: "Error al verificar usuario",
          });
        }

        if (rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Usuario no encontrado",
          });
        }

        const user = rows[0];

        // Verificar contraseña actual
        const passwordMatch = await bcrypt.compare(
          currentPassword,
          user.password,
        );

        if (!passwordMatch) {
          return res.status(401).json({
            success: false,
            message: "Contraseña actual incorrecta",
          });
        }

        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña
        mysqlConnection.query(
          "UPDATE usuarios SET password = ?, fecha_actualizacion = NOW() WHERE id = ?",
          [hashedPassword, user.id],
          (updateErr) => {
            if (updateErr) {
              console.error("Error actualizando contraseña:", updateErr);
              return res.status(500).json({
                success: false,
                message: "Error al actualizar contraseña",
              });
            }

            res.json({
              success: true,
              message: "Contraseña actualizada exitosamente",
            });
          },
        );
      },
    );
  } catch (error) {
    console.error("Error cambiando contraseña:", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar contraseña",
    });
  }
});

/**
 * Logout (opcional - principalmente del lado del cliente)
 */
router.post("/api/auth/logout", (req, res) => {
  // El logout real se hace en el cliente eliminando el token
  res.json({
    success: true,
    message: "Logout exitoso",
  });
});

module.exports = router;
