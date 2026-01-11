// =============================
// JWT TOKEN MANAGEMENT
// =============================

/**
 * Store JWT token in localStorage after login
 * @param {string} token - JWT token from login response
 */
function storeJWTToken(token) {
    localStorage.setItem('adminToken', token);
}

/**
 * Retrieve JWT token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
function getJWTToken() {
    return localStorage.getItem('adminToken');
}

/**
 * Remove JWT token from localStorage (logout)
 */
function removeJWTToken() {
    localStorage.removeItem('adminToken');
}

/**
 * Fetch with Authorization header
 * Automatically includes JWT token in Authorization header for admin API calls
 * @param {string} url - API endpoint
 * @param {object} options - fetch options (method, body, etc.)
 * @returns {Promise} fetch response
 */
async function fetchWithAuth(url, options = {}) {
    const token = getJWTToken();
    
    // Add Authorization header if token exists
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }

    try {
        const response = await fetch(url, options);

        // If token expired (401), redirect to login
        if (response.status === 401) {
            const data = await response.json();
            if (data.message === 'Token expired. Please login again.' || 
                data.message === 'Invalid token. Access denied.') {
                removeJWTToken();
                alert('Session expired. Please login again.');
                window.location.href = '/admin_components/admin_signin.html';
                return null;
            }
        }

        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// =============================
// GLOBAL WINDOW EXPORTS (for backward compatibility with script tag loading)
// =============================
// When auth.js is loaded as a global script tag, expose functions to window
if (typeof window !== 'undefined') {
    window.storeJWTToken = storeJWTToken;
    window.getJWTToken = getJWTToken;
    window.removeJWTToken = removeJWTToken;
    window.fetchWithAuth = fetchWithAuth;
}
