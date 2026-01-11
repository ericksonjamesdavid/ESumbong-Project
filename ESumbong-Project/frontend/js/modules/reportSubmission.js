// =======================
// REPORT SUBMISSION MODULE
// =======================

import { barangayIdFiles, evidenceFiles } from './fileUpload.js';
import { generateTrackingID, resetFormLayout } from './reportForm.js';
import { initDashboardCharts } from './charts.js';
import { clearReportMarker } from './map.js';

export const initReportSubmission = () => {
    const reportForm = document.getElementById('reportForm');
    if (!reportForm) return;

    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const trackingId = await generateTrackingID();
        
        if (!trackingId || trackingId.startsWith('ERR')) {
            alert('Error generating tracking ID. Please try again.');
            return;
        }

        const formData = new FormData(reportForm);

        formData.delete('barangayIdFile'); 
        formData.delete('evidenceFiles');

        formData.append('trackingId', trackingId);

        if (barangayIdFiles.length > 0) {
            barangayIdFiles.forEach(file => {
                formData.append('barangayIdFile', file);
            });
        }

        if (evidenceFiles.length > 0) {
            evidenceFiles.forEach(file => {
                formData.append('evidenceFiles', file);
            });
        }

        const category = document.getElementById('category').value;
        const otherCategory = document.getElementById('otherCategory').value;
        const finalCategory = category === 'other' ? otherCategory : category;
        formData.set('category', finalCategory);
        // Also include original otherCategory explicitly so the server can use it if needed
        formData.set('otherCategory', otherCategory || '');

        const fullname = document.getElementById('fullname').value || null;
        const anonymous = document.getElementById('anonymous').checked;
        const description = document.getElementById('description').value;
        const priority = document.getElementById('priority').value;
        const address = document.getElementById('address').value;
        const lat = document.getElementById('lat').value;
        const lng = document.getElementById('lng').value;

        formData.set('fullname', anonymous ? 'null' : (fullname || ''));
        formData.set('description', description);
        formData.set('priority', priority);
        formData.set('address', address);
        formData.set('lat', lat);
        formData.set('lng', lng);

        // Show confirmation modal
        showConfirmationModal(formData, trackingId);
    });

    // Confirmation button
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const formData = window.currentFormData;
            if (!formData) return;

            document.getElementById('confirmModal').classList.add('hidden');
            document.getElementById('loadingModal').classList.remove('hidden');

            // Smart minimum delay for loading state visibility
            const startTime = Date.now();

            try {
                const response = await fetch('/api/submit-report', {
                    method: 'POST',
                    body: formData
                });

                // Ensure loading state is visible for at least 600ms
                const elapsedTime = Date.now() - startTime;
                if (elapsedTime < 600) {
                    await new Promise(resolve => setTimeout(resolve, 600 - elapsedTime));
                }

                const result = await response.json();

                document.getElementById('loadingModal').classList.add('hidden');

                if (!response.ok) {
                    console.error('Server error:', response.status, result);
                    alert('Server error: ' + (result.error || result.message || response.statusText));
                    return;
                }

                if (result.success) {
                    // Set only the tracking ID in the trackCode element (for copy functionality)
                    document.getElementById('trackCode').textContent = result.trackingId;
                    
                    document.getElementById('successModal').classList.remove('hidden');

                    // Optimistic UI update: push a minimal report locally so charts update immediately
                    try {
                        const fd = window.currentFormData;
                        if (fd && typeof window.addReport === 'function') {
                            const optimistic = {
                                date: new Date().toISOString(),
                                category: fd.get('category') || 'Other',
                                status: 'submitted'
                            };
                            window.addReport(optimistic);
                        }
                    } catch (e) { console.error('Optimistic chart update failed:', e); }

                    // Clear form and previews so user can submit again immediately
                    reportForm.reset();
                    window.currentFormData = null;
                    barangayIdFiles.length = 0;
                    evidenceFiles.length = 0;
                    const bidPrev = document.getElementById('barangayIdPreview');
                    const evPrev = document.getElementById('evidencePreview');
                    if (bidPrev) bidPrev.innerHTML = '';
                    if (evPrev) evPrev.innerHTML = '';
                    // Reset map marker/address and UI layout (show prompts, category/anonymous layout)
                    try { clearReportMarker(); } catch (e) {}
                    try { resetFormLayout(); } catch (e) {}
                    // Refresh client charts on the page, if present
                    try { initDashboardCharts(); } catch (e) {}
                    // If admin dashboard is open, refresh its stats as well
                    try { if (typeof fetchDashboardStats === 'function') fetchDashboardStats(); } catch (e) {}
                    // Reset date to today in the form (in case reset cleared it)
                    try { const dateEl = document.getElementById('dateSubmitted'); if (dateEl) dateEl.value = new Date().toISOString().split('T')[0]; } catch (e) {}
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                console.error('Submission error:', error);
                document.getElementById('loadingModal').classList.add('hidden');
                alert('Network error. Please try again.');
            }
        });
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('confirmModal').classList.add('hidden');
        });
    }

    // Close success button
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', () => {
            document.getElementById('successModal').classList.add('hidden');
        });
    }
};

// Helper function: Add click-to-enlarge functionality to media elements
const addClickToEnlarge = (file, container) => {
    const url = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    let mediaEl;

    if (isImage) {
        mediaEl = document.createElement('img');
        mediaEl.src = url;
        mediaEl.className = "w-24 h-24 object-cover rounded border-2 border-white shadow-sm cursor-pointer hover:scale-105 hover:border-green-500 transition duration-200";
    } else if (isVideo) {
        mediaEl = document.createElement('video');
        mediaEl.src = url;
        mediaEl.className = "w-24 h-24 object-cover rounded border-2 border-white shadow-sm cursor-pointer hover:scale-105 hover:border-green-500 transition duration-200 bg-black";
    }

    if (mediaEl) {
        mediaEl.title = "Click to view";
        
        // CLICK EVENT: Open lightbox
        mediaEl.onclick = (e) => {
            e.stopPropagation();
            const lightbox = document.getElementById('lightboxModal');
            const lightboxImg = document.getElementById('lightboxImage');
            const lightboxVid = document.getElementById('lightboxVideo');
            
            if (lightbox) {
                // Reset previous state
                lightboxImg.classList.add('hidden');
                lightboxVid.classList.add('hidden');
                lightboxVid.pause();
                lightboxVid.src = "";

                if (isImage) {
                    lightboxImg.src = url;
                    lightboxImg.classList.remove('hidden');
                } else if (isVideo) {
                    lightboxVid.src = url;
                    lightboxVid.classList.remove('hidden');
                }
                
                lightbox.classList.remove('hidden');
            }
        };
        container.appendChild(mediaEl);
    }
};

// Helper function: Close lightbox modal
const closeLightbox = () => {
    const lightbox = document.getElementById('lightboxModal');
    const lightboxVid = document.getElementById('lightboxVideo');
    
    if (lightbox) {
        lightbox.classList.add('hidden');
        if (lightboxVid) {
            lightboxVid.pause();
            lightboxVid.src = "";
        }
    }
};

// Initialize lightbox close button
export const initLightboxClose = () => {
    const lightbox = document.getElementById('lightboxModal');
    if (lightbox) {
        const closeBtn = document.getElementById('closeLightbox');
        
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.preventDefault();
                closeLightbox();
            };
        }

        lightbox.onclick = (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        };
    }
};

function showConfirmationModal(formData, trackingId) {
    const modal = document.getElementById('confirmModal');
    const details = document.getElementById('confirmDetails');
    
    const fullname = formData.get('fullname') === 'null' ? 'Anonymous' : formData.get('fullname');
    const category = formData.get('category');
    const description = formData.get('description');
    const priority = formData.get('priority');
    const address = formData.get('address');

    details.innerHTML = `
        <p><strong>Name:</strong> ${fullname}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Description:</strong> ${description}</p>
    `;

    // Show barangay ID preview with click-to-enlarge
    const confirmBarangayPreview = document.getElementById('confirmBarangayPreview');
    confirmBarangayPreview.innerHTML = '';
    const barangayFiles = formData.getAll('barangayIdFile');
    if (barangayFiles && barangayFiles.length > 0) {
        barangayFiles.forEach(file => {
            addClickToEnlarge(file, confirmBarangayPreview);
        });
    }

    // Show evidence preview with click-to-enlarge
    const confirmEvidencePreview = document.getElementById('confirmEvidencePreview');
    confirmEvidencePreview.innerHTML = '';
    const evidenceFilesList = formData.getAll('evidenceFiles');
    if (evidenceFilesList && evidenceFilesList.length > 0) {
        evidenceFilesList.forEach(file => {
            addClickToEnlarge(file, confirmEvidencePreview);
        });
    }

    window.currentFormData = formData;
    modal.classList.remove('hidden');
}
