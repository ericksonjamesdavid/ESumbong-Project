// =======================
// SIDEBAR & NAVIGATION
// =======================

// NOTE: initSidebar() is defined in headerLoader.js to ensure proper initialization order
// This file should only contain navigation logic

// Switch Sections
function showSection(sectionId) {
    // Get sidebar element so we can close it
    const sidebar = document.getElementById('sidebar');

    const sections = ['sectionAnnouncements', 'sectionCharts', 'sectionReports', 'sectionAuditLog', 'sectionSuggestions'];

    sections.forEach(sec => {
        const el = document.getElementById(sec);
        if (el) el.style.display = (sec === sectionId) ? 'block' : 'none';
    });

    if (sidebar) {
        sidebar.classList.add('-translate-x-full');
        
        // Reset the icon back to hamburger bars when sidebar closes
        const sidebarToggle = document.getElementById('sidebarToggle');
        const icon = sidebarToggle ? sidebarToggle.querySelector('i') : null;
        if (icon) {
            icon.setAttribute('class', 'fa-solid fa-bars text-2xl transition-all duration-300');
        }
    }
    
    // Update active button highlight via headerLoader.js styling
    if (typeof updateActiveButtonState === 'function') {
        updateActiveButtonState(sectionId);
    }
}