// =======================
// SUGGESTIONS LOGIC
// =======================
const suggestionListEl = document.getElementById('suggestion-list');
const placeholderEl = document.getElementById('suggestion-placeholder');
const contentEl = document.getElementById('suggestion-content');
const idEl = document.getElementById('suggestion-id');
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
        }
    } catch (err) { console.error(err); }
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
    if (!id) {
        placeholderEl.classList.remove('hidden');
        contentEl.classList.add('hidden');
        currentSuggestionId = null;
        return;
    }
    const suggestion = allSuggestions.find(s => s.id === id);
    if (!suggestion) return;
    currentSuggestionId = id;
    idEl.textContent = suggestion.suggestionId;
    dateEl.textContent = suggestion.date;
    bodyEl.textContent = suggestion.suggestionText;
    placeholderEl.classList.add('hidden');
    contentEl.classList.remove('hidden');
}

async function markAsRead(id) {
    const response = await fetchWithAuth(`/api/suggestions/${id}/read`, { method: 'PATCH' });
    if (!response) return; // Token expired
    const s = allSuggestions.find(i => i.id === id);
    s.isRead = 1;
    renderSuggestionList();
}

if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
        if (currentSuggestionId && confirm('Delete this suggestion?')) {
            const response = await fetchWithAuth(`/api/suggestions/${currentSuggestionId}`, { method: 'DELETE' });
            if (response) { // Only reload if token is still valid
                fetchSuggestions();
            }
        }
    });
}