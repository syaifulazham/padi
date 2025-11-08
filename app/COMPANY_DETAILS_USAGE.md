# 🏢 Company Details in Settings

**Date:** 2025-11-07  
**Status:** Implemented

---

## 📋 Overview

Company details have been added to Settings → General tab. These details are critical for:
1. **Receipt Printing** - Appears on all purchase receipts
2. **Cross-Border Permits** - Required for interstate paddy movement applications
3. **Official Documentation** - Used in reports and official records

---

## 🔑 Required Fields

All four fields are **mandatory** and validated:

### 1. Company Name
- **Purpose**: Primary business name
- **Format**: Full registered business name
- **Example**: `Kilang Beras Sdn Bhd`
- **Usage**: 
  - Receipt header
  - Permit applications
  - Official correspondence

### 2. Company Address
- **Purpose**: Official business location
- **Format**: Multi-line address (3 rows)
- **Example**:
  ```
  No. 123, Jalan Paddy,
  Taman Industri,
  12345 Sungai Besar, Selangor
  ```
- **Usage**:
  - Receipt footer
  - Permit applications
  - Shipping documents

### 3. Company Registration No.
- **Purpose**: SSM registration identifier
- **Format**: ROC number with suffix (if applicable)
- **Example**: `ROC123456-A`
- **Usage**:
  - Legal documentation
  - Permit applications
  - Government submissions

### 4. Paddy Purchasing Licence No.
- **Purpose**: Government-issued paddy trading licence
- **Format**: Licence number as issued by Department of Agriculture
- **Example**: `LKP-01-2024-001`
- **Usage**:
  - Receipt footer (legal requirement)
  - Cross-border permits
  - Regulatory compliance
  - Interstate movement applications

---

## 📄 Document Usage

### Purchase Receipt Example
```
┌─────────────────────────────────────┐
│    KILANG BERAS SDN BHD             │
│    No. 123, Jalan Paddy             │
│    Taman Industri                   │
│    12345 Sungai Besar, Selangor    │
│                                     │
│    SSM: ROC123456-A                 │
│    Licence: LKP-01-2024-001         │
├─────────────────────────────────────┤
│    PURCHASE RECEIPT                 │
│    Receipt No: PR-2024-001          │
│    Date: 07/11/2024                 │
├─────────────────────────────────────┤
│    Farmer: Ahmad bin Abdullah       │
│    Subsidy No: SUB-2024-001         │
│    IC: 850101015678                 │
│                                     │
│    Grade: Super                     │
│    Weight: 1,250.00 kg              │
│    Price: RM 2.50/kg                │
│    Total: RM 3,125.00               │
├─────────────────────────────────────┤
│    Thank you for your business      │
└─────────────────────────────────────┘
```

### Cross-Border Permit Application
```
INTERSTATE PADDY MOVEMENT PERMIT

Applicant Details:
Company Name: Kilang Beras Sdn Bhd
Registration: ROC123456-A
Licence: LKP-01-2024-001
Address: No. 123, Jalan Paddy,
         Taman Industri,
         12345 Sungai Besar, Selangor

Movement Details:
From: Selangor
To: Kedah
Quantity: 50 metric tons
Grade: Super
Purpose: Processing
...
```

---

## ⚙️ Settings Configuration

### Location
**Settings** → **Company** tab (First tab, opens by default)

### Form Fields
1. **Company Name** (Required)
   - Single line input
   - Max 200 characters
   - Validation: Cannot be empty

2. **Company Address** (Required)
   - Multi-line textarea (3 rows)
   - Max 500 characters
   - Validation: Cannot be empty
   - Supports multi-line formatting

3. **Company Registration No.** (Required)
   - Single line input
   - Max 50 characters
   - Validation: Cannot be empty
   - Pattern: ROC/SSM format

4. **Paddy Purchasing Licence No.** (Required)
   - Single line input
   - Max 50 characters
   - Validation: Cannot be empty
   - Format: As per government issue

---

## 🔒 Data Storage

### Current Implementation
- Stored in component state (temporary)
- Lost on application restart
- **Needs backend implementation for persistence**

### Recommended Backend Storage

#### Option 1: Database Table
```sql
CREATE TABLE system_settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value TEXT,
  setting_type ENUM('string', 'number', 'boolean', 'json'),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT
);

-- Insert company details
INSERT INTO system_settings VALUES
('company_name', 'Kilang Beras Sdn Bhd', 'string', NOW(), 1),
('company_address', 'No. 123, Jalan Paddy,...', 'string', NOW(), 1),
('company_registration_no', 'ROC123456-A', 'string', NOW(), 1),
('paddy_purchasing_licence_no', 'LKP-01-2024-001', 'string', NOW(), 1);
```

#### Option 2: electron-store (File-based)
```javascript
const Store = require('electron-store');
const store = new Store();

// Save
store.set('company.name', 'Kilang Beras Sdn Bhd');
store.set('company.address', '...');
store.set('company.registration_no', 'ROC123456-A');
store.set('company.licence_no', 'LKP-01-2024-001');

// Load
const companyName = store.get('company.name');
```

#### Option 3: Config File (.env or JSON)
```
# .env
COMPANY_NAME="Kilang Beras Sdn Bhd"
COMPANY_ADDRESS="No. 123, Jalan Paddy, Taman Industri, 12345 Sungai Besar, Selangor"
COMPANY_REGISTRATION_NO="ROC123456-A"
PADDY_PURCHASING_LICENCE_NO="LKP-01-2024-001"
```

---

## 🔌 Backend API Implementation

### Required Endpoints

```javascript
// electron/main.js

// Get company details (and all settings)
ipcMain.handle('settings:getAll', async () => {
  try {
    const settings = await loadSettingsFromStorage();
    return { success: true, data: settings };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Save settings (including company details)
ipcMain.handle('settings:save', async (event, data) => {
  try {
    await saveSettingsToStorage(data);
    return { success: true, message: 'Settings saved' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get company details specifically
ipcMain.handle('settings:getCompanyDetails', async () => {
  try {
    const company = {
      name: await getSetting('company_name'),
      address: await getSetting('company_address'),
      registration_no: await getSetting('company_registration_no'),
      licence_no: await getSetting('paddy_purchasing_licence_no')
    };
    return { success: true, data: company };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

### Preload Script
```javascript
// electron/preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing APIs
  
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    save: (data) => ipcRenderer.invoke('settings:save', data),
    getCompanyDetails: () => ipcRenderer.invoke('settings:getCompanyDetails')
  }
});
```

---

## 📊 Integration Points

### 1. Receipt Generation
```javascript
// When printing receipt
const settings = await window.electronAPI.settings.getAll();
const receipt = generateReceipt({
  company: {
    name: settings.company_name,
    address: settings.company_address,
    registration: settings.company_registration_no,
    licence: settings.paddy_purchasing_licence_no
  },
  transaction: transactionData
});
```

### 2. Permit Application
```javascript
// When generating permit
const company = await window.electronAPI.settings.getCompanyDetails();
const permit = {
  applicant: {
    name: company.name,
    address: company.address,
    registration: company.registration_no,
    licence: company.licence_no
  },
  movement: movementDetails
};
```

### 3. Reports
```javascript
// When generating reports
const settings = await window.electronAPI.settings.getAll();
const reportHeader = {
  companyName: settings.company_name,
  companyAddress: settings.company_address,
  date: new Date()
};
```

---

## ✅ Validation Rules

### Required Fields
All four company detail fields are **required** before:
- Printing receipts
- Generating permits
- Creating official reports

### Field Validations
```javascript
// Company Name
- Required: true
- Min length: 3
- Max length: 200
- Pattern: Allow letters, numbers, spaces, and common business suffixes

// Company Address
- Required: true
- Min length: 10
- Max length: 500
- Format: Multi-line text

// Company Registration No.
- Required: true
- Min length: 5
- Max length: 50
- Pattern: ROC/SSM format (flexible)

// Paddy Purchasing Licence No.
- Required: true
- Min length: 5
- Max length: 50
- Format: Government-issued format
```

---

## 🚨 Important Notes

### Legal Requirements
1. **Paddy Purchasing Licence** must be valid and current
2. **Company Registration** must match SSM records
3. **Receipt printing** with licence number is **legally required** in Malaysia
4. **Cross-border permits** require valid licence for interstate movement

### Compliance
- Keep licence information up to date
- Renew licence before expiry
- Update system immediately after licence renewal
- Maintain copies of registration and licence documents

### Best Practices
1. **Initial Setup**: Configure company details before first transaction
2. **Regular Review**: Check details quarterly for accuracy
3. **Licence Renewal**: Update licence number immediately after renewal
4. **Backup**: Keep backup of these critical settings
5. **Access Control**: Restrict editing to authorized personnel only

---

## 📋 Setup Checklist

- [ ] Navigate to Settings (Company tab opens by default)
- [ ] Enter Company Name
- [ ] Enter complete Company Address (3+ lines)
- [ ] Enter Company Registration No. (from SSM certificate)
- [ ] Enter Paddy Purchasing Licence No. (from DOA)
- [ ] Click "Save Settings"
- [ ] Verify details appear on test receipt
- [ ] Test permit generation (when feature available)
- [ ] Create backup of settings

---

## 🎯 Next Steps

### Backend Implementation Priority
1. **Immediate**: Implement settings persistence (electron-store recommended)
2. **High**: Add validation for licence expiry dates
3. **Medium**: Add licence document upload/storage
4. **Low**: Add multi-company support (if needed)

### Feature Integration
1. **Receipt Printing**: Use company details in receipt template
2. **Permit Generation**: Include in permit applications
3. **Report Headers**: Add to all official reports
4. **Email/SMS**: Include in automated communications

---

## 📖 Example Configuration

### Sample Company Details

**Scenario 1: Small Rice Mill**
```
Company Name: Kilang Beras Pak Ali
Company Address: Lot 45, Jalan Sawah,
                 Kampung Baru,
                 45000 Kuala Selangor, Selangor
Registration No: ROC987654-K
Licence No: LKP-SEL-2024-045
```

**Scenario 2: Large Processing Center**
```
Company Name: Perniagaan Beras Nasional Sdn Bhd
Company Address: Kompleks Industri Beras,
                 Jalan Perusahaan 3/1,
                 Kawasan Perindustrian HICOM,
                 40000 Shah Alam, Selangor
Registration No: ROC123456-A (1234567-T)
Licence No: LKP-01-SEL-2024-001
```

---

## ✅ Summary

| Feature | Status |
|---------|--------|
| UI Implementation | ✅ Complete |
| Form Validation | ✅ Complete |
| Required Fields | ✅ Enforced |
| Help Text | ✅ Added |
| Placeholders | ✅ Provided |
| Backend Storage | ⏳ Pending |
| Receipt Integration | ⏳ Pending |
| Permit Integration | ⏳ Pending |

**Company details are now configurable in Settings!**

These details will automatically appear on receipts and permits once those features are implemented. 🏢
