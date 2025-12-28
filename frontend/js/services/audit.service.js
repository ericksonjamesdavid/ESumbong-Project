/**
 * Audit Service
 * Handles all communication with audit log endpoints
 */

export const AuditService = {
    async getLogs() {
        const response = await fetchWithAuth('/api/audit-logs');
        return await response.json();
    }
};
