const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');


// UPLOAD V1 - general Middlware
// router.post('/images/upload', (req, res) => {
//     console.log(req.file);
//     res.send('received');
// });

// UPLOAD V2 - pre execution of a function
// saving with its original name
// router.post('/images/upload', multer({
//     dest: path.join(__dirname, '../public/uploads'),
// }).single('image'), (req, res, next) => {
//     console.log(req.file);
//     const ext = path.extname(req.file.originalname).toLocaleLowerCase();
//     fs.rename(req.file.path, `./src/public/uploads/${req.file.originalname}`, () => {
//         res.send('received');
//     });
// });

// UPLOAD V3- using general middleware
// router.post('/images/upload', (req, res) => {
//     res.send('uploaded');
// });
/*let jim = "";
const storage = multer.diskStorage({

    
    destination: path.join(__dirname, '../publico/imagen2'),
    filename: (req, file, cb) => {
       cb(null, Date.now()+jim+ file.originalname);       
        //cb(null, generateName());
    }
})

const uploadImage = multer({
    storage,
    limits: { fileSize: 3000000 }
}).single('imageData');  //upload es el nombre de archivo frontend //Nombre del Form

router.post('/evidencia/', (req, res) => { 
  
    uploadImage(req, res, (err) => {
        //console.log(req.body.lana)
        jim = req.body.lana;

        if (err) {
            err.message = 'El archivo es muy pesado para mi servicio.';
            return res.send(err);
        }
        console.log(req.file);
        let nombre = req.file.filename;
        let respuesta = { status: "success", imageUrl: "/imagen2/" + nombre }
        res.json(respuesta);
        // res.send("http://localhost:4000/uploads/"+"1627546329845image.png");
    });
});

*/


//==============================================otro metodo==========================================


const storage = multer.diskStorage({     
    destination: path.join(__dirname, '../publico/imagen2'),
    filename: (req, file, cb) => {
        const fileName = req.params.id 
        console.log(file)        
       cb(null, fileName+"."+Date.now()+".png");                   
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}
const upload = multer({ storage: storage, fileFilter: fileFilter });

//Upload route
router.post('/evidencia/:id', upload.single('imageData'), (req, res, next) => {
   
    let nombre = req.file.filename;
    try {
        return res.status(200).json({            
            status: "success", imageUrl: "/imagen2/" + nombre
        });
    } catch (error) {
        console.error(error);
    }
});

module.exports = router;