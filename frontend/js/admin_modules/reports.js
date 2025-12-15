// =======================
// REPORTS TABLE SECTION
// =======================

// Gallery cache for image/video galleries
let galleryCacheIndex = 0;
let galleryCache = {};

async function fetchReports() {
    const tableBody = document.getElementById("reportTableBody");
    if (!tableBody) {
        console.warn('Reports: reportTableBody element not found');
        return;
    }
    try {
        const response = await fetch('/api/reports');
        const data = await response.json();
        if (data.success) {
            allReports = data.reports;
            filteredReports = data.reports;
            populateTable(allReports);
        } else {
            console.error('Failed to load reports:', data.message);
        }
    } catch (error) {
        console.error('Network error fetching reports:', error);
    }
}

function populateTable(data) {
    const tableBody = document.getElementById("reportTableBody");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const downloadBtn = document.getElementById("downloadMenuBtn");

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

    let imageModal = document.body.querySelector("#imageModal");
    if (!imageModal) {
        imageModal = document.createElement("div");
        imageModal.id = "imageModal";
        imageModal.className = "fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center hidden z-50 p-4";
        imageModal.innerHTML = `
          <div class="relative max-w-4xl w-full">
            <div id="mediaContainer" class="bg-black rounded-lg overflow-hidden flex items-center justify-center" style="max-height: 80vh;">
              <img id="modalImage" class="max-w-full max-h-[80vh] rounded shadow-lg" style="display: block;" />
              <video id="modalVideo" class="max-w-full max-h-[80vh] rounded shadow-lg" style="display: none;" controls></video>
            </div>
            
            <!-- Navigation Controls -->
            <div class="absolute inset-0 flex items-center justify-between pointer-events-none rounded-lg">
              <button id="prevMediaBtn" class="pointer-events-auto ml-4 bg-white bg-opacity-50 hover:bg-opacity-75 text-black px-3 py-2 rounded-lg transition">← Prev</button>
              <button id="nextMediaBtn" class="pointer-events-auto mr-4 bg-white bg-opacity-50 hover:bg-opacity-75 text-black px-3 py-2 rounded-lg transition">Next →</button>
            </div>
            
            <!-- Info Bar -->
            <div class="bg-gray-900 text-white p-3 text-center text-sm">
              <span id="mediaCounter">1 / 1</span>
            </div>
            
            <!-- Close Button -->
            <button onclick="this.closest('#imageModal').classList.add('hidden')" 
                    class="absolute top-2 right-2 text-white text-2xl font-bold bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full w-10 h-10 flex items-center justify-center transition">&times;</button>
          </div>
        `;
        imageModal.onclick = e => { if (e.target === imageModal) imageModal.classList.add("hidden"); };
        document.body.appendChild(imageModal);

        // Gallery state
        let galleryItems = [];
        let currentIndex = 0;

        window.initGallery = function (items) {
            galleryItems = items;
            currentIndex = 0;

            // LOGIC: Hide buttons if only 1 item
            const prevBtn = document.getElementById('prevMediaBtn');
            const nextBtn = document.getElementById('nextMediaBtn');
            const counter = document.getElementById('mediaCounter');

            if (galleryItems.length <= 1) {
                prevBtn.style.display = 'none';
                nextBtn.style.display = 'none';
                counter.style.display = 'none'; // Optional: hide "1 / 1" text too
            } else {
                prevBtn.style.display = 'block';
                nextBtn.style.display = 'block';
                counter.style.display = 'block';
            }

            displayMedia(0);
        };

        window.displayMedia = function (index) {
            if (galleryItems.length === 0) return;
            currentIndex = (index + galleryItems.length) % galleryItems.length;
            const item = galleryItems[currentIndex];
            const modalImage = document.getElementById('modalImage');
            const modalVideo = document.getElementById('modalVideo');
            const mediaCounter = document.getElementById('mediaCounter');

            // Hide both and show appropriate one
            modalImage.style.display = 'none';
            modalVideo.style.display = 'none';

            if (item.type === 'video') {
                modalVideo.src = item.src;
                modalVideo.style.display = 'block';
            } else {
                modalImage.src = item.src;
                modalImage.style.display = 'block';
            }

            mediaCounter.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
        };

        document.getElementById('prevMediaBtn').addEventListener('click', () => {
            displayMedia(currentIndex - 1);
        });

        document.getElementById('nextMediaBtn').addEventListener('click', () => {
            displayMedia(currentIndex + 1);
        });
    }

    // Reset gallery cache for each repopulation
    galleryCacheIndex = 0;
    galleryCache = {};

    data.forEach((report, i) => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50 transition";

        // Smart Media Cell Renderer
        const renderMediaCell = (paths) => {
            if (!paths) return "-";

            const fileArray = paths.split(',').map(p => p.trim()).filter(p => p);
            if (fileArray.length === 0) return "-";

            // Prepare Gallery Data
            const galleryItems = fileArray.map(path => {
                const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(path);
                return { src: path, type: isVideo ? 'video' : 'image' };
            });

            const cacheKey = galleryCacheIndex++;
            galleryCache[cacheKey] = galleryItems;

            const firstPath = fileArray[0];
            const isFirstVideo = /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(firstPath);

            // Generate the Thumbnail HTML (Image vs Video)
            let thumbnailHTML;
            if (isFirstVideo) {
                // Video: Use <video> tag + Play Overlay
                thumbnailHTML = `
                    <div class="relative w-24 h-16 mx-auto">
                        <video src="${firstPath}" class="w-full h-full object-cover rounded shadow-sm bg-black" preload="metadata" muted></video>
                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <i class="fa-solid fa-play text-white opacity-80 text-xl drop-shadow-md"></i>
                        </div>
                    </div>`;
            } else {
                // Image: Use <img> tag
                thumbnailHTML = `<img src="${firstPath}" class="block mx-auto w-24 h-16 object-cover rounded shadow-sm transition group-hover:opacity-80" />`;
            }

            // SCENARIO A: Single File
            if (fileArray.length === 1) {
                return `
                <div 
                    class="cursor-pointer group hover:opacity-90 transition" 
                    title="Click to view"
                    onclick="initGallery(galleryCache[${cacheKey}]); document.getElementById('imageModal').classList.remove('hidden');">
                    ${thumbnailHTML}
                </div>`;
            }

            // SCENARIO B: Multiple Files (Gallery Look)
            return `
            <div class="relative block mx-auto w-24 h-16 group cursor-pointer" onclick="initGallery(galleryCache[${cacheKey}]); document.getElementById('imageModal').classList.remove('hidden');">
              ${thumbnailHTML}
              
              <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded opacity-0 group-hover:opacity-100 transition">
                <span class="text-white text-sm font-bold">+${fileArray.length - 1} more</span>
              </div>
              
              <div class="absolute top-0 right-0 bg-green-900 text-white text-[10px] px-1.5 py-0.5 rounded-bl opacity-90">
                ${fileArray.length}
              </div>
            </div>
            `;
        };

        tr.innerHTML = `
            <td class="px-4 py-2 border font-mono">${report.trackingId}</td>
            <td class="px-4 py-2 border">${report.name || "Anonymous"}</td>
            <td class="px-4 py-2 border text-center">${renderMediaCell(report.photo)}</td>
            <td class="px-4 py-2 border">${report.category}</td>
            <td class="px-4 py-2 border text-center">
                <button class="view-desc-btn bg-green-700 text-white px-3 py-1 rounded-md hover:bg-green-800 transition">View</button>
            </td>
            <td class="px-4 py-2 border text-center">
                <button class="view-address-btn bg-green-700 text-white px-3 py-1 rounded-md hover:bg-green-800 transition"
                        data-address="${report.address}"
                        data-lat="${report.latitude}"
                        data-lng="${report.longitude}">View</button>
            </td>
            <td class="px-4 py-2 border text-center">${renderMediaCell(report.areaPhoto)}</td>
            <td class="px-4 py-2 border whitespace-nowrap">${report.date}</td>
            <td class="px-4 py-2 border">
                <select class="border rounded px-2 py-1" data-id="${report.trackingId}" data-type="status">
                    <option value="Pending" ${report.status === "Pending" ? "selected" : ""}>Pending</option>
                    <option value="In Progress" ${report.status === "In Progress" ? "selected" : ""}>In Progress</option>
                    <option value="Resolved" ${report.status === "Resolved" ? "selected" : ""}>Resolved</option>
                </select>
            </td>
            <td class="px-4 py-2 border">
                <span class="w-24 inline-block text-center py-1 rounded-full font-semibold text-white 
                ${report.priority === 'Emergency' ? 'bg-red-600' :
                report.priority === 'High' ? 'bg-yellow-500' : 'bg-green-600'}">
                  ${report.priority}
                </span>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Status Change
    document.querySelectorAll("#reportTableBody select").forEach(select => {
        if (select.value === "Resolved") {
            select.disabled = true;
            select.classList.add("opacity-60", "cursor-not-allowed");
        }
        select.addEventListener("change", async (e) => {
            const trackingId = e.target.dataset.id;
            const newStatus = e.target.value;
            const oldValue = allReports.find(r => r.trackingId === trackingId).status;

            if (confirm(`Change status for ${trackingId} to "${newStatus}"?`)) {
                try {
                    const response = await fetch(`/api/reports/${trackingId}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus })
                    });
                    const result = await response.json();
                    if (result.success) {
                        alert('Status updated!');
                        if (newStatus === "Resolved") {
                            e.target.disabled = true;
                            e.target.classList.add("opacity-60", "cursor-not-allowed");
                        }
                        allReports.find(r => r.trackingId === trackingId).status = newStatus;
                        if (typeof refreshAuditLog === 'function') refreshAuditLog();
                    } else {
                        alert('Failed: ' + result.message);
                        e.target.value = oldValue;
                    }
                } catch (error) {
                    alert('Network error.');
                    e.target.value = oldValue;
                }
            } else {
                e.target.value = oldValue;
            }
        });
    });

    // Modals (Image, Address, Description)
    // Image/Gallery modal is now initialized directly in imgCell onclick

    const addressModal = document.getElementById('addressModal');
    const modalAddressText = document.getElementById('modalAddressText');
    document.querySelectorAll("#reportTableBody .view-address-btn").forEach(btn => {
        btn.addEventListener('click', () => {
            modalAddressText.textContent = btn.dataset.address;
            addressModal.classList.remove('hidden');
            if (!mapInstance) {
                mapInstance = L.map('modalMap').setView([btn.dataset.lat, btn.dataset.lng], 16);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(mapInstance);
            } else {
                mapInstance.setView([btn.dataset.lat, btn.dataset.lng], 16);
            }
            mapInstance.eachLayer((layer) => { if (layer instanceof L.Marker) mapInstance.removeLayer(layer); });
            L.marker([btn.dataset.lat, btn.dataset.lng]).addTo(mapInstance);
            setTimeout(() => mapInstance.invalidateSize(), 100);
        });
    });
    if (document.getElementById('closeAddressModal')) document.getElementById('closeAddressModal').onclick = () => addressModal.classList.add('hidden');

    const descModal = document.getElementById('descriptionModal');
    const descText = document.getElementById('modalDescriptionText');
    document.querySelectorAll("#reportTableBody .view-desc-btn").forEach((btn, index) => {
        btn.addEventListener('click', () => {
            descText.textContent = data[index].description;
            descModal.classList.remove('hidden');
        });
    });
    if (document.getElementById('closeDescriptionModal')) document.getElementById('closeDescriptionModal').onclick = () => descModal.classList.add('hidden');
}

// Search and Filter Logic
function getLocalISOString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function applyFilters() {
    const searchInput = document.getElementById("searchInput");
    const dateRangeFilter = document.getElementById("dateRangeFilter");
    if (!searchInput || !dateRangeFilter) return;

    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = dateRangeFilter.value;
    let filtered = allReports;

    if (searchTerm) {
        filtered = filtered.filter(r =>
            (r.name ? r.name.toLowerCase() : "anonymous").includes(searchTerm) ||
            r.category.toLowerCase().includes(searchTerm) ||
            r.trackingId.toLowerCase().includes(searchTerm) ||
            r.status.toLowerCase().includes(searchTerm) ||
            r.priority.toLowerCase().includes(searchTerm)
        );
    }

    if (filterValue !== "all-time") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let startDate;
        if (filterValue === "today") {
            const todayStr = getLocalISOString(today);
            filtered = filtered.filter(r => r.date === todayStr);
        } else {
            if (filterValue === "past-week") startDate = new Date(today.setDate(today.getDate() - 7));
            if (filterValue === "past-month") startDate = new Date(today.setMonth(today.getMonth() - 1));
            if (filterValue === "past-year") startDate = new Date(today.setFullYear(today.getFullYear() - 1));

            const startStr = getLocalISOString(startDate);
            filtered = filtered.filter(r => r.date >= startStr);
        }
    }
    filteredReports = filtered;
    populateTable(filteredReports);
}

// Initialize Reports section after elements load
function initReports() {
    const searchInput = document.getElementById("searchInput");
    const dateRangeFilter = document.getElementById("dateRangeFilter");

    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (dateRangeFilter) dateRangeFilter.addEventListener("change", applyFilters);

    // Download menu
    const downloadMenuBtn = document.getElementById('downloadMenuBtn');
    const downloadMenu = document.getElementById('downloadMenu');

    if (downloadMenuBtn) {
        downloadMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            downloadMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!downloadMenuBtn.contains(e.target) && !downloadMenu.contains(e.target)) {
                downloadMenu.classList.add('hidden');
            }
        });
    }
}

// =======================
// DOWNLOAD MENU 
// =======================

function getFormattedDate() {
    return getLocalISOString(new Date());
}

// =======================
// EXCEL DOWNLOAD (ExcelJS)
// =======================
window.downloadExcel = async function () {
    const dateStr = getFormattedDate();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reports");

    // =======================
    // COLUMN SETUP
    // =======================
    sheet.columns = [
        { header: "Tracking ID", width: 20 },
        { header: "Name", width: 20 },
        { header: "Category", width: 15 },
        { header: "Description", width: 35 },
        { header: "Address", width: 35 },
        { header: "Date", width: 18 },
        { header: "Status", width: 15 },
        { header: "Priority", width: 15 }
    ];

    // =======================
    // HEADER (MATCH PDF)
    // =======================
    sheet.mergeCells("A1:H1");
    sheet.mergeCells("A2:H2");
    sheet.mergeCells("A3:H3");

    sheet.getCell("A1").value = "E-Sumbong kay Kap! Barangay Pulong Buhangin";
    sheet.getCell("A2").value = "Record of Submitted Reports";
    sheet.getCell("A3").value = `Date: ${dateStr}`;

    sheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF15803D" } };
    sheet.getCell("A2").font = { italic: true, size: 13, color: { argb: "FF64748B" } };
    sheet.getCell("A3").font = { size: 11, color: { argb: "FF94A3B8" } };

    ["A1", "A2", "A3"].forEach(cell => {
        sheet.getCell(cell).alignment = { horizontal: "center", vertical: "middle" };
    });

    sheet.addRow([]); // spacing

    // =======================
    // TABLE HEADER
    // =======================
    const headerRow = sheet.addRow([
        "Tracking ID",
        "Name",
        "Category",
        "Description",
        "Address",
        "Date",
        "Status",
        "Priority"
    ]);

    headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FF15803D" } };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFDCFCE7" }
        };
        cell.alignment = { horizontal: "center" };
        cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
        };
    });

    // =======================
    // DATA ROWS
    // =======================
    filteredReports.forEach(r => {
        const row = sheet.addRow([
            r.trackingId,
            r.name || "Anonymous",
            r.category,
            r.description,
            r.address,
            r.date,
            r.status,
            r.priority
        ]);

        row.eachCell(cell => {
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
            cell.alignment = { vertical: "top", wrapText: true };
        });
    });

    // =======================
    // DOWNLOAD
    // =======================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Reports_${dateStr}.xlsx`;
    link.click();
};


// PDF Download 
window.downloadPDF = function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    const dateStr = getFormattedDate();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logo
    if (typeof logoBase64 !== 'undefined')
        doc.addImage(logoBase64, 'PNG', 14, 10, 24, 24);

    const textStartX = 45;

    // Main Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(21, 128, 61);
    doc.text("E-Sumbong kay Kap! Barangay Pulong Buhangin", pageWidth / 2, 20, { align: "center" });

    // Subtitle 
    doc.setFontSize(13);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text("Record of Submitted Reports", pageWidth / 2, 28, { align: "center" });

    // Date 
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`Date: ${dateStr}`, pageWidth / 2, 34, { align: "center" });

    // Table 
    const body = filteredReports.map(r => [
        r.trackingId,
        r.name || 'Anonymous',
        r.category,
        r.description,
        r.address,
        r.date,
        r.status,
        r.priority
    ]);

    doc.autoTable({
        head: [["ID", "Name", "Category", "Description", "Address", "Date", "Status", "Priority"]],
        body: body,
        startY: 40,
        didParseCell: function (data) {
            if (data.section === 'head') {
                data.cell.styles.fillColor = [220, 252, 231];
                data.cell.styles.textColor = [21, 128, 61];
                data.cell.styles.fontStyle = 'bold';
            }
        },
        columnStyles: {
            0: { cellWidth: 35 },   // Tracking ID
            1: { cellWidth: 35 },   // Name
            2: { cellWidth: 25 },   // Category
            3: { cellWidth: 45 },   // Description
            4: { cellWidth: 45 },   // Address
            5: { cellWidth: 32 },   // Date
            6: { cellWidth: 25 },   // Status
            7: { cellWidth: 25 },   // Priority
        }
    });

    doc.save(`Reports_${dateStr}.pdf`);
}

// Expose to window for admin_loader.js
window.fetchReports = fetchReports;
window.initReports = initReports;
window.galleryCache = galleryCache;