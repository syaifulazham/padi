# 📋 Quick Reference Card
**Paddy Collection Center v1.0**

---

## 🚀 Daily Startup Checklist

- [ ] Turn on computer
- [ ] Start MySQL service (if not automatic)
- [ ] Launch Paddy Collection Center
- [ ] Login with your credentials
- [ ] Check weighbridge connection (green indicator)
- [ ] Test print receipt (optional)

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **F3** | New Transaction |
| **F5** | Refresh Dashboard |
| **Ctrl + P** | Print |
| **Ctrl + S** | Save |
| **Ctrl + F** | Search |
| **Esc** | Cancel/Close |
| **Ctrl + Q** | Quit Application |

---

## 📊 Common Tasks

### ➕ Add New Farmer
1. Dashboard → **Farmers**
2. Click **Add New**
3. Fill in details (Name, IC, Phone, Address)
4. Click **Save**

### 🏭 Add New Manufacturer
1. Dashboard → **Manufacturers**
2. Click **Add New**
3. Fill in company details
4. Click **Save**

### ⚖️ Record New Transaction
1. Press **F3** or click **New Transaction**
2. Select/scan farmer IC
3. Place load on weighbridge
4. System reads weight automatically
5. Select grade quality
6. Verify details
7. Click **Complete**
8. Print receipt (automatic or manual)

### 📄 Print Receipt
1. Complete transaction
2. Click **Print** or Ctrl+P
3. Receipt prints automatically
4. Give to farmer

### 📈 View Reports
1. Dashboard → **Reports**
2. Select date range
3. Choose report type:
   - Daily Summary
   - Farmer History
   - Inventory Status
   - Payment Summary
4. Click **Generate**
5. Export to Excel (optional)

### 🔍 Search Transaction
1. Dashboard → **History**
2. Enter search criteria:
   - Receipt number
   - Farmer name/IC
   - Date range
3. Click **Search**

---

## 🎯 End of Day Procedure

### Closing Checklist
1. **Review Today's Summary**
   - Dashboard → Statistics
   - Check total weight received
   - Check total transactions
   - Check payment total

2. **Print Daily Report**
   - Reports → Daily Summary
   - Print or save PDF

3. **Backup Database**
   - Settings → Database
   - Click **Backup Now**
   - Save to external drive (weekly)

4. **Logout**
   - Menu → Logout
   - Close application

5. **Security**
   - Lock computer
   - Secure USB devices
   - Lock office

---

## 🔧 Weighbridge Operations

### Before Using
- ✅ Weighbridge powered on
- ✅ Platform clear and clean
- ✅ Cable connected to computer
- ✅ Green indicator in app

### During Weighing
1. Ensure platform is **empty** first (zero reading)
2. Place load **centered** on platform
3. Wait for **stable** reading (no fluctuation)
4. System captures weight automatically
5. Remove load after confirmation

### If Not Working
1. Check cable connection
2. Check COM port in Settings
3. Restart weighbridge
4. Restart application
5. Call support if issue persists

---

## 🖨️ Printer Operations

### Receipt Printing
- **Dot Matrix**: Use for duplicate copies
- **Thermal**: Fast printing, no carbon needed
- **Laser**: High quality, official documents

### Common Issues

| Problem | Solution |
|---------|----------|
| No print | Check power and paper |
| Faint print | Replace ribbon/toner |
| Paper jam | Clear paper path |
| Wrong printer | Check Settings → Printer |

---

## 🌾 Season Management

### Start New Season
1. Settings → **Seasons**
2. Click **Create New Season**
3. Enter details:
   - Season name
   - Start date
   - End date
   - Price per KG
   - Deduction rates
4. Click **Save**

### Activate Season
1. Settings → Seasons
2. Find season
3. Click **Activate**
4. Enter passcode (if required)

### Close Season
1. Settings → Seasons
2. Find active season
3. Generate final reports
4. Click **Close Season**
5. Archive reports

---

## ⚠️ Troubleshooting

### Database Connection Error
**Symptom:** Can't access data  
**Fix:**
1. Check MySQL service running
2. Verify credentials
3. Restart application
4. Call support

### Weighbridge Not Responding
**Symptom:** No weight reading  
**Fix:**
1. Check power cable
2. Check USB connection
3. Check COM port settings
4. Restart weighbridge
5. Restart application

### Slow Performance
**Symptom:** App lagging  
**Fix:**
1. Close other programs
2. Restart application
3. Restart computer
4. Check disk space
5. Call support if persistent

### Can't Print
**Symptom:** Nothing prints  
**Fix:**
1. Check printer power
2. Check paper loaded
3. Select correct printer
4. Print test page
5. Restart printer

---

## 💾 Backup & Recovery

### Daily Auto-Backup
- Runs automatically at midnight
- Location: `C:\ProgramData\Paddy Collection Center\backups`
- Keep last 7 days

### Manual Backup
1. Settings → Database
2. Click **Backup Now**
3. Choose location (USB recommended)
4. Wait for completion
5. Verify file created

### Restore from Backup
⚠️ **Contact support before restoring!**

1. Settings → Database
2. Click **Restore**
3. Select backup file
4. Confirm action
5. Wait for completion
6. Restart application

---

## 👤 User Management

### Change Password
1. Menu → **Profile**
2. Click **Change Password**
3. Enter old password
4. Enter new password (twice)
5. Click **Save**

### Add New User
*(Admin only)*
1. Settings → **Users**
2. Click **Add User**
3. Fill details:
   - Username
   - Password
   - Role (Admin/Operator/Viewer)
4. Click **Save**

### User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access, can manage users |
| **Operator** | Create transactions, view reports |
| **Viewer** | View only, no editing |

---

## 📞 Support Contacts

### Emergency (24/7)
📧 urgent@yourcompany.com  
☎️ +XX XXXX XXXX

### General Support (Business Hours)
📧 support@yourcompany.com  
☎️ +XX XXXX XXXX  
🕐 Mon-Fri, 9AM-5PM

### Remote Support
💻 TeamViewer ID: [ON REQUEST]  
💻 AnyDesk ID: [ON REQUEST]

---

## 🔐 Security Best Practices

### Password Security
- ✅ Minimum 8 characters
- ✅ Mix letters, numbers, symbols
- ✅ Change every 90 days
- ❌ Never share passwords
- ❌ Don't write down passwords

### Computer Security
- 🔒 Lock screen when away (Win + L)
- 🔒 Logout at end of day
- 🔒 Keep antivirus updated
- 🔒 Don't install unauthorized software

### Data Security
- 💾 Backup daily
- 💾 Keep backups offsite
- 💾 Test restore monthly
- 🔐 Encrypt sensitive data

---

## 📊 Understanding the Dashboard

### Statistics Bar (Top)
- **Today's Total**: Weight received today
- **Today's Transactions**: Number of entries
- **Active Farmers**: Farmers who delivered today
- **Pending Payments**: Amount owed

### Quick Actions (Middle)
- **New Transaction**: Start weighing (F3)
- **Search**: Find records
- **Reports**: Generate reports
- **Settings**: Configure system

### Recent Activity (Bottom)
- Last 10 transactions
- Click any row to view details

---

## 📈 Report Types

### Daily Summary
- Total weight received
- Number of transactions
- Top farmers
- Grade distribution
- Payment summary

### Farmer History
- Individual farmer records
- Total deliveries
- Total weight
- Payment history

### Inventory Status
- Current stock by grade
- Stock movements
- Available for sale

### Payment Report
- Pending payments
- Completed payments
- Payment by period

---

## 🔄 Update Management

### When Update Available
1. Notification appears in app
2. Click **Download Update**
3. App downloads in background
4. Click **Restart to Update** when ready
5. App restarts with new version

### Manual Update Check
1. Help → **Check for Updates**
2. Wait for check to complete
3. Follow update prompts

---

## ⏱️ Recommended Maintenance

### Daily
- [ ] Backup verification
- [ ] Clear completed transactions (if needed)
- [ ] Check disk space

### Weekly
- [ ] Copy backups to external drive
- [ ] Review error logs
- [ ] Clean weighbridge platform

### Monthly
- [ ] Test restore from backup
- [ ] Review user accounts
- [ ] Archive old records
- [ ] Check for updates

### Yearly
- [ ] Deep clean hardware
- [ ] Review security settings
- [ ] Update passwords
- [ ] System performance review

---

## 📍 File Locations

### Important Folders

| Item | Windows Location |
|------|------------------|
| Backups | `C:\ProgramData\Paddy Collection Center\backups` |
| Logs | `C:\Users\[YourName]\AppData\Roaming\Paddy Collection Center\logs` |
| Config | `C:\ProgramData\Paddy Collection Center\config` |
| Reports | `C:\Users\[YourName]\Documents\Paddy Reports` |

---

## 💡 Pro Tips

### Speed Up Data Entry
- Use IC scanner for farmer lookup
- Set up frequently used grades as favorites
- Use keyboard shortcuts (F3 for new transaction)
- Enable auto-print for receipts

### Improve Accuracy
- Double-check weight readings before confirming
- Review transaction before printing
- Use barcode scanner for IC numbers
- Enable confirmation dialogs

### Better Reporting
- Generate reports at consistent times
- Export to Excel for advanced analysis
- Archive monthly reports
- Share reports with management

---

## 🎯 Training Resources

### Available Materials
- [ ] Video tutorials (5 modules)
- [ ] User manual (PDF)
- [ ] Quick start guide
- [ ] FAQ document
- [ ] Training database

### Online Resources
🌐 Documentation: www.yourcompany.com/docs  
🎥 Video Library: www.yourcompany.com/videos  
❓ FAQ: www.yourcompany.com/faq  
📧 Newsletter: Monthly tips & updates

---

## ✅ Quality Checks

### Before Starting Day
- Weighbridge calibrated
- Printer working
- Adequate paper supply
- Clean work area

### During Operations
- Verify each weight reading
- Check farmer details correct
- Confirm grade assignment
- Receipt printed clearly

### End of Day
- All transactions complete
- Daily report generated
- Backup successful
- System ready for tomorrow

---

**Version:** 1.0 | **Last Updated:** Dec 2024  
**Print this page for quick reference at your workstation**

---

*For detailed instructions, refer to the complete User Manual*
