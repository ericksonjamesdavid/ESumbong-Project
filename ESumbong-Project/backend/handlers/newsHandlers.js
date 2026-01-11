const { logAuditAction } = require('./adminHandlers');

// Create News Handler
const handleCreateNews = (db, req, res) => {
    const { title, description, image, link } = req.body;
    const sql = `CALL sp_CreateNews(?, ?, ?, ?)`;
    db.query(sql, [title, description, image, link], (err, results) => {
        if (err) {
            console.error('Error creating news:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        const newNewsId = results[0][0].id;
        
        logAuditAction(db, req.admin.id, 'Admin', 'NEWS_CREATED', 'news', newNewsId, `Posted new news article: "${title}".`);
        
        res.status(201).json({ success: true, newNews: results[0][0] });
    });
};

// Update News Handler
const handleUpdateNews = (db, req, res) => {
    const { id } = req.params;
    const { title, description, image, link } = req.body;
    const sql = `CALL sp_UpdateNews(?, ?, ?, ?, ?)`;
    db.query(sql, [id, title, description, image, link], (err, result) => {
        if (err) {
            console.error('Error updating news:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        logAuditAction(db, req.admin.id, 'Admin', 'NEWS_UPDATED', 'news', id, `Updated news article: "${title}".`);
        
        res.status(200).json({ success: true, message: 'News updated' });
    });
};

// Archive News Handler
const handleArchiveNews = (db, req, res) => {
    const { id } = req.params;
    const adminId = req.admin?.id;
    
    if (!adminId) {
        console.error('Archive news: No admin ID in request');
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    console.log(`[ARCHIVE] Starting archive for news ID: ${id}`);
    
    // First, get news details before archiving
    db.query('SELECT id, title, is_archived FROM news WHERE id = ?', [id], (selectErr, selectResult) => {
        if (selectErr) {
            console.error('[ARCHIVE] Error fetching news:', selectErr);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        if (!selectResult || selectResult.length === 0) {
            console.error(`[ARCHIVE] News ID ${id} not found`);
            return res.status(404).json({ success: false, message: 'News article not found' });
        }
        
        const title = selectResult[0].title;
        const currentArchived = selectResult[0].is_archived;
        console.log(`[ARCHIVE] Found news ID ${id}: "${title}", current is_archived: ${currentArchived}`);
        
        const sql = `CALL sp_ArchiveNews(?)`;
        
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error('[ARCHIVE] Error calling sp_ArchiveNews:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            // Verify the archive was successful
            db.query('SELECT is_archived FROM news WHERE id = ?', [id], (verifyErr, verifyResult) => {
                if (verifyErr) {
                    console.error('[ARCHIVE] Error verifying archive:', verifyErr);
                } else {
                    const newArchived = verifyResult[0]?.is_archived;
                    console.log(`[ARCHIVE] Verification: News ID ${id} is_archived is now: ${newArchived}`);
                }
                
                logAuditAction(db, adminId, 'Admin', 'NEWS_ARCHIVED', 'news', id, `Archived news article: "${title}".`);
                res.status(200).json({ success: true, message: 'News archived' });
            });
        });
    });
};

// Get All News Handler (with optional archived filter)
const handleGetNews = (db, req, res) => {
    const archived = req.query.archived === 'true';
    
    if (archived) {
        // Get archived news with camelCase field names
        const sql = `SELECT id, title, description, is_archived, image_url AS imageUrl, link_url AS linkUrl, DATE_FORMAT(date_posted, '%b %d, %Y') AS date FROM news WHERE is_archived = 1 ORDER BY date_posted DESC`;
        db.query(sql, (err, results) => {
            if (err) {
                console.error('[GET] Error fetching archived news:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            res.status(200).json({ success: true, news: results });
        });
    } else {
        // Get active news
        const sql = `CALL sp_GetNews()`;
        db.query(sql, (err, results) => {
            if (err) {
                console.error('[GET] Error fetching news:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            res.status(200).json({ success: true, news: results[0] });
        });
    }
};

module.exports = { handleCreateNews, handleUpdateNews, handleArchiveNews, handleGetNews };
