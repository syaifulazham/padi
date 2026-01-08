# Windows Installation Troubleshooting Guide

## ⚠️ Error: "Installer integrity check has failed"

### Problem
When running the Windows installer (.exe), you see:
```
Installer integrity check has failed. Common causes include incomplete download and damaged media.
```

### Root Cause
This error occurs when the Windows installer was built on macOS/Linux. The NSIS installer format can have compatibility issues with cross-platform builds.

---

## ✅ **SOLUTION 1: Use Portable Version (Recommended)**

### Steps:
1. Extract the customer package ZIP
2. Look for `Paddy Collection Center 1.0.0.exe` (portable version)
3. Create a folder: `C:\PaddyCollectionCenter`
4. Copy the portable .exe into this folder
5. Double-click to run - no installation needed!

**Advantages:**
- No installer required
- No administrator rights needed
- Can run from USB drive
- No integrity check issues

---

## ✅ **SOLUTION 2: Download Re-built Installer**

If you need the full installation:

### Option A: Build on Windows Machine
The installer should be built on Windows for best compatibility.

1. On a Windows 10/11 machine:
```cmd
cd C:\path\to\padi\app
npm install
npm run build
npm run build:electron -- --win
```

2. The installer will be in `app\dist\` folder
3. This installer will work perfectly on Windows

### Option B: Request Windows-Built Version
Contact support to get an installer built specifically on Windows.

---

## ✅ **SOLUTION 3: Manual Installation**

If both above fail, install manually:

### Step 1: Setup Files
```cmd
mkdir "C:\Program Files\Paddy Collection Center"
cd /d "C:\Program Files\Paddy Collection Center"
```

### Step 2: Extract Application Files
From the customer package:
1. Navigate to `customer-package\`
2. Extract the portable .exe or unpacked files
3. Copy all files to the installation folder

### Step 3: Create Desktop Shortcut
1. Right-click on `Paddy Collection Center.exe`
2. Select "Send to" → "Desktop (create shortcut)"

### Step 4: Setup Database
```cmd
cd database-setup
copy .env.example .env
notepad .env
REM Edit with your MySQL credentials
setup_database.bat
```

---

## 🔍 Verification Steps

After installation (any method):

1. **Check application runs:**
   ```cmd
   "C:\Program Files\Paddy Collection Center\Paddy Collection Center.exe"
   ```

2. **Check database connection:**
   - Launch application
   - It should connect to database automatically

3. **Test login:**
   - Username: admin
   - Password: admin123

---

## 🚨 Additional Troubleshooting

### Error: "Windows protected your PC"

**Solution:**
1. Click "More info"
2. Click "Run anyway"
3. This happens because the app isn't code-signed

### Error: "Application failed to start"

**Causes & Solutions:**

1. **Missing Visual C++ Runtime**
   - Download: https://aka.ms/vs/17/release/vc_redist.x64.exe
   - Install and restart

2. **Antivirus Blocking**
   - Add exception for Paddy Collection Center folder
   - Temporarily disable antivirus during installation

3. **Corrupted Download**
   - Re-download the package
   - Verify checksums (see .md5 or .sha256 files)

---

## 📝 For System Administrators

### Group Policy Deployment
If deploying across multiple machines:

1. **Use portable version** - easiest for mass deployment
2. Copy to standard location on all machines
3. Create shortcuts via login script
4. Pre-configure .env file with shared database

### Silent Installation (if using MSI)
```cmd
msiexec /i "Paddy Collection Center Setup.msi" /quiet /qn /norestart
```

---

## 🔧 Building Proper Windows Installer

**For developers:** To create a proper Windows installer:

1. **On Windows machine:**
   ```cmd
   cd app
   npm install
   npm run build
   npm run build:electron -- --win
   ```

2. **Result:** Clean installer without integrity errors

**On macOS (with fixes):**
   ```bash
   cd app
   # Install wine for Windows builds
   brew install wine-stable
   
   # Build
   npm run build
   npm run build:electron -- --win
   ```

---

## 📞 Support

If none of these solutions work:

1. **Email:** support@example.com with:
   - Windows version (11, 10, etc.)
   - Error message screenshot
   - Application logs

2. **Remote Assistance:**
   - TeamViewer or AnyDesk session
   - We'll help install directly

3. **Alternative Request:**
   - Request portable version only
   - Or request installer built on Windows

---

## ✅ Quick Checklist

- [ ] Downloaded complete package
- [ ] Extracted ZIP file
- [ ] Verified file integrity (checksums)
- [ ] MySQL 8.0+ installed
- [ ] Database setup completed
- [ ] Tried portable version first
- [ ] Added antivirus exception
- [ ] Installed Visual C++ Runtime
- [ ] Checked Windows version compatibility

---

**Document Version:** 1.0
**Last Updated:** January 2026
**For Application Version:** 1.0.0
