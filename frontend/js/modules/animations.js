// =======================
// ANIMATION & UI UTILITIES
// =======================

// Fade in animation observer
export const initAnimationObserver = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
};

// Fade in home section and highlight current page
export const initHomePageSetup = () => {
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
};
