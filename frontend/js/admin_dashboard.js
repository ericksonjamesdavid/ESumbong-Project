// =======================
// GLOBAL VARIABLES
// =======================
let mapInstance = null; 
let allReports = [];
let filteredReports = [];
let allSuggestions = [];
let currentSuggestionId = null;

// Audit Log Data placeholder (will be filled by API)
let auditLogData = []; 
let filteredAuditLogs = [];

// =======================
// SIDEBAR
// =======================
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const icon = sidebarToggle ? sidebarToggle.querySelector('i') : null;

if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        sidebar.classList.toggle('-translate-x-full');
        icon.classList.add('fa-bars');
    });
}

function showSection(sectionId) {
    const sections = ['sectionAnnouncements', 'sectionCharts', 'sectionReports', 'sectionAuditLog', 'sectionSuggestions'];
    const buttons = {
        sectionAnnouncements: document.getElementById('btnAnnouncements'),
        sectionCharts: document.getElementById('btnCharts'),
        sectionReports: document.getElementById('btnReports'),
        sectionAuditLog: document.getElementById('btnAuditLog'),
        sectionSuggestions: document.getElementById('btnSuggestions')
    };

    sections.forEach(sec => {
        const el = document.getElementById(sec);
        if (el) el.style.display = (sec === sectionId) ? 'block' : 'none';
    });

    Object.entries(buttons).forEach(([id, btn]) => {
        if (!btn) return;
        if (id === sectionId) {
            btn.classList.add('bg-green-900', 'cursor-not-allowed', 'opacity-70');
            btn.disabled = true;
        } else {
            btn.classList.remove('bg-green-900', 'cursor-not-allowed', 'opacity-70');
            btn.disabled = false;
        }
    });

    if (sidebar) {
        sidebar.classList.add('-translate-x-full');
        if (icon) {
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-xmark');
        }
    }
}

const hideSidebar = document.getElementById('hideSidebar');
if (hideSidebar && sidebar) {
    hideSidebar.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        if (icon) icon.classList.add('fa-bars');
    });
}

document.addEventListener('click', (event) => {
    if (sidebar && sidebarToggle) {
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnToggle = sidebarToggle.contains(event.target);

        if (!isClickInsideSidebar && !isClickOnToggle) {
            sidebar.classList.add('-translate-x-full');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-xmark');
            }
        }
    }
});


// =======================
// NEWS CAROUSEL LOGIC
// =======================
const carousel = document.getElementById('newsCarousel');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');

if (carousel) {
    const totalSlides = carousel.children.length;
    const visibleSlides = 3;
    let index = 0;

    const updateCarousel = () => {
        carousel.style.transform = `translateX(-${index * (100 / visibleSlides)}%)`;
    };

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (index < totalSlides - visibleSlides) index++;
            else index = 0;
            updateCarousel();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (index > 0) index--;
            else index = totalSlides - visibleSlides;
            updateCarousel();
        });
    }

    setInterval(() => {
        if (index < totalSlides - visibleSlides) index++;
        else index = 0;
        updateCarousel();
    }, 10000);
}


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
        if (window.myBarChart) {
            window.myBarChart.destroy();
        }
        window.myBarChart = new Chart(barChartEl, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [
                    {
                        label: 'Reported Issues',
                        data: reported,
                        backgroundColor: 'red',
                        borderRadius: 4
                    },
                    {
                        label: 'Solved Reports',
                        data: solved,
                        backgroundColor: 'green',
                        borderRadius: 4
                    }
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
        if (window.myPieChart) {
            window.myPieChart.destroy();
        }
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
            if (data.stats.length > 0) {
                initDashboardCharts(data.stats);
            }
        } else {
            console.error('Failed to load dashboard stats:', data.message);
        }
    } catch (error) {
        console.error('Network error fetching dashboard stats:', error);
    }
}


// =======================
// ANNOUNCEMENT SECTION
// =======================
const addAnnouncementBtn = document.getElementById('addAnnouncementBtn');
const announcementModal = document.getElementById('announcementModal'); 
const closeAnnModal = document.getElementById('closeAnnModal'); 
const uploadAnnouncementBtn = document.getElementById('uploadAnnouncementBtn');
const cancelAnnouncementBtn = document.getElementById('cancelAnnouncementBtn');
const announcementTitle = document.getElementById('announcementTitle');
const announcementDescription = document.getElementById('announcementDescription');
const announcementsGrid = document.getElementById('announcementsGrid');
const annModalTitle = document.getElementById('annModalTitle');

let editingAnnCardId = null;

const toggleAnnModal = (show) => {
    if (show) announcementModal.classList.remove('hidden');
    else announcementModal.classList.add('hidden');
};

if (addAnnouncementBtn) {
    addAnnouncementBtn.addEventListener('click', () => {
        toggleAnnModal(true);
        if (annModalTitle) annModalTitle.textContent = "New Announcement";
        if (uploadAnnouncementBtn) uploadAnnouncementBtn.textContent = "Publish Post";
        announcementTitle.value = '';
        announcementDescription.value = '';
        editingAnnCardId = null;
        announcementTitle.focus();
    });
}

if (cancelAnnouncementBtn) cancelAnnouncementBtn.addEventListener('click', () => toggleAnnModal(false));
if (closeAnnModal) closeAnnModal.addEventListener('click', () => toggleAnnModal(false));

async function fetchAnnouncements() {
    try {
        const response = await fetch('/api/announcements');
        const data = await response.json();
        if (data.success) {
            renderAnnouncements(data.announcements);
        } else {
            console.error('Failed to fetch announcements:', data.message);
        }
    } catch (err) {
        console.error('Network error fetching announcements:', err);
    }
}

function renderAnnouncements(announcements) {
    if (!announcementsGrid) return;
    announcementsGrid.innerHTML = '';

    if (announcements.length === 0) {
        announcementsGrid.innerHTML = '<p class="text-gray-500">No announcements yet.</p>';
        return;
    }

    announcements.forEach(ann => {
        const card = createAnnouncementCard(ann);
        announcementsGrid.appendChild(card);
    });
}

function createAnnouncementCard(ann) {
    const card = document.createElement('div');
    card.className = 'bg-white shadow-md rounded-xl p-6 hover:shadow-xl transition flex flex-col justify-between h-full';
    card.dataset.id = ann.id;

    card.innerHTML = `
        <h4 class="text-xl font-semibold text-green-800 mb-2">${ann.title}</h4>
        <p class="text-gray-600 mb-4 flex-grow">${ann.description}</p>
        <div class="flex justify-between items-center border-t pt-2 bg-gray-50 mt-auto">
        <p class="text-sm text-gray-500">Posted: ${ann.date}</p>
        <div class="space-x-2">
            <button class="editBtn bg-green-500 text-white px-3 py-1 rounded hover:bg-yellow-500 transition text-sm">Edit</button>
            <button class="deleteBtn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm">Delete</button>
        </div>
        </div>
    `;

    card.querySelector('.editBtn').addEventListener('click', () => {
        editingAnnCardId = ann.id;
        announcementTitle.value = ann.title;
        announcementDescription.value = ann.description;
        
        toggleAnnModal(true);
        if (annModalTitle) annModalTitle.textContent = "Edit Announcement";
        if (uploadAnnouncementBtn) uploadAnnouncementBtn.textContent = "Save Changes";
        announcementTitle.focus();
    });

    card.querySelector('.deleteBtn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this announcement?')) {
            try {
                const response = await fetch(`/api/announcements/${ann.id}`, { method: 'DELETE' });
                const result = await response.json();
                if (result.success) {
                    card.remove();
                } else {
                    alert('Error deleting: ' + result.message);
                }
            } catch (err) {
                alert('Network error deleting announcement.');
            }
        }
    });

    return card;
}

if (uploadAnnouncementBtn) {
    uploadAnnouncementBtn.addEventListener('click', async () => {
        const title = announcementTitle.value.trim();
        const description = announcementDescription.value.trim();

        if (!title || !description) {
            alert('Please enter both title and description.');
            return;
        }

        try {
            let response;
            if (editingAnnCardId) {
                response = await fetch(`/api/announcements/${editingAnnCardId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description })
                });
            } else {
                response = await fetch('/api/announcements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description })
                });
            }

            const result = await response.json();

            if (result.success) {
                toggleAnnModal(false);
                announcementTitle.value = '';
                announcementDescription.value = '';
                editingAnnCardId = null;
                fetchAnnouncements();
            } else {
                alert('Error saving announcement: ' + result.message);
            }
        } catch (err) {
            alert('Network error saving announcement.');
        }
    });
}


// =======================
// NEWS SECTION
// =======================
const addNewsBtn = document.getElementById('addNewsBtn');
const newsModal = document.getElementById('newsModal'); 
const closeNewsModal = document.getElementById('closeNewsModal');
const uploadNewsBtn = document.getElementById('uploadNewsBtn');
const cancelNewsBtn = document.getElementById('cancelNewsBtn');
const newsTitle = document.getElementById('newsTitle');
const newsDescription = document.getElementById('newsDescription');
const newsLink = document.getElementById('newsLink');
const newsImage = document.getElementById('newsImage');
const newsCarousel = document.getElementById('newsCarousel');
const newsModalTitle = document.getElementById('newsModalTitle');

let editingNewsId = null;

const toggleNewsModal = (show) => {
    if (show) newsModal.classList.remove('hidden');
    else newsModal.classList.add('hidden');
};

if (addNewsBtn) {
    addNewsBtn.addEventListener('click', () => {
        toggleNewsModal(true);
        if (newsModalTitle) newsModalTitle.textContent = "New News Article";
        if (uploadNewsBtn) uploadNewsBtn.textContent = "Publish News";
        newsTitle.value = '';
        newsDescription.value = '';
        newsImage.value = '';
        newsLink.value = '';
        editingNewsId = null;
        newsTitle.focus();
    });
}

if (cancelNewsBtn) cancelNewsBtn.addEventListener('click', () => toggleNewsModal(false));
if (closeNewsModal) closeNewsModal.addEventListener('click', () => toggleNewsModal(false));

async function fetchNews() {
    try {
        const response = await fetch('/api/news');
        const data = await response.json();
        if (data.success) {
            renderNews(data.news);
        } else {
            console.error('Failed to fetch news:', data.message);
        }
    } catch (err) {
        console.error('Network error fetching news:', err);
    }
}

function renderNews(newsItems) {
    if (!newsCarousel) return;
    newsCarousel.innerHTML = '';

    if (newsItems.length === 0) {
        newsCarousel.innerHTML = '<p class="p-4 text-gray-500">No news items yet.</p>';
        return;
    }

    newsItems.forEach(item => {
        const card = createNewsCard(item);
        newsCarousel.appendChild(card);
    });
}

function createNewsCard(item) {
    const card = document.createElement('a');
    card.href = item.linkUrl || '#';
    card.target = '_blank';
    card.className = 'flex-shrink-0 w-full md:w-1/3 p-3 newsCard';
    card.dataset.id = item.id;

    card.innerHTML = `
        <div class="bg-white shadow-md rounded-xl overflow-hidden flex flex-col h-full hover:shadow-lg transition relative">
        <img src="${item.imageUrl}" alt="${item.title}" class="w-full h-48 object-cover">
        <div class="p-5 flex flex-col flex-grow">
            <h3 class="text-lg font-semibold text-green-800 mb-2">${item.title}</h3>
            <p class="text-gray-600 text-sm mb-4 flex-grow">${item.description}</p>
        </div>
        <div class="border-t px-5 py-3 bg-gray-50 flex justify-between items-center">
            <p class="text-sm text-gray-500">Posted: ${item.date}</p>
            <div class="space-x-2">
            <button class="editNewsBtn bg-green-500 text-white px-2 py-1 rounded hover:bg-yellow-500 transition text-xs">Edit</button>
            <button class="deleteNewsBtn bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition text-xs">Delete</button>
            </div>
        </div>
        </div>
    `;

    card.querySelector('.editNewsBtn').addEventListener('click', (e) => {
        e.preventDefault();
        editingNewsId = item.id;
        newsTitle.value = item.title;
        newsDescription.value = item.description;
        newsImage.value = item.imageUrl;
        newsLink.value = item.linkUrl;

        toggleNewsModal(true);
        if (newsModalTitle) newsModalTitle.textContent = "Edit News Article";
        if (uploadNewsBtn) uploadNewsBtn.textContent = "Save Changes";
        newsTitle.focus();
    });

    card.querySelector('.deleteNewsBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to delete this news?')) {
            try {
                const response = await fetch(`/api/news/${item.id}`, { method: 'DELETE' });
                const result = await response.json();
                if (result.success) {
                    card.remove();
                } else {
                    alert('Error deleting: ' + result.message);
                }
            } catch (err) {
                alert('Network error deleting news.');
            }
        }
    });

    return card;
}

if (uploadNewsBtn) {
    uploadNewsBtn.addEventListener('click', async () => {
        const title = newsTitle.value.trim();
        const description = newsDescription.value.trim();
        const image = newsImage.value.trim();
        const link = newsLink.value.trim();

        if (!title || !description || !image) {
            alert('Please enter title, description, and image URL.');
            return;
        }

        const data = { title, description, image, link };

        try {
            let response;
            if (editingNewsId) {
                response = await fetch(`/api/news/${editingNewsId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                response = await fetch('/api/news', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }

            const result = await response.json();

            if (result.success) {
                toggleNewsModal(false);
                newsTitle.value = '';
                newsDescription.value = '';
                newsImage.value = '';
                newsLink.value = '';
                editingNewsId = null;
                fetchNews();
            } else {
                alert('Error saving news: ' + result.message);
            }
        } catch (err) {
            alert('Network error saving news.');
        }
    });
}


// =======================
// REPORTS TABLE SECTION
// =======================

const tableBody = document.getElementById("reportTableBody");

async function fetchReports() {
    try {
        const response = await fetch('/api/reports');
        const data = await response.json();

        if (data.success) {
            allReports = data.reports; 
            filteredReports = data.reports; 
            populateTable(allReports); 
        } else {
            console.error('Failed to load reports:', data.message);
        }
    } catch (error) {
        console.error('Network error fetching reports:', error);
    }
}

function populateTable(data) {
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const downloadBtn = document.getElementById("downloadMenuBtn");

    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center p-10 text-gray-500">
                    <div class="flex flex-col items-center justify-center">
                        <i class="fa-solid fa-folder-open text-4xl mb-3 text-gray-300"></i>
                        <p class="text-lg font-semibold">No Records Found</p>
                        <p class="text-sm">Try adjusting your search or date filters.</p>
                    </div>
                </td>
            </tr>
        `;

        if (downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.classList.add("opacity-50", "cursor-not-allowed");
            downloadBtn.classList.remove("hover:bg-green-800");
        }
        return;
    }

    if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.classList.remove("opacity-50", "cursor-not-allowed");
        downloadBtn.classList.add("hover:bg-green-800");
    }

    let imageModal = document.body.querySelector("#imageModal");
    if (!imageModal) {
        imageModal = document.createElement("div");
        imageModal.id = "imageModal";
        imageModal.className = "fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center hidden z-50";
        imageModal.innerHTML = `
          <div class="relative">
            <img id="modalImage" class="max-w-full max-h-[80vh] rounded shadow-lg" />
            <button onclick="this.closest('#imageModal').classList.add('hidden')" 
                    class="absolute top-0 right-0 m-2 text-white text-2xl font-bold bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center">&times;</button>
          </div>
        `;
        imageModal.onclick = e => { if (e.target === imageModal) imageModal.classList.add("hidden"); };
        document.body.appendChild(imageModal);
    }
    const modalImage = imageModal.querySelector("#modalImage");

    data.forEach((report, i) => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50 transition";

        const imgCell = (paths) => {
            if (!paths) return "-";
            const firstPath = paths.split(',')[0];
            return `
            <img src="${firstPath}"
            title="Click to view the photo"
            class="cursor-pointer w-24 h-16 object-cover rounded shadow-sm hover:shadow-md transition"
            data-img="${firstPath}"
            />
            `;
        };

        tr.innerHTML = `
            <td class="px-4 py-2 border font-mono">${report.trackingId}</td>
            <td class="px-4 py-2 border">${report.name || "Anonymous"}</td>
            <td class="px-4 py-2 border text-center">${imgCell(report.photo)}</td>
            <td class="px-4 py-2 border">${report.category}</td>

            <td class="px-4 py-2 border text-center">
                <button class="view-desc-btn bg-green-700 text-white px-3 py-1 rounded-md hover:bg-green-800 transition">
                    View
                </button>
            </td>

            <td class="px-4 py-2 border text-center">
                <button class="view-address-btn bg-green-700 text-white px-3 py-1 rounded-md hover:bg-green-800 transition"
                        data-address="${report.address}"
                        data-lat="${report.latitude}"
                        data-lng="${report.longitude}">
                    View
                </button>
            </td>

            <td class="px-4 py-2 border text-center">${imgCell(report.areaPhoto)}</td>
            <td class="px-4 py-2 border whitespace-nowrap">${report.date}</td>
            <td class="px-4 py-2 border">
                <select class="border rounded px-2 py-1" data-id="${report.trackingId}" data-type="status">
                    <option value="Pending" ${report.status === "Pending" ? "selected" : ""}>Pending</option>
                    <option value="In Progress" ${report.status === "In Progress" ? "selected" : ""}>In Progress</option>
                    <option value="Resolved" ${report.status === "Resolved" ? "selected" : ""}>Resolved</option>
                </select>
            </td>
            <td class="px-4 py-2 border">
                <span class="w-24 inline-block text-center py-1 rounded-full font-semibold text-white 
                ${report.priority === 'Emergency' ? 'bg-red-600' :
                report.priority === 'High' ? 'bg-yellow-500' :
                    'bg-green-600'}">
                  ${report.priority}
                </span>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    tableBody.querySelectorAll("select").forEach(select => {
        if (select.value === "Resolved") {
            select.disabled = true;
            select.classList.add("opacity-60", "cursor-not-allowed");
        }

        select.addEventListener("change", async (e) => {
            const trackingId = e.target.dataset.id;
            const newStatus = e.target.value;
            const oldValue = allReports.find(r => r.trackingId === trackingId).status;

            const confirmed = confirm(`Are you sure you want to change status for ${trackingId} to "${newStatus}"?`);

            if (confirmed) {
                try {
                    const response = await fetch(`/api/reports/${trackingId}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ newStatus: newStatus })
                    });

                    const result = await response.json();

                    if (result.success) {
                        alert('Status updated successfully!');
                        if (newStatus === "Resolved") {
                            e.target.disabled = true;
                            e.target.classList.add("opacity-60", "cursor-not-allowed");
                        }
                        allReports.find(r => r.trackingId === trackingId).status = newStatus;
                    } else {
                        alert('Failed to update status: ' + result.message);
                        e.target.value = oldValue;
                    }

                } catch (error) {
                    console.error('Network error:', error);
                    alert('A network error occurred. Please try again.');
                    e.target.value = oldValue;
                }
            } else {
                e.target.value = oldValue;
            }
        });
    });

    tableBody.querySelectorAll("img[data-img]").forEach(img => img.onclick = e => { modalImage.src = e.target.dataset.img; imageModal.classList.remove("hidden"); });

    const addressModal = document.getElementById('addressModal');
    const modalAddressText = document.getElementById('modalAddressText');

    tableBody.querySelectorAll('.view-address-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const address = btn.dataset.address;
            const lat = btn.dataset.lat;
            const lng = btn.dataset.lng;

            modalAddressText.textContent = address;
            addressModal.classList.remove('hidden');

            if (!mapInstance) {
                mapInstance = L.map('modalMap').setView([lat, lng], 16);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap'
                }).addTo(mapInstance);
            } else {
                mapInstance.setView([lat, lng], 16);
            }

            mapInstance.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    mapInstance.removeLayer(layer);
                }
            });

            L.marker([lat, lng]).addTo(mapInstance);

            setTimeout(() => {
                mapInstance.invalidateSize();
            }, 100);
        });
    });

    if (document.getElementById('closeAddressModal')) {
        document.getElementById('closeAddressModal').addEventListener('click', () => {
            addressModal.classList.add('hidden');
        });
    }

    const descriptionModal = document.getElementById('descriptionModal');
    const modalDescriptionText = document.getElementById('modalDescriptionText');

    tableBody.querySelectorAll('.view-desc-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const description = data[index].description;
            modalDescriptionText.textContent = description;
            descriptionModal.classList.remove('hidden');
        });
    });

    if (document.getElementById('closeDescriptionModal')) {
        document.getElementById('closeDescriptionModal').addEventListener('click', () => {
            descriptionModal.classList.add('hidden');
        });
    }
}


// --- Search and Filter ---
const searchInput = document.getElementById("searchInput");
const dateRangeFilter = document.getElementById("dateRangeFilter");

function getLocalISOString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = dateRangeFilter.value;

    let filtered = allReports;

    if (searchTerm) {
        filtered = filtered.filter(r =>
            (r.name ? r.name.toLowerCase() : "anonymous").includes(searchTerm) ||
            r.category.toLowerCase().includes(searchTerm) ||
            r.trackingId.toLowerCase().includes(searchTerm) ||
            r.status.toLowerCase().includes(searchTerm) ||
            r.priority.toLowerCase().includes(searchTerm)
        );
    }

    if (filterValue !== "all-time") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startDate;

        if (filterValue === "today") {
            const todayString = getLocalISOString(today);
            filtered = filtered.filter(r => r.date === todayString);
        } else {
            switch (filterValue) {
                case "past-week":
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - 7);
                    break;
                case "past-month":
                    startDate = new Date(today);
                    startDate.setMonth(today.getMonth() - 1);
                    break;
                case "past-year":
                    startDate = new Date(today);
                    startDate.setFullYear(today.getFullYear() - 1);
                    break;
            }

            const startDateString = getLocalISOString(startDate);
            filtered = filtered.filter(r => r.date >= startDateString);
        }
    }

    filteredReports = filtered;
    populateTable(filteredReports);
}

if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
}
if (dateRangeFilter) {
    dateRangeFilter.addEventListener("change", applyFilters);
}


// =======================
// AUDIT LOG SECTION
// =======================

const auditLogTableBody = document.getElementById('auditLogTableBody');
const auditLogSearchInput = document.getElementById('auditLogSearchInput');
const auditDateFilter = document.getElementById('auditDateFilter');
const auditDownloadBtn = document.getElementById('auditDownloadBtn');
const auditDownloadMenu = document.getElementById('auditDownloadMenu');

if (auditDownloadBtn) {
    auditDownloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        auditDownloadMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
        if (!auditDownloadBtn.contains(e.target) && !auditDownloadMenu.contains(e.target)) {
            auditDownloadMenu.classList.add('hidden');
        }
    });
}

// Fetch Audit Logs from API
async function fetchAuditLogs() {
    try {
        const response = await fetch('/api/audit-logs');
        const data = await response.json();

        if (data.success) {
            // Format the date here
            auditLogData = data.logs.map(log => ({
                ...log,
                timestamp: new Date(log.timestamp).toLocaleString()
            }));
            
            filteredAuditLogs = auditLogData; // Initialize filter
            populateAuditLog(filteredAuditLogs);
        } else {
            console.error('Failed to load audit logs:', data.message);
        }
    } catch (error) {
        console.error('Network error fetching audit logs:', error);
    }
}

function populateAuditLog(data) {
    if (!auditLogTableBody) return;
    auditLogTableBody.innerHTML = "";

    if (data.length === 0) {
        auditLogTableBody.innerHTML = `<tr><td colspan="4" class="text-center p-4">No log entries found.</td></tr>`;
        return;
    }

    data.forEach(log => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition";
        tr.innerHTML = `
      <td class="px-4 py-2 border whitespace-nowrap">${log.timestamp}</td>
      <td class="px-4 py-2 border">${log.user}</td>
      <td class="px-4 py-2 border font-mono text-xs">${log.actionType}</td>
      <td class="px-4 py-2 border">${log.description}</td>
    `;
        auditLogTableBody.appendChild(tr);
    });
}

function applyAuditFilters() {
    const term = auditLogSearchInput.value.toLowerCase();
    const filterValue = auditDateFilter.value;

    let filtered = auditLogData;

    if (term) {
        filtered = filtered.filter(log =>
            log.user.toLowerCase().includes(term) ||
            log.actionType.toLowerCase().includes(term) ||
            log.description.toLowerCase().includes(term)
        );
    }

    if (filterValue !== "all-time") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startDate;
        const getLogDateStr = (timestamp) => {
            const date = new Date(timestamp);
            return getLocalISOString(date);
        };

        if (filterValue === "today") {
            const todayString = getLocalISOString(today);
            filtered = filtered.filter(log => getLogDateStr(log.timestamp) === todayString);
        } else {
            switch (filterValue) {
                case "past-week":
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - 7);
                    break;
                case "past-month":
                    startDate = new Date(today);
                    startDate.setMonth(today.getMonth() - 1);
                    break;
                case "past-year":
                    startDate = new Date(today);
                    startDate.setFullYear(today.getFullYear() - 1);
                    break;
            }
            const startDateString = getLocalISOString(startDate);
            filtered = filtered.filter(log => getLogDateStr(log.timestamp) >= startDateString);
        }
    }

    filteredAuditLogs = filtered;
    populateAuditLog(filteredAuditLogs);
}

if (auditLogSearchInput) auditLogSearchInput.addEventListener("input", applyAuditFilters);
if (auditDateFilter) auditDateFilter.addEventListener("change", applyAuditFilters);

// --- DOWNLOAD FUNCTIONS FOR AUDIT LOG ---
window.downloadAuditCSV = function () {
    const dateStr = getFormattedDate();
    let csv = `Audit Log - E-Sumbong Kay Kap!\nGenerated on: ${dateStr}\n\n`;
    csv += 'Timestamp,Admin User,Action Type,Description\n';

    filteredAuditLogs.forEach(log => {
        const desc = `"${log.description.replace(/"/g, '""')}"`;
        csv += `${log.timestamp},${log.user},${log.actionType},${desc}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Audit_Log_${dateStr}.csv`;
    link.click();
    auditDownloadMenu.classList.add('hidden');
};

window.downloadAuditExcel = function () {
    const dateStr = getFormattedDate();
    const wb = XLSX.utils.book_new();

    const wsData = [
        ["Audit Log - E-Sumbong Kay Kap!"],
        [`Generated on: ${dateStr}`],
        [],
        ["Timestamp", "Admin User", "Action Type", "Description"]
    ];

    filteredAuditLogs.forEach(log => {
        wsData.push([log.timestamp, log.user, log.actionType, log.description]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 50 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

    XLSX.utils.book_append_sheet(wb, ws, "Audit Log");
    XLSX.writeFile(wb, `Audit_Log_${dateStr}.xlsx`);
    auditDownloadMenu.classList.add('hidden');
};

window.downloadAuditPDF = function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dateStr = getFormattedDate();
    const systemColor = [34, 139, 34];

    if (typeof logoBase64 !== 'undefined' && logoBase64) {
        doc.addImage(logoBase64, 'PNG', 14, 12, 24, 24);
    }

    doc.setFontSize(18);
    doc.setTextColor(systemColor[0], systemColor[1], systemColor[2]);
    doc.text("Audit Log Report", 42, 20);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on: ${dateStr}`, 42, 28);

    const head = [["Timestamp", "User", "Action", "Description"]];
    const body = filteredAuditLogs.map(log => [log.timestamp, log.user, log.actionType, log.description]);

    doc.autoTable({
        head,
        body,
        startY: 40,
        headStyles: { fillColor: systemColor, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 35 }, 3: { cellWidth: 80 } }
    });

    doc.save(`Audit_Log_${dateStr}.pdf`);
    auditDownloadMenu.classList.add('hidden');
};


// =======================
// SUGGESTIONS MAILBOX
// =======================

const suggestionListEl = document.getElementById('suggestion-list');
const placeholderEl = document.getElementById('suggestion-placeholder');
const contentEl = document.getElementById('suggestion-content');
const fromEl = document.getElementById('suggestion-from');
const emailEl = document.getElementById('suggestion-email');
const dateEl = document.getElementById('suggestion-date');
const bodyEl = document.getElementById('suggestion-body');
const deleteBtn = document.getElementById('delete-suggestion-btn');

async function fetchSuggestions() {
    try {
        const response = await fetch('/api/suggestions');
        const data = await response.json();
        if (data.success) {
            allSuggestions = data.suggestions;
            renderSuggestionList();
            showSuggestionContent(null);
        } else {
            console.error('Failed to fetch suggestions:', data.message);
        }
    } catch (err) {
        console.error('Network error fetching suggestions:', err);
    }
}

function renderSuggestionList() {
    if (!suggestionListEl) return;
    suggestionListEl.innerHTML = '';

    if (allSuggestions.length === 0) {
        suggestionListEl.innerHTML = '<p class="p-4 text-gray-500">No suggestions yet.</p>';
        return;
    }

    allSuggestions.forEach(s => {
        const isRead = s.isRead === 1;
        const item = document.createElement('a');
        item.href = '#';
        item.className = `suggestion-item block p-4 border-b border-gray-200 hover:bg-green-50 ${isRead ? 'bg-gray-50' : 'bg-white'}`;
        item.dataset.id = s.id;

        item.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="${isRead ? 'font-normal text-gray-700' : 'font-bold text-green-900'}">${s.fullname || 'Anonymous'}</span>
                <span class="text-xs text-gray-500">${s.date}</span>
            </div>
            <p class="text-sm ${isRead ? 'text-gray-500' : 'text-gray-600'} truncate">${s.suggestionText}</p>
        `;

        item.addEventListener('click', (e) => {
            e.preventDefault();
            showSuggestionContent(s.id);
            if (!isRead) {
                markAsRead(s.id);
            }
        });

        suggestionListEl.appendChild(item);
    });
}

function showSuggestionContent(id) {
    if (!id) {
        placeholderEl.classList.remove('hidden');
        contentEl.classList.add('hidden');
        currentSuggestionId = null;
        return;
    }

    const suggestion = allSuggestions.find(s => s.id === id);
    if (!suggestion) return;

    currentSuggestionId = id;

    fromEl.textContent = suggestion.fullname || 'Anonymous';
    emailEl.textContent = suggestion.email || 'N/A';
    dateEl.textContent = suggestion.date;
    bodyEl.textContent = suggestion.suggestionText;

    placeholderEl.classList.add('hidden');
    contentEl.classList.remove('hidden');
}

async function markAsRead(id) {
    try {
        await fetch(`/api/suggestions/${id}/read`, { method: 'PATCH' });
        const suggestion = allSuggestions.find(s => s.id === id);
        suggestion.isRead = 1;
        renderSuggestionList();
    } catch (err) {
        console.error('Error marking as read:', err);
    }
}

if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
        if (!currentSuggestionId) return;

        if (confirm('Are you sure you want to delete this suggestion?')) {
            try {
                const response = await fetch(`/api/suggestions/${currentSuggestionId}`, { method: 'DELETE' });
                const result = await response.json();

                if (result.success) {
                    alert('Suggestion deleted.');
                    fetchSuggestions();
                } else {
                    alert('Error deleting: ' + result.message);
                }
            } catch (err) {
                alert('Network error deleting suggestion.');
            }
        }
    });
}

// =======================
// INITIALIZATION
// =======================
document.addEventListener("DOMContentLoaded", () => {
    fetchReports();
    fetchDashboardStats();

    fetchAnnouncements();
    fetchNews();

    fetchSuggestions();

    // Replaced populateAuditLog() with fetchAuditLogs() to use real data
    fetchAuditLogs(); 

    const defaultSection = localStorage.getItem("defaultSection");
    if (defaultSection && document.getElementById(defaultSection)) {
        showSection(defaultSection);
    } else {
        showSection('sectionAnnouncements');
    }
});