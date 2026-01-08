# Paddy Collection Center - Customer Installation Guide

## 📦 Quick Installation Guide

### System Requirements
- **Operating System**: Windows 10/11 (64-bit), macOS 10.13+, or Ubuntu 20.04+
- **RAM**: Minimum 4GB, Recommended 8GB
- **Disk Space**: 500MB for application + 10GB for database
- **Database**: MySQL 8.0 or higher (included in installation package)
- **Hardware**: Weighbridge (optional), Receipt printer

---

## 🚀 Installation Steps

### Step 1: Install MySQL Database

#### Windows
1. Download MySQL 8.0+ installer from: https://dev.mysql.com/downloads/mysql/
2. Run the installer and follow the wizard
3. Choose "Server only" installation
4. Set root password (remember this password!)
5. Use default port 3306
6. Complete installation

#### macOS
```bash
# Using Homebrew
brew install mysql@8.0
brew services start mysql@8.0

# Set root password
mysql_secure_installation
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

---

### Step 2: Setup Database

1. **Navigate to database-setup folder**
   ```bash
   cd database-setup
   ```

2. **Configure database credentials**
   - Copy `.env.example` to `.env`
   - Edit `.env` file with your MySQL credentials:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password_here
   DB_NAME=paddy_collection_db
   ```

3. **Run database setup**
   
   **Windows:**
   ```cmd
   setup_database.bat
   ```
   
   **macOS/Linux:**
   ```bash
   chmod +x setup_database.sh
   ./setup_database.sh
   ```

4. **Verify installation**
   ```bash
   mysql -u root -p paddy_collection_db -e "SHOW TABLES;"
   ```
   You should see a list of tables created.

---

### Step 3: Install Application

#### Windows
1. Locate `Paddy-Collection-Center-Setup.exe`
2. Double-click to run installer
3. If you see "Windows protected your PC" warning:
   - Click "More info"
   - Click "Run anyway"
4. Follow installation wizard
5. Choose installation directory (default: C:\Program Files\Paddy Collection Center)
6. Wait for installation to complete
7. Click "Finish"

#### macOS
1. Open `Paddy-Collection-Center.dmg`
2. Drag app icon to Applications folder
3. Eject the DMG
4. Open Applications folder
5. Right-click on Paddy Collection Center
6. Select "Open" (first time only, to bypass security)
7. Click "Open" in confirmation dialog

#### Linux
1. Make the AppImage executable:
   ```bash
   chmod +x Paddy-Collection-Center.AppImage
   ```
2. Run the application:
   ```bash
   ./Paddy-Collection-Center.AppImage
   ```
3. (Optional) Move to /opt for system-wide installation

---

### Step 4: First-Time Configuration

1. **Launch the application**
   - Windows: Start Menu → Paddy Collection Center
   - macOS: Applications → Paddy Collection Center
   - Linux: Run the AppImage

2. **Default Login**
   - Username: `admin`
   - Password: `admin123`
   - **⚠️ IMPORTANT: Change password immediately after first login!**

3. **Configure Settings**
   Navigate to Settings to configure:
   
   **a. Database Connection**
   - Host: localhost
   - Port: 3306
   - Database: paddy_collection_db
   - Username: (your MySQL user)
   - Password: (your MySQL password)
   - Test connection

   **b. Company Details**
   - Company name
   - Address
   - Contact information
   - Registration number

   **c. Weighbridge (if applicable)**
   - Serial port (e.g., COM1, /dev/ttyUSB0)
   - Baud rate: 9600
   - Data format settings
   - Test connection

   **d. Printer**
   - Select printer type (Dot Matrix/Thermal/Laser)
   - Choose default printer
   - Configure receipt template
   - Print test receipt

4. **Create Initial Data**
   - Add first harvesting season
   - Add farmers
   - Add products (e.g., MR076 - BERNAS)
   - Set base prices

---

## 🔧 Hardware Setup

### Weighbridge Connection

1. **Connect weighbridge to computer**
   - USB to Serial adapter (if needed)
   - Note the COM port number

2. **Install drivers** (if required)
   - Windows: Usually auto-detected
   - Linux: May need `sudo usermod -a -G dialout $USER`

3. **Configure in application**
   - Settings → Weighbridge
   - Select COM port
   - Set baud rate (usually 9600)
   - Test connection

### Printer Setup

1. **Install printer**
   - Connect printer to computer
   - Install manufacturer drivers
   - Set as default printer (optional)

2. **Configure in application**
   - Settings → Printer
   - Select printer
   - Configure page size and margins
   - Print test receipt

---

## 📊 Initial Setup Checklist

- [ ] MySQL installed and running
- [ ] Database created successfully
- [ ] Application installed
- [ ] First login successful
- [ ] Admin password changed
- [ ] Company details configured
- [ ] Weighbridge configured (if applicable)
- [ ] Printer configured
- [ ] First season created
- [ ] Test farmers added
- [ ] Products configured
- [ ] Test purchase transaction completed
- [ ] Receipt printed successfully

---

## 🔄 Updates

### Checking for Updates
- Application will notify when updates are available
- Or check manually: Help → Check for Updates

### Installing Updates
1. Close the application
2. Run new installer (will replace old version)
3. Restart application
4. Database will auto-migrate if needed

---

## 🚨 Troubleshooting

### Database Connection Failed
**Problem:** "Cannot connect to database"

**Solutions:**
- Check MySQL service is running
- Verify credentials in Settings
- Check firewall isn't blocking port 3306
- Test connection: `mysql -u root -p`

### Weighbridge Not Detected
**Problem:** "Weighbridge not responding"

**Solutions:**
- Check cable connection
- Verify COM port number
- Install serial port drivers
- Check weighbridge power
- Test with serial port monitor tool

### Printer Not Working
**Problem:** "Print failed" error

**Solutions:**
- Check printer is on and connected
- Verify printer drivers installed
- Check paper loaded
- Test print from Windows/System settings
- Select correct printer in app settings

### Application Won't Start
**Problem:** App crashes on launch

**Solutions:**
- Check system meets minimum requirements
- Run as Administrator (Windows)
- Check antivirus isn't blocking
- View logs:
  - Windows: `%APPDATA%\Paddy Collection Center\logs`
  - macOS: `~/Library/Logs/Paddy Collection Center/`
  - Linux: `~/.config/Paddy Collection Center/logs`

---

## 📞 Support

For technical support:
- Email: support@paddycenter.com
- Phone: [Your support number]
- Remote assistance available via TeamViewer/AnyDesk

**Include in support requests:**
- Application version (Help → About)
- Operating system
- Error message or screenshot
- Steps to reproduce issue
- Log files

---

## 🔐 Security Best Practices

1. **Change default passwords immediately**
2. **Regular database backups** (daily recommended)
   ```bash
   mysqldump -u root -p paddy_collection_db > backup.sql
   ```
3. **Limit user access** - Create operator accounts with restricted permissions
4. **Keep software updated** - Install updates when available
5. **Secure physical access** - Lock terminals when not in use

---

## 📋 Daily Operations Checklist

### Start of Day
- [ ] Check weighbridge connection
- [ ] Check printer paper
- [ ] Check printer ink/ribbon
- [ ] Verify current season is active
- [ ] Review pending transactions

### End of Day
- [ ] Backup database
- [ ] Print daily summary report
- [ ] Reconcile transactions
- [ ] Check inventory levels

---

## 📚 Training Resources

### Video Tutorials
- Getting Started (5 min)
- Processing Purchase Transaction (10 min)
- Managing Sales (8 min)
- Reports and Analytics (7 min)
- Troubleshooting Common Issues (6 min)

### Documentation
- User Manual (PDF)
- Quick Reference Guide (PDF)
- FAQ Document

---

## 📝 License Information

This software is licensed to: [Customer Name]
License Type: [Single/Multi-User]
License Key: [Provided separately]
Support Period: [Start Date] to [End Date]

---

**Installation Guide Version:** 1.0
**Last Updated:** January 2026
**For Application Version:** 1.0.0

For the latest version of this guide, visit: [Your website]
