// =======================
// AUDIT LOG LOGIC
// =======================

async function fetchAuditLogs() {
    const auditLogTableBody = document.getElementById('auditLogTableBody');
    if (!auditLogTableBody) {
        console.warn('Audit: auditLogTableBody element not found');
        return;
    }
    try {
        const response = await fetchWithAuth('/api/audit-logs');
        const data = await response.json();
        if (data.success) {
            auditLogData = data.logs.map(log => ({ 
                ...log, 
                rawTimestamp: log.timestamp,
                displayTimestamp: new Date(log.timestamp).toLocaleString()
            }));
            filteredAuditLogs = auditLogData;
            populateAuditLog(filteredAuditLogs);
        }
    } catch (error) { console.error(error); }
}

function populateAuditLog(data) {
    const auditLogTableBody = document.getElementById('auditLogTableBody');
    const auditDownloadBtn = document.getElementById('auditDownloadBtn');
    if (!auditLogTableBody) return;
    auditLogTableBody.innerHTML = "";
    if (data.length === 0) {
        auditLogTableBody.innerHTML = `
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
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="px-4 py-2 border whitespace-nowrap">${log.displayTimestamp}</td><td class="px-4 py-2 border">${log.user}</td><td class="px-4 py-2 border text-xs">${log.actionType}</td><td class="px-4 py-2 border">${log.description}</td>`;
        auditLogTableBody.appendChild(tr);
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

    // Date filter - use rawTimestamp (format: YYYY-MM-DD HH:mm:ss)
    if (filterValue !== "all-time") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (filterValue === "today") {
            const todayStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD
            filtered = filtered.filter(log => log.rawTimestamp.startsWith(todayStr));
        } else {
            let startDate = new Date(today);
            
            if (filterValue === "past-week") {
                startDate.setDate(startDate.getDate() - 7);
            } else if (filterValue === "past-month") {
                startDate.setMonth(startDate.getMonth() - 1);
            } else if (filterValue === "past-year") {
                startDate.setFullYear(startDate.getFullYear() - 1);
            }
            
            const startStr = startDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
            filtered = filtered.filter(log => {
                const logDate = log.rawTimestamp.split(' ')[0]; // Extract YYYY-MM-DD
                return logDate >= startStr;
            });
        }
    }

    filteredAuditLogs = filtered;
    populateAuditLog(filteredAuditLogs);
}

// Initialize Audit section
function initAudit() {
    const auditLogSearchInput = document.getElementById('auditLogSearchInput');
    const auditDateFilter = document.getElementById('auditDateFilter');
    const auditDownloadBtn = document.getElementById('auditDownloadBtn');
    const auditDownloadMenu = document.getElementById('auditDownloadMenu');

    if (auditLogSearchInput) auditLogSearchInput.addEventListener("input", applyAuditFilters);
    if (auditDateFilter) auditDateFilter.addEventListener("change", applyAuditFilters);

    // Download menu
    if (auditDownloadBtn) {
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
}

// Expose to window for admin_loader.js
window.fetchAuditLogs = fetchAuditLogs;
window.initAudit = initAudit;
window.refreshAuditLog = refreshAuditLog;

// Function to refresh audit log (called after actions)
async function refreshAuditLog() {
    await fetchAuditLogs();
}

// =======================
// DOWNLOAD EXCEL 
// =======================
async function downloadAuditExcel() {
    if (!filteredAuditLogs.length) {
        alert("No audit logs to download.");
        return;
    }

    // Ensure ExcelJS is available
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
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'DCFCE7' }
        };
        cell.font = { bold: true, color: { argb: '15803D' } };
        cell.alignment = { horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // --- Data rows ---
filteredAuditLogs.forEach((log, idx) => {
        const row = sheet.addRow([log.timestamp, log.user, log.actionType, log.description]);
        
        // Loop through all cells to apply borders and alternating colors
        row.eachCell((cell) => {
            // Apply Borders
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            // Apply Alternating Row Colors (Zebra Striping)
            if (idx % 2 === 0) {
                cell.fill = { 
                    type: "pattern", 
                    pattern: "solid", 
                    fgColor: { argb: "FFF3F4F6" } 
                };
            }
        });
    });

    // Set column widths
    sheet.columns = [
        { width: 25 }, { width: 20 }, { width: 20 }, { width: 50 }
    ];

    // Download
    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Logs_${dateStr}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}

// =======================
// DOWNLOAD PDF
// =======================
function downloadAuditPDF() {
    if (!filteredAuditLogs.length) {
        alert("No audit logs to download.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("l", "mm", "a4");
    const dateStr = new Date().toLocaleString();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Main Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(21, 128, 61);
    doc.text("Admin Audit Log Report", pageWidth / 2, 15, { align: "center" });

    // Subtitle
    doc.setFontSize(13);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text("Record of Submitted Logs", pageWidth / 2, 23, { align: "center" });

    // Date
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`Date: ${dateStr}`, pageWidth / 2, 30, { align: "center" });

    // Table
    const rows = filteredAuditLogs.map(log => [
        log.timestamp,
        log.user,
        log.actionType,
        log.description
    ]);

    doc.autoTable({
        startY: 35,
        head: [["Timestamp", "User", "Action Type", "Description"]],
        body: rows,
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [220, 252, 231], textColor: [21, 128, 61], fontStyle: 'bold' }
    });

    doc.save(`Audit_Logs_${dateStr}.pdf`);
}

// =======================
// INIT
// =======================
fetchAuditLogs();

// Event-driven refresh: exported function for other modules to call
window.refreshAuditLog = function() {
    if (typeof fetchAuditLogs === 'function') {
        fetchAuditLogs();
    }
};
