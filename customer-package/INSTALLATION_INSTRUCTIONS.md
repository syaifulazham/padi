# Paddy Collection Center - Installation Instructions

## ⚠️ IMPORTANT: Use Installer, Not Portable Version

The **portable .exe has limitations** with `.env` file loading due to Windows temp folder extraction.

**Use the INSTALLER version instead:** `Paddy Collection Center Setup 1.0.0.exe`

---

## 📦 Installation Steps

### Step 1: Run the Installer

1. Double-click: `Paddy Collection Center Setup 1.0.0.exe`
2. Choose installation directory (recommended: `C:\Program Files\Paddy Collection Center`)
3. Complete installation wizard

### Step 2: Create .env Configuration File

After installation, create `.env` file in the **installation directory**:

**Location:**
```
C:\Program Files\Paddy Collection Center\.env
```

**Contents:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=paddy_collection_db

# Security
QR_HASH_SECRET=f6062c05ab1559acdd77be781745b1845d8cc23bddf583c99ce6f5e40e6790b1

# Environment
NODE_ENV=production
```

**⚠️ IMPORTANT:** Replace `YOUR_MYSQL_PASSWORD_HERE` with your actual MySQL password!

### Step 3: Setup Database (First Time Only)

1. Navigate to: `database-setup` folder (from the zip)
2. Edit `database-setup\.env.example` with your MySQL credentials
3. Save as `.env` (remove `.example`)
4. Run: `setup_database.bat`
5. Wait for "Database setup completed successfully!"

### Step 4: Launch Application

1. Start menu → Paddy Collection Center
2. Or: Desktop shortcut (if created during install)
3. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`

**⚠️ IMPORTANT:** Change admin password immediately after first login!

---

## 🔧 Troubleshooting

### If You Get Database Error:

The app will show a detailed error dialog with:
- ✅ Exact `.env` file path being used
- ✅ Database credentials (user, host, database name)
- ✅ Specific error message

**Common Issues:**

1. **"Password: NOT SET ❌"**
   - Edit `.env` file in installation directory
   - Add your MySQL password
   - Restart application

2. **"Access denied for user 'root'"**
   - Check MySQL password is correct
   - Verify user exists: `mysql -u root -p`

3. **".env File Loaded From: [temp folder]"**
   - You're running the portable .exe instead of installed version
   - Use the installer version instead!

4. **"Can't connect to MySQL server"**
   - Check MySQL service is running:
     - Windows Services → MySQL → Start
   - Verify MySQL is on port 3306

5. **"Unknown database 'paddy_collection_db'"**
   - Run `database-setup\setup_database.bat` first
   - Creates the database automatically

---

## 📁 Installation Directory Structure

After installation, the directory should look like:

```
C:\Program Files\Paddy Collection Center\
├── Paddy Collection Center.exe
├── .env                          ← CREATE THIS FILE
├── resources\
│   └── app.asar
└── (other system files)
```

---

## 🔐 Default Credentials

**Application Login:**
- Username: `admin`
- Password: `admin123`

**MySQL (Example):**
- User: `root`
- Password: `(your MySQL root password)`
- Database: `paddy_collection_db`

---

## ⚙️ MySQL 8.0+ Compatibility

This application supports both:
- ✅ MySQL 5.7+ with `mysql_native_password`
- ✅ MySQL 8.0+ with `caching_sha2_password` (default)

No special MySQL configuration needed!

---

## 📞 Support

If you encounter issues:

1. Check the error dialog - it shows detailed configuration info
2. Verify `.env` file exists in installation directory
3. Confirm MySQL credentials are correct
4. Ensure database was created with `setup_database.bat`

For persistent issues, provide:
- Error message from dialog
- `.env` file path shown in error
- MySQL version
- Windows version

---

## 🎯 Quick Checklist

- [ ] Run installer: `Paddy Collection Center Setup 1.0.0.exe`
- [ ] Create `.env` in installation directory
- [ ] Add MySQL password to `.env`
- [ ] Run `database-setup\setup_database.bat`
- [ ] Launch application
- [ ] Login with admin/admin123
- [ ] Change admin password

**Installation complete! Ready to use.** 🚀
