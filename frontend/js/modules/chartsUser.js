/**
 * Dashboard Charts Module (User-facing)
 * Uses shared chartsUtils for data aggregation and rendering
 */

import { computeStats, renderFromStats, populateYearFilter, filterReports } from '../utils/chartsUtils.js';

let allReportsData = [];

export const initDashboardCharts = async () => {
	const filterYear = document.getElementById('filterYear');
	const filterMonth = document.getElementById('filterMonth');
	const clearBtn = document.getElementById('clearFiltersBtn');

	if (filterYear) filterYear.addEventListener('change', updateCharts);
	if (filterMonth) filterMonth.addEventListener('change', updateCharts);
	if (clearBtn) clearBtn.addEventListener('click', resetFilters);

	await loadChartData();
};

async function loadChartData() {
	try {
		const response = await fetch('/api/reports');
		const data = await response.json();
		if (data && data.success && Array.isArray(data.reports)) {
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

if (typeof window !== 'undefined') {
	window.refreshUserCharts = initDashboardCharts;
	// Optimistic client-side add: push a new report locally and re-render instantly
	window.addReport = function (rep) {
		try {
			if (!rep) return;
			if (!rep.date) rep.date = new Date().toISOString();
			allReportsData.unshift(rep);
			renderCharts(allReportsData);
		} catch (e) {
			console.error('addReport error:', e);
		}
	};
}

