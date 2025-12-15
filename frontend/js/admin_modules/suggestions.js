// =======================
// SUGGESTIONS LOGIC
// =======================

async function fetchSuggestions() {
    const suggestionListEl = document.getElementById('suggestion-list');
    if (!suggestionListEl) {
        console.warn('Suggestions: suggestion-list element not found');
        return;
    }
    try {
        const response = await fetch('/api/suggestions');
        const data = await response.json();
        if (data.success) {
            allSuggestions = data.suggestions;
            renderSuggestionList();
            showSuggestionContent(null);
        }
    } catch (err) { console.error(err); }
}

function renderSuggestionList() {
    const suggestionListEl = document.getElementById('suggestion-list');
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
        item.className = `block p-4 border-b hover:bg-green-50 ${isRead ? 'bg-gray-50' : 'bg-white'}`;
        item.innerHTML = `<div class="flex justify-between"><span class="${isRead ? 'font-normal' : 'font-bold'}">${s.suggestionId}</span><span class="text-xs">${s.date}</span></div><p class="text-sm truncate">${s.suggestionText}</p>`;
        item.addEventListener('click', (e) => {
            e.preventDefault();
            showSuggestionContent(s.id);
            if (!isRead) markAsRead(s.id);
        });
        suggestionListEl.appendChild(item);
    });
}

function showSuggestionContent(id) {
    const placeholderEl = document.getElementById('suggestion-placeholder');
    const contentEl = document.getElementById('suggestion-content');
    const idEl = document.getElementById('suggestion-id');
    const dateEl = document.getElementById('suggestion-date');
    const bodyEl = document.getElementById('suggestion-body');
    
    if (!id) {
        if (placeholderEl) placeholderEl.classList.remove('hidden');
        if (contentEl) contentEl.classList.add('hidden');
        window.currentSuggestionId = null;
        return;
    }
    const suggestion = allSuggestions.find(s => s.id === id);
    if (!suggestion) return;
    window.currentSuggestionId = id;
    if (idEl) idEl.textContent = suggestion.suggestionId;
    if (dateEl) dateEl.textContent = suggestion.date;
    if (bodyEl) bodyEl.textContent = suggestion.suggestionText;
    if (placeholderEl) placeholderEl.classList.add('hidden');
    if (contentEl) contentEl.classList.remove('hidden');
}

async function markAsRead(id) {
    const response = await fetchWithAuth(`/api/suggestions/${id}/read`, { method: 'PATCH' });
    if (!response) return; // Token expired
    const data = await response.json();
    if (!data || !data.success) {
        alert('Failed to mark suggestion as read.');
        return;
    }
    const s = allSuggestions.find(i => i.id === id);
    s.isRead = 1;
    renderSuggestionList();
    // Refresh audit logs so the action is visible immediately in the audit log table
    if (typeof refreshAuditLog === 'function') refreshAuditLog();
}

// Initialize Suggestions section
function initSuggestions() {
    const deleteBtn = document.getElementById('delete-suggestion-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (window.currentSuggestionId && confirm('Delete this suggestion?')) {
                const response = await fetchWithAuth(`/api/suggestions/${window.currentSuggestionId}`, { method: 'DELETE' });
                if (response) { // Only reload if token is still valid
                    await fetchSuggestions();
                    if (typeof refreshAuditLog === 'function') refreshAuditLog();
                }
            }
        });
    }
}

// Expose to window for admin_loader.js
window.fetchSuggestions = fetchSuggestions;
window.initSuggestions = initSuggestions;