# 📦 Paddy Collection Center - Installation Instructions

## Welcome!
Thank you for choosing Paddy Collection Center. This guide will help you install the application on your computer.

---

## ⏱️ Installation Time
Approximately 20-30 minutes

---

## 📋 What You Need

### Before Starting:
- [ ] Windows 10/11 computer (64-bit)
- [ ] Internet connection (for downloading MySQL)
- [ ] Administrator access to your computer
- [ ] Installation package from your provider

---

## 🚀 Step-by-Step Installation

### Step 1: Install MySQL Database (15 minutes)

1. **Download MySQL**
   - Visit: https://dev.mysql.com/downloads/installer/
   - Download "MySQL Installer for Windows"
   - Choose "mysql-installer-community" (larger file, ~400MB)

2. **Install MySQL**
   - Run the downloaded installer
   - Choose "Developer Default" setup type
   - Click "Next" through the screens
   - **IMPORTANT**: When asked to set a root password:
     - Choose a strong password
     - **Write it down** - you'll need this later!
   - Click "Execute" to install
   - Wait for installation to complete (5-10 minutes)
   - Click "Finish"

3. **Verify MySQL is Running**
   - Open Windows Services (Press `Win + R`, type `services.msc`)
   - Look for "MySQL80" service
   - Status should show "Running"

---

### Step 2: Setup Database (5 minutes)

1. **Copy Configuration File**
   - Open the `database-setup` folder from your installation package
   - Find the file `.env.example`
   - Right-click → Copy
   - Right-click → Paste
   - Rename the copied file to `.env` (remove .example)

2. **Edit Configuration**
   - Right-click the `.env` file → Open with Notepad
   - Update these lines:
     ```
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=root
     DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
     DB_NAME=paddy_collection_db
     ```
   - Replace `YOUR_MYSQL_PASSWORD_HERE` with the MySQL password you created
   - Save and close the file

3. **Run Database Setup**
   - Double-click `setup_database.bat` in the database-setup folder
   - Wait for "Database setup complete!" message
   - Press any key to close

---

### Step 3: Install Application (5 minutes)

#### For Windows:

1. **Run Installer**
   - Double-click `Paddy-Collection-Center-Setup.exe`
   - If Windows shows a security warning:
     - Click "More info"
     - Click "Run anyway"

2. **Follow Installation Wizard**
   - Click "Next"
   - Choose installation location (or keep default)
   - Click "Install"
   - Wait for installation (2-3 minutes)
   - Click "Finish"

3. **First Launch**
   - Application should start automatically
   - If not, find "Paddy Collection Center" in Start Menu

---

### Step 4: Configure Application (5 minutes)

When the application starts for the first time:

1. **Database Connection**
   - Host: `localhost`
   - Port: `3306`
   - Username: `root`
   - Password: Your MySQL password
   - Database: `paddy_collection_db`
   - Click "Test Connection" → Should show "Success"
   - Click "Save"

2. **Company Details**
   - Enter your company name
   - Enter your address
   - Enter contact information
   - Upload your logo (optional)
   - Click "Save"

3. **Hardware Setup** (if applicable)
   
   **Weighbridge:**
   - Connect your weighbridge to USB/Serial port
   - Select correct COM port from dropdown
   - Select baud rate (usually 9600)
   - Click "Test" to verify connection
   - Click "Save"
   
   **Printer:**
   - Turn on your receipt printer
   - Select printer from dropdown
   - Choose paper size
   - Click "Print Test" to verify
   - Click "Save"

4. **Create First User**
   - Username: Your choice
   - Password: Create a strong password
   - Role: Administrator
   - Click "Create Account"

---

## ✅ Verify Installation

After setup, test these features:

- [ ] Login with your created account
- [ ] Dashboard loads correctly
- [ ] Add a test farmer
- [ ] Create a test transaction (if weighbridge connected)
- [ ] Print a test receipt (if printer connected)

---

## 🆘 Troubleshooting

### Problem: Can't connect to database
**Solution:**
1. Check MySQL service is running (Windows Services)
2. Verify password in application settings
3. Try restarting MySQL service
4. Restart your computer

### Problem: Weighbridge not detected
**Solution:**
1. Check USB cable is connected properly
2. Install weighbridge drivers (provided by manufacturer)
3. Check COM port number in Device Manager
4. Try different USB port

### Problem: Printer not working
**Solution:**
1. Verify printer is turned on
2. Check printer has paper
3. Install latest printer drivers
4. Try printing test page from Windows

### Problem: Application won't start
**Solution:**
1. Restart your computer
2. Check antivirus isn't blocking the app
3. Run as Administrator (right-click icon)
4. Reinstall the application

---

## 📞 Getting Help

If you encounter issues:

1. **Check FAQ Document** (provided separately)
2. **Contact Support**
   - Email: support@yourcompany.com
   - Phone: +XX XXXX XXXX
   - Hours: Mon-Fri, 9AM-5PM
3. **Remote Support**: We can connect remotely to help

---

## 🔄 Daily Backup (Important!)

### Automatic Backup:
- The application backs up your database daily at midnight
- Backups are stored in: `C:\ProgramData\Paddy Collection Center\backups`
- Keep at least 7 days of backups

### Manual Backup:
1. Open application
2. Go to Settings → Database
3. Click "Backup Now"
4. Save file to safe location (USB drive or cloud storage)

**Recommendation:** Copy backups to external drive weekly!

---

## 📱 Quick Reference Card

### Common Tasks:

| Task | Steps |
|------|-------|
| Add Farmer | Dashboard → Farmers → Add New |
| New Transaction | Dashboard → New Transaction → F3 |
| Print Receipt | Transaction complete → Click Print |
| View History | Dashboard → History → Select dates |
| Change Settings | Menu → Settings |
| Backup Database | Settings → Database → Backup Now |
| Logout | Menu → Logout |

### Keyboard Shortcuts:

| Key | Action |
|-----|--------|
| F3 | New Transaction |
| F5 | Refresh Dashboard |
| Ctrl+P | Print |
| Ctrl+S | Save |
| Esc | Cancel/Close |

---

## 🎓 Training

### Recommended Training Schedule:

**Day 1 (2 hours):**
- System overview
- Adding farmers and manufacturers
- Basic navigation

**Day 2 (2 hours):**
- Creating transactions
- Using weighbridge
- Printing receipts

**Day 3 (2 hours):**
- Reports and history
- End of day procedures
- Troubleshooting basics

**Day 4 (1 hour):**
- Practice with real data
- Q&A session

---

## 📊 System Status Indicators

Watch for these indicators in the application:

| Icon | Meaning | Action |
|------|---------|--------|
| 🟢 Green | All systems working | None needed |
| 🟡 Yellow | Warning (low paper, etc.) | Check message |
| 🔴 Red | Error (database, weighbridge) | Contact support |

---

## 🔐 Security Best Practices

1. **Strong Passwords**
   - Minimum 8 characters
   - Mix letters, numbers, symbols
   - Change every 90 days

2. **User Accounts**
   - Create separate accounts for each user
   - Don't share passwords
   - Delete accounts for former employees

3. **Physical Security**
   - Lock computer when away
   - Keep USB devices secure
   - Restrict physical access to terminal

4. **Regular Backups**
   - Daily automatic backups
   - Weekly manual backups to external drive
   - Monthly offsite backups (cloud or different location)

---

## 📅 Maintenance Schedule

### Daily:
- Check backup completed successfully
- Verify database connection on startup

### Weekly:
- Copy backups to external drive
- Check disk space (need 10GB free)
- Restart application

### Monthly:
- Review and archive old records
- Check for application updates
- Test restore from backup

### Yearly:
- Review user accounts
- Clean up old data
- System performance review

---

## 📈 Getting the Most from Your System

### Tips for Efficiency:

1. **Use Keyboard Shortcuts**
   - Press F3 for new transactions
   - Much faster than mouse clicking

2. **Pre-register Farmers**
   - Add all farmers before harvest season
   - Saves time during busy periods

3. **Daily Reports**
   - Review daily summary every evening
   - Catch errors early

4. **Regular Training**
   - Monthly refresher sessions
   - Keep team updated on features

---

## 📄 Important Files Location

Keep these locations handy:

| Item | Location |
|------|----------|
| Application | `C:\Program Files\Paddy Collection Center` |
| Backups | `C:\ProgramData\Paddy Collection Center\backups` |
| Logs | `C:\Users\[Your Name]\AppData\Roaming\Paddy Collection Center\logs` |
| Configuration | `C:\ProgramData\Paddy Collection Center\config` |

---

## ✨ Welcome to Paddy Collection Center!

You're all set! The application is ready to use.

### Next Steps:
1. ✅ Complete the setup wizard
2. ✅ Add your farmers
3. ✅ Add your manufacturers
4. ✅ Configure your first season
5. ✅ Start recording transactions

**Need help?** We're here for you!
- Support Email: support@yourcompany.com
- Support Phone: +XX XXXX XXXX

---

**Installation Guide Version:** 1.0  
**Last Updated:** December 2024  
**Compatible with:** Paddy Collection Center v1.0.0+
