/**
 * Charts Controller
 * Handles statistics dashboard, chart rendering, filtering, and data aggregation
 */

import { ReportService } from '../services/report.service.js';

let allReportsData = [];
const canonicalOrder = ['Garbage', 'Street Lighting', 'Road Repair', 'Water', 'Other'];
const palette = ['#72C93B', '#28A745', '#F2C94C', '#3498DB', '#A0522D'];

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

function populateYearFilter(data) {
    const filterYearEl = document.getElementById('filterYear');
    if (!filterYearEl) return;

    const years = Array.from(new Set(data.map(r => r.date ? r.date.split('-')[0] : null).filter(Boolean))).sort((a, b) => b - a);
    const existing = new Set(Array.from(filterYearEl.options).map(o => o.value));

    if (!existing.has('all')) {
        const opt = document.createElement('option');
        opt.value = 'all';
        opt.textContent = 'All';
        filterYearEl.insertBefore(opt, filterYearEl.firstChild);
        existing.add('all');
    }

    years.forEach(y => {
        if (!existing.has(String(y))) {
            const opt = document.createElement('option');
            opt.value = String(y);
            opt.textContent = String(y);
            filterYearEl.appendChild(opt);
            existing.add(String(y));
        }
    });
}

function updateCharts() {
    const year = document.getElementById('filterYear').value;
    const month = document.getElementById('filterMonth').value;
    
    let filtered = allReportsData;
    
    if (year !== 'all') {
        filtered = filtered.filter(r => {
            const rYear = new Date(r.date).getFullYear().toString();
            return rYear === year;
        });
    }
    
    if (month !== 'all') {
        filtered = filtered.filter(r => {
            const rMonth = String(new Date(r.date).getMonth() + 1).padStart(2, '0');
            return rMonth === month;
        });
    }
    
    renderCharts(filtered);
}

function resetFilters() {
    const filterYear = document.getElementById('filterYear');
    const filterMonth = document.getElementById('filterMonth');
    if (filterYear) filterYear.value = 'all';
    if (filterMonth) filterMonth.value = 'all';
    renderCharts(allReportsData);
}

function computeStats(reports) {
    const grouped = {};
    
    reports.forEach(rep => {
        if (!rep.date) return;
        
        let catRaw = (rep.category || '').toString().trim();
        const catLc = catRaw.toLowerCase();
        const canonical = {
            'garbage': 'Garbage',
            'streetlight': 'Street Lighting',
            'street light': 'Street Lighting',
            'road': 'Road Repair',
            'water': 'Water',
            'road repair': 'Road Repair'
        };

        const cat = canonical[catLc] || 'Other';
        if (!grouped[cat]) grouped[cat] = { category: cat, reported: 0, solved: 0 };
        grouped[cat].reported += 1;
        if (String(rep.status).toLowerCase() === 'resolved') grouped[cat].solved += 1;
    });

    let processed = Object.values(grouped);
    if (processed.length === 0) return [];
    
    processed.sort((a, b) => {
        const ai = canonicalOrder.indexOf(a.category);
        const bi = canonicalOrder.indexOf(b.category);
        const aidx = ai === -1 ? canonicalOrder.length : ai;
        const bidx = bi === -1 ? canonicalOrder.length : bi;
        return aidx - bidx;
    });
    return processed;
}

function renderCharts(reports) {
    const stats = computeStats(reports);
    renderFromStats(stats, reports);
}

function renderFromStats(stats, reports) {
    const chartsContainer = document.getElementById('chartsContainer');
    const noReportsMessage = document.getElementById('noReportsMessage');
    const summaryEl = document.getElementById('reportsSummary');

    if (stats.length === 0) {
        if (chartsContainer) chartsContainer.classList.add('hidden');
        if (noReportsMessage) noReportsMessage.classList.remove('hidden');

        const reportedTotalEl = document.getElementById('reportedTotal');
        const solvedTotalEl = document.getElementById('solvedTotal');
        const resolvedPercentEl = document.getElementById('resolvedPercent');
        if (reportedTotalEl) reportedTotalEl.textContent = '0';
        if (solvedTotalEl) solvedTotalEl.textContent = '0';
        if (resolvedPercentEl) resolvedPercentEl.textContent = '0%';
        if (summaryEl) summaryEl.textContent = `A total of 0 reports.`;
        return;
    }

    if (chartsContainer) chartsContainer.classList.remove('hidden');
    if (noReportsMessage) noReportsMessage.classList.add('hidden');

    const categories = stats.map(s => s.category);
    const reported = stats.map(s => Number(s.reported || 0));
    const solved = stats.map(s => Number(s.solved || 0));

    const colorMap = {};
    canonicalOrder.forEach((c, i) => { colorMap[c] = palette[i % palette.length]; });
    const chartColors = categories.map(cat => colorMap[cat] || palette[palette.length - 1]);

    const totalReported = reported.reduce((a, b) => a + b, 0);
    const totalSolved = solved.reduce((a, b) => a + b, 0);

    const reportedTotalEl = document.getElementById('reportedTotal');
    const solvedTotalEl = document.getElementById('solvedTotal');
    const resolvedPercentEl = document.getElementById('resolvedPercent');

    if (reportedTotalEl) reportedTotalEl.textContent = totalReported;
    if (solvedTotalEl) solvedTotalEl.textContent = totalSolved;
    if (resolvedPercentEl) resolvedPercentEl.textContent = (totalReported > 0 ? ((totalSolved / totalReported) * 100).toFixed(1) : 0) + '%';
    // Update admin summary to match user-facing wording
    if (summaryEl) {
        try {
            const validDates = (reports || []).map(r => r.date).filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d));
            const latest = validDates.length ? new Date(Math.max.apply(null, validDates)) : null;
            const latestText = latest ? latest.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

            if (totalReported === 0) {
                summaryEl.textContent = `A total of 0 reports.`;
            } else {
                const ranked = stats.slice().sort((a, b) => Number(b.reported) - Number(a.reported));
                const top = ranked.slice(0, 3).map(s => ({
                    category: s.category,
                    count: Number(s.reported) || 0,
                    pct: totalReported > 0 ? (Number(s.reported) / totalReported) * 100 : 0
                }));

                const parts = top.map(t => `${t.category} (${t.count}${totalReported > 0 ? `, ${t.pct.toFixed(1)}%` : ''})`);
                let topDesc = '';
                if (parts.length === 1) topDesc = `${parts[0]} is the most reported type`;
                else if (parts.length === 2) topDesc = `${parts[0]} and ${parts[1]} are the top types`;
                else topDesc = `${parts[0]}, ${parts[1]}, and ${parts[2]} are the top types`;

                summaryEl.textContent = `A total of ${totalReported} reports, most recent on ${latestText}. The chart shows ${topDesc}.`;
            }
        } catch (e) {
            summaryEl.textContent = `A total of ${totalReported} reports.`;
        }
    }
    // Bar chart
    const barChartEl = document.getElementById('barChart');
    if (barChartEl) {
        if (window.myBarChart) window.myBarChart.destroy();
        window.myBarChart = new Chart(barChartEl, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [
                    { label: 'Reported Issues', data: reported, backgroundColor: '#C70039', borderRadius: 4 },
                    { label: 'Solved Reports', data: solved, backgroundColor: '#28A745', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 10 } } },
                plugins: { legend: { position: 'top' } }
            }
        });
    }

    // Pie chart
    const pieChartEl = document.getElementById('pieChart');
    if (pieChartEl) {
        if (window.myPieChart) window.myPieChart.destroy();
        window.myPieChart = new Chart(pieChartEl, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: reported,
                    backgroundColor: chartColors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const percentage = totalReported > 0 ? ((value / totalReported) * 100).toFixed(1) + '%' : '0%';
                                return `${label}: ${value} (${percentage})`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Populate legend
    const legendList = document.getElementById('legendList');
    if (legendList) {
        legendList.innerHTML = '';
        categories.forEach((label, i) => {
            const li = document.createElement('li');
            li.className = 'flex items-center gap-2';
            li.innerHTML = `
                <span style="background:${chartColors[i]};width:14px;height:14px;border-radius:4px;"></span>
                <span class="text-sm text-gray-700">${label}</span>
            `;
            legendList.appendChild(li);
        });
    }
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
