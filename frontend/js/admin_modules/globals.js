// =======================
// GLOBAL VARIABLES & HELPERS
// =======================
let mapInstance = null; 
let allReports = [];
let filteredReports = [];
let allSuggestions = [];
let currentSuggestionId = null;

// Audit Log Data
let auditLogData = []; 
let filteredAuditLogs = [];

// Helper: Get date as YYYY-MM-DD (Local Time)
function getLocalISOString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper: Get formatted date for downloads
function getFormattedDate() {
    return getLocalISOString(new Date());
}