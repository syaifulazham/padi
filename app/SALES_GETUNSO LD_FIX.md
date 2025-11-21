# Sales Receipt Selection - getUnsold API Fix

## Issue
When clicking "Select Receipts" button in the Sales workflow, the error appeared:
```
Failed to load available receipts
```

Console error:
```javascript
TypeError: window.electronAPI.purchases?.getUnsold is not a function
```

## Root Cause
The `getUnsold()` API endpoint did not exist in the backend. The Sales component was calling a non-existent function.

## Solution Implemented

### 1. Backend Query (`purchases.js`)
Added new `getUnsold()` function that:
- Queries `purchase_transactions` table
- LEFT JOINs with `sales_purchase_mapping` to find which purchases have been sold
- Calculates available quantity: `original weight - sold quantity`
- Only returns receipts with `available_quantity_kg > 0`
- Groups by all non-aggregated columns for MySQL strict mode compatibility

**SQL Logic:**
```sql
SELECT 
  pt.transaction_id,
  pt.receipt_number,
  pt.transaction_date,
  pt.net_weight_kg,
  f.full_name as farmer_name,
  pg.grade_name,
  COALESCE(SUM(spm.quantity_kg), 0) as sold_quantity_kg,
  pt.net_weight_kg - COALESCE(SUM(spm.quantity_kg), 0) as available_quantity_kg
FROM purchase_transactions pt
LEFT JOIN sales_purchase_mapping spm ON pt.transaction_id = spm.transaction_id
WHERE pt.status = 'completed'
GROUP BY pt.transaction_id, ...
HAVING available_quantity_kg > 0
```

**Key Features:**
- Returns only unsold or partially sold receipts
- Shows available quantity (not original quantity)
- Includes farmer name, grade, season for display
- Sorted by transaction date (newest first)

### 2. IPC Handler Registration (`main.js`)
```javascript
ipcMain.handle('purchases:getUnsold', async (event) => {
  return await purchaseService.getUnsold();
});
```

### 3. API Exposure (`preload.js`)
```javascript
purchases: {
  create: (data) => ipcRenderer.invoke('purchases:create', data),
  getAll: (filters) => ipcRenderer.invoke('purchases:getAll', filters),
  getById: (id) => ipcRenderer.invoke('purchases:getById', id),
  getByReceipt: (receiptNumber) => ipcRenderer.invoke('purchases:getByReceipt', receiptNumber),
  getUnsold: () => ipcRenderer.invoke('purchases:getUnsold')  // <-- ADDED
}
```

## Files Modified
1. `/app/electron/database/queries/purchases.js` - Added `getUnsold()` function
2. `/app/electron/main.js` - Registered IPC handler
3. `/app/electron/preload.js` - Exposed API to frontend

## Testing
After restart:
1. Navigate to **Sales > Weigh-In**
2. Create a new sale and enter tare weight
3. Recall the container (F3)
4. Enter gross weight
5. Click "**Select Receipts**" button
6. Modal should open showing available purchase receipts

## Expected Behavior
- Modal displays table of unsold purchase receipts
- Shows: Receipt number, Date, Farmer name, Available weight
- Multi-select checkboxes enabled
- Summary shows total selected weight
- Only receipts with available quantity > 0 appear

## Database Schema Reference
**Tables Involved:**
- `purchase_transactions` - Original purchase records
- `sales_purchase_mapping` - Links sales to purchases (traceability)
- `farmers`, `paddy_grades`, `harvesting_seasons` - Reference data

**Relationship:**
- A purchase can be sold multiple times (partial sales)
- Each sale maps to one or more purchase receipts
- The mapping tracks quantity sold per receipt
- Available quantity = Original - Sum(Sold)

## Notes
- Requires app restart (backend changes)
- Frontend Sales component already had the call; just needed backend implementation
- MySQL strict mode requires all non-aggregated columns in GROUP BY clause
- Function returns formatted data with `net_weight_kg` set to `available_quantity_kg` for UI compatibility

---

**Status**: ✅ Fixed and Tested  
**Version**: 1.0  
**Date**: November 13, 2025
