// =======================
// CONTENT MANAGEMENT (Announcements & News)
// =======================

// Helper: Shorthand for document.getElementById
const getEl = (id) => document.getElementById(id);

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

        initCounters(); 

    } catch (error) { console.error('Error loading content:', error); }
}

// --- Generic Render Helper ---
function renderList(items, containerId, emptyMsg, createCardFn) {
    const container = getEl(containerId);
    if (!container) return;
    container.innerHTML = '';
    if (items.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-10">${emptyMsg}</p>`;
        return;
    }
    items.forEach(item => container.appendChild(createCardFn(item)));
}

// --- Render Announcements ---
function renderAnnouncementList(items) {
    renderList(items, 'announcementList', 'No announcements yet.', (item) => {
        const el = document.createElement('div');
        el.className = "bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition";
        el.innerHTML = `
            <div class="flex justify-between items-start mb-1"> 
                <h4 class="font-bold text-green-900 text-lg">${item.title}</h4>
                    <div class="flex gap-2 ml-4 flex-shrink-0">
                    <button class="edit-btn bg-gray-100 hover:bg-green-100 text-green-700 px-3 py-1 rounded transition text-sm font-medium">Edit</button>
                    <button class="delete-btn bg-gray-100 hover:bg-amber-100 text-amber-600 px-3 py-1 rounded transition text-sm font-medium">Archive</button>
                </div>
            </div>
            <p class="text-xs text-gray-400 mb-1">${item.date}</p>
            <p class="text-sm text-gray-600 line-clamp-2">${item.description}</p>
        `;

        // Edit Action
        el.querySelector('.edit-btn').addEventListener('click', () => {
            openModal('announcementModal', 'Edit Announcement', item.id);
            getEl('announcementTitle').value = item.title;
            getEl('announcementDescription').value = item.description;
            forceUpdateCounters(['announcementTitle', 'announcementDescription']);
        });

        // Archive Action (changed from Delete)
        el.querySelector('.delete-btn').addEventListener('click', () => archiveItem(item.id, 'announcements'));
        return el;
    });
}

// --- Render News ---
function renderNewsList(items) {
    renderList(items, 'newsList', 'No news articles yet.', (item) => {
        const el = document.createElement('div');
        el.className = "bg-white p-4 rounded-lg border border-gray-200 flex gap-4 hover:shadow-md transition";
        el.innerHTML = `
            <img src="${item.imageUrl}" class="w-20 h-20 object-cover rounded-md bg-gray-100 flex-shrink-0">
            <div class="flex-grow">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold text-emerald-900 text-lg leading-tight">
                            <a href="${item.linkUrl || '#'}" target="_blank" class="hover:underline hover:text-emerald-700 transition flex items-center gap-2">
                                ${item.title} ${item.linkUrl ? '<i class="fas fa-external-link-alt text-xs text-gray-400"></i>' : ''}
                            </a>
                        </h4>
                        <p class="text-xs text-gray-400 mb-1 mt-1">${item.date}</p>
                    </div>
                    <div class="flex gap-2 ml-2 flex-shrink-0">
                        <button class="edit-btn bg-gray-100 hover:bg-emerald-100 text-emerald-700 px-3 py-1 rounded transition text-sm font-medium">Edit</button>
                        <button class="delete-btn bg-gray-100 hover:bg-amber-100 text-amber-600 px-3 py-1 rounded transition text-sm font-medium">Archive</button>
                    </div>
                </div>
                <p class="text-sm text-gray-600 line-clamp-2 mt-1">${item.description}</p>
            </div>
        `;

        el.querySelector('.edit-btn').addEventListener('click', () => {
            openModal('newsModal', 'Edit News Article', item.id);
            getEl('newsTitle').value = item.title;
            getEl('newsDescription').value = item.description;
            getEl('newsImage').value = item.imageUrl;
            getEl('newsLink').value = item.linkUrl;
            forceUpdateCounters(['newsTitle', 'newsDescription']);
        });

        el.querySelector('.delete-btn').addEventListener('click', () => archiveItem(item.id, 'news'));
        return el;
    });
}

// --- Load Archived Content ---
async function loadArchivedContent() {
    try {
        const [newsRes, annRes] = await Promise.all([
            fetch('/api/news?archived=true'),
            fetch('/api/announcements?archived=true')
        ]);
        const newsData = await newsRes.json();
        const annData = await annRes.json();

        if (annData.success) renderArchivedAnnouncements(annData.announcements);
        if (newsData.success) renderArchivedNews(newsData.news);

    } catch (error) { console.error('Error loading archived content:', error); }
}

// --- Render Archived Announcements ---
function renderArchivedAnnouncements(items) {
    const container = getEl('archivedAnnList');
    if (!container) return;
    container.innerHTML = '';
    if (items.length === 0) {
        container.innerHTML = `<p class="text-gray-400 text-sm italic">No archived announcements.</p>`;
        return;
    }
    items.forEach(item => container.appendChild(renderArchiveCard(item, 'announcements')));
}

// --- Render Archived News ---
function renderArchivedNews(items) {
    const container = getEl('archivedNewsList');
    if (!container) return;
    container.innerHTML = '';
    if (items.length === 0) {
        container.innerHTML = `<p class="text-gray-400 text-sm italic">No archived news articles.</p>`;
        return;
    }
    items.forEach(item => container.appendChild(renderArchiveCard(item, 'news')));
}

// --- Render Archive Card ---
function renderArchiveCard(item, type) {
    const el = document.createElement('div');
    el.className = "bg-white p-4 rounded-lg border border-gray-200 opacity-75 hover:opacity-100 transition hover:shadow-sm";
    
    el.innerHTML = `
        <div class="flex items-start gap-4">
            ${type === 'news' && item.imageUrl ? 
                `<img src="${item.imageUrl}" class="w-12 h-12 rounded object-cover grayscale opacity-60">` : ''}
            
            <div class="flex-grow">
                <h4 class="font-bold text-gray-700 text-md flex items-center gap-2">
                    ${item.title}
                    <span class="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Archived</span>
                </h4>
                <p class="text-xs text-gray-400 mt-1">Originally posted: ${item.date}</p>
                <p class="text-sm text-gray-500 line-clamp-2 mt-1">${item.description}</p>
            </div>
        </div>
    `;

    return el;
}

// --- Modal & Form Logic ---
function initContentManagement() {
    // Tab Switching
    const tabs = ['Announcements', 'News', 'Archives'];
    const switchTab = (activeTab) => {
        tabs.forEach(tab => {
            const btn = getEl(`tab${tab}`);
            const panel = getEl(`panel${tab}`);
            
            if (btn && panel) {
                if (tab === activeTab) {
                    // ACTIVE STATE (White Card)
                    btn.className = "px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm bg-white text-green-800 transform scale-105";
                    panel.classList.remove('hidden');
                    
                    if (tab === 'Archives') {
                        loadArchivedContent();
                        // Initialize archive subtabs to show announcements by default
                        setTimeout(() => window.switchArchiveSubTab('announcements'), 100);
                    }
                    else loadContentManagement();
                } else {
                    // INACTIVE STATE (Gray Text)
                    btn.className = "px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-green-700 hover:bg-gray-200 transition-all";
                    panel.classList.add('hidden');
                }
            }
        });
    };
    if(getEl('tabAnnouncements')) {
        getEl('tabAnnouncements').onclick = () => switchTab('Announcements');
        getEl('tabNews').onclick = () => switchTab('News');
        getEl('tabArchives').onclick = () => switchTab('Archives');
    }

    // Setup Modals (Announcements)
    setupModalListeners('announcementModal', 'addAnnouncementBtn', () => {
        openModal('announcementModal', 'New Announcement');
        getEl('announcementTitle').value = '';
        getEl('announcementDescription').value = '';
        forceUpdateCounters(['announcementTitle', 'announcementDescription']);
    });

    getEl('uploadAnnouncementBtn')?.addEventListener('click', () => {
        const title = getEl('announcementTitle').value.trim();
        const description = getEl('announcementDescription').value.trim();
        if (!title || !description) return alert('Enter title and description.');
        handleDataSubmit('announcements', { title, description }, 'announcementModal');
    });

    // Setup Modals (News)
    setupModalListeners('newsModal', 'addNewsBtn', () => {
        openModal('newsModal', 'New News Article');
        getEl('newsTitle').value = '';
        getEl('newsDescription').value = '';
        getEl('newsImage').value = '';
        getEl('newsLink').value = '';
        forceUpdateCounters(['newsTitle', 'newsDescription']);
    });

    getEl('uploadNewsBtn')?.addEventListener('click', () => {
        const title = getEl('newsTitle').value.trim();
        const description = getEl('newsDescription').value.trim();
        const image = getEl('newsImage').value.trim();
        const link = getEl('newsLink').value.trim();
        if (!title || !description || !image) return alert('Fill required fields.');
        handleDataSubmit('news', { title, description, image, link }, 'newsModal');
    });

    initCounters();
}

// --- Shared Helpers ---

function setupModalListeners(modalId, addBtnId, onAddClick) {
    const modal = getEl(modalId);
    if (!modal) return;
    
    // Open
    getEl(addBtnId)?.addEventListener('click', onAddClick);
    
    // Close (Click X button)
    const close = () => modal.classList.add('hidden');
    const closeBtn = modal.querySelector('.fa-times')?.parentNode;
    if (closeBtn) closeBtn.addEventListener('click', close);
    
    // Close (Click Cancel button)
    const cancelBtn = Array.from(modal.querySelectorAll('button')).find(b => b.id.includes('cancel'));
    if (cancelBtn) cancelBtn.addEventListener('click', close);
}

function openModal(modalId, title, editId = null) {
    const modal = getEl(modalId);
    modal.classList.remove('hidden');
    // Find the title element (h3)
    const titleEl = modal.querySelector('h3');
    if (titleEl) titleEl.textContent = title;
    
    // Store ID globally for submit handler
    window[modalId + 'EditId'] = editId; 
}

async function handleDataSubmit(type, body, modalId) {
    const editId = window[modalId + 'EditId'];
    const method = editId ? 'PATCH' : 'POST';
    const url = editId ? `/api/${type}/${editId}` : `/api/${type}`;

    try {
        const res = await fetchWithAuth(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res) return;
        const result = await res.json();
        
        if (result.success) {
            getEl(modalId).classList.add('hidden');
            await loadContentManagement();
            if (window.refreshAuditLog) refreshAuditLog();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (e) { alert('Network error'); }
}

async function archiveItem(id, type) {
    if (!confirm(`Archive this item?`)) return;
    console.log(`Attempting to archive ${type} ID: ${id}`);
    try {
        const res = await fetchWithAuth(`/api/${type}/${id}`, { method: 'DELETE' });
        if (!res) {
            alert('Error: Server error occurred');
            console.error('Archive request failed - no response');
            return;
        }
        const result = await res.json();
        console.log(`Archive response for ${type} ID ${id}:`, result);
        if (result.success) {
            alert('Item archived successfully! It will no longer appear in the active list.');
            // Reload content to update announcements and news lists (archived items will be filtered out)
            await loadContentManagement();
            // Also reload archived content in case user switches to archives tab
            await loadArchivedContent();
            // Refresh audit log if available
            if (window.refreshAuditLog) refreshAuditLog();
        } else {
            alert('Error: ' + (result.message || 'Failed to archive item'));
        }
    } catch (e) { 
        console.error('Archive error:', e);
        alert('Network error: Failed to archive item'); 
    }
}



// --- Counter Logic ---

function initCounters() {
    setupCounter('announcementTitle', 'announcementTitleCounter', 40);
    setupCounter('announcementDescription', 'announcementCounter', 200);
    setupCounter('newsTitle', 'newsTitleCounter', 100);
    setupCounter('newsDescription', 'newsCounter', 400);
}

function setupCounter(inputId, counterId, limit) {
    const input = getEl(inputId);
    const counter = getEl(counterId);
    if (!input || !counter) return;

    // Attach function to element for easy re-use
    input.updateCount = () => {
        const count = input.value.length;
        counter.textContent = count;
        counter.classList.toggle('text-red-500', count > limit);
    };
    input.addEventListener('input', input.updateCount);
}

function forceUpdateCounters(ids) {
    ids.forEach(id => {
        const el = getEl(id);
        if (el && el.updateCount) el.updateCount();
        else {
            // Fallback if event listener isn't ready yet
            const counter = getEl(id.replace('Description', 'Counter').replace('Title', 'TitleCounter')); 
            if(counter) counter.textContent = el.value.length;
        }
    });
}

// =======================
// ARCHIVE SUB-TAB LOGIC
// =======================
window.switchArchiveSubTab = function(type) {
    const btnAnn = document.getElementById('subTabArchAnn');
    const btnNews = document.getElementById('subTabArchNews');
    const boxAnn = document.getElementById('containerArchivedAnn');
    const boxNews = document.getElementById('containerArchivedNews');

    if (!btnAnn || !btnNews || !boxAnn || !boxNews) {
        console.warn('Archive subtab elements not found');
        return;
    }

    if (type === 'announcements') {
        // Show Announcements, Hide News
        boxAnn.classList.remove('hidden');
        boxNews.classList.add('hidden');

        // Style Buttons (Active vs Inactive)
        btnAnn.className = "px-6 py-2 rounded-md text-sm font-bold bg-white text-green-800 shadow-sm transition-all";
        btnNews.className = "px-6 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-green-800 transition-all";
    } else {
        // Show News, Hide Announcements
        boxAnn.classList.add('hidden');
        boxNews.classList.remove('hidden');

        // Style Buttons
        btnNews.className = "px-6 py-2 rounded-md text-sm font-bold bg-white text-green-800 shadow-sm transition-all";
        btnAnn.className = "px-6 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-green-800 transition-all";
    }
};