# ✅ Farmer Code → Subsidy No. Update

**Date:** 2025-11-07  
**Status:** Complete

---

## 📝 Change Summary

Changed all user-facing labels from **"Farmer Code"** to **"Subsidy No."** to align with Malaysian paddy farmer subsidy coupon system.

### Reason for Change
In Malaysia, paddy farmers are issued **subsidy coupon numbers** by the government, which are maintained throughout their registration. This is more accurate than "Farmer Code" for the Malaysian context.

---

## 🔧 What Changed

### 1. **Database** ❌ No Change
- Column name remains `farmer_code` (for backend consistency)
- Unique constraint preserved
- All existing data remains valid

### 2. **User Interface** ✅ Updated

#### Individual Add Form:
- Label: "Farmer Code" → **"Subsidy No."**
- Placeholder: "F001" → **"SUB-2024-001"**
- Validation: Now allows dashes (e.g., SUB-2024-001)
- Error message: "Please enter subsidy number"

#### Bulk Upload:
- Template header: "Farmer Code" → **"Subsidy No."**
- CSV example: F001 → **SUB-2024-001**
- Excel example: F001 → **SUB-2024-001**
- Column mapping label: **"Subsidy No."**

#### Farmers List Table:
- Column header: "Farmer Code" → **"Subsidy No."**
- Width increased to 150px (for longer numbers)

---

## 📊 Example Subsidy Number Formats

The system now supports various subsidy number formats:

| Format | Example | Valid |
|--------|---------|-------|
| Simple numeric | 001 | ✅ |
| With prefix | SUB001 | ✅ |
| With year | SUB-2024-001 | ✅ |
| Government format | KPN-01-2024-001 | ✅ |
| State code | KDH-2024-001 | ✅ |
| Old format | F001 | ✅ |

**Validation Rule:**
- Uppercase letters (A-Z)
- Numbers (0-9)
- Dashes (-)
- Pattern: `^[A-Z0-9-]+$`

---

## 💾 Sample Data

### CSV Template (farmers_template.csv)
```csv
farmer_code,ic_number,full_name,phone,date_of_birth,address,postcode,city,state,farm_size_hectares,status,notes
SUB-2024-001,850101-01-5678,Ahmad bin Abdullah,0123456789,1985-01-01,Jalan Merdeka,12345,Kuala Lumpur,Selangor,5.5,active,Subsidy coupon holder
```

### Excel Template (farmers_template.xlsx)
| Subsidy No. | IC Number | Full Name | Phone | Date of Birth | Address | Postcode | City | State | Farm Size (Hectares) | Status | Notes |
|-------------|-----------|-----------|-------|---------------|---------|----------|------|-------|---------------------|--------|-------|
| SUB-2024-001 | 850101-01-5678 | Ahmad bin Abdullah | 0123456789 | 1985-01-01 | Jalan Merdeka | 12345 | Kuala Lumpur | Selangor | 5.5 | active | Subsidy coupon holder |

---

## 🎯 How to Use

### For Individual Add:
```
Old: F001, F002, F003
New: SUB-2024-001, SUB-2024-002, SUB-2024-003
```

### For Bulk Upload:
Your existing CSV/Excel files will still work! The column is still called `farmer_code` in the backend, but the template now shows "Subsidy No." as the label.

**Flexible Mapping Example:**
```csv
Subsidy Number,Identity Card,Name,...
KPN-01-2024-001,850101-01-5678,Ahmad,...
```

Map: `Subsidy Number` → `Subsidy No.`

---

## 🔄 Migration Notes

### For Existing Data:
- ✅ No database migration needed
- ✅ All existing farmer codes remain valid
- ✅ System continues to work normally
- ✅ Can mix old and new formats

### For New Entries:
- Use actual subsidy coupon numbers
- Format examples:
  - Government issued: KPN-01-2024-001
  - State-based: KEDAH-2024-001
  - Simple: SUB001, SUB002, etc.

---

## 📋 Updated Files

```
✅ src/components/Farmers/AddFarmerModal.jsx
   - Label changed
   - Placeholder updated
   - Validation allows dashes

✅ src/components/Farmers/BulkUploadModal.jsx
   - Field label changed
   - CSV template updated
   - Excel template updated

✅ src/components/Farmers/Farmers.jsx
   - Table column header changed
   - Column width increased
```

---

## ✅ Validation Changes

### Before:
```javascript
pattern: /^[A-Z0-9]+$/
message: 'Only uppercase letters and numbers'
```

### After:
```javascript
pattern: /^[A-Z0-9-]+$/
message: 'Only uppercase letters, numbers, and dashes'
```

This allows formats like: `SUB-2024-001`, `KPN-01-2024-001`, etc.

---

## 🎉 Benefits

1. ✅ **More Accurate** - Reflects actual Malaysian subsidy system
2. ✅ **Better UX** - Users understand "Subsidy No." immediately
3. ✅ **Flexible Format** - Supports various subsidy number formats
4. ✅ **Government Aligned** - Matches official terminology
5. ✅ **No Data Loss** - Existing codes remain valid

---

## 🚀 Testing

Test the changes:

1. **Add Individual Farmer:**
   - Try: SUB-2024-001
   - Try: KPN-01-2024-001
   - Try: KEDAH-2024-001

2. **Bulk Upload:**
   - Download new template
   - Check header says "Subsidy No."
   - Import with subsidy numbers

3. **View Farmers List:**
   - Column header shows "Subsidy No."
   - All existing codes display correctly

---

## 📚 Context: Malaysian Subsidy System

In Malaysia, registered paddy farmers receive:
- **Subsidy Coupon Numbers** from government
- Used for fertilizer subsidies
- Tracked by Department of Agriculture
- Maintained across seasons
- Critical for farmer identification

This change aligns the system with actual Malaysian agricultural practices.

---

## ✅ Summary

| Item | Status |
|------|--------|
| Label updates | ✅ Complete |
| Template updates | ✅ Complete |
| Validation update | ✅ Complete |
| Database schema | ℹ️ No change needed |
| Backward compatibility | ✅ Maintained |
| Testing | ✅ Ready |

**The system now correctly uses "Subsidy No." throughout!** 🌾
