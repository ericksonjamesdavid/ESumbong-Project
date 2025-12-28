// Function to load and initialize header
async function loadHeader() {
  const headerPlaceholder = document.getElementById('header-placeholder');
  if (!headerPlaceholder) return;
  
  try {
    const response = await fetch('templates/_header.html');
    const html = await response.text();
    headerPlaceholder.innerHTML = html;
    
    const menuBtn = document.getElementById('menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    if (menuBtn && mobileNav) {
      menuBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('hidden');
      });
    }

    const reportsBtn = document.getElementById('reports-btn');
    const reportsDropdown = document.getElementById('reports-dropdown');
    const chevron = document.getElementById('chevron');

    if (reportsBtn && reportsDropdown) {
      reportsBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        reportsDropdown.classList.toggle('hidden');
        chevron.classList.toggle('rotate-180');
      });

      document.addEventListener('click', (e) => {
        if (!reportsBtn.contains(e.target) && !reportsDropdown.contains(e.target)) {
          reportsDropdown.classList.add('hidden');
          chevron.classList.remove('rotate-180');
        }
      });
    }

    let currentPage = window.location.pathname.split("/").pop();
    if (currentPage === "") currentPage = "index.html";
    
    // Select links
    const desktopLinks = headerPlaceholder.querySelectorAll('.xl\\:flex a[href]');
    const mobileLinks = headerPlaceholder.querySelectorAll('#mobile-nav a[href]');
    const dropdownLinks = headerPlaceholder.querySelectorAll('#reports-dropdown a[href]');

    const allLinks = [...desktopLinks, ...mobileLinks, ...dropdownLinks];

    allLinks.forEach(link => {
      if (link.getAttribute('href') === currentPage) {
        link.classList.add('opacity-50', 'cursor-not-allowed');
        link.classList.remove('hover:text-white', 'hover:underline', 'hover:bg-green-700');
      }
    });

  } catch (error) {
    console.error('Failed to load header:', error);
  }
}

// Function to load footer
async function loadFooter() {
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (!footerPlaceholder) return;
  
  try {
    const response = await fetch('templates/_footer.html');
    const html = await response.text();
    footerPlaceholder.innerHTML = html;
  } catch (error) {
    console.error('Failed to load footer:', error);
  }
}

// Run both functions when the page loads
document.addEventListener('DOMContentLoaded', () => {
  loadHeader();
  loadFooter();
});
