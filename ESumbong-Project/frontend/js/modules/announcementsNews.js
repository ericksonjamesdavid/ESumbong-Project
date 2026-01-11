// =======================
// ANNOUNCEMENTS & NEWS MODULE (User-facing)
// =======================

export const initAnnouncementsAndNews = async () => {
    // Fetch announcements
    const announcementsContainer = document.getElementById('announcementsGrid');
    if (announcementsContainer) {
        try {
            const response = await fetch('/api/announcements');
            const data = await response.json();
            if (data.success && Array.isArray(data.announcements)) {
                renderAnnouncements(data.announcements, announcementsContainer);
            }
        } catch (error) {
            console.error('Error fetching announcements:', error);
        }
    }

    // Fetch news
    const newsCarousel = document.getElementById('newsCarousel');
    if (newsCarousel) {
        try {
            const response = await fetch('/api/news');
            const data = await response.json();
            if (data.success && Array.isArray(data.news)) {
                renderNews(data.news, newsCarousel);
                // Initialize carousel controls after rendering
                initCarouselSliding();
            }
        } catch (error) {
            console.error('Error fetching news:', error);
        }
    }
};

function renderAnnouncements(announcements, container) {
    container.innerHTML = '';
    announcements.slice(0, 3).forEach(announcement => {
        const div = document.createElement('div');
        div.className = 'bg-white shadow-md rounded-xl p-6 hover:shadow-xl transition flex flex-col justify-between h-full';
        div.innerHTML = `
            <h4 class="text-xl font-semibold text-green-800 mb-2">${escapeHtml(announcement.title)}</h4>
            <p class="text-gray-600 mb-4 flex-grow">${escapeHtml(announcement.description)}</p>
            <div class="border-t pt-2 bg-gray-50 mt-auto">
                <p class="text-sm text-gray-500">Posted: ${escapeHtml(announcement.date)}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderNews(newsArticles, carousel) {
    carousel.innerHTML = '';
    newsArticles.forEach(article => {
        const link = document.createElement('a');
        link.href = article.linkUrl || '#';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'flex-shrink-0 w-full md:w-1/3 p-3';
        link.innerHTML = `
            <div class="bg-white shadow-md rounded-xl overflow-hidden flex flex-col h-full hover:shadow-lg transition">
                <img src="${escapeHtml(article.imageUrl)}" alt="${escapeHtml(article.title)}" class="w-full h-48 object-cover" onerror="this.src='Images/Logo.png'">
                <div class="p-5 flex flex-col flex-grow">
                    <h3 class="text-lg font-semibold text-green-800 mb-2">${escapeHtml(article.title)}</h3>
                    <p class="text-gray-600 text-sm mb-4 flex-grow">
                        ${escapeHtml(article.description)}
                    </p>
                </div>
                <div class="border-t px-5 py-3 bg-gray-50">
                    <p class="text-sm text-gray-500">Posted: ${escapeHtml(article.date)}</p>
                </div>
            </div>
        `;
        carousel.appendChild(link);
    });
}

function initCarouselSliding() {
    const track = document.getElementById('newsCarousel');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    // Safety check
    if (!track || !prevBtn || !nextBtn || track.children.length === 0) return;

    let currentIndex = 0;
    
    // Determine how many cards are visible at once (Mobile: 1, Desktop: 3)
    const getItemsPerView = () => window.innerWidth < 768 ? 1 : 3;
    
    const updateCarousel = () => {
        const itemWidth = track.children[0].getBoundingClientRect().width;
        track.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
    };

    // NEXT Button
    nextBtn.addEventListener('click', () => {
        const itemsPerView = getItemsPerView();
        // Stop scrolling when we reach the last group of items
        const maxIndex = track.children.length - itemsPerView;
        
        if (currentIndex < maxIndex) {
            currentIndex++;
        } else {
            currentIndex = 0; // Loop back to start
        }
        updateCarousel();
    });

    // PREV Button
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            // Loop to end
            const itemsPerView = getItemsPerView();
            currentIndex = Math.max(0, track.children.length - itemsPerView);
        }
        updateCarousel();
    });

    window.addEventListener('resize', () => {
        currentIndex = 0;
        updateCarousel();
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
