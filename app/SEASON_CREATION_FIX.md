# Season Creation Error Fix

## Error
```
"Bind parameters must not contain undefined. To pass SQL NULL specify JS null"
```

## Root Cause
When creating a new season, some form fields might be empty or undefined. MySQL node driver requires explicit `null` values instead of `undefined` for SQL NULL values.

## Solution

### **1. Added Helper Function**
```javascript
/**
 * Helper function to convert undefined values to null for SQL
 */
function sanitizeForSQL(value) {
  return value === undefined ? null : value;
}
```

### **2. Updated Create Function**
Applied `sanitizeForSQL()` to all parameters:

```javascript
const [result] = await db.query(`
  INSERT INTO harvesting_seasons (
    season_code, season_name, year, season_number,
    opening_price_per_ton, deduction_config, mode,
    season_type_id, start_date, end_date,
    status, target_quantity_kg, notes,
    created_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`, [
  sanitizeForSQL(seasonData.season_code),
  sanitizeForSQL(seasonData.season_name),
  sanitizeForSQL(seasonData.year),
  sanitizeForSQL(seasonData.season_number),
  sanitizeForSQL(seasonData.opening_price_per_ton),  // ← Fixed
  deductionConfig,
  seasonData.mode || 'LIVE',
  sanitizeForSQL(seasonData.season_type_id),
  sanitizeForSQL(seasonData.start_date),
  sanitizeForSQL(seasonData.end_date),
  seasonData.status || 'planned',
  sanitizeForSQL(seasonData.target_quantity_kg),
  sanitizeForSQL(seasonData.notes),
  seasonData.created_by || 1
]);
```

### **3. Updated Update Function**
Applied same fix to update function to prevent similar errors.

### **4. Added Debug Logging**
```javascript
console.log('Creating season with data:', seasonData);
```

## Technical Details

### **Why This Happens**
- JavaScript allows `undefined` values
- MySQL expects explicit `null` for SQL NULL
- Using `||` operator doesn't catch `undefined` properly when the value is `0` or empty string

### **Why sanitizeForSQL() Works**
```javascript
// Problem with || operator:
undefined || null          // Returns null ✅
0 || null                  // Returns null (wrong!) ❌
'' || null                 // Returns null (wrong!) ❌

// sanitizeForSQL solution:
sanitizeForSQL(undefined)  // Returns null ✅
sanitizeForSQL(0)          // Returns 0 ✅
sanitizeForSQL('')         // Returns '' ✅
sanitizeForSQL(null)       // Returns null ✅
```

## Files Modified
- `/app/electron/database/queries/seasons.js`
  - Added `sanitizeForSQL()` helper
  - Updated `create()` function
  - Updated `update()` function
  - Added debug logging

## Testing

### **Test Case 1: Create Season with All Fields**
```javascript
{
  season_code: '2024-S1',
  season_name: 'Musim 1/2024',
  year: 2024,
  season_number: 1,
  opening_price_per_ton: 1800.00,
  // ... all fields filled
}
```
✅ Should work

### **Test Case 2: Create Season with Some Empty Fields**
```javascript
{
  season_code: '2024-S1',
  season_name: 'Musim 1/2024',
  year: 2024,
  season_number: 1,
  opening_price_per_ton: 1800.00,
  target_quantity_kg: undefined,  // ← Empty field
  notes: undefined                 // ← Empty field
}
```
✅ Now works (converts undefined to null)

### **Test Case 3: Create Season with Zero Values**
```javascript
{
  // ...
  season_number: 0,  // ← Zero value (valid)
  // ...
}
```
✅ Works correctly (0 stays as 0, not converted to null)

## Prevention

### **Frontend Validation**
While the backend now handles undefined values, frontend should still validate required fields:

```javascript
// In SeasonConfig.jsx
<Form.Item
  name="opening_price_per_ton"
  label="Opening Price (RM/Metric Ton)"
  rules={[{ required: true, message: 'Please enter opening price' }]}
>
  <InputNumber ... />
</Form.Item>
```

### **Backend Validation**
Backend should also validate required fields:

```javascript
if (!seasonData.opening_price_per_ton) {
  return { 
    success: false, 
    error: 'Opening price is required' 
  };
}
```

## Additional Improvements

### **Type Checking**
Could add TypeScript or JSDoc for better type safety:

```javascript
/**
 * Create new season
 * @param {Object} seasonData - Season data object
 * @param {string} seasonData.season_code - Season code (required)
 * @param {string} seasonData.season_name - Season name (required)
 * @param {number} seasonData.year - Season year (required)
 * @param {number} seasonData.opening_price_per_ton - Price per ton (required)
 * @returns {Promise<Object>} Result object with success status
 */
async function create(seasonData) {
  // ...
}
```

## Summary

**Problem:** `undefined` values passed to SQL cause error  
**Solution:** Convert all `undefined` to `null` using helper function  
**Result:** ✅ Season creation now works with empty optional fields

---

**Status:** ✅ Fixed  
**Files Modified:** 1  
**Functions Updated:** 2 (create, update)  

**The error "Bind parameters must not contain undefined" is now resolved!** ✅
