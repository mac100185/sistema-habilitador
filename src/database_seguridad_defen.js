const mysql = require("mysql2");

// Crear pool de conexiones en lugar de una sola conexión
const pool = mysql.createPool({
  host: process.env.DB_HOST || "dbsh",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "quanium",
  password: process.env.DB_PASSWORD || "quanium",
  database: process.env.DB_NAME || "sisthabpro",
  insecureAuth: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
});

// Manejo de errores del pool
pool.on("connection", function (connection) {
  console.log("Nueva conexión establecida a la base de datos sisthabpro");
});

pool.on("error", function (err) {
  console.error("Error en el pool de base de datos:", err);
  if (
    err.code === "PROTOCOL_CONNECTION_LOST" ||
    err.code === "ECONNRESET" ||
    err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"
  ) {
    console.log("Intentando reconectar...");
  }
});

// Verificar conexión inicial
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error al conectar con la base de datos sisthabpro:", err);
    // Reintentar conexión después de 5 segundos
    setTimeout(() => {
      pool.getConnection((err, connection) => {
        if (err) {
          console.error("Reintento fallido:", err);
        } else {
          console.log("Base de datos sisthabpro conectada exitosamente");
          connection.release();
        }
      });
    }, 5000);
  } else {
    console.log("Base de datos sisthabpro conectada exitosamente");
    connection.release();
  }
});

module.exports = pool;
