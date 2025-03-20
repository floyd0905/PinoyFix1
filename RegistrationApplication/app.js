const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');
const app = express();

app.use(bodyParser.json());  // To parse JSON requests

// API to register a new user
app.post('/register', (req, res) => {
    const { first_name, middle_name, last_name, address, phone_number, email, password } = req.body;

    if (!first_name || !last_name || !email || !password || phone_number.length !== 11) {
        return res.status(400).json({ error: "Please provide valid input data." });
    }

    // Insert into MySQL database
    const query = `INSERT INTO users (first_name, middle_name, last_name, address, phone_number, email, password) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [first_name, middle_name, last_name, address, phone_number, email, password], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'Account created successfully' });
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
