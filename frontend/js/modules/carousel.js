// =======================
// NEWS CAROUSEL MODULE
// =======================

export const initNewsCarousel = () => {
    const carousel = document.getElementById('newsCarousel');
    if (!carousel) return;

    const totalSlides = carousel.children.length;
    const visibleSlides = 3;
    let index = 0;

    const updateCarousel = () => {
        carousel.style.transform = `translateX(-${index * (100 / visibleSlides)}%)`;
    };

    // Next button
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (index < totalSlides - visibleSlides) index++;
            else index = 0;
            updateCarousel();
        });
    }

    // Previous button
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (index > 0) index--;
            else index = totalSlides - visibleSlides;
            updateCarousel();
        });
    }

    // Auto-slide every 5 seconds
    setInterval(() => {
        if (index < totalSlides - visibleSlides) index++;
        else index = 0;
        updateCarousel();
    }, 5000);
};
