/**
 * AuthService - Handles all authentication API calls
 * Does not interact with the DOM - only communicates with the server
 */
const AuthService = {
    /**
     * Login with username and password
     * @param {string} username - Admin username
     * @param {string} password - Admin password
     * @returns {Promise<Object>} Response from server
     */
    login: async (username, password) => {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return await response.json();
    },

    /**
     * Verify if username exists in the system
     * @param {string} username - Admin username to verify
     * @returns {Promise<Object>} Response from server
     */
    verifyUsername: async (username) => {
        const response = await fetch('/api/admin/verify-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        return await response.json();
    },

    /**
     * Verify the 4-digit master PIN
     * Security: Sends both username and PIN to ensure proper verification
     * @param {string} username - Admin username
     * @param {string} pin - 4-digit master PIN
     * @returns {Promise<Object>} Response from server
     */
    verifyPin: async (username, pin) => {
        const response = await fetch('/api/admin/verify-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, pin })
        });
        return await response.json();
    },

    /**
     * Reset password using verified PIN
     * @param {string} username - Admin username
     * @param {string} pin - Verified 4-digit master PIN
     * @param {string} newPassword - New password to set
     * @returns {Promise<Object>} Response from server
     */
    resetPassword: async (username, pin, newPassword) => {
        const response = await fetch('/api/admin/reset-password-via-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, pin, newPassword })
        });
        return await response.json();
    }
};

export default AuthService;
