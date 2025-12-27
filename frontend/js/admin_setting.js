document.getElementById("sidebarToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("-translate-x-full");
});

// Hide sidebar when clicking the arrow icon
const hideSidebar = document.getElementById('hideSidebar');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

if (hideSidebar) {
  hideSidebar.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
  });
}

// Hide sidebar when clicking outside
document.addEventListener('click', (event) => {
  const isClickInsideSidebar = sidebar.contains(event.target);
  const isClickOnToggle = sidebarToggle.contains(event.target);

  if (!isClickInsideSidebar && !isClickOnToggle) {
    sidebar.classList.add('-translate-x-full');
  }
});

// Initialize Settings
function initSettings() {
  // Check if user is logged in
  const token = localStorage.getItem('adminToken');
  if (!token) {
    // Not logged in - redirect to login page
    alert('Please log in to access Account Settings.');
    window.location.href = 'admin_signin.html';
    return;
  }

  // Load admin profile from the database
  loadAdminProfile();
}

// Load Admin Profile from Database
async function loadAdminProfile() {
  try {
    const response = await fetchWithAuth('/api/admin/profile', {
      method: 'GET'
    });

    if (!response) {
      // Fallback to localStorage if no response (token expired or unauthorized)
      const savedName = localStorage.getItem('adminDisplayName');
      const cardName = document.getElementById('displayProfileName');
      if (cardName) {
        cardName.textContent = savedName || 'Super Admin';
        cardName.classList.remove('animate-pulse');
      }
      return;
    }

    // Check response status before trying to parse JSON
    if (!response.ok) {
      // Server error or unauthorized - fallback to localStorage
      const savedName = localStorage.getItem('adminDisplayName');
      const cardName = document.getElementById('displayProfileName');
      if (cardName) {
        cardName.textContent = savedName || 'Super Admin';
        cardName.classList.remove('animate-pulse');
      }
      return;
    }

    const result = await response.json();

    if (result.success && result.profile) {
      const displayName = result.profile.display_name || 'Super Admin';

      // Update the Identity Card
      const cardName = document.getElementById('displayProfileName');
      if (cardName) {
        cardName.textContent = displayName;
        cardName.classList.remove('animate-pulse'); // Remove skeleton loader animation
      }

      // Also save to localStorage for quick access
      localStorage.setItem('adminDisplayName', displayName);
    }
  } catch (error) {
    console.error('Error loading admin profile:', error);

    // Fallback to localStorage
    const savedName = localStorage.getItem('adminDisplayName');
    const cardName = document.getElementById('displayProfileName');
    if (cardName) {
      cardName.textContent = savedName || 'Super Admin';
      cardName.classList.remove('animate-pulse');
    }
  }
}

// Update Admin Profile (for display name changes)
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
      // Update the Identity Card
      const cardName = document.getElementById('displayProfileName');
      if (cardName) {
        cardName.textContent = displayName;
      }

      // Save to localStorage
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

// Call initSettings when page loads
document.addEventListener('DOMContentLoaded', initSettings);

// ---Helper function to show the main error/success message  ---
function showPasswordError(msg, isSuccess = false) {
  const passwordError = document.getElementById("passwordError");

  if (passwordError) {
    // 1. Reset classes to ensure no lingering styles
    passwordError.className = '';

    // 2. Set the content
    passwordError.innerHTML = `<span class="block sm:inline">${msg}</span>`;

    // 3. Apply the base and conditional styles
    passwordError.classList.remove("hidden");

    if (isSuccess) {
      // Apply GREEN Tailwind CSS classes for success
      passwordError.classList.add(
        'p-3', 'rounded', 'font-medium',
        'bg-green-100', 'text-green-800', 'border', 'border-green-400'
      );
    } else {
      // Apply RED Tailwind CSS classes for error (default)
      passwordError.classList.add(
        'p-3', 'rounded', 'font-medium',
        'bg-red-100', 'text-red-800', 'border', 'border-red-400'
      );
    }
  }
}

// --- NEW: Helper function to hide the main error message ---
function hidePasswordError() {
  const passwordError = document.getElementById("passwordError");
  if (passwordError) {
    passwordError.classList.add("hidden");
  }
}

// --- UPDATED: updatePassword function with API call ---
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

  // Get the Checkbox State
  const shouldLogout = document.getElementById("logoutAfterUpdate").checked;

  // Validation
  if (!currentVal || !newPassVal || !confirmVal) {
    return showPasswordError("All fields are required");
  }
  if (newPassVal !== confirmVal) {
    if (matchError) matchError.classList.remove('hidden');
    return showPasswordError("Passwords do not match");
  }

  const pattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  if (!pattern.test(newPassVal)) {
    return showPasswordError("Password does not meet security requirements.");
  }

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Updating...`;
  btn.classList.add('opacity-75', 'cursor-not-allowed');

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
      btn.disabled = false;
      btn.innerText = originalText;
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
      return;
    }

    let result = null;
    try { result = await response.json(); } catch (e) { }

    if (response.ok && result && result.success) {

      // Clear fields and Reset Rings
      const cPass = document.getElementById("currentPass");
      const nPass = document.getElementById("newPass");
      const cfPass = document.getElementById("confirmPass");

      cPass.value = "";
      nPass.value = "";
      cfPass.value = "";

      [cPass, nPass, cfPass].forEach(el => {
        if (el) {
          el.classList.remove("focus:ring-green-500", "border-green-500", "focus:ring-red-500", "border-red-500");
          el.classList.add("focus:ring-green-500", "border-gray-200");
        }
      });

      if (document.getElementById("passwordRules")) {
        document.getElementById("passwordRules").classList.add("hidden");
      }

      // Conditional Logic based on Checkbox
      if (shouldLogout) {
        showPasswordError("Password updated! Redirecting to login...", true);
        setTimeout(() => { window.location.href = "admin_signin.html"; }, 2000);
      } else {
        showPasswordError("Password updated successfully!", true);

        // Restore button immediately since we aren't leaving
        btn.disabled = false;
        btn.innerText = originalText;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');

        // Optional: Hide the success message after 5 seconds
        setTimeout(() => hidePasswordError(), 5000);
      }

    } else {
      // ERROR HANDLING (Same as before)
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
        currentInput.classList.remove("focus:ring-green-500", "border-green-500", "border-gray-200");
        currentInput.classList.add("focus:ring-red-500", "border-red-500");
        currentInput.classList.add("animate-pulse");
        setTimeout(() => currentInput.classList.remove("animate-pulse"), 500);
      }

      showPasswordError(errorMsg);
      btn.disabled = false;
      btn.innerText = originalText;
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }

  } catch (error) {
    console.error('Error updating password:', error);
    showPasswordError(error.message || "An unexpected error occurred.");
    btn.disabled = false;
    btn.innerText = originalText;
    btn.classList.remove('opacity-75', 'cursor-not-allowed');
  }
}

function togglePassword(id, icon) {
  const input = document.getElementById(id);
  if (input.type === "password") {
    input.type = "text";
    icon.classList.replace("fa-eye-slash", "fa-eye");
  } else {
    input.type = "password";
    icon.classList.replace("fa-eye", "fa-eye-slash");
  }
}

// --- UPDATED: DOMContentLoaded for all password field logic ---
document.addEventListener("DOMContentLoaded", () => {
  const newPassInput = document.getElementById("newPass");
  const confirmPassInput = document.getElementById("confirmPass");
  const matchError = document.getElementById("matchError");

  // Get the password rules list
  const passwordRulesList = document.getElementById("passwordRules");

  const ruleLength = document.getElementById("rule-length");
  const ruleUpper = document.getElementById("rule-upper");
  const ruleLower = document.getElementById("rule-lower");
  const ruleNumber = document.getElementById("rule-number");
  const ruleSymbol = document.getElementById("rule-symbol");

  // Function to check password match immediately
  function checkPasswordMatch() {
    if (!newPassInput || !confirmPassInput || !matchError) return;
    const newPassVal = newPassInput.value;
    const confirmVal = confirmPassInput.value;
    if (confirmVal && newPassVal !== confirmVal) {
      matchError.classList.remove("hidden");
    } else {
      matchError.classList.add("hidden");
    }
  }

  // ==========================================
  // HELPER: MAIN SETTINGS RING TOGGLE
  // ==========================================
  const toggleMainRing = (element, isValid) => {
    if (isValid) {
      // SUCCESS: Green Ring + Green Border
      element.classList.remove("focus:ring-red-500", "border-gray-200", "border-red-500");
      element.classList.add("focus:ring-green-500", "border-green-500");
    } else {
      // ERROR: Red Ring + Gray Border
      element.classList.remove("focus:ring-green-500", "border-green-500");
      element.classList.add("focus:ring-red-500", "border-gray-200");
    }
  };

  // 1. CURRENT PASSWORD LISTENER
  const currentPassInput = document.getElementById("currentPass");
  if (currentPassInput) {
    currentPassInput.addEventListener("input", () => {
      // Valid if not empty
      toggleMainRing(currentPassInput, currentPassInput.value.trim().length > 0);
    });
  }

  // 2. NEW PASSWORD LISTENER (Rules + Rings)
  if (newPassInput) {
    // Show rules on focus
    newPassInput.addEventListener("focus", () => {
      if (passwordRulesList) passwordRulesList.classList.remove("hidden");
    });

    // Hide rules on blur (if empty)
    newPassInput.addEventListener("blur", () => {
      if (passwordRulesList && newPassInput.value === "") {
        passwordRulesList.classList.add("hidden");
      }
    });

    // Real-time Validation
    newPassInput.addEventListener("input", function () {
      const val = newPassInput.value;

      // Calculate individual rules
      const isLength = val.length >= 8;
      const isUpper = /[A-Z]/.test(val);
      const isLower = /[a-z]/.test(val);
      const isNumber = /\d/.test(val);
      const isSymbol = /[@$!%*?&]/.test(val); // Matches HTML text list

      // Update Text Colors
      if (ruleLength) ruleLength.style.color = isLength ? "green" : "red";
      if (ruleUpper) ruleUpper.style.color = isUpper ? "green" : "red";
      if (ruleLower) ruleLower.style.color = isLower ? "green" : "red";
      if (ruleNumber) ruleNumber.style.color = isNumber ? "green" : "red";
      if (ruleSymbol) ruleSymbol.style.color = isSymbol ? "green" : "red";

      checkPasswordMatch();

      // Apply Ring Logic
      const allValid = isLength && isUpper && isLower && isNumber && isSymbol;
      toggleMainRing(newPassInput, allValid);

      // Re-validate Confirm Password if Main Password changes
      if (confirmPassInput && confirmPassInput.value) {
        const confirmMatch = confirmPassInput.value === val;
        toggleMainRing(confirmPassInput, confirmMatch);
      }
    });
  }

  // 3. CONFIRM PASSWORD LISTENER
  if (confirmPassInput) {
    confirmPassInput.addEventListener("input", () => {
      checkPasswordMatch();
      // Valid if matches new password AND is not empty
      const match = confirmPassInput.value === newPassInput.value && confirmPassInput.value.length > 0;
      toggleMainRing(confirmPassInput, match);
    });
  }

  // ============================================================
  // HANDOVER MODAL: UNIFIED REAL-TIME VALIDATION (RINGS & RULES)
  // ============================================================

  const hFName = document.getElementById("handoverFirstName");
  const hLName = document.getElementById("handoverLastName");
  const hPass = document.getElementById("handoverPass");
  const hConfirm = document.getElementById("handoverConfirm");

  const hRulesList = document.getElementById("handoverRules");
  const hRuleUpper = document.getElementById("h-rule-upper");
  const hRuleLower = document.getElementById("h-rule-lower");
  const hRuleNumber = document.getElementById("h-rule-number");
  const hRuleSymbol = document.getElementById("h-rule-symbol");

  // Helper 1: Toggles Green Ring (Valid) vs Red Ring (Invalid)
  const toggleRing = (element, isValid) => {
    if (isValid) {
      // SUCCESS: Green Ring & Border
      element.classList.remove("focus:ring-red-500", "border-gray-200", "border-red-500");
      element.classList.add("focus:ring-green-500", "border-green-500");
    } else {
      // ERROR: Red Ring & Default Border (or Red Border if you prefer)
      element.classList.remove("focus:ring-green-500", "border-green-500");
      element.classList.add("focus:ring-red-500", "border-gray-200");
    }
  };

  // Helper 2: Toggles Rule Text Color (Green/Red)
  const setRuleStatus = (element, isValid) => {
    if (isValid) {
      element.classList.remove("text-gray-500", "text-red-500");
      element.classList.add("text-green-600", "font-bold");
      element.querySelector("i")?.classList.add("text-green-600");
    } else {
      element.classList.remove("text-green-600", "font-bold");
      element.classList.add("text-red-500");
      element.querySelector("i")?.classList.remove("text-green-600");
    }
    return isValid;
  };

  // 1. NAME INPUTS (Green Ring Real-time)
  const nameRegex = /^[a-zA-Z\s\-]+$/;

  if (hFName) {
    hFName.addEventListener("input", () => {
      const val = hFName.value.trim();
      toggleRing(hFName, val.length > 0 && nameRegex.test(val));
    });
  }

  if (hLName) {
    hLName.addEventListener("input", () => {
      const val = hLName.value.trim();
      toggleRing(hLName, val.length > 0 && nameRegex.test(val));
    });
  }

  // 2. PASSWORD INPUT (Rules Animation + Green Ring)
  if (hPass && hRulesList) {
    // Show rules on focus
    hPass.addEventListener("focus", () => {
      hRulesList.classList.remove("hidden");
    });

    // Hide rules on blur (only if empty)
    hPass.addEventListener("blur", () => {
      if (hPass.value === "") hRulesList.classList.add("hidden");
    });

    hPass.addEventListener("input", () => {
      const val = hPass.value;

      // A. Check Rules
      const isUpper = setRuleStatus(hRuleUpper, /[A-Z]/.test(val));
      const isLower = setRuleStatus(hRuleLower, /[a-z]/.test(val));
      const isNumber = setRuleStatus(hRuleNumber, /\d/.test(val));
      const isSymbol = setRuleStatus(hRuleSymbol, /[^A-Za-z0-9]/.test(val)); // Any special char
      const isLength = val.length >= 8;

      const allValid = isUpper && isLower && isNumber && isSymbol && isLength;

      // B. Update Rules Box Background (Force remove conflicting classes first)
      hRulesList.classList.remove("bg-red-50", "border-red-100", "bg-gray-50", "border-gray-200", "bg-green-50", "border-green-100");

      if (allValid) {
        hRulesList.classList.add("bg-green-50", "border-green-100");
      } else {
        hRulesList.classList.add("bg-red-50", "border-red-100");
      }

      // C. Update Input Ring
      toggleRing(hPass, allValid);

      // D. Re-check Confirm Password if Main Password changes
      if (hConfirm && hConfirm.value) {
        toggleRing(hConfirm, hConfirm.value === val);
      }
    });
  }

  // 3. CONFIRM PASSWORD (Match Check Real-time)
  if (hConfirm) {
    hConfirm.addEventListener("input", () => {
      const match = hConfirm.value === hPass.value && hConfirm.value.length > 0;
      toggleRing(hConfirm, match);
    });
  }
});

// =======================
// HANDOVER LOGIC (MODAL)
// =======================

// 1a. Open PIN Verification Modal (Security Layer)
function confirmHandover() {
  // Clear previous PIN input
  document.getElementById('handoverPinInput').value = '';
  document.getElementById('handoverPinError').classList.add('hidden');

  // Show PIN Modal
  const pinModal = document.getElementById('handoverPinModal');
  if (pinModal) {
    pinModal.classList.remove('hidden');
    document.getElementById('handoverPinInput').focus();
  }
}

// 1b. Verify PIN before showing handover modal
async function verifyHandoverPin() {
  const pin = document.getElementById('handoverPinInput').value;
  const errorMsg = document.getElementById('handoverPinError');
  const btn = document.querySelector('#handoverPinModal button[onclick="verifyHandoverPin()"]');
  const originalText = btn.innerText;

  // Reset Error
  errorMsg.classList.add('hidden');
  errorMsg.textContent = '';

  // Validation
  if (!pin || pin.length !== 4) {
    errorMsg.textContent = "Please enter a valid 4-digit PIN.";
    errorMsg.classList.remove('hidden');
    return;
  }

  // Show Loading State
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Verifying...`;
  btn.classList.add('opacity-75', 'cursor-not-allowed');

  try {
    const startTime = Date.now();
    // Call the verify PIN API (same as forgot password)
    const response = await fetch('/api/admin/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',  // Default admin username
        pin: pin
      })
    });

    // Ensure loading state is visible for at least 600ms
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < 600) {
      await new Promise(resolve => setTimeout(resolve, 600 - elapsedTime));
    }

    const result = await response.json();

    if (result.success) {
      // Close PIN modal and open handover modal
      closeHandoverPinModal();
      openHandoverModal();
    } else {
      errorMsg.textContent = result.message || "Invalid PIN.";
      errorMsg.classList.remove('hidden');
      // Restore button on error
      btn.disabled = false;
      btn.innerText = originalText;
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
  } catch (error) {
    console.error("PIN verification error:", error);
    errorMsg.textContent = "Network error. Please try again.";
    errorMsg.classList.remove('hidden');
    // Restore button on error
    btn.disabled = false;
    btn.innerText = originalText;
    btn.classList.remove('opacity-75', 'cursor-not-allowed');
  }
}

// 1c. Close PIN Modal
function closeHandoverPinModal() {
  const pinModal = document.getElementById('handoverPinModal');
  if (pinModal) {
    pinModal.classList.add('hidden');

    // Reset button state to prevent it from staying disabled
    const btn = document.querySelector('#handoverPinModal button[onclick="verifyHandoverPin()"]');
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'Verify PIN';
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }

    // Clear PIN input and error message
    document.getElementById('handoverPinInput').value = '';
    const errorMsg = document.getElementById('handoverPinError');
    if (errorMsg) {
      errorMsg.classList.add('hidden');
      errorMsg.textContent = '';
    }
  }
}

// =======================
// HANDOVER LOGIC (Concatenation)
// =======================

// 1. Open Modal (Clear both inputs)
// UPDATED: Open Modal (Clear inputs AND reset visual styles)
function openHandoverModal() {
  // 1. Reset Inputs (Values & Visual Styles)
  const inputIds = ['handoverFirstName', 'handoverLastName', 'handoverPass', 'handoverConfirm'];

  inputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = ''; // Clear text value

      // Remove "Success" (Green) styles
      el.classList.remove("focus:ring-green-500", "border-green-500", "border-red-500");

      // Restore "Default/Danger" styles (Red Ring + Gray Border)
      el.classList.add("focus:ring-red-500", "border-gray-200");
    }
  });

  // 2. Hide Main Error Message
  document.getElementById('handoverError').classList.add('hidden');

  // 3. Reset Password Rules Box
  const rulesList = document.getElementById('handoverRules');
  if (rulesList) {
    rulesList.classList.add('hidden'); // Hide the box itself

    // Reset background color to Neutral Gray
    rulesList.classList.remove("bg-green-50", "border-green-100", "bg-red-50", "border-red-100");
    rulesList.classList.add("bg-gray-50", "border-gray-200");
  }

  // 4. Reset Individual Rule Text Items (to Gray)
  const ruleIds = ["h-rule-upper", "h-rule-lower", "h-rule-number", "h-rule-symbol"];
  ruleIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      // Remove Green (Success) and Red (Error) colors
      el.classList.remove("text-green-600", "font-bold", "text-red-500");
      el.classList.add("text-gray-500"); // Back to default Gray

      // Reset the small icon dot
      const icon = el.querySelector("i");
      if (icon) icon.classList.remove("text-green-600");
    }
  });

  // 5. Finally, Show the Modal
  const modal = document.getElementById('handoverModal');
  if (modal) modal.classList.remove('hidden');
}

// 2. Close the Modal
function closeHandoverModal() {
  const modal = document.getElementById('handoverModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// 3. Submit Logic (Concatenate & Send)
async function submitHandover() {
  // A. Get values from the two separate inputs
  const fName = document.getElementById('handoverFirstName').value.trim();
  const lName = document.getElementById('handoverLastName').value.trim();

  const pass = document.getElementById('handoverPass').value;
  const confirmPass = document.getElementById('handoverConfirm').value;
  const errorMsg = document.getElementById('handoverError');
  const btn = document.querySelector('#handoverModal button[onclick="submitHandover()"]');
  const originalText = btn.innerText;

  // Reset UI
  errorMsg.classList.add('hidden');
  errorMsg.textContent = '';

  // B. Validate
  if (!fName || !lName || !pass || !confirmPass) {
    errorMsg.textContent = "Please fill in all fields (First & Last Name required).";
    errorMsg.classList.remove('hidden');
    return;
  }

  // Check if name contains valid characters (Letters, spaces, hyphens only)
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

  // Strict complexity check (Uppercase, Lowercase, Number, Symbol)
  // Allows ANY special character (anything that is not a letter or number)
  const complexityPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!complexityPattern.test(pass)) {
    errorMsg.textContent = "Password must contain: Uppercase, Lowercase, Number, and a Symbol.";
    errorMsg.classList.remove('hidden');
    return;
  }

  // C. CONCATENATE: Join them with a space
  const fullName = `${fName} ${lName}`;

  // D. Confirmation
  if (!window.confirm(`Transfer account to "${fullName}"? You will be logged out.`)) {
    return;
  }

  // E. Loading State
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Transferring...`;
  btn.classList.add('opacity-75', 'cursor-not-allowed');

  try {
    const startTime = Date.now();

    // F. Send the Combined Name to the Backend
    const response = await fetchWithAuth('/api/admin/handover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newDisplayName: fullName,
        newPassword: pass
      })
    });

    // Artificial delay for UX
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < 600) await new Promise(r => setTimeout(r, 600 - elapsedTime));

    if (!response) throw new Error("Server error");
    const result = await response.json();

    if (result.success) {
      // Update Local Data
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

    btn.disabled = false;
    btn.innerText = originalText;
    btn.classList.remove('opacity-75', 'cursor-not-allowed');
  }
}