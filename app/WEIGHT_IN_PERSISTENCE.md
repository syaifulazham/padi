# Weight-In Records Persistence

## Overview
Lorry weigh-in records are now **automatically saved to localStorage** and will persist across page refreshes, browser restarts, and application crashes.

## Features Implemented

### 1. **Automatic Data Saving**
- Every time a lorry is weighed-in, the record is instantly saved to browser localStorage
- Data is saved under the key: `paddy_weight_in_sessions`
- Records include:
  - Lorry registration number
  - Weight with load (gross weight)
  - Timestamp of weigh-in

### 2. **Auto-Restore on Load**
- When the page/app loads, any pending sessions are automatically restored
- A notification shows how many lorries were restored
- Example: "📦 Restored 3 pending lorries from storage"

### 3. **Auto-Cleanup**
- When a purchase is completed (weigh-out done), the record is automatically removed from storage
- Prevents accumulation of stale data

### 4. **Visual Indicators**
- **Green "Auto-Save" badge** on the Pending Lorries counter
- **Status text**: "Records safe from page refresh"
- **Success messages** when saving/removing data

## How to Test

### Test 1: Basic Persistence
1. Start a new purchase and weigh-in a lorry (e.g., "ABC 1234" with 5000 kg)
2. You'll see: "✅ Weigh-in recorded for ABC 1234: 5000 kg 💾 Data saved - safe from page refresh"
3. **Refresh the page** (F5 or Cmd+R)
4. You should see: "📦 Restored 1 pending lorry from storage"
5. The lorry should still appear in the "Recall Lorry" list

### Test 2: Multiple Records
1. Weigh-in 3 different lorries (e.g., ABC 1234, XYZ 5678, DEF 9012)
2. Check the "Pending Lorries" counter shows: 3
3. **Close the entire app and restart it**
4. All 3 lorries should be restored
5. The notification should say: "📦 Restored 3 pending lorries from storage"

### Test 3: Complete Purchase (Auto-Cleanup)
1. Weigh-in a lorry
2. Recall the lorry (F2 or click "Recall Lorry")
3. Complete the weigh-out and purchase
4. You'll see: "✅ Purchase completed! 🗑️ Weight-in record removed from storage"
5. The record is now removed from localStorage
6. **Refresh the page** - the lorry should NOT be restored

### Test 4: Browser DevTools Check
1. Open browser DevTools (F12)
2. Go to: Application > Local Storage > `http://localhost:5173`
3. Look for key: `paddy_weight_in_sessions`
4. You'll see the JSON array of pending sessions
5. Example data:
```json
[
  {
    "lorry_reg_no": "ABC 1234",
    "weight_with_load": 5000,
    "timestamp": "2025-11-12T17:56:00.000Z"
  }
]
```

## Console Logs

The system logs all storage operations to the console:

- ✅ `Loaded X pending sessions from storage` - On app load
- 💾 `Saved X pending sessions to storage` - After each change
- Error messages if storage fails

## Data Structure

```javascript
{
  "lorry_reg_no": "ABC 1234",     // Lorry registration
  "weight_with_load": 5000,       // Gross weight in kg
  "timestamp": "2025-11-12T17:56:00.000Z"  // ISO timestamp
}
```

## Storage Key

`paddy_weight_in_sessions` - localStorage key for pending weight-in records

## Technical Details

### Implementation
- **Storage Type**: Browser localStorage (synchronous, persistent)
- **Update Trigger**: React useEffect hook monitors `pendingSessions` state
- **Load Timing**: On component mount (before first render)
- **Error Handling**: Try-catch blocks with user notifications

### Code Location
File: `/app/src/components/Purchases/Purchases.jsx`

Key sections:
- Lines 6-22: Storage initialization and loading
- Lines 58-67: Auto-save effect
- Lines 38-56: Restore notification
- Lines 143-150: Save confirmation on weigh-in
- Lines 234-241: Cleanup confirmation on completion

## Benefits

1. **Data Safety**: No loss of critical weighing data due to:
   - Accidental page refresh
   - Browser crash
   - Power failure
   - Network interruption

2. **Operational Continuity**: Staff can:
   - Resume work after breaks
   - Handle interruptions gracefully
   - Avoid re-weighing lorries

3. **User Confidence**: 
   - Visual indicators show data is safe
   - Clear notifications on save/restore
   - No silent data loss

## Limitations

1. **Browser-Specific**: Data is stored per browser/profile
2. **Local Only**: Not synced across devices
3. **Storage Limit**: ~5-10MB localStorage limit (enough for thousands of records)
4. **Manual Clear**: If localStorage is cleared manually, data is lost

## Maintenance

### Clear All Pending Sessions (Manual)
If needed for testing/debugging:

```javascript
// In browser console:
localStorage.removeItem('paddy_weight_in_sessions');
```

### View Current Sessions
```javascript
// In browser console:
JSON.parse(localStorage.getItem('paddy_weight_in_sessions'));
```

## Future Enhancements (Optional)

1. **Database Backup**: Save pending sessions to database as well
2. **Export Function**: Export pending sessions to file
3. **Session Timeout**: Auto-expire sessions after X hours
4. **Audit Log**: Track all weigh-in/weigh-out operations
5. **Multi-Device Sync**: Sync pending sessions across devices

## Troubleshooting

### Issue: Data not persisting
**Solution**: Check if localStorage is enabled in browser settings

### Issue: "Failed to save weight-in records to storage"
**Cause**: localStorage quota exceeded or disabled
**Solution**: Clear old data or check browser settings

### Issue: Old sessions not clearing
**Cause**: Complete purchase flow not executed properly
**Solution**: Manually clear using browser DevTools

---

**Status**: ✅ Production Ready  
**Version**: 1.0  
**Last Updated**: November 13, 2025
