// =======================
// HOME SECTION
// =======================
// Fade in home section
window.addEventListener('DOMContentLoaded', () => {
  // Animate home content
  const homeContent = document.getElementById('homeContent');
  if (homeContent) {
    homeContent.classList.remove('opacity-0', 'translate-y-6');
    homeContent.classList.add('opacity-100', 'translate-y-0');
  }

  // Highlight current page in navbar
  const currentPage = window.location.pathname.split("/").pop();
  const links = document.querySelectorAll("#navbar .nav-link");

  links.forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add(
        "underline",
        "underline-offset-4",
        "text-white",
        "font-semibold"
      );
    }
  });

  // Mobile menu toggle
/*
const menuBtn = document.getElementById('menu-btn');
const mobileNav = document.getElementById('mobile-nav');

if (menuBtn && mobileNav) {
  menuBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('hidden');
  });
}
  */

//News Carousel
const carousel = document.getElementById('newsCarousel');
// --- ADD THIS CHECK ---
if (carousel) {
  const totalSlides = carousel.children.length;
  const visibleSlides = 3;
  let index = 0;

  const updateCarousel = () => {
    carousel.style.transform = `translateX(-${index * (100 / visibleSlides)}%)`;
  };

  document.getElementById('nextBtn').addEventListener('click', () => {
    if (index < totalSlides - visibleSlides) index++;
    else index = 0;
    updateCarousel();
  });

  document.getElementById('prevBtn').addEventListener('click', () => {
    if (index > 0) index--;
    else index = totalSlides - visibleSlides;
    updateCarousel();
  });

  // Auto-slide every 5 seconds
  setInterval(() => {
    if (index < totalSlides - visibleSlides) index++;
    else index = 0;
    updateCarousel();
  }, 5000);
}

  // Sample data
  const reportStats = {
    categories: ['Garbage', 'Road repair', 'Street Light', 'Water Drainage', 'Other'],
    reported: [50, 90, 40, 60, 50],
    solved: [45, 85, 35, 55, 40],
    colors: ['#72C93B','#28A745','#F2C94C','#3498DB','#A0522D']
  };
  

  // Calculate totals
  const reportedTotalEl = document.getElementById('reportedTotal');
if (reportedTotalEl) {

  const totalReported = reportStats.reported.reduce((a,b) => a+b, 0);
  const totalSolved = reportStats.solved.reduce((a,b) => a+b, 0);

  // Update displayed totals
  document.getElementById('reportedTotal').textContent = totalReported;
  document.getElementById('solvedTotal').textContent = totalSolved;

  // Calculate resolved percentage
  const resolvedPercent = totalReported > 0 ? ((totalSolved / totalReported) * 100).toFixed(1) : 0;
  document.getElementById('resolvedPercent').textContent = resolvedPercent + '%';

  // Bar Chart: Reported vs Solved
  new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: reportStats.categories,
      datasets: [
        {
          label: 'Reported Issues',
          data: reportStats.reported,
          backgroundColor: 'red',
          borderRadius: 4
        },
        {
          label: 'Solved Reports',
          data: reportStats.solved,
          backgroundColor: 'green',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 10 } },
        x: { stacked: false }
      },
      plugins: { 
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: function(context) {
            const label = context.label || '';
            const value = context.raw;
            return `${label}: ${value}%`;
            }
          }
        }
       }
    }
  });

  // Pie Chart: Types of Reported Issues
  new Chart(document.getElementById('pieChart'), {
    type: 'pie',
    data: {
      labels: reportStats.categories,
      datasets: [{
        data: reportStats.reported,
        backgroundColor: reportStats.colors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { 
      legend: { display: true }, 
      tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.raw;
          return `${label}: ${value}%`;
          }
         }
        }
      }
    }
});

  // Pie chart legend
  const legendList = document.getElementById('legendList');
  reportStats.categories.forEach((label, i) => {
    const li = document.createElement('li');
    li.className = 'flex items-center gap-2';
    li.innerHTML = `
      <span style="background:${reportStats.colors[i]};width:14px;height:14px;border-radius:4px;"></span>
      <span class="text-sm text-gray-700">${label}</span>
    `;
    legendList.appendChild(li);
  });
}
});



// =======================
// REPORT ISSUE SECTION
// =======================

// Map Initialization
const mapContainer = document.getElementById('map');
if (mapContainer) {
  
  // 1. Define the center of Pulong Buhangin
  const mapCenter = [14.8705, 121.0022]; // <-- CORRECT CENTER

  // 2. Define the *specific boundaries* for Pulong Buhangin
  const corner1 = L.latLng(14.84497, 120.97564); // Approx. Southwest corner
  const corner2 = L.latLng(14.88497, 121.01564); // Approx. Northeast corner
  const bounds = L.latLngBounds(corner1, corner2);

  // 3. Initialize the map with new options
  const map = L.map('map', {
      center: mapCenter,
      zoom: 15,           // Start at a good zoom level
      maxBounds: bounds,  // This locks the view to Pulong Buhangin
      minZoom: 14         // Stop users from zooming out too far
  });
  
  // 4. Set the map's view to fit the new, tighter bounds
  map.fitBounds(bounds);

  // 5. Add the map tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);

  let marker;
  map.on('click', async (e) => {
    const { lat, lng } = e.latlng;

    // 6. Check if the click is within the allowed boundaries
    if (bounds.contains(e.latlng)) {
      if (marker) marker.setLatLng([lat, lng]);
      else marker = L.marker([lat, lng], { draggable: true }).addTo(map);

      document.getElementById('lat').value = lat;
      document.getElementById('lng').value = lng;

      // Reverse geocode to get address
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        document.getElementById('address').value = data.display_name || `${lat}, ${lng}`;
      } catch {
        document.getElementById('address').value = `${lat}, ${lng}`;
      }
    } else {
      // If clicked outside bounds, show an alert
      alert("Please pin a location within Barangay Pulong Buhangin.");
    }
  });
}

// Default date
const dateInput = document.getElementById('dateSubmitted');
if (dateInput) {
  dateInput.value = new Date().toISOString().split('T')[0];
  dateInput.readOnly = true; // makes it uneditable
}


// File Storage Arrays 
let barangayIdFiles = [];
let evidenceFiles = [];


// Anonymous Logic
document.addEventListener("DOMContentLoaded", () => {

  const anonymousCheckbox = document.getElementById('anonymous');
  const fullnameRow       = document.getElementById('row-fullname');
  const barangayIdRow     = document.getElementById('barangayIdRow');
  const fullNameField     = document.getElementById('fullname');
  const barangayIdUpload  = document.getElementById('barangayIdUpload');
  const barangayIdPreview = document.getElementById('barangayIdPreview');
  const evidenceUpload    = document.getElementById('evidence'); 

  if (fullNameField) { 
  
    // Default required fields
    fullNameField.required     = true;
    barangayIdUpload.required  = true;
    evidenceUpload.required    = true; 

    anonymousCheckbox.addEventListener('change', function () {
      if (this.checked) {
        // Hide fields
        fullnameRow.style.display = 'none';
        barangayIdRow.style.display = 'none';

        // Remove required for identity fields
        fullNameField.required = false;
        barangayIdUpload.required = false;

        // Clear values
        fullNameField.value = "";
        barangayIdUpload.value = "";
        barangayIdFiles = [];
        barangayIdPreview.innerHTML = "";

        // Evidence stays required (DO NOT remove)
      } 
      else {
        // Show fields
        fullnameRow.style.display = 'block';
        barangayIdRow.style.display = 'block';

        // Re-apply required
        fullNameField.required = true;
        barangayIdUpload.required = true;
      }
    });
    
  }
});


// File Preview Helper
function createPreview(file, container, array, allowRemove = true) {
  const url = URL.createObjectURL(file);
  const wrapper = document.createElement('div');
  wrapper.classList.add('relative', 'm-2');

  let el = file.type.startsWith('image/')
    ? Object.assign(document.createElement('img'), {
        src: url, className: "w-24 h-24 object-cover rounded border"
      })
    : Object.assign(document.createElement('video'), {
        src: url, controls: true, width: 110, className: "rounded border"
      });

  if (allowRemove) {
    const remove = document.createElement('button');
    remove.innerText = "x";
    remove.className = "absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex justify-center items-center text-xs";
    remove.onclick = () => {
      wrapper.remove();
      array.splice(array.indexOf(file), 1);

      // Check if container is empty
      if (container.children.length === 0) {
        const promptId = container.id.replace('Preview', 'Upload-prompt');
        const prompt = document.getElementById(promptId);
        if (prompt) {
            prompt.classList.remove('hidden');
        }
      }
    };
    wrapper.append(el, remove);
  } else {
    wrapper.append(el); // no remove button in confirm modal
  }

  container.appendChild(wrapper);
}



// Barangay ID Upload
const barangayIdUploadEl = document.getElementById('barangayIdUpload');
if (barangayIdUploadEl) {

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
      alert("Invalid file type! Please upload only JPEG or PNG files for the ID.");
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
}



// Evidence Upload
const evidenceEl = document.getElementById('evidence');
if (evidenceEl) {

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

    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      alert("Invalid file type! Please upload only JPEG, PNG, or MP4 files.");
      e.target.value = null; 
      return; 
    }

    files.forEach(f => {
      evidenceFiles.push(f);
      createPreview(f, preview, evidenceFiles);
    });
  });
} 


// Category Logic
const categoryEl = document.getElementById('category');
if (categoryEl) {
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
}

// =======================================================
// REPORT SUBMISSION & API (NEW)
// =======================================================
const form = document.getElementById("reportForm");

// Check if the form exists on this page
if (form) {
    const modal = document.getElementById("confirmModal");
    const confirmDetails = document.getElementById("confirmDetails");
    const confirmBarangayPreview = document.getElementById("confirmBarangayPreview");
    const confirmEvidencePreview = document.getElementById("confirmEvidencePreview");

    const loadingModal = document.getElementById("loadingModal");
    const successModal = document.getElementById("successModal");
    const trackCode = document.getElementById("trackCode");

    // To hold form data
    let formData = {};

    // Generate random tracking ID
    function generateTrackingID() {
        const prefix = "TR";
        const number = Math.floor(Math.random() * 999) + 1;
        const formattedNumber = String(number).padStart(3, "0");
        return `${prefix}-${formattedNumber}`;
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault(); 

        // Check if the form is valid (all 'required' fields are filled)
        if (!form.checkValidity()) {
             form.reportValidity();
             return;
        }

        // Get all the data from the form
        const isAnonymous = document.getElementById('anonymous').checked;
        const categoryValue = document.getElementById('category').value;
        
        formData = {
            trackingId: generateTrackingID(),
            fullname: isAnonymous ? null : document.getElementById('fullname').value,
            category: (categoryValue === 'other') ? document.getElementById('otherCategory').value : categoryValue,
            description: document.getElementById('description').value,
            priority: document.getElementById('priority').value,
            address: document.getElementById('address').value,
            lat: document.getElementById('lat').value,
            lng: document.getElementById('lng').value
        };

        // Show the confirmation modal with the data
        confirmDetails.innerHTML = `
            Name: ${formData.fullname || "Anonymous"}<br>
            Category: ${formData.category}<br>
            Description: ${formData.description}<br>
            Priority: ${formData.priority}<br>
            Address: ${formData.address}<br>
            Date: ${new Date().toLocaleDateString()}
        `;

        confirmBarangayPreview.innerHTML = "";
        confirmEvidencePreview.innerHTML = "";
        barangayIdFiles.forEach(file => createPreview(file, confirmBarangayPreview, barangayIdFiles, false));
        evidenceFiles.forEach(file => createPreview(file, confirmEvidencePreview, evidenceFiles, false));

        modal.classList.remove("hidden");
    });

    document.getElementById("cancelBtn").onclick = () => {
        modal.classList.add("hidden");
        formData = {};
    };

    document.getElementById("confirmBtn").onclick = async () => {
        modal.classList.add("hidden");
        loadingModal.classList.remove("hidden");

        const formData = new FormData();

        const isAnonymous = document.getElementById('anonymous').checked;
        const categoryValue = document.getElementById('category').value;
        
        formData.append('trackingId', generateTrackingID());
        formData.append('fullname', isAnonymous ? null : document.getElementById('fullname').value);
        formData.append('category', (categoryValue === 'other') ? document.getElementById('otherCategory').value : categoryValue);
        formData.append('description', document.getElementById('description').value);
        formData.append('priority', document.getElementById('priority').value);
        formData.append('address', document.getElementById('address').value);
        formData.append('lat', document.getElementById('lat').value);
        formData.append('lng', document.getElementById('lng').value);

        barangayIdFiles.forEach(file => {
            formData.append('barangayIdFile', file);
        });
        evidenceFiles.forEach(file => {
            formData.append('evidenceFiles', file);
        });

        try {
            const response = await fetch('/api/submit-report', {
                method: 'POST',
                body: formData 
            });

            const result = await response.json(); 

            // (We can add an artificial delay here for testing if you want)
            await new Promise(resolve => setTimeout(resolve, 2000));

            loadingModal.classList.add("hidden");

            if (result.success) {
                trackCode.textContent = result.trackingId; 
                successModal.classList.remove("hidden");
            } else {
                alert('Submission failed: ' + result.message);
            }

        } catch (error) {
            loadingModal.classList.add("hidden");
            alert('A network error occurred. Please try again. ' + error);
        }
    };

    document.getElementById("closeSuccessBtn").onclick = () => {
        successModal.classList.add("hidden");
        location.reload(); 
    };
}