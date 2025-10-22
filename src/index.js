const express = require("express");
const morgan = require("morgan");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const { checkConfiguration } = require("./utils/config-check");

const app = express();

// Verificar configuración antes de iniciar
console.log("===========================================");
console.log("Sistema Habilitador - Iniciando...");
console.log("===========================================");

const configOk = checkConfiguration();
if (!configOk && process.env.NODE_ENV === "production") {
  console.error("\n⚠️  ADVERTENCIA: Se detectaron problemas de configuración");
  console.error("Continuando de todos modos, pero revisa los errores arriba\n");
}

// Importar middleware de autenticación
const { verifyToken } = require("./middleware/auth");

// Seguridad con Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Deshabilitado temporalmente para desarrollo
    crossOriginEmbedderPolicy: false,
  }),
);

// Usar morgan para logs
app.use(morgan("combined"));

// Para recibir json mayores a 50mb
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Deshabilitar X-Powered-By por seguridad
app.disable("X-Powered-By");

// Configurar CORS según el ambiente
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:7777", "http://127.0.0.1:7777"];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);

    // En desarrollo, permitir todos los orígenes
    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    // En producción, solo permitir orígenes específicos
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "x-access-token",
  ],
};

app.use(cors(corsOptions));

// Configurar cabeceras adicionales
app.use((req, res, next) => {
  res.removeHeader("X-Powered-By");
  next();
});

app.use(express.json());

// Settings
app.set("port", process.env.PORT || 7777);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./vistas"));

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));

// Servir archivos estáticos (públicos) - Sin autenticación para login
app.use(express.static(path.join(__dirname, "./publico")));

// ============================================================================
// RUTAS PÚBLICAS (Sin autenticación)
// ============================================================================

// Rutas de autenticación (login, registro, captcha)
app.use(require("./routes/login"));

// Ruta raíz - redirigir a login
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// Health check (sin autenticación)
app.get("/api/health", (req, res) => {
  const mysqlConnection = require("./database_seguridad_defen");

  // Verificar conexión a base de datos
  mysqlConnection.getConnection((err, connection) => {
    if (err) {
      console.error("Health check: Error de conexión a BD:", err.message);
      return res.status(503).json({
        status: "error",
        message: "Database connection failed",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "production",
        version: "1.0.0",
      });
    }

    if (connection) {
      connection.release();
    }

    res.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "production",
      version: "1.0.0",
    });
  });
});

// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN PARA RUTAS PROTEGIDAS
// ============================================================================

// Aplicar middleware de autenticación a todas las rutas /api/* excepto /api/auth/* y /api/health
app.use("/api", (req, res, next) => {
  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    "/api/health",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/captcha",
    "/api/auth/verify-captcha",
  ];

  // Si la ruta está en la lista de públicas, continuar sin verificar token
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  // Para todas las demás rutas de API, verificar token
  verifyToken(req, res, next);
});

// ============================================================================
// RUTAS PROTEGIDAS (Requieren autenticación)
// ============================================================================

// Rutas de seguridad y defensas (requieren autenticación)
app.use(require("./routes/seguridad_defen"));

// Rutas de evidencias (requieren autenticación)
app.use(require("./routes/evidencia"));

// Ruta protegida para verificar autenticación
app.get("/api/auth/verify", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "Token válido",
    user: {
      id: req.userId,
      email: req.userEmail,
      role: req.userRole,
    },
  });
});

// ============================================================================
// MIDDLEWARE PARA PROTEGER ARCHIVOS HTML (excepto login.html)
// ============================================================================

// Middleware para verificar acceso a archivos HTML protegidos
app.use("*.html", (req, res, next) => {
  // Archivos HTML públicos que no requieren autenticación
  const publicHtmlFiles = ["/login.html", "/404.html"];

  // Si es un archivo público, permitir acceso
  if (publicHtmlFiles.some((file) => req.path.endsWith(file))) {
    return next();
  }

  // Para otros archivos HTML, verificar si hay token en el query string o header
  const authHeader = req.headers["authorization"];
  const token =
    req.query.token ||
    (authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null) ||
    req.headers["x-access-token"];

  if (!token) {
    // Si no hay token, redirigir a login
    return res.redirect("/login.html");
  }

  // Verificar el token
  const jwt = require("jsonwebtoken");
  const { JWT_SECRET } = require("./middleware/auth");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    console.error("Error verificando token en HTML:", error.message);
    // Si el token es inválido, redirigir a login
    return res.redirect("/login.html?error=session_expired");
  }
});

// ============================================================================
// MANEJADORES DE ERRORES
// ============================================================================

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error("Error global:", err.message);

  // Log completo solo en desarrollo
  if (process.env.NODE_ENV !== "production") {
    console.error("Stack trace:", err.stack);
  }

  // Si es un error de JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Token inválido",
      message: "Por favor, inicie sesión nuevamente",
      redirect: "/login.html",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Token expirado",
      message: "Su sesión ha expirado. Por favor, inicie sesión nuevamente",
      redirect: "/login.html",
    });
  }

  // Error de base de datos
  if (err.code && err.code.startsWith("ER_")) {
    console.error("Error de base de datos:", err.code, err.sqlMessage);
    return res.status(500).json({
      success: false,
      error: "Error de base de datos",
      message: "Ocurrió un error al procesar la solicitud",
    });
  }

  // Error genérico
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: "Error interno del servidor",
    message:
      process.env.NODE_ENV === "production"
        ? "Ha ocurrido un error inesperado"
        : err.message || "Ha ocurrido un error inesperado",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// Ruta 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
    path: req.path,
    method: req.method,
  });
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

const PORT = app.get("port");
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`===========================================`);
  console.log(`✅ Servidor corriendo exitosamente`);
  console.log(`===========================================`);
  console.log(`Puerto: ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || "production"}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===========================================`);
});

// Manejo de errores no capturados
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Dar tiempo para que se registren los logs antes de salir
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Manejo de señales de terminación
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

module.exports = app;
