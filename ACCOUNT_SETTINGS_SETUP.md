# Account Settings Database Setup

## Database Changes

### 1. Updated `admins` Table
Added a new field to store the admin's display name:

```sql
ALTER TABLE admins ADD COLUMN display_name VARCHAR(255) DEFAULT NULL;
```

**Updated Schema:**
- `id` - Primary key (auto-increment)
- `username` - Admin username (unique)
- `password_hash` - Bcrypt hashed password
- `display_name` - Admin's display name (shown in profile card) - **NEW**
- `date_created` - Account creation timestamp

**Default Value:**
- Display name for the default admin is set to "Super Admin"

### 2. New Stored Procedures

#### `sp_GetAdminProfile(p_admin_id)`
Retrieves the admin's profile information.

**Parameters:**
- `p_admin_id` - The admin ID

**Returns:**
- id, username, display_name, date_created

#### `sp_UpdateAdminProfile(p_admin_id, p_display_name)`
Updates the admin's display name.

**Parameters:**
- `p_admin_id` - The admin ID
- `p_display_name` - The new display name

**Returns:**
- Updated admin record

## Backend API Endpoints

### 1. Get Admin Profile
**Endpoint:** `GET /api/admin/profile`

**Authentication:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": 1,
    "username": "admin",
    "display_name": "Super Admin",
    "date_created": "Nov 14, 2025"
  }
}
```

### 2. Update Admin Profile
**Endpoint:** `PATCH /api/admin/profile`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "displayName": "Juan Dela Cruz"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": {
    "id": 1,
    "username": "admin",
    "display_name": "Juan Dela Cruz"
  }
}
```

## Frontend Features

### 1. Profile Loading
The `loadAdminProfile()` function automatically:
- Fetches the admin's profile from the database
- Updates the Identity Card with the display name
- Saves the display name to localStorage for quick access
- Falls back to "Super Admin" if no display name is set

### 2. Profile Updates
The `updateAdminProfile(displayName)` function:
- Sends the new display name to the backend
- Updates the profile in the database
- Updates the Identity Card UI
- Saves to localStorage
- Returns true/false for success/failure

### 3. Initialization
- `initSettings()` is called when the page loads
- Automatically loads the admin profile from the database
- Shows appropriate profile information in the account settings page

## Usage in Account Settings UI

The Identity Card now displays:
- Admin profile picture (from Images/Logo.png)
- Admin display name (from database)
- Admin role badge

## Security Features

- JWT authentication required for all profile endpoints
- Display name changes are logged in the audit_logs table
- All database operations use prepared statements to prevent SQL injection
- Password hashing with bcrypt (10 salt rounds)

## Database Migration

To apply these changes to an existing database:

1. **Backup your database first**
2. **Run the updated SQL script:**
   ```bash
   mysql -u root -p barangay_db < backend/database/barangay_db_FIXED.sql
   ```
3. **Restart the Node.js server**
4. **Refresh the browser cache (Ctrl+Shift+R)**

## Testing

You can test the new endpoints using curl:

```bash
# Get profile
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/admin/profile

# Update profile
curl -X PATCH \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"New Admin Name"}' \
  http://localhost:3000/api/admin/profile
```

## Future Enhancements

Potential fields that can be added to the admins table:
- `email` - Admin email address
- `phone` - Admin phone number
- `profile_picture_path` - Custom profile picture
- `last_login` - Timestamp of last login
- `status` - Active/Inactive status
