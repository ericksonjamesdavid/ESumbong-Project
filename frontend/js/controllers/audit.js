/**
 * Audit Controller
 * Handles audit log display, filtering, sorting, and downloads
 */

import { AuditService } from '../services/audit.service.js';

let auditLogData = [];
let filteredAuditLogs = [];

export async function initAudit() {
    const auditLogSearchInput = document.getElementById('auditLogSearchInput');
    const auditDateFilter = document.getElementById('auditDateFilter');
    const auditDownloadBtn = document.getElementById('auditDownloadBtn');
    const auditDownloadMenu = document.getElementById('auditDownloadMenu');

    if (auditLogSearchInput) auditLogSearchInput.addEventListener("input", applyAuditFilters);
    if (auditDateFilter) auditDateFilter.addEventListener("change", applyAuditFilters);

    // Download menu
    if (auditDownloadBtn && auditDownloadMenu) {
        auditDownloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            auditDownloadMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!auditDownloadBtn.contains(e.target) && !auditDownloadMenu.contains(e.target)) {
                auditDownloadMenu.classList.add('hidden');
            }
        });
    }

    await loadAuditLogs();
}

async function loadAuditLogs() {
    try {
        const data = await AuditService.getLogs();
        if (data.success) {
            auditLogData = data.logs.map(log => ({
                ...log,
                rawTimestamp: log.timestamp,
                displayTimestamp: new Date(log.timestamp).toLocaleString()
            }));
            filteredAuditLogs = auditLogData;
            renderAuditTable(filteredAuditLogs);
        }
    } catch (error) { 
        console.error('Error loading audit logs:', error); 
    }
}

function renderAuditTable(data) {
    const auditLogTableBody = document.getElementById('auditLogTableBody');
    const auditCardContainer = document.getElementById('auditCardContainer');
    const auditDownloadBtn = document.getElementById('auditDownloadBtn');
    if (!auditLogTableBody && !auditCardContainer) return;
    
    // Clear both
    if (auditLogTableBody) auditLogTableBody.innerHTML = "";
    if (auditCardContainer) auditCardContainer.innerHTML = "";
    
    if (data.length === 0) {
        const emptyMessage = `
            <tr>
                <td colspan="4" class="text-center p-10 text-gray-500">
                    <div class="flex flex-col items-center justify-center">
                        <i class="fa-solid fa-folder-open text-4xl mb-3 text-gray-300"></i>
                        <p class="text-lg font-semibold">No Records Found</p>
                        <p class="text-sm">Try adjusting your search or date filters.</p>
                    </div>
                </td>
            </tr>
        `;
        if (auditLogTableBody) auditLogTableBody.innerHTML = emptyMessage;
        if (auditCardContainer) auditCardContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center p-10 text-gray-500">
                <i class="fa-solid fa-folder-open text-4xl mb-3 text-gray-300"></i>
                <p class="text-lg font-semibold">No Records Found</p>
                <p class="text-sm">Try adjusting your search or date filters.</p>
            </div>
        `;
        if (auditDownloadBtn) {
            auditDownloadBtn.disabled = true;
            auditDownloadBtn.classList.add("opacity-50", "cursor-not-allowed");
            auditDownloadBtn.classList.remove("hover:bg-green-800");
        }
        return;
    }
    
    if (auditDownloadBtn) {
        auditDownloadBtn.disabled = false;
        auditDownloadBtn.classList.remove("opacity-50", "cursor-not-allowed");
        auditDownloadBtn.classList.add("hover:bg-green-800");
    }
    
    data.forEach(log => {
        // Desktop Table Row
        if (auditLogTableBody) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-4 py-2 border whitespace-nowrap">${log.displayTimestamp}</td>
                <td class="px-4 py-2 border">${log.user}</td>
                <td class="px-4 py-2 border text-xs">${log.actionType}</td>
                <td class="px-4 py-2 border">${log.description}</td>
            `;
            auditLogTableBody.appendChild(tr);
        }

        // Mobile Card View
        if (auditCardContainer) {
            const card = document.createElement("div");
            card.className = "bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition";
            card.innerHTML = `
                <div class="flex flex-col gap-3">
                    <div>
                        <p class="text-xs font-bold text-gray-500 uppercase">Timestamp</p>
                        <p class="text-sm text-gray-800 font-mono">${log.displayTimestamp}</p>
                    </div>

                    <div>
                        <p class="text-xs font-bold text-gray-500 uppercase">User</p>
                        <p class="text-sm text-gray-800">${log.user}</p>
                    </div>

                    <div>
                        <p class="text-xs font-bold text-gray-500 uppercase">Action Type</p>
                        <p class="text-sm text-gray-800 font-mono">${log.actionType}</p>
                    </div>

                    <div>
                        <p class="text-xs font-bold text-gray-500 uppercase">Description</p>
                        <p class="text-sm text-gray-700">${log.description}</p>
                    </div>
                </div>
            `;
            auditCardContainer.appendChild(card);
        }
    });
}

function applyAuditFilters() {
    const auditLogSearchInput = document.getElementById('auditLogSearchInput');
    const auditDateFilter = document.getElementById('auditDateFilter');
    if (!auditLogSearchInput || !auditDateFilter) return;
    
    const term = auditLogSearchInput.value.toLowerCase();
    const filterValue = auditDateFilter.value;
    let filtered = auditLogData;

    // Search filter
    if (term) {
        filtered = filtered.filter(log =>
            log.user.toLowerCase().includes(term) ||
            log.actionType.toLowerCase().includes(term) ||
            log.description.toLowerCase().includes(term) ||
            log.rawTimestamp.toLowerCase().includes(term)
        );
    }

    // Date filter
    if (filterValue && filterValue !== 'all-time') {
        const startDate = new Date();
        
        if (filterValue === 'today') {
            const today = new Date();
            const startStr = today.toLocaleDateString('en-CA');
            filtered = filtered.filter(log => log.rawTimestamp.startsWith(startStr));
        } else {
            if (filterValue === 'past-week') startDate.setDate(startDate.getDate() - 7);
            else if (filterValue === 'past-month') startDate.setMonth(startDate.getMonth() - 1);
            else if (filterValue === 'past-year') startDate.setFullYear(startDate.getFullYear() - 1);
            
            const startStr = startDate.toLocaleDateString('en-CA');
            filtered = filtered.filter(log => {
                const logDate = log.rawTimestamp.split(' ')[0];
                return logDate >= startStr;
            });
        }
    }

    filteredAuditLogs = filtered;
    renderAuditTable(filteredAuditLogs);
}

async function refreshAuditLog() {
    await loadAuditLogs();
}

// ============= DOWNLOADS =============

window.downloadAuditExcel = async function () {
    if (!filteredAuditLogs.length) {
        alert("No audit logs to download.");
        return;
    }

    if (typeof ExcelJS === "undefined") {
        alert("ExcelJS library is not loaded.");
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Audit Logs");
    const dateStr = new Date().toLocaleString();

    // --- Header rows ---
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = "Admin Audit Log Report";
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: '15803D' } };

    sheet.mergeCells('A2:D2');
    sheet.getCell('A2').value = "Record of Submitted Logs";
    sheet.getCell('A2').alignment = { horizontal: 'center' };
    sheet.getCell('A2').font = { italic: true, size: 13, color: { argb: '64748B' } };

    sheet.mergeCells('A3:D3');
    sheet.getCell('A3').value = `Date: ${dateStr}`;
    sheet.getCell('A3').alignment = { horizontal: 'center' };
    sheet.getCell('A3').font = { size: 11, color: { argb: '94A3B8' } };

    // --- Column headers ---
    const headerRow = sheet.addRow(["Timestamp", "User", "Action Type", "Description"]);
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
        cell.font = { bold: true, color: { argb: '15803D' } };
        cell.alignment = { horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // --- Data rows ---
    filteredAuditLogs.forEach((log, idx) => {
        const row = sheet.addRow([log.displayTimestamp, log.user, log.actionType, log.description]);
        
        row.eachCell((cell) => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            if (idx % 2 === 0) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
            }
        });
    });

    sheet.columns = [
        { width: 25 }, { width: 20 }, { width: 20 }, { width: 50 }
    ];

    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Logs_${dateStr.split(',')[0].replace(/\//g, '-')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
};

window.downloadAuditPDF = function () {
    if (!filteredAuditLogs.length) {
        alert("No audit logs to download.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("l", "mm", "a4");
    const dateStr = new Date().toLocaleString();

    // Add Logo
    if (typeof logoBase64 !== 'undefined' && logoBase64) {
        doc.addImage(logoBase64, "PNG", 10, 8, 25, 25);
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(21, 128, 61);
    doc.text("Admin Audit Log Report", 40, 18, { align: "left" });

    doc.setFontSize(13);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text("Record of Submitted Logs", 40, 26, { align: "left" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`Date: ${dateStr}`, 40, 33, { align: "left" });

    const rows = filteredAuditLogs.map(log => [
        log.displayTimestamp,
        log.user,
        log.actionType,
        log.description
    ]);

    doc.autoTable({
        startY: 38,
        head: [["Timestamp", "User", "Action Type", "Description"]],
        body: rows,
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [220, 252, 231], textColor: [21, 128, 61], fontStyle: 'bold' }
    });

    doc.save(`Audit_Logs_${dateStr.split(',')[0].replace(/\//g, '-')}.pdf`);
};

// ============= GLOBAL EXPORTS =============

export { filteredAuditLogs, refreshAuditLog };
