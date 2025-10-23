const mysql = require("mysql2");

// Configuración del pool de conexiones
const poolConfig = {
  host: process.env.DB_HOST || "dbsh",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "quanium",
  password: process.env.DB_PASSWORD || "quanium",
  database: process.env.DB_NAME || "sisthabpro",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  // Configuraciones adicionales para mejorar estabilidad
  multipleStatements: false,
  namedPlaceholders: false,
  typeCast: true,
  supportBigNumbers: true,
  bigNumberStrings: false,
};

// Crear pool de conexiones
const pool = mysql.createPool(poolConfig);

// Variables para control de reconexión
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL = 5000;

// Manejo de eventos del pool
pool.on("connection", function (connection) {
  console.log("✓ Nueva conexión establecida a la base de datos sisthabpro");
  isConnected = true;
  reconnectAttempts = 0;

  // Configurar la conexión
  connection.query("SET time_zone = '+00:00'");
  connection.query("SET NAMES utf8mb4");
});

pool.on("error", function (err) {
  console.error(
    "❌ Error en el pool de base de datos:",
    err.code || err.message,
  );

  if (
    err.code === "PROTOCOL_CONNECTION_LOST" ||
    err.code === "ECONNRESET" ||
    err.code === "ECONNREFUSED" ||
    err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR" ||
    err.code === "ER_ACCESS_DENIED_ERROR"
  ) {
    isConnected = false;
    console.log("⚠️  Se perdió la conexión con la base de datos");

    if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("❌ CRÍTICO: Credenciales de base de datos incorrectas");
      console.error(`   Usuario: ${poolConfig.user}`);
      console.error(`   Host: ${poolConfig.host}:${poolConfig.port}`);
      console.error(`   Base de datos: ${poolConfig.database}`);
    }
  }
});

pool.on("acquire", function (connection) {
  // Conexión adquirida del pool
});

pool.on("release", function (connection) {
  // Conexión devuelta al pool
});

/**
 * Función para intentar conectar a la base de datos con reintentos
 */
function attemptConnection(retryCount = 0) {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error(
          `❌ Intento ${retryCount + 1}/${MAX_RECONNECT_ATTEMPTS} - Error al conectar:`,
          err.code || err.message,
        );

        if (retryCount < MAX_RECONNECT_ATTEMPTS) {
          console.log(
            `⏳ Reintentando en ${RECONNECT_INTERVAL / 1000} segundos...`,
          );
          setTimeout(() => {
            attemptConnection(retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, RECONNECT_INTERVAL);
        } else {
          console.error(
            "❌ CRÍTICO: No se pudo establecer conexión con la base de datos después de múltiples intentos",
          );
          console.error("   Verifique que:");
          console.error("   1. El contenedor de MySQL esté corriendo");
          console.error("   2. Las credenciales sean correctas");
          console.error("   3. La red Docker esté configurada correctamente");
          console.error(`   4. El host '${poolConfig.host}' sea alcanzable`);
          reject(err);
        }
      } else {
        console.log("✅ Base de datos sisthabpro conectada exitosamente");
        console.log(`   Host: ${poolConfig.host}:${poolConfig.port}`);
        console.log(`   Base de datos: ${poolConfig.database}`);
        console.log(`   Usuario: ${poolConfig.user}`);
        isConnected = true;
        reconnectAttempts = 0;
        connection.release();
        resolve(connection);
      }
    });
  });
}

// Verificar conexión inicial con reintentos
console.log("🔌 Iniciando conexión a la base de datos...");
attemptConnection()
  .then(() => {
    console.log("✅ Conexión a base de datos establecida");
  })
  .catch((err) => {
    console.error(
      "❌ No se pudo establecer conexión inicial con la base de datos",
    );
    // No terminar el proceso, permitir que la aplicación maneje el error
  });

/**
 * Función helper para verificar si la conexión está disponible
 */
function isConnectionHealthy() {
  return isConnected;
}

/**
 * Función helper para obtener el estado de la conexión
 */
function getConnectionStatus() {
  return {
    connected: isConnected,
    host: poolConfig.host,
    port: poolConfig.port,
    database: poolConfig.database,
    user: poolConfig.user,
  };
}

// Exportar pool y funciones helper
module.exports = pool;
module.exports.isConnectionHealthy = isConnectionHealthy;
module.exports.getConnectionStatus = getConnectionStatus;
module.exports.attemptConnection = attemptConnection;
