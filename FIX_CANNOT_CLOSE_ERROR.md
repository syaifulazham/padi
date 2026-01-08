# Fix: "Paddy Collection Center cannot be closed" Error

## Problem
When installing/updating, you see:
```
Paddy Collection Center cannot be closed.
Please close it manually and click Retry to continue.
```

---

## ✅ SOLUTION - Close Running Application

### Step 1: Close Application Window
1. Look for Paddy Collection Center window
2. Click the **X** button to close it
3. If no window is visible, continue to Step 2

### Step 2: End Process via Task Manager
1. Press **Ctrl + Shift + Esc** to open Task Manager
2. Look for "Paddy Collection Center" in the list
3. Click on it
4. Click **"End Task"** button
5. Wait a few seconds

### Step 3: Check Background Processes
In Task Manager:
1. Go to **"Details"** tab
2. Look for any of these processes:
   - `Paddy Collection Center.exe`
   - `electron.exe` (related to this app)
3. Right-click → **End Process Tree**

### Step 4: Retry Installation
1. Go back to the installer
2. Click **"Retry"** button
3. Installation should now proceed

---

## 🚨 If Application Won't Close

### Option A: Restart Computer
1. Save all work
2. Restart Windows
3. Run installer immediately after restart
4. Don't open the old application

### Option B: Force Uninstall Old Version

**Method 1 - Windows Settings:**
```
1. Press Windows key
2. Type "Add or remove programs"
3. Search for "Paddy Collection Center"
4. Click → Uninstall
5. If error appears, continue to Method 2
```

**Method 2 - Manual Removal:**
```
1. Close application via Task Manager (Steps above)
2. Delete installation folder:
   - Default: C:\Program Files\Paddy Collection Center
   - Or: C:\Users\[YourName]\AppData\Local\Paddy Collection Center
3. Run new installer
```

**Method 3 - Registry Cleanup (Advanced):**
```
1. Press Windows + R
2. Type: regedit
3. Navigate to: HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall
4. Find Paddy Collection Center entry
5. Delete it
6. Restart computer
7. Run new installer
```

---

## ✅ BEST SOLUTION: Use Portable Version

**This avoids all installation issues:**

1. **Cancel the installer** (click Cancel button)

2. **Extract portable version:**
   - From the package, find: `Paddy Collection Center 1.0.0.exe`
   - This is NOT the setup file - it's the portable app

3. **Create folder:**
   ```
   C:\PaddyCollectionCenter
   ```

4. **Copy portable .exe to this folder**

5. **Run it - Done!**
   - No installation needed
   - No conflicts with old version
   - No administrator rights needed
   - No registry entries

6. **Remove old version later** (optional):
   - Use Add/Remove Programs when you have time

---

## 📝 Step-by-Step: Recommended Approach

**EASIEST METHOD:**

```
1. Press Ctrl+Alt+Delete → Task Manager
2. End "Paddy Collection Center" process
3. Click "Retry" in installer
4. Let it install

OR (BETTER):

1. Click "Cancel" in installer
2. Use portable version instead:
   - Extract "Paddy Collection Center 1.0.0.exe"
   - Copy to C:\PaddyCollectionCenter
   - Run it directly
3. No installation conflicts!
```

---

## 🔍 Verify Application is Closed

Before clicking Retry, check:

1. **System Tray (bottom-right corner):**
   - Look for app icon
   - Right-click → Exit

2. **Task Manager → Processes tab:**
   - No "Paddy Collection Center" listed

3. **Task Manager → Details tab:**
   - No "Paddy Collection Center.exe"

4. **All windows closed**

Only when all checks pass → Click **Retry**

---

## 💡 Why This Happens

- Old application is running in background
- Windows locks files being used
- Installer cannot replace locked files
- Need to close completely before updating

---

## 🎯 Quick Fix Checklist

- [ ] Close application window
- [ ] Open Task Manager (Ctrl+Shift+Esc)
- [ ] End "Paddy Collection Center" task
- [ ] Check Details tab for any remaining processes
- [ ] Click Retry in installer
- [ ] If still fails → Use portable version instead

---

## 📞 Still Having Issues?

**Use Portable Version:**
- Extract `Paddy Collection Center 1.0.0.exe` (the non-Setup file)
- Copy to a folder
- Run directly
- Problem solved!

No installation = No conflicts!
