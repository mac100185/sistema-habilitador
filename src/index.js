const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
//const helmet = require('helmet');

const jwt = require('jsonwebtoken');

const app = express();

// import library
//var captcha = require("nodejs-captcha");

// Create new Captcha
//var newCaptcha = captcha();

// Value of the captcha
//var value = newCaptcha.value

// Image in base64 
//var imagebase64 = newCaptcha.image;

// Width of the image
//var width = newCaptcha.width;

// Height of the image
//var height = newCaptcha.heigth;

//seguridad headers
//app.use(helmet());
//Usar morgan para todo el aplicativo
app.use(morgan('tiny'));

//vistas
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

// Paqra recibir json mayores a 50mb
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));


app.disable('X-Powered-By');
// Configurar cabeceras y cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  //res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  //res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  //res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
  res.removeHeader("X-Powered-By");
  next();
});


app.use(express.json());
app.use(cors());
// Settings
app.set('port', process.env.PORT || 7777);
//
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './vistas'));
// Middlewares
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, './publico')));
// Routes

app.use(require('./routes/seguridad_defen'));



// Starting the server
app.listen(app.get('port'), () => {
  console.log(`Server on port ${app.get('port')}`);
});


















//npm update
//npm install
//npm run dev