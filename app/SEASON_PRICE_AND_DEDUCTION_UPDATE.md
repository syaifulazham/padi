# Season Price and Deduction Configuration Update

## Overview
Updated Season Configuration to use **price per metric ton (1000 KG)** instead of per kg, and simplified deduction configuration format with the ability to add custom deduction items dynamically.

---

## 🎯 Major Changes

### **1. Price Format Change**
- **Before:** Price per kg (e.g., RM 1.80/kg)
- **After:** Price per metric ton (e.g., RM 1800.00/ton)
- **Reason:** Industry standard pricing for bulk paddy purchases

### **2. Simplified Deduction Format**
- **Before:** Three-tier deduction rates
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

- **After:** Single value deduction rates
  ```json
  [
    {"deduction": "Wap Basah", "value": 0.05},
    {"deduction": "Hampa", "value": 0.05},
    {"deduction": "Kotoran", "value": 0.05},
    {"deduction": "Lain-lain", "value": 0.05}
  ]
  ```

### **3. Dynamic Deduction Management**
- ✅ **Add new deduction items** on the fly
- ✅ **Remove unwanted deduction items**
- ✅ **Customize deduction names** per season
- ✅ **Flexible rate configuration**

---

## 📊 Database Changes

### **Migration: 009_update_season_price_and_deduction_format.sql**

#### **Column Rename:**
```sql
ALTER TABLE harvesting_seasons
CHANGE COLUMN opening_price_per_kg opening_price_per_ton 
DECIMAL(10,2) COMMENT 'Opening price per metric ton (1000 KG)';
```

#### **Data Conversion:**
```sql
UPDATE harvesting_seasons
SET opening_price_per_ton = opening_price_per_ton * 1000
WHERE opening_price_per_ton IS NOT NULL AND opening_price_per_ton < 100;
```

**Example:**
- Old: `1.80` (RM/kg)
- New: `1800.00` (RM/ton)

---

## 🎨 Frontend Changes

### **Season Config Form**

#### **Price Field:**
```jsx
<Form.Item
  name="opening_price_per_ton"
  label="Opening Price (RM/Metric Ton)"
  rules={[{ required: true }]}
  tooltip="Price per 1000 KG (Metric Ton)"
>
  <InputNumber
    min={0}
    step={10}
    precision={2}
    placeholder="1800.00"
    addonBefore="RM"
  />
</Form.Item>
```

#### **Deduction Configuration:**
```jsx
<Form.List name="deduction_config">
  {(fields, { add, remove }) => (
    <>
      {fields.map(({ key, name }) => (
        <Space key={key}>
          <Form.Item
            name={[name, 'deduction']}
            label="Deduction Type"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g., Wap Basah, Hampa, Kotoran" />
          </Form.Item>
          
          <Form.Item
            name={[name, 'value']}
            label="Deduction Rate"
            rules={[{ required: true }]}
          >
            <InputNumber
              min={0}
              max={1}
              step={0.01}
              precision={2}
              placeholder="0.05"
            />
          </Form.Item>
          
          {fields.length > 1 && (
            <Button
              type="text"
              danger
              icon={<MinusCircleOutlined />}
              onClick={() => remove(name)}
            >
              Remove
            </Button>
          )}
        </Space>
      ))}
      
      <Button
        type="dashed"
        onClick={() => add()}
        block
        icon={<PlusOutlined />}
      >
        Add Deduction Item
      </Button>
    </>
  )}
</Form.List>
```

### **Table Display:**
```jsx
{
  title: 'Opening Price',
  dataIndex: 'opening_price_per_ton',
  render: (price) => (
    <div>
      <div>{price ? `RM ${parseFloat(price).toFixed(2)}` : '-'}</div>
      <div style={{ fontSize: 11, color: '#999' }}>per ton</div>
    </div>
  )
}
```

---

## 🔧 Backend Changes

### **seasons.js Service**

#### **Updated SQL Queries:**
```javascript
// SELECT
SELECT 
  hs.opening_price_per_ton,
  hs.deduction_config
FROM harvesting_seasons hs

// INSERT
INSERT INTO harvesting_seasons (
  opening_price_per_ton,
  deduction_config
) VALUES (?, ?)

// UPDATE
UPDATE harvesting_seasons
SET 
  opening_price_per_ton = ?,
  deduction_config = ?
WHERE season_id = ?
```

#### **JSON Handling:**
```javascript
// On save: Stringify deduction config
const deductionConfig = seasonData.deduction_config 
  ? JSON.stringify(seasonData.deduction_config) 
  : null;

// On retrieve: Parse deduction config
const formattedRows = rows.map(row => ({
  ...row,
  deduction_config: row.deduction_config 
    ? JSON.parse(row.deduction_config) 
    : []
}));
```

---

## 📋 Default Deduction Types

### **New Default Configuration:**
```javascript
const defaultDeductions = [
  { deduction: 'Wap Basah', value: 0.05 },
  { deduction: 'Hampa', value: 0.05 },
  { deduction: 'Kotoran', value: 0.05 },
  { deduction: 'Lain-lain', value: 0.05 }
];
```

### **Deduction Types Explained:**

| Deduction Type | English | Default Rate | Description |
|----------------|---------|--------------|-------------|
| **Wap Basah** | Moisture/Wetness | 5% | Wet or moist paddy |
| **Hampa** | Empty Grains | 5% | Empty or hollow grains |
| **Kotoran** | Dirt/Impurities | 5% | Dirt, stones, foreign matter |
| **Lain-lain** | Others | 5% | Other quality issues |

---

## ✨ New Features

### **1. Add Custom Deductions**
Users can now add custom deduction types:
- Click **"Add Deduction Item"** button
- Enter custom deduction name (e.g., "Rusak", "Kapur", "Retak")
- Set deduction rate
- Save season configuration

### **2. Remove Deductions**
- Click **"Remove"** button next to any deduction item (except the last one)
- Minimum 1 deduction item required
- Flexible configuration per season

### **3. Edit Deduction Names**
- Customize deduction type names per season
- Use local language or standard terms
- Different seasons can have different deduction types

---

## 🎯 Use Cases

### **Example 1: Standard Season**
```json
{
  "opening_price_per_ton": 1850.00,
  "deduction_config": [
    {"deduction": "Wap Basah", "value": 0.05},
    {"deduction": "Hampa", "value": 0.05},
    {"deduction": "Kotoran", "value": 0.05}
  ]
}
```

### **Example 2: Premium Season (Lower Deductions)**
```json
{
  "opening_price_per_ton": 2000.00,
  "deduction_config": [
    {"deduction": "Wap Basah", "value": 0.03},
    {"deduction": "Hampa", "value": 0.03},
    {"deduction": "Kotoran", "value": 0.02}
  ]
}
```

### **Example 3: Training Season (Custom Deductions)**
```json
{
  "opening_price_per_ton": 1800.00,
  "mode": "DEMO",
  "deduction_config": [
    {"deduction": "Quality Issue A", "value": 0.05},
    {"deduction": "Quality Issue B", "value": 0.05},
    {"deduction": "Quality Issue C", "value": 0.05},
    {"deduction": "Other Issues", "value": 0.05}
  ]
}
```

---

## 💰 Price Calculation Examples

### **Old Format (Per KG):**
- Opening Price: RM 1.80/kg
- Quantity: 1000 kg
- **Total:** RM 1,800.00

### **New Format (Per Metric Ton):**
- Opening Price: RM 1,800.00/ton
- Quantity: 1000 kg = 1 ton
- **Total:** RM 1,800.00

### **With Deductions:**
```
Base Price: RM 1,800.00/ton
Quantity: 1,000 kg (1 ton)
Gross Amount: RM 1,800.00

Deductions:
- Wap Basah (5%): RM 90.00
- Hampa (5%): RM 90.00
- Kotoran (5%): RM 90.00

Total Deductions: RM 270.00
Net Amount: RM 1,530.00
```

---

## 🔄 Migration Process

### **For Existing Data:**

1. **Database Migration:**
   - Column renamed: `opening_price_per_kg` → `opening_price_per_ton`
   - Prices multiplied by 1000
   - Existing data preserved

2. **Application Handling:**
   - Old deduction format still readable
   - On edit/save, converts to new format
   - Seamless backward compatibility

3. **User Action:**
   - No immediate action required
   - Edit seasons to update to new format
   - New seasons use new format automatically

---

## 🧪 Testing

### **Test 1: Create New Season**
1. Go to Settings → Season Config
2. Click "Create New Season"
3. ✅ Price field shows "RM/Metric Ton"
4. ✅ Default deductions loaded
5. Enter price: `1850.00`
6. ✅ Saves correctly

### **Test 2: Add Custom Deduction**
1. Create/Edit season
2. Click "Add Deduction Item"
3. Enter: `{"deduction": "Retak", "value": 0.04}`
4. ✅ New item added
5. ✅ Can remove item

### **Test 3: Remove Deduction**
1. Edit season with multiple deductions
2. Click "Remove" on any deduction
3. ✅ Item removed
4. ✅ Cannot remove last item

### **Test 4: Table Display**
1. View seasons table
2. ✅ Price shows "RM X.XX per ton"
3. ✅ Correct formatting
4. ✅ Old data displayed correctly

### **Test 5: Price Conversion**
1. Check existing seasons
2. ✅ Old `1.80` now shows as `1800.00`
3. ✅ Calculations correct
4. ✅ No data loss

---

## 📁 Files Modified

1. ✅ `/migrations/009_update_season_price_and_deduction_format.sql`
   - Database migration script

2. ✅ `/app/src/components/Settings/SeasonConfig.jsx`
   - Updated form fields
   - New deduction UI with add/remove
   - Price field changed to per ton
   - Table column updated

3. ✅ `/app/electron/database/queries/seasons.js`
   - Updated SQL queries
   - Field name changes
   - JSON handling preserved

4. ✅ `/app/SEASON_PRICE_AND_DEDUCTION_UPDATE.md` (This file)

---

## 🎓 Benefits

### **1. Industry Standard**
- Aligns with bulk commodity trading
- Easier price comparison with market rates
- More intuitive for large-scale operations

### **2. Flexibility**
- Add custom deduction types per season
- Different configurations for different seasons
- Adapt to changing quality requirements

### **3. Simplicity**
- Single value per deduction (not 3 tiers)
- Easier to understand and configure
- Less complex calculations

### **4. User Control**
- Users can add/remove deductions
- Customize names to match local terms
- Full control over configuration

---

## 🔮 Future Enhancements

### **Potential Improvements:**

1. **Deduction Templates**
   - Save common deduction sets
   - Quick apply to new seasons

2. **Auto-Calculate Suggestions**
   - Based on historical data
   - Market rate integration

3. **Deduction Categories**
   - Group related deductions
   - Visual categorization

4. **Multi-Currency Support**
   - Support for different currencies
   - Exchange rate integration

5. **Bulk Price Updates**
   - Update multiple seasons at once
   - Price adjustment tools

---

## ⚠️ Important Notes

### **For Administrators:**
1. **Price Entry:** Always enter price per metric ton (e.g., 1800, not 1.8)
2. **Deduction Rates:** Enter as decimal (e.g., 0.05 for 5%)
3. **Minimum Deductions:** At least 1 deduction item required
4. **JSON Format:** System handles JSON conversion automatically

### **For Developers:**
1. **Field Name:** Use `opening_price_per_ton` in all new code
2. **Backward Compatibility:** Old `opening_price_per_kg` still exists in old records
3. **Deduction Format:** New format is `{deduction, value}`, old format has `{type, percentage_5, percentage_10, percentage_15}`
4. **JSON Handling:** Always stringify on save, parse on retrieve

---

## 📊 Comparison

| Aspect | Old Format | New Format |
|--------|-----------|------------|
| **Price Unit** | Per KG | Per Metric Ton |
| **Price Example** | RM 1.80 | RM 1800.00 |
| **Deduction Structure** | 3 values per type | 1 value per type |
| **Deduction Example** | `{type, percentage_5, percentage_10, percentage_15}` | `{deduction, value}` |
| **Add Deductions** | ❌ Fixed types | ✅ Dynamic |
| **Remove Deductions** | ❌ Fixed types | ✅ Dynamic |
| **Customize Names** | ❌ Fixed names | ✅ Custom names |
| **Flexibility** | Low | High |

---

## ✨ Summary

**Price per metric ton (1000 KG) with flexible, dynamic deduction configuration!**

### **Key Changes:**
- ✅ **Price:** Per kg → Per metric ton
- ✅ **Deduction Format:** Simplified to single value
- ✅ **Add/Remove:** Dynamic deduction management
- ✅ **Customization:** Custom deduction names
- ✅ **Database:** Migration completed successfully

### **Benefits:**
- Industry standard pricing
- More flexible configuration
- Easier to manage and understand
- Better suited for bulk operations

---

**Status:** ✅ Fully Implemented  
**Version:** 1.0  
**Date:** November 15, 2025

**Configure seasons with price per metric ton and custom deduction rates!** 💰📊
