const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// --- CONFIGURE THIS ---
const newUsername = 'admin';
const newPassword = 'admin123';
// ----------------------

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'barangay_db'
});

// Hash the password
bcrypt.hash(newPassword, 10, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    
    console.log('Hashed password:', hash);
    
    // Connect to DB and update/insert
    db.connect(err => {
        if (err) return console.error('Error connecting:', err);
        
        const sql = "UPDATE admins SET password_hash = ? WHERE username = ?";
        
        db.query(sql, [hash, newUsername], (err, result) => {
            if (err) {
                console.error('Error updating admin:', err.message);
            } else {
                console.log(`Successfully updated admin user '${newUsername}' password!`);
            }
            db.end();
        });
    });
});