const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const mysqlConnection2 = require("../database_seguridad_defen.js");

//Combo Squads
router.get("/api/seguridad_def/combo/squads", (req, res) => {
  //const { id } = req.params;
  mysqlConnection2.query(
    'SELECT IdPrin,NombrePrin FROM principal WHERE Habilitador = "SI"',
    (err, rows, fields) => {
      if (!err) {
        res.json(rows);
      } else {
        console.log(err);
      }
    }
  );
});

//Combo Iniciativas
router.get("/api/seguridad_def/combo/squads/iniciativa/:id", (req, res) => {
  const { id } = req.params;
  mysqlConnection2.query(
    "SELECT Id,Nombre FROM inicitiva_squad WHERE Id_Squad  = ?",
    [id],
    (err, rows, fields) => {
      if (!err) {
        res.json(rows);
      } else {
        console.log(err);
      }
    }
  );
});

//Combo cumplimiento

router.get("/api/seguridad_def/combo/squads/cumplimiento/:id", (req, res) => {
  const { id } = req.params;
  mysqlConnection2.query(
    "SELECT DISTINCT EstadoHabSquad AS Nombre FROM habilita_squad WHERE IdSquad = ?",
    [id],
    (err, rows, fields) => {
      if (!err) {
        let data = rows;

        //Agregar Aplica // All
        data.push({ Nombre: "All", Nombre: "Total" });

        //Quitar Deprecado No Aprobado
        let newData = data.filter((object) => {
          return (
            object.Nombre !== "No Aprobado" && object.Nombre !== "Deprecado"
          );
        });
        res.json(newData);
      } else {
        console.log(err);
      }
    }
  );
});

// Agregar Iniciativa
router.post("/api/seguridad_def/combo/squads/iniciativa/", (req, res) => {
  let Nombre = req.body.Nombre;
  let Tipo = req.body.Tipo;
  let Nota = req.body.Nota;
  let Id_Squad = req.body.Id_Squad;

  let sql =
    "INSERT INTO inicitiva_squad SET Nombre = ?, Tipo = ?, Nota = ?, Id_Squad = ?";
  mysqlConnection2.query(
    sql,
    [Nombre, Tipo, Nota, Id_Squad],
    (err, rows, fields) => {
      if (!err) {
        console.log(rows.insertId);
        mysqlConnection2.query(
          "CALL generar_habilitadores(?)",
          [rows.insertId],
          (err, rows, fields) => {
            if (!err) {
              res.json({ status: "Iniciativa Agregada" });
            } else {
              console.log(err);
            }
          }
        );
      } else {
        console.log(err);
      }
    }
  );
});

// GET Una Metodología Principal
router.get("/api/seguridad_def/principal/:id", (req, res) => {
  const { id } = req.params;
  mysqlConnection2.query(
    "SELECT * FROM principal WHERE  IdPrin = ?",
    [id],
    (err, rows, fields) => {
      if (!err) {
        res.json(rows[0]);
      } else {
        console.log(err);
      }
    }
  );
});

// GET Una Metodología Secundario
router.get("/api/seguridad_def/secundario/:id", (req, res) => {
  const { id } = req.params;
  mysqlConnection2.query(
    "SELECT * FROM secundario WHERE  IdSecu = ?",
    [id],
    (err, rows, fields) => {
      if (!err) {
        res.json(rows[0]);
      } else {
        console.log(err);
      }
    }
  );
});

//Para Titulo y sibtitulo HTML
router.get("/api/seguridad_def/titulos/", (req, res) => {
  //const { id } = req.params;
  mysqlConnection2.query(
    'SELECT principal.IdPrin, principal.NombrePrin,  CASE WHEN secundario.IdSecu is NULL THEN "" ELSE secundario.IdSecu END AS IdSecu, CASE WHEN secundario.NombreSecu is NULL THEN "" ELSE secundario.NombreSecu END AS NombreSecu,CASE WHEN secundario.OrdenSecu is NULL THEN "" ELSE secundario.OrdenSecu END AS OrdenSecu FROM principal LEFT JOIN secundario ON principal.IdPrin = secundario.IdPrinci ORDER BY principal.IdPrin, secundario.OrdenSecu',
    (err, rows, fields) => {
      if (!err) {
        res.json(rows);
      } else {
        console.log(err);
      }
    }
  );
});

//Actulizar Metodología Princial
router.put("/api/seguridad_def/add/principal", (req, res) => {
  let IdPrin = req.body.IdPrin;
  let OrdenPrin = req.body.OrdenPrin;
  let DetallePrin = req.body.DetallePrin;
  let NombrePrin = req.body.NombrePrin;
  let TipoPrin = req.body.TipoPrin;
  let NotaPrin = req.body.NotaPrin;
  //let AuxPri = req.body.AuxPri;

  let sql =
    "UPDATE principal SET  DetallePrin = ?, OrdenPrin = ?,  NombrePrin = ?,  TipoPrin = ?, NotaPrin = ? WHERE IdPrin = ?";
  mysqlConnection2.query(
    sql,
    [DetallePrin, OrdenPrin, NombrePrin, TipoPrin, NotaPrin, IdPrin],
    (err, rows, fields) => {
      if (!err) {
        res.json({ status: "Seguridad Principal Actualizada" });
      } else {
        console.log(err);
      }
    }
  );
});

//================================================================================

//Actulizar Metodología Secundario
router.put("/api/seguridad_def/add/secundario", (req, res) => {
  let IdSecu = req.body.IdSecu;
  let NombreSecu = req.body.NombreSecu;
  let OrdenSecu = req.body.OrdenSecu;
  let TipoSecu = req.body.TipoSecu;
  let DetalleSecu = req.body.DetalleSecu;
  let NotaSecu = req.body.NotaSecu;
  let IdPrinci = req.body.IdPrinci;
  let sql =
    "UPDATE secundario SET  NombreSecu = ?,OrdenSecu	= ?,TipoSecu	=	?,DetalleSecu	= ?,NotaSecu = ? WHERE IdSecu = ?";
  mysqlConnection2.query(
    sql,
    [NombreSecu, OrdenSecu, TipoSecu, DetalleSecu, NotaSecu, IdSecu],
    (err, rows, fields) => {
      if (!err) {
        res.json({ status: "Seguridad Secundario Actualizada" });
      } else {
        console.log(err);
      }
    }
  );
});
//==============================================Imagenes==========================================
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../publico/imagen4"),
  filename: (req, file, cb) => {
    const fileName = req.params.id;
    console.log(file);
    cb(null, fileName + "." + Date.now() + ".png");
  },
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype == "image/jpeg" || file.mimetype == "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({ storage: storage, fileFilter: fileFilter });
//Upload route
router.post(
  "/seguridad_def/imagen/:id",
  upload.single("imageData"),
  //upload.single("files[0]"),
  (req, res, next) => {
    let nombre = req.file.filename;
    console.log(nombre);
    try {
      return res.status(200).json({
        status: "success",
        imageUrl: "/imagen4/" + nombre,
      });
    } catch (error) {
      console.error(error);
    }
  }
);

//------------------------------------------------------
//Control
//----------------------------------------------------------

// GET Control Tabla
router.get("/api/seguridad_def/controles/:id", (req, res) => {
  const { id } = req.params;
  if (id === "all") {
    mysqlConnection2.query(
      "SELECT Id,Dimension,Dominio,Titulo FROM control_nube",
      (err, rows, fields) => {
        if (!err) {
          res.json(rows);
        } else {
          console.log(err);
        }
      }
    );
  } else {
    const { id } = req.params;
    //console.log(id)
    mysqlConnection2.query(
      "SELECT Id,Dimension,Dominio,Titulo FROM control_nube WHERE Id IN" +
        "(" +
        id +
        ")",
      (err, rows, fields) => {
        if (!err) {
          res.json(rows);
        } else {
          console.log(err);
        }
      }
    );
  }
});

// GET Un Control
router.get("/api/seguridad_def/controles/unico/:id", (req, res) => {
  const { id } = req.params;
  mysqlConnection2.query(
    "SELECT * FROM control_nube WHERE  Id = ?",
    [id],
    (err, rows, fields) => {
      if (!err) {
        res.json(rows[0]);
      } else {
        console.log(err);
      }
    }
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
    }
  );
});

// GET Habilitadores de un Squad
router.get("/api/seguridad_def/controles_squad/:id/:id2/:id3", (req, res) => {
  const { id } = req.params;
  const { id2 } = req.params;
  console.log(id2);
  const { id3 } = req.params;

  if (id2 == "SI") {
    if (id3 == "Aplica") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND ImprescindibleSquad = "SI" AND EstadoHabSquad IN ("Si Cumple","Cumple Parcial","No Cumple","Falta Evidencia","Dependencia","En Progreso", "Con Observaciones","Aplica");',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "Si Cumple") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND ImprescindibleSquad = "SI" AND EstadoHabSquad = "Si Cumple";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "Con Observaciones") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND ImprescindibleSquad = "SI" AND EstadoHabSquad = "Con Observaciones";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "Cumple Parcial") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND ImprescindibleSquad = "SI" AND EstadoHabSquad = "Cumple Parcial";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "No Cumple") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND ImprescindibleSquad = "SI" AND EstadoHabSquad = "No Cumple";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "No Aplica") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND ImprescindibleSquad = "SI" AND EstadoHabSquad = "No Aplica";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "Deprecado") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND ImprescindibleSquad = "SI" AND EstadoHabSquad = "Deprecado";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "Falta Evidencia") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND ImprescindibleSquad = "SI" AND EstadoHabSquad = "Falta Evidencia";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "Dependencia") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND ImprescindibleSquad = "SI" AND EstadoHabSquad = "Dependencia";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "En Progreso") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND ImprescindibleSquad = "SI" AND EstadoHabSquad = "En Progreso";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id2 == "All") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND ImprescindibleSquad = "SI" AND EstadoHabSquad IN ("Si Cumple","Cumple Parcial","No Cumple","Falta Evidencia","Dependencia","En Progreso","No Aplica","Con Observaciones");',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    }
  } else {
    if (id3 == "Aplica") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND EstadoHabSquad IN ("Si Cumple","Cumple Parcial","No Cumple","Falta Evidencia","Dependencia","En Progreso", "Con Observaciones","Aplica");',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "Si Cumple") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND EstadoHabSquad = "Si Cumple";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "Con Observaciones") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND EstadoHabSquad = "Con Observaciones";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "Cumple Parcial") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND EstadoHabSquad = "Cumple Parcial";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "No Cumple") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND EstadoHabSquad = "No Cumple";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "No Aplica") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND EstadoHabSquad = "No Aplica";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "Deprecado") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND EstadoHabSquad = "Deprecado";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "Falta Evidencia") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND EstadoHabSquad = "Falta Evidencia";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "Dependencia") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND EstadoHabSquad = "Dependencia";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "En Progreso") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND EstadoHabSquad = "En Progreso";',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else if (id3 == "All") {
      mysqlConnection2.query(
        'SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ? AND EstadoHabSquad IN ("Si Cumple","Cumple Parcial","No Cumple","Falta Evidencia","Dependencia","En Progreso","No Aplica","Con Observaciones","Aplica");',
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
      );
    } else {
      mysqlConnection2.query(
        "SELECT IdHab, HabSquad, TituloHabSquad,EstadoHabSquad,ObserHabSquad,EvidenciaHabSquad,ImprescindibleSquad FROM habilita_squad WHERE IdSquad = ?;",
        [id],
        (err, rows, fields) => {
          if (!err) {
            res.json(rows);
          } else {
            console.log(err);
          }
        }
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
      }
    );
  }
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
    }
  );
});

// GET Habilitadores Grafica total
router.get(
  "/api/seguridad_def/controles_squad/grafica/todo/todo/:id",
  (req, res) => {
    const { id } = req.params;
    mysqlConnection2.query(
      'SELECT EstadoHabSquad AS "name", COUNT(*) AS "y" , EstadoHabSquad AS "drilldown" , EstadoHabSquad AS "color" from habilita_squad  WHERE IdSquad = ? AND EstadoHabSquad IN ("Si Cumple","Cumple Parcial","No Cumple","Falta Evidencia","Dependencia","En Progreso","No Aplica","Aplica","Con Observaciones") GROUP by EstadoHabSquad',
      [id],
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
      }
    );
  }
);

// GET Habilitadores Grafica Imprecindible
router.get(
  "/api/seguridad_def/controles_squad/grafica/lite/imprescindible/:id",
  (req, res) => {
    const { id } = req.params;
    mysqlConnection2.query(
      'SELECT EstadoHabSquad AS "name", COUNT(*) AS "y" , EstadoHabSquad AS "drilldown" , EstadoHabSquad AS "color" from habilita_squad  WHERE IdSquad = ? AND ImprescindibleSquad = "SI" AND EstadoHabSquad IN ("Si Cumple","Cumple Parcial","No Cumple","Falta Evidencia","Dependencia","En Progreso","Aplica","No Aplica","Con Observaciones") GROUP by EstadoHabSquad',
      [id],
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
      }
    );
  }
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
      }
    );
  }
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
    }
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
      }
    );
  }
);

module.exports = router;
