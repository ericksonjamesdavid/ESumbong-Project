// =======================
// MASTER COMPONENT LOADER
// =======================
async function loadAdminDashboard() {
    console.log("Starting Admin Dashboard...");

    // 1. Define component paths (relative to the current page location)
    const components = [
        { id: 'modals-placeholder',   url: './modals.html' },
        { id: 'sectionAnnouncements', url: './sections/announcements.html' },
        { id: 'sectionCharts',        url: './sections/charts.html' },
        { id: 'sectionReports',       url: './sections/reports.html' },
        { id: 'sectionAuditLog',      url: './sections/audit.html' },
        { id: 'sectionSuggestions',   url: './sections/suggestions.html' }
    ];

    // 2. Fetch all HTML files
    await Promise.all(components.map(async (comp) => {
        try {
            const response = await fetch(comp.url);
            if (!response.ok) throw new Error(`Failed to load ${comp.url}`);
            const html = await response.text();
            
            const element = document.getElementById(comp.id);
            if (element) element.innerHTML = html;
        } catch (error) {
            console.error(`Error loading component: ${comp.url}`, error);
        }
    }));

    console.log("All HTML components loaded successfully.");
    
    // Dispatch custom event to signal that components are loaded
    window.dispatchEvent(new CustomEvent('componentsLoaded'));
}

document.addEventListener("DOMContentLoaded", loadAdminDashboard);
