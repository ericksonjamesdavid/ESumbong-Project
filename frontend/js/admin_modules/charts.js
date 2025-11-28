// =======================
// CHART SECTION
// =======================
function initDashboardCharts(stats) {
    const categories = stats.map(s => s.category);
    const reported = stats.map(s => s.reported);
    const solved = stats.map(s => s.solved);

    const colors = ['#72C93B', '#28A745', '#F2C94C', '#3498DB', '#A0522D', '#FF5733', '#C70039'];
    const chartColors = categories.map((_, i) => colors[i % colors.length]);

    const totalReported = reported.reduce((a, b) => a + b, 0);
    const totalSolved = solved.reduce((a, b) => Number(a) + Number(b), 0);

    if (document.getElementById('reportedTotal')) document.getElementById('reportedTotal').textContent = totalReported;
    if (document.getElementById('solvedTotal')) document.getElementById('solvedTotal').textContent = totalSolved;

    const resolvedPercent = totalReported > 0 ? ((totalSolved / totalReported) * 100).toFixed(1) : 0;
    if (document.getElementById('resolvedPercent')) document.getElementById('resolvedPercent').textContent = resolvedPercent + '%';

    // Bar Chart
    const barChartEl = document.getElementById('barChart');
    if (barChartEl) {
        if (window.myBarChart) window.myBarChart.destroy();
        window.myBarChart = new Chart(barChartEl, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [
                    { label: 'Reported Issues', data: reported, backgroundColor: 'red', borderRadius: 4 },
                    { label: 'Solved Reports', data: solved, backgroundColor: 'green', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 10 } } },
                plugins: { legend: { position: 'top' } }
            }
        });
    }

    // Pie Chart
    const pieChartEl = document.getElementById('pieChart');
    if (pieChartEl) {
        if (window.myPieChart) window.myPieChart.destroy();
        window.myPieChart = new Chart(pieChartEl, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{ data: reported, backgroundColor: chartColors }]
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
                                let percentage = '0%';
                                if (totalReported > 0) {
                                    percentage = ((value / totalReported) * 100).toFixed(1) + '%';
                                }
                                return `${label}: ${value} (${percentage})`;
                            }
                        }
                    }
                }
            }
        });
    }

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

async function fetchDashboardStats() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        if (data.success && data.stats) {
            initDashboardCharts(data.stats);
        } else {
            console.error('Failed to load dashboard stats:', data.message);
        }
    } catch (error) {
        console.error('Network error fetching dashboard stats:', error);
    }
}
