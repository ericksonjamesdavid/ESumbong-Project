/**
 * UI Utilities Module
 * Handles visual components: Rings, Toggles, Spinners, Status indicators
 * Reusable across all admin settings functionality
 */

// =============================================================================
// PASSWORD VISIBILITY TOGGLE
// =============================================================================

/**
 * Toggles the password input visibility and icon.
 * @param {string} id - The ID of the password input element
 * @param {HTMLElement} icon - The icon element to toggle
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

// =============================================================================
// INPUT STATUS RINGS (Green Success / Red Error)
// =============================================================================

/**
 * Toggles Green (Success) vs Red (Error) rings on inputs.
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

// =============================================================================
// BUTTON LOADING STATE (Spinner)
// =============================================================================

/**
 * Manages Button Loading State with spinner animation
 * @param {HTMLElement} btn - The button element
 * @param {boolean} isLoading - True to show loading state
 * @param {string} originalText - The original button text
 * @param {string} loadingText - The text to show while loading
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

// =============================================================================
// PASSWORD ERROR MESSAGES
// =============================================================================

/**
 * Displays the main password error/success message.
 * @param {string} msg - The message to display
 * @param {boolean} isSuccess - True for success (green), False for error (red)
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

/**
 * Hides the password error message.
 */
function hidePasswordError() {
  const passwordError = document.getElementById("passwordError");
  if (passwordError) {
    passwordError.classList.add("hidden");
  }
}

// =============================================================================
// MODAL RULE STATUS HELPERS
// =============================================================================

/**
 * Sets the visual status of a rule element in the handover modal
 * @param {HTMLElement} element - The rule element
 * @param {boolean} isValid - True for valid (green), False for invalid (red)
 * @returns {boolean} The validation status
 */
function setModalRuleStatus(element, isValid) {
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
}

// =============================================================================
// HANDOVER MODAL RESET HELPERS
// =============================================================================

/**
 * Resets the handover modal to its initial state
 */
function resetHandoverModal() {
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
}

/**
 * Updates the handover rules box background based on validation
 * @param {boolean} allValid - True if all rules are satisfied
 */
function updateHandoverRulesBox(allValid) {
  const rulesList = document.getElementById('handoverRules');
  if (!rulesList) return;

  rulesList.classList.remove("bg-red-50", "border-red-100", "bg-gray-50", "border-gray-200", "bg-green-50", "border-green-100");
  
  if (allValid) {
    rulesList.classList.add("bg-green-50", "border-green-100");
  } else {
    rulesList.classList.add("bg-red-50", "border-red-100");
  }
}

// Export functions for ES6 modules
export {
  togglePassword,
  toggleInputStatus,
  setButtonLoading,
  showPasswordError,
  hidePasswordError,
  setModalRuleStatus,
  resetHandoverModal,
  updateHandoverRulesBox
};
