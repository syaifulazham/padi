# Purchase Receipt Printing Feature

## Overview

Automatic receipt printing for purchase transactions matching the physical receipt layout used by paddy collection centers.

## Receipt Layout

The receipt matches the standard format from BERKAT PADI SDN BHD with the following sections:

### **Header Section**
- Company name and address
- Phone and license number
- Location (Kawasan)
- Receipt number (top right)

### **Transaction Details**
**Left side:**
- Farmer name (NAMA)
- IC number (NO K/P)
- Address (ALAMAT)
- Lorry number (NO. LORI)

**Right side:**
- Entry date (TARIKH MASUK)
- Subsidy code (SUBSIDI)
- Giro number (GIRO)
- BPM code

### **Weight Section**
**Left column:**
- Gross weight (BERAT MASUK) - weight with load
- Tare weight (BERAT KELUAR) - empty weight
- Raw weight (BERAT KASAR) - gross - tare
- Deductions (POTONGAN) - percentage and breakdown
- Net weight (BERAT BERSIH) - after deductions

**Right column:**
- Time in (MASA MASUK)
- Time out (MASA KELUAR)
- Price per ton (HARGA/TAN)
- Total amount (AMAUN)

### **Footer Section**
- Signature lines for:
  - DITIMBANG OLEH (Weighed by)
  - PEMANDU LORI (Lorry driver)
  - DITERIMA OLEH (Received by)

---

## Implementation

### **1. Receipt Template**
**File:** `/app/electron/utils/receiptTemplate.js`

Generates HTML receipt with:
- 80mm thermal printer format
- Monospace font (Courier New)
- Proper spacing and alignment
- Print-friendly CSS

**Key Functions:**
```javascript
generatePurchaseReceipt(transaction, farmer, season, companyDetails)
```

### **2. Print Handler**
**File:** `/app/electron/main.js`

**IPC Handler:** `print:purchaseReceipt`

**Process:**
1. Fetch transaction by ID
2. Fetch farmer details
3. Fetch season configuration
4. Fetch company details
5. Generate receipt HTML
6. Create hidden BrowserWindow
7. Load HTML and trigger print
8. Close window after printing

**Code:**
```javascript
ipcMain.handle('print:purchaseReceipt', async (event, transactionId) => {
  // Fetch all required data
  // Generate HTML
  // Print via BrowserWindow
});
```

### **3. Preload API**
**File:** `/app/electron/preload.js`

```javascript
printer: {
  purchaseReceipt: (transactionId) => 
    ipcRenderer.invoke('print:purchaseReceipt', transactionId)
}
```

### **4. Frontend Integration**
**File:** `/app/src/components/Purchases/Purchases.jsx`

**Auto-print on purchase completion:**
```javascript
const result = await window.electronAPI.purchases?.create(purchaseData);

if (result?.success) {
  // Print receipt automatically
  const printResult = await window.electronAPI.printer?.purchaseReceipt(
    result.data.transaction_id
  );
}
```

---

## Data Flow

```
1. User completes purchase
   ↓
2. Transaction saved to database
   ↓
3. Frontend calls printer.purchaseReceipt(transactionId)
   ↓
4. Backend fetches:
   - Transaction details
   - Farmer information
   - Season configuration
   - Company details
   ↓
5. Generate HTML receipt from template
   ↓
6. Create hidden print window
   ↓
7. Load HTML and print
   ↓
8. User sees print dialog (or auto-prints if silent: true)
   ↓
9. Receipt printed on thermal/regular printer
```

---

## Receipt Data Mapping

### **Transaction Data:**
```javascript
{
  transaction_id: 123,
  receipt_number: '001611',
  transaction_date: '2025-06-28T12:13:03',
  gross_weight_kg: 5280.00,
  tare_weight_kg: 3700.00,
  net_weight_kg: 1264.00,
  base_price_per_kg: 1.57,
  total_amount: 1984.48,
  vehicle_number: 'BHU8369'
}
```

### **Farmer Data:**
```javascript
{
  full_name: 'JUREZEKIANA BT KASSIM',
  ic_number: '841010105868',
  address: 'NO 125 PARIT 5 SG HJ DORANI',
  city: 'SG BESAR',
  state: 'SELANGOR'
}
```

### **Season Data:**
```javascript
{
  deduction_config: [
    { deduction: 'Wap Basah', value: 0.05 },
    { deduction: 'Hampa', value: 0.05 },
    { deduction: 'Kotoran', value: 0.05 },
    { deduction: 'Lain-lain', value: 0.05 }
  ]
}
```

### **Company Data:**
```javascript
{
  name: 'BERKAT PADI SDN BHD',
  address1: 'LOT 14633 PKT 100 SAWAH, SUNGAI NIPAH',
  address2: '45300 SUNGAI BESAR, SELANGOR',
  phone: '019249396301323396636',
  license: 'E6380',
  location: 'PANCHANG BEDENA'
}
```

---

## Print Options

### **Current Settings:**
```javascript
{
  silent: false,          // Show print dialog
  printBackground: true,  // Include background colors
  color: false,          // Black and white
  margins: {
    marginType: 'none'   // No margins
  },
  pageSize: {
    width: 80000,        // 80mm in microns
    height: 297000       // Auto-size height
  }
}
```

### **To Enable Auto-Print:**
Change `silent: true` to skip print dialog and print directly to default printer.

---

## Styling Details

### **Font:**
- Family: `Courier New, monospace`
- Size: 10px (body), 14px (company name), 16px (receipt number)
- Monospace ensures alignment

### **Layout:**
- Page width: 80mm (thermal printer standard)
- Padding: 5mm
- Line height: 1.3
- No page breaks

### **Sections:**
- Header: bordered bottom
- Weights: bordered top and bottom
- Footer: bordered top, signature boxes

### **Print CSS:**
```css
@page {
  size: 80mm auto;
  margin: 5mm;
}

@media print {
  body {
    margin: 0;
    padding: 5mm;
  }
}
```

---

## Error Handling

### **Print Failures:**
```javascript
try {
  const printResult = await window.electronAPI.printer?.purchaseReceipt(transactionId);
  if (!printResult?.success) {
    message.warning('Receipt created but printing failed. You can reprint from history.');
  }
} catch (error) {
  message.warning('Receipt created but printing failed. You can reprint from history.');
}
```

**User sees:**
- ✅ Purchase still saved
- ⚠️ Warning about print failure
- ℹ️ Can reprint later from history

### **Missing Data:**
```javascript
if (!transactionResult.success) {
  return { success: false, error: 'Transaction not found' };
}
if (!farmerResult.success) {
  return { success: false, error: 'Farmer not found' };
}
```

---

## Testing

### **Test 1: Basic Print**
1. Complete a purchase transaction
2. Verify receipt prints automatically
3. Check all fields are populated
4. Verify calculations are correct

### **Test 2: Print Dialog**
1. With `silent: false`
2. Print dialog appears
3. Can select printer
4. Can adjust print settings

### **Test 3: Thermal Printer**
1. Connect 80mm thermal printer
2. Set as default printer
3. Print receipt
4. Verify formatting fits 80mm width

### **Test 4: Manual Reprint**
(To be implemented)
1. Go to Purchase History
2. Select transaction
3. Click "Reprint Receipt"
4. Receipt prints again

---

## Future Enhancements

### **1. Reprint from History**
Add "Reprint" button in Purchase History table:
```javascript
<Button 
  icon={<PrinterOutlined />} 
  onClick={() => printReceipt(record.transaction_id)}
>
  Reprint
</Button>
```

### **2. Print Preview**
Show receipt before printing:
```javascript
const previewReceipt = (transactionId) => {
  // Open modal with receipt HTML
  // User can review before printing
};
```

### **3. Email Receipt**
Generate PDF and email to farmer:
```javascript
const emailReceipt = async (transactionId, email) => {
  // Generate PDF from HTML
  // Send via email service
};
```

### **4. Batch Printing**
Print multiple receipts:
```javascript
const printBatch = async (transactionIds) => {
  for (const id of transactionIds) {
    await printReceipt(id);
  }
};
```

### **5. Custom Templates**
Allow multiple receipt layouts:
```javascript
const templates = {
  standard: generateStandardReceipt,
  detailed: generateDetailedReceipt,
  compact: generateCompactReceipt
};
```

### **6. Print Settings**
User preferences:
- Auto-print on/off
- Default printer selection
- Number of copies
- Include/exclude sections

---

## Configuration

### **Company Details**
Set in Settings → Company Details:
- Company name
- Address
- Phone
- License number
- Location

### **Printer Settings**
In `.env`:
```
DEFAULT_PRINTER="Epson LQ-310"
AUTO_PRINT=true
```

---

## Troubleshooting

### **Receipt Not Printing:**
1. Check printer is connected
2. Check printer is set as default
3. Check print spooler service running
4. Try manual print dialog (`silent: false`)

### **Layout Issues:**
1. Verify printer width (80mm)
2. Check paper size in printer settings
3. Adjust CSS margins if needed
4. Test with different printer drivers

### **Missing Data:**
1. Check database has complete transaction
2. Verify farmer details exist
3. Check season configuration saved
4. Review console logs for errors

### **Slow Printing:**
1. Hidden window takes time to load HTML
2. Large deduction lists slow rendering
3. Consider caching company details
4. Optimize HTML generation

---

## Technical Notes

### **BrowserWindow for Printing:**
Electron uses Chromium's printing engine:
- Renders HTML/CSS perfectly
- Supports modern CSS features
- Print preview available
- Multiple printer support

### **Thermal Printer Compatibility:**
- 80mm width standard
- ESC/POS compatible
- Plain text fallback available
- Barcode support possible

### **Character Encoding:**
- UTF-8 for international characters
- Malay language support
- Special symbols (°, ®, ™)

---

## Summary

### **Features:**
- ✅ Auto-print on purchase completion
- ✅ Matches physical receipt layout
- ✅ 80mm thermal printer support
- ✅ Complete transaction details
- ✅ Farmer information
- ✅ Weight calculations
- ✅ Deduction breakdown
- ✅ Signature sections

### **Benefits:**
- Professional receipt format
- Consistent with existing receipts
- No manual entry required
- Immediate printing
- Audit trail maintained
- Customer gets instant receipt

### **Next Steps:**
1. Configure company details
2. Set default printer
3. Test with actual printer
4. Add reprint functionality
5. Implement print settings

---

**Status:** ✅ Implemented  
**Version:** 1.0  
**Date:** November 20, 2025

**Purchase receipts now print automatically after transaction completion!** 🖨️✅
