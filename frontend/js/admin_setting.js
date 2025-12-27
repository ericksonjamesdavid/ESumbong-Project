/**
 * Admin Settings Controller
 * Handles profile management, password updates, and account handover.
 * Refactored for maintainability and DRY (Don't Repeat Yourself) principles.
 */

// =============================================================================
// 1. SHARED UTILITIES & UI HELPERS
// =============================================================================

/**
 * Toggles the password input visibility and icon.
 */
function togglePassword(id, icon) {
  const input = document.getElementById(id);
  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    icon.classList.replace("fa-eye-slash", "fa-eye");
  } else {
    input.type = "password";
    icon.classList.replace("fa-eye", "fa-eye-slash");
  }
}

/**
 * Shared Helper: Toggles Green (Success) vs Red (Error) rings on inputs.
 * @param {HTMLElement} element - The input element
 * @param {boolean} isValid - True for Green, False for Red
 */
function toggleInputStatus(element, isValid) {
  if (!element) return;

  if (isValid) {
    // SUCCESS: Green Ring + Green Border
    element.classList.remove("focus:ring-red-500", "border-gray-200", "border-red-500");
    element.classList.add("focus:ring-green-500", "border-green-500");
  } else {
    // ERROR: Red Ring + Gray Border
    element.classList.remove("focus:ring-green-500", "border-green-500");
    element.classList.add("focus:ring-red-500", "border-gray-200");
  }
}

/**
 * Shared Helper: Manages Button Loading State
 */
function setButtonLoading(btn, isLoading, originalText = "", loadingText = "Processing...") {
  if (!btn) return;
  if (isLoading) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${loadingText}`;
    btn.classList.add('opacity-75', 'cursor-not-allowed');
  } else {
    btn.disabled = false;
    btn.innerText = originalText;
    btn.classList.remove('opacity-75', 'cursor-not-allowed');
  }
}

/**
 * Displays the main password error/success message.
 */
function showPasswordError(msg, isSuccess = false) {
  const passwordError = document.getElementById("passwordError");

  if (passwordError) {
    passwordError.className = ''; // Reset
    passwordError.innerHTML = `<span class="block sm:inline">${msg}</span>`;
    passwordError.classList.remove("hidden");

    if (isSuccess) {
      passwordError.classList.add('p-3', 'rounded', 'font-medium', 'bg-green-100', 'text-green-800', 'border', 'border-green-400');
    } else {
      passwordError.classList.add('p-3', 'rounded', 'font-medium', 'bg-red-100', 'text-red-800', 'border', 'border-red-400');
    }
  }
}

function hidePasswordError() {
  const passwordError = document.getElementById("passwordError");
  if (passwordError) {
    passwordError.classList.add("hidden");
  }
}

// =============================================================================
// 2. INITIALIZATION & PROFILE MANAGEMENT
// =============================================================================

function initSettings() {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    alert('Please log in to access Account Settings.');
    window.location.href = 'admin_signin.html';
    return;
  }
  loadAdminProfile();
}

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

  try {
    const response = await fetchWithAuth('/api/admin/profile', { method: 'GET' });

    if (!response || !response.ok) {
      setFallbackUI();
      return;
    }

    const result = await response.json();

    if (result.success && result.profile) {
      const displayName = result.profile.display_name || 'Super Admin';
      if (cardName) {
        cardName.textContent = displayName;
        cardName.classList.remove('animate-pulse');
      }
      localStorage.setItem('adminDisplayName', displayName);
    }
  } catch (error) {
    console.error('Error loading admin profile:', error);
    setFallbackUI();
  }
}

/**
 * Updates the admin's display name.
 * @param {string} displayName - The new name to save
 */
async function updateAdminProfile(displayName) {
  try {
    const response = await fetchWithAuth('/api/admin/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName })
    });

    if (!response) {
      alert('Server error occurred');
      return false;
    }

    const result = await response.json();

    if (result.success) {
      // Update the Identity Card UI immediately
      const cardName = document.getElementById('displayProfileName');
      if (cardName) cardName.textContent = displayName;

      // Update Local Storage
      localStorage.setItem('adminDisplayName', displayName);
      return true;
    } else {
      alert('Error: ' + result.message);
      return false;
    }
  } catch (error) {
    console.error('Error updating admin profile:', error);
    alert('Network error: Failed to update profile');
    return false;
  }
}

// =============================================================================
// 3. PERSONAL SECURITY (PASSWORD UPDATE)
// =============================================================================

/**
 * Handles the "Update Credentials" form submission.
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
    const response = await fetchWithAuth('/api/admin/update-password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: currentVal,
        newPassword: newPassVal,
        confirmPassword: confirmVal
      })
    });

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < 600) await new Promise(r => setTimeout(r, 600 - elapsedTime));

    if (!response) {
      setButtonLoading(btn, false, originalText);
      return;
    }

    let result = null;
    try { result = await response.json(); } catch (e) { }

    if (response.ok && result && result.success) {
      handlePasswordUpdateSuccess(btn, originalText, shouldLogout);
    } else {
      handlePasswordUpdateError(btn, originalText, response, result, currentInput);
    }

  } catch (error) {
    console.error('Error updating password:', error);
    showPasswordError(error.message || "An unexpected error occurred.");
    setButtonLoading(btn, false, originalText);
  }
}

// Helper: Handle Success
function handlePasswordUpdateSuccess(btn, originalText, shouldLogout) {
  const inputs = [
    document.getElementById("currentPass"),
    document.getElementById("newPass"),
    document.getElementById("confirmPass")
  ];

  inputs.forEach(el => {
    if (el) {
      el.value = "";
      // Reset rings to default (remove both green/red)
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

// Helper: Handle Error
function handlePasswordUpdateError(btn, originalText, response, result, currentInput) {
  let errorMsg = "Failed to update password";
  let isCurrentPassError = false;

  if (result && result.msg) {
    errorMsg = result.msg;
    if (errorMsg.toLowerCase().includes("current password") || errorMsg.toLowerCase().includes("incorrect")) {
      isCurrentPassError = true;
    }
  } else if (response.status === 401 || response.status === 403) {
    errorMsg = "Incorrect current password.";
    isCurrentPassError = true;
  } else if (response.status === 404) {
    errorMsg = "User not found.";
  } else if (response.status >= 500) {
    errorMsg = "Server error.";
  }

  if (isCurrentPassError && currentInput) {
    toggleInputStatus(currentInput, false); // Turn Red
    currentInput.classList.add("animate-pulse");
    setTimeout(() => currentInput.classList.remove("animate-pulse"), 500);
  }

  showPasswordError(errorMsg);
  setButtonLoading(btn, false, originalText);
}

// =============================================================================
// 4. ACCOUNT HANDOVER LOGIC (PIN & TRANSFER)
// =============================================================================

function confirmHandover() {
  document.getElementById('handoverPinInput').value = '';
  document.getElementById('handoverPinError').classList.add('hidden');
  const pinModal = document.getElementById('handoverPinModal');
  if (pinModal) {
    pinModal.classList.remove('hidden');
    document.getElementById('handoverPinInput').focus();
  }
}

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
    const response = await fetch('/api/admin/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', pin: pin })
    });

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < 600) await new Promise(resolve => setTimeout(resolve, 600 - elapsedTime));

    const result = await response.json();

    if (result.success) {
      closeHandoverPinModal();
      openHandoverModal();
    } else {
      errorMsg.textContent = result.message || "Invalid PIN.";
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

function openHandoverModal() {
  const inputIds = ['handoverFirstName', 'handoverLastName', 'handoverPass', 'handoverConfirm'];

  // Reset Inputs
  inputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = '';
      toggleInputStatus(el, false); // Set to default Red/Gray state
    }
  });

  document.getElementById('handoverError').classList.add('hidden');

  // Reset Rules Box
  const rulesList = document.getElementById('handoverRules');
  if (rulesList) {
    rulesList.classList.add('hidden');
    rulesList.classList.remove("bg-green-50", "border-green-100", "bg-red-50", "border-red-100");
    rulesList.classList.add("bg-gray-50", "border-gray-200");
  }

  // Reset Rule Text
  const ruleIds = ["h-rule-upper", "h-rule-lower", "h-rule-number", "h-rule-symbol"];
  ruleIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove("text-green-600", "font-bold", "text-red-500");
      el.classList.add("text-gray-500");
      const icon = el.querySelector("i");
      if (icon) icon.classList.remove("text-green-600");
    }
  });

  const modal = document.getElementById('handoverModal');
  if (modal) modal.classList.remove('hidden');
}

function closeHandoverModal() {
  const modal = document.getElementById('handoverModal');
  if (modal) modal.classList.add('hidden');
}

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
    const response = await fetchWithAuth('/api/admin/handover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newDisplayName: fullName, newPassword: pass })
    });

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < 600) await new Promise(r => setTimeout(r, 600 - elapsedTime));

    if (!response) throw new Error("Server error");
    const result = await response.json();

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
// 5. EVENT LISTENERS (REAL-TIME VALIDATION)
// =============================================================================

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

  // Helper for text rules in modal
  const setModalRuleStatus = (element, isValid) => {
    if (!element) return false;
    const icon = element.querySelector("i");
    if (isValid) {
      element.classList.remove("text-gray-500", "text-red-500");
      element.classList.add("text-green-600", "font-bold");
      if (icon) icon.classList.add("text-green-600");
    } else {
      element.classList.remove("text-green-600", "font-bold");
      element.classList.add("text-red-500");
      if (icon) icon.classList.remove("text-green-600");
    }
    return isValid;
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
      hRulesList.classList.remove("bg-red-50", "border-red-100", "bg-gray-50", "border-gray-200", "bg-green-50", "border-green-100");
      if (allValid) {
        hRulesList.classList.add("bg-green-50", "border-green-100");
      } else {
        hRulesList.classList.add("bg-red-50", "border-red-100");
      }

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
// 6. BOOTSTRAP
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