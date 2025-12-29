const { logAuditAction } = require('./adminHandlers');
const DEBUG_AUDIT = process.env.DEBUG_AUDIT === 'true' || false;

// Submit Suggestion Handler
const handleSubmitSuggestion = (db, req, res) => {
    const { suggestionText } = req.body;
    const sql = `CALL sp_SubmitSuggestion(?)`;
    db.query(sql, [suggestionText], (err, result) => {
        if (err) {
            console.error('Error submitting suggestion:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Get the suggestion_id that was just created
        db.query('SELECT suggestion_id, id FROM suggestions ORDER BY id DESC LIMIT 1', (selectErr, selectResult) => {
            if (selectResult && selectResult[0]) {
                const suggestionId = selectResult[0].suggestion_id;
                const suggestionDbId = selectResult[0].id;
                // Log as anonymous resident (no admin_id)
                logAuditAction(db, null, 'Resident', 'SUGGESTION_SUBMITTED', 'suggestions', suggestionDbId, `Resident submitted suggestion: ${suggestionId}`);
            }
        });
        
        res.status(201).json({ success: true, message: 'Suggestion submitted' });
    });
};

// Get All Suggestions Handler
const handleGetSuggestions = (db, req, res) => {
    const sql = `CALL sp_GetSuggestions()`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching suggestions - Full error:', err.message, err.code, err.sqlMessage);
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }
        res.status(200).json({ success: true, suggestions: results[0] });
    });
};

// Mark Suggestion as Read Handler
const handleMarkSuggestionRead = (db, req, res) => {
    const { id } = req.params;
    const sql = `CALL sp_MarkSuggestionAsRead(?)`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error marking as read:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Get suggestion details for audit log
        db.query('SELECT suggestion_id FROM suggestions WHERE id = ?', [id], (queryErr, queryResult) => {
            const suggestionId = queryResult && queryResult[0] ? queryResult[0].suggestion_id : 'Unknown';
            const description = `Marked suggestion "${suggestionId}" as read.`;
            if (DEBUG_AUDIT) console.log(`AUDIT LOG DEBUG - Suggestion ID: ${suggestionId} Description: ${description}`);
            logAuditAction(db, req.admin.id, 'Admin', 'SUGGESTION_READ', 'suggestions', id, description);
            // Return the suggestionId in the response so client can confirm and UI can refresh with exact id
            res.status(200).json({ success: true, message: 'Marked as read', suggestionId });
        });
    });
};

// Delete Suggestion Handler
const handleDeleteSuggestion = (db, req, res) => {
    const { id } = req.params;
    
    // First, get suggestion details before deleting
    db.query('SELECT suggestion_id FROM suggestions WHERE id = ?', [id], (selectErr, selectResult) => {
        if (selectErr || !selectResult || selectResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Suggestion not found' });
        }
        
        const suggestionId = selectResult[0].suggestion_id;
        const sql = `CALL sp_DeleteSuggestion(?)`;

        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error('Error deleting suggestion:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            logAuditAction(db, req.admin.id, 'Admin', 'SUGGESTION_DELETED', 'suggestions', id, `Deleted suggestion "${suggestionId}".`);

            res.status(200).json({ success: true, message: 'Suggestion deleted' });
        });
    });
};

module.exports = { handleSubmitSuggestion, handleGetSuggestions, handleMarkSuggestionRead, handleDeleteSuggestion };
