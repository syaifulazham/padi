# 📦 Installation Guide for Paddy Collection Center App

## Overview
This guide covers installing the Paddy Collection Center Electron application on customer terminals and managing future updates.

---

## 🎯 Pre-Installation Requirements

### System Requirements
- **Windows**: Windows 10/11 (64-bit)
- **macOS**: macOS 10.13 or later
- **Linux**: Ubuntu 20.04+ or equivalent
- **RAM**: Minimum 4GB, Recommended 8GB
- **Disk Space**: 500MB for application + 10GB for database
- **MySQL**: 8.0 or higher (must be installed separately)

### Hardware Requirements
- Weighbridge with serial/USB connection (if using weighing features)
- Receipt printer (Dot Matrix, Thermal, or Laser)
- Network connection (for database access if remote)

---

## 📋 Installation Methods

### Method 1: Installer-Based Installation (Recommended for Customers)

#### Step 1: Build the Installer

On your development machine:

```bash
cd /Users/azham/a-job/repo/padi/app

# Install dependencies (first time only)
npm install

# Build the React frontend
npm run build

# Create installers for target platform
# For Windows:
npm run build:electron -- --win

# For macOS:
npm run build:electron -- --mac

# For Linux:
npm run build:electron -- --linux

# For all platforms:
npm run build:electron -- --win --mac --linux
```

**Output locations:**
- Windows: `app/dist/Paddy Collection Center Setup X.X.X.exe`
- macOS: `app/dist/Paddy Collection Center-X.X.X.dmg`
- Linux: `app/dist/Paddy-Collection-Center-X.X.X.AppImage`

#### Step 2: Distribute Installer

Package the following files for customers:
```
customer-package/
├── Paddy-Collection-Center-Setup.exe  (or .dmg/.AppImage)
├── database-setup/
│   ├── migrations/              (SQL migration files)
│   ├── setup_database.sh        (or .bat for Windows)
│   └── .env.example
├── INSTALLATION_INSTRUCTIONS.txt
└── LICENSE.txt
```

#### Step 3: Customer Installation

**On Customer Terminal:**

1. **Install MySQL** (if not already installed)
   - Download MySQL 8.0+ from mysql.com
   - Install with default settings
   - Note down the root password

2. **Setup Database**
   ```bash
   # Navigate to database-setup folder
   cd database-setup
   
   # Copy and configure environment file
   cp .env.example .env
   # Edit .env with database credentials
   
   # Run database setup
   ./setup_database.sh
   ```

3. **Install Application**
   - **Windows**: Double-click `Paddy-Collection-Center-Setup.exe`
     - Follow installation wizard
     - Choose installation directory (default: C:\Program Files\Paddy Collection Center)
     - Allow installation to complete
   
   - **macOS**: 
     - Open `Paddy-Collection-Center.dmg`
     - Drag app to Applications folder
     - Right-click and select "Open" (first time only for security)
   
   - **Linux**:
     ```bash
     chmod +x Paddy-Collection-Center.AppImage
     ./Paddy-Collection-Center.AppImage
     ```

4. **Configure Application**
   - Launch the application
   - On first run, configure:
     - Database connection settings
     - Weighbridge serial port (if applicable)
     - Printer settings
     - Company details

---

### Method 2: Portable Installation

For customers who prefer not to install:

1. Build a portable version:
   ```bash
   npm run build:electron -- --win portable
   ```

2. This creates a portable executable that can run from USB or any folder
3. Customer needs to:
   - Extract to desired location
   - Create `.env` file in app directory
   - Run the executable

---

## 🔄 Update Strategy

### Option 1: Manual Updates (Simple but requires user action)

#### For Developer:
1. Build new version with updated version number in `package.json`
2. Create installer as shown above
3. Distribute new installer to customers

#### For Customer:
1. Backup database before updating
   ```bash
   mysqldump -u root -p paddy_collection_db > backup_$(date +%Y%m%d).sql
   ```
2. Close the current application
3. Run new installer (Windows will automatically uninstall old version)
4. Launch new version
5. Run any new database migrations if provided

**Pros:** Simple, reliable, full control
**Cons:** Manual process, requires customer action

---

### Option 2: Auto-Update with electron-updater (Recommended for Production)

#### Step 1: Add electron-updater

```bash
cd app
npm install electron-updater
```

#### Step 2: Update package.json

Add this to your `package.json`:

```json
{
  "build": {
    "publish": {
      "provider": "generic",
      "url": "https://your-update-server.com/downloads/"
    }
  }
}
```

#### Step 3: Modify main.js

Add auto-update code to `electron/main.js`:

```javascript
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// Check for updates when app is ready
app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});

// Update events
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available.');
});

autoUpdater.on('update-downloaded', (info) => {
  // Notify user
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'A new version has been downloaded. Restart to apply updates.',
    buttons: ['Restart', 'Later']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});
```

#### Step 4: Setup Update Server

**Simple File Server Option:**
```bash
# On your server
mkdir -p /var/www/updates
# Upload new releases here
# Structure:
# /var/www/updates/
#   ├── latest.yml (auto-generated by electron-builder)
#   └── Paddy-Collection-Center-Setup-X.X.X.exe
```

**Alternative: Use GitHub Releases**
```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "padi"
    }
  }
}
```

#### Step 5: Build and Publish

```bash
# Build and publish to GitHub
npm run build:electron -- --publish always

# Or build and manually upload to server
npm run build:electron
# Upload dist/*.exe and dist/latest.yml to your server
```

**Pros:** Automatic, seamless, professional
**Cons:** Requires update server, more complex setup

---

### Option 3: Delta Updates (Advanced)

For large applications, use delta updates to download only changes:

```bash
npm install electron-differential-updater
```

Configure in `package.json`:
```json
{
  "build": {
    "nsis": {
      "differentialPackage": true
    }
  }
}
```

---

## 🛠️ Update Workflow Recommendation

### For Small Deployments (< 10 customers)
Use **Manual Updates (Option 1)**
- Send installer via email or cloud storage
- Provide release notes
- Offer remote assistance if needed

### For Medium Deployments (10-50 customers)
Use **Auto-Update (Option 2)** with simple file server
- Host on your web server
- Automatic notifications
- Staged rollout capability

### For Large Deployments (50+ customers)
Use **Auto-Update (Option 2)** with GitHub or dedicated CDN
- Use GitHub Releases for version control
- Implement staged rollouts
- Add rollback capability

---

## 📝 Update Checklist for Developers

Before releasing update:

```markdown
- [ ] Increment version in package.json
- [ ] Test new version thoroughly
- [ ] Create database migration scripts (if schema changed)
- [ ] Update CHANGELOG.md with changes
- [ ] Build installers for all platforms
- [ ] Test installers on clean systems
- [ ] Prepare rollback plan
- [ ] Notify customers about upcoming update
- [ ] Upload to distribution server
- [ ] Monitor first installations for issues
```

---

## 🔐 Security Best Practices

### Code Signing (Important for Windows)

1. **Obtain Code Signing Certificate**
   - Purchase from providers like DigiCert, Sectigo
   - Cost: ~$100-300/year

2. **Configure in package.json**
   ```json
   {
     "build": {
       "win": {
         "certificateFile": "path/to/certificate.pfx",
         "certificatePassword": "your-password",
         "signingHashAlgorithms": ["sha256"]
       }
     }
   }
   ```

3. **Build with signing**
   ```bash
   npm run build:electron -- --win
   ```

**Why needed:** 
- Prevents Windows SmartScreen warnings
- Builds customer trust
- Required for enterprise deployment

---

## 🚨 Troubleshooting Common Installation Issues

### Issue: "Windows protected your PC" warning
**Solution:** Application needs code signing certificate

### Issue: Database connection fails
**Solution:** 
- Check MySQL is running
- Verify credentials in .env file
- Check firewall settings

### Issue: Weighbridge not detected
**Solution:**
- Install correct serial port drivers
- Check COM port number in settings
- Verify cable connection

### Issue: Update fails to install
**Solution:**
- Close application completely
- Check disk space
- Run as administrator (Windows)
- Check antivirus isn't blocking

---

## 📞 Customer Support Package

Provide customers with:

1. **Quick Start Guide** (1-page PDF)
2. **Video Tutorial** (5-10 minutes)
3. **FAQ Document**
4. **Support Contact Information**
5. **Remote Support Tool** (TeamViewer, AnyDesk)

---

## 🔄 Migration from Old Version

If customers are migrating from an older system:

```bash
# Export data from old system
# Import to new database
mysql -u root -p paddy_collection_db < old_data_export.sql

# Run migration scripts
cd migrations
mysql -u root -p paddy_collection_db < 001_update_schema.sql

# Verify data integrity
mysql -u root -p paddy_collection_db < verify_data.sql
```

---

## 📊 Version Numbering Strategy

Use Semantic Versioning (SemVer):
- **Major.Minor.Patch** (e.g., 1.2.3)
- **Major**: Breaking changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes only

Example:
- `1.0.0` - Initial release
- `1.0.1` - Bug fixes
- `1.1.0` - New reporting feature
- `2.0.0` - Database schema change (breaking)

---

## 📦 Distribution Channels

### Option 1: Direct Distribution
- Email installers to customers
- Use cloud storage (Dropbox, Google Drive)
- FTP/SFTP server

### Option 2: Download Portal
- Create simple website with download links
- Track download counts
- Provide version history

### Option 3: USB/Physical Media
- For offline installations
- Include all dependencies
- Provide printed documentation

---

## ✅ Post-Installation Verification

After installation, verify:

```bash
# Database connection
mysql -u root -p paddy_collection_db -e "SELECT COUNT(*) FROM farmers;"

# Application logs
# Windows: %APPDATA%/Paddy Collection Center/logs
# macOS: ~/Library/Logs/Paddy Collection Center/
# Linux: ~/.config/Paddy Collection Center/logs

# Hardware connections
# Check weighbridge in app settings
# Print test receipt
```

---

## 📈 Monitoring Updates Success

Track update metrics:
- Update adoption rate
- Failed installation reports
- Customer feedback
- Rollback frequency

Create simple dashboard or spreadsheet to monitor deployment health.

---

**Need help?** Contact development team or refer to technical documentation.

**Last Updated:** 2024-12-11  
**Document Version:** 1.0
