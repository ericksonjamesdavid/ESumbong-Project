/**
 * Charts Controller
 * Admin dashboard charts - uses ReportService for data fetching
 */

import { ReportService } from '../services/report.service.js';
import { computeStats, renderFromStats, populateYearFilter, filterReports } from '../utils/chartsUtils.js';

let allReportsData = [];

export async function initCharts() {
    const filterYear = document.getElementById('filterYear');
    const filterMonth = document.getElementById('filterMonth');
    const clearBtn = document.getElementById('clearFiltersBtn');

    if (filterYear) filterYear.addEventListener('change', updateCharts);
    if (filterMonth) filterMonth.addEventListener('change', updateCharts);
    if (clearBtn) clearBtn.addEventListener('click', resetFilters);

    await loadChartData();
}

async function loadChartData() {
    try {
        const data = await ReportService.getAll();
        if (data.success) {
            allReportsData = data.reports;
            populateYearFilter(allReportsData);
            renderCharts(allReportsData);
        }
    } catch (e) { 
        console.error('Error loading chart data:', e); 
    }
}

function updateCharts() {
    const year = document.getElementById('filterYear').value;
    const month = document.getElementById('filterMonth').value;
    const filtered = filterReports(allReportsData, year, month);
    renderCharts(filtered);
}

function resetFilters() {
    const filterYear = document.getElementById('filterYear');
    const filterMonth = document.getElementById('filterMonth');
    if (filterYear) filterYear.value = 'all';
    if (filterMonth) filterMonth.value = 'all';
    renderCharts(allReportsData);
}

function renderCharts(reports) {
    const stats = computeStats(reports);
    renderFromStats(stats, reports);
}

// ============= GLOBAL EXPORTS =============

export { computeStats, renderFromStats };

// Expose an admin helper to add minimal local reports for immediate UI updates (optimistic)
if (typeof window !== 'undefined') {
    window.addAdminReport = function (rep) {
        try {
            if (!rep) return;
            if (!rep.date) rep.date = new Date().toISOString();
            allReportsData.unshift(rep);
            renderCharts(allReportsData);
        } catch (e) {
            console.error('addAdminReport error:', e);
        }
    };
}
