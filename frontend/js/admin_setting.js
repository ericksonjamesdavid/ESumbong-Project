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
  // Get button reference for loading state
  const btn = document.querySelector('button[onclick="updatePassword()"]');
  const originalText = btn.innerText;

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

  // Show Loading State
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Updating...`;
  btn.classList.add('opacity-75', 'cursor-not-allowed');

  // Send to backend API with minimum delay for visibility
  try {
    const startTime = Date.now();
    const response = await fetchWithAuth('/api/admin/update-password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: current,
        newPassword: newPassVal,
        confirmPassword: confirmVal
      })
    });

    // Ensure loading state is visible for at least 600ms
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < 600) {
      await new Promise(resolve => setTimeout(resolve, 600 - elapsedTime));
    }

    if (!response) {
      // Restore button
      btn.disabled = false;
      btn.innerText = originalText;
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
      return; // Token expired
    }

    const result = await response.json();

    if (result.success) {
      showPasswordError(result.msg || "Password updated successfully! Redirecting to login...", true);
      // Clear the form fields
      document.getElementById("currentPass").value = "";
      document.getElementById("newPass").value = "";
      document.getElementById("confirmPass").value = "";

      // Redirect to sign-in after successful change
            setTimeout(() => {
                window.location.href = "admin_signin.html";
            }, 3000);
      
      // Reset password rules display
      if (document.getElementById("passwordRules")) {
        document.getElementById("passwordRules").classList.add("hidden");
      }
    } else {
      showPasswordError(result.msg || "Failed to update password");
      // Restore button on error
      btn.disabled = false;
      btn.innerText = originalText;
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
  } catch (error) {
    console.error('Error updating password:', error);
    showPasswordError("Network error. Please try again.");
    // Restore button on error
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
function openHandoverModal() {
    document.getElementById('handoverFirstName').value = ''; 
    document.getElementById('handoverLastName').value = '';
    document.getElementById('handoverPass').value = '';
    document.getElementById('handoverConfirm').value = '';
    document.getElementById('handoverError').classList.add('hidden');

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

    // C. CONCATENATE: Join them with a space
    // Example: "Maria" + " " + "Clara" = "Maria Clara"
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
                newDisplayName: fullName, // Sending "Maria Clara"
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

            alert(`✅ Handover Complete!\n\nWelcome, ${fullName}.\nRedirecting to login...`);
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