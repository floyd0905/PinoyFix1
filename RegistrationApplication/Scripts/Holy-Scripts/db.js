const mysql = require('mysql2');  // Use mysql2 instead

const db = mysql.createConnection({
    host: '127.0.0.1',  // Replace with your MySQL server details
    user: 'root',       // Replace with your MySQL user
    password: '',       // Replace with your MySQL password
    database: 'registration_db'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database!');
});

module.exports = db;
