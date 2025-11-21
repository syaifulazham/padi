# Season-Scoped Statistics

## Overview
Updated navbar statistics to display totals specific to the **active season only**, instead of all-time cumulative totals. This ensures operators always see relevant data for the current operational season.

---

## 🎯 What Changed

### **Before:**
- 📦 **Total Purchases:** All-time cumulative (e.g., 500,000 kg across all seasons)
- 📊 **In Inventory:** All-time cumulative
- 🚚 **Sold to Manufacturers:** All-time cumulative

### **After:**
- 📦 **Total Purchases:** Active season only (e.g., 50,000 kg for Season 1/2024)
- 📊 **In Inventory:** Active season only
- 🚚 **Sold to Manufacturers:** Active season only

---

## 💡 Why This Matters

### **1. Operational Relevance**
- See current season performance at a glance
- No confusion with historical data
- Focus on what matters now

### **2. Season Comparison**
- Compare season-to-season performance
- Identify trends and patterns
- Better decision making

### **3. Data Accuracy**
- Inventory reflects current season stock
- Purchases show current season receipts
- Sales show current season deliveries

---

## 🔧 Technical Implementation

### **Backend Changes**

#### **File: `/app/electron/database/queries/purchases.js`**

**Modified Function:**
```javascript
/**
 * Get total purchase statistics
 * @param {number} seasonId - Optional season ID to filter by active season
 */
async function getTotalStats(seasonId = null) {
  try {
    let sql = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(net_weight_kg), 0) as total_net_weight_kg,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM purchase_transactions
      WHERE status = 'completed'
    `;
    
    const params = [];
    
    // Filter by season if provided
    if (seasonId) {
      sql += ' AND season_id = ?';
      params.push(seasonId);
    }
    
    const rows = await db.query(sql, params);
    return { success: true, data: rows[0] };
  } catch (error) {
    console.error('Error fetching purchase total stats:', error);
    return { success: false, error: error.message };
  }
}
```

#### **File: `/app/electron/database/queries/sales.js`**

**Modified Function:**
```javascript
/**
 * Get total sales statistics
 * @param {number} seasonId - Optional season ID to filter by active season
 */
async function getTotalStats(seasonId = null) {
  try {
    let sql = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(net_weight_kg), 0) as total_net_weight_kg,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM sales_transactions
      WHERE status = 'completed'
    `;
    
    const params = [];
    
    // Filter by season if provided
    if (seasonId) {
      sql += ' AND season_id = ?';
      params.push(seasonId);
    }
    
    const rows = await db.query(sql, params);
    return { success: true, data: rows[0] };
  } catch (error) {
    console.error('Error fetching sales total stats:', error);
    return { success: false, error: error.message };
  }
}
```

#### **File: `/app/electron/main.js`**

**Updated IPC Handlers:**
```javascript
// Purchases - now accepts seasonId
ipcMain.handle('purchases:getTotalStats', async (event, seasonId) => {
  return await purchaseService.getTotalStats(seasonId);
});

// Sales - now accepts seasonId
ipcMain.handle('sales:getTotalStats', async (event, seasonId) => {
  return await salesService.getTotalStats(seasonId);
});
```

#### **File: `/app/electron/preload.js`**

**Updated API Methods:**
```javascript
purchases: {
  getTotalStats: (seasonId) => ipcRenderer.invoke('purchases:getTotalStats', seasonId)
},

sales: {
  getTotalStats: (seasonId) => ipcRenderer.invoke('sales:getTotalStats', seasonId)
}
```

### **Frontend Changes**

#### **File: `/app/src/components/Layout/AppLayout.jsx`**

**Updated Stats Fetching:**
```javascript
// Fetch statistics on mount and periodically
useEffect(() => {
  const fetchStats = async () => {
    try {
      // Get season ID if active season exists
      const seasonId = activeSeason?.season_id || null;
      
      const [purchaseResult, salesResult] = await Promise.all([
        window.electronAPI.purchases?.getTotalStats(seasonId),
        window.electronAPI.sales?.getTotalStats(seasonId)
      ]);

      const purchaseWeight = purchaseResult?.success ? parseFloat(purchaseResult.data.total_net_weight_kg) : 0;
      const salesWeight = salesResult?.success ? parseFloat(salesResult.data.total_net_weight_kg) : 0;
      const inventoryWeight = purchaseWeight - salesWeight;

      setStats({
        totalPurchases: purchaseWeight,
        totalSales: salesWeight,
        inventory: inventoryWeight,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  fetchStats();
  
  // Refresh stats every 30 seconds
  const interval = setInterval(fetchStats, 30000);
  
  return () => clearInterval(interval);
}, [activeSeason]); // ← Re-fetch when active season changes
```

---

## 📊 Real-World Example

### **Scenario:**

**Database:**
```
Season 1/2023 (Closed):
  - Purchases: 200,000 kg
  - Sales: 180,000 kg

Season 2/2023 (Closed):
  - Purchases: 150,000 kg
  - Sales: 145,000 kg

Season 1/2024 (Active):
  - Purchases: 75,000 kg
  - Sales: 60,000 kg
```

### **Old Behavior (All-Time):**
```
┌────────────────────────────────────────┐
│ 📦 Total Purchases: 425,000 kg        │
│ 📊 In Inventory: 40,000 kg            │
│ 🚚 Sold: 385,000 kg                   │
└────────────────────────────────────────┘
```

### **New Behavior (Active Season Only):**
```
┌────────────────────────────────────────┐
│ 🌾 Season 1/2024                      │
│ 📦 Total Purchases: 75,000 kg         │
│ 📊 In Inventory: 15,000 kg            │
│ 🚚 Sold: 60,000 kg                    │
└────────────────────────────────────────┘
```

---

## 🎯 Key Benefits

### **1. Contextual Data**
- Statistics match the displayed season
- No confusion about which data you're seeing
- Clear operational context

### **2. Real-Time Relevance**
- Current season performance visible
- Easy to track progress against targets
- Immediate feedback on operations

### **3. Clean Slate**
- Each new season starts with 0
- Clear separation between seasons
- Better season-to-season analysis

### **4. Automatic Updates**
- Stats refresh when season changes
- Auto-refresh every 30 seconds
- Always current data

---

## 🔄 Behavior Details

### **With Active Season:**
```javascript
const seasonId = activeSeason?.season_id; // e.g., 5
// SQL: WHERE status = 'completed' AND season_id = 5
```
- ✅ Shows data for Season 1/2024 only
- ✅ Purchases filtered by season_id
- ✅ Sales filtered by season_id
- ✅ Inventory calculated for season only

### **Without Active Season:**
```javascript
const seasonId = null;
// SQL: WHERE status = 'completed'
```
- ✅ Shows all-time cumulative totals
- ✅ Useful if no season is active
- ✅ Fallback behavior maintained

---

## 📋 Usage Examples

### **Example 1: Start of New Season**

**Action:**
1. Create Season 2/2024
2. Set status to "Active"

**Result:**
```
Navbar updates:
🌾 Season 2/2024
📦 Total Purchases: 0 kg        ← Starts at 0
📊 In Inventory: 0 kg           ← Starts at 0
🚚 Sold: 0 kg                   ← Starts at 0
```

### **Example 2: Mid-Season**

**After 100 transactions:**
```
Navbar shows:
🌾 Season 2/2024
📦 Total Purchases: 125,000 kg  ← Current season only
📊 In Inventory: 45,000 kg      ← Current season only
🚚 Sold: 80,000 kg              ← Current season only
```

### **Example 3: Switch to Previous Season**

**Action:**
1. Edit Season 1/2024
2. Change status to "Active"

**Result:**
```
Navbar updates immediately:
🌾 Season 1/2024
📦 Total Purchases: 75,000 kg   ← Season 1 data
📊 In Inventory: 15,000 kg      ← Season 1 data
🚚 Sold: 60,000 kg              ← Season 1 data
```

---

## 🧪 Testing

### **Test 1: Active Season Display**
1. Ensure Season 1/2024 is active
2. Look at navbar statistics
3. ✅ Verify: Shows only Season 1/2024 data
4. ✅ Verify: Season tag shows "Season 1/2024"

### **Test 2: Season Change**
1. Edit Season 2/2024, set to "Active"
2. Watch navbar
3. ✅ Verify: Season tag changes to "Season 2/2024"
4. ✅ Verify: Statistics update to Season 2/2024 data
5. ✅ Verify: Update happens within 1 second

### **Test 3: No Active Season**
1. Close all active seasons
2. Look at navbar
3. ✅ Verify: No season tag displayed
4. ✅ Verify: Statistics show all-time totals (fallback)

### **Test 4: Auto-Refresh**
1. Note current statistics
2. Create a new purchase transaction
3. Wait up to 30 seconds
4. ✅ Verify: Statistics update automatically

### **Test 5: Data Accuracy**
1. Query database for active season purchases
2. Compare with navbar display
3. ✅ Verify: Numbers match exactly
4. ✅ Verify: Inventory calculation correct (purchases - sales)

---

## 💼 Business Impact

### **Operators:**
- Clear view of current season performance
- No confusion with historical data
- Better operational decisions

### **Management:**
- Easy season comparison
- Track progress against targets
- Identify trends quickly

### **Reporting:**
- Clean season boundaries
- Accurate season-specific reports
- Better analytics

---

## 🔮 Future Enhancements

### **Potential Improvements:**

1. **Season Comparison View**
   - Side-by-side season statistics
   - Percentage changes
   - Trend indicators

2. **Target Progress**
   - Show % of season target achieved
   - Visual progress bars
   - Alert if behind target

3. **Historical Chart**
   - Season-over-season line chart
   - Quick visual comparison
   - Trend analysis

4. **Export Season Data**
   - Download season statistics
   - PDF reports
   - Excel format

5. **Real-Time Alerts**
   - Notify when milestones reached
   - Alert on unusual patterns
   - Performance notifications

---

## 📁 Files Modified

1. ✅ `/app/electron/database/queries/purchases.js` - Added seasonId parameter
2. ✅ `/app/electron/database/queries/sales.js` - Added seasonId parameter
3. ✅ `/app/electron/main.js` - Updated IPC handlers
4. ✅ `/app/electron/preload.js` - Updated API methods
5. ✅ `/app/src/components/Layout/AppLayout.jsx` - Pass active season ID
6. ✅ `/app/SEASON_SCOPED_STATISTICS.md` (This file)

---

## ⚙️ Configuration

### **Backward Compatibility:**
- ✅ If no seasonId provided → Shows all-time totals
- ✅ If no active season → Shows all-time totals
- ✅ Existing code continues to work

### **SQL Filtering:**
```sql
-- Without seasonId (fallback)
SELECT ... FROM purchase_transactions WHERE status = 'completed'

-- With seasonId (season-specific)
SELECT ... FROM purchase_transactions WHERE status = 'completed' AND season_id = ?
```

---

## ✨ Summary

**What Changed:**
- ✅ Navbar statistics now filtered by active season
- ✅ Shows current season data only
- ✅ Auto-updates when season changes
- ✅ Fallback to all-time if no active season

**Benefits:**
- Clear operational context
- Relevant real-time data
- Better season management
- Professional UX

**Technical:**
- Backend: Optional seasonId parameter
- Frontend: Pass active season ID
- Auto-refresh: Every 30 seconds
- Dependency: Updates on season change

---

**Status:** ✅ Fully Implemented  
**Version:** 1.0  
**Date:** November 15, 2025

**Navbar statistics now reflect the active season's operations!** 📊✅
