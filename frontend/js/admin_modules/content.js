// =======================
// CONTENT MANAGEMENT (Announcements & News)
// =======================
const announcementList = document.getElementById('announcementList');
const newsList = document.getElementById('newsList');

// Tab Logic
const tabAnn = document.getElementById('tabAnnouncements');
const tabNews = document.getElementById('tabNews');
const panelAnn = document.getElementById('panelAnnouncements');
const panelNews = document.getElementById('panelNews');

if (tabAnn && tabNews) {
    tabAnn.addEventListener('click', () => {
        tabAnn.classList.add('active-tab');
        tabNews.classList.remove('active-tab');
        panelAnn.classList.remove('hidden');
        panelNews.classList.add('hidden');
    });
    tabNews.addEventListener('click', () => {
        tabNews.classList.add('active-tab');
        tabAnn.classList.remove('active-tab');
        panelNews.classList.remove('hidden');
        panelAnn.classList.add('hidden');
    });
}

// =======================
// CONTENT MANAGEMENT (Announcements & News)
// =======================

// Form Elements
const addAnnouncementBtn = document.getElementById('addAnnouncementBtn');
const announcementModal = document.getElementById('announcementModal');
const closeAnnModal = document.getElementById('closeAnnModal');
const uploadAnnouncementBtn = document.getElementById('uploadAnnouncementBtn');
const cancelAnnouncementBtn = document.getElementById('cancelAnnouncementBtn');
const announcementTitle = document.getElementById('announcementTitle');
const announcementDescription = document.getElementById('announcementDescription');
const annModalTitle = document.getElementById('annModalTitle');

const addNewsBtn = document.getElementById('addNewsBtn');
const newsModal = document.getElementById('newsModal');
const closeNewsModal = document.getElementById('closeNewsModal');
const uploadNewsBtn = document.getElementById('uploadNewsBtn');
const cancelNewsBtn = document.getElementById('cancelNewsBtn');
const newsTitle = document.getElementById('newsTitle');
const newsDescription = document.getElementById('newsDescription');
const newsLink = document.getElementById('newsLink');
const newsImage = document.getElementById('newsImage');
const newsModalTitle = document.getElementById('newsModalTitle');

let editingAnnCardId = null;
let editingNewsId = null;

// --- Load Content ---
async function loadContentManagement() {
    try {
        const [newsRes, annRes] = await Promise.all([
            fetch('/api/news'),
            fetch('/api/announcements')
        ]);
        const newsData = await newsRes.json();
        const annData = await annRes.json();

        if (annData.success) renderAnnouncementList(annData.announcements);
        if (newsData.success) renderNewsList(newsData.news);

    } catch (error) {
        console.error('Error loading content:', error);
    }
}

// --- Render Announcements (List View) ---
function renderAnnouncementList(items) {
    if (!announcementList) return;
    announcementList.innerHTML = '';

    if (items.length === 0) {
        announcementList.innerHTML = '<p class="text-center text-gray-500 py-10">No announcements yet.</p>';
        return;
    }

    items.forEach(item => {
        const el = document.createElement('div');
        el.className = "bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition"; 

        el.innerHTML = `
        <div class="flex justify-between items-start **mb-1**"> 
            <h4 class="font-bold text-green-900 text-lg">${item.title}</h4>
            
            <div class="flex gap-2 ml-4 flex-shrink-0">
                <button class="edit-ann bg-gray-100 hover:bg-green-100 text-green-700 px-3 py-1 rounded transition text-sm font-medium">Edit</button>
                <button class="delete-ann bg-gray-100 hover:bg-red-100 text-red-600 px-3 py-1 rounded transition text-sm font-medium">Delete</button>
            </div>
        </div>
        
        <p class="text-xs text-gray-400 **mb-1**">${item.date}</p>
        <p class="text-sm text-gray-600 line-clamp-2">${item.description}</p>
    `;

        el.querySelector('.edit-ann').addEventListener('click', () => {
            editingAnnCardId = item.id;
            announcementTitle.value = item.title;
            announcementDescription.value = item.description;
            toggleAnnModal(true);
            annModalTitle.textContent = "Edit Announcement";
            uploadAnnouncementBtn.textContent = "Save Changes";
        });

        el.querySelector('.delete-ann').addEventListener('click', () => deleteItem(item.id, 'announcement'));
        announcementList.appendChild(el);
    });
}

// --- Render News (List View with Anchors) ---
function renderNewsList(items) {
    if (!newsList) return;
    newsList.innerHTML = '';

    if (items.length === 0) {
        newsList.innerHTML = '<p class="text-center text-gray-500 py-10">No news articles yet.</p>';
        return;
    }

    items.forEach(item => {
        const el = document.createElement('div');
        el.className = "bg-white p-4 rounded-lg border border-gray-200 flex gap-4 hover:shadow-md transition";
        
        el.innerHTML = `
            <img src="${item.imageUrl}" class="w-20 h-20 object-cover rounded-md bg-gray-100 flex-shrink-0">
            <div class="flex-grow">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold text-emerald-900 text-lg leading-tight">
                            <a href="${item.linkUrl || '#'}" target="_blank" class="hover:underline hover:text-emerald-700 transition flex items-center gap-2">
                                ${item.title}
                                ${item.linkUrl ? '<i class="fas fa-external-link-alt text-xs text-gray-400"></i>' : ''}
                            </a>
                        </h4>
                        <p class="text-xs text-gray-400 mb-1 mt-1">${item.date}</p>
                    </div>
                    <div class="flex gap-2 ml-2 flex-shrink-0">
                        <button class="edit-news bg-gray-100 hover:bg-emerald-100 text-emerald-700 px-3 py-1 rounded transition text-sm font-medium">Edit</button>
                        <button class="delete-news bg-gray-100 hover:bg-red-100 text-red-600 px-3 py-1 rounded transition text-sm font-medium">Delete</button>
                    </div>
                </div>
                <p class="text-sm text-gray-600 line-clamp-2 mt-1">${item.description}</p>
            </div>
        `;

        el.querySelector('.edit-news').addEventListener('click', () => {
            editingNewsId = item.id;
            newsTitle.value = item.title;
            newsDescription.value = item.description;
            newsImage.value = item.imageUrl;
            newsLink.value = item.linkUrl;
            toggleNewsModal(true);
            newsModalTitle.textContent = "Edit News Article";
            uploadNewsBtn.textContent = "Save Changes";
        });

        el.querySelector('.delete-news').addEventListener('click', () => deleteItem(item.id, 'news'));
        newsList.appendChild(el);
    });
}

// --- Shared Delete Function ---
async function deleteItem(id, type) {
    const endpoint = type === 'news' ? `/api/news/${id}` : `/api/announcements/${id}`;
    if (confirm(`Delete this ${type}? This cannot be undone.`)) {
        try {
            const response = await fetchWithAuth(endpoint, { method: 'DELETE' });
            if (!response) return; // Token expired
            const result = await response.json();
            if (result.success) {
                loadContentManagement();
                if (typeof refreshAuditLog === 'function') refreshAuditLog();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (err) {
            alert('Network error.');
        }
    }
}

// --- Modal Handlers ---
const toggleAnnModal = (show) => {
    if (announcementModal) announcementModal.classList.toggle('hidden', !show);
};
const toggleNewsModal = (show) => {
    if (newsModal) newsModal.classList.toggle('hidden', !show);
};

// Announcement Buttons
if (addAnnouncementBtn) {
    addAnnouncementBtn.addEventListener('click', () => {
        toggleAnnModal(true);
        annModalTitle.textContent = "New Announcement";
        uploadAnnouncementBtn.textContent = "Publish Post";
        announcementTitle.value = '';
        announcementDescription.value = '';
        editingAnnCardId = null;
    });
}
if (cancelAnnouncementBtn) cancelAnnouncementBtn.addEventListener('click', () => toggleAnnModal(false));
if (closeAnnModal) closeAnnModal.addEventListener('click', () => toggleAnnModal(false));

if (uploadAnnouncementBtn) {
    uploadAnnouncementBtn.addEventListener('click', async () => {
        const title = announcementTitle.value.trim();
        const description = announcementDescription.value.trim();
        if (!title || !description) return alert('Please enter both title and description.');

        const method = editingAnnCardId ? 'PATCH' : 'POST';
        const url = editingAnnCardId ? `/api/announcements/${editingAnnCardId}` : '/api/announcements';

        try {
            const response = await fetchWithAuth(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description })
            });
            if (!response) return; // Token expired
            const result = await response.json();
            if (result.success) {
                toggleAnnModal(false);
                loadContentManagement();
                if (typeof refreshAuditLog === 'function') refreshAuditLog();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (e) { alert('Network error'); }
    });
}

// News Buttons
if (addNewsBtn) {
    addNewsBtn.addEventListener('click', () => {
        toggleNewsModal(true);
        newsModalTitle.textContent = "New News Article";
        uploadNewsBtn.textContent = "Publish News";
        newsTitle.value = '';
        newsDescription.value = '';
        newsImage.value = '';
        newsLink.value = '';
        editingNewsId = null;
    });
}
if (cancelNewsBtn) cancelNewsBtn.addEventListener('click', () => toggleNewsModal(false));
if (closeNewsModal) closeNewsModal.addEventListener('click', () => toggleNewsModal(false));

if (uploadNewsBtn) {
    uploadNewsBtn.addEventListener('click', async () => {
        const title = newsTitle.value.trim();
        const description = newsDescription.value.trim();
        const image = newsImage.value.trim();
        const link = newsLink.value.trim();
        if (!title || !description || !image) return alert('Please fill required fields.');

        const method = editingNewsId ? 'PATCH' : 'POST';
        const url = editingNewsId ? `/api/news/${editingNewsId}` : '/api/news';

        try {
            const response = await fetchWithAuth(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, image, link })
            });
            if (!response) return; // Token expired
            const result = await response.json();
            if (result.success) {
                toggleNewsModal(false);
                loadContentManagement();
                if (typeof refreshAuditLog === 'function') refreshAuditLog();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (e) { alert('Network error'); }
    });
}