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

// Delete Announcement Handler
const handleDeleteAnnouncement = (db, req, res) => {
    const { id } = req.params;
    
    // First, get announcement details before deleting
    db.query('SELECT title FROM announcements WHERE id = ?', [id], (selectErr, selectResult) => {
        if (selectErr || !selectResult || selectResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }
        
        const title = selectResult[0].title;
        const sql = `CALL sp_DeleteAnnouncement(?)`;
        
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error('Error deleting announcement:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            logAuditAction(db, req.admin.id, 'Admin', 'ANNOUNCEMENT_DELETED', 'announcements', id, `Deleted announcement: "${title}".`);
            
            res.status(200).json({ success: true, message: 'Announcement deleted' });
        });
    });
};

// Get All Announcements Handler
const handleGetAnnouncements = (db, req, res) => {
    const sql = `CALL sp_GetAnnouncements()`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching announcements:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.status(200).json({ success: true, announcements: results[0] });
    });
};

module.exports = { handleCreateAnnouncement, handleUpdateAnnouncement, handleDeleteAnnouncement, handleGetAnnouncements };
