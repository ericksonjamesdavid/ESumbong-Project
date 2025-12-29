/**
 * SignIn Controller - Handles UI logic and events for admin sign-in page
 * Manages form interactions, spinners, error messages, and recovery flow
 */
import AuthService from '../services/auth.service.js';

document.addEventListener('DOMContentLoaded', () => {
    // ==================== DOM ELEMENTS ====================
    const adminForm = document.getElementById('adminForm');
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    const loginErrorDiv = document.getElementById('loginError');
    const submitButton = adminForm.querySelector('button[type="submit"]');

    const recoveryModal = document.getElementById('recoveryModal');
    const stepUsername = document.getElementById('stepUsername');
    const stepVerify = document.getElementById('stepVerify');
    const stepReset = document.getElementById('stepReset');
    const recoveryErrorDiv = document.getElementById('recoveryError');

    const recoveryUsernameInput = document.getElementById('recoveryUsername');
    const recoveryPinInput = document.getElementById('recoveryPin');
    const newRecPassInput = document.getElementById('newRecPass');
    const confirmRecPassInput = document.getElementById('confirmRecPass');

    // ==================== STATE VARIABLES ====================
    let recoveredUsername = '';
    let verifiedPin = '';

    // ==================== UTILITY FUNCTIONS ====================
    /**
     * Display error message in specified container
     */
    const showError = (errorDiv, message) => {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    };

    /**
     * Clear error message from specified container
     */
    const clearError = (errorDiv) => {
        errorDiv.textContent = '';
        errorDiv.classList.add('hidden');
    };

    /**
     * Show loading spinner on button
     */
    const showSpinner = (button) => {
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading...';
    };

    /**
     * Restore button to normal state
     */
    const hideSpinner = (button, text) => {
        button.disabled = false;
        button.innerHTML = text;
    };

    /**
     * Toggle password field visibility
     */
    const togglePasswordVisibility = (inputField, iconElement) => {
        const isPassword = inputField.type === 'password';
        inputField.type = isPassword ? 'text' : 'password';
        iconElement.classList.toggle('fa-eye');
        iconElement.classList.toggle('fa-eye-slash');
    };

    /**
     * Attach Enter key listener to input field
     * Programmatically clicks the associated button when Enter is pressed
     */
    const handleEnterKey = (inputId, buttonId) => {
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById(buttonId).click();
                }
            });
        }
    };

    // ==================== LOGIN LOGIC ====================
    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError(loginErrorDiv);

        const username = usernameField.value.trim();
        const password = passwordField.value.trim();

        if (!username || !password) {
            showError(loginErrorDiv, 'Please enter both username and password.');
            return;
        }

        try {
            showSpinner(submitButton);

            const result = await AuthService.login(username, password);

            if (result.success) {
                // Store token and redirect
                storeJWTToken(result.token);
                localStorage.setItem('defaultSection', 'sectionAnnouncements');
                window.location.href = '/admin_components/admin_dashboard.html';
            } else {
                showError(loginErrorDiv, result.message || 'Invalid username or password.');
                hideSpinner(submitButton, 'Sign In');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError(loginErrorDiv, 'Connection error. Please try again.');
            hideSpinner(submitButton, 'Sign In');
        }
    });

    // ==================== PASSWORD VISIBILITY TOGGLES ====================
    document.getElementById('togglePassword').addEventListener('click', () => {
        togglePasswordVisibility(passwordField, document.getElementById('togglePassword'));
    });

    document.getElementById('toggleNewPass').addEventListener('click', function () {
        togglePasswordVisibility(newRecPassInput, this);
    });

    document.getElementById('toggleConfirmPass').addEventListener('click', function () {
        togglePasswordVisibility(confirmRecPassInput, this);
    });

    // ==================== ENTER KEY SUPPORT FOR RECOVERY MODAL ====================
    handleEnterKey('recoveryUsername', 'verifyUsernameBtn');
    handleEnterKey('recoveryPin', 'verifyPinBtn');
    handleEnterKey('confirmRecPass', 'saveNewPassBtn');

    // ==================== RECOVERY MODAL ====================
    document.getElementById('forgotPasswordBtn').addEventListener('click', () => {
        recoveredUsername = '';
        verifiedPin = '';
        recoveryUsernameInput.value = '';
        recoveryPinInput.value = '';
        newRecPassInput.value = '';
        confirmRecPassInput.value = '';
        clearError(recoveryErrorDiv);

        recoveryModal.classList.remove('hidden');
        stepUsername.classList.remove('hidden');
        stepVerify.classList.add('hidden');
        stepReset.classList.add('hidden');
    });

    document.getElementById('closeModal').addEventListener('click', () => {
        recoveryModal.classList.add('hidden');
    });

    // ==================== STEP 1: VERIFY USERNAME ====================
    document.getElementById('verifyUsernameBtn').addEventListener('click', async () => {
        clearError(recoveryErrorDiv);
        const username = recoveryUsernameInput.value.trim();

        if (!username) {
            showError(recoveryErrorDiv, 'Please enter your username.');
            return;
        }

        try {
            const button = document.getElementById('verifyUsernameBtn');
            showSpinner(button);

            const data = await AuthService.verifyUsername(username);

            if (data.success) {
                recoveredUsername = username;
                stepUsername.classList.add('hidden');
                stepVerify.classList.remove('hidden');
                recoveryPinInput.value = '';
                hideSpinner(button, 'Continue');
            } else {
                showError(recoveryErrorDiv, data.message || 'Username not found. Please check and try again.');
                recoveryUsernameInput.value = '';
                hideSpinner(button, 'Continue');
            }
        } catch (error) {
            console.error('Username verification error:', error);
            showError(recoveryErrorDiv, 'Error verifying username. Please try again.');
            const button = document.getElementById('verifyUsernameBtn');
            hideSpinner(button, 'Continue');
        }
    });

    // ==================== STEP 2: VERIFY PIN ====================
    document.getElementById('verifyPinBtn').addEventListener('click', async () => {
        clearError(recoveryErrorDiv);
        const pin = recoveryPinInput.value.trim();

        if (pin.length !== 4) {
            showError(recoveryErrorDiv, 'Please enter a 4-digit PIN.');
            return;
        }

        if (!recoveredUsername) {
            showError(recoveryErrorDiv, 'Username verification failed. Please restart the process.');
            return;
        }

        try {
            const button = document.getElementById('verifyPinBtn');
            showSpinner(button);

            // Security: Send both username and PIN
            const data = await AuthService.verifyPin(recoveredUsername, pin);

            if (data.success) {
                verifiedPin = pin;
                stepVerify.classList.add('hidden');
                stepReset.classList.remove('hidden');
                newRecPassInput.value = '';
                confirmRecPassInput.value = '';
                hideSpinner(button, 'Verify PIN');
            } else {
                showError(recoveryErrorDiv, data.message || 'Incorrect PIN. Please try again.');
                recoveryPinInput.value = '';
                hideSpinner(button, 'Verify PIN');
            }
        } catch (error) {
            console.error('PIN verification error:', error);
            showError(recoveryErrorDiv, 'Error verifying PIN. Please try again.');
            const button = document.getElementById('verifyPinBtn');
            hideSpinner(button, 'Verify PIN');
        }
    });

    // ==================== STEP 3: RESET PASSWORD ====================
    document.getElementById('saveNewPassBtn').addEventListener('click', async () => {
        clearError(recoveryErrorDiv);

        const newPass = newRecPassInput.value;
        const confirmPass = confirmRecPassInput.value;

        // Validation
        if (!newPass || !confirmPass) {
            showError(recoveryErrorDiv, 'Please fill all fields.');
            return;
        }
        if (newPass !== confirmPass) {
            showError(recoveryErrorDiv, 'Passwords do not match.');
            return;
        }

        // Password complexity validation - same rules as Settings page
        const complexityPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!complexityPattern.test(newPass)) {
            showError(recoveryErrorDiv, 'Password must contain: Uppercase, Lowercase, Number, and a Symbol.');
            return;
        }

        if (!recoveredUsername) {
            showError(recoveryErrorDiv, 'Username verification failed. Please restart the process.');
            return;
        }

        try {
            const button = document.getElementById('saveNewPassBtn');
            showSpinner(button);

            const data = await AuthService.resetPassword(recoveredUsername, verifiedPin, newPass);

            if (data.success) {
                alert('Password Reset Successful!\n\nYou can now log in with your new password.');
                recoveryModal.classList.add('hidden');
                recoveredUsername = '';
                verifiedPin = '';
                recoveryUsernameInput.value = '';
                recoveryPinInput.value = '';
                newRecPassInput.value = '';
                confirmRecPassInput.value = '';
                hideSpinner(button, 'Update Password');
            } else {
                showError(recoveryErrorDiv, data.message || 'Error resetting password.');
                hideSpinner(button, 'Update Password');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            showError(recoveryErrorDiv, 'Connection error while resetting password.');
            const button = document.getElementById('saveNewPassBtn');
            hideSpinner(button, 'Update Password');
        }
    });
});
