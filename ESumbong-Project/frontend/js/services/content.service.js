/**
 * Content Service
 * Handles all communication with news, announcements, and suggestions endpoints
 */

export const ContentService = {
    // --- Announcements & News ---
    async getNews(archived = false) {
        const query = archived ? '?archived=true' : '';
        const response = await fetchWithAuth(`/api/news${query}`);
        return await response.json();
    },

    async getAnnouncements(archived = false) {
        const query = archived ? '?archived=true' : '';
        const response = await fetchWithAuth(`/api/announcements${query}`);
        return await response.json();
    },

    async createItem(type, data) {
        return await fetchWithAuth(`/api/${type}`, { // type = 'news' or 'announcements'
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    async updateItem(type, id, data) {
        return await fetchWithAuth(`/api/${type}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    async deleteItem(type, id) {
        return await fetchWithAuth(`/api/${type}/${id}`, { method: 'DELETE' });
    },

    // --- Suggestions ---
    async getSuggestions() {
        const response = await fetchWithAuth('/api/suggestions');
        return await response.json();
    },

    async markSuggestionRead(id) {
        return await fetchWithAuth(`/api/suggestions/${id}/read`, { method: 'PATCH' });
    },

    async deleteSuggestion(id) {
        return await fetchWithAuth(`/api/suggestions/${id}`, { method: 'DELETE' });
    }
};
