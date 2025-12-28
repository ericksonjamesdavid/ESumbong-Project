/**
 * Settings Controller Module
 * Connects HTML to UI utilities and backend services
 * Orchestrates the flow of admin settings operations
 */

// Import UI utilities
import {
  togglePassword,
  toggleInputStatus,
  setButtonLoading,
  showPasswordError,
  hidePasswordError,
  setModalRuleStatus,
  resetHandoverModal,
  updateHandoverRulesBox
} from '../utils/ui.js';

// Import Admin Service
import {
  fetchAdminProfile,
  updateAdminProfileAPI,
  updatePasswordAPI,
  verifyHandoverPinAPI,
  submitHandoverAPI
} from '../services/admin.service.js';

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes the settings page
 * Checks authentication and loads admin profile
 */
function initSettings() {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    alert('Please log in to access Account Settings.');
    window.location.href = 'admin_signin.html';
    return;
  }
  loadAdminProfile();
}

/**
 * Loads and displays the admin's profile
 */
async function loadAdminProfile() {
  const cardName = document.getElementById('displayProfileName');
  const savedName = localStorage.getItem('adminDisplayName');

  // Helper to set fallback UI
  const setFallbackUI = () => {
    if (cardName) {
      cardName.textContent = savedName || 'Super Admin';
      cardName.classList.remove('animate-pulse');
    }
  };

  const profile = await fetchAdminProfile();

  if (profile) {
    const displayName = profile.display_name || 'Super Admin';
    if (cardName) {
      cardName.textContent = displayName;
      cardName.classList.remove('animate-pulse');
    }
    localStorage.setItem('adminDisplayName', displayName);
  } else {
    setFallbackUI();
  }
}

/**
 * Updates the admin's display name
 * @param {string} displayName - The new display name
 * @returns {Promise<boolean>} True if successful
 */
async function updateAdminProfile(displayName) {
  const success = await updateAdminProfileAPI(displayName);

  if (success) {
    // Update the Identity Card UI immediately
    const cardName = document.getElementById('displayProfileName');
    if (cardName) cardName.textContent = displayName;

    // Update Local Storage
    localStorage.setItem('adminDisplayName', displayName);
    return true;
  } else {
    alert('Error updating profile');
    return false;
  }
}

// =============================================================================
// PERSONAL SECURITY (PASSWORD UPDATE)
// =============================================================================

/**
 * Handles the "Update Credentials" form submission
 */
async function updatePassword() {
  const btn = document.querySelector('button[onclick="updatePassword()"]');
  const originalText = btn.innerText;

  hidePasswordError();
  const matchError = document.getElementById("matchError");
  if (matchError) matchError.classList.add('hidden');

  const currentInput = document.getElementById("currentPass");
  const newPassVal = document.getElementById("newPass").value;
  const confirmVal = document.getElementById("confirmPass").value;
  const currentVal = currentInput.value;
  const shouldLogout = document.getElementById("logoutAfterUpdate").checked;

  // Validation
  if (!currentVal || !newPassVal || !confirmVal) {
    return showPasswordError("All fields are required");
  }
  if (newPassVal !== confirmVal) {
    if (matchError) matchError.classList.remove('hidden');
    return showPasswordError("Passwords do not match");
  }

  const pattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!pattern.test(newPassVal)) {
    return showPasswordError("Password does not meet security requirements.");
  }

  // Loading State
  setButtonLoading(btn, true, originalText, "Updating...");

  try {
    const startTime = Date.now();
    const result = await updatePasswordAPI(currentVal, newPassVal, confirmVal);
    const elapsedTime = Date.now() - startTime;
    
    if (elapsedTime < 600) await new Promise(r => setTimeout(r, 600 - elapsedTime));

    if (result.success) {
      handlePasswordUpdateSuccess(btn, originalText, shouldLogout);
    } else {
      handlePasswordUpdateError(btn, originalText, result, currentInput);
    }
  } catch (error) {
    console.error('Error updating password:', error);
    showPasswordError(error.message || "An unexpected error occurred.");
    setButtonLoading(btn, false, originalText);
  }
}

/**
 * Handles successful password update
 * @param {HTMLElement} btn - The submit button
 * @param {string} originalText - Original button text
 * @param {boolean} shouldLogout - Whether to logout after update
 */
function handlePasswordUpdateSuccess(btn, originalText, shouldLogout) {
  const inputs = [
    document.getElementById("currentPass"),
    document.getElementById("newPass"),
    document.getElementById("confirmPass")
  ];

  inputs.forEach(el => {
    if (el) {
      el.value = "";
      // Reset rings to default
      el.classList.remove("focus:ring-green-500", "border-green-500", "focus:ring-red-500", "border-red-500");
      el.classList.add("focus:ring-green-500", "border-gray-200");
    }
  });

  if (document.getElementById("passwordRules")) {
    document.getElementById("passwordRules").classList.add("hidden");
  }

  if (shouldLogout) {
    showPasswordError("Password updated! Redirecting to login...", true);
    setTimeout(() => { window.location.href = "admin_signin.html"; }, 2000);
  } else {
    showPasswordError("Password updated successfully!", true);
    setButtonLoading(btn, false, originalText);
    setTimeout(() => hidePasswordError(), 5000);
  }
}

/**
 * Handles password update error
 * @param {HTMLElement} btn - The submit button
 * @param {string} originalText - Original button text
 * @param {Object} result - API response
 * @param {HTMLElement} currentInput - Current password input element
 */
function handlePasswordUpdateError(btn, originalText, result, currentInput) {
  let errorMsg = result.message || "Failed to update password";
  const isCurrentPassError = result.isCurrentPassError || false;

  if (isCurrentPassError && currentInput) {
    toggleInputStatus(currentInput, false); // Turn Red
    currentInput.classList.add("animate-pulse");
    setTimeout(() => currentInput.classList.remove("animate-pulse"), 500);
  }

  showPasswordError(errorMsg);
  setButtonLoading(btn, false, originalText);
}

// =============================================================================
// ACCOUNT HANDOVER - PIN VERIFICATION
// =============================================================================

/**
 * Opens the PIN verification modal
 */
function confirmHandover() {
  document.getElementById('handoverPinInput').value = '';
  document.getElementById('handoverPinError').classList.add('hidden');
  const pinModal = document.getElementById('handoverPinModal');
  if (pinModal) {
    pinModal.classList.remove('hidden');
    document.getElementById('handoverPinInput').focus();
  }
}

/**
 * Verifies the handover PIN
 */
async function verifyHandoverPin() {
  const pin = document.getElementById('handoverPinInput').value;
  const errorMsg = document.getElementById('handoverPinError');
  const btn = document.querySelector('#handoverPinModal button[onclick="verifyHandoverPin()"]');
  const originalText = btn.innerText;

  errorMsg.classList.add('hidden');
  errorMsg.textContent = '';

  if (!pin || pin.length !== 4) {
    errorMsg.textContent = "Please enter a valid 4-digit PIN.";
    errorMsg.classList.remove('hidden');
    return;
  }

  setButtonLoading(btn, true, originalText, "Verifying...");

  try {
    const startTime = Date.now();
    const result = await verifyHandoverPinAPI(pin);
    const elapsedTime = Date.now() - startTime;
    
    if (elapsedTime < 600) await new Promise(resolve => setTimeout(resolve, 600 - elapsedTime));

    if (result.success) {
      closeHandoverPinModal();
      openHandoverModal();
    } else {
      errorMsg.textContent = result.message;
      errorMsg.classList.remove('hidden');
      setButtonLoading(btn, false, originalText);
    }
  } catch (error) {
    console.error("PIN verification error:", error);
    errorMsg.textContent = "Network error. Please try again.";
    errorMsg.classList.remove('hidden');
    setButtonLoading(btn, false, originalText);
  }
}

/**
 * Closes the PIN verification modal
 */
function closeHandoverPinModal() {
  const pinModal = document.getElementById('handoverPinModal');
  if (pinModal) {
    pinModal.classList.add('hidden');
    // Reset button state
    const btn = document.querySelector('#handoverPinModal button[onclick="verifyHandoverPin()"]');
    if (btn) setButtonLoading(btn, false, 'Verify PIN');

    document.getElementById('handoverPinInput').value = '';
    const errorMsg = document.getElementById('handoverPinError');
    if (errorMsg) {
      errorMsg.classList.add('hidden');
      errorMsg.textContent = '';
    }
  }
}

// =============================================================================
// ACCOUNT HANDOVER - MODAL MANAGEMENT
// =============================================================================

/**
 * Opens the handover modal after PIN verification
 */
function openHandoverModal() {
  resetHandoverModal();
  const modal = document.getElementById('handoverModal');
  if (modal) modal.classList.remove('hidden');
}

/**
 * Closes the handover modal
 */
function closeHandoverModal() {
  const modal = document.getElementById('handoverModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Submits the account handover
 */
async function submitHandover() {
  const fName = document.getElementById('handoverFirstName').value.trim();
  const lName = document.getElementById('handoverLastName').value.trim();
  const pass = document.getElementById('handoverPass').value;
  const confirmPass = document.getElementById('handoverConfirm').value;
  const errorMsg = document.getElementById('handoverError');
  const btn = document.querySelector('#handoverModal button[onclick="submitHandover()"]');
  const originalText = btn.innerText;

  errorMsg.classList.add('hidden');
  errorMsg.textContent = '';

  // Validations
  if (!fName || !lName || !pass || !confirmPass) {
    errorMsg.textContent = "Please fill in all fields (First & Last Name required).";
    errorMsg.classList.remove('hidden');
    return;
  }

  const namePattern = /^[a-zA-Z\s\-]+$/;
  if (!namePattern.test(fName) || !namePattern.test(lName)) {
    errorMsg.textContent = "Names should only contain letters, spaces, and hyphens.";
    errorMsg.classList.remove('hidden');
    return;
  }

  if (pass !== confirmPass) {
    errorMsg.textContent = "Passwords do not match.";
    errorMsg.classList.remove('hidden');
    return;
  }

  if (pass.length < 8) {
    errorMsg.textContent = "Password must be at least 8 characters.";
    errorMsg.classList.remove('hidden');
    return;
  }

  const complexityPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!complexityPattern.test(pass)) {
    errorMsg.textContent = "Password must contain: Uppercase, Lowercase, Number, and a Symbol.";
    errorMsg.classList.remove('hidden');
    return;
  }

  const fullName = `${fName} ${lName}`;

  if (!window.confirm(`Transfer account to "${fullName}"? You will be logged out.`)) {
    return;
  }

  // API Call
  setButtonLoading(btn, true, originalText, "Transferring...");

  try {
    const startTime = Date.now();
    const result = await submitHandoverAPI(fullName, pass);
    const elapsedTime = Date.now() - startTime;
    
    if (elapsedTime < 600) await new Promise(r => setTimeout(r, 600 - elapsedTime));

    if (result.success) {
      localStorage.setItem('adminDisplayName', fullName);
      localStorage.removeItem('authToken');
      alert(`Handover Complete!\n\nWelcome, ${fullName}.\nRedirecting to login...`);
      window.location.href = 'admin_signin.html';
    } else {
      throw new Error(result.message || "Handover failed");
    }
  } catch (error) {
    console.error("Handover error:", error);
    errorMsg.textContent = error.message || "Network error during handover.";
    errorMsg.classList.remove('hidden');
    setButtonLoading(btn, false, originalText);
  }
}

// =============================================================================
// EVENT LISTENERS - REAL-TIME VALIDATION
// =============================================================================

/**
 * Sets up listeners for password update form real-time validation
 */
function setupPersonalSecurityListeners() {
  const newPassInput = document.getElementById("newPass");
  const confirmPassInput = document.getElementById("confirmPass");
  const currentPassInput = document.getElementById("currentPass");
  const matchError = document.getElementById("matchError");
  const passwordRulesList = document.getElementById("passwordRules");

  const rules = {
    length: document.getElementById("rule-length"),
    upper: document.getElementById("rule-upper"),
    lower: document.getElementById("rule-lower"),
    number: document.getElementById("rule-number"),
    symbol: document.getElementById("rule-symbol")
  };

  const checkMatch = () => {
    if (!newPassInput || !confirmPassInput || !matchError) return;
    if (confirmPassInput.value && newPassInput.value !== confirmPassInput.value) {
      matchError.classList.remove("hidden");
    } else {
      matchError.classList.add("hidden");
    }
  };

  // 1. Current Password
  if (currentPassInput) {
    currentPassInput.addEventListener("input", () => {
      toggleInputStatus(currentPassInput, currentPassInput.value.trim().length > 0);
    });
  }

  // 2. New Password
  if (newPassInput) {
    newPassInput.addEventListener("focus", () => passwordRulesList?.classList.remove("hidden"));
    newPassInput.addEventListener("blur", () => {
      if (newPassInput.value === "") passwordRulesList?.classList.add("hidden");
    });

    newPassInput.addEventListener("input", () => {
      const val = newPassInput.value;
      const isLength = val.length >= 8;
      const isUpper = /[A-Z]/.test(val);
      const isLower = /[a-z]/.test(val);
      const isNumber = /\d/.test(val);
      const isSymbol = /[^A-Za-z0-9]/.test(val);

      if (rules.length) rules.length.style.color = isLength ? "green" : "red";
      if (rules.upper) rules.upper.style.color = isUpper ? "green" : "red";
      if (rules.lower) rules.lower.style.color = isLower ? "green" : "red";
      if (rules.number) rules.number.style.color = isNumber ? "green" : "red";
      if (rules.symbol) rules.symbol.style.color = isSymbol ? "green" : "red";

      checkMatch();

      const allValid = isLength && isUpper && isLower && isNumber && isSymbol;
      toggleInputStatus(newPassInput, allValid);

      if (confirmPassInput && confirmPassInput.value) {
        toggleInputStatus(confirmPassInput, confirmPassInput.value === val);
      }
    });
  }

  // 3. Confirm Password
  if (confirmPassInput) {
    confirmPassInput.addEventListener("input", () => {
      checkMatch();
      const match = confirmPassInput.value === newPassInput.value && confirmPassInput.value.length > 0;
      toggleInputStatus(confirmPassInput, match);
    });
  }
}

/**
 * Sets up listeners for handover modal real-time validation
 */
function setupHandoverListeners() {
  const hFName = document.getElementById("handoverFirstName");
  const hLName = document.getElementById("handoverLastName");
  const hPass = document.getElementById("handoverPass");
  const hConfirm = document.getElementById("handoverConfirm");
  const hRulesList = document.getElementById("handoverRules");

  const rulesElements = {
    upper: document.getElementById("h-rule-upper"),
    lower: document.getElementById("h-rule-lower"),
    number: document.getElementById("h-rule-number"),
    symbol: document.getElementById("h-rule-symbol")
  };

  const nameRegex = /^[a-zA-Z\s\-]+$/;

  // 1. Name Inputs
  [hFName, hLName].forEach(input => {
    if (input) {
      input.addEventListener("input", () => {
        const val = input.value.trim();
        toggleInputStatus(input, val.length > 0 && nameRegex.test(val));
      });
    }
  });

  // 2. Password Input
  if (hPass && hRulesList) {
    hPass.addEventListener("focus", () => hRulesList.classList.remove("hidden"));
    hPass.addEventListener("blur", () => {
      if (hPass.value === "") hRulesList.classList.add("hidden");
    });

    hPass.addEventListener("input", () => {
      const val = hPass.value;

      const isUpper = setModalRuleStatus(rulesElements.upper, /[A-Z]/.test(val));
      const isLower = setModalRuleStatus(rulesElements.lower, /[a-z]/.test(val));
      const isNumber = setModalRuleStatus(rulesElements.number, /\d/.test(val));
      const isSymbol = setModalRuleStatus(rulesElements.symbol, /[^A-Za-z0-9]/.test(val));
      const isLength = val.length >= 8;

      const allValid = isUpper && isLower && isNumber && isSymbol && isLength;

      // Update Box Background
      updateHandoverRulesBox(allValid);
      toggleInputStatus(hPass, allValid);

      if (hConfirm && hConfirm.value) {
        toggleInputStatus(hConfirm, hConfirm.value === val);
      }
    });
  }

  // 3. Confirm Input
  if (hConfirm) {
    hConfirm.addEventListener("input", () => {
      const match = hConfirm.value === hPass.value && hConfirm.value.length > 0;
      toggleInputStatus(hConfirm, match);
    });
  }
}

// =============================================================================
// BOOTSTRAP
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the sidebar logic from sidebar.js
  if (typeof initSidebar === 'function') {
    initSidebar();
  }

  initSettings();
  setupPersonalSecurityListeners();
  setupHandoverListeners();
});

// Export functions for global access
export {
  initSettings,
  loadAdminProfile,
  updateAdminProfile,
  updatePassword,
  handlePasswordUpdateSuccess,
  handlePasswordUpdateError,
  confirmHandover,
  verifyHandoverPin,
  closeHandoverPinModal,
  openHandoverModal,
  closeHandoverModal,
  submitHandover,
  setupPersonalSecurityListeners,
  setupHandoverListeners
};

// =============================================================================
// EXPOSE TO WINDOW (Required for HTML onclick="" attributes with ES6 modules)
// =============================================================================
window.initSettings = initSettings;
window.loadAdminProfile = loadAdminProfile;
window.updateAdminProfile = updateAdminProfile;
window.updatePassword = updatePassword;
window.confirmHandover = confirmHandover;
window.verifyHandoverPin = verifyHandoverPin;
window.closeHandoverPinModal = closeHandoverPinModal;
window.openHandoverModal = openHandoverModal;
window.closeHandoverModal = closeHandoverModal;
window.submitHandover = submitHandover;
window.togglePassword = togglePassword; // Imported from UI but needs to be global for HTML
