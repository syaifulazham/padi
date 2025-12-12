# 📋 Deployment Checklist

Quick reference for deploying Paddy Collection Center to customers.

---

## 🚀 Pre-Deployment (Developer)

### Code Preparation
- [ ] All features tested and working
- [ ] No console errors or warnings
- [ ] Database migrations ready
- [ ] Environment variables documented
- [ ] Code committed and pushed to repository
- [ ] Version number updated in `package.json`

### Build Preparation
- [ ] Dependencies updated (`npm update`)
- [ ] Clean install tested (`rm -rf node_modules && npm install`)
- [ ] Development build works (`npm run dev`)
- [ ] Production build works (`npm run build`)
- [ ] Electron build configured in `package.json`

### Documentation
- [ ] CHANGELOG.md updated
- [ ] README.md current
- [ ] Known issues documented
- [ ] Installation instructions reviewed
- [ ] Update instructions prepared

---

## 🔨 Build Process

### Step 1: Prepare Build Environment

```bash
cd /Users/azham/a-job/repo/padi/app

# Clean previous builds
rm -rf dist/
rm -rf build/

# Fresh install
rm -rf node_modules
npm install
```

### Step 2: Build Frontend

```bash
npm run build
```

**Verify:**
- [ ] No build errors
- [ ] Build folder created: `app/build/`
- [ ] All assets present (JS, CSS, images)

### Step 3: Build Installers

```bash
# For Windows (most common)
npm run build:electron -- --win

# For macOS (if needed)
npm run build:electron -- --mac

# For Linux (if needed)
npm run build:electron -- --linux

# For all platforms
npm run build:electron -- --win --mac --linux
```

**Build time:** 5-15 minutes depending on platform

**Output location:** `app/dist/`

**Expected files:**
- Windows: `Paddy Collection Center Setup X.X.X.exe` (~80-120 MB)
- macOS: `Paddy Collection Center-X.X.X.dmg` (~85-130 MB)
- Linux: `Paddy-Collection-Center-X.X.X.AppImage` (~90-140 MB)

### Step 4: Verify Build

```bash
# Check file exists
ls -lh app/dist/

# Calculate checksum (for verification)
shasum -a 256 app/dist/*.exe > checksums.txt
```

- [ ] Installer file exists
- [ ] File size reasonable (not too large/small)
- [ ] Checksum generated

---

## 📦 Package Creation

### Step 1: Create Distribution Package

```bash
# Create package folder
mkdir -p customer-package/database-setup

# Copy installer
cp app/dist/Paddy*.exe customer-package/
# or for Mac: cp app/dist/Paddy*.dmg customer-package/
# or for Linux: cp app/dist/Paddy*.AppImage customer-package/

# Copy database files
cp -r migrations/ customer-package/database-setup/
cp scripts/setup_database.sh customer-package/database-setup/
cp .env.example customer-package/database-setup/

# Copy documentation
cp CUSTOMER_INSTALLATION_INSTRUCTIONS.md customer-package/
cp INSTALLATION_GUIDE.md customer-package/
```

### Step 2: Create Setup Scripts

**For Windows customers, create `database-setup/setup_database.bat`:**

```batch
@echo off
echo ================================
echo Database Setup for Paddy Center
echo ================================
echo.

REM Check if MySQL is installed
mysql --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: MySQL is not installed or not in PATH
    echo Please install MySQL 8.0+ first
    pause
    exit /b 1
)

REM Load environment variables
if not exist .env (
    echo ERROR: .env file not found
    echo Please copy .env.example to .env and configure it
    pause
    exit /b 1
)

echo Reading configuration from .env...
for /f "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="DB_NAME" set DB_NAME=%%b
    if "%%a"=="DB_USER" set DB_USER=%%b
    if "%%a"=="DB_PASSWORD" set DB_PASSWORD=%%b
)

echo.
echo Creating database: %DB_NAME%
mysql -u %DB_USER% -p%DB_PASSWORD% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME%;"

echo.
echo Running migrations...
for %%f in (migrations\*.sql) do (
    echo Processing: %%f
    mysql -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < "%%f"
)

echo.
echo ================================
echo Database setup complete!
echo ================================
pause
```

### Step 3: Add README

Create `customer-package/README.txt`:

```text
====================================
Paddy Collection Center v1.0.0
====================================

Installation Package Contents:
1. Paddy-Collection-Center-Setup.exe - Main application installer
2. database-setup/ - Database setup scripts
3. CUSTOMER_INSTALLATION_INSTRUCTIONS.md - Step-by-step guide

System Requirements:
- Windows 10/11 (64-bit)
- MySQL 8.0 or higher
- 4GB RAM minimum
- 10GB free disk space

Quick Start:
1. Install MySQL if not already installed
2. Run database-setup/setup_database.bat
3. Run Paddy-Collection-Center-Setup.exe
4. Follow the installation wizard

Support:
Email: support@yourcompany.com
Phone: +XX XXXX XXXX

Last Updated: [DATE]
Package Version: 1.0.0
```

### Step 4: Create Archive

```bash
# Create ZIP archive
cd customer-package
zip -r Paddy-Collection-Center-v1.0.0-Windows.zip *

# Or create TAR.GZ for Linux
tar -czf Paddy-Collection-Center-v1.0.0-Linux.tar.gz *
```

- [ ] Archive created
- [ ] File size reasonable (~100-150 MB)
- [ ] Test extraction

---

## 🧪 Testing Before Deployment

### Test on Clean Machine

Use a virtual machine or fresh computer:

1. **Setup Test Environment**
   - [ ] Fresh Windows 10/11 installation
   - [ ] No development tools installed
   - [ ] No MySQL installed initially

2. **Test Installation Process**
   - [ ] Install MySQL following instructions
   - [ ] Run database setup script
   - [ ] Database created successfully
   - [ ] Tables created successfully
   - [ ] Sample data loaded (if included)

3. **Test Application**
   - [ ] Installer runs without errors
   - [ ] Application launches successfully
   - [ ] Can configure database connection
   - [ ] Can login/create first user
   - [ ] Dashboard loads correctly
   - [ ] Can create test transaction
   - [ ] Can print test receipt (if printer available)

4. **Test Hardware Integration**
   - [ ] Weighbridge connection works (if available)
   - [ ] Printer connection works (if available)
   - [ ] Serial ports detected correctly

### Common Issues to Check

- [ ] No "VCRUNTIME140.dll missing" errors
- [ ] No "Application cannot start" errors
- [ ] No database connection timeout
- [ ] No permission issues
- [ ] Application doesn't crash on startup
- [ ] Windows doesn't block installation

---

## 📨 Delivery Methods

### Method 1: Direct File Transfer

**Use when:**
- Single customer
- Small team
- Local installation

**Steps:**
1. Upload to cloud storage (Google Drive, Dropbox)
2. Share link with customer
3. Include download instructions
4. Verify customer received files

### Method 2: Download Portal

**Use when:**
- Multiple customers
- Need version control
- Professional appearance

**Setup:**
```bash
# Simple web server
npm install -g http-server
cd customer-packages
http-server -p 8080
```

### Method 3: USB/Physical Media

**Use when:**
- Customer has slow internet
- High security requirements
- Remote locations

**Steps:**
1. Copy package to USB drive
2. Include printed instructions
3. Test USB drive before shipping
4. Ship with tracking

### Method 4: GitHub Releases (Auto-Update)

**Use when:**
- Auto-update implemented
- Public or private repository
- Automated distribution

**Steps:**
```bash
# Tag version
git tag v1.0.0
git push origin v1.0.0

# Build and publish
npm run build:electron -- --publish always
```

---

## 👥 Customer Onboarding

### Step 1: Pre-Installation Communication

Send email to customer:

```
Subject: Paddy Collection Center - Ready for Installation

Dear [Customer Name],

Your Paddy Collection Center application is ready for installation!

Package Details:
- Version: 1.0.0
- Release Date: [DATE]
- File Size: ~120 MB
- Installation Time: 20-30 minutes

Download Link: [LINK]
Password: [IF APPLICABLE]

Next Steps:
1. Download the installation package
2. Follow CUSTOMER_INSTALLATION_INSTRUCTIONS.md
3. Contact us if you need assistance

We'll schedule a remote session to verify installation if needed.

Support Contact:
Email: support@yourcompany.com
Phone: +XX XXXX XXXX

Best regards,
[Your Name]
```

### Step 2: Installation Support

Schedule support session:
- [ ] Calendar invite sent
- [ ] Remote support tool ready (TeamViewer, AnyDesk)
- [ ] Checklist prepared
- [ ] Test data ready

### Step 3: Post-Installation

- [ ] Verify installation successful
- [ ] Test all major features
- [ ] Configure hardware (weighbridge, printer)
- [ ] Import any existing data
- [ ] Create user accounts
- [ ] Provide quick training
- [ ] Answer questions
- [ ] Schedule follow-up

---

## 📊 Deployment Tracking

### Deployment Log Template

| Date | Customer | Version | Status | Notes | Support Needed |
|------|----------|---------|--------|-------|----------------|
| 2024-12-11 | Customer A | 1.0.0 | Success | No issues | None |
| 2024-12-12 | Customer B | 1.0.0 | Issues | Weighbridge driver | Yes |

### Metrics to Track

- [ ] Total deployments
- [ ] Successful installations
- [ ] Installation time (average)
- [ ] Issues encountered
- [ ] Support tickets created
- [ ] Customer satisfaction

---

## 🔄 Update Deployment

### For Existing Customers

**Step 1: Notify Customer**

```
Subject: Paddy Collection Center Update v1.1.0 Available

Dear [Customer],

A new update is available for Paddy Collection Center.

What's New:
- Improved performance
- Bug fixes
- New reporting features

Update Method:
[Choose one:]

A) Auto-Update (if implemented):
   The app will notify you when the update is ready.
   Simply click "Download" when prompted.

B) Manual Update:
   1. Download new installer from: [LINK]
   2. Backup your database (Settings → Backup)
   3. Run the new installer
   4. Your data will be preserved

Downtime: Approximately 5 minutes
Recommended Time: After business hours

Need help? Contact us at support@yourcompany.com

Best regards,
[Your Name]
```

**Step 2: Deployment**

- [ ] Customer notified 48 hours in advance
- [ ] Backup instructions provided
- [ ] Update window scheduled
- [ ] Support available during update
- [ ] Rollback plan ready

**Step 3: Verification**

After update:
- [ ] Customer confirms app works
- [ ] Version number verified
- [ ] All features tested
- [ ] No data loss
- [ ] Hardware still working

---

## 🚨 Troubleshooting Quick Reference

### Installation Failed

**Symptoms:** Installer won't run or crashes
**Solutions:**
1. Run as Administrator
2. Disable antivirus temporarily
3. Check disk space
4. Try older Windows compatibility mode

### Database Connection Failed

**Symptoms:** Can't connect to database
**Solutions:**
1. Verify MySQL is running
2. Check credentials in .env
3. Test connection with MySQL Workbench
4. Check firewall settings

### Weighbridge Not Detected

**Symptoms:** Serial port not found
**Solutions:**
1. Install COM port drivers
2. Check Device Manager
3. Try different USB port
4. Verify cable connection

### Application Won't Start

**Symptoms:** Nothing happens when launching
**Solutions:**
1. Check Windows Event Viewer
2. Look for missing DLL errors
3. Install Visual C++ Redistributables
4. Reinstall application

---

## ✅ Final Checklist

Before marking deployment complete:

### Technical
- [ ] Application installed and launches
- [ ] Database connected and working
- [ ] All tables created
- [ ] Sample data loaded (if applicable)
- [ ] Weighbridge configured (if applicable)
- [ ] Printer configured (if applicable)
- [ ] Backups configured
- [ ] Logs directory writable

### User
- [ ] Admin account created
- [ ] User accounts created
- [ ] Company details configured
- [ ] Season created
- [ ] Test transaction completed
- [ ] Receipt printed successfully

### Documentation
- [ ] User manual provided
- [ ] Quick reference card provided
- [ ] Support contact information shared
- [ ] Backup procedures explained

### Training
- [ ] Basic navigation shown
- [ ] Transaction workflow demonstrated
- [ ] Reporting features explained
- [ ] Troubleshooting covered
- [ ] Questions answered

### Follow-up
- [ ] Support session scheduled
- [ ] Feedback requested
- [ ] Satisfaction survey sent
- [ ] Next steps communicated

---

## 📞 Emergency Contacts

**Critical Issues:**
- Email: urgent@yourcompany.com
- Phone: +XX XXXX XXXX (24/7)

**General Support:**
- Email: support@yourcompany.com
- Phone: +XX XXXX XXXX (Business hours)

**Remote Support:**
- TeamViewer: XXXXXXXXX
- AnyDesk: XXXXXXXXX

---

## 📚 Additional Resources

- [Full Installation Guide](INSTALLATION_GUIDE.md)
- [Customer Instructions](CUSTOMER_INSTALLATION_INSTRUCTIONS.md)
- [Auto-Update Setup](AUTO_UPDATE_IMPLEMENTATION.md)
- [Database Documentation](README.md)

---

**Deployment Checklist Version:** 1.0  
**Last Updated:** December 2024  
**For App Version:** 1.0.0+
