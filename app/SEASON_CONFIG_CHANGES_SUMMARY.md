# Season Configuration Changes - Quick Summary

## 🎯 What Changed

### **1. Price Format**
- **From:** RM per kilogram (e.g., RM 1.80/kg)
- **To:** RM per metric ton (e.g., RM 1,800.00/ton)
- **Why:** Industry standard for bulk commodity pricing

### **2. Deduction Format**
- **Old Format:**
  ```json
  [
    {
      "type": "Wap Basah",
      "percentage_5": 0.05,
      "percentage_10": 0.10,
      "percentage_15": 0.15
    }
  ]
  ```

- **New Format:**
  ```json
  [
    {"deduction": "Wap Basah", "value": 0.05},
    {"deduction": "Hampa", "value": 0.05},
    {"deduction": "Kotoran", "value": 0.05},
    {"deduction": "Lain-lain", "value": 0.05}
  ]
  ```

### **3. Dynamic Deduction Management**
- ✅ **Add new deduction items** (click "Add Deduction Item" button)
- ✅ **Remove deduction items** (click "Remove" button)
- ✅ **Customize deduction names** (type custom names)
- ✅ **Set individual rates** (single value per deduction)

---

## 📋 Default Deduction Types

| Deduction | English | Default Rate |
|-----------|---------|--------------|
| Wap Basah | Moisture/Wetness | 5% (0.05) |
| Hampa | Empty Grains | 5% (0.05) |
| Kotoran | Dirt/Impurities | 5% (0.05) |
| Lain-lain | Others | 5% (0.05) |

---

## 🎨 UI Changes

### **Season Configuration Form:**

**Before:**
- Opening Price (RM/kg): `1.80`
- Fixed deduction types with 3 rates each

**After:**
- Opening Price (RM/Metric Ton): `1800.00`
- Dynamic deduction list with add/remove buttons
- Single rate per deduction
- Custom deduction names allowed

### **Table Display:**
```
Opening Price
RM 1,800.00
per ton
```

---

## 💡 How to Use

### **Creating a New Season:**

1. Go to **Settings → Season Config**
2. Click **"Create New Season"**
3. Fill in season details:
   - Season Code: `2024-S1`
   - Season Name: `Musim 1/2024`
   - Year: `2024`
   - Season Number: `1`
   - **Opening Price: `1800.00`** (per metric ton)
   
4. **Configure Deductions:**
   - Default 4 items loaded automatically
   - **To add:** Click "Add Deduction Item"
     - Enter deduction name: `Retak`
     - Enter rate: `0.04`
   - **To remove:** Click "Remove" button next to item
   - **To customize:** Edit deduction name directly

5. Select operating mode: LIVE or DEMO
6. Click **"Create"**

### **Adding Custom Deduction:**

**Example: Add "Rusak" (Damaged) at 6%:**

1. In deduction section, click **"Add Deduction Item"**
2. New row appears
3. Enter:
   - Deduction Type: `Rusak`
   - Deduction Rate: `0.06`
4. Save season

### **Removing Deduction:**

1. Click **"Remove"** button next to the deduction
2. Item removed immediately
3. Cannot remove last item (minimum 1 required)

---

## 🔢 Price Entry Guide

### **Correct:**
- ✅ `1800` or `1800.00` for RM 1,800 per ton
- ✅ `1850.50` for RM 1,850.50 per ton
- ✅ `2000` for RM 2,000 per ton

### **Incorrect:**
- ❌ `1.80` (that's per kg, old format)
- ❌ `18` (too low, likely missing zeros)

### **Deduction Rate Entry:**

- ✅ `0.05` for 5% deduction
- ✅ `0.10` for 10% deduction
- ✅ `0.03` for 3% deduction
- ❌ `5` (that's 500%, not 5%)

---

## 📊 Practical Examples

### **Example 1: Standard Season**

```
Opening Price: RM 1,850.00 per ton
Deductions:
- Wap Basah: 0.05 (5%)
- Hampa: 0.05 (5%)
- Kotoran: 0.05 (5%)
- Lain-lain: 0.05 (5%)
```

**Purchase Calculation:**
```
Quantity: 1,000 kg = 1 ton
Base Price: RM 1,850.00
If Wap Basah detected:
  Deduction: 1,850.00 × 0.05 = RM 92.50
  Net Price: RM 1,757.50
```

### **Example 2: Premium Season**

```
Opening Price: RM 2,000.00 per ton
Deductions:
- Wap Basah: 0.03 (3%)
- Hampa: 0.03 (3%)
- Kotoran: 0.02 (2%)
```

**Purchase Calculation:**
```
Quantity: 1,500 kg = 1.5 tons
Base Price: RM 3,000.00 (2,000 × 1.5)
If Hampa detected:
  Deduction: 3,000.00 × 0.03 = RM 90.00
  Net Price: RM 2,910.00
```

### **Example 3: Custom Deductions**

```
Opening Price: RM 1,800.00 per ton
Deductions:
- Wap Basah: 0.05 (5%)
- Hampa: 0.05 (5%)
- Rusak: 0.06 (6%)  ← Custom
- Retak: 0.04 (4%)  ← Custom
- Kapur: 0.03 (3%)  ← Custom
```

---

## ⚠️ Important Notes

### **For Users:**

1. **Price is per metric ton (1000 KG)**, not per kg
2. **Enter whole numbers** for price (e.g., 1800, not 1.8)
3. **Deduction rates are decimals** (e.g., 0.05 for 5%)
4. **At least 1 deduction required** (cannot remove all)
5. **Custom names allowed** - use local terms if preferred

### **For Existing Seasons:**

- Old seasons with "per kg" pricing have been automatically converted
- Old: RM 1.80/kg → New: RM 1,800.00/ton
- No data loss during migration
- Edit old seasons to update to new deduction format

---

## 🎯 Key Benefits

### **1. Industry Standard**
- Metric ton is standard for bulk commodities
- Easier to compare with market rates
- More professional

### **2. Flexibility**
- Add custom deduction types as needed
- Remove irrelevant deductions
- Different config per season

### **3. Simplicity**
- One rate per deduction (not 3)
- Clearer and easier to understand
- Less confusion

### **4. User Control**
- Full control over deduction types
- Customize names to local language
- Adapt to changing requirements

---

## 🔄 Backward Compatibility

- ✅ Old data preserved during migration
- ✅ Old prices converted automatically
- ✅ System handles both old and new formats
- ✅ No manual intervention required
- ✅ Edit old seasons to use new format

---

## 📞 Quick Reference

**Price Entry:**
- Per metric ton (1000 KG)
- Example: `1800.00`

**Deduction Rate:**
- Decimal format
- Example: `0.05` = 5%

**Add Deduction:**
- Click "Add Deduction Item"
- Enter name and rate

**Remove Deduction:**
- Click "Remove" button
- Min 1 item required

---

**Status:** ✅ Active  
**Version:** 1.0  
**Date:** November 15, 2025

**Price per metric ton + flexible deduction configuration!** 💰✨
