/**
 * Load shared header and sidebar template
 * Call this in your HTML's DOMContentLoaded event
 */
async function loadHeaderSidebar(pageTitle = 'Admin Dashboard') {
    try {
        const response = await fetch('templates/_header-sidebar.html');
        const html = await response.text();
        
        // Insert at the beginning of body
        const body = document.body;
        body.insertAdjacentHTML('afterbegin', html);
        
        // Set page title
        const titleEl = document.getElementById('pageTitle');
        if (titleEl) {
            titleEl.textContent = pageTitle;
        }
        
        // Setup sidebar buttons based on current page
        const isSettingsPage = pageTitle === 'Account Settings';
        setupSidebarButtons(isSettingsPage);
        setupLogout();
        
        // Initialize sidebar AFTER template is injected
        if (typeof initSidebar === 'function') {
            initSidebar();
        }
        
        console.log('Header & Sidebar loaded');
    } catch (error) {
        console.error('Error loading header-sidebar:', error);
    }
}

/**
 * Enhanced initSidebar - overwrites the one from sidebar.js
 * Properly syncs the hamburger icon with sidebar state
 */
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const icon = sidebarToggle ? sidebarToggle.querySelector('i') : null;
    const hideSidebar = document.getElementById('hideSidebar');

    if (!sidebarToggle || !sidebar || !icon) {
        console.warn('Sidebar elements not found:', { sidebarToggle, sidebar, icon });
        return;
    }

    // Always start with hamburger icon (sidebar is hidden on page load)
    icon.setAttribute('class', 'fa-solid fa-bars text-2xl transition-all duration-300');

    // Toggle Sidebar - clicking hamburger icon
    sidebarToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        sidebar.classList.toggle('-translate-x-full');
        // Toggle the icon between menu bars and X
        if (sidebar.classList.contains('-translate-x-full')) {
            icon.setAttribute('class', 'fa-solid fa-bars text-2xl transition-all duration-300');
        } else {
            icon.setAttribute('class', 'fa-solid fa-xmark text-2xl transition-all duration-300');
        }
    });

    // Close sidebar - clicking the arrow button
    if (hideSidebar) {
        hideSidebar.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            icon.setAttribute('class', 'fa-solid fa-bars text-2xl transition-all duration-300');
        });
    }

    // Close sidebar when clicking outside
    document.addEventListener('click', (event) => {
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnToggle = sidebarToggle.contains(event.target);

        if (!isClickInsideSidebar && !isClickOnToggle) {
            sidebar.classList.add('-translate-x-full');
            icon.setAttribute('class', 'fa-solid fa-bars text-2xl transition-all duration-300');
        }
    });
}

/**
 * Setup sidebar navigation buttons
 * Uses data-section attribute to determine which section to open
 */
function setupSidebarButtons(isSettingsPage) {
    const buttons = document.querySelectorAll('[data-section]');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = btn.dataset.section;
            
            if (isSettingsPage) {
                // In settings page: redirect to dashboard with section preference
                localStorage.setItem('defaultSection', sectionId);
                location.href = 'admin_dashboard.html';
            } else {
                // In dashboard page: use showSection function
                if (typeof showSection === 'function') {
                    showSection(sectionId);
                }
                // Highlight active button
                setActiveButton(btn);
            }
        });
    });
}

/**
 * Set visual active state on the clicked button
 */
function setActiveButton(activeBtn) {
    const allButtons = document.querySelectorAll('[data-section]');
    allButtons.forEach(btn => {
        btn.classList.remove('bg-green-900', 'text-white');
        btn.classList.add('text-green-300');
    });
    
    // Highlight active button
    activeBtn.classList.add('bg-green-900', 'text-white');
    activeBtn.classList.remove('text-green-300');
}

/**
 * Secure logout: Clear localStorage before redirecting
 */
function setupLogout() {
    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to logout?")) {
                // Clear all admin session data
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUsername');
                localStorage.removeItem('defaultSection');
                // Optionally clear sessionStorage too
                sessionStorage.clear();
                // Redirect to login
                window.location.href = 'admin_signin.html';
            }
        });
    }
}

/**
 * Public function to update active button state (called by showSection)
 */
function updateActiveButtonState(sectionId) {
    const buttons = document.querySelectorAll('[data-section]');
    buttons.forEach(btn => {
        if (btn.dataset.section === sectionId) {
            setActiveButton(btn);
        }
    });
}
