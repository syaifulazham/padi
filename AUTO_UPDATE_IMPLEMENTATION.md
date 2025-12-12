# 🔄 Auto-Update Implementation Guide

## Overview
This guide shows you how to implement automatic updates for the Paddy Collection Center application so customers receive updates automatically without manual installation.

---

## 🎯 Benefits of Auto-Update

- ✅ Customers always have latest version
- ✅ No manual download/install needed
- ✅ Seamless background updates
- ✅ Professional user experience
- ✅ Faster bug fix deployment
- ✅ Better security patching

---

## 📋 Implementation Steps

### Step 1: Install electron-updater

```bash
cd /Users/azham/a-job/repo/padi/app
npm install electron-updater electron-log
```

---

### Step 2: Update package.json

Open `app/package.json` and add/modify the `build` section:

```json
{
  "name": "paddy-collection-center",
  "version": "1.0.0",
  "build": {
    "appId": "com.paddycenter.app",
    "productName": "Paddy Collection Center",
    "directories": {
      "output": "dist"
    },
    "files": [
      "electron/**/*",
      "build/**/*",
      "package.json"
    ],
    "publish": {
      "provider": "github",
      "owner": "YOUR_GITHUB_USERNAME",
      "repo": "padi",
      "releaseType": "release"
    },
    "win": {
      "target": ["nsis"],
      "icon": "public/icon.ico",
      "publisherName": "Your Company Name"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "deleteAppDataOnUninstall": false
    },
    "mac": {
      "target": ["dmg"],
      "icon": "public/icon.icns",
      "category": "public.app-category.business"
    },
    "linux": {
      "target": ["AppImage"],
      "icon": "public/icon.png",
      "category": "Office"
    }
  }
}
```

---

### Step 3: Create Update Manager

Create file: `app/electron/services/updateManager.js`

```javascript
const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');
const log = require('electron-log');

class UpdateManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.setupLogging();
    this.setupAutoUpdater();
  }

  setupLogging() {
    // Configure logging
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    
    // Create log file in app data folder
    log.info('Update manager initialized');
  }

  setupAutoUpdater() {
    // Disable auto-download (we want to ask user first)
    autoUpdater.autoDownload = false;
    
    // Check for updates on startup (after 10 seconds)
    setTimeout(() => {
      this.checkForUpdates();
    }, 10000);

    // Check for updates every 4 hours
    setInterval(() => {
      this.checkForUpdates();
    }, 4 * 60 * 60 * 1000);

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Checking for updates
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
      this.sendStatusToWindow('Checking for updates...');
    });

    // Update available
    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.sendStatusToWindow('Update available');
      
      // Ask user if they want to download
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available!`,
        detail: 'Would you like to download it now? The app will continue working while downloading.',
        buttons: ['Download', 'Later'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
    });

    // No update available
    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
      this.sendStatusToWindow('App is up to date');
    });

    // Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      let message = `Download speed: ${progressObj.bytesPerSecond}`;
      message += ` - Downloaded ${progressObj.percent.toFixed(2)}%`;
      message += ` (${progressObj.transferred}/${progressObj.total})`;
      
      log.info(message);
      this.sendStatusToWindow(message);
      
      // Send progress to renderer
      this.mainWindow.webContents.send('download-progress', {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total
      });
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      this.sendStatusToWindow('Update downloaded');
      
      // Notify user and ask to restart
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded successfully!',
        detail: 'The update has been downloaded. The application will restart to apply the update.',
        buttons: ['Restart Now', 'Restart Later'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          // User wants to restart now
          setImmediate(() => autoUpdater.quitAndInstall());
        }
      });
    });

    // Error handling
    autoUpdater.on('error', (err) => {
      log.error('Update error:', err);
      this.sendStatusToWindow('Error checking for updates');
      
      // Don't show error dialog for network issues
      // Just log it and try again later
    });
  }

  checkForUpdates() {
    if (process.env.NODE_ENV === 'development') {
      log.info('Skipping update check in development mode');
      return;
    }
    
    autoUpdater.checkForUpdates().catch((err) => {
      log.error('Error checking for updates:', err);
    });
  }

  sendStatusToWindow(text) {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('update-status', text);
    }
  }

  // Manual update check (called from menu)
  manualCheckForUpdates() {
    autoUpdater.checkForUpdates().then(() => {
      log.info('Manual update check initiated');
    }).catch((err) => {
      log.error('Manual update check failed:', err);
      dialog.showMessageBox(this.mainWindow, {
        type: 'error',
        title: 'Update Check Failed',
        message: 'Could not check for updates',
        detail: 'Please check your internet connection and try again.'
      });
    });
  }
}

module.exports = UpdateManager;
```

---

### Step 4: Integrate into main.js

Modify `app/electron/main.js`:

```javascript
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const log = require('electron-log');
const UpdateManager = require('./services/updateManager');

let mainWindow;
let updateManager;

// Configure logging
log.transports.file.level = 'info';
log.info('App starting...');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load your app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  // Create menu with update check option
  createMenu();

  // Initialize update manager after window is created
  updateManager = new UpdateManager(mainWindow);
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates',
          click: () => {
            if (updateManager) {
              updateManager.manualCheckForUpdates();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Paddy Collection Center',
              message: 'Paddy Collection Center',
              detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nNode: ${process.versions.node}`
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Log app version on start
app.on('ready', () => {
  log.info(`App version: ${app.getVersion()}`);
});
```

---

### Step 5: Add Update UI Component (Optional)

Create `app/src/components/UpdateNotification.jsx`:

```javascript
import React, { useEffect, useState } from 'react';
import { Alert, Progress } from 'antd';

const UpdateNotification = () => {
  const [updateStatus, setUpdateStatus] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    // Listen for update status messages
    if (window.electronAPI) {
      window.electronAPI.onUpdateStatus((status) => {
        setUpdateStatus(status);
        console.log('Update status:', status);
      });

      window.electronAPI.onDownloadProgress((progress) => {
        setDownloadProgress(Math.round(progress.percent));
        setShowProgress(true);
        console.log('Download progress:', progress);
      });
    }
  }, []);

  if (!updateStatus && !showProgress) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 20, 
      right: 20, 
      zIndex: 9999,
      minWidth: 300 
    }}>
      {showProgress && (
        <Alert
          message="Downloading Update"
          description={
            <Progress 
              percent={downloadProgress} 
              status="active"
            />
          }
          type="info"
          showIcon
          closable
          onClose={() => setShowProgress(false)}
        />
      )}
      
      {updateStatus && !showProgress && (
        <Alert
          message={updateStatus}
          type="info"
          showIcon
          closable
        />
      )}
    </div>
  );
};

export default UpdateNotification;
```

Update `app/electron/preload.js` to expose update events:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ... your existing APIs ...
  
  // Update APIs
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, status) => callback(status));
  },
  
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, progress) => callback(progress));
  }
});
```

---

### Step 6: Setup GitHub Releases (Recommended)

1. **Create GitHub Repository** (if not exists)
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/padi.git
   git push -u origin main
   ```

2. **Generate GitHub Personal Access Token**
   - Go to GitHub Settings → Developer Settings → Personal Access Tokens
   - Generate new token with `repo` scope
   - Save the token securely

3. **Set Environment Variable**
   ```bash
   # On your build machine
   export GH_TOKEN=your_github_token_here
   
   # Or on Windows:
   set GH_TOKEN=your_github_token_here
   ```

4. **Build and Publish**
   ```bash
   cd app
   
   # Update version in package.json first!
   # Then build and publish:
   npm run build:electron -- --publish always
   ```

This will:
- Build your application
- Create GitHub Release
- Upload installers automatically

---

### Step 7: Alternative - Simple Web Server

If you don't want to use GitHub:

1. **Setup Simple Update Server**

Create `update-server/server.js`:

```javascript
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const RELEASES_DIR = path.join(__dirname, 'releases');

// Serve release files
app.use('/releases', express.static(RELEASES_DIR));

// Serve latest.yml (electron-updater config)
app.get('/latest.yml', (req, res) => {
  const ymlPath = path.join(RELEASES_DIR, 'latest.yml');
  res.sendFile(ymlPath);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`Update server running on http://localhost:${PORT}`);
});
```

2. **Update package.json publish config**:

```json
{
  "build": {
    "publish": {
      "provider": "generic",
      "url": "https://your-domain.com/releases/"
    }
  }
}
```

3. **Deploy Process**:
   ```bash
   # Build
   npm run build:electron
   
   # Upload to server
   scp app/dist/*.exe user@your-server:/path/to/releases/
   scp app/dist/latest.yml user@your-server:/path/to/releases/
   ```

---

## 🚀 Release Process

### Pre-Release Checklist

```markdown
- [ ] All features tested
- [ ] Database migrations ready
- [ ] Changelog updated
- [ ] Version bumped in package.json
- [ ] Build tested on clean machine
- [ ] Rollback plan prepared
```

### Creating a New Release

1. **Update Version**
   ```bash
   cd app
   npm version patch  # or minor, or major
   ```

2. **Build and Publish**
   ```bash
   npm run build
   npm run build:electron -- --publish always
   ```

3. **Verify Release**
   - Check GitHub Releases page
   - Download and test installer
   - Monitor first few updates

4. **Notify Customers**
   - Send release notes email
   - Post on support portal
   - Update documentation

---

## 📊 Version Strategy

### Semantic Versioning

```
MAJOR.MINOR.PATCH

1.0.0 → 1.0.1 (Bug fix)
1.0.1 → 1.1.0 (New feature)
1.1.0 → 2.0.0 (Breaking change)
```

### Version Commands

```bash
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.1 → 1.1.0
npm version major  # 1.1.0 → 2.0.0
```

---

## 🔐 Code Signing (Important!)

### Why Code Sign?

Without code signing:
- Windows shows scary warnings
- Some antivirus may block
- Users lose trust

With code signing:
- Professional appearance
- No warnings
- Better security

### Getting Certificate

1. **Purchase Certificate** (~$200-400/year)
   - DigiCert
   - Sectigo
   - SSL.com

2. **Install Certificate**
   ```bash
   # On Windows
   # Import .pfx certificate to certificate store
   ```

3. **Configure in package.json**:
   ```json
   {
     "build": {
       "win": {
         "certificateFile": "./certs/certificate.pfx",
         "certificatePassword": "your-cert-password",
         "signingHashAlgorithms": ["sha256"],
         "rfc3161TimeStampServer": "http://timestamp.digicert.com"
       }
     }
   }
   ```

4. **Build with Signing**:
   ```bash
   export CSC_LINK=./certs/certificate.pfx
   export CSC_KEY_PASSWORD=your-cert-password
   npm run build:electron -- --publish always
   ```

---

## 🧪 Testing Updates

### Test Locally

```bash
# Terminal 1: Run local update server
cd update-server
node server.js

# Terminal 2: Build app pointing to local server
cd app
export ELECTRON_BUILDER_PUBLISH_URL=http://localhost:3000
npm run build:electron

# Install built app and test update process
```

### Staged Rollout

Release to small group first:

1. **Beta Channel** (10% of users)
   ```json
   {
     "build": {
       "publish": {
         "provider": "github",
         "channel": "beta"
       }
     }
   }
   ```

2. **Stable Channel** (after 48 hours)
   ```json
   {
     "build": {
       "publish": {
         "provider": "github",
         "channel": "latest"
       }
     }
   }
   ```

---

## 📈 Monitoring Updates

### Track Update Success

Create simple tracking:

```javascript
// In updateManager.js
autoUpdater.on('update-downloaded', (info) => {
  // Log to analytics
  fetch('https://your-analytics.com/track', {
    method: 'POST',
    body: JSON.stringify({
      event: 'update_downloaded',
      version: info.version,
      userId: getUserId()
    })
  });
});
```

### Metrics to Track

- Update check frequency
- Download success rate
- Installation success rate
- Time to update
- Rollback frequency
- Error rates

---

## 🚨 Rollback Strategy

### If Bad Update Released

1. **Remove from GitHub Releases**
   - Delete the bad release
   - Previous version will be offered

2. **Quick Fix Release**
   ```bash
   # Fix the issue
   npm version patch
   npm run build:electron -- --publish always
   ```

3. **Notify Affected Users**
   - Email notification
   - In-app message
   - Support portal update

---

## 💡 Best Practices

### DO:
✅ Test updates thoroughly before release  
✅ Use semantic versioning  
✅ Provide detailed release notes  
✅ Monitor first few updates  
✅ Keep update process simple  
✅ Sign your code  
✅ Have rollback plan  

### DON'T:
❌ Force immediate updates  
❌ Update during business hours  
❌ Skip version testing  
❌ Ignore user feedback  
❌ Release on Fridays (weekend issues!)  
❌ Update database schema without migration  

---

## 📝 Sample Release Notes Template

```markdown
# Version 1.2.0 Release Notes

## 🎉 What's New
- Added automatic backup scheduling
- Improved receipt printing speed
- New dashboard statistics

## 🐛 Bug Fixes
- Fixed weighbridge connection timeout
- Corrected date display in reports
- Resolved database connection issues

## ⚠️ Important Notes
- Database will be backed up automatically before update
- Update takes approximately 2 minutes
- No action required from users

## 📊 Technical Details
- Application size: 85 MB
- Update size: 12 MB (delta update)
- Compatible with: Windows 10/11

## 🆘 Support
Questions? Contact support@yourcompany.com
```

---

## ✅ Update Implementation Checklist

```markdown
- [ ] electron-updater installed
- [ ] updateManager.js created
- [ ] main.js updated
- [ ] preload.js updated
- [ ] package.json configured
- [ ] GitHub repository setup
- [ ] GH_TOKEN configured
- [ ] Test update build created
- [ ] Update process tested locally
- [ ] Code signing certificate obtained
- [ ] Documentation updated
- [ ] Customer notification prepared
```

---

## 🎓 Next Steps

After implementing auto-updates:

1. **Test thoroughly** with beta users
2. **Document** the update process for your team
3. **Train** support staff on troubleshooting
4. **Monitor** update success rates
5. **Iterate** based on feedback

---

**Need Help?** This is a complex feature. Consider:
- Starting with manual updates first
- Hiring a consultant for initial setup
- Using managed update services (like AppCenter)

**Last Updated:** December 2024  
**Implementation Guide Version:** 1.0
