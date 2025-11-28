document.getElementById("sidebarToggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("-translate-x-full");
});

// Hide sidebar when clicking the arrow icon
const hideSidebar = document.getElementById('hideSidebar');

if (hideSidebar) {
  hideSidebar.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    icon.classList.add('fa-bars');
  });
}

// Hide sidebar when clicking outside
document.addEventListener('click', (event) => {
  const isClickInsideSidebar = sidebar.contains(event.target);
  const isClickOnToggle = sidebarToggle.contains(event.target);

  if (!isClickInsideSidebar && !isClickOnToggle) {
    sidebar.classList.add('-translate-x-full');
    icon.classList.add('fa-bars');
    icon.classList.remove('fa-xmark');
  }
});

// --- NEW: Helper function to show the main error message ---
function showPasswordError(msg) {
  const passwordError = document.getElementById("passwordError");
  if (passwordError) {
    passwordError.innerHTML = `<span class="block sm:inline">${msg}</span>`;
    passwordError.classList.remove("hidden");
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
  // Hide any old errors first
  hidePasswordError();
  const matchError = document.getElementById("matchError");
  if (matchError) {
    matchError.classList.add('hidden');
  }

  // Get values
  const current = document.getElementById("currentPass").value;
  const newPassVal = document.getElementById("newPass").value;
  const confirmVal = document.getElementById("confirmPass").value;

  // Validation checks using the new error box
  if (!current || !newPassVal || !confirmVal) {
    return showPasswordError("All fields are required");
  }
  if (newPassVal !== confirmVal) {
    if (matchError) {
      matchError.classList.remove('hidden'); // Show specific error
    }
    return showPasswordError("Passwords do not match"); // Show main error
  }

  const pattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  if (!pattern.test(newPassVal)) {
    return showPasswordError("Password does not meet security requirements. Please check all rules.");
  }

  // Send to backend API
  try {
    const response = await fetchWithAuth('/api/admin/update-password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: current,
        newPassword: newPassVal,
        confirmPassword: confirmVal
      })
    });

    if (!response) return; // Token expired

    const result = await response.json();

    if (result.success) {
      showPasswordError(""); // Clear errors
      alert("Password updated successfully!");
      // Clear the form fields
      document.getElementById("currentPass").value = "";
      document.getElementById("newPass").value = "";
      document.getElementById("confirmPass").value = "";
      
      // Reset password rules display
      if (document.getElementById("passwordRules")) {
        document.getElementById("passwordRules").classList.add("hidden");
      }
    } else {
      showPasswordError(result.message || "Failed to update password");
    }
  } catch (error) {
    console.error('Error updating password:', error);
    showPasswordError("Network error. Please try again.");
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

  // Listener for password rules
  if (newPassInput) {
    // --- NEW: Show rules on focus ---
    newPassInput.addEventListener("focus", () => {
      if (passwordRulesList) {
        passwordRulesList.classList.remove("hidden");
      }
    });

    // --- NEW: Hide rules on blur (if empty) ---
    // blur = "when the user clicks away"
    newPassInput.addEventListener("blur", () => {
      if (passwordRulesList && newPassInput.value === "") {
        // Only hide it if they clicked away and left it empty
        passwordRulesList.classList.add("hidden");
      }
    });

    // This is your existing 'input' listener (unchanged)
    newPassInput.addEventListener("input", function () {
      const val = newPassInput.value;
      if (ruleLength) ruleLength.style.color = val.length >= 8 ? "green" : "red";
      if (ruleUpper) ruleUpper.style.color = /[A-Z]/.test(val) ? "green" : "red";
      if (ruleLower) ruleLower.style.color = /[a-z]/.test(val) ? "green" : "red";
      if (ruleNumber) ruleNumber.style.color = /\d/.test(val) ? "green" : "red";
      if (ruleSymbol) ruleSymbol.style.color = /[@$!%*?&]/.test(val) ? "green" : "red";
      checkPasswordMatch(); 
    });
  }

  // Listener for immediate password matching
  if (confirmPassInput) {
    confirmPassInput.addEventListener("input", checkPasswordMatch);
  }
});