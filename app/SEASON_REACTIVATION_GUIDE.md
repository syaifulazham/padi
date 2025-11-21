# Season Reactivation Guide

## Overview
Complete guide on how to **reactivate closed seasons** and **switch between demo and live operations**. This is essential for testing workflows, training, or reverting to previous seasons.

---

## 🎯 Common Use Cases

### **1. Switch from Demo to Live**
You've been testing in a demo season and now want to go live:
```
Current: Season DEMO (Active, Mode: DEMO)
Action:  Activate Season LIVE
Result:  All operations now use live configuration
```

### **2. Switch from Live to Demo**
You want to train staff without affecting production data:
```
Current: Season LIVE (Active, Mode: LIVE)
Action:  Activate Season DEMO
Result:  Safe training environment
```

### **3. Reactivate Previous Season**
You closed a season but need to add missed transactions:
```
Current: Season 2/2024 (Active)
Action:  Reactivate Season 1/2024 (Closed)
Result:  Can add transactions to Season 1/2024 again
```

### **4. Fix Mistakes**
You accidentally activated the wrong season:
```
Current: Season 2/2024 (Active) - Wrong!
Action:  Reactivate Season 1/2024 (Closed)
Result:  Back to correct season
```

---

## 📋 How to Reactivate a Season

### **Step-by-Step Instructions:**

1. **Navigate to Season Config**
   - Go to: **Settings** → **Season Configuration**

2. **Find the Season**
   - Locate the season you want to reactivate
   - Can be **PLANNED** or **CLOSED** status
   - Look for the green ✓ button

3. **Click Reactivate Button**
   - Click the green checkmark (✓) in Actions column
   - Button tooltip shows:
     - "Activate Season" (for PLANNED)
     - "Reactivate Season" (for CLOSED)

4. **Read Confirmation Dialog**
   - **For CLOSED seasons:**
     ```
     ╔═══════════════════════════════════════╗
     ║  ✓ Reactivate Season?                 ║
     ╠═══════════════════════════════════════╣
     ║  Are you sure you want to             ║
     ║  reactivate Season 1/2024?            ║
     ║                                       ║
     ║  ℹ️ Reactivating Closed Season        ║
     ║  This will reopen a previously        ║
     ║  closed season. All previous          ║
     ║  transactions will remain intact.     ║
     ║                                       ║
     ║  ⚠️ Important                         ║
     ║  Activating this season will          ║
     ║  automatically close any other        ║
     ║  active season.                       ║
     ║                                       ║
     ║      [Cancel]  [Reactivate]           ║
     ╚═══════════════════════════════════════╝
     ```

5. **Confirm Reactivation**
   - Click **"Reactivate"** button (green)
   - Or click **"Cancel"** to abort

6. **Verify Success**
   - ✅ Success message: "Season 1/2024 is now active!"
   - ✅ Green background appears on reactivated season
   - ✅ Previous active season becomes CLOSED
   - ✅ Navbar updates: 🌾 Season 1/2024
   - ✅ Statistics refresh to reactivated season data

---

## 🔄 Switching Between Demo and Live

### **Scenario: Testing Then Going Live**

#### **Initial Setup:**
```
Season DEMO/2024:
  - Status: ACTIVE (green background)
  - Mode: DEMO
  - Opening Price: RM 1,500/ton
  - Purpose: Testing and training

Season LIVE/2024:
  - Status: PLANNED
  - Mode: LIVE (Production)
  - Opening Price: RM 1,800/ton
  - Purpose: Actual operations
```

#### **Step 1: Test in Demo**
1. Demo season is active (green)
2. Create test purchases
3. Test sales transactions
4. Train staff
5. Verify workflows

**Statistics show:**
```
🌾 Season DEMO/2024
📦 Total Purchases: 10,000 kg (test data)
📊 In Inventory: 8,000 kg
🚚 Sold: 2,000 kg
```

#### **Step 2: Switch to Live**
1. Go to Season Config
2. Find "Season LIVE/2024"
3. Click green ✓ button
4. Confirm activation

**Result:**
```
Season DEMO/2024:
  - Status: CLOSED ← Auto-closed
  - Mode: DEMO
  - All test data preserved

Season LIVE/2024:
  - Status: ACTIVE (green background) ← Now active
  - Mode: LIVE
  - Statistics start at 0
```

**Navbar now shows:**
```
🌾 Season LIVE/2024
📦 Total Purchases: 0 kg (fresh start)
📊 In Inventory: 0 kg
🚚 Sold: 0 kg
```

#### **Step 3: Operate in Live Mode**
- All new transactions use LIVE configuration
- Live pricing applies (RM 1,800/ton)
- Production data separate from demo data

#### **Step 4: Switch Back to Demo (if needed)**
1. Go to Season Config
2. Find "Season DEMO/2024" (now CLOSED)
3. Click green ✓ button (shows "Reactivate Season")
4. Confirm reactivation

**Result:**
```
Season DEMO/2024:
  - Status: ACTIVE (green) ← Reactivated
  - Previous test data still there!
  - Statistics: 10,000 kg purchases

Season LIVE/2024:
  - Status: CLOSED ← Auto-closed
  - Production data preserved
```

---

## 💡 Best Practices

### **DO's:**

✅ **Use Clear Naming**
```
Good names:
- "DEMO 2024 - Training"
- "LIVE Season 1/2024"
- "TEST - Price Testing"
```

✅ **Set Correct Mode**
```
Demo seasons:  Mode = DEMO
Live seasons:  Mode = LIVE
```

✅ **Document Purpose**
```
Add notes:
"Demo season for staff training on new system"
"Live production season for Q1 2024"
```

✅ **Verify Before Switching**
```
Check before activating:
- Is this the right season?
- Are all pending transactions complete?
- Is the team aware?
```

✅ **Keep Demo Data Separate**
```
Create separate demo seasons:
- Don't mix with production data
- Use obviously test names
- Lower prices for demo
```

### **DON'Ts:**

❌ **Don't Switch Mid-Operation**
```
Bad:
Switching while transactions are in progress
```

❌ **Don't Use Same Pricing**
```
Bad:
Demo: RM 1,800/ton
Live: RM 1,800/ton  ← Can't tell them apart!

Good:
Demo: RM 1,500/ton  ← Obviously different
Live: RM 1,800/ton
```

❌ **Don't Delete Demo Seasons**
```
Keep for reference and future training
```

❌ **Don't Forget to Notify Team**
```
Always inform team before switching
```

---

## 🎨 Visual Guide

### **Season Table with Reactivation:**

```
┌────────────────────────────────────────────────────────────────┐
│ Code         Season Name       Status    Mode   Actions        │
├────────────────────────────────────────────────────────────────┤
│ DEMO-2024    Demo Season       🔴 CLOSED  DEMO   👁 ✓          │ ← Can reactivate
├────────────────────────────────────────────────────────────────┤
│ LIVE-1-2024  Live Season 1/24  🟢 ACTIVE  LIVE   👁 ✏️         │ ← Currently active (green)
├────────────────────────────────────────────────────────────────┤
│ LIVE-2-2024  Live Season 2/24  📋 PLANNED LIVE   👁 ✏️ ✓      │ ← Can activate
└────────────────────────────────────────────────────────────────┘

Legend:
👁 = View    ✏️ = Edit    ✓ = Activate/Reactivate
```

### **Button Visibility:**

| Status | View | Edit | Activate/Reactivate |
|--------|------|------|---------------------|
| **PLANNED** | ✅ | ✅ | ✅ Activate |
| **ACTIVE** | ✅ | ✅ | ❌ |
| **CLOSED** | ✅ | ❌ | ✅ Reactivate |
| **CANCELLED** | ✅ | ❌ | ❌ |

---

## 🔧 Technical Details

### **What Happens During Reactivation:**

1. **Backend Process:**
   ```javascript
   // Close current active season
   UPDATE harvesting_seasons 
   SET status = 'closed' 
   WHERE status = 'active' AND season_id != [reactivating_season_id]
   
   // Reactivate selected season
   UPDATE harvesting_seasons 
   SET status = 'active' 
   WHERE season_id = [reactivating_season_id]
   ```

2. **Frontend Updates:**
   - Table refreshes
   - Green background moves to reactivated season
   - Navbar updates
   - Statistics recalculate

3. **Data Preservation:**
   - All previous transactions remain
   - Historical data intact
   - Nothing is deleted

### **Season Statuses:**

```
PLANNED → ACTIVE → CLOSED → ACTIVE (reactivation) → CLOSED
   ↓                  ↑                                 ↑
   └──────────────────┘                                 │
                                                        │
   CANCELLED (permanent, cannot reactivate) ←───────────┘
```

---

## 📊 Example Workflows

### **Workflow 1: Annual Season Cycle**

```
January:
  - Create "Season 1/2024" as PLANNED
  - Configure pricing: RM 1,800/ton
  - Set mode: LIVE

February 1:
  - Activate "Season 1/2024"
  - Begin operations
  - Collect purchases

June 30:
  - Complete final transactions
  - Season auto-closes (or manually close)
  - "Season 1/2024" → CLOSED

July 1:
  - Activate "Season 2/2024"
  - New pricing: RM 1,850/ton
  - Fresh statistics

Mid-July:
  - Discover missed transaction in Season 1
  - Reactivate "Season 1/2024"
  - Add missed transaction
  - Re-close "Season 1/2024"
  - Reactivate "Season 2/2024"
```

### **Workflow 2: Demo Environment**

```
Setup:
  - Create "DEMO Training" (Mode: DEMO)
  - Create "LIVE Operations" (Mode: LIVE)

Daily Operations:
  - "LIVE Operations" active
  - Staff use for real transactions

Training Sessions:
  - Reactivate "DEMO Training"
  - Train new staff
  - Practice workflows
  - After training: Reactivate "LIVE Operations"

Repeat as needed!
```

---

## ⚙️ Configuration Tips

### **Demo Season Setup:**

```yaml
Season Code: DEMO-2024
Season Name: Demo Training Season 2024
Year: 2024
Season Number: 0
Opening Price: RM 1,500/ton  ← Lower than live
Mode: DEMO ← Important!
Status: PLANNED (activate when needed)
Notes: "For staff training and system testing only"
```

### **Live Season Setup:**

```yaml
Season Code: LIVE-1-2024
Season Name: Live Season 1/2024
Year: 2024
Season Number: 1
Opening Price: RM 1,800/ton  ← Actual market price
Mode: LIVE ← Production!
Status: ACTIVE
Notes: "Q1-Q2 2024 production season"
```

---

## 🧪 Testing Reactivation

### **Test Checklist:**

1. ✅ **Activate a demo season**
   - Click ✓ on PLANNED demo season
   - Confirm activation
   - Verify green background

2. ✅ **Create test transactions**
   - Add 2-3 purchases
   - Note the statistics

3. ✅ **Switch to live season**
   - Click ✓ on PLANNED live season
   - Confirm activation
   - Verify demo season → CLOSED

4. ✅ **Verify statistics reset**
   - Live season starts at 0 kg
   - Navbar shows live season

5. ✅ **Reactivate demo season**
   - Click ✓ on CLOSED demo season
   - Confirm reactivation
   - Verify demo data still there!

6. ✅ **Switch back to live**
   - Reactivate live season
   - Verify production can continue

---

## 🎯 Quick Reference

### **To Activate a PLANNED Season:**
1. Find season with status "PLANNED"
2. Click green ✓ button
3. Read confirmation
4. Click "Activate"

### **To Reactivate a CLOSED Season:**
1. Find season with status "CLOSED"
2. Click green ✓ button (says "Reactivate")
3. Read confirmation (includes info about reopening)
4. Click "Reactivate"

### **To Switch Between Seasons:**
Simply activate/reactivate the season you want to use. The system automatically:
- Closes the currently active season
- Activates the selected season
- Updates all displays
- Switches configuration

---

## 📁 Files Modified

1. ✅ `/app/src/components/Settings/SeasonConfig.jsx`
   - Removed `record.status !== 'closed'` from activate button condition
   - Added dynamic tooltip (Activate vs Reactivate)
   - Updated confirmation dialog with reactivation message
   - Added info alert for closed season reactivation

2. ✅ `/app/SEASON_REACTIVATION_GUIDE.md` (This file)

---

## ✨ Summary

**Key Features:**
- ✅ **Reactivate CLOSED seasons** - Switch back to previous seasons
- ✅ **Smart tooltips** - Shows "Activate" or "Reactivate"
- ✅ **Clear confirmation** - Different messages for reactivation
- ✅ **Data preservation** - All transactions remain intact
- ✅ **Easy switching** - Demo ↔ Live in seconds

**Common Uses:**
- Switch between demo and live operations
- Reactivate old seasons to add missed transactions
- Toggle between different pricing configurations
- Test scenarios without affecting production

**Important Notes:**
- Only ONE season can be active at a time
- Reactivating a season closes the current active season
- Previous transactions are always preserved
- Cannot reactivate CANCELLED seasons

---

**Status:** ✅ Fully Implemented  
**Version:** 1.0  
**Date:** November 15, 2025

**You can now easily reactivate any closed season to switch between demo and live operations!** 🔄✅
