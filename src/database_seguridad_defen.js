const mysql = require('mysql2');

const mysqlConnection = mysql.createConnection({
  host: 'db',
  user: 'root',
  password: 'quanium',
  database: 'sisthabpro',
  insecureAuth: true
});

mysqlConnection.connect(function (err) {
  if (err) {
    console.error(err);
    return;
  } else {
    console.log('La base de datos sisthabpro está conectado');
  }
});

module.exports = mysqlConnection;