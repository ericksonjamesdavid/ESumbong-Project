/**
 * Charts Utility Module
 * Shared logic for report statistics, filtering, and chart rendering
 * Used by both admin and user-facing dashboards
 */

const canonicalOrder = ['Garbage', 'Street Lighting', 'Road Repair', 'Water', 'Other'];
const palette = ['#72C93B', '#28A745', '#F2C94C', '#3498DB', '#A0522D'];

/**
 * Compute statistics from reports data
 * Normalizes categories and counts reported/solved issues
 */
export function computeStats(reports) {
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

/**
 * Render charts and summaries from stats
 */
export function renderFromStats(stats, reports) {
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

		// User-Friendly Empty State Card
		if (summaryEl) {
			summaryEl.innerHTML = `
            <div class="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center justify-center text-center md:text-left">
                
                <div class="hidden md:flex flex-col items-center justify-center w-24 border-r border-gray-200 pr-6">
                    <div class="w-12 h-12 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mb-2">
                        <i class="fas fa-search text-xl"></i>
                    </div>
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
                </div>

                <div class="flex-1">
                    <h4 class="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2 justify-center md:justify-start">
                        <i class="fas fa-search md:hidden"></i> No Data Found
                    </h4>
                    <p class="text-gray-600 text-sm md:text-base">
                        There are currently no reports matching your selection. 
                        <span class="text-gray-500 block mt-1 text-sm">
                            Try selecting a different <span class="font-semibold text-gray-700">Year</span> or <span class="font-semibold text-gray-700">Month</span> to view past data.
                        </span>
                    </p>
                </div>
            </div>`;
		}
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

	// Update the real-time summary with the "Insight Card" design
	if (summaryEl) {
		try {
			const validDates = (reports || []).map(r => r.date).filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d));
			const latest = validDates.length ? new Date(Math.max.apply(null, validDates)) : null;
			const latestText = latest ? latest.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';

			if (totalReported === 0) {
				summaryEl.innerHTML = `
                    <div class="flex items-center p-4 mb-4 text-sm text-gray-800 rounded-lg bg-gray-50 border border-gray-200" role="alert">
                        <i class="fas fa-info-circle mr-3 text-gray-400 text-lg"></i>
                        <span class="font-medium">No reports found for this selection.</span>
                    </div>`;
			} else {
				// Calculate top stats
				const ranked = stats.slice().sort((a, b) => Number(b.reported) - Number(a.reported));
				const top3 = ranked.slice(0, 3).map(s => ({
					category: s.category,
					count: Number(s.reported) || 0,
					pct: totalReported > 0 ? (Number(s.reported) / totalReported) * 100 : 0
				}));

				// Generate the Natural Language Sentence
				const parts = top3.map(t => `<span class="font-bold text-gray-900">${t.category}</span> (${t.count})`);
				let topDesc = '';
				if (parts.length === 1) topDesc = `${parts[0]} is the only reported issue type.`;
				else if (parts.length === 2) topDesc = `${parts[0]} and ${parts[1]} are the top concerns.`;
				else topDesc = `${parts[0]}, ${parts[1]}, and ${parts[2]} are the most frequent issues.`;

				// Identify Ties for the Progress Bar
				const highestCount = top3.length > 0 ? top3[0].count : 0;
				const leaders = top3.filter(t => t.count === highestCount);

				// Render the Insight Card
				summaryEl.innerHTML = `
                <div class="bg-white border border-gray-200 shadow-sm rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center">
                    
                    <div class="hidden md:flex flex-col items-center justify-center w-24 border-r border-gray-100 pr-6">
                        <div class="w-12 h-12 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center mb-2 shadow-sm border border-yellow-100">
                            <i class="fas fa-lightbulb text-xl"></i>
                        </div>
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Insight</span>
                    </div>

                    <div class="flex-1 w-full">
                        <h4 class="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                            <i class="fas fa-lightbulb text-yellow-500 md:hidden"></i> Data Summary
                        </h4>
                        <p class="text-gray-600 leading-relaxed text-sm md:text-base">
                            A total of <span class="font-bold text-gray-900 text-lg">${totalReported}</span> reports have been filed, with the most recent activity on <span class="font-medium text-gray-800">${latestText}</span>. 
                            Based on current data, ${topDesc}
                        </p>
                        
                        <div class="mt-4 space-y-3">
                            ${leaders.map(leader => `
                                <div>
                                    <div class="w-full bg-gray-100 rounded-full h-2">
                                        <div class="bg-yellow-500 h-2 rounded-full shadow-sm" style="width: ${leader.pct}%"></div>
                                    </div>
                                    <div class="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>${leaders.length > 1 ? 'Co-leading Issue:' : 'Primary Issue:'} <span class="font-semibold text-gray-600">${leader.category}</span></span>
                                        <span>${leader.pct.toFixed(1)}%</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                    </div>

                </div>`;
			}
		} catch (e) {
			console.error(e);
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

/**
 * Populate year filter dropdown
 */
export function populateYearFilter(data) {
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

/**
 * Apply year and month filters to reports
 */
export function filterReports(allReportsData, year, month) {
	let filtered = allReportsData;

	if (year !== 'all') {
		filtered = filtered.filter(r => {
			const rYear = new Date(r.date).getFullYear().toString();
			return rYear === year;
		});
	}

	if (month !== 'all') {
		filtered = filtered.filter(r => {
			const rMonth = String(new Date(r.date).getMonth() + 1);
			return rMonth === month;
		});
	}

	return filtered;
}

/**
 * Create a report renderer function (returns a function that renders based on allReportsData)
 */
export function createChartRenderer(allReportsData) {
	return function renderCharts(reports) {
		const stats = computeStats(reports);
		renderFromStats(stats, reports);
	};
}
