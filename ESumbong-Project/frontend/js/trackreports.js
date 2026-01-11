// Priority colors
const priorityColors = {
    "High": "bg-yellow-500 text-black", 
    "Emergency": "bg-red-600 text-white", 
    "Low": "bg-green-600 text-white",
};

// Modal for enlarged images
function createModal() {
    if (document.getElementById('imageModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 hidden flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="relative max-w-4xl max-h-96 flex items-center justify-center">
            <button id="closeModal" class="absolute top-2 right-2 bg-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-200 z-10">
                <i class="fas fa-times text-lg text-black"></i>
            </button>
            <img id="modalImage" src="" alt="Enlarged view" class="max-w-full max-h-96 object-contain rounded" />
            <video id="modalVideo" class="max-w-full max-h-96 rounded hidden" controls></video>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.id === 'closeModal') {
            modal.classList.add('hidden');
        }
    });
}

// Function to open modal with image/video
function openModal(src, isVideo = false) {
    const modal = document.getElementById('imageModal');
    if (isVideo) {
        document.getElementById('modalImage').classList.add('hidden');
        document.getElementById('modalVideo').classList.remove('hidden');
        document.getElementById('modalVideo').src = src;
    } else {
        document.getElementById('modalVideo').classList.add('hidden');
        document.getElementById('modalImage').classList.remove('hidden');
        document.getElementById('modalImage').src = src;
    }
    modal.classList.remove('hidden');
}

// Function to display evidence files
function displayEvidenceFiles(areaPhoto) {
    if (!areaPhoto) return "-";
    
    const files = areaPhoto.split(',').map(f => f.trim()).filter(f => f);
    if (files.length === 0) return "-";
    
    return `
        <div class="flex justify-center w-full">
            <div class="flex flex-wrap justify-center gap-4 mt-2 w-full">
                ${files.map((file, index) => {
                    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(file);
                    return `
                        <div class="relative group cursor-pointer w-[48%] sm:w-48 h-56 sm:h-40 flex-shrink-0" onclick="openModal('${file}', ${isVideo})">
                            ${isVideo ? 
                                `<video class="w-full h-full bg-black rounded border hover:opacity-80 transition object-cover" preload="metadata">
                                    <source src="${file}">
                                </video>
                                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                    <i class="fas fa-play-circle text-white text-3xl"></i>
                                </div>` 
                                : 
                                `<img src="${file}" class="w-full h-full object-cover rounded border hover:opacity-80 transition" />`
                            }
                            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-black bg-opacity-20 rounded flex items-center justify-center">
                                <i class="fas fa-search-plus text-white text-2xl"></i>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// Main track button event listener
document.getElementById("trackBtn").addEventListener("click", async () => {
    const trackingIdInput = document.getElementById("trackingId");
    const trackingId = trackingIdInput.value.trim(); 
    const container = document.getElementById("resultContainer");
    const details = document.getElementById("reportDetails");

    if (!trackingId) {
        alert("Please enter a tracking ID.");
        return;
    }

    try {
        container.classList.remove("hidden");
        details.innerHTML = `
            <div class="animate-pulse space-y-4">
                <div class="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div class="h-32 bg-gray-200 rounded w-full"></div>
                <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
        `;

        const response = await fetch(`/api/reports/${trackingId}`);
        const result = await response.json();

        if (result.success) {
            const report = result.report;
            // Create modal if it doesn't exist
            createModal();
            
            // Display the report details
            details.innerHTML = `
                <p><strong>Name:</strong> ${report.name || "Anonymous"}</p>
                <p class="mt-2"><strong>Barangay ID / Proof:</strong><br>
                    ${report.photo ? `<img src="${report.photo.split(',')[0]}" class="w-40 h-32 object-contain rounded mx-auto border" />` : "-"}
                </p>
                <p class="mt-2"><strong>Category:</strong> ${report.category}</p>
                <p class="mt-2"><strong>Description:</strong> ${report.description}</p>
                <div class="mt-2 text-center"><strong>Submitted Evidence:</strong>
                    ${displayEvidenceFiles(report.areaPhoto)}
                </div>
                <p class="mt-2"><strong>Status:</strong> ${report.status}</p>
                <p class="mt-2"><strong>Date Reported:</strong> ${report.date}</p>
                <p class="mt-2"><strong>Priority:</strong> 
                    <span class="px-3 py-1 rounded-full ${priorityColors[report.priority] || 'bg-gray-400'}">
                    ${report.priority}
                    </span>
                </p>
            `;
        } else {
            details.innerHTML = `
                <p class="text-red-600 font-semibold">
                    ${result.message} (for ID: ${trackingId})
                </p>
            `;
        }
    } catch (error) {
        console.error("Tracking error:", error);
        details.innerHTML = `
            <p class="text-red-600 font-semibold">
                A network error occurred. Please try again.
            </p>
        `;
    }
});