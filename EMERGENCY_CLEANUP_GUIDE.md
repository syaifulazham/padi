# EMERGENCY CLEANUP - Cannot Uninstall Corrupted Installation

## ⚠️ Problem
- Old installation is corrupted
- Cannot uninstall through Windows
- New installer keeps getting stuck
- Application won't close

## ✅ SOLUTION: Stop Using Installer - Use Portable Version

**DO NOT** try to fix the installer. Use the portable version instead.

---

## 🚀 QUICK FIX - 5 Minutes

### Step 1: Cancel the Installer
1. Click **"Cancel"** on the stuck installer
2. Close all installer windows

### Step 2: Force Close Running Application
1. Press **Ctrl + Shift + Esc** (Task Manager)
2. Find **ALL** of these processes and end them:
   - Paddy Collection Center
   - Paddy Collection Center Setup
   - electron.exe (any related to this app)
   - Any NSIS installers
3. Select each → Click **"End Task"**
4. Go to **"Details"** tab → Right-click → **"End Process Tree"**

### Step 3: Manual Cleanup

**Delete Installation Folders:**

Open File Explorer and delete these folders (if they exist):

```
C:\Program Files\Paddy Collection Center
C:\Program Files (x86)\Paddy Collection Center
C:\Users\[YourUsername]\AppData\Local\Paddy Collection Center
C:\Users\[YourUsername]\AppData\Local\Programs\Paddy Collection Center
C:\Users\[YourUsername]\AppData\Roaming\Paddy Collection Center
```

**Quick way to delete:**
1. Press **Windows + R**
2. Copy and paste each path:
   ```
   C:\Program Files\Paddy Collection Center
   ```
3. Press Enter → If folder exists, delete it
4. Repeat for all paths above

### Step 4: Use Portable Version

1. **Extract** `Paddy Collection Center 1.0.0.exe` from the package
   - This is the portable version (77 MB)
   - NOT the "Setup" file

2. **Create folder:**
   ```
   C:\PaddyCollectionCenter
   ```

3. **Copy portable exe** to this folder

4. **Create .env file** in same folder:
   - Right-click in folder → New → Text Document
   - Name it: `.env` (delete .txt extension)
   - Open with Notepad and paste:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=paddy_collection_db
DB_USER=root
DB_PASSWORD=YourMySQLPassword

# Application Settings
NODE_ENV=production

# QR Code Security
QR_HASH_SECRET=f6062c05ab1559acdd77be781745b1845d8cc23bddf583c99ce6f5e40e6790b1

# Weighbridge Settings
WEIGHBRIDGE_PORT=COM3
WEIGHBRIDGE_BAUD_RATE=9600
```

5. **Update DB_PASSWORD** with actual MySQL password

6. **Run the application:**
   - Double-click `Paddy Collection Center 1.0.0.exe`
   - Done! No installation needed

---

## 🔧 Advanced Cleanup (If Above Doesn't Work)

### Option A: Clean Boot and Manual Removal

**1. Boot in Safe Mode:**
```
1. Press Windows + R
2. Type: msconfig
3. Press Enter
4. Go to "Boot" tab
5. Check "Safe boot"
6. Click OK
7. Restart computer
```

**2. Delete folders** (from Step 3 above)

**3. Clean Registry:**
```
1. Press Windows + R
2. Type: regedit
3. Press Enter
4. Navigate to: HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall
5. Look for "Paddy Collection Center"
6. Right-click → Delete
7. Also check: HKEY_CURRENT_USER\SOFTWARE\Paddy Collection Center
8. Delete if exists
```

**4. Restart normally:**
```
1. Press Windows + R
2. Type: msconfig
3. Uncheck "Safe boot"
4. Click OK
5. Restart
```

**5. Use portable version** (Step 4 above)

---

### Option B: Use Cleanup Script

**Create cleanup.bat:**

1. Open Notepad
2. Paste this:

```batch
@echo off
echo ================================================
echo Paddy Collection Center - Emergency Cleanup
echo ================================================
echo.

echo Step 1: Killing processes...
taskkill /F /IM "Paddy Collection Center.exe" 2>nul
taskkill /F /IM "electron.exe" 2>nul
taskkill /F /IM "nsis*.exe" 2>nul
timeout /t 2 >nul

echo Step 2: Removing installation folders...
rd /s /q "C:\Program Files\Paddy Collection Center" 2>nul
rd /s /q "C:\Program Files (x86)\Paddy Collection Center" 2>nul
rd /s /q "%LOCALAPPDATA%\Paddy Collection Center" 2>nul
rd /s /q "%LOCALAPPDATA%\Programs\Paddy Collection Center" 2>nul
rd /s /q "%APPDATA%\Paddy Collection Center" 2>nul

echo Step 3: Cleaning temporary files...
del /f /q "%TEMP%\*paddy*.*" 2>nul
del /f /q "%TEMP%\nsis*.*" 2>nul

echo.
echo ================================================
echo Cleanup completed!
echo ================================================
echo.
echo Next steps:
echo 1. Restart your computer
echo 2. Use portable version - no installation needed
echo.
pause
```

3. Save as: `cleanup.bat`
4. Right-click → **Run as Administrator**
5. Restart computer
6. Use portable version

---

## 📋 File Structure for Portable Version

After setup, you should have:

```
C:\PaddyCollectionCenter\
├── Paddy Collection Center 1.0.0.exe
└── .env
```

That's it! Just 2 files needed.

---

## ✅ Why Portable Version is Better

**Advantages:**
- ✓ No installation = no installation problems
- ✓ No registry entries = clean system
- ✓ No administrator rights needed
- ✓ Can run from anywhere (USB, network drive)
- ✓ Easy to backup (just copy folder)
- ✓ Easy to update (replace .exe file)
- ✓ Easy to uninstall (delete folder)
- ✓ Multiple versions possible (different folders)

**For customer support, ALWAYS recommend portable version!**

---

## 🎯 Step-by-Step Summary

```
1. Cancel stuck installer
2. Kill all processes (Task Manager)
3. Delete old installation folders manually
4. Extract portable .exe to C:\PaddyCollectionCenter
5. Create .env file with configuration
6. Run portable .exe
7. Done!
```

**Time needed:** 5-10 minutes
**Installation problems:** ZERO

---

## 📞 If Customer Still Has Issues

**Checklist:**
- [ ] All processes killed in Task Manager
- [ ] All folders deleted
- [ ] Computer restarted
- [ ] Using portable version (not installer)
- [ ] .env file created correctly
- [ ] MySQL installed and running
- [ ] Firewall not blocking

**Remote Support:**
- Use TeamViewer or AnyDesk
- Walk through portable version setup
- Takes 5 minutes

---

## 🔄 Future Updates

**With portable version:**
1. Download new portable .exe
2. Close old application
3. Replace old .exe with new .exe
4. Keep same .env file
5. Done!

No installer issues ever again.

---

## ⚠️ IMPORTANT

**DO NOT:**
- ❌ Try to uninstall through Windows Settings
- ❌ Try to reinstall over corrupted version
- ❌ Use the Setup installer
- ❌ Waste time troubleshooting installer

**DO:**
- ✅ Manual cleanup
- ✅ Use portable version
- ✅ Save time and headaches

---

**This is the permanent solution. Stop fighting with installers.**
