const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const mysqlConnection2 = require("../database_seguridad_defen.js");

// Helper para manejo de errores en queries
const handleQueryError = (res, err, customMessage = "Error en la consulta") => {
  console.error(customMessage + ":", err);
  return res.status(500).json({
    success: false,
    message: customMessage,
    error: process.env.NODE_ENV !== "production" ? err.message : undefined,
  });
};

// Helper para validar parámetros
const validateParams = (params, res) => {
  for (const [key, value] of Object.entries(params)) {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      res.status(400).json({
        success: false,
        message: `Parámetro requerido: ${key}`,
      });
      return false;
    }
  }
  return true;
};

//Combo Squads
router.get("/api/seguridad_def/combo/squads", (req, res) => {
  mysqlConnection2.query(
    'SELECT IdPrin, NombrePrin FROM principal WHERE Habilitador = "SI"',
    (err, rows) => {
      if (err) {
        return handleQueryError(res, err, "Error obteniendo squads");
      }
      res.json({
        success: true,
        data: rows,
      });
    },
  );
});

//Combo Iniciativas
router.get("/api/seguridad_def/combo/squads/iniciativa/:id", (req, res) => {
  const { id } = req.params;

  if (!validateParams({ id }, res)) return;

  mysqlConnection2.query(
    "SELECT Id, Nombre FROM inicitiva_squad WHERE Id_Squad = ?",
    [id],
    (err, rows) => {
      if (err) {
        return handleQueryError(res, err, "Error obteniendo iniciativas");
      }
      res.json({
        success: true,
        data: rows,
      });
    },
  );
});

//Combo cumplimiento
router.get("/api/seguridad_def/combo/squads/cumplimiento/:id", (req, res) => {
  const { id } = req.params;

  if (!validateParams({ id }, res)) return;

  mysqlConnection2.query(
    "SELECT DISTINCT EstadoHabSquad AS Nombre FROM habilita_squad WHERE IdSquad = ?",
    [id],
    (err, rows) => {
      if (err) {
        return handleQueryError(res, err, "Error obteniendo cumplimiento");
      }

      let data = rows;

      // Agregar opción "Total"
      data.push({ Nombre: "Total" });

      // Quitar Deprecado y No Aprobado
      let newData = data.filter((object) => {
        return object.Nombre !== "No Aprobado" && object.Nombre !== "Deprecado";
      });

      res.json({
        success: true,
        data: newData,
      });
    },
  );
});

// Agregar Iniciativa
router.post("/api/seguridad_def/combo/squads/iniciativa/", (req, res) => {
  const { Nombre, Tipo, Nota, Id_Squad } = req.body;

  if (!validateParams({ Nombre, Id_Squad }, res)) return;

  const sql =
    "INSERT INTO inicitiva_squad SET Nombre = ?, Tipo = ?, Nota = ?, Id_Squad = ?";

  mysqlConnection2.query(sql, [Nombre, Tipo, Nota, Id_Squad], (err, result) => {
    if (err) {
      return handleQueryError(res, err, "Error agregando iniciativa");
    }

    const insertId = result.insertId;
    console.log("Iniciativa creada con ID:", insertId);

    mysqlConnection2.query(
      "CALL generar_habilitadores(?)",
      [insertId],
      (err) => {
        if (err) {
          return handleQueryError(res, err, "Error generando habilitadores");
        }
        res.json({
          success: true,
          message: "Iniciativa agregada exitosamente",
          id: insertId,
        });
      },
    );
  });
});

// GET Una Metodología Principal
router.get("/api/seguridad_def/principal/:id", (req, res) => {
  const { id } = req.params;

  if (!validateParams({ id }, res)) return;

  mysqlConnection2.query(
    "SELECT * FROM principal WHERE IdPrin = ?",
    [id],
    (err, rows) => {
      if (err) {
        return handleQueryError(res, err, "Error obteniendo principal");
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Metodología principal no encontrada",
        });
      }
      res.json({
        success: true,
        data: rows[0],
      });
    },
  );
});

// GET Una Metodología Secundario
router.get("/api/seguridad_def/secundario/:id", (req, res) => {
  const { id } = req.params;

  if (!validateParams({ id }, res)) return;

  mysqlConnection2.query(
    "SELECT * FROM secundario WHERE IdSecu = ?",
    [id],
    (err, rows) => {
      if (err) {
        return handleQueryError(res, err, "Error obteniendo secundario");
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Metodología secundaria no encontrada",
        });
      }
      res.json({
        success: true,
        data: rows[0],
      });
    },
  );
});

//Para Titulo y subtitulo HTML
router.get("/api/seguridad_def/titulos/", (req, res) => {
  mysqlConnection2.query(
    `SELECT
      principal.IdPrin,
      principal.NombrePrin,
      CASE WHEN secundario.IdSecu IS NULL THEN "" ELSE secundario.IdSecu END AS IdSecu,
      CASE WHEN secundario.NombreSecu IS NULL THEN "" ELSE secundario.NombreSecu END AS NombreSecu,
      CASE WHEN secundario.OrdenSecu IS NULL THEN "" ELSE secundario.OrdenSecu END AS OrdenSecu
    FROM principal
    LEFT JOIN secundario ON principal.IdPrin = secundario.IdPrinci
    ORDER BY principal.IdPrin, secundario.OrdenSecu`,
    (err, rows) => {
      if (err) {
        return handleQueryError(res, err, "Error obteniendo títulos");
      }
      res.json({
        success: true,
        data: rows,
      });
    },
  );
});

//Actualizar Metodología Principal
router.put("/api/seguridad_def/add/principal", (req, res) => {
  const { IdPrin, OrdenPrin, DetallePrin, NombrePrin, TipoPrin, NotaPrin } =
    req.body;

  if (!validateParams({ IdPrin, NombrePrin }, res)) return;

  const sql =
    "UPDATE principal SET DetallePrin = ?, OrdenPrin = ?, NombrePrin = ?, TipoPrin = ?, NotaPrin = ? WHERE IdPrin = ?";

  mysqlConnection2.query(
    sql,
    [DetallePrin, OrdenPrin, NombrePrin, TipoPrin, NotaPrin, IdPrin],
    (err, result) => {
      if (err) {
        return handleQueryError(
          res,
          err,
          "Error actualizando metodología principal",
        );
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Metodología principal no encontrada",
        });
      }
      res.json({
        success: true,
        message: "Seguridad Principal actualizada exitosamente",
      });
    },
  );
});

//================================================================================

//Actualizar Metodología Secundario
router.put("/api/seguridad_def/add/secundario", (req, res) => {
  const { IdSecu, NombreSecu, OrdenSecu, TipoSecu, DetalleSecu, NotaSecu } =
    req.body;

  if (!validateParams({ IdSecu, NombreSecu }, res)) return;

  const sql =
    "UPDATE secundario SET NombreSecu = ?, OrdenSecu = ?, TipoSecu = ?, DetalleSecu = ?, NotaSecu = ? WHERE IdSecu = ?";

  mysqlConnection2.query(
    sql,
    [NombreSecu, OrdenSecu, TipoSecu, DetalleSecu, NotaSecu, IdSecu],
    (err, result) => {
      if (err) {
        return handleQueryError(
          res,
          err,
          "Error actualizando metodología secundaria",
        );
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Metodología secundaria no encontrada",
        });
      }
      res.json({
        success: true,
        message: "Seguridad Secundaria actualizada exitosamente",
      });
    },
  );
});
//==============================================Imagenes==========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../publico/imagen4");
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
    cb(null, `${fileName}.${timestamp}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Tipo de archivo no permitido. Solo imágenes JPEG, PNG o GIF"),
      false,
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

//Upload route
router.post("/seguridad_def/imagen/:id", (req, res) => {
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: "ID requerido",
    });
  }

  upload.single("imageData")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Error de Multer:", err);
      return res.status(400).json({
        success: false,
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "Archivo demasiado grande (máx 5MB)"
            : "Error al procesar archivo",
      });
    } else if (err) {
      console.error("Error subiendo archivo:", err);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó archivo",
      });
    }

    const nombre = req.file.filename;
    console.log("Imagen subida:", nombre);

    return res.status(200).json({
      success: true,
      status: "success",
      imageUrl: "/imagen4/" + nombre,
      fileName: nombre,
    });
  });
});

//------------------------------------------------------
//Control
//----------------------------------------------------------

// GET Control Tabla
router.get("/api/seguridad_def/controles/:id", (req, res) => {
  const { id } = req.params;

  if (!validateParams({ id }, res)) return;

  if (id === "all") {
    mysqlConnection2.query(
      "SELECT Id, Dimension, Dominio, Titulo FROM control_nube",
      (err, rows) => {
        if (err) {
          return handleQueryError(res, err, "Error obteniendo controles");
        }
        res.json({
          success: true,
          data: rows,
        });
      },
    );
  } else {
    mysqlConnection2.query(
      "SELECT Id, Dimension, Dominio, Titulo FROM control_nube WHERE Id IN (?)",
      [id.split(",")],
      (err, rows) => {
        if (err) {
          return handleQueryError(res, err, "Error obteniendo controles");
        }
        res.json({
          success: true,
          data: rows,
        });
      },
    );
  }
});

// GET Un Control
router.get("/api/seguridad_def/controles/unico/:id", (req, res) => {
  const { id } = req.params;

  if (!validateParams({ id }, res)) return;

  mysqlConnection2.query(
    "SELECT * FROM control_nube WHERE Id = ?",
    [id],
    (err, rows) => {
      if (err) {
        return handleQueryError(res, err, "Error obteniendo control");
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Control no encontrado",
        });
      }
      res.json({
        success: true,
        data: rows[0],
      });
    },
  );
});

//Actulizar Metodología Secundario
router.put("/api/seguridad_def/controles/up", (req, res) => {
  let Id = req.body.Id;
  let Dimension = req.body.Dimension;
  let Dominio = req.body.Dominio;
  let Titulo = req.body.Titulo;
  let Nombre = req.body.Nombre;
  let Criterios_Cumpli = req.body.Criterios_Cumpli;
  let Acciones_Comenta = req.body.Acciones_Comenta;
  let Cambios = req.body.Cambios;
  let Imprescindible = req.body.Imprescindible;
  let Paquete = req.body.Paquete;
  let Cumplimiento = req.body.Cumplimiento;
  let Comentarios = req.body.Comentarios;
  let Responsable = req.body.Responsable;
  let Captura_Ambiente = req.body.Captura_Ambiente;
  let Etapa_Evidencia = req.body.Etapa_Evidencia;
  let Lineamiento = req.body.Lineamiento;
  let Entregables = req.body.Entregables;
  let Modelo_Evidencia = req.body.Modelo_Evidencia;
  let Pendiente = req.body.Pendiente;
  let Estado = req.body.Estado;
  let Comen_Analis = req.body.Comen_Analis;

  let sql =
    "UPDATE control_nube SET Dimension = ?, Dominio	= ?, Titulo = ?, Nombre	=	?, Criterios_Cumpli	= ?, Acciones_Comenta = ?, Cambios = ?, Imprescindible = ?, Paquete = ?,Cumplimiento = ?, Comentarios = ?, Responsable = ?, Captura_Ambiente = ?, Etapa_Evidencia = ?, Lineamiento = ?, Entregables = ?, Modelo_Evidencia = ?, Pendiente = ?,Estado = ?, Comen_Analis = ? WHERE Id = ?";
  mysqlConnection2.query(
    sql,
    [
      Dimension,
      Dominio,
      Titulo,
      Nombre,
      Criterios_Cumpli,
      Acciones_Comenta,
      Cambios,
      Imprescindible,
      Paquete,
      Cumplimiento,
      Comentarios,
      Responsable,
      Captura_Ambiente,
      Etapa_Evidencia,
      Lineamiento,
      Entregables,
      Modelo_Evidencia,
      Pendiente,
      Estado,
      Comen_Analis,
      Id,
    ],
    (err, rows, fields) => {
      if (!err) {
        res.json({ status: "Control Actualizada" });
      } else {
        console.log(err);
      }
    },
  );
});

// GET Habilitadores de un Squad
router.get("/api/seguridad_def/controles_squad/:id/:id2/:id3", (req, res) => {
  const { id } = req.params;
  const { id2 } = req.params;
  console.log(id2);
  const { id3 } = req.params;

  // Si id es 0, mostrar todos los registros sin filtrar por IdSquad
  const whereIdSquad = id == "0" ? "" : "IdSquad = ? AND ";
  const queryParams = id == "0" ? [] : [id];

  if (id2 == "SI") {
    if (id3 == "Aplica") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}ImprescindibleSquad = "SI" AND EstadoHabSquad IN ("Si Cumple","Cumple Parcial","No Cumple","Falta Evidencia","Dependencia","En Progreso", "Con Observaciones","Aplica");`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "Si Cumple") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}ImprescindibleSquad = "SI" AND EstadoHabSquad = "Si Cumple";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "Con Observaciones") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}ImprescindibleSquad = "SI" AND EstadoHabSquad = "Con Observaciones";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "Cumple Parcial") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}ImprescindibleSquad = "SI" AND EstadoHabSquad = "Cumple Parcial";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "No Cumple") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}ImprescindibleSquad = "SI" AND EstadoHabSquad = "No Cumple";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "No Aplica") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}ImprescindibleSquad = "SI" AND EstadoHabSquad = "No Aplica";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "Deprecado") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}ImprescindibleSquad = "SI" AND EstadoHabSquad = "Deprecado";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "Falta Evidencia") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}ImprescindibleSquad = "SI" AND EstadoHabSquad = "Falta Evidencia";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "Dependencia") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}ImprescindibleSquad = "SI" AND EstadoHabSquad = "Dependencia";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "En Progreso") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}ImprescindibleSquad = "SI" AND EstadoHabSquad = "En Progreso";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id2 == "All") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}ImprescindibleSquad = "SI" AND EstadoHabSquad IN ("Si Cumple","Cumple Parcial","No Cumple","Falta Evidencia","Dependencia","En Progreso","No Aplica","Con Observaciones");`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    }
  } else {
    if (id3 == "Aplica") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}EstadoHabSquad IN ("Si Cumple","Cumple Parcial","No Cumple","Falta Evidencia","Dependencia","En Progreso", "Con Observaciones","Aplica");`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "Si Cumple") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}EstadoHabSquad = "Si Cumple";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "Con Observaciones") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}EstadoHabSquad = "Con Observaciones";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "Cumple Parcial") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}EstadoHabSquad = "Cumple Parcial";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "No Cumple") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}EstadoHabSquad = "No Cumple";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "No Aplica") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}EstadoHabSquad = "No Aplica";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "Deprecado") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}EstadoHabSquad = "Deprecado";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "Falta Evidencia") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}EstadoHabSquad = "Falta Evidencia";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "Dependencia") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}EstadoHabSquad = "Dependencia";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "En Progreso") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}EstadoHabSquad = "En Progreso";`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else if (id3 == "All") {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}EstadoHabSquad IN ("Si Cumple","Cumple Parcial","No Cumple","Falta Evidencia","Dependencia","En Progreso","No Aplica","Con Observaciones","Aplica");`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    } else {
      mysqlConnection2.query(
        `SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE ${whereIdSquad}1=1;`,
        queryParams,
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        },
      );
    }
  }
});

// GET Habilitadores de un Squad
router.get(
  "/api/seguridad_def/controles_squad/unitario/squad/uni/:id",
  (req, res) => {
    const { id } = req.params;
    mysqlConnection2.query(
      "SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad FROM habilita_squad WHERE  IdHab = ?",
      [id],
      (err, rows, fields) => {
        if (!err) {
          res.json(rows[0]);
        } else {
          console.log(err);
        }
      },
    );
  },
);

//Actulizar Estado Habilitador Squad
router.put("/api/seguridad_def/controles_squad/unico", (req, res) => {
  let IdHab = req.body.IdHab;
  let EstadoHabSquad = req.body.EstadoHabSquad;
  let ObserHabSquad = req.body.ObserHabSquad;
  let EvidenciaHabSquad = req.body.EvidenciaHabSquad;

  let sql =
    "UPDATE habilita_squad SET EstadoHabSquad = ?, ObserHabSquad	= ?,EvidenciaHabSquad	= ? WHERE IdHab = ?";
  mysqlConnection2.query(
    sql,
    [EstadoHabSquad, ObserHabSquad, EvidenciaHabSquad, IdHab],
    (err, rows, fields) => {
      if (!err) {
        res.json({ status: "Habilitador Actualizada" });
      } else {
        console.log(err);
      }
    },
  );
});

// GET Habilitadores Grafica total
router.get(
  "/api/seguridad_def/controles_squad/grafica/todo/todo/:id",
  (req, res) => {
    const { id } = req.params;
    // Si id es 0, mostrar todos los registros sin filtrar por IdSquad
    const whereIdSquad = id == "0" ? "" : "IdSquad = ? AND ";
    const queryParams = id == "0" ? [] : [id];
    mysqlConnection2.query(
      `SELECT EstadoHabSquad AS "name", COUNT(*) AS "y" , EstadoHabSquad AS "drilldown" , EstadoHabSquad AS "color" from habilita_squad  WHERE ${whereIdSquad}EstadoHabSquad IN ("Si Cumple","Cumple Parcial","No Cumple","Falta Evidencia","Dependencia","En Progreso","No Aplica","Aplica","Con Observaciones") GROUP by EstadoHabSquad`,
      queryParams,
      (err, rows, fields) => {
        if (!err) {
          let data = rows;
          data.forEach(function (item, index) {
            if (item.color === "Falta Evidencia") {
              item.color = "#909090";
            } else if (item.color === "Si Cumple") {
              item.color = "#0c589d";
            } else if (item.color === "No Aplica") {
              item.color = "#606060";
            } else if (item.color === "No Cumple") {
              item.color = "#91243e";
            } else if (item.color === "En Progreso") {
              item.color = "#ca6f1e";
            } else if (item.color === "Con Observaciones") {
              item.color = "#ad5d4e";
            } else if (item.color === "Dependencia") {
              item.color = "#d96465";
            } else if (item.color === "Cumple Parcial") {
              item.color = "#2471a3";
            } else {
              item.color = "#808080";
            }
          });

          console.log(data);
          res.json(data);
        } else {
          console.log(err);
        }
      },
    );
  },
);

// GET Habilitadores Grafica Imprecindible
router.get(
  "/api/seguridad_def/controles_squad/grafica/lite/imprescindible/:id",
  (req, res) => {
    const { id } = req.params;
    // Si id es 0, mostrar todos los registros sin filtrar por IdSquad
    const whereIdSquad = id == "0" ? "" : "IdSquad = ? AND ";
    const queryParams = id == "0" ? [] : [id];
    mysqlConnection2.query(
      `SELECT EstadoHabSquad AS "name", COUNT(*) AS "y" , EstadoHabSquad AS "drilldown" , EstadoHabSquad AS "color" from habilita_squad  WHERE ${whereIdSquad}ImprescindibleSquad = "SI" AND EstadoHabSquad IN ("Si Cumple","Cumple Parcial","No Cumple","Falta Evidencia","Dependencia","En Progreso","Aplica","No Aplica","Con Observaciones") GROUP by EstadoHabSquad`,
      queryParams,
      (err, rows, fields) => {
        if (!err) {
          let data = rows;
          data.forEach(function (item, index) {
            if (item.color === "Falta Evidencia") {
              item.color = "#909090";
            } else if (item.color === "Si Cumple") {
              item.color = "#0c589d";
            } else if (item.color === "No Aplica") {
              item.color = "#606060";
            } else if (item.color === "No Cumple") {
              item.color = "#91243e";
            } else if (item.color === "En Progreso") {
              item.color = "#ca6f1e";
            } else if (item.color === "Con Observaciones") {
              item.color = "#ad5d4e";
            } else if (item.color === "Dependencia") {
              item.color = "#d96465";
            } else if (item.color === "Cumple Parcial") {
              item.color = "#2471a3";
            } else {
              item.color = "#808080";
            }
          });

          console.log(data);
          res.json(data);
        } else {
          console.log(err);
        }
      },
    );
  },
);
/*===============================Tabla===========================*/

//Combo Iniciativas
router.get(
  "/api/seguridad_def/combo/squads/iniciativa/tabla/:id",
  (req, res) => {
    const { id } = req.params;
    mysqlConnection2.query(
      'SELECT EstadoHabSquad AS "Cumplimiento", COUNT(*) AS "Count" FROM habilita_squad WHERE IdSquad = ? GROUP BY EstadoHabSquad;',
      [id],
      (err, rows, fields) => {
        if (!err) {
          res.json(rows);
        } else {
          console.log(err);
        }
      },
    );
  },
);

/*============================Etapa====================*/

//Ocultar no aplica
router.get("/api/seguridad_def/habilitadores/etapa/:id", (req, res) => {
  const { id } = req.params;
  mysqlConnection2.query(
    'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND EstadoHabSquad IN ("Deprecado","No Aplica");',
    [id],
    (err, rows, fields) => {
      if (!err) {
        res.json(rows);
      } else {
        console.log(err);
      }
    },
  );
});

//Agregar Estado
router.get(
  "/api/seguridad_def/habilitadores/etapa/cumplimiento/:id",
  (req, res) => {
    const { id } = req.params;
    mysqlConnection2.query(
      'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND EstadoHabSquad IN ("Si Cumple","Cumple Parcial","En Progreso","Dependencia","Falta Evidencia", "Con Observaciones","Otro","No Cumple","Aplica");',
      [id],
      (err, rows, fields) => {
        if (!err) {
          res.json(rows);
        } else {
          console.log(err);
        }
      },
    );
  },
);

module.exports = router;
