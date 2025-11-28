// =======================
// MAIN SCRIPT - MODULAR
// =======================
// This file imports and initializes all modules

import { initAnimationObserver, initHomePageSetup } from './modules/animations.js';
import { initNewsCarousel } from './modules/carousel.js';
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
    initNewsCarousel();
    initDashboardCharts();

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
