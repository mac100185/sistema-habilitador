const mysql = require('mysql2');

const mysqlConnection = mysql.createConnection({
  host: '10.10.0.112',
  user: 'root',
  password: 'quanium',
  database: 'seguridadapi',
  insecureAuth: true
});

mysqlConnection.connect(function (err) {
  if (err) {
    console.error(err);
    return;
  } else {
    console.log('La base de datos está conectado');
  }
});

module.exports = mysqlConnection;
