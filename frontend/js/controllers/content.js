/**
 * Content Controller
 * Handles News, Announcements, Archive, Modals, and Character Counters
 */

import { ContentService } from '../services/content.service.js';

export async function initContent() {
    // Tab Switching Logic
    const tabs = ['Announcements', 'News', 'Archives'];
    tabs.forEach(tab => {
        const btn = document.getElementById(`tab${tab}`);
        if(btn) btn.onclick = () => switchTab(tab);
    });

    // Setup Modals
    setupModalListeners('announcementModal', 'addAnnouncementBtn', () => {
        openModal('announcementModal', 'New Announcement');
        document.getElementById('announcementTitle').value = '';
        document.getElementById('announcementDescription').value = '';
        forceUpdateCounters(['announcementTitle', 'announcementDescription']);
    });

    setupModalListeners('newsModal', 'addNewsBtn', () => {
        openModal('newsModal', 'New News Article');
        document.getElementById('newsTitle').value = '';
        document.getElementById('newsDescription').value = '';
        document.getElementById('newsImage').value = '';
        document.getElementById('newsLink').value = '';
        forceUpdateCounters(['newsTitle', 'newsDescription']);
    });

    // Upload Buttons
    const uploadAnnouncementBtn = document.getElementById('uploadAnnouncementBtn');
    if (uploadAnnouncementBtn) {
        uploadAnnouncementBtn.addEventListener('click', () => {
            const title = document.getElementById('announcementTitle').value.trim();
            const description = document.getElementById('announcementDescription').value.trim();
            if (!title || !description) return alert('Enter title and description.');
            handleDataSubmit('announcements', { title, description }, 'announcementModal');
        });
    }

    const uploadNewsBtn = document.getElementById('uploadNewsBtn');
    if (uploadNewsBtn) {
        uploadNewsBtn.addEventListener('click', () => {
            const title = document.getElementById('newsTitle').value.trim();
            const description = document.getElementById('newsDescription').value.trim();
            const image = document.getElementById('newsImage').value.trim();
            const link = document.getElementById('newsLink').value.trim();
            if (!title || !description || !image) return alert('Fill required fields.');
            handleDataSubmit('news', { title, description, image, link }, 'newsModal');
        });
    }

    // Initialize counters
    initCounters();

    // Initial Load
    await loadActiveContent();
}

function switchTab(activeTab) {
    ['Announcements', 'News', 'Archives'].forEach(tab => {
        const btn = document.getElementById(`tab${tab}`);
        const panel = document.getElementById(`panel${tab}`);
        
        if (btn && panel) {
            if (tab === activeTab) {
                btn.className = "px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm bg-white text-green-800 transform scale-105";
                panel.classList.remove('hidden');
                
                if (tab === 'Archives') {
                    loadArchivedContent();
                    setTimeout(() => window.switchArchiveSubTab('announcements'), 100);
                } else {
                    loadActiveContent();
                }
            } else {
                btn.className = "px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-green-700 hover:bg-gray-200 transition-all";
                panel.classList.add('hidden');
            }
        }
    });
}

async function loadActiveContent() {
    try {
        const [news, anns] = await Promise.all([
            ContentService.getNews(false),
            ContentService.getAnnouncements(false)
        ]);
        if(anns.success) renderAnnouncementList(anns.announcements);
        if(news.success) renderNewsList(news.news);
    } catch (e) {
        console.error('Error loading active content:', e);
    }
}

async function loadArchivedContent() {
    try {
        const [news, anns] = await Promise.all([
            ContentService.getNews(true),
            ContentService.getAnnouncements(true)
        ]);
        if(anns.success) renderArchivedAnnouncements(anns.announcements);
        if(news.success) renderArchivedNews(news.news);
    } catch (e) {
        console.error('Error loading archived content:', e);
    }
}

function renderAnnouncementList(items) {
    const container = document.getElementById('announcementList');
    if (!container) return;
    container.innerHTML = '';
    if (items.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-10">No announcements yet.</p>`;
        return;
    }
    items.forEach(item => {
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

        el.querySelector('.edit-btn').addEventListener('click', () => {
            openModal('announcementModal', 'Edit Announcement', item.id);
            document.getElementById('announcementTitle').value = item.title;
            document.getElementById('announcementDescription').value = item.description;
            forceUpdateCounters(['announcementTitle', 'announcementDescription']);
        });

        el.querySelector('.delete-btn').addEventListener('click', () => archiveItem(item.id, 'announcements'));
        container.appendChild(el);
    });
}

function renderNewsList(items) {
    const container = document.getElementById('newsList');
    if (!container) return;
    container.innerHTML = '';
    if (items.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-10">No news articles yet.</p>`;
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
            document.getElementById('newsTitle').value = item.title;
            document.getElementById('newsDescription').value = item.description;
            document.getElementById('newsImage').value = item.imageUrl;
            document.getElementById('newsLink').value = item.linkUrl;
            forceUpdateCounters(['newsTitle', 'newsDescription']);
        });

        el.querySelector('.delete-btn').addEventListener('click', () => archiveItem(item.id, 'news'));
        container.appendChild(el);
    });
}

function renderArchivedAnnouncements(items) {
    const container = document.getElementById('archivedAnnList');
    if (!container) return;
    container.innerHTML = '';
    if (items.length === 0) {
        container.innerHTML = `<p class="text-gray-400 text-sm italic">No archived announcements.</p>`;
        return;
    }
    items.forEach(item => container.appendChild(renderArchiveCard(item, 'announcements')));
}

function renderArchivedNews(items) {
    const container = document.getElementById('archivedNewsList');
    if (!container) return;
    container.innerHTML = '';
    if (items.length === 0) {
        container.innerHTML = `<p class="text-gray-400 text-sm italic">No archived news articles.</p>`;
        return;
    }
    items.forEach(item => container.appendChild(renderArchiveCard(item, 'news')));
}

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

// ============= MODAL HELPERS =============

function setupModalListeners(modalId, addBtnId, onAddClick) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const addBtn = document.getElementById(addBtnId);
    if (addBtn) addBtn.addEventListener('click', onAddClick);
    
    // Close modal with X button (first button in header)
    const closeIconBtn = modal.querySelector('h3 + button');
    if (closeIconBtn) {
        closeIconBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }
    
    // Close modal with Cancel button (first button in footer)
    const cancelBtn = modal.querySelector('.flex.justify-end.gap-3 > button:first-child');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }
}

function openModal(modalId, title, editId = null) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('hidden');
    
    const titleEl = modal.querySelector('h3');
    if (titleEl) titleEl.textContent = title;
    
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
        
        if (!res) {
            alert('Server error occurred');
            return;
        }
        const result = await res.json();
        
        if (result.success) {
            document.getElementById(modalId).classList.add('hidden');
            await loadActiveContent();
            // Refresh audit log so the action is visible immediately
            if (typeof refreshAuditLog === 'function') {
                refreshAuditLog();
            }
        } else {
            alert('Error: ' + result.message);
        }
    } catch (e) { 
        alert('Network error'); 
    }
}

async function archiveItem(id, type) {
    if (!confirm(`Archive this item?`)) return;
    
    try {
        const res = await fetchWithAuth(`/api/${type}/${id}`, { method: 'DELETE' });
        if (!res) {
            alert('Error: Server error occurred');
            return;
        }
        const result = await res.json();
        
        if (result.success) {
            alert('Item archived successfully!');
            await loadActiveContent();
            await loadArchivedContent();
            // Refresh audit log so the action is visible immediately
            if (typeof refreshAuditLog === 'function') {
                refreshAuditLog();
            }
        } else {
            alert('Error: ' + (result.message || 'Failed to archive item'));
        }
    } catch (e) { 
        alert('Network error: Failed to archive item'); 
    }
}

// ============= CHARACTER COUNTERS =============

function initCounters() {
    setupCounter('announcementTitle', 'announcementTitleCounter', 40);
    setupCounter('announcementDescription', 'announcementCounter', 200);
    setupCounter('newsTitle', 'newsTitleCounter', 100);
    setupCounter('newsDescription', 'newsCounter', 400);
}

function setupCounter(inputId, counterId, limit) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    if (!input || !counter) return;

    input.updateCount = () => {
        const count = input.value.length;
        counter.textContent = count;
        counter.classList.toggle('text-red-500', count > limit);
    };
    input.addEventListener('input', input.updateCount);
}

function forceUpdateCounters(ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.updateCount) el.updateCount();
    });
}

// ============= ARCHIVE SUB-TAB LOGIC =============

window.switchArchiveSubTab = function(type) {
    const btnAnn = document.getElementById('subTabArchAnn');
    const btnNews = document.getElementById('subTabArchNews');
    const boxAnn = document.getElementById('containerArchivedAnn');
    const boxNews = document.getElementById('containerArchivedNews');

    if (!btnAnn || !btnNews || !boxAnn || !boxNews) return;

    if (type === 'announcements') {
        boxAnn.classList.remove('hidden');
        boxNews.classList.add('hidden');
        btnAnn.className = "px-6 py-2 rounded-md text-sm font-bold bg-white text-green-800 shadow-sm transition-all";
        btnNews.className = "px-6 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-green-800 transition-all";
    } else {
        boxAnn.classList.add('hidden');
        boxNews.classList.remove('hidden');
        btnNews.className = "px-6 py-2 rounded-md text-sm font-bold bg-white text-green-800 shadow-sm transition-all";
        btnAnn.className = "px-6 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-green-800 transition-all";
    }
};

export { loadActiveContent, loadArchivedContent };
