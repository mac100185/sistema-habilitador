const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");

// Configuración de almacenamiento de archivos

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../publico/imagen2");
    // Verificar si el directorio existe, si no, crearlo
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (err) {
        console.error("Error creando directorio de uploads:", err);
        return cb(err);
      }
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileName = req.params.id;
    const timestamp = Date.now();
    const extension = path.extname(file.originalname) || ".png";
    const sanitizedFileName = `${fileName}.${timestamp}${extension}`;
    cb(null, sanitizedFileName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)",
      ),
      false,
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

// Endpoint para subir evidencias
router.post("/evidencia/:id", (req, res, next) => {
  // Validar que el ID sea válido
  if (!req.params.id || req.params.id.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "ID de evidencia requerido",
    });
  }

  upload.single("imageData")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Error de Multer
      console.error("Error de Multer:", err);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "El archivo es demasiado grande. Tamaño máximo: 5MB",
        });
      }
      return res.status(400).json({
        success: false,
        message: "Error al procesar el archivo: " + err.message,
      });
    } else if (err) {
      // Otro tipo de error
      console.error("Error subiendo archivo:", err);
      return res.status(400).json({
        success: false,
        message: err.message || "Error al subir el archivo",
      });
    }

    // Validar que se haya subido un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó ningún archivo",
      });
    }

    try {
      const nombre = req.file.filename;
      return res.status(200).json({
        success: true,
        status: "success",
        imageUrl: "/imagen2/" + nombre,
        fileName: nombre,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });
    } catch (error) {
      console.error("Error procesando respuesta:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  });
});

module.exports = router;
