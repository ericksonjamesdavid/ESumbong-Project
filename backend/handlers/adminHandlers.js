const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Log to audit_logs helper function
const logAuditAction = (db, adminId, userName, actionType, tableName, recordId, description) => {
    const auditSql = `CALL sp_LogAuditAction(?, ?, ?, ?, ?, ?)`;
    const auditValues = [adminId, userName, actionType, tableName, recordId, description];
    
    db.query(auditSql, auditValues, (auditErr) => {
        if (auditErr) console.error('Error logging audit action:', auditErr);
    });
};

// Admin Login Handler
const handleAdminLogin = (db, req, res) => {
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
                console.warn(`Failed login attempt for username: ${username}`);
                return res.status(401).json({ success: false, message: 'Invalid username or password' });
            }

            const token = jwt.sign(
                { id: admin.id, username: admin.username }, 
                JWT_SECRET, 
                { expiresIn: '1h' } 
            );
            
            // Log successful login to audit_logs
            logAuditAction(db, admin.id, 'Admin', 'LOGIN', 'admins', admin.id, 'Admin logged in successfully.');
            
            res.status(200).json({ success: true, message: 'Login successful', token: token });

        } catch (error) {
            console.error('Error comparing password:', error);
            res.status(500).json({ success: false, message: 'Password validation error. Please try again.' });
        }
    });
};

// Admin Password Update Handler
const handlePasswordUpdate = (db, req, res) => {
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
                logAuditAction(db, adminId, 'Admin', 'PASSWORD_CHANGED', 'admins', adminId, 'Admin changed their password.');

                res.status(200).json({ success: true, message: 'Password updated successfully.' });
            });
        });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Verify username exists for password recovery
const handleVerifyUsername = (db, req, res) => {
    const { username } = req.body;

    if (!username || username.trim() === '') {
        return res.status(400).json({ success: false, message: 'Username is required.' });
    }

    // Check if username exists in the system
    const sqlCheckUsername = "SELECT id FROM admins WHERE username = ?";
    db.query(sqlCheckUsername, [username], (err, results) => {
        if (err) {
            console.error('Error checking username:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Username does not exist in the system.' });
        }

        res.status(200).json({ success: true, message: 'Username verified successfully.' });
    });
};

// Verify PIN for password recovery
const handleVerifyPin = (req, res) => {
    const { pin } = req.body;

    if (!pin || pin.length !== 4) {
        return res.status(400).json({ success: false, message: 'PIN must be 4 digits.' });
    }

    // Master PIN stored in environment variable for security
    const MASTER_PIN = process.env.MASTER_PIN || '1234';

    if (pin === MASTER_PIN) {
        res.status(200).json({ success: true, message: 'PIN verified successfully.' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid PIN.' });
    }
};

// Reset password via PIN
const handleResetPasswordViaPin = (db, req, res) => {
    const { pin, newPassword, username } = req.body;

    // Validation
    if (!pin || !newPassword || !username) {
        return res.status(400).json({ success: false, message: 'PIN, username, and new password are required.' });
    }

    if (pin.length !== 4) {
        return res.status(400).json({ success: false, message: 'Invalid PIN format.' });
    }

    // Verify PIN
    const MASTER_PIN = process.env.MASTER_PIN || '1234';
    if (pin !== MASTER_PIN) {
        return res.status(401).json({ success: false, message: 'Invalid PIN.' });
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
        // First, verify the username exists in the system
        const sqlCheckUsername = "SELECT id FROM admins WHERE username = ?";
        db.query(sqlCheckUsername, [username], (err, results) => {
            if (err) {
                console.error('Error checking username:', err);
                return res.status(500).json({ success: false, message: 'Database error.' });
            }

            if (results.length === 0) {
                return res.status(401).json({ success: false, message: 'Username does not exist in the system.' });
            }

            const adminId = results[0].id;

            // Hash new password
            bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
                if (hashErr) {
                    console.error('Error hashing password:', hashErr);
                    return res.status(500).json({ success: false, message: 'Error processing password.' });
                }

                // Update password for the verified username
                const sqlUpdatePassword = "UPDATE admins SET password_hash = ? WHERE username = ?";
                db.query(sqlUpdatePassword, [hashedPassword, username], (updateErr) => {
                    if (updateErr) {
                        console.error('Error updating password:', updateErr);
                        return res.status(500).json({ success: false, message: 'Database error.' });
                    }

                    // Log password reset to audit_logs
                    logAuditAction(db, adminId, 'System', 'PASSWORD_RESET', 'admins', adminId, `Password was reset via recovery PIN for user: ${username}`);

                    res.status(200).json({ success: true, message: 'Password reset successfully. Please login with your new password.' });
                });
            });
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { handleAdminLogin, handlePasswordUpdate, handleVerifyUsername, handleVerifyPin, handleResetPasswordViaPin, logAuditAction };
