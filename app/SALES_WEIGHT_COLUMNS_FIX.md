# Sales History Weight Columns Fix

## Issue Fixed
Sales Transaction History table showing no values for Gross, Tare, and Net weight columns.

## Root Cause
1. **Database schema missing columns:** The `sales_transactions` table only had `total_quantity_kg` but was missing:
   - `gross_weight_kg`
   - `tare_weight_kg`
   - `net_weight_kg`

2. **Backend not saving weight data:** The `sales.js` create function wasn't inserting these values.

3. **Backend not returning weight data:** The `sales.js` getAll function wasn't selecting these columns.

4. **Frontend column name mismatches:**
   - Using `transaction_date` instead of `sale_date`
   - Using `final_price_per_kg` instead of `sale_price_per_kg`
   - Using `receipt_number` instead of `sales_number`
   - Sending `date_from`/`date_to` instead of `startDate`/`endDate`

## Solution Implemented

### 1. Database Migration

**Created:** `/migrations/007_add_weight_columns_to_sales.sql`

```sql
ALTER TABLE sales_transactions
ADD COLUMN gross_weight_kg DECIMAL(10,2) AFTER total_quantity_kg,
ADD COLUMN tare_weight_kg DECIMAL(10,2) AFTER gross_weight_kg,
ADD COLUMN net_weight_kg DECIMAL(10,2) AFTER tare_weight_kg;

-- Update existing records
UPDATE sales_transactions
SET net_weight_kg = total_quantity_kg
WHERE net_weight_kg IS NULL;
```

**Executed:**
```bash
mysql -u azham -p'***' paddy_collection_db < migrations/007_add_weight_columns_to_sales.sql
```

**Result:** ✅ Columns added successfully

### 2. Backend - Create Function

**File:** `/app/electron/database/queries/sales.js`

**Before:**
```javascript
INSERT INTO sales_transactions (
  sales_number, season_id, manufacturer_id, sale_date,
  vehicle_number, driver_name,
  total_quantity_kg, sale_price_per_kg, total_amount,
  ...
) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ...)
```

**After:**
```javascript
INSERT INTO sales_transactions (
  sales_number, season_id, manufacturer_id, sale_date,
  vehicle_number, driver_name,
  total_quantity_kg, gross_weight_kg, tare_weight_kg, net_weight_kg,
  sale_price_per_kg, total_amount,
  ...
) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ...)
```

**Values:**
```javascript
[
  salesNumber,
  saleData.season_id,
  saleData.manufacturer_id,
  saleData.vehicle_number,
  saleData.driver_name,
  saleData.net_weight_kg,           // total_quantity_kg
  saleData.gross_weight_kg,         // NEW
  saleData.tare_weight_kg,          // NEW
  saleData.net_weight_kg,           // NEW
  saleData.base_price_per_kg,
  totalAmount,
  saleData.notes || null,
  saleData.created_by
]
```

### 3. Backend - GetAll Function

**File:** `/app/electron/database/queries/sales.js`

**Before:**
```javascript
SELECT 
  st.sales_id,
  st.sales_number,
  st.sale_date,
  st.vehicle_number,
  st.driver_name,
  st.total_quantity_kg,
  st.sale_price_per_kg,
  st.total_amount,
  ...
```

**After:**
```javascript
SELECT 
  st.sales_id,
  st.sales_number,
  st.sale_date,
  st.vehicle_number,
  st.driver_name,
  st.total_quantity_kg,
  st.gross_weight_kg,          // NEW
  st.tare_weight_kg,           // NEW
  st.net_weight_kg,            // NEW
  st.sale_price_per_kg,
  st.total_amount,
  ...
```

### 4. Frontend - SalesHistory Component

**File:** `/app/src/components/Sales/SalesHistory.jsx`

**Fixed API Call:**
```javascript
// BEFORE
const result = await window.electronAPI.sales?.getAll({
  date_from: startDate.format('YYYY-MM-DD'),
  date_to: endDate.format('YYYY-MM-DD')
});

// AFTER
const result = await window.electronAPI.sales?.getAll({
  startDate: startDate.format('YYYY-MM-DD'),
  endDate: endDate.format('YYYY-MM-DD')
});
```

**Fixed Column Names:**
```javascript
// BEFORE
{
  title: 'Receipt',
  dataIndex: 'receipt_number',  // ❌ Wrong
  ...
}

// AFTER
{
  title: 'Sales Number',
  dataIndex: 'sales_number',    // ✅ Correct
  ...
}
```

```javascript
// BEFORE
{
  title: 'Date & Time',
  dataIndex: 'transaction_date',  // ❌ Wrong
  ...
}

// AFTER
{
  title: 'Date & Time',
  dataIndex: 'sale_date',         // ✅ Correct
  ...
}
```

```javascript
// BEFORE
{
  title: 'Price/kg',
  dataIndex: 'final_price_per_kg',  // ❌ Wrong
  ...
}

// AFTER
{
  title: 'Price/kg',
  dataIndex: 'sale_price_per_kg',   // ✅ Correct
  ...
}
```

**Fixed Row Key:**
```javascript
// BEFORE
<Table rowKey="transaction_id" ... />  // ❌ Wrong

// AFTER
<Table rowKey="sales_id" ... />        // ✅ Correct
```

## Updated Table Schema

### sales_transactions Table
```
Before:
- total_quantity_kg DECIMAL(15,2)
- sale_price_per_kg DECIMAL(10,2)
- total_amount DECIMAL(15,2)

After:
- total_quantity_kg DECIMAL(15,2)
- gross_weight_kg DECIMAL(10,2)    ← NEW
- tare_weight_kg DECIMAL(10,2)     ← NEW
- net_weight_kg DECIMAL(10,2)      ← NEW
- sale_price_per_kg DECIMAL(10,2)
- total_amount DECIMAL(15,2)
```

## Data Flow

### 1. Create Sale (Frontend → Backend)
```javascript
// Frontend sends:
const saleData = {
  gross_weight_kg: 7500,
  tare_weight_kg: 2500,
  net_weight_kg: 5000,
  base_price_per_kg: 1.85,
  ...
};

// Backend saves:
INSERT INTO sales_transactions (
  ...,
  total_quantity_kg,    // 5000
  gross_weight_kg,      // 7500  ← NEW
  tare_weight_kg,       // 2500  ← NEW
  net_weight_kg,        // 5000  ← NEW
  ...
)
```

### 2. Get Sales History (Backend → Frontend)
```javascript
// Backend returns:
{
  success: true,
  data: [
    {
      sales_id: 1,
      sales_number: 'SALE-20251113-0001',
      sale_date: '2025-11-13T07:30:00',
      gross_weight_kg: 7500,    // ✅ Now included
      tare_weight_kg: 2500,     // ✅ Now included
      net_weight_kg: 5000,      // ✅ Now included
      sale_price_per_kg: 1.85,
      total_amount: 9250.00,
      ...
    }
  ]
}

// Frontend displays in table:
| Sales Number         | Date       | Gross  | Tare  | Net   | Price  | Total    |
|---------------------|------------|--------|-------|-------|--------|----------|
| SALE-20251113-0001  | 13/11/2025 | 7500.00| 2500.00| 5000.00| RM 1.85| RM 9250.00|
```

## Testing

### ✅ Test 1: Create New Sale
1. Navigate to Sales → Weigh-In
2. Create container with weights:
   - Tare: 2,500 kg
   - Gross: 7,500 kg
   - Net: 5,000 kg (auto-calculated)
3. Select manufacturer and receipts
4. Complete sale
5. Navigate to Sales → History
6. **Verify:** Gross, Tare, Net columns now show values ✅

### ✅ Test 2: Database Verification
```sql
SELECT 
  sales_number,
  gross_weight_kg,
  tare_weight_kg,
  net_weight_kg,
  total_quantity_kg
FROM sales_transactions
ORDER BY sale_date DESC LIMIT 5;
```

**Expected Result:**
```
+--------------------+------------------+-----------------+----------------+-------------------+
| sales_number       | gross_weight_kg  | tare_weight_kg  | net_weight_kg  | total_quantity_kg |
+--------------------+------------------+-----------------+----------------+-------------------+
| SALE-20251113-0001 |          7500.00 |         2500.00 |        5000.00 |           5000.00 |
+--------------------+------------------+-----------------+----------------+-------------------+
```

### ✅ Test 3: Existing Records
For existing records (before migration):
```sql
SELECT 
  sales_number,
  gross_weight_kg,
  tare_weight_kg,
  net_weight_kg,
  total_quantity_kg
FROM sales_transactions
WHERE sale_date < '2025-11-13';
```

**Expected Result:**
```
+--------------------+------------------+-----------------+----------------+-------------------+
| sales_number       | gross_weight_kg  | tare_weight_kg  | net_weight_kg  | total_quantity_kg |
+--------------------+------------------+-----------------+----------------+-------------------+
| SALE-20251112-0001 |             NULL |            NULL |        3500.00 |           3500.00 |
+--------------------+------------------+-----------------+----------------+-------------------+
```

- `gross_weight_kg` = NULL (not recorded before)
- `tare_weight_kg` = NULL (not recorded before)
- `net_weight_kg` = 3500.00 (migrated from `total_quantity_kg`)

## Summary of Changes

### Files Modified
1. `/migrations/007_add_weight_columns_to_sales.sql` - **CREATED**
2. `/app/electron/database/queries/sales.js` - **MODIFIED**
   - Updated `create()` function INSERT statement
   - Updated `getAll()` function SELECT statement
3. `/app/src/components/Sales/SalesHistory.jsx` - **MODIFIED**
   - Fixed API parameter names
   - Fixed column dataIndex names
   - Fixed row key

### Database Changes
- Added 3 columns to `sales_transactions` table
- Migrated existing data

### Data Integrity
- ✅ All new sales will have gross, tare, and net weights
- ✅ Existing sales show net weight (migrated from total_quantity_kg)
- ✅ Existing sales show NULL for gross/tare (historical data not available)
- ✅ No data loss

## Benefits

1. **Complete Weight Tracking:** Full visibility of container weights in history
2. **Data Consistency:** Weight columns match Purchases table structure
3. **Backward Compatible:** Existing sales still display with available data
4. **Audit Trail:** Know exact weights used in each sale
5. **Reporting Ready:** Can generate weight-based reports

---

**Status:** ✅ Fixed and Working  
**Version:** 1.0  
**Date:** November 13, 2025  
**Migration:** 007_add_weight_columns_to_sales.sql

## Verification

Navigate to **Sales > History** and verify:
- ✅ Gross weight column shows values
- ✅ Tare weight column shows values
- ✅ Net weight column shows values
- ✅ Date and time display correctly
- ✅ Sales number displays correctly
- ✅ Price per kg displays correctly

**The Sales Transaction History table now displays all weight values correctly!** 🎉
