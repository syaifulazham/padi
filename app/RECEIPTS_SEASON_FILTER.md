# Purchase Receipts Season Filtering Fix

## Issue Fixed

**Problem:** The "Select Purchase Receipts" modal in Sales was showing receipts from ALL seasons, not just the active season. This caused:
- Receipts from Season 1 appearing when Season 2 is active
- Confusion about which receipts can be sold
- Potential selling of inventory from wrong season
- Inventory tracking issues across seasons

**Solution:** Filter purchase receipts by active season ID in the `getUnsold` query.

---

## What Was Changed

### **Before (Wrong):**
```
Active Season: Season 10/2025

Available Receipts Modal shows:
- Receipt #1 (Season 1) ❌ Wrong season!
- Receipt #2 (Season 10) ✓
- Receipt #3 (Season 1) ❌ Wrong season!
- Receipt #4 (Season 10) ✓
- Receipt #5 (Season 8) ❌ Wrong season!

Result: Mixed receipts from different seasons!
```

### **After (Fixed):**
```
Active Season: Season 10/2025

Available Receipts Modal shows:
- Receipt #2 (Season 10) ✓
- Receipt #4 (Season 10) ✓

Result: Only receipts from active season!
```

---

## How It Works Now

### **1. Backend Query Filter**

**File:** `/app/electron/database/queries/purchases.js`

**Before:**
```javascript
async function getUnsold() {
  const sql = `
    SELECT ... 
    FROM purchase_transactions pt
    WHERE pt.status = 'completed'
    -- ❌ No season filter
  `;
  const rows = await db.query(sql, []);
}
```

**After:**
```javascript
async function getUnsold(seasonId = null) {
  let sql = `
    SELECT ... 
    FROM purchase_transactions pt
    WHERE pt.status = 'completed'
  `;
  
  const params = [];
  
  // Filter by season if provided
  if (seasonId) {
    sql += ` AND pt.season_id = ?`;
    params.push(seasonId);
  }
  
  const rows = await db.query(sql, params);
  console.log('📊 Purchase getUnsold - Season ID:', seasonId);
  console.log('📊 Purchase getUnsold - Found receipts:', rows.length);
}
```

### **2. IPC Handler Update**

**File:** `/app/electron/main.js`

**Before:**
```javascript
ipcMain.handle('purchases:getUnsold', async (event) => {
  return await purchaseService.getUnsold();
  // ❌ No season parameter
});
```

**After:**
```javascript
ipcMain.handle('purchases:getUnsold', async (event, seasonId) => {
  return await purchaseService.getUnsold(seasonId);
  // ✅ Pass season ID
});
```

### **3. Preload API Update**

**File:** `/app/electron/preload.js`

**Before:**
```javascript
getUnsold: () => ipcRenderer.invoke('purchases:getUnsold')
```

**After:**
```javascript
getUnsold: (seasonId) => ipcRenderer.invoke('purchases:getUnsold', seasonId)
```

### **4. Frontend Call Update**

**File:** `/app/src/components/Sales/Sales.jsx`

**Before:**
```javascript
const loadAvailableReceipts = async () => {
  const result = await window.electronAPI.purchases?.getUnsold();
  // ❌ No season ID passed
  setAvailableReceipts(result.data);
};
```

**After:**
```javascript
const loadAvailableReceipts = async () => {
  if (!activeSeason) {
    message.warning('No active season found');
    return;
  }
  
  console.log('🔍 Loading receipts for season:', activeSeason.season_id);
  const result = await window.electronAPI.purchases?.getUnsold(activeSeason.season_id);
  // ✅ Pass active season ID
  setAvailableReceipts(result.data);
  console.log('✅ Loaded receipts:', result.data?.length || 0);
};
```

---

## SQL Query Logic

### **Complete Query with Season Filter:**

```sql
SELECT 
  pt.transaction_id,
  pt.receipt_number,
  pt.transaction_date,
  pt.net_weight_kg,
  pt.grade_id,
  f.farmer_code,
  f.full_name as farmer_name,
  pg.grade_name,
  hs.season_name,
  COALESCE(SUM(spm.quantity_kg), 0) as sold_quantity_kg,
  pt.net_weight_kg - COALESCE(SUM(spm.quantity_kg), 0) as available_quantity_kg
FROM purchase_transactions pt
JOIN farmers f ON pt.farmer_id = f.farmer_id
JOIN paddy_grades pg ON pt.grade_id = pg.grade_id
JOIN harvesting_seasons hs ON pt.season_id = hs.season_id
LEFT JOIN sales_purchase_mapping spm ON pt.transaction_id = spm.transaction_id
WHERE pt.status = 'completed'
  AND pt.season_id = ? -- ✅ Filter by active season
GROUP BY 
  pt.transaction_id,
  pt.receipt_number,
  pt.transaction_date,
  pt.net_weight_kg,
  pt.grade_id,
  f.farmer_code,
  f.full_name,
  pg.grade_name,
  hs.season_name
HAVING available_quantity_kg > 0
ORDER BY pt.transaction_date DESC
```

---

## User Experience

### **Scenario 1: Single Season Operation**

**Active Season: Season 10/2025**

**Step-by-step:**
```
1. Open Sales page
2. Create new sale (F3)
3. Enter container and tare weight
4. Recall container (F2)
5. Enter gross weight
6. Click "Select Receipts"
   
✅ Modal shows ONLY receipts from Season 10
❌ Receipts from Season 1, 8, 9 are hidden
```

### **Scenario 2: Switch Seasons**

**Season 10 Active:**
```
1. Click "Select Receipts"
2. Shows 5 receipts from Season 10
```

**Switch to Season 1:**
```
3. Go to Settings → Season Config
4. Activate Season 1
5. Go back to Sales
6. Click "Select Receipts"
7. Shows different receipts from Season 1
```

### **Scenario 3: No Active Season**

```
1. No active season (or all deactivated)
2. Try to load receipts
3. Warning: "No active season found"
4. Cannot proceed until season is activated
```

---

## Benefits

### **1. Data Integrity**
- Receipts from correct season only
- No mixing of inventory across seasons
- Each season's inventory is isolated

### **2. Clear Workflow**
- Users see only current season's available inventory
- No confusion from old season receipts
- Accurate inventory tracking per season

### **3. Business Logic**
- Can only sell what you bought in current season
- Season-specific profit/loss tracking
- Clean season closure (all inventory must be sold or transferred)

### **4. Traceability**
- Sales are linked to purchases from same season
- Full traceability: Season → Farmer → Purchase → Sale → Manufacturer
- Audit trail per season

---

## Console Logging

**When loading receipts, you'll see:**

```
Console logs:
🔍 Loading receipts for season: 10
📊 Purchase getUnsold - Season ID: 10
📊 Purchase getUnsold - Found receipts: 5
✅ Loaded receipts: 5
```

**This helps debug:**
- Which season is being queried
- How many receipts found
- Confirms filtering is working

---

## Testing

### **Test 1: Basic Season Filter**

**Steps:**
1. **Create purchases in Season 10:**
   - Purchase 1: 2,000 kg
   - Purchase 2: 3,000 kg
   - Purchase 3: 1,500 kg

2. **Go to Sales**
3. **Start new sale process**
4. **Click "Select Receipts"**
5. **Verify: Shows 3 receipts from Season 10**

### **Test 2: No Receipts from Other Seasons**

**Setup:**
```sql
-- Manually check database
SELECT 
  pt.transaction_id,
  pt.receipt_number,
  pt.season_id,
  hs.season_name
FROM purchase_transactions pt
JOIN harvesting_seasons hs ON pt.season_id = hs.season_id
WHERE pt.status = 'completed';

-- Should show receipts from multiple seasons
```

**Test:**
1. **Active Season: 10**
2. **Click "Select Receipts"**
3. **Should only show season_id = 10**
4. **Receipts with season_id = 1, 8, 9 should NOT appear**

### **Test 3: Switch Seasons**

**Steps:**
1. **Season 10 active**
2. **Note receipts available:** e.g., 5 receipts
3. **Switch to Season 1**
4. **Click "Select Receipts"**
5. **Different receipts appear:** e.g., 12 receipts from Season 1
6. **Switch back to Season 10**
7. **Original 5 receipts reappear**

### **Test 4: After Selling**

**Steps:**
1. **Season 10 has 3 receipts**
2. **Complete a sale using Receipt #1**
3. **Click "Select Receipts" again**
4. **Should show 2 receipts** (Receipt #1 is now sold)
5. **Receipts still filtered by Season 10**

---

## Important Notes

### **Unsold Calculation**

The query calculates available quantity:
```javascript
available_quantity_kg = net_weight_kg - sold_quantity_kg
```

**Only receipts with available_quantity_kg > 0 are shown.**

This means:
- Fully sold receipts: Hidden
- Partially sold receipts: Show remaining weight
- Unsold receipts: Show full weight

### **Season Name Display**

Receipts show season name:
```javascript
hs.season_name  // e.g., "Season 10/2025"
```

But filtering is by season_id:
```sql
WHERE pt.season_id = ?
```

This ensures correct filtering even if season names are similar.

### **Backward Compatibility**

The `seasonId` parameter is optional:
```javascript
async function getUnsold(seasonId = null) {
  if (seasonId) {
    sql += ` AND pt.season_id = ?`;
  }
}
```

**If no seasonId provided:** Shows all receipts (all seasons)
**If seasonId provided:** Shows only that season's receipts

---

## Related Features

### **Purchase History Filtering**
Already implemented in `/app/src/components/Purchases/PurchaseHistory.jsx`:
- Shows only purchases from active season
- Uses same pattern: `getAll({ season_id })`

### **Sales History Filtering**
Already implemented in `/app/src/components/Sales/SalesHistory.jsx`:
- Shows only sales from active season
- Uses same pattern: `getAll({ season_id })`

### **Navbar Statistics**
Already implemented in `/app/src/components/Layout/AppLayout.jsx`:
- Shows stats for active season only
- Uses: `getTotalStats(seasonId)`

---

## Summary

### **Problem:**
- Receipts from ALL seasons shown in sales modal
- Mixed inventory across seasons
- Confusion and potential errors

### **Solution:**
- Filter `getUnsold` query by active season_id
- Update entire chain: Backend → IPC → Preload → Frontend
- Add validation and logging

### **Result:**
- ✅ Only receipts from active season shown
- ✅ Clean season isolation
- ✅ Accurate inventory per season
- ✅ Proper traceability
- ✅ Professional multi-season operation

---

**Status:** ✅ Fixed  
**Version:** 1.0  
**Date:** November 15, 2025

**Purchase receipts are now properly filtered by active season!** 🌾📦✅
