/**
 * Load shared header and sidebar template
 * Call this in your HTML's DOMContentLoaded event
 */
async function loadHeaderSidebar(pageTitle = 'Admin Dashboard') {
    try {
        console.log('Loading header-sidebar from: /admin_components/header-sidebar.html');
        const response = await fetch('/admin_components/header-sidebar.html');
        
        if (!response.ok) {
            throw new Error(`Failed to fetch sidebar.html: ${response.status} ${response.statusText}`);
        }
        
        const html = await response.text();
        console.log('HTML fetched successfully. Length:', html.length);
        
        // Insert at the beginning of body
        const body = document.body;
        body.insertAdjacentHTML('afterbegin', html);
        console.log('HTML inserted into DOM');
        
        // Verify elements were inserted
        const sidebarCheck = document.getElementById('sidebar');
        const toggleCheck = document.getElementById('sidebarToggle');
        console.log('Element verification after insert:', { sidebar: !!sidebarCheck, toggle: !!toggleCheck });
        
        if (!sidebarCheck) {
            console.error('Sidebar element not found after insertion. HTML may not have loaded properly.');
            return;
        }
        
        // Set page title
        const titleEl = document.getElementById('pageTitle');
        if (titleEl) {
            titleEl.textContent = pageTitle;
        }
        
        // Setup sidebar buttons based on current page
        const isSettingsPage = pageTitle === 'Account Settings';
        setupSidebarButtons(isSettingsPage);
        setupAccountSettingsButton(isSettingsPage);
        setupLogout();
        
        // Initialize sidebar AFTER template is injected
        if (typeof initSidebar === 'function') {
            initSidebar();
        }
        
        console.log('Header & Sidebar loaded successfully');
    } catch (error) {
        console.error('Error loading header-sidebar:', error);
    }
}

/**
 * Enhanced initSidebar - properly syncs hamburger icon with sidebar state
 */
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const icon = sidebarToggle ? sidebarToggle.querySelector('i') : null;
    const hideSidebar = document.getElementById('hideSidebar');

    if (!sidebarToggle || !sidebar || !icon) {
        console.warn('Sidebar elements not found. Retrying in 100ms...', { sidebarToggle, sidebar, icon });
        // Retry after a short delay
        setTimeout(initSidebar, 100);
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
    
    console.log('Sidebar initialized successfully');
}

/**
 * Show/hide sections and close sidebar
 */
function showSection(sectionId) {
    // Get sidebar element so we can close it
    const sidebar = document.getElementById('sidebar');

    const sections = ['sectionAnnouncements', 'sectionCharts', 'sectionReports', 'sectionAuditLog', 'sectionSuggestions'];

    sections.forEach(sec => {
        const el = document.getElementById(sec);
        if (el) el.style.display = (sec === sectionId) ? 'block' : 'none';
    });

    if (sidebar) {
        sidebar.classList.add('-translate-x-full');
        
        // Reset the icon back to hamburger bars when sidebar closes
        const sidebarToggle = document.getElementById('sidebarToggle');
        const icon = sidebarToggle ? sidebarToggle.querySelector('i') : null;
        if (icon) {
            icon.setAttribute('class', 'fa-solid fa-bars text-2xl transition-all duration-300');
        }
    }
    
    // Update active button highlight via headerLoader.js styling
    if (typeof updateActiveButtonState === 'function') {
        updateActiveButtonState(sectionId);
    }
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
            
            // Prevent action if button is already disabled (already on this section)
            if (btn.disabled) {
                return;
            }
            
            if (isSettingsPage) {
                // In settings page: redirect to dashboard with section preference
                localStorage.setItem('defaultSection', sectionId);
                location.href = '/admin_components/admin_dashboard.html';
            } else {
                // In dashboard page: use showSection function
                if (typeof showSection === 'function') {
                    showSection(sectionId);
                }
                // Highlight active button and disable it
                setActiveButton(btn);
            }
        });
    });
}

/**
 * Setup Account Settings button - disable when already on settings page
 */
function setupAccountSettingsButton(isSettingsPage) {
    const settingsLink = document.querySelector('a[href="/admin_components/admin_settings.html"]');
    
    if (settingsLink && isSettingsPage) {
        // We're on the settings page - disable the link
        settingsLink.style.pointerEvents = 'none';
        settingsLink.style.opacity = '0.7';
        settingsLink.style.cursor = 'not-allowed';
        settingsLink.classList.add('opacity-70', 'cursor-not-allowed');
    }
}

/**
 * Set visual active state on the clicked button
 */
function setActiveButton(activeBtn) {
    const allButtons = document.querySelectorAll('[data-section]');
    allButtons.forEach(btn => {
        if (btn === activeBtn) {
            // This is the active button - disable it
            btn.disabled = true;
            btn.classList.remove('text-green-300');
            btn.classList.add('bg-green-900', 'text-white', 'opacity-70', 'cursor-not-allowed');
        } else {
            // Other buttons - enable them
            btn.disabled = false;
            btn.classList.add('text-green-300');
            btn.classList.remove('bg-green-900', 'text-white', 'opacity-70', 'cursor-not-allowed');
        }
    });
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
                window.location.href = '/admin_components/admin_signin.html';
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
