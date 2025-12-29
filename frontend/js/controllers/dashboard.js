/**
 * Dashboard Controller
 * Orchestrates all dashboard modules (Reports, Content, Charts, Audit, Suggestions)
 * Handles authentication and section navigation
 */

import { initReports } from './reports.js';
import { initContent } from './content.js';
import { initCharts } from './charts.js';
import { initAudit, refreshAuditLog } from './audit.js';
import { initSuggestions } from './suggestions.js';

document.addEventListener("DOMContentLoaded", async () => {
    // Wait for components to be loaded by admin_loader.js
    await new Promise(resolve => {
        if (document.getElementById('modals-placeholder')?.innerHTML) {
            // Components already loaded
            resolve();
        } else {
            // Wait for componentsLoaded event
            window.addEventListener('componentsLoaded', resolve, { once: true });
            // Also set a timeout to avoid hanging forever
            setTimeout(resolve, 2000);
        }
    });
    
    // Note: initSidebar() is already called by admin_loader.js before this module runs
    
    // 1. Check Auth
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin_components/admin_signin.html';
        return;
    }

    // 2. Initialize Modules
    await initReports();
    await initContent();
    await initCharts();
    await initAudit();
    await initSuggestions();

    // 3. Restore last active section (Tab)
    const defaultSection = localStorage.getItem("defaultSection") || 'sectionAnnouncements';
    if(typeof showSection === 'function') showSection(defaultSection);
});

// ============= GLOBAL WINDOW EXPORTS =============
// Expose functions to window for HTML onclick handlers
window.initReports = initReports;
window.initContent = initContent;
window.initCharts = initCharts;
window.initAudit = initAudit;
window.initSuggestions = initSuggestions;
window.refreshAuditLog = refreshAuditLog;
window.switchArchiveSubTab = switchArchiveSubTab;

export { initReports, initContent, initCharts, initAudit, initSuggestions, refreshAuditLog };
