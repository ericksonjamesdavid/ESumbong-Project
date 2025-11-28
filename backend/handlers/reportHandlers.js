const { logAuditAction } = require('./adminHandlers');

// Report Submission Handler
const handleReportSubmission = (db, req, res) => {
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
            console.error('Error executing stored procedure:', err.message, err.code, err.sqlMessage);
            console.error('Values passed:', values);
            return res.status(500).json({ success: false, message: 'Database error', error: err.message });
        }
        
        // Log the report submission to audit_logs
        const auditDescription = `New report submitted: ${category.charAt(0).toUpperCase() + category.slice(1)} (${trackingId}).`;
        logAuditAction(db, null, finalFullname === 'Anonymous' ? 'Resident' : finalFullname, 'REPORT_SUBMITTED', 'reports', null, auditDescription);
        
        res.status(200).json({ success: true, message: 'Report submitted!', trackingId: trackingId });
    });
};

// Get All Reports Handler
const handleGetAllReports = (db, req, res) => {
    const sql = `CALL sp_GetAllReports()`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching reports:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.status(200).json({ success: true, reports: results[0] });
    });
};

// Update Report Status Handler
const handleUpdateReportStatus = (db, req, res) => {
    const { trackingId } = req.params;
    const { status } = req.body;

    const sql = `CALL sp_UpdateReportStatus(?, ?)`;
    
    db.query(sql, [trackingId, status], (err, result) => {
        if (err) {
            console.error('Error updating report status:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        // Log report status change to audit_logs
        logAuditAction(db, null, 'Admin', 'REPORT_STATUS_CHANGED', 'reports', null, `Updated report ${trackingId} status to '${status}'.`);

        res.status(200).json({ success: true, message: 'Report status updated' });
    });
};

// Get Report by Tracking ID Handler
const handleGetReportByTrackingId = (db, req, res) => {
    const { trackingId } = req.params;

    const sql = `CALL sp_GetReportByTrackingId(?)`;
    
    db.query(sql, [trackingId], (err, results) => {
        if (err) {
            console.error('Error fetching report:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results[0].length === 0) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        res.status(200).json({ success: true, report: results[0][0] });
    });
};

module.exports = { handleReportSubmission, handleGetAllReports, handleUpdateReportStatus, handleGetReportByTrackingId };
