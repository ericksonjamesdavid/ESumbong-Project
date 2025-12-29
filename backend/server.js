const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

// Import middleware
const { verifyJWT } = require('./middleware/auth');

// Import handlers
const { handleAdminLogin, handlePasswordUpdate, handleVerifyUsername, handleVerifyPin, handleResetPasswordViaPin, handleGetAdminProfile, handleUpdateAdminProfile, handleHandoverAccount } = require('./handlers/adminHandlers');
const { handleReportSubmission, handleGetAllReports, handleUpdateReportStatus, handleGetReportByTrackingId } = require('./handlers/reportHandlers');
const { handleCreateAnnouncement, handleUpdateAnnouncement, handleArchiveAnnouncement, handleGetAnnouncements } = require('./handlers/announcementHandlers');
const { handleCreateNews, handleUpdateNews, handleArchiveNews, handleGetNews } = require('./handlers/newsHandlers');
const { handleSubmitSuggestion, handleGetSuggestions, handleMarkSuggestionRead, handleDeleteSuggestion } = require('./handlers/suggestionHandlers');
const { handleGetDashboardStats, handleGetAuditLogs } = require('./handlers/dashboardHandlers');

// ============================================================
// CONFIGURATION
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Middleware - set headers for all responses
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// File Upload Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', 'frontend', 'uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

// ============================================================
// DATABASE CONNECTION
// ============================================================

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL Database!');
});

// ============================================================
// ROUTES - ADMIN AUTHENTICATION
// ============================================================

app.post('/api/admin/login', (req, res) => {
    handleAdminLogin(db, req, res);
});

app.patch('/api/admin/update-password', verifyJWT, (req, res) => {
    handlePasswordUpdate(db, req, res);
});

app.post('/api/admin/verify-username', (req, res) => {
    handleVerifyUsername(db, req, res);
});

app.post('/api/admin/verify-pin', (req, res) => {
    handleVerifyPin(req, res);
});

app.post('/api/admin/reset-password-via-pin', (req, res) => {
    handleResetPasswordViaPin(db, req, res);
});

// Admin Profile Routes
app.get('/api/admin/profile', verifyJWT, (req, res) => {
    handleGetAdminProfile(db, req, res);
});

app.patch('/api/admin/profile', verifyJWT, (req, res) => {
    handleUpdateAdminProfile(db, req, res);
});

app.post('/api/admin/handover', verifyJWT, (req, res) => {
    handleHandoverAccount(db, req, res);
});

// ============================================================
// ROUTES - REPORT MANAGEMENT
// ============================================================

app.post('/api/next-tracking-id', (req, res) => {
    const { category, date } = req.body;
    
    if (!category || !date) {
        return res.status(400).json({ success: false, message: 'Missing category or date' });
    }
    
    db.query('CALL sp_GetNextTrackingId(?, ?, @trackingId)', [category, date], (err, results) => {
        if (err) {
            console.error('Error generating tracking ID:', err);
            return res.status(500).json({ success: false, message: 'Error generating tracking ID' });
        }
        
        // Fetch the output parameter
        db.query('SELECT @trackingId AS trackingId', (err, results) => {
            if (err) {
                console.error('Error fetching tracking ID:', err);
                return res.status(500).json({ success: false, message: 'Error fetching tracking ID' });
            }
            
            const trackingId = results[0].trackingId;
            res.status(200).json({ success: true, trackingId: trackingId });
        });
    });
});

app.post('/api/submit-report', upload.fields([
    { name: 'barangayIdFile', maxCount: 2 },
    { name: 'evidenceFiles', maxCount: 7 }
]), (req, res) => {
    handleReportSubmission(db, req, res);
});

app.get('/api/reports', (req, res) => {
    handleGetAllReports(db, req, res);
});

app.patch('/api/reports/:trackingId/status', (req, res) => {
    handleUpdateReportStatus(db, req, res);
});

app.get('/api/reports/:trackingId', (req, res) => {
    handleGetReportByTrackingId(db, req, res);
});

// ============================================================
// ROUTES - ANNOUNCEMENTS
// ============================================================

app.post('/api/announcements', verifyJWT, (req, res) => {
    handleCreateAnnouncement(db, req, res);
});

app.patch('/api/announcements/:id', verifyJWT, (req, res) => {
    handleUpdateAnnouncement(db, req, res);
});

app.delete('/api/announcements/:id', verifyJWT, (req, res) => {
    handleArchiveAnnouncement(db, req, res);
});

app.get('/api/announcements', (req, res) => {
    handleGetAnnouncements(db, req, res);
});

// ============================================================
// ROUTES - NEWS
// ============================================================

app.post('/api/news', verifyJWT, (req, res) => {
    handleCreateNews(db, req, res);
});

app.patch('/api/news/:id', verifyJWT, (req, res) => {
    handleUpdateNews(db, req, res);
});

app.delete('/api/news/:id', verifyJWT, (req, res) => {
    handleArchiveNews(db, req, res);
});

app.get('/api/news', (req, res) => {
    handleGetNews(db, req, res);
});

// ============================================================
// ROUTES - SUGGESTIONS
// ============================================================

app.post('/api/suggestions', (req, res) => {
    handleSubmitSuggestion(db, req, res);
});

app.get('/api/suggestions', (req, res) => {
    handleGetSuggestions(db, req, res);
});

app.patch('/api/suggestions/:id/read', verifyJWT, (req, res) => {
    handleMarkSuggestionRead(db, req, res);
});

app.delete('/api/suggestions/:id', verifyJWT, (req, res) => {
    handleDeleteSuggestion(db, req, res);
});

// ============================================================
// ROUTES - DASHBOARD & AUDIT
// ============================================================

app.get('/api/dashboard/stats', (req, res) => {
    handleGetDashboardStats(db, req, res);
});

app.get('/api/audit-logs', verifyJWT, (req, res) => {
    handleGetAuditLogs(db, req, res);
});

// ============================================================
// SERVE STATIC FILES - Place after all API routes
// ============================================================

app.get('/api/debug/news-archive-state', (req, res) => {
    const sql = `SELECT id, title, is_archived FROM news ORDER BY id`;
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err });
        }
        res.status(200).json({ success: true, news: results });
    });
});

app.get('/api/debug/announcements-archive-state', (req, res) => {
    const sql = `SELECT id, title, is_archived FROM announcements ORDER BY id`;
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error', error: err });
        }
        res.status(200).json({ success: true, announcements: results });
    });
});

app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ============================================================
// REDIRECT ROUTES - OLD ADMIN PATHS TO NEW LOCATION
// ============================================================

app.get('/admin_dashboard.html', (req, res) => {
    res.redirect('/admin_components/admin_dashboard.html');
});

app.get('/admin_settings.html', (req, res) => {
    res.redirect('/admin_components/admin_settings.html');
});

app.get('/admin_signin.html', (req, res) => {
    res.redirect('/admin_components/admin_signin.html');
});

// ============================================================
// ERROR HANDLING - 404
// ============================================================

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
