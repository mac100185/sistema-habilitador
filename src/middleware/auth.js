const jwt = require("jsonwebtoken");
const mysqlConnection = require("../database_seguridad_defen.js");

// Clave secreta para JWT (en producción debe estar en variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || "sistema-habilitador-secret-key-2024";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

/**
 * Middleware para verificar el token JWT
 */
const verifyToken = (req, res, next) => {
  // Obtener token del header
  const token = req.headers["authorization"]?.split(" ")[1] || req.headers["x-access-token"];

  if (!token) {
    return res.status(403).json({
      success: false,
      message: "No se proporcionó token de autenticación",
      redirect: "/login.html"
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
      redirect: "/login.html"
    });
  }
};

/**
 * Middleware para verificar roles específicos
 */
const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado: No se pudo verificar el rol"
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado: No tiene permisos suficientes"
      });
    }

    next();
  };
};

/**
 * Generar token JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verificar si el usuario existe y está activo
 */
const verifyUserExists = (req, res, next) => {
  const userId = req.userId;

  mysqlConnection.query(
    "SELECT id, username, email, role, activo FROM usuarios WHERE id = ? AND activo = 1",
    [userId],
    (err, rows) => {
      if (err) {
        console.error("Error verificando usuario:", err);
        return res.status(500).json({
          success: false,
          message: "Error al verificar usuario"
        });
      }

      if (rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Usuario no encontrado o inactivo",
          redirect: "/login.html"
        });
      }

      req.user = rows[0];
      next();
    }
  );
};

module.exports = {
  verifyToken,
  verifyRole,
  generateToken,
  verifyUserExists,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
