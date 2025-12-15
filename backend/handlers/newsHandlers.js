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

// Delete News Handler
const handleDeleteNews = (db, req, res) => {
    const { id } = req.params;
    
    // First, get news details before deleting
    db.query('SELECT title FROM news WHERE id = ?', [id], (selectErr, selectResult) => {
        if (selectErr || !selectResult || selectResult.length === 0) {
            return res.status(404).json({ success: false, message: 'News article not found' });
        }
        
        const title = selectResult[0].title;
        const sql = `CALL sp_DeleteNews(?)`;
        
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error('Error deleting news:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            logAuditAction(db, req.admin.id, 'Admin', 'NEWS_DELETED', 'news', id, `Deleted news article: "${title}".`);
            
            res.status(200).json({ success: true, message: 'News deleted' });
        });
    });
};

// Get All News Handler
const handleGetNews = (db, req, res) => {
    const sql = `CALL sp_GetNews()`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching news:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.status(200).json({ success: true, news: results[0] });
    });
};

module.exports = { handleCreateNews, handleUpdateNews, handleDeleteNews, handleGetNews };
