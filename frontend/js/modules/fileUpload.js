// =======================
// FILE UPLOAD MODULE
// =======================

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export let barangayIdFiles = [];
export let evidenceFiles = [];

export const createPreview = (file, container, array, allowRemove = true) => {
    const url = URL.createObjectURL(file);
    const wrapper = document.createElement('div');
    wrapper.classList.add('relative', 'm-2');

    let el = file.type.startsWith('image/')
        ? Object.assign(document.createElement('img'), {
            src: url,
            className: "w-24 h-24 object-cover rounded border"
        })
        : Object.assign(document.createElement('video'), {
            src: url,
            controls: true,
            width: 110,
            className: "rounded border"
        });

    if (allowRemove) {
        const remove = document.createElement('button');
        remove.innerText = "x";
        remove.className = "absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex justify-center items-center text-xs";
        remove.onclick = (e) => {
            e.preventDefault();
            wrapper.remove();
            array.splice(array.indexOf(file), 1);

            if (container.children.length === 0) {
                const promptId = container.id.replace('Preview', 'Upload-prompt');
                const prompt = document.getElementById(promptId);
                if (prompt) prompt.classList.remove('hidden');
            }
        };
        wrapper.append(el, remove);
    } else {
        wrapper.append(el);
    }

    container.appendChild(wrapper);
};

export const initBarangayIdUpload = () => {
    const barangayIdUploadEl = document.getElementById('barangayIdUpload');
    if (!barangayIdUploadEl) return;

    const prompt = document.getElementById('barangayIdUpload-prompt');

    barangayIdUploadEl.addEventListener('change', (e) => {
        const preview = document.getElementById('barangayIdPreview');
        const files = Array.from(e.target.files);
        const allowedTypes = ['image/jpeg', 'image/png'];

        if (files.length + barangayIdFiles.length > 2) {
            alert("You can only upload max of 2 files.");
            e.target.value = null;
            return;
        }

        const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
        if (invalidFiles.length > 0) {
            alert("Invalid file type! Please upload only JPEG or PNG files.");
            e.target.value = null;
            return;
        }

        const oversizedFiles = files.filter(file => file.size > MAX_IMAGE_SIZE);
        if (oversizedFiles.length > 0) {
            alert("File is too large! Images must be under 5MB.");
            e.target.value = null;
            return;
        }

        if (files.length > 0 && prompt) {
            prompt.classList.add('hidden');
        }

        files.forEach(f => {
            barangayIdFiles.push(f);
            createPreview(f, preview, barangayIdFiles);
        });
    });
};

export const initEvidenceUpload = () => {
    const evidenceEl = document.getElementById('evidence');
    if (!evidenceEl) return;

    const prompt = document.getElementById('evidenceUpload-prompt');

    evidenceEl.addEventListener('change', (e) => {
        const preview = document.getElementById('evidencePreview');
        const files = Array.from(e.target.files);
        const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];

        if (files.length + evidenceFiles.length > 7) {
            alert("Max 7 files allowed.");
            e.target.value = null;
            return;
        }

        const currentVideoCount = evidenceFiles.filter(f => f.type.startsWith('video/')).length;
        const newVideoCount = files.filter(f => f.type.startsWith('video/')).length;

        if (currentVideoCount + newVideoCount > 1) {
            alert("You can only upload 1 video.");
            e.target.value = null;
            return;
        }

        const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
        if (invalidFiles.length > 0) {
            alert("Invalid file type! Please upload only JPEG, PNG, or MP4 files.");
            e.target.value = null;
            return;
        }

        for (let file of files) {
            if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
                alert(`Image "${file.name}" is too large! Max 5MB.`);
                e.target.value = null;
                return;
            }
            if (file.type.startsWith('video/') && file.size > MAX_VIDEO_SIZE) {
                alert(`Video "${file.name}" is too large! Max 50MB.`);
                e.target.value = null;
                return;
            }
        }

        if (files.length > 0 && prompt) {
            prompt.classList.add('hidden');
        }

        files.forEach(f => {
            evidenceFiles.push(f);
            createPreview(f, preview, evidenceFiles);
        });
    });
};
