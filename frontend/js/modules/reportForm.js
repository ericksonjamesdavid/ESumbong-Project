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

export const generateTrackingID = () => {
    const prefix = "TR";
    const number = Math.floor(Math.random() * 999) + 1;
    const formattedNumber = String(number).padStart(3, "0");
    return `${prefix}-${formattedNumber}`;
};
