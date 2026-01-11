// Get Dashboard Stats Handler
const handleGetDashboardStats = (db, req, res) => {
    const sql = `CALL sp_GetDashboardStats()`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching dashboard stats:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.status(200).json({ success: true, stats: results[0] });
    });
};

// Get Audit Logs Handler
const handleGetAuditLogs = (db, req, res) => {
    const sql = `CALL sp_GetAuditLogs()`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching audit logs:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.status(200).json({ success: true, logs: results[0] });
    });
};

module.exports = { handleGetDashboardStats, handleGetAuditLogs };
