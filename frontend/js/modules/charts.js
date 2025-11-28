// =======================
// DASHBOARD CHARTS MODULE
// =======================

export const initDashboardCharts = () => {
    // Sample data
    const reportStats = {
        categories: ['Garbage', 'Road repair', 'Street Light', 'Water Drainage', 'Other'],
        reported: [50, 90, 40, 60, 50],
        solved: [45, 85, 35, 55, 40],
        colors: ['#72C93B', '#28A745', '#F2C94C', '#3498DB', '#A0522D']
    };

    // Update totals
    const reportedTotalEl = document.getElementById('reportedTotal');
    if (!reportedTotalEl) return;

    const totalReported = reportStats.reported.reduce((a, b) => a + b, 0);
    const totalSolved = reportStats.solved.reduce((a, b) => a + b, 0);

    document.getElementById('reportedTotal').textContent = totalReported;
    document.getElementById('solvedTotal').textContent = totalSolved;

    const resolvedPercent = totalReported > 0 ? ((totalSolved / totalReported) * 100).toFixed(1) : 0;
    document.getElementById('resolvedPercent').textContent = resolvedPercent + '%';

    // Bar Chart
    new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: reportStats.categories,
            datasets: [
                {
                    label: 'Reported Issues',
                    data: reportStats.reported,
                    backgroundColor: 'red',
                    borderRadius: 4
                },
                {
                    label: 'Solved Reports',
                    data: reportStats.solved,
                    backgroundColor: 'green',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 10 } },
                x: { stacked: false }
            },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${context.raw}%`
                    }
                }
            }
        }
    });

    // Pie Chart
    new Chart(document.getElementById('pieChart'), {
        type: 'pie',
        data: {
            labels: reportStats.categories,
            datasets: [{
                data: reportStats.reported,
                backgroundColor: reportStats.colors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${context.raw}%`
                    }
                }
            }
        }
    });

    // Pie chart legend
    const legendList = document.getElementById('legendList');
    if (legendList) {
        reportStats.categories.forEach((label, i) => {
            const li = document.createElement('li');
            li.className = 'flex items-center gap-2';
            li.innerHTML = `
                <span style="background:${reportStats.colors[i]};width:14px;height:14px;border-radius:4px;"></span>
                <span class="text-sm text-gray-700">${label}</span>
            `;
            legendList.appendChild(li);
        });
    }
};
