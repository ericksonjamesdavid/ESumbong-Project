
// =======================
// DASHBOARD CHARTS MODULE (User-facing)
// Fetches reports and computes stats client-side so year/month filters work
// =======================

export const initDashboardCharts = async () => {
	// Load all reports (used to compute filtered stats)
	let reports = [];
	try {
		const r = await fetch('/api/reports');
		const json = await r.json();
		if (json && json.success && Array.isArray(json.reports)) reports = json.reports;
	} catch (err) {
		console.error('Error fetching reports for user charts:', err);
	}

	// Canonical order and color palette
	const canonicalOrder = ['Garbage', 'Street Lighting', 'Road Repair', 'Water', 'Other'];
	const palette = ['#72C93B', '#28A745', '#F2C94C', '#3498DB', '#A0522D', '#FF5733', '#C70039'];

	// Elements
	const filterYearEl = document.getElementById('filterYear');
	const filterMonthEl = document.getElementById('filterMonth');
	const legendList = document.getElementById('legendList');

	// Populate year selector from report dates, but DO NOT replace existing markup.
	const years = Array.from(new Set(reports.map(r => r.date ? r.date.split('-')[0] : null).filter(Boolean))).sort((a,b) => b - a);
	if (filterYearEl) {
		// Build set of existing option values to avoid duplicates
		const existing = new Set(Array.from(filterYearEl.options).map(o => o.value));
		// If there is no 'all' option, add it at the top
		if (!existing.has('all')) {
			const opt = document.createElement('option');
			opt.value = 'all';
			opt.textContent = 'All';
			filterYearEl.insertBefore(opt, filterYearEl.firstChild);
			existing.add('all');
		}
		// Add any year options that are missing without removing existing ones
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

	// Do not overwrite existing month layout. If there are no month options, initialize defaults.
	if (filterMonthEl && filterMonthEl.options.length === 0) {
		const monthNames = ["All","January","February","March","April","May","June","July","August","September","October","November","December"];
		monthNames.forEach((m, i) => {
			const opt = document.createElement('option');
			opt.value = i === 0 ? 'all' : String(i);
			opt.textContent = m;
			filterMonthEl.appendChild(opt);
		});
	}

	function computeStats(selectedYear = 'all', selectedMonth = 'all') {
		const grouped = {};
		reports.forEach(rep => {
			if (!rep.date) return;
			const [yr, mo] = rep.date.split('-');
			if (selectedYear !== 'all' && String(yr) !== String(selectedYear)) return;
			if (selectedMonth !== 'all' && String(mo) !== String(selectedMonth)) return;

			// Normalize category and group custom/unknown values into 'Other'
			let catRaw = (rep.category || '').toString().trim();
			const catLc = catRaw.toLowerCase();
			// Define the canonical categories that should appear individually in charts
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
		// Return empty array if no data (will be handled in renderFromStats)
		if (processed.length === 0) return [];
		// Ensure consistent canonical ordering across admin and user charts
		// Sort processed according to canonical order, unknown categories go to end
		processed.sort((a, b) => {
			const ai = canonicalOrder.indexOf(a.category);
			const bi = canonicalOrder.indexOf(b.category);
			const aidx = ai === -1 ? canonicalOrder.length : ai;
			const bidx = bi === -1 ? canonicalOrder.length : bi;
			return aidx - bidx;
		});
		return processed;
	}

	function renderFromStats(stats) {
		const chartsGrid = document.getElementById('chartsGrid');
		const chartsMessage = document.getElementById('chartsMessage');

		// CHECK: Is the data empty?
		if (stats.length === 0) {
			// HIDE Charts, SHOW Message
			if (chartsGrid) chartsGrid.classList.add('hidden');
			if (chartsMessage) chartsMessage.classList.remove('hidden');

			// Reset stats to 0 explicitly
			const reportedTotalEl = document.getElementById('reportedTotal');
			const solvedTotalEl = document.getElementById('solvedTotal');
			const resolvedPercentEl = document.getElementById('resolvedPercent');
			if (reportedTotalEl) reportedTotalEl.textContent = '0';
			if (solvedTotalEl) solvedTotalEl.textContent = '0';
			if (resolvedPercentEl) resolvedPercentEl.textContent = '0%';
			return;
		}

		// ELSE: SHOW Charts, HIDE Message
		if (chartsGrid) chartsGrid.classList.remove('hidden');
		if (chartsMessage) chartsMessage.classList.add('hidden');

		const categories = stats.map(s => s.category);
		const reported = stats.map(s => Number(s.reported || 0));
		const solved = stats.map(s => Number(s.solved || 0));

		// Map category to color consistently using canonicalOrder and palette
		const colorMap = {};
		canonicalOrder.forEach((c, i) => { colorMap[c] = palette[i % palette.length]; });
		const chartColors = categories.map(cat => colorMap[cat] || palette[palette.length - 1]);

		const totalReported = reported.reduce((a,b) => a+b, 0);
		const totalSolved = solved.reduce((a,b) => a+b, 0);

		const reportedTotalEl = document.getElementById('reportedTotal');
		const solvedTotalEl = document.getElementById('solvedTotal');
		const resolvedPercentEl = document.getElementById('resolvedPercent');

		if (reportedTotalEl) reportedTotalEl.textContent = totalReported;
		if (solvedTotalEl) solvedTotalEl.textContent = totalSolved;
		if (resolvedPercentEl) resolvedPercentEl.textContent = (totalReported > 0 ? ((totalSolved / totalReported) * 100).toFixed(1) : 0) + '%';

		// Bar chart
		const barChartEl = document.getElementById('barChart');
		if (barChartEl) {
			if (window.userBarChart) window.userBarChart.destroy();
			window.userBarChart = new Chart(barChartEl, {
				type: 'bar',
				data: {
					labels: categories,
					datasets: [
						{ label: 'Reported Issues', data: reported, backgroundColor: '#C70039', borderRadius: 4 },
						{ label: 'Solved Reports', data: solved, backgroundColor: '#28A745', borderRadius: 4 }
					]
				},
				options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { stepSize: 10 } } }, plugins: { legend: { position: 'top' } } }
			});
		}

		// Pie chart
		const pieChartEl = document.getElementById('pieChart');
		if (pieChartEl) {
			if (window.userPieChart) window.userPieChart.destroy();
			window.userPieChart = new Chart(pieChartEl, {
				type: 'pie',
				data: { labels: categories, datasets: [{ data: reported, backgroundColor: chartColors }] },
				options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (context) { const label = context.label || ''; const value = context.raw; let percentage = '0%'; if (totalReported > 0) { percentage = ((value / totalReported) * 100).toFixed(1) + '%'; } return `${label}: ${value} (${percentage})`; } } } } }
			});
		}

		// Populate the static legend list to match admin layout
		if (legendList) {
			legendList.innerHTML = '';
			legendList.style.display = '';
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

	// Initial render with all data
	renderFromStats(computeStats('all', 'all'));

	// Wire up filters
	function applyFilter() {
		const selectedYear = filterYearEl ? filterYearEl.value : 'all';
		const selectedMonth = filterMonthEl ? filterMonthEl.value : 'all';
		renderFromStats(computeStats(selectedYear, selectedMonth));
	}

	if (filterYearEl) filterYearEl.addEventListener('change', applyFilter);
	if (filterMonthEl) filterMonthEl.addEventListener('change', applyFilter);

	// Clear filters button handler
	const clearFiltersBtn = document.getElementById('clearFiltersBtn');
	if (clearFiltersBtn) {
		clearFiltersBtn.addEventListener('click', () => {
			if (filterYearEl) filterYearEl.value = 'all';
			if (filterMonthEl) filterMonthEl.value = 'all';
			applyFilter();
		});
	}
};

// Expose a global helper so other modules can request a refresh after submissions
if (typeof window !== 'undefined') {
	window.refreshUserCharts = initDashboardCharts;
}

