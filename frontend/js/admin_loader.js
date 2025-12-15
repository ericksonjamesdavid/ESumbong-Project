// =======================
// MASTER COMPONENT LOADER
// =======================
async function loadAdminDashboard() {
    console.log("Starting Admin Dashboard...");

    // 1. Define component paths (Ensure these match your folder structure)
    const components = [
        { id: 'sidebar-placeholder',  url: 'admin_components/sidebar.html' },
        { id: 'modals-placeholder',   url: 'admin_components/modals.html' },
        { id: 'sectionAnnouncements', url: 'admin_components/sections/announcements.html' },
        { id: 'sectionCharts',        url: 'admin_components/sections/charts.html' },
        { id: 'sectionReports',       url: 'admin_components/sections/reports.html' },
        { id: 'sectionAuditLog',      url: 'admin_components/sections/audit.html' },
        { id: 'sectionSuggestions',   url: 'admin_components/sections/suggestions.html' }
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

    console.log("✅ All HTML components loaded.");

    // 3. Initialize Sidebar (must be after sidebar HTML is loaded)
    if (typeof initSidebar === 'function') {
        initSidebar();
    } else {
        console.warn("initSidebar function not found");
    }
    
    // 4. Initialize Charts (must be after charts section HTML is loaded)
    if (typeof initChartsWithData === 'function') {
        await initChartsWithData();
    } else {
        console.warn("initChartsWithData function not found");
    }
    
    // 5. Load Data for all sections
    console.log("Fetching reports...");
    if (typeof fetchReports === 'function') {
        await fetchReports();
        console.log("Reports loaded");
    } else {
        console.warn("fetchReports not found");
    }
    
    if (typeof initReports === 'function') {
        initReports();
        console.log("Reports initialized");
    } else {
        console.warn("initReports not found");
    }
    
    console.log("Fetching suggestions...");
    if (typeof fetchSuggestions === 'function') {
        await fetchSuggestions();
        console.log("Suggestions loaded");
    } else {
        console.warn("fetchSuggestions not found");
    }
    
    if (typeof initSuggestions === 'function') {
        initSuggestions();
        console.log("Suggestions initialized");
    } else {
        console.warn("initSuggestions not found");
    }
    
    console.log("Fetching audit logs...");
    if (typeof fetchAuditLogs === 'function') {
        await fetchAuditLogs();
        console.log("Audit logs loaded");
    } else {
        console.warn("fetchAuditLogs not found");
    }
    
    if (typeof initAudit === 'function') {
        initAudit();
        console.log("Audit initialized");
    } else {
        console.warn("initAudit not found");
    }

    // 6. Load Content Manager (Announcements & News)
    if (typeof initContentManagement === 'function') {
        initContentManagement();
    }
    if (typeof loadContentManagement === 'function') {
        await loadContentManagement();
    }

    // 7. Set Default View
    const defaultSection = localStorage.getItem("defaultSection") || 'sectionAnnouncements';
    if (typeof showSection === 'function') {
        showSection(defaultSection);
    }
}

document.addEventListener("DOMContentLoaded", loadAdminDashboard);