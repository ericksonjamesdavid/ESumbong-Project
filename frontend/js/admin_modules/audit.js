// =======================
// AUDIT LOG LOGIC
// =======================
const auditLogTableBody = document.getElementById('auditLogTableBody');
const auditLogSearchInput = document.getElementById('auditLogSearchInput');
const auditDateFilter = document.getElementById('auditDateFilter');

async function fetchAuditLogs() {
    try {
        const response = await fetchWithAuth('/api/audit-logs');
        const data = await response.json();
        if (data.success) {
            auditLogData = data.logs.map(log => ({ ...log, timestamp: new Date(log.timestamp).toLocaleString() }));
            filteredAuditLogs = auditLogData;
            populateAuditLog(filteredAuditLogs);
        }
    } catch (error) { console.error(error); }
}

function populateAuditLog(data) {
    if (!auditLogTableBody) return;
    auditLogTableBody.innerHTML = "";
    if (data.length === 0) {
        auditLogTableBody.innerHTML = `<tr><td colspan="4" class="text-center p-4">No logs found.</td></tr>`;
        return;
    }
    data.forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="px-4 py-2 border whitespace-nowrap">${log.timestamp}</td><td class="px-4 py-2 border">${log.user}</td><td class="px-4 py-2 border text-xs">${log.actionType}</td><td class="px-4 py-2 border">${log.description}</td>`;
        auditLogTableBody.appendChild(tr);
    });
}

function applyAuditFilters() {
    const term = auditLogSearchInput.value.toLowerCase();
    const filterValue = auditDateFilter.value;
    let filtered = auditLogData;

    if (term) filtered = filtered.filter(log => log.user.toLowerCase().includes(term) || log.description.toLowerCase().includes(term));
    // ... (date logic same as reports) ...
    filteredAuditLogs = filtered;
    populateAuditLog(filteredAuditLogs);
}

if (auditLogSearchInput) auditLogSearchInput.addEventListener("input", applyAuditFilters);
if (auditDateFilter) auditDateFilter.addEventListener("change", applyAuditFilters);

// Add Audit Download logic here (CSV/Excel/PDF)