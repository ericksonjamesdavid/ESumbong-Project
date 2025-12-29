/**
 * Admin Service Module
 * Handles all backend API calls for admin settings
 * Communicates with the server for profile, password, and handover operations
 */

// =============================================================================
// PROFILE MANAGEMENT
// =============================================================================

/**
 * Fetches the admin's profile from the backend
 * @returns {Promise<Object>} Profile data or null if error
 */
async function fetchAdminProfile() {
  try {
    const response = await fetchWithAuth('/api/admin/profile', { method: 'GET' });

    if (!response || !response.ok) {
      return null;
    }

    const result = await response.json();

    if (result.success && result.profile) {
      return result.profile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    return null;
  }
}

/**
 * Updates the admin's display name on the backend
 * @param {string} displayName - The new display name
 * @returns {Promise<boolean>} True if successful
 */
async function updateAdminProfileAPI(displayName) {
  try {
    const response = await fetchWithAuth('/api/admin/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName })
    });

    if (!response) {
      console.error('Server error occurred');
      return false;
    }

    const result = await response.json();

    if (result.success) {
      return true;
    } else {
      console.error('Error updating profile:', result.message);
      return false;
    }
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return false;
  }
}

// =============================================================================
// PASSWORD MANAGEMENT
// =============================================================================

/**
 * Updates the admin's password on the backend
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @param {string} confirmPassword - Confirmation password
 * @returns {Promise<Object>} Response with success status and message
 */
async function updatePasswordAPI(currentPassword, newPassword, confirmPassword) {
  try {
    const response = await fetchWithAuth('/api/admin/update-password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword
      })
    });

    if (!response) {
      return { success: false, message: 'Server error occurred' };
    }

    let result = null;
    try {
      result = await response.json();
    } catch (e) {
      console.error('Failed to parse response:', e);
    }

    // Return formatted response
    if (response.ok && result && result.success) {
      return { success: true, message: 'Password updated successfully' };
    } else {
      const errorMsg = result?.msg || 'Failed to update password';
      return {
        success: false,
        message: errorMsg,
        isCurrentPassError: response.status === 400 || response.status === 401,
        status: response.status
      };
    }
  } catch (error) {
    console.error('Error updating password:', error);
    return { success: false, message: error.message || 'An unexpected error occurred.' };
  }
}

// =============================================================================
// ACCOUNT HANDOVER
// =============================================================================

/**
 * Verifies the handover PIN
 * @param {string} pin - The 4-digit PIN
 * @returns {Promise<Object>} Response with success status
 */
async function verifyHandoverPinAPI(pin) {
  try {
    const response = await fetch('/api/admin/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', pin })
    });

    const result = await response.json();

    if (result.success) {
      return { success: true };
    } else {
      return { success: false, message: result.message || 'Invalid PIN.' };
    }
  } catch (error) {
    console.error('PIN verification error:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
}

/**
 * Submits the account handover to the backend
 * @param {string} newDisplayName - The new admin's full name
 * @param {string} newPassword - The new admin's password
 * @returns {Promise<Object>} Response with success status and message
 */
async function submitHandoverAPI(newDisplayName, newPassword) {
  try {
    const response = await fetchWithAuth('/api/admin/handover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newDisplayName, newPassword })
    });

    if (!response) {
      return { success: false, message: 'Server error occurred' };
    }

    const result = await response.json();

    if (result.success) {
      return { success: true, message: 'Handover completed successfully' };
    } else {
      return { success: false, message: result.message || 'Handover failed' };
    }
  } catch (error) {
    console.error('Handover error:', error);
    return { success: false, message: error.message || 'Network error during handover.' };
  }
}

// Export functions for ES6 modules
export {
  fetchAdminProfile,
  updateAdminProfileAPI,
  updatePasswordAPI,
  verifyHandoverPinAPI,
  submitHandoverAPI
};
