/**
 * Suggestions Controller
 * Handles suggestion list display, reading pane, and deletion
 */

import { ContentService } from '../services/content.service.js';

let allSuggestions = [];
window.currentSuggestionId = null;

export async function initSuggestions() {
    const deleteBtn = document.getElementById('delete-suggestion-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteSuggestion);
    }
    await loadSuggestions();
}

async function loadSuggestions() {
    try {
        const data = await ContentService.getSuggestions();
        if (data.success) {
            allSuggestions = data.suggestions;
            renderSuggestionList(allSuggestions);
            showSuggestionContent(null);
        }
    } catch (e) { 
        console.error('Error loading suggestions:', e); 
    }
}

function renderSuggestionList(items) {
    const list = document.getElementById('suggestion-list');
    if (!list) return;
    
    list.innerHTML = items.length ? '' : '<p class="p-4 text-gray-500">No suggestions found.</p>';

    items.forEach(s => {
        const isRead = s.isRead === 1;
        const div = document.createElement('a');
        div.href = '#';
        div.className = `block p-4 border-b hover:bg-green-50 ${isRead ? 'bg-gray-50' : 'bg-white'}`;
        div.innerHTML = `
            <div class="flex justify-between">
                <span class="${isRead ? 'font-normal' : 'font-bold'}">${s.suggestionId}</span>
                <span class="text-xs">${s.date}</span>
            </div>
            <p class="text-sm truncate">${s.suggestionText}</p>
        `;
        div.addEventListener('click', (e) => {
            e.preventDefault();
            showSuggestionContent(s);
            if (!isRead) markSuggestionAsRead(s.id);
        });
        list.appendChild(div);
    });
}

function showSuggestionContent(suggestion) {
    const placeholderEl = document.getElementById('suggestion-placeholder');
    const contentEl = document.getElementById('suggestion-content');
    const idEl = document.getElementById('suggestion-id');
    const dateEl = document.getElementById('suggestion-date');
    const bodyEl = document.getElementById('suggestion-body');
    const listColEl = document.getElementById('suggestion-list-col');
    const contentColEl = document.getElementById('suggestion-content-col');
    
    // Handle null case (reset)
    if (!suggestion) {
        if (placeholderEl) placeholderEl.classList.remove('hidden');
        if (contentEl) contentEl.classList.add('hidden');
        window.currentSuggestionId = null;
        return;
    }
    
    // On mobile (< 768px), hide the list and show the content
    if (window.innerWidth < 768) {
        if (listColEl) listColEl.classList.add('hidden');
        if (contentColEl) contentColEl.classList.remove('hidden');
    }
    
    // Update the reading pane UI
    window.currentSuggestionId = suggestion.id;
    
    if (idEl) idEl.textContent = suggestion.suggestionId;
    if (dateEl) dateEl.textContent = suggestion.date;
    if (bodyEl) bodyEl.textContent = suggestion.suggestionText;
    
    if (placeholderEl) placeholderEl.classList.add('hidden');
    if (contentEl) contentEl.classList.remove('hidden');
}

async function markSuggestionAsRead(id) {
    try {
        await ContentService.markSuggestionRead(id);
        
        // Update local state
        const s = allSuggestions.find(i => i.id === id);
        if (s) {
            s.isRead = 1;
            renderSuggestionList(allSuggestions);
        }
        
        // Refresh audit logs so the action is visible immediately in the audit log table
        if (typeof refreshAuditLog === 'function') {
            refreshAuditLog();
        }
    } catch (e) {
        console.error('Error marking suggestion as read:', e);
    }
}

async function handleDeleteSuggestion() {
    if (!window.currentSuggestionId) {
        alert('Please select a suggestion first');
        return;
    }
    
    if (confirm('Are you sure you want to delete this suggestion?')) {
        try {
            await ContentService.deleteSuggestion(window.currentSuggestionId);
            window.currentSuggestionId = null;
            
            // Reload suggestions list
            await loadSuggestions();
            
            // Refresh audit log if available
            if (typeof refreshAuditLog === 'function') {
                refreshAuditLog();
            }
        } catch (e) {
            console.error('Error deleting suggestion:', e);
            alert('Failed to delete suggestion');
        }
    }
}

function closeMobileSuggestion() {
    const listColEl = document.getElementById('suggestion-list-col');
    const contentColEl = document.getElementById('suggestion-content-col');
    
    if (listColEl) listColEl.classList.remove('hidden');
    if (contentColEl) contentColEl.classList.add('hidden');
}

// Global Exports
window.showSuggestionContent = showSuggestionContent;
window.handleDeleteSuggestion = handleDeleteSuggestion;
window.closeMobileSuggestion = closeMobileSuggestion;

export { allSuggestions, loadSuggestions };
