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
    
    // First, get news details before archiving
    db.query('SELECT title FROM news WHERE id = ?', [id], (selectErr, selectResult) => {
        if (selectErr || !selectResult || selectResult.length === 0) {
            return res.status(404).json({ success: false, message: 'News article not found' });
        }
        
        const title = selectResult[0].title;
        const sql = `CALL sp_ArchiveNews(?)`;
        
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error('Error archiving news:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            logAuditAction(db, req.admin.id, 'Admin', 'NEWS_ARCHIVED', 'news', id, `Archived news article: "${title}".`);
            
            res.status(200).json({ success: true, message: 'News archived' });
        });
    });
};

// Get All News Handler (with optional archived filter)
const handleGetNews = (db, req, res) => {
    const archived = req.query.archived === 'true' ? 1 : 0;
    
    if (archived) {
        // Get archived news
        const sql = `SELECT id, title, description, image_url, link_url, DATE_FORMAT(date_posted, '%b %d, %Y') AS date FROM news WHERE is_archived = 1 ORDER BY date_posted DESC`;
        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error fetching archived news:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            res.status(200).json({ success: true, news: results });
        });
    } else {
        // Get active news
        const sql = `CALL sp_GetNews()`;
        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error fetching news:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            res.status(200).json({ success: true, news: results[0] });
        });
    }
};

module.exports = { handleCreateNews, handleUpdateNews, handleArchiveNews, handleGetNews };
