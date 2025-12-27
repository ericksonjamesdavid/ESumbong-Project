const { logAuditAction } = require('./adminHandlers');

// Create Announcement Handler
const handleCreateAnnouncement = (db, req, res) => {
    const { title, description } = req.body;
    const sql = `CALL sp_CreateAnnouncement(?, ?)`;
    db.query(sql, [title, description], (err, results) => {
        if (err) {
            console.error('Error creating announcement:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        const newAnnouncementId = results[0][0].id;
        
        logAuditAction(db, req.admin.id, 'Admin', 'ANNOUNCEMENT_CREATED', 'announcements', newAnnouncementId, `Posted new announcement: "${title}".`);
        
        res.status(201).json({ success: true, newAnnouncement: results[0][0] });
    });
};

// Update Announcement Handler
const handleUpdateAnnouncement = (db, req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const sql = `CALL sp_UpdateAnnouncement(?, ?, ?)`;
    db.query(sql, [id, title, description], (err, result) => {
        if (err) {
            console.error('Error updating announcement:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        logAuditAction(db, req.admin.id, 'Admin', 'ANNOUNCEMENT_UPDATED', 'announcements', id, `Updated announcement: "${title}".`);
        
        res.status(200).json({ success: true, message: 'Announcement updated' });
    });
};

// Archive Announcement Handler
const handleArchiveAnnouncement = (db, req, res) => {
    const { id } = req.params;
    const adminId = req.admin?.id;
    
    if (!adminId) {
        console.error('Archive announcement: No admin ID in request');
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    console.log(`[ARCHIVE] Starting archive for announcement ID: ${id}`);
    
    // First, get announcement details before archiving
    db.query('SELECT id, title, is_archived FROM announcements WHERE id = ?', [id], (selectErr, selectResult) => {
        if (selectErr) {
            console.error('[ARCHIVE] Error fetching announcement:', selectErr);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        if (!selectResult || selectResult.length === 0) {
            console.error(`[ARCHIVE] Announcement ID ${id} not found`);
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }
        
        const title = selectResult[0].title;
        const currentArchived = selectResult[0].is_archived;
        console.log(`[ARCHIVE] Found announcement ID ${id}: "${title}", current is_archived: ${currentArchived}`);
        
        const sql = `CALL sp_ArchiveAnnouncement(?)`;
        
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error('[ARCHIVE] Error calling sp_ArchiveAnnouncement:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            // Verify the archive was successful
            db.query('SELECT is_archived FROM announcements WHERE id = ?', [id], (verifyErr, verifyResult) => {
                if (verifyErr) {
                    console.error('[ARCHIVE] Error verifying archive:', verifyErr);
                } else {
                    const newArchived = verifyResult[0]?.is_archived;
                    console.log(`[ARCHIVE] Verification: Announcement ID ${id} is_archived is now: ${newArchived}`);
                }
                
                logAuditAction(db, adminId, 'Admin', 'ANNOUNCEMENT_ARCHIVED', 'announcements', id, `Archived announcement: "${title}".`);
                res.status(200).json({ success: true, message: 'Announcement archived' });
            });
        });
    });
};

// Get All Announcements Handler (with optional archived filter)
const handleGetAnnouncements = (db, req, res) => {
    const archived = req.query.archived === 'true';
    
    if (archived) {
        // Get archived announcements
        const sql = `SELECT id, title, description, is_archived, DATE_FORMAT(date_posted, '%b %d, %Y') AS date FROM announcements WHERE is_archived = 1 ORDER BY date_posted DESC`;
        db.query(sql, (err, results) => {
            if (err) {
                console.error('[GET] Error fetching archived announcements:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            res.status(200).json({ success: true, announcements: results });
        });
    } else {
        // Get active announcements
        const sql = `CALL sp_GetAnnouncements()`;
        db.query(sql, (err, results) => {
            if (err) {
                console.error('[GET] Error fetching announcements:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            res.status(200).json({ success: true, announcements: results[0] });
        });
    }
};

module.exports = { handleCreateAnnouncement, handleUpdateAnnouncement, handleArchiveAnnouncement, handleGetAnnouncements };
