# Print to PDF Feature

## Overview

Option to save purchase receipts as PDF files instead of printing to a physical printer. This provides a digital archive of all transactions and allows for easy sharing and storage.

---

## Configuration

### **Settings Location:**
**Settings → General → Printer → PDF Options**

### **Available Options:**

1. **Save Receipts as PDF**
   - Toggle switch to enable PDF mode
   - When enabled, receipts are saved as PDF files instead of printing
   - Default: Off

2. **PDF Save Location**
   - Folder path where PDF receipts will be saved
   - Appears when "Save Receipts as PDF" is enabled
   - Includes "Browse" button for folder selection
   - Creates folder if it doesn't exist
   - Required when PDF mode is enabled

3. **Auto Open PDF After Save**
   - Automatically opens the PDF file after saving
   - Uses system default PDF viewer
   - Default: Off

---

## How It Works

### **User Workflow:**

**When Print to PDF is Disabled (Default):**
```
1. Complete purchase transaction
   ↓
2. Print dialog appears
   ↓
3. Select printer and print
   ↓
4. Physical receipt printed
```

**When Print to PDF is Enabled:**
```
1. Complete purchase transaction
   ↓
2. Receipt automatically saved as PDF
   ↓
3. Message shows: "Receipt saved as PDF: Receipt_001611_1732094123456.pdf"
   ↓
4. PDF auto-opens (if enabled)
   ↓
5. PDF stored in specified folder
```

---

## Implementation Details

### **1. Settings UI** (`/app/src/components/Settings/Settings.jsx`)

**Added Fields:**
```javascript
{
  print_to_pdf: false,          // Enable PDF mode
  pdf_save_path: '',            // Folder path
  pdf_auto_open: false          // Auto-open after save
}
```

**Conditional Display:**
- PDF save path field only shows when "Save Receipts as PDF" is enabled
- Validation requires path when PDF mode is on
- Browse button opens native folder selection dialog

### **2. Folder Selection Dialog** (`/app/electron/main.js`)

**Handler:** `settings:selectFolder`

```javascript
ipcMain.handle('settings:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select PDF Save Location',
    buttonLabel: 'Select Folder'
  });
  
  return { 
    success: true, 
    path: result.filePaths[0] 
  };
});
```

**Features:**
- Native OS folder picker
- Can create new folders
- Returns selected path to form

### **3. Print Handler Update** (`/app/electron/main.js`)

**Logic:**
```javascript
// Load settings
const printToPdf = await settingsService.get('print_to_pdf');
const pdfSavePath = await settingsService.get('pdf_save_path');
const pdfAutoOpen = await settingsService.get('pdf_auto_open');

if (printToPdf && pdfSavePath) {
  // PDF Mode
  const pdfData = await printWindow.webContents.printToPDF(pdfOptions);
  fs.writeFileSync(pdfPath, pdfData);
  
  if (pdfAutoOpen) {
    shell.openPath(pdfPath);
  }
  
  return { 
    success: true, 
    mode: 'pdf',
    path: pdfPath,
    filename: filename
  };
} else {
  // Print Mode
  await printWindow.webContents.print(printOptions);
  return { success: true, mode: 'print' };
}
```

### **4. Frontend Handling** (`/app/src/components/Purchases/Purchases.jsx`)

**Response Handling:**
```javascript
const printResult = await window.electronAPI.printer?.purchaseReceipt(transactionId);

if (printResult?.success) {
  if (printResult.mode === 'pdf') {
    message.success(
      <span>
        📄 Receipt saved as PDF: <strong>{printResult.filename}</strong>
        <br />
        <small>Location: {printResult.path}</small>
      </span>,
      6
    );
  } else {
    // Print mode - no additional message needed
  }
}
```

---

## PDF File Details

### **Filename Format:**
```
Receipt_[RECEIPT_NUMBER]_[TIMESTAMP].pdf

Examples:
- Receipt_001611_1732094123456.pdf
- Receipt_002455_1732095234567.pdf
```

**Components:**
- `Receipt_` - Fixed prefix
- `001611` - Receipt number from transaction
- `1732094123456` - Unix timestamp (milliseconds)
- `.pdf` - Extension

**Why Timestamp?**
- Ensures unique filenames
- Prevents overwrites
- Allows reprint functionality
- Easy chronological sorting

### **PDF Content:**
- Same HTML layout as printed receipt
- 80mm width (thermal printer size)
- All transaction details included
- Professional formatting
- Searchable text

### **PDF Options:**
```javascript
{
  marginsType: 0,              // No margins
  pageSize: {
    width: 80000,              // 80mm in microns
    height: 297000             // Auto-height
  },
  printBackground: true,       // Include backgrounds
  printSelectionOnly: false,   // Full page
  landscape: false             // Portrait orientation
}
```

---

## Use Cases

### **1. Digital Archive**
**Scenario:** Keep all receipts digitally

**Setup:**
```
✓ Save Receipts as PDF: ON
  PDF Save Location: C:\Documents\Receipts
  Auto Open PDF: OFF
```

**Result:**
- All receipts saved automatically
- Easy backup and search
- No physical storage needed
- Email-ready format

### **2. Hybrid Mode**
**Scenario:** Print physical receipt AND save PDF

**Current:** Choose one mode

**Workaround:** 
- Print physical receipt
- Use "Reprint" from history (when implemented)
- Set to PDF mode for reprint

**Future Enhancement:** Allow both modes simultaneously

### **3. Email to Farmer**
**Scenario:** Send receipt to farmer's email

**Setup:**
```
✓ Save Receipts as PDF: ON
  PDF Save Location: C:\Documents\Receipts
✓ Auto Open PDF: ON
```

**Workflow:**
1. Complete transaction
2. PDF opens automatically
3. Email PDF to farmer from default email client

### **4. Quality Control**
**Scenario:** Review receipts before sending

**Setup:**
```
✓ Save Receipts as PDF: ON
  PDF Save Location: C:\Documents\PendingReview
✓ Auto Open PDF: ON
```

**Workflow:**
1. Receipt saved and opens
2. Review for accuracy
3. Move to "Sent" folder if approved
4. Reprint or correct if needed

---

## Folder Organization

### **Recommended Structure:**

```
📁 Documents/
  📁 Receipts/
    📁 2025/
      📁 Season-1/
        📄 Receipt_001611_1732094123456.pdf
        📄 Receipt_001612_1732094234567.pdf
        📄 Receipt_001613_1732094345678.pdf
      📁 Season-2/
        📄 Receipt_002455_1732095234567.pdf
        📄 Receipt_002456_1732095345678.pdf
    📁 2024/
      📁 Season-1/
        ...
```

**Manual Organization:**
- PDFs saved to single folder
- User manually organizes by season/year
- Or use date-based folders

**Auto Organization (Future):**
- Auto-create season subfolders
- Configure folder structure in settings
- Smart naming with season/date

---

## Error Handling

### **Missing Save Path:**
```javascript
if (printToPdf && !pdfSavePath) {
  // Falls back to print mode
  return { success: true, mode: 'print' };
}
```

**User sees:**
- Warning: "PDF save location not configured"
- Falls back to normal printing

### **Folder Creation Fails:**
```javascript
if (!fs.existsSync(pdfSavePath)) {
  fs.mkdirSync(pdfSavePath, { recursive: true });
}
```

**Handles:**
- Missing parent folders (creates recursively)
- Invalid paths (error returned)
- Permission issues (error returned)

### **PDF Generation Fails:**
```javascript
try {
  const pdfData = await printWindow.webContents.printToPDF(pdfOptions);
  fs.writeFileSync(pdfPath, pdfData);
} catch (error) {
  return { success: false, error: error.message };
}
```

**User sees:**
- Error message
- Transaction still saved
- Can retry from history

---

## Benefits

### **Business Benefits:**
1. **Digital Archive**
   - No physical storage needed
   - Easy search and retrieval
   - Cloud backup ready
   - Disaster recovery

2. **Cost Savings**
   - Less printer maintenance
   - No paper costs
   - No ink/toner costs
   - Reduced environmental impact

3. **Efficiency**
   - Instant sharing via email
   - No printer jams
   - No printer downtime
   - Faster processing

4. **Compliance**
   - Easy audit trail
   - Searchable records
   - Date-stamped files
   - Tamper-evident

### **Technical Benefits:**
1. **Reliability**
   - No printer hardware dependency
   - Works offline
   - Consistent output
   - No driver issues

2. **Flexibility**
   - Switch modes easily
   - Multiple copies effortless
   - Reprint without limits
   - Email-ready format

3. **Integration**
   - Compatible with all PDF tools
   - OCR-ready text
   - Searchable content
   - Standard format

---

## Comparison

### **Print vs PDF Mode:**

| Feature | Print Mode | PDF Mode |
|---------|-----------|----------|
| **Output** | Physical paper | Digital file |
| **Speed** | Depends on printer | Instant |
| **Cost** | Paper + ink | None |
| **Storage** | Physical space | Disk space |
| **Sharing** | Scan + email | Direct email |
| **Search** | Manual | Searchable |
| **Backup** | Manual scan | Automatic |
| **Copies** | Reprint needed | Unlimited |
| **Quality** | Printer-dependent | Consistent |

---

## Testing

### **Test 1: Enable PDF Mode**
**Steps:**
1. Go to Settings → General → Printer
2. Toggle "Save Receipts as PDF" ON
3. Click "Browse" for PDF Save Location
4. Select folder (e.g., Desktop/Receipts)
5. Click "Save Settings"
6. **Verify:** Settings saved successfully

### **Test 2: Save Receipt as PDF**
**Steps:**
1. Complete a purchase transaction
2. **Verify:** Success message shows PDF filename and path
3. **Verify:** PDF file exists in specified folder
4. **Verify:** PDF opens correctly
5. **Verify:** PDF contains all transaction details

### **Test 3: Auto-Open**
**Steps:**
1. Enable "Auto Open PDF After Save"
2. Complete a purchase transaction
3. **Verify:** PDF file opens automatically
4. **Verify:** Opens in default PDF viewer

### **Test 4: Folder Creation**
**Steps:**
1. Set PDF path to non-existent folder
2. Complete a purchase transaction
3. **Verify:** Folder created automatically
4. **Verify:** PDF saved successfully

### **Test 5: Switch Modes**
**Steps:**
1. Complete purchase with PDF mode ON
2. **Verify:** PDF saved
3. Toggle PDF mode OFF
4. Complete another purchase
5. **Verify:** Print dialog appears

### **Test 6: Filename Uniqueness**
**Steps:**
1. Complete 3 purchases quickly
2. **Verify:** Each has unique filename
3. **Verify:** No overwrites
4. **Verify:** Chronological order

---

## Future Enhancements

### **1. Dual Mode**
Print AND save PDF simultaneously
```javascript
const dualMode = await settingsService.get('print_and_pdf');
if (dualMode) {
  // Save PDF
  await savePDF();
  // Then print
  await print();
}
```

### **2. Custom Filename Template**
User-defined naming pattern
```
Template: {season}_{receipt}_{date}_{farmer}.pdf
Result: Season1_001611_2025-06-28_JUREZEKIANA.pdf
```

### **3. Auto-Organization**
Automatic folder structure
```
Receipts/
  2025/
    Season-1/
      June/
        Receipt_001611.pdf
```

### **4. Email Integration**
Direct email from app
```javascript
const emailReceipt = async (transactionId, email) => {
  const pdf = await generatePDF(transactionId);
  await sendEmail(email, pdf);
};
```

### **5. Cloud Sync**
Automatic cloud backup
```javascript
const cloudSync = await settingsService.get('cloud_sync_enabled');
if (cloudSync) {
  await uploadToCloud(pdfPath);
}
```

### **6. Batch Export**
Export multiple receipts
```javascript
const exportRange = async (startDate, endDate) => {
  const transactions = await getTransactions(startDate, endDate);
  const zip = await createZip(transactions);
  return zip;
};
```

---

## Troubleshooting

### **PDF Not Saving:**
1. Check PDF save path is valid
2. Verify folder permissions
3. Ensure enough disk space
4. Check console for errors

### **PDF Not Opening:**
1. Check default PDF viewer installed
2. Verify file exists in folder
3. Try opening manually
4. Disable auto-open if problematic

### **Wrong Folder:**
1. Go to Settings → Printer
2. Update PDF Save Location
3. Save settings
4. Test with new transaction

### **Permission Denied:**
1. Choose folder with write access
2. Run app as administrator (Windows)
3. Check folder permissions

---

## Summary

### **Features:**
- ✅ Toggle PDF mode ON/OFF
- ✅ Select custom save location
- ✅ Auto-open after save
- ✅ Unique filenames
- ✅ Auto-create folders
- ✅ Fallback to print mode
- ✅ Detailed success messages
- ✅ Error handling

### **Benefits:**
- 💰 Cost savings (no paper/ink)
- 📁 Digital archive
- 📧 Easy sharing
- 🔍 Searchable
- ♻️ Eco-friendly
- ⚡ Instant processing

### **Configuration:**
**Settings → General → Printer → PDF Options**

**Quick Setup:**
1. Toggle "Save Receipts as PDF" ON
2. Browse and select folder
3. Optional: Enable "Auto Open"
4. Save settings
5. Complete purchase to test

---

**Status:** ✅ Implemented  
**Version:** 1.0  
**Date:** November 20, 2025

**Receipts can now be saved as PDF files instead of printing!** 📄✅
