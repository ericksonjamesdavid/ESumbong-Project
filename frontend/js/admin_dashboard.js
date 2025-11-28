// =======================
// MAIN INITIALIZATION
// =======================
document.addEventListener("DOMContentLoaded", () => {
    // Load all modules
    fetchReports();
    fetchDashboardStats();
    
    // Use the NEW loadContentManagement for Tabs
    loadContentManagement();

    fetchSuggestions();
    fetchAuditLogs();

    // Restore Section
    const defaultSection = localStorage.getItem("defaultSection");
    if (defaultSection && document.getElementById(defaultSection)) {
        showSection(defaultSection);
    } else {
        showSection('sectionAnnouncements');
    }
});