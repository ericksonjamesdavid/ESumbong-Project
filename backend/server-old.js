const express = require('express');
const mysql = require('mysql2');
const path = require('path'); // Used to handle file paths
const multer = require('multer'); // For handling file uploads (not fully implemented yet)
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables from .env file

// --- LOAD ENVIRONMENT VARIABLES ---
const JWT_SECRET = process.env.JWT_SECRET;
const port = process.env.PORT || 3000;

// Initialize Express app
const app = express();


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
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Try to connect
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL Database!');
});

// --- JWT VERIFICATION MIDDLEWARE ---
const verifyJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from "Bearer token"

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided. Please login.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded; // Store admin info in request for later use
        next();
    } catch (error) {
        console.error('JWT Verification Error:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
        }
        
        return res.status(403).json({ success: false, message: 'Invalid token. Access denied.' });
    }
};

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
    const finalFullname = (!fullname || fullname === "null") ? "Anonymous" : fullname;
    
    const values = [
        trackingId, 
        finalFullname, 
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
        
        // Log the report submission to audit_logs
        const auditDescription = `New report submitted: ${category.charAt(0).toUpperCase() + category.slice(1)} (${trackingId}).`;
        const auditSql = `CALL sp_LogAuditAction(NULL, ?, ?, ?, ?, ?)`;
        const auditValues = [finalFullname === 'Anonymous' ? 'Resident' : finalFullname, 'REPORT_SUBMITTED', 'reports', null, auditDescription];
        
        db.query(auditSql, auditValues, (auditErr) => {
            if (auditErr) {
                console.error('Error logging audit action:', auditErr);
                // Continue even if audit log fails
            }
        });
        
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

// --- UPDATE REPORT STATUS ---
app.patch('/api/reports/:trackingId/status', (req, res) => {
    
    const { trackingId } = req.params;
    
    const { newStatus } = req.body;

    if (!['Pending', 'In Progress', 'Resolved'].includes(newStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const sql = `CALL sp_UpdateReportStatus(?, ?)`;
    const values = [trackingId, newStatus];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating status:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.status(200).json({ success: true, message: 'Status updated successfully' });
    });
});

// --- SUGGESTIONS API ENDPOINTS ---

app.post('/api/suggestions', (req, res) => {
    const { fullname, email, suggestion } = req.body;

    const sql = `CALL sp_SubmitSuggestion(?, ?, ?)`;
    const values = [fullname || 'Anonymous', email || null, suggestion];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error submitting suggestion:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.status(200).json({ success: true, message: 'Suggestion submitted!' });
    });
});

app.get('/api/suggestions', (req, res) => {
    const sql = `CALL sp_GetSuggestions()`;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching suggestions:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.status(200).json({ success: true, suggestions: results[0] });
    });
});

app.patch('/api/suggestions/:id/read', verifyJWT, (req, res) => {
    const { id } = req.params;
    const sql = `CALL sp_MarkSuggestionAsRead(?)`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error marking as read:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log suggestion marked as read to audit_logs
        const auditSql = `CALL sp_LogAuditAction(?, ?, ?, ?, ?, ?)`;
        const auditValues = [req.admin.id, 'Admin', 'SUGGESTION_READ', 'suggestions', id, `Marked suggestion as read (ID: ${id}).`];
        db.query(auditSql, auditValues, (auditErr) => {
            if (auditErr) console.error('Error logging audit action:', auditErr);
        });
        
        res.status(200).json({ success: true, message: 'Marked as read' });
    });
});

app.delete('/api/suggestions/:id', verifyJWT, (req, res) => {
    const { id } = req.params;
    const sql = `CALL sp_DeleteSuggestion(?)`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting suggestion:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log suggestion deletion to audit_logs
        const auditSql = `CALL sp_LogAuditAction(?, ?, ?, ?, ?, ?)`;
        const auditValues = [req.admin.id, 'Admin', 'SUGGESTION_DELETED', 'suggestions', id, `Deleted suggestion (ID: ${id}).`];
        db.query(auditSql, auditValues, (auditErr) => {
            if (auditErr) console.error('Error logging audit action:', auditErr);
        });
        
        res.status(200).json({ success: true, message: 'Suggestion deleted' });
    });
});

// --- ANNOUNCEMENTS API ENDPOINTS ---
app.get('/api/announcements', (req, res) => {
    const sql = `CALL sp_GetAnnouncements()`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching announcements:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.status(200).json({ success: true, announcements: results[0] });
    });
});

app.post('/api/announcements', verifyJWT, (req, res) => {
    const { title, description } = req.body;
    const sql = `CALL sp_CreateAnnouncement(?, ?)`;
    db.query(sql, [title, description], (err, results) => {
        if (err) {
            console.error('Error creating announcement:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        const newAnnouncementId = results[0][0].id;
        
        // Log announcement creation to audit_logs
        const auditSql = `CALL sp_LogAuditAction(?, ?, ?, ?, ?, ?)`;
        const auditValues = [req.admin.id, 'Admin', 'ANNOUNCEMENT_CREATED', 'announcements', newAnnouncementId, `Posted new announcement: "${title}".`];
        db.query(auditSql, auditValues, (auditErr) => {
            if (auditErr) console.error('Error logging audit action:', auditErr);
        });
        
        res.status(201).json({ success: true, newAnnouncement: results[0][0] });
    });
});

app.patch('/api/announcements/:id', verifyJWT, (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const sql = `CALL sp_UpdateAnnouncement(?, ?, ?)`;
    db.query(sql, [id, title, description], (err, result) => {
        if (err) {
            console.error('Error updating announcement:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log announcement update to audit_logs
        const auditSql = `CALL sp_LogAuditAction(?, ?, ?, ?, ?, ?)`;
        const auditValues = [req.admin.id, 'Admin', 'ANNOUNCEMENT_UPDATED', 'announcements', id, `Updated announcement: "${title}".`];
        db.query(auditSql, auditValues, (auditErr) => {
            if (auditErr) console.error('Error logging audit action:', auditErr);
        });
        
        res.status(200).json({ success: true, message: 'Announcement updated' });
    });
});

app.delete('/api/announcements/:id', verifyJWT, (req, res) => {
    const { id } = req.params;
    const sql = `CALL sp_DeleteAnnouncement(?)`;
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting announcement:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log announcement deletion to audit_logs
        const auditSql = `CALL sp_LogAuditAction(?, ?, ?, ?, ?, ?)`;
        const auditValues = [req.admin.id, 'Admin', 'ANNOUNCEMENT_DELETED', 'announcements', id, `Deleted announcement (ID: ${id}).`];
        db.query(auditSql, auditValues, (auditErr) => {
            if (auditErr) console.error('Error logging audit action:', auditErr);
        });
        
        res.status(200).json({ success: true, message: 'Announcement deleted' });
    });
});

// --- NEWS API ENDPOINTS ---
app.get('/api/news', (req, res) => {
    const sql = `CALL sp_GetNews()`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching news:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.status(200).json({ success: true, news: results[0] });
    });
});

app.post('/api/news', verifyJWT, (req, res) => {
    const { title, description, image, link } = req.body;
    const sql = `CALL sp_CreateNews(?, ?, ?, ?)`;
    db.query(sql, [title, description, image, link], (err, results) => {
        if (err) {
            console.error('Error creating news:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        const newNewsId = results[0][0].id;
        
        // Log news creation to audit_logs
        const auditSql = `CALL sp_LogAuditAction(?, ?, ?, ?, ?, ?)`;
        const auditValues = [req.admin.id, 'Admin', 'NEWS_CREATED', 'news', newNewsId, `Posted new news article: "${title}".`];
        db.query(auditSql, auditValues, (auditErr) => {
            if (auditErr) console.error('Error logging audit action:', auditErr);
        });
        
        res.status(201).json({ success: true, newNews: results[0][0] });
    });
});

app.patch('/api/news/:id', verifyJWT, (req, res) => {
    const { id } = req.params;
    const { title, description, image, link } = req.body;
    const sql = `CALL sp_UpdateNews(?, ?, ?, ?, ?)`;
    db.query(sql, [id, title, description, image, link], (err, result) => {
        if (err) {
            console.error('Error updating news:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log news update to audit_logs
        const auditSql = `CALL sp_LogAuditAction(?, ?, ?, ?, ?, ?)`;
        const auditValues = [req.admin.id, 'Admin', 'NEWS_UPDATED', 'news', id, `Updated news article: "${title}".`];
        db.query(auditSql, auditValues, (auditErr) => {
            if (auditErr) console.error('Error logging audit action:', auditErr);
        });
        
        res.status(200).json({ success: true, message: 'News updated' });
    });
});

app.delete('/api/news/:id', verifyJWT, (req, res) => {
    const { id } = req.params;
    const sql = `CALL sp_DeleteNews(?)`;
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting news:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Log news deletion to audit_logs
        const auditSql = `CALL sp_LogAuditAction(?, ?, ?, ?, ?, ?)`;
        const auditValues = [req.admin.id, 'Admin', 'NEWS_DELETED', 'news', id, `Deleted news article (ID: ${id}).`];
        db.query(auditSql, auditValues, (auditErr) => {
            if (auditErr) console.error('Error logging audit action:', auditErr);
        });
        
        res.status(200).json({ success: true, message: 'News deleted' });
    });
});


// --- DASHBOARD STATS ---
app.get('/api/dashboard/stats', (req, res) => {
    
    const sql = `CALL sp_GetDashboardStats()`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching dashboard stats:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        // results[0] contains the array of stats
        res.status(200).json({ success: true, stats: results[0] });
    });
});

// --- ADMIN LOGIN ---
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const sql = "SELECT * FROM admins WHERE username = ?";
    
    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        const admin = results[0];

        try {
            const isMatch = await bcrypt.compare(password, admin.password_hash);

            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid username or password' });
            }

            const token = jwt.sign(
                { id: admin.id, username: admin.username }, 
                JWT_SECRET, 
                { expiresIn: '1h' } 
            );
            
            // Log successful login to audit_logs
            const auditSql = `CALL sp_LogAuditAction(?, ?, ?, ?, ?, ?)`;
            const auditValues = [admin.id, 'Admin', 'LOGIN', 'admins', admin.id, 'Admin logged in successfully.'];
            db.query(auditSql, auditValues, (auditErr) => {
                if (auditErr) console.error('Error logging audit action:', auditErr);
            });
            
            res.status(200).json({ success: true, message: 'Login successful', token: token });

        } catch (error) {
            console.error('Error comparing password:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });
});

// --- UPDATE ADMIN PASSWORD ---
app.patch('/api/admin/update-password', verifyJWT, async (req, res) => {
    const adminId = req.admin.id; // From JWT token
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'New passwords do not match.' });
    }

    // Password strength validation
    const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordPattern.test(newPassword)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Password must be at least 8 characters with uppercase, lowercase, number, and symbol.' 
        });
    }

    try {
        // Get current admin password hash
        const sqlGetAdmin = "SELECT password_hash FROM admins WHERE id = ?";
        db.query(sqlGetAdmin, [adminId], async (err, results) => {
            if (err || results.length === 0) {
                console.error('Error fetching admin:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            const admin = results[0];

            // Compare current password
            const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password in database
            const sqlUpdatePassword = "UPDATE admins SET password_hash = ? WHERE id = ?";
            db.query(sqlUpdatePassword, [hashedPassword, adminId], (err) => {
                if (err) {
                    console.error('Error updating password:', err);
                    return res.status(500).json({ success: false, message: 'Database error' });
                }

                // Log password update to audit_logs
                const auditSql = `CALL sp_LogAuditAction(?, ?, ?, ?, ?, ?)`;
                const auditValues = [adminId, 'Admin', 'PASSWORD_CHANGED', 'admins', adminId, 'Admin changed their password.'];
                db.query(auditSql, auditValues, (auditErr) => {
                    if (auditErr) console.error('Error logging audit action:', auditErr);
                });

                res.status(200).json({ success: true, message: 'Password updated successfully.' });
            });
        });

    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// --- GET A SINGLE REPORT BY ID ---
app.get('/api/reports/:trackingId', (req, res) => {
    
    const { trackingId } = req.params;

    const sql = `CALL sp_GetReportByTrackingId(?)`;

    db.query(sql, [trackingId], (err, results) => {
        if (err) {
            console.error('Error fetching report:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results[0].length > 0) {
            res.status(200).json({ success: true, report: results[0][0] });
        } else {
            res.status(404).json({ success: false, message: 'Report not found' });
        }
    });
});

// --- AUDIT LOG ENDPOINTS ---
app.get('/api/audit-logs', verifyJWT, (req, res) => {
    const sql = `CALL sp_GetAuditLogs()`;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching audit logs:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        res.status(200).json({ success: true, logs: results[0] });
    });
});

// --- Start the Server Listener ---
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Your frontend should be visible at http://localhost:${port}`);
});