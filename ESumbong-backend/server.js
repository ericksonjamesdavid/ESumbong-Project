const express = require('express');
const mysql = require('mysql2');
const path = require('path'); // Used to handle file paths

// Initialize Express app
const app = express();
const port = 3000;

// --- 1. Server Configuration ---
// These lines let your server read JSON and form data from the frontend
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// --- 2. Serve Your Frontend ---
// This tells Express to serve all static files (HTML, CSS, JS, Images)
// from the '../ESumbong-frontend' directory.
app.use(express.static(path.join(__dirname, '..', 'ESumbong-frontend')));


// --- 3. Database Connection ---
// Update with your MySQL username and password
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Or your MySQL username
    password: 'root', // Your MySQL password
    database: 'barangay_db' // The database you created
});

// Try to connect
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL Database!');
});


// --- 4. API Endpoints ---
// This endpoint listens for 'POST' requests to '/api/submit-report'
app.post('/api/submit-report', (req, res) => {
    
    // 'req.body' contains the data sent from your frontend form
    const { 
        trackingId, 
        fullname, 
        category, 
        description, 
        priority, 
        address,
        lat,
        lng
    } = req.body;

    // TODO: We will add file upload logic (Multer) here later.
    // For now, we use placeholder paths.
    const barangayIdPath = fullname ? "uploads/id_placeholder.jpg" : null;
    const evidencePath = "uploads/evidence_placeholder.jpg";

    // This is the SQL to call the procedure you created
    const sql = `CALL sp_SubmitReport(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    // The values MUST be in the same order as the procedure's parameters
    const values = [
        trackingId, 
        fullname, 
        category, 
        description, 
        priority, 
        address, 
        lat, 
        lng,
        barangayIdPath, 
        evidencePath
    ];

    // Execute the query
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error executing stored procedure:', err);
            // Send an error message back to the frontend
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Send a success message back to the frontend
        res.status(200).json({ success: true, message: 'Report submitted!', trackingId: trackingId });
    });
});


// --- 5. Start the Server ---
// This starts the server and keeps it running
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Your frontend should be visible at http://localhost:${port}`);
});