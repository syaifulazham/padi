# Fix: QR_HASH_SECRET Error

## Error Message
```
Uncaught Exception:
Error: QR_HASH_SECRET must be set in .env and be at least 32 characters long
```

---

## ✅ IMMEDIATE FIX FOR CUSTOMER

### Option 1: Create .env File Manually

1. **Navigate to application folder:**
   - Portable version: Where you extracted the .exe
   - Installed version: `C:\Users\[YourName]\AppData\Local\Programs\Paddy Collection Center\resources\app`

2. **Create a file named `.env`** (note the dot at the beginning)
   
3. **Add this content:**
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=paddy_collection_db
   DB_USER=root
   DB_PASSWORD=your_mysql_password_here
   
   # Application Settings
   NODE_ENV=production
   
   # QR Code Security (Required!)
   QR_HASH_SECRET=f6062c05ab1559acdd77be781745b1845d8cc23bddf583c99ce6f5e40e6790b1
   
   # Weighbridge Settings (optional)
   WEIGHBRIDGE_PORT=COM3
   WEIGHBRIDGE_BAUD_RATE=9600
   ```

4. **Update DB_PASSWORD** with your actual MySQL password

5. **Restart the application**

---

### Option 2: Use Updated Installer

Wait for the new package that includes the .env file automatically.

---

## 🔧 For Portable Version Users

**Quick Steps:**

1. Open folder where you extracted `Paddy Collection Center 1.0.0.exe`

2. Create new text file named `.env` in the same folder

3. Copy and paste the configuration above

4. Save and restart application

**Folder structure should be:**
```
C:\PaddyCollectionCenter\
├── Paddy Collection Center 1.0.0.exe
└── .env                    ← Create this file
```

---

## 🖥️ For Installed Version Users

**Find the installation folder:**

1. Press **Windows + R**
2. Type: `%LOCALAPPDATA%\Programs\Paddy Collection Center\resources\app`
3. Press Enter
4. Create `.env` file here with content above

---

## 📝 Creating .env File in Windows

**Method 1 - Notepad:**
```
1. Open Notepad
2. Paste the configuration content
3. Click "File" → "Save As"
4. File name: .env (with quotes: ".env")
5. Save as type: All Files (*.*)
6. Save
```

**Method 2 - Command Prompt:**
```cmd
cd C:\PaddyCollectionCenter
echo # Database Configuration > .env
echo DB_HOST=localhost >> .env
echo DB_PORT=3306 >> .env
echo DB_NAME=paddy_collection_db >> .env
echo DB_USER=root >> .env
echo DB_PASSWORD=your_password >> .env
echo NODE_ENV=production >> .env
echo QR_HASH_SECRET=f6062c05ab1559acdd77be781745b1845d8cc23bddf583c99ce6f5e40e6790b1 >> .env
```

Then edit with Notepad to update your actual password.

---

## 🎯 What is QR_HASH_SECRET?

This is a security key used to:
- Generate secure QR codes for receipts
- Prevent tampering with transaction data
- Ensure receipt authenticity

It must be at least 32 characters long.

---

## ✅ Verification

After creating the .env file:

1. **Restart the application**
2. **Application should start without error**
3. **Test by creating a purchase transaction**
4. **Generate a receipt with QR code**

---

## 🚨 Common Mistakes

### ❌ File named `.env.txt` instead of `.env`
- Windows hides file extensions by default
- Make sure it's `.env` not `.env.txt`

### ❌ QR_HASH_SECRET too short
- Must be at least 32 characters
- Use the provided value or generate a new one

### ❌ Wrong folder location
- Portable: Same folder as the .exe
- Installed: Inside resources\app folder

---

## 🔐 Generate Your Own Secret (Optional)

For better security, generate a unique secret:

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Using PowerShell:**
```powershell
-join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Using Online Generator:**
- Visit: https://randomkeygen.com/
- Use "CodeIgniter Encryption Keys" (256-bit)

---

## 📞 Still Having Issues?

**Check:**
- [ ] .env file is in correct location
- [ ] File is named `.env` not `.env.txt`
- [ ] QR_HASH_SECRET is exactly 64 characters
- [ ] No extra spaces or quotes around the value
- [ ] Application has been restarted

**Contact support with:**
- Screenshot of error
- Screenshot of .env file location
- Application version

---

## 🔄 For Future Installations

New package version will include .env file automatically.
You won't need to create it manually.
