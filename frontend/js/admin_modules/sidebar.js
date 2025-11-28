// =======================
// SIDEBAR & NAVIGATION
// =======================
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const icon = sidebarToggle ? sidebarToggle.querySelector('i') : null;
const hideSidebar = document.getElementById('hideSidebar');

// Toggle Sidebar
if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        sidebar.classList.toggle('-translate-x-full');
        icon.classList.add('fa-bars');
    });
}

if (hideSidebar && sidebar) {
    hideSidebar.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        if (icon) icon.classList.add('fa-bars');
    });
}

// Close sidebar when clicking outside
document.addEventListener('click', (event) => {
    if (sidebar && sidebarToggle) {
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnToggle = sidebarToggle.contains(event.target);

        if (!isClickInsideSidebar && !isClickOnToggle) {
            sidebar.classList.add('-translate-x-full');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-xmark');
            }
        }
    }
});

// Switch Sections
function showSection(sectionId) {
    const sections = ['sectionAnnouncements', 'sectionCharts', 'sectionReports', 'sectionAuditLog', 'sectionSuggestions'];
    const buttons = {
        sectionAnnouncements: document.getElementById('btnAnnouncements'),
        sectionCharts: document.getElementById('btnCharts'),
        sectionReports: document.getElementById('btnReports'),
        sectionAuditLog: document.getElementById('btnAuditLog'),
        sectionSuggestions: document.getElementById('btnSuggestions')
    };

    sections.forEach(sec => {
        const el = document.getElementById(sec);
        if (el) el.style.display = (sec === sectionId) ? 'block' : 'none';
    });

    Object.entries(buttons).forEach(([id, btn]) => {
        if (!btn) return;
        if (id === sectionId) {
            btn.classList.add('bg-green-900', 'cursor-not-allowed', 'opacity-70');
            btn.disabled = true;
        } else {
            btn.classList.remove('bg-green-900', 'cursor-not-allowed', 'opacity-70');
            btn.disabled = false;
        }
    });

    if (sidebar) sidebar.classList.add('-translate-x-full');
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm("Are you sure you want to logout?")) {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUsername");
            localStorage.removeItem("defaultSection");
            window.location.href = "admin_signin.html";
        }
    });
}