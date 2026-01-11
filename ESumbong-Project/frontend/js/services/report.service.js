/**
 * Report Service
 * Handles all communication with report-related backend endpoints
 */

export const ReportService = {
    async getAll() {
        const response = await fetchWithAuth('/api/reports');
        return await response.json();
    },

    async updateStatus(id, status) {
        return await fetchWithAuth(`/api/reports/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
    }
};
