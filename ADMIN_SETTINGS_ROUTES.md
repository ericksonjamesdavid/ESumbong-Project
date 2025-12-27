# Admin Settings Routes - Complete Reference

## Overview
All routes for admin account settings are now fully implemented with both backend and frontend support.

---

## 📋 Complete Route List

### 1. **Admin Login**
- **Endpoint:** `POST /api/admin/login`
- **Authentication:** Not required
- **Request Body:**
  ```json
  {
    "username": "admin",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": "JWT_TOKEN_HERE",
    "adminId": 1,
    "message": "Login successful"
  }
  ```
- **Handler:** `handleAdminLogin` (adminHandlers.js)

---

### 2. **Update Password**
- **Endpoint:** `PATCH /api/admin/update-password`
- **Authentication:** Required (JWT)
- **Request Body:**
  ```json
  {
    "currentPassword": "oldPassword123",
    "newPassword": "NewSecurePass123!"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Password updated successfully"
  }
  ```
- **Handler:** `handlePasswordUpdate` (adminHandlers.js)
- **Location in UI:** Admin Settings - Personal Security section

---

### 3. **Verify Username** (For Forgot Password)
- **Endpoint:** `POST /api/admin/verify-username`
- **Authentication:** Not required
- **Request Body:**
  ```json
  {
    "username": "admin"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Username verified"
  }
  ```
- **Handler:** `handleVerifyUsername` (adminHandlers.js)
- **Location in UI:** Forgot Password flow

---

### 4. **Verify PIN** (For Forgot Password)
- **Endpoint:** `POST /api/admin/verify-pin`
- **Authentication:** Not required
- **Request Body:**
  ```json
  {
    "username": "admin",
    "pin": "1234"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "PIN verified"
  }
  ```
- **Handler:** `handleVerifyPin` (adminHandlers.js)
- **Location in UI:** Forgot Password flow

---

### 5. **Reset Password via PIN** (For Forgot Password)
- **Endpoint:** `POST /api/admin/reset-password-via-pin`
- **Authentication:** Not required
- **Request Body:**
  ```json
  {
    "username": "admin",
    "newPassword": "NewSecurePass123!"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Password reset successfully. Please login with your new password."
  }
  ```
- **Handler:** `handleResetPasswordViaPin` (adminHandlers.js)
- **Location in UI:** Forgot Password flow

---

### 6. **Get Admin Profile** ✨ NEW
- **Endpoint:** `GET /api/admin/profile`
- **Authentication:** Required (JWT)
- **Request Body:** None
- **Response:**
  ```json
  {
    "success": true,
    "profile": {
      "id": 1,
      "username": "admin",
      "display_name": "Juan Dela Cruz",
      "date_created": "Nov 14, 2025"
    }
  }
  ```
- **Handler:** `handleGetAdminProfile` (adminHandlers.js)
- **Location in UI:** Admin Settings - Profile Card
- **Purpose:** Displays admin name in the profile identity card

---

### 7. **Update Admin Profile** ✨ NEW
- **Endpoint:** `PATCH /api/admin/profile`
- **Authentication:** Required (JWT)
- **Request Body:**
  ```json
  {
    "displayName": "Maria Clara"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "profile": {
      "id": 1,
      "username": "admin",
      "display_name": "Maria Clara"
    }
  }
  ```
- **Handler:** `handleUpdateAdminProfile` (adminHandlers.js)
- **Location in UI:** Admin Settings - Profile Section
- **Purpose:** Update admin's display name
- **Audit Log:** Logs as `PROFILE_UPDATED`

---

### 8. **Handover Account** ✨ NEW
- **Endpoint:** `POST /api/admin/handover`
- **Authentication:** Required (JWT)
- **Request Body:**
  ```json
  {
    "newDisplayName": "Maria Clara",
    "newPassword": "NewAdminPass123!"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Account handover completed successfully"
  }
  ```
- **Handler:** `handleHandoverAccount` (adminHandlers.js)
- **Location in UI:** Admin Settings - Danger Zone
- **Purpose:** Transfer account to new admin with new password and name
- **Audit Log:** Logs as `ACCOUNT_HANDOVER`
- **Side Effects:**
  - Updates display name in database
  - Hashes and updates password
  - Logs audit action
  - Frontend logs out user and redirects to login

---

## 📊 Database Schema Updates

### Admins Table
```sql
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `display_name` varchar(255) DEFAULT NULL,  -- NEW
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
)
```

### Stored Procedures Added
1. **sp_GetAdminProfile(p_admin_id)** - Retrieves admin profile info
2. **sp_UpdateAdminProfile(p_admin_id, p_display_name)** - Updates display name

---

## 🔒 Security Features

| Feature | Implementation |
|---------|-----------------|
| **JWT Authentication** | Required for all profile and account routes |
| **Password Hashing** | bcrypt with 10 salt rounds |
| **Password Validation** | Minimum 8 characters with uppercase, lowercase, number, symbol |
| **Audit Logging** | All profile changes logged to audit_logs table |
| **Session Management** | JWT tokens expire after 1 hour |
| **PIN for Forgot Password** | Master PIN stored in .env (default: 1234) |

---

## 🧪 Testing Routes

### Get Token (Login First)
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_PASSWORD"}'
```

### Get Profile
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/admin/profile
```

### Update Profile
```bash
curl -X PATCH http://localhost:3000/api/admin/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Maria Clara"}'
```

### Handover Account
```bash
curl -X POST http://localhost:3000/api/admin/handover \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newDisplayName":"Maria Clara","newPassword":"NewPass123!"}'
```

---

## 📱 Frontend Integration

### Files Updated
- `admin_settings.html` - UI for account settings
- `admin_setting.js` - JavaScript for settings functionality
- `auth.js` - Contains `fetchWithAuth()` function

### Key Frontend Functions
- `initSettings()` - Load profile on page load
- `loadAdminProfile()` - Fetch profile from API
- `updateAdminProfile(name)` - Update profile display name
- `updatePassword()` - Change password
- `confirmHandover()` - Open handover modal
- `submitHandover()` - Submit account transfer
- `togglePassword(id, icon)` - Show/hide password fields

---

## ✅ Checklist for Verification

- [x] All routes defined in server.js
- [x] All handlers imported and exported
- [x] Database schema includes display_name field
- [x] Stored procedures created
- [x] Frontend integration complete
- [x] JWT authentication enforced
- [x] Audit logging implemented
- [x] Error handling on all routes
- [x] Password hashing implemented
- [x] Handover functionality complete

---

## 🚀 Deployment Notes

1. **Database Migration Required:**
   ```bash
   mysql -u root -p barangay_db < backend/database/barangay_db_FIXED.sql
   ```

2. **Environment Variables:**
   - Ensure `JWT_SECRET` is set in `.env`
   - Master PIN (default: 1234) can be configured if needed

3. **Restart Server:**
   ```bash
   node server.js
   ```

4. **Clear Browser Cache:**
   - Hard refresh (Ctrl+Shift+R) to clear old code

---

## 📝 Notes

- All password fields include eye/eye-slash toggle icons
- Handover modal has red warning theme to indicate danger
- All admin actions are logged in audit_logs
- Display name can be up to 255 characters
- Password must meet security requirements (8+ chars, uppercase, lowercase, number, symbol)
