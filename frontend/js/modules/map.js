// =======================
// MAP & GEOLOCATION MODULE
// =======================

export const initReportMap = () => {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    const mapCenter = [14.8705, 121.0022];
    const corner1 = L.latLng(14.84497, 120.97564);
    const corner2 = L.latLng(14.88497, 121.01564);
    const bounds = L.latLngBounds(corner1, corner2);

    const map = L.map('map', {
        center: mapCenter,
        zoom: 15,
        maxBounds: bounds,
        minZoom: 14
    });

    // Store map globally for form submission
    window.mapInstance = map;

    map.fitBounds(bounds);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    window.reportMarker = null;
    map.on('click', async (e) => {
        const { lat, lng } = e.latlng;

        if (bounds.contains(e.latlng)) {
            if (window.reportMarker) window.reportMarker.setLatLng([lat, lng]);
            else window.reportMarker = L.marker([lat, lng], { draggable: true }).addTo(map);

            document.getElementById('lat').value = lat;
            document.getElementById('lng').value = lng;

            // Reverse geocode
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await res.json();
                const addrText = data.display_name || `${lat}, ${lng}`;

                document.getElementById('address').value = addrText;
                document.getElementById('addressDisplay').textContent = addrText;
                document.getElementById('addressDisplay').classList.remove('text-gray-500', 'italic');
                document.getElementById('addressDisplay').classList.add('text-gray-800');
            } catch {
                const fallbackText = `${lat}, ${lng}`;
                document.getElementById('address').value = fallbackText;
                document.getElementById('addressDisplay').textContent = fallbackText;
            }
        }
    });

    return map;
};

export const clearReportMarker = () => {
    try {
        if (window.reportMarker && window.mapInstance) {
            window.mapInstance.removeLayer(window.reportMarker);
            window.reportMarker = null;
        }
    } catch (e) {}
    try {
        const addrEl = document.getElementById('addressDisplay');
        const addrInput = document.getElementById('address');
        const lat = document.getElementById('lat');
        const lng = document.getElementById('lng');
        if (addrEl && addrInput && !addrInput.value) {
            addrEl.textContent = 'Click the map to pin location...';
            addrEl.classList.remove('text-gray-800');
            addrEl.classList.add('text-gray-500', 'italic');
        }
        if (lat) lat.value = '';
        if (lng) lng.value = '';
        if (addrInput) addrInput.value = '';
    } catch (e) {}
};

export const initDefaultDate = () => {
    const dateInput = document.getElementById('dateSubmitted');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
        dateInput.readOnly = true;
    }
};
