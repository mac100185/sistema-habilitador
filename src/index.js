const express = require("express");
const morgan = require("morgan");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// Seguridad headers (descomentar cuando sea necesario)
// const helmet = require('helmet');
// app.use(helmet());

// Usar morgan para logs
app.use(morgan("tiny"));

// Para recibir json mayores a 50mb
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Deshabilitar X-Powered-By por seguridad
app.disable("X-Powered-By");

// Configurar cabeceras y cors
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.removeHeader("X-Powered-By");
  next();
});

app.use(express.json());
app.use(cors());

// Settings
app.set("port", process.env.PORT || 7777);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./vistas"));

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "./publico")));

// Routes
app.use(require("./routes/seguridad_defen"));

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    error: "Error interno del servidor",
    message: err.message,
  });
});

// Ruta 404
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.path,
  });
});

// Starting the server
const PORT = app.get("port");
app.listen(PORT, "0.0.0.0", () => {
  console.log(`===========================================`);
  console.log(`Server corriendo en puerto ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`===========================================`);
});

// Manejo de errores no capturados
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
