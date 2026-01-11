// =======================
// REPORT FORM MODULE
// =======================

import { barangayIdFiles, evidenceFiles, createPreview } from './fileUpload.js';

export const initAnonymousToggle = () => {
    const anonymousCheckbox = document.getElementById('anonymous');
    if (!anonymousCheckbox) return;

    const fullnameRow = document.getElementById('row-fullname');
    const barangayIdRow = document.getElementById('barangayIdRow');
    const fullNameField = document.getElementById('fullname');
    const barangayIdUpload = document.getElementById('barangayIdUpload');
    const evidenceUpload = document.getElementById('evidence');
    const barangayIdPreview = document.getElementById('barangayIdPreview');

    // Default required fields
    fullNameField.required = true;
    barangayIdUpload.required = true;
    evidenceUpload.required = true;

    anonymousCheckbox.addEventListener('change', function () {
        if (this.checked) {
            fullnameRow.style.display = 'none';
            barangayIdRow.style.display = 'none';

            fullNameField.required = false;
            barangayIdUpload.required = false;

            fullNameField.value = "";
            barangayIdUpload.value = "";
            barangayIdFiles.length = 0;
            barangayIdPreview.innerHTML = "";
        } else {
            fullnameRow.style.display = 'block';
            barangayIdRow.style.display = 'block';

            fullNameField.required = true;
            barangayIdUpload.required = true;
        }
    });
};

export const initCategoryLogic = () => {
    const categoryEl = document.getElementById('category');
    if (!categoryEl) return;

    categoryEl.addEventListener('change', function () {
        const box = document.getElementById('otherCategoryContainer');
        const input = document.getElementById('otherCategory');

        if (this.value === 'other') {
            box.classList.remove('hidden');
            input.required = true;
        } else {
            box.classList.add('hidden');
            input.required = false;
            input.value = "";
        }
    });
};

export const generateTrackingID = async () => {
    // Get category from the form
    const categorySelect = document.getElementById('category');
    const category = categorySelect ? categorySelect.value : 'other';
    
    // Get today's date in YYYYMMDD format
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    try {
        // Call backend to get next sequential tracking ID
        const response = await fetch('/api/next-tracking-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, date: dateStr })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate tracking ID');
        }
        
        const data = await response.json();
        return data.trackingId;
    } catch (error) {
        console.error('Error generating tracking ID:', error);
        // Fallback to a simple format if API fails
        return `ERR-${dateStr}-000`;
    }
};

// Reset the visible layout of the form to default state (used after successful submit)
export const resetFormLayout = () => {
    const anonymousCheckbox = document.getElementById('anonymous');
    const fullnameRow = document.getElementById('row-fullname');
    const barangayIdRow = document.getElementById('barangayIdRow');
    const fullNameField = document.getElementById('fullname');
    const barangayIdUpload = document.getElementById('barangayIdUpload');
    const evidenceUpload = document.getElementById('evidence');
    const barangayIdPreview = document.getElementById('barangayIdPreview');
    const evidencePreview = document.getElementById('evidencePreview');

    // Apply anonymous layout
    try {
        if (anonymousCheckbox && anonymousCheckbox.checked) {
            if (fullnameRow) fullnameRow.style.display = 'none';
            if (barangayIdRow) barangayIdRow.style.display = 'none';
            if (fullNameField) fullNameField.required = false;
            if (barangayIdUpload) barangayIdUpload.required = false;
        } else {
            if (fullnameRow) fullnameRow.style.display = 'block';
            if (barangayIdRow) barangayIdRow.style.display = 'block';
            if (fullNameField) fullNameField.required = true;
            if (barangayIdUpload) barangayIdUpload.required = true;
        }
    } catch (e) {}

    // Apply category layout
    try {
        const categoryEl = document.getElementById('category');
        const otherContainer = document.getElementById('otherCategoryContainer');
        const otherInput = document.getElementById('otherCategory');
        if (categoryEl && categoryEl.value === 'other') {
            if (otherContainer) otherContainer.classList.remove('hidden');
            if (otherInput) otherInput.required = true;
        } else {
            if (otherContainer) otherContainer.classList.add('hidden');
            if (otherInput) { otherInput.required = false; otherInput.value = ''; }
        }
    } catch (e) {}

    // Restore upload prompts if previews are empty
    try {
        const barangayPrompt = document.getElementById('barangayIdUpload-prompt');
        const evidencePrompt = document.getElementById('evidenceUpload-prompt');
        if (barangayPrompt && barangayIdPreview && barangayIdPreview.children.length === 0) {
            barangayPrompt.classList.remove('hidden');
        }
        if (evidencePrompt && evidencePreview && evidencePreview.children.length === 0) {
            evidencePrompt.classList.remove('hidden');
        }
    } catch (e) {}

    // Reset displayed address if cleared
    try {
        const addrEl = document.getElementById('addressDisplay');
        if (addrEl && !document.getElementById('address').value) {
            addrEl.textContent = 'Click the map to pin location...';
            addrEl.classList.remove('text-gray-800');
            addrEl.classList.add('text-gray-500', 'italic');
        }
    } catch (e) {}
};
