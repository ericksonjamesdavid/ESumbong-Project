// =======================
// REPORTS TABLE MODULE
// =======================

// Variables & helpers already declared in globals.js:
let galleryCacheIndex = 0;
const galleryCache = {};

// --- Fetching & Initialization ---

async function fetchReports() {
    try {
        const res = await fetch('/api/reports');
        const data = await res.json();
        if (data.success) {
            allReports = data.reports;
            filteredReports = data.reports;
            populateTable(allReports);
        } else console.error('Load failed:', data.message);
    } catch (e) { console.error('Network error:', e); }
}

function initReports() {
    const tableBody = getEl("reportTableBody");
    const searchInput = getEl("searchInput");
    const dateFilter = getEl("dateRangeFilter");

    // Filter Listeners
    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (dateFilter) dateFilter.addEventListener("change", applyFilters);

    // Event Delegation (Handle ALL clicks in the table here)
    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            // View Address
            if (btn.classList.contains('view-address-btn')) {
                openAddressModal(btn.dataset);
            }
            // View Description
            else if (btn.classList.contains('view-desc-btn')) {
                getEl('modalDescriptionText').textContent = btn.dataset.desc;
                getEl('descriptionModal').classList.remove('hidden');
            }
        });

        // Handle Status Changes
        tableBody.addEventListener('change', handleStatusChange);
    }

    // Initialize Global Modals
    setupDownloadMenu();
    setupImageModal();
    setupModalClosers();
}

// --- Table Rendering ---

function populateTable(data) {
    const tableBody = getEl("reportTableBody");
    const downloadBtn = getEl("downloadMenuBtn");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    galleryCacheIndex = 0;

    // Handle Empty State
    if (data.length === 0) {
        tableBody.innerHTML = `
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
        if(downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.classList.add("opacity-50", "cursor-not-allowed");
            downloadBtn.classList.remove("hover:bg-green-800");
        }
        return;
    }

    if(downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.classList.remove("opacity-50", "cursor-not-allowed");
        downloadBtn.classList.add("hover:bg-green-800");
    }

    // Render Rows
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
        tableBody.appendChild(tr);
    });
}

// --- Render Helpers (Media & Status) ---

function renderMediaCell(paths) {
    if (!paths) return "-";
    const files = paths.split(',').map(p => p.trim()).filter(p => p);
    if (files.length === 0) return "-";

    // Prepare Data
    const items = files.map(path => ({
        src: path,
        type: /\.(mp4|webm|mkv)$/i.test(path) ? 'video' : 'image'
    }));

    // Cache
    const key = galleryCacheIndex++;
    galleryCache[key] = items;
    const first = files[0];
    const isVideo = items[0].type === 'video';

    // Thumbnail HTML
    const thumb = isVideo 
        ? `<div class="relative w-24 h-16 mx-auto"><video src="${first}" class="w-full h-full object-cover bg-black rounded" muted></video><i class="fa-solid fa-play text-white absolute inset-0 m-auto w-fit h-fit drop-shadow-md"></i></div>`
        : `<img src="${first}" class="block mx-auto w-24 h-16 object-cover rounded shadow-sm">`;

    // Click Handler Wrapper
    const onclick = `initGallery(galleryCache[${key}]); document.getElementById('imageModal').classList.remove('hidden');`;

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
        const res = await fetch(`/api/reports/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newVal })
        });
        const result = await res.json();
        
        if (result.success) {
            allReports.find(r => r.trackingId === id).status = newVal;
            if (newVal === "Resolved") { select.disabled = true; select.classList.add("opacity-60"); }
            if (window.refreshAuditLog) refreshAuditLog();
            alert('Status updated!');
        } else {
            alert('Failed: ' + result.message);
            select.value = oldVal;
        }
    } catch (err) { alert('Network error'); select.value = oldVal; }
}

// --- Modals & Maps ---

function setupImageModal() {
    if (getEl('imageModal')) return;
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

    // Gallery Logic
    let items = [], idx = 0;
    
    window.initGallery = (galleryItems) => {
        items = galleryItems;
        idx = 0;
        const showNav = items.length > 1;
        ['prevMediaBtn', 'nextMediaBtn', 'mediaCounter'].forEach(id => getEl(id).style.display = showNav ? 'block' : 'none');
        showMedia(0);
    };

    const showMedia = (i) => {
        idx = (i + items.length) % items.length;
        const item = items[idx];
        const img = getEl('modalImage'), vid = getEl('modalVideo');
        
        img.style.display = 'none'; vid.style.display = 'none'; vid.pause();
        
        if (item.type === 'video') { vid.src = item.src; vid.style.display = 'block'; }
        else { img.src = item.src; img.style.display = 'block'; }
        
        getEl('mediaCounter').textContent = `${idx + 1} / ${items.length}`;
    };

    getEl('prevMediaBtn').onclick = () => showMedia(idx - 1);
    getEl('nextMediaBtn').onclick = () => showMedia(idx + 1);
}

function openAddressModal(data) {
    getEl('modalAddressText').textContent = data.address;
    getEl('addressModal').classList.remove('hidden');
    
    // Lazy load map
    if (!window.mapInstance) {
        window.mapInstance = L.map('modalMap').setView([data.lat, data.lng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(window.mapInstance);
    } else {
        window.mapInstance.setView([data.lat, data.lng], 16);
    }
    
    // Update Marker
    window.mapInstance.eachLayer(l => l instanceof L.Marker && window.mapInstance.removeLayer(l));
    L.marker([data.lat, data.lng]).addTo(window.mapInstance);
    setTimeout(() => window.mapInstance.invalidateSize(), 100);
}

function setupModalClosers() {
    const close = (id) => getEl(id)?.classList.add('hidden');
    getEl('closeAddressModal')?.addEventListener('click', () => close('addressModal'));
    getEl('closeDescriptionModal')?.addEventListener('click', () => close('descriptionModal'));
}

// --- Search & Filter ---

function applyFilters() {
    const term = getEl("searchInput").value.toLowerCase();
    const range = getEl("dateRangeFilter").value;
    
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

// -- Downloads (Excel & PDF) ---

function setupDownloadMenu() {
    const btn = getEl('downloadMenuBtn'), menu = getEl('downloadMenu');
    if(btn) btn.onclick = (e) => { e.stopPropagation(); menu.classList.toggle('hidden'); };
    document.onclick = (e) => { if(btn && !btn.contains(e.target)) menu.classList.add('hidden'); };
}

window.downloadExcel = async function () {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Reports");
    
    // Headers
    ws.getCell("A1").value = "Record of Submitted Reports";
    ws.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF15803D" } };
    ws.addRow(["ID", "Name", "Category", "Description", "Address", "Date", "Status", "Priority"]);
    
    // Data
    filteredReports.forEach(r => ws.addRow([r.trackingId, r.name||"Anon", r.category, r.description, r.address, r.date, r.status, r.priority]));
    
    const buf = await wb.xlsx.writeBuffer();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([buf]));
    link.download = `Reports_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
};

window.downloadPDF = function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.text("Record of Submitted Reports", 14, 20);
    
    doc.autoTable({
        head: [["ID", "Name", "Category", "Description", "Address", "Date", "Status", "Priority"]],
        body: filteredReports.map(r => [r.trackingId, r.name||'Anon', r.category, r.description, r.address, r.date, r.status, r.priority]),
        startY: 30,
        headStyles: { fillColor: [21, 128, 61] }
    });
    
    doc.save(`Reports_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Global Exposure
window.fetchReports = fetchReports;
window.initReports = initReports;