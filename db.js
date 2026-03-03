const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion SQL :', err.message);
    return;
  }
  console.log(`Base de données connectée : ${process.env.DB_NAME}`);
});

module.exports = connection;