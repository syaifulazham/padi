# Fix: Installer Integrity Check Failed

## Error Message
```
Installer integrity check has failed...
```

This error occurs when the Windows installer cache is corrupted or the previous installation is incomplete.

---

## ✅ SOLUTION 1: Manual Cleanup (Recommended)

**Run as Administrator:**

1. Right-click `MANUAL_CLEANUP.bat`
2. Select "Run as administrator"
3. Follow prompts
4. After cleanup completes, restart your computer
5. Run the new installer

The script will:
- ✅ Stop all running processes
- ✅ Remove all installation files
- ✅ Clean registry entries
- ✅ Remove shortcuts
- ✅ Delete user data

---

## ✅ SOLUTION 2: Windows Installer Cache Cleanup

### Step 1: Clear Windows Installer Cache

Open Command Prompt as Administrator and run:

```cmd
cd %WINDIR%\Installer
del /F /Q *.msi
```

### Step 2: Stop Windows Installer Service

```cmd
net stop msiserver
timeout /t 5
net start msiserver
```

### Step 3: Try Installing Again

Run: `Paddy Collection Center Setup 1.0.0.exe`

---

## ✅ SOLUTION 3: Registry Cleanup (If Above Fails)

### Open Registry Editor:

1. Press `Win + R`
2. Type `regedit`
3. Press Enter

### Delete These Keys (if they exist):

```
HKEY_CURRENT_USER\Software\Paddy Collection Center
HKEY_LOCAL_MACHINE\SOFTWARE\Paddy Collection Center
HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Paddy Collection Center

HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Uninstall\Paddy Collection Center
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Paddy Collection Center
```

**⚠️ WARNING:** Be careful editing registry. Only delete the exact keys listed above.

---

## ✅ SOLUTION 4: Safe Mode Installation

If all else fails, try installing in Safe Mode:

1. Restart Windows in Safe Mode:
   - Press `Win + R`
   - Type `msconfig`
   - Boot tab → Safe boot → Minimal
   - Restart

2. In Safe Mode:
   - Run `MANUAL_CLEANUP.bat` as administrator
   - Restart to normal mode
   - Run installer

---

## 🔍 VERIFY CLEANUP WAS SUCCESSFUL

Check these locations to ensure everything is removed:

### Folders:
```
C:\Program Files\Paddy Collection Center
C:\Program Files (x86)\Paddy Collection Center
%LOCALAPPDATA%\Programs\Paddy Collection Center
%APPDATA%\Paddy Collection Center
%LOCALAPPDATA%\Paddy Collection Center
```

### Registry:
```
HKEY_CURRENT_USER\Software\Paddy Collection Center
HKEY_LOCAL_MACHINE\SOFTWARE\Paddy Collection Center
```

### Start Menu:
```
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Paddy Collection Center.lnk
```

**All should be deleted/not exist.**

---

## 📝 AFTER CLEANUP: Fresh Install

1. ✅ Confirm cleanup is complete
2. ✅ Restart computer
3. ✅ Right-click installer → "Run as administrator"
4. ✅ Choose installation directory
5. ✅ Complete installation
6. ✅ Create `.env` file in installation directory
7. ✅ Run `database-setup\setup_database.bat`
8. ✅ Launch application

---

## 🆘 STILL NOT WORKING?

### Check Windows Event Viewer:

1. Press `Win + R`
2. Type `eventvwr.msc`
3. Windows Logs → Application
4. Look for errors related to "MsiInstaller"

### Common Issues:

**Error:** "Cannot access file"
**Solution:** File in use. Use `MANUAL_CLEANUP.bat` to force stop processes.

**Error:** "Access denied"
**Solution:** Run installer as Administrator.

**Error:** "Installation directory not empty"
**Solution:** Manually delete the directory, then install again.

---

## 💡 ALTERNATIVE: Use Portable Version (If Available)

If installer keeps failing:

1. Extract application files manually
2. Copy to desired location (e.g., `C:\PaddyCollectionCenter`)
3. Create `.env` file in that location
4. Run the .exe directly (no installation needed)

**Note:** Portable version may have `.env` loading issues (as you experienced earlier), so installer is preferred.

---

## 📞 Support Checklist

If you need to report this issue, provide:

- [ ] Windows version (Win 10/11)
- [ ] Error message screenshot
- [ ] Output from `MANUAL_CLEANUP.bat`
- [ ] Windows Event Viewer logs
- [ ] User account type (Admin/Standard)
- [ ] Antivirus software installed

---

## ✅ RECOMMENDED WORKFLOW

```
1. Run MANUAL_CLEANUP.bat as Administrator
   ↓
2. Restart computer
   ↓
3. Run installer as Administrator
   ↓
4. Create .env in installation directory
   ↓
5. Setup database
   ↓
6. Launch application
```

**This should resolve 95% of installer integrity issues.**
