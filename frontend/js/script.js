// =======================
// MAIN SCRIPT - PUBLIC SITE
// =======================
// This file imports and initializes all public site modules

import { initAnimationObserver, initHomePageSetup } from './modules/animations.js';
import { initAnnouncementsAndNews } from './modules/announcementsNews.js';
import { initDashboardCharts } from './modules/chartsUser.js';
import { initReportMap, initDefaultDate } from './modules/map.js';
import { initBarangayIdUpload, initEvidenceUpload } from './modules/fileUpload.js';
import { initAnonymousToggle, initCategoryLogic } from './modules/reportForm.js';
import { initReportSubmission, initLightboxClose } from './modules/reportSubmission.js';

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
    // Load charts component dynamically
    const chartsPlaceholder = document.getElementById('chartsPlaceholder');
    if (chartsPlaceholder) {
        try {
            const res = await fetch('admin_components/sections/charts.html');
            const html = await res.text();
            chartsPlaceholder.innerHTML = html;
        } catch (err) {
            console.error('Error loading charts component:', err);
        }
    }

    // Animations
    initAnimationObserver();
    initHomePageSetup();

    // Homepage features
    initAnnouncementsAndNews();
    // Initialize dashboard charts only when chart elements exist on the page
    if (document.getElementById('barChart') || document.getElementById('pieChart') || document.getElementById('legendList')) {
        initDashboardCharts();
    }

    // Report page features
    initReportMap();
    initDefaultDate();
    initBarangayIdUpload();
    initEvidenceUpload();
    initAnonymousToggle();
    initCategoryLogic();
    initReportSubmission();
    initLightboxClose();
});

// CLOSE DROPDOWNS ON OUTSIDE CLICK
document.addEventListener('click', (e) => {
    const reportsBtn = document.getElementById('reports-btn');
    const reportsDropdown = document.getElementById('reports-dropdown');
    const chevron = document.getElementById('chevron');

    // Check if the click is OUTSIDE the button and OUTSIDE the menu
    if (reportsBtn && reportsDropdown && !reportsBtn.contains(e.target) && !reportsDropdown.contains(e.target)) {
        // Hide the menu
        reportsDropdown.classList.add('hidden');
        // Reset the arrow rotation
        if(chevron) chevron.classList.remove('rotate-180');
    }
});
