// =======================
// MAIN SCRIPT - MODULAR
// =======================
// This file imports and initializes all modules

import { initAnimationObserver, initHomePageSetup } from './modules/animations.js';
import { initAnnouncementsAndNews } from './modules/announcementsNews.js';
import { initDashboardCharts } from './modules/charts.js';
import { initReportMap, initDefaultDate } from './modules/map.js';
import { initBarangayIdUpload, initEvidenceUpload } from './modules/fileUpload.js';
import { initAnonymousToggle, initCategoryLogic } from './modules/reportForm.js';
import { initReportSubmission, initLightboxClose } from './modules/reportSubmission.js';

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
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
