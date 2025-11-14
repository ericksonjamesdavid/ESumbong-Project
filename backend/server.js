const express = require('express');
const mysql = require('mysql2');
const path = require('path'); // Used to handle file paths
const multer = require('multer'); // For handling file uploads (not fully implemented yet)

// Initialize Express app
const app = express();
const port = 3000;


// These lines let your server read JSON and form data from the frontend
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 


// This tells Express to serve all static files (HTML, CSS, JS, Images)
// from the '../frontend' directory.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', 'frontend', 'uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName =  Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

// --- Database Connection ---
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


// --- API Endpoints ---
// This endpoint listens for 'POST' requests to '/api/submit-report'
app.post('/api/submit-report', upload.fields([
    { name: 'barangayIdFile', maxCount: 2 }, 
    { name: 'evidenceFiles', maxCount: 7 }   
]), (req, res) => {
    
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

    const barangayIdPath = req.files.barangayIdFile 
        ? req.files.barangayIdFile.map(file => `uploads/${file.filename}`).join(',') 
        : null;
        
    const evidencePath = req.files.evidenceFiles
        ? req.files.evidenceFiles.map(file => `uploads/${file.filename}`).join(',')
        : null;

    // Call the stored procedure
    const sql = `CALL sp_SubmitReport(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
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

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error executing stored procedure:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        res.status(200).json({ success: true, message: 'Report submitted!', trackingId: trackingId });
    });
});

// --- GET ALL REPORTS ---
app.get('/api/reports', (req, res) => {
    
    const sql = `CALL sp_GetAllReports()`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching reports:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.status(200).json({ success: true, reports: results[0] });
    });
});


// --- Start the Server Listener ---
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Your frontend should be visible at http://localhost:${port}`);
});