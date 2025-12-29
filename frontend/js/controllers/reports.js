/**
 * Reports Controller
 * Handles the Reports Table, Filtering, Status Updates, Modal Management, and Downloads
 */

import { ReportService } from '../services/report.service.js';

let allReports = [];
let filteredReports = [];
let galleryCache = {};
let galleryCacheIndex = 0;

// Expose galleryCache to window for HTML onclick handlers
window.galleryCache = galleryCache;

export async function initReports() {
    const tableBody = document.getElementById("reportTableBody");
    const searchInput = document.getElementById("searchInput");
    const dateFilter = document.getElementById("dateRangeFilter");

    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (dateFilter) dateFilter.addEventListener("change", applyFilters);

    if (tableBody) {
        tableBody.addEventListener('click', handleTableClick);
        tableBody.addEventListener('change', handleStatusChange);
    }

    // Modal & Download Setup
    setupImageModal();
    setupModalClosers();
    setupDownloadMenu();
    
    // Initial Load
    await loadReports();
}

async function loadReports() {
    try {
        const data = await ReportService.getAll();
        if (data.success) {
            allReports = data.reports;
            filteredReports = data.reports;
            galleryCacheIndex = 0;
            populateTable(filteredReports);
        }
    } catch (e) { console.error(e); }
}

function populateTable(data) {
    const tbody = document.getElementById("reportTableBody");
    const downloadBtn = document.getElementById("downloadMenuBtn");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    galleryCacheIndex = 0;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center p-10 text-gray-500">
                    <div class="flex flex-col items-center justify-center">
                        <i class="fa-solid fa-folder-open text-4xl mb-3 text-gray-300"></i>
                        <p class="text-lg font-semibold">No Records Found</p>
                        <p class="text-sm">Try adjusting your search or date filters.</p>
                    </div>
                </td>
            </tr>
        `;
        if (downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.classList.add("opacity-50", "cursor-not-allowed");
            downloadBtn.classList.remove("hover:bg-green-800");
        }
        return;
    }

    if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.classList.remove("opacity-50", "cursor-not-allowed");
        downloadBtn.classList.add("hover:bg-green-800");
    }

    data.forEach(r => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50 transition";
        tr.innerHTML = `
            <td class="px-4 py-2 border font-mono">${r.trackingId}</td>
            <td class="px-4 py-2 border">${r.name || "Anonymous"}</td>
            <td class="px-4 py-2 border text-center">${renderMediaCell(r.photo)}</td>
            <td class="px-4 py-2 border">${r.category}</td>
            <td class="px-4 py-2 border text-center">
                <button class="view-desc-btn bg-green-700 text-white px-3 py-1 rounded hover:bg-green-800" data-desc="${r.description}">View</button>
            </td>
            <td class="px-4 py-2 border text-center">
                <button class="view-address-btn bg-green-700 text-white px-3 py-1 rounded hover:bg-green-800"
                        data-address="${r.address}" data-lat="${r.latitude}" data-lng="${r.longitude}">View</button>
            </td>
            <td class="px-4 py-2 border text-center">${renderMediaCell(r.areaPhoto)}</td>
            <td class="px-4 py-2 border whitespace-nowrap">${r.date}</td>
            <td class="px-4 py-2 border">
                <select class="border rounded px-2 py-1 ${r.status === "Resolved" ? "opacity-60 cursor-not-allowed" : ""}" 
                        data-id="${r.trackingId}" data-type="status" ${r.status === "Resolved" ? "disabled" : ""}>
                    <option value="Pending" ${r.status === "Pending" ? "selected" : ""}>Pending</option>
                    <option value="In Progress" ${r.status === "In Progress" ? "selected" : ""}>In Progress</option>
                    <option value="Resolved" ${r.status === "Resolved" ? "selected" : ""}>Resolved</option>
                </select>
            </td>
            <td class="px-4 py-2 border text-center">
                <span class="w-28 inline-block px-2 py-1 rounded-full text-white text-sm font-semibold text-center
                ${r.priority === 'Emergency' ? 'bg-red-600' : r.priority === 'High' ? 'bg-yellow-500' : 'bg-green-600'}">
                  ${r.priority}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderMediaCell(paths) {
    if (!paths) return "-";
    const files = paths.split(',').map(p => p.trim()).filter(p => p);
    if (files.length === 0) return "-";

    const items = files.map(path => ({
        src: path,
        type: /\.(mp4|webm|mkv)$/i.test(path) ? 'video' : 'image'
    }));

    const key = galleryCacheIndex++;
    galleryCache[key] = items;
    const first = files[0];
    const isVideo = items[0].type === 'video';

    const thumb = isVideo 
        ? `<div class="relative w-24 h-16 mx-auto"><video src="${first}" class="w-full h-full object-cover bg-black rounded" muted></video><i class="fa-solid fa-play text-white absolute inset-0 m-auto w-fit h-fit drop-shadow-md"></i></div>`
        : `<img src="${first}" class="block mx-auto w-24 h-16 object-cover rounded shadow-sm">`;

    const onclick = `window.initGallery(window.galleryCache[${key}]); document.getElementById('imageModal').classList.remove('hidden');`;

    if (files.length === 1) {
        return `<div class="cursor-pointer hover:opacity-80 transition" onclick="${onclick}">${thumb}</div>`;
    }
    return `
        <div class="relative block mx-auto w-24 h-16 group cursor-pointer" onclick="${onclick}">
            ${thumb}
            <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded opacity-0 group-hover:opacity-100 transition">
                <span class="text-white text-sm font-bold">+${files.length - 1}</span>
            </div>
            <div class="absolute top-0 right-0 bg-green-900 text-white text-[10px] px-1 rounded-bl opacity-90">${files.length}</div>
        </div>`;
}

function handleTableClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.classList.contains('view-desc-btn')) {
        const modal = document.getElementById('descriptionModal');
        const text = document.getElementById('modalDescriptionText');
        if (text) text.textContent = btn.dataset.desc;
        if (modal) modal.classList.remove('hidden');
    } else if (btn.classList.contains('view-address-btn')) {
        openAddressModal(btn.dataset);
    }
}

async function handleStatusChange(e) {
    if (!e.target.matches('select[data-type="status"]')) return;
    const select = e.target;
    const id = select.dataset.id;
    const newVal = select.value;
    const oldVal = allReports.find(r => r.trackingId === id).status;

    if (!confirm(`Change status to "${newVal}"?`)) {
        select.value = oldVal;
        return;
    }

    try {
        await ReportService.updateStatus(id, newVal);
        allReports.find(r => r.trackingId === id).status = newVal;
        if (newVal === "Resolved") { 
            select.disabled = true; 
            select.classList.add("opacity-60", "cursor-not-allowed");
        }
        
        // Refresh audit logs so the action is visible immediately in the audit log table
        if (typeof refreshAuditLog === 'function') {
            refreshAuditLog();
        }
        
        alert('Status updated!');
    } catch (err) { 
        alert('Network error'); 
        select.value = oldVal; 
    }
}

function applyFilters() {
    const term = document.getElementById("searchInput").value.toLowerCase();
    const range = document.getElementById("dateRangeFilter").value;
    
    filteredReports = allReports.filter(r => {
        const matchesSearch = !term || [r.name, r.category, r.trackingId].some(f => (f||"").toLowerCase().includes(term));
        if (!matchesSearch) return false;

        if (range === 'all-time') return true;
        const rDate = new Date(r.date);
        const today = new Date();
        if (range === 'today') return r.date === today.toISOString().split('T')[0];
        
        const cutoff = new Date();
        if (range === 'past-week') cutoff.setDate(today.getDate() - 7);
        if (range === 'past-month') cutoff.setMonth(today.getMonth() - 1);
        if (range === 'past-year') cutoff.setFullYear(today.getFullYear() - 1);
        
        return rDate >= cutoff;
    });
    
    populateTable(filteredReports);
}

// ============= MODALS & MAPS =============

function setupImageModal() {
    if (document.getElementById('imageModal')) return;
    const modal = document.createElement("div");
    modal.id = "imageModal";
    modal.className = "fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center hidden z-50 p-4";
    modal.innerHTML = `
        <div class="relative max-w-4xl w-full flex flex-col items-center">
            <div id="mediaContainer" class="bg-black rounded overflow-hidden flex justify-center w-full" style="max-height:80vh">
                <img id="modalImage" class="max-w-full max-h-[80vh] hidden rounded" />
                <video id="modalVideo" class="max-w-full max-h-[80vh] hidden rounded" controls></video>
            </div>
            <div class="flex gap-4 mt-4">
                <button id="prevMediaBtn" class="bg-white px-4 py-2 rounded font-bold hover:bg-gray-200">Prev</button>
                <span id="mediaCounter" class="text-white py-2"></span>
                <button id="nextMediaBtn" class="bg-white px-4 py-2 rounded font-bold hover:bg-gray-200">Next</button>
            </div>
            <button onclick="this.closest('#imageModal').classList.add('hidden')" class="absolute -top-10 right-0 text-white text-3xl">&times;</button>
        </div>`;
    
    document.body.appendChild(modal);

    let items = [], idx = 0;
    
    window.initGallery = (galleryItems) => {
        items = galleryItems;
        idx = 0;
        const showNav = items.length > 1;
        ['prevMediaBtn', 'nextMediaBtn', 'mediaCounter'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = showNav ? 'block' : 'none';
        });
        showMedia(0);
    };

    const showMedia = (i) => {
        idx = (i + items.length) % items.length;
        const item = items[idx];
        const img = document.getElementById('modalImage');
        const vid = document.getElementById('modalVideo');
        
        img.style.display = 'none'; 
        vid.style.display = 'none'; 
        vid.pause();
        
        if (item.type === 'video') { 
            vid.src = item.src; 
            vid.style.display = 'block'; 
        } else { 
            img.src = item.src; 
            img.style.display = 'block'; 
        }
        
        const counter = document.getElementById('mediaCounter');
        if (counter) counter.textContent = `${idx + 1} / ${items.length}`;
    };

    const prevBtn = document.getElementById('prevMediaBtn');
    const nextBtn = document.getElementById('nextMediaBtn');
    if (prevBtn) prevBtn.onclick = () => showMedia(idx - 1);
    if (nextBtn) nextBtn.onclick = () => showMedia(idx + 1);
}

function openAddressModal(data) {
    const modal = document.getElementById('addressModal');
    const text = document.getElementById('modalAddressText');
    if (text) text.textContent = data.address;
    if (modal) modal.classList.remove('hidden');
    
    setTimeout(() => {
        if (!window.mapInstance) {
            window.mapInstance = L.map('modalMap').setView([data.lat, data.lng], 16);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(window.mapInstance);
        } else {
            window.mapInstance.setView([data.lat, data.lng], 16);
        }
        
        window.mapInstance.eachLayer(l => l instanceof L.Marker && window.mapInstance.removeLayer(l));
        L.marker([data.lat, data.lng]).addTo(window.mapInstance);
        setTimeout(() => window.mapInstance.invalidateSize(), 100);
    }, 100);
}

function setupModalClosers() {
    const close = (id) => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    };
    
    // Use event delegation - click anywhere on the overlay to close
    document.addEventListener('click', (e) => {
        // Close address modal
        if (e.target.id === 'closeAddressModal') {
            close('addressModal');
        }
        // Close description modal
        if (e.target.id === 'closeDescriptionModal') {
            close('descriptionModal');
        }
        // Close on overlay background click
        if (e.target.id === 'addressModal') {
            close('addressModal');
        }
        if (e.target.id === 'descriptionModal') {
            close('descriptionModal');
        }
    });
}

function setupDownloadMenu() {
    const btn = document.getElementById('downloadMenuBtn');
    const menu = document.getElementById('downloadMenu');
    if (btn && menu) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.add('hidden');
            }
        });
    }
}

// ============= DOWNLOADS =============

window.downloadExcel = async function () {
    if (!filteredReports.length) {
        alert("No reports to download.");
        return;
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Reports");
    
    const dateStr = new Date().toLocaleString();
    
    ws.mergeCells('A1:H1');
    ws.getCell('A1').value = "Barangay Report Management System";
    ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'center' };
    ws.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } };
    ws.getRow(1).height = 25;
    
    ws.mergeCells('A2:H2');
    ws.getCell('A2').value = "Record of Submitted Reports";
    ws.getCell('A2').alignment = { horizontal: 'center' };
    ws.getCell('A2').font = { italic: true, size: 13, color: { argb: 'FF64748B' } };
    
    ws.mergeCells('A3:H3');
    ws.getCell('A3').value = `Date: ${dateStr}`;
    ws.getCell('A3').alignment = { horizontal: 'center' };
    ws.getCell('A3').font = { size: 11, color: { argb: 'FF94A3B8' } };
    
    ws.addRow([]);
    
    const headerRow = ws.addRow(["Tracking ID", "Name", "Category", "Description", "Address", "Date", "Status", "Priority"]);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
    headerRow.alignment = { horizontal: "center", vertical: "center" };
    headerRow.height = 25;

    headerRow.eachCell((cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    
    filteredReports.forEach((r, idx) => {
        const row = ws.addRow([r.trackingId, r.name || "Anonymous", r.category, r.description, r.address, r.date, r.status, r.priority]);
        row.alignment = { horizontal: "left", vertical: "center", wrapText: true };
        row.height = 20;

        row.eachCell((cell) => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            if (idx % 2 === 0) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
            }
        });
        
        const statusCell = row.getCell(7);
        if (r.status === "Resolved") {
            statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
            statusCell.font = { color: { argb: "FF059669" }, bold: true };
        } else if (r.status === "In Progress") {
            statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
            statusCell.font = { color: { argb: "FFA16207" }, bold: true };
        } else {
            statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE0E0" } };
            statusCell.font = { color: { argb: "FF991B1B" }, bold: true };
        }
    });
    
    ws.columns = [
        { width: 18 }, { width: 15 }, { width: 12 }, { width: 70 },
        { width: 100 }, { width: 12 }, { width: 12 }, { width: 12 }
    ];
    
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Reports_${dateStr.split(',')[0].replace(/\//g, '-')}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
};

window.downloadPDF = function () {
    if (!filteredReports.length) {
        alert("No reports to download.");
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    const dateStr = new Date().toLocaleString();

    if (typeof logoBase64 !== 'undefined' && logoBase64) {
        doc.addImage(logoBase64, "PNG", 10, 8, 25, 25);
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(21, 128, 61);
    doc.text("Barangay Report Management System", 40, 18, { align: "left" });

    doc.setFontSize(13);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text("Record of Submitted Reports", 40, 26, { align: "left" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`Date: ${dateStr}`, 40, 33, { align: "left" });

    const rows = filteredReports.map(r => [
        r.trackingId, r.name || 'Anonymous', r.category, r.description,
        r.address, r.date, r.status, r.priority
    ]);
    
    doc.autoTable({
        startY: 38,
        head: [["ID", "Name", "Category", "Description", "Address", "Date", "Status", "Priority"]],
        body: rows,
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [220, 252, 231], textColor: [21, 128, 61], fontStyle: 'bold' }
    });
    
    doc.save(`Reports_${dateStr.split(',')[0].replace(/\//g, '-')}.pdf`);
};

// ============= INITIALIZATION & PUBLIC API =============

// Public function for external calls (legacy compatibility)
async function fetchReports() {
    await loadReports();
}

// Expose to window for HTML onclick handlers and legacy code
window.downloadExcel = window.downloadExcel;
window.downloadPDF = window.downloadPDF;
window.galleryCache = galleryCache;
window.fetchReports = fetchReports;

export { allReports, filteredReports, galleryCache };
