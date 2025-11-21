# Keyboard Shortcuts

## Overview
Consistent keyboard shortcuts across the application for improved productivity and user experience.

## Global Shortcuts

### F2 - Recall Container/Lorry
**Works in:**
- ✅ **Purchases Module** - Recall lorry for weigh-out
- ✅ **Sales Module** - Recall container for weigh-out

**Function:**
Opens the recall modal to select a pending container/lorry that has been weighed-in (tare weight recorded) and is ready for weigh-out (gross weight recording).

**Usage:**
1. After weighing-in a container (recording tare weight)
2. Container is loaded with paddy
3. Press **F2** to quickly open recall modal
4. Select the container to proceed with weigh-out (gross weight)

**Why F2:**
- Easy to reach on keyboard
- Consistent across both Purchases and Sales modules
- Muscle memory for operators
- Fast access without mouse interaction

---

### F3 - New Purchase/Sale
**Works in:**
- ✅ **Purchases Module** - Start new purchase (weigh-in)
- ✅ **Sales Module** - Start new sale (weigh-in tare)

**Function:**
Opens the modal to start a new transaction by entering container/lorry registration number.

**Usage:**
1. Press **F3** to start new transaction
2. Enter container/lorry registration number
3. Proceed with weigh-in process

**Why F3:**
- Next logical key after F2 (sequential function keys)
- Easy to remember: F3 = New, F2 = Recall
- Consistent across both modules
- Speeds up high-volume transaction periods

**Benefits:**
- No need to move mouse to "New" button
- Faster workflow initiation
- Reduced hand movement
- Better ergonomics during busy periods

---

## Module-Specific Shortcuts

### Purchases Module

#### F3 - New Purchase
- Opens "New Purchase - Enter Lorry" modal
- Quick start for new purchase transaction
- No need to click button

**Workflow:**
1. **Press F3** to start new purchase
2. Enter lorry number
3. Record gross weight (loaded lorry)
4. Lorry gets unloaded
5. **Press F2** to recall
6. Select lorry from list
7. Record tare weight (empty lorry)
8. Select farmer
9. Complete transaction

**Visual Indicators:**
- "New Purchase (Weigh-In)" button shows `F3` badge
- Button title: "Press F3 to start"
- Alert description: "Press F3 or click 'New Purchase'"

#### F2 - Recall Lorry
- Opens "Recall Lorry for Weigh-Out" modal
- Shows all pending lorries with tare weight recorded
- Quick selection to proceed with gross weight entry

**Workflow:**
1. After weigh-in (gross weight recorded)
2. Lorry gets unloaded
3. **Press F2** to recall
4. Select lorry from list
5. Record tare weight (empty lorry)
6. Select farmer
7. Complete transaction

**Visual Indicators:**
- "Recall Lorry" button shows `F2` badge
- Button title: "Press F2 to open"
- Modal title shows `F2` keyboard hint
- Alert description mentions "Press F2 anytime"

---

### Sales Module

#### F3 - New Sale
- Opens "New Sale - Enter Container/Lorry" modal
- Quick start for new sale transaction
- No need to click button

**Workflow:**
1. **Press F3** to start new sale
2. Enter container/lorry number
3. Record tare weight (empty container)
4. Container gets loaded with paddy
5. **Press F2** to recall
6. Select container from list
7. Record gross weight (loaded container)
8. Select purchase receipts
9. Complete transaction

**Visual Indicators:**
- "New Sale (Weigh-In Tare)" button shows `F3` badge
- Button title: "Press F3 to start"
- Alert description: "Press F3 or click 'New Sale'"

#### F2 - Recall Container
- Opens "Recall Container for Weigh-Out" modal
- Shows all pending containers with tare weight recorded
- Quick selection to proceed with gross weight entry

**Workflow:**
1. After tare weigh-in (empty container)
2. Container gets loaded with paddy
3. **Press F2** to recall
4. Select container from list
5. Record gross weight (loaded container)
6. Select purchase receipts
7. Complete transaction

**Visual Indicators:**
- "Recall Container" button shows `F2` badge
- Button title: "Press F2 to open"
- Modal title shows `F2` keyboard hint
- Alert description: "Press F2 anytime to open this modal"
- Workflow alert: "After loading, press F2 → Enter GROSS weight..."

---

## Benefits of Standardized Shortcuts

### 1. **Consistency**
- Same key does same function across modules
- Reduces cognitive load for operators
- Easier training for new staff

### 2. **Speed**
- No need to reach for mouse
- Instant modal opening
- Faster workflow completion

### 3. **Muscle Memory**
- Operators develop automatic responses
- Less thinking required during high-volume periods
- Reduced error rates

### 4. **Accessibility**
- Keyboard-only operation possible
- Helpful for power users
- Better ergonomics

---

## Implementation Details

### Purchases Module
**File:** `/app/src/components/Purchases/Purchases.jsx`

```javascript
useEffect(() => {
  const handleKeyPress = (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      showRecallModal();
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [pendingSessions]);
```

**UI Elements:**
- Button: `<kbd>F2</kbd>` badge
- Title: "Press F2 to open"
- Modal: "Recall Lorry for Weigh-Out `F2`"

### Sales Module
**File:** `/app/src/components/Sales/Sales.jsx`

```javascript
useEffect(() => {
  const handleKeyPress = (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      showRecallModal();
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [pendingSessions]);
```

**UI Elements:**
- Button: `<kbd>F2</kbd>` badge
- Title: "Press F2 to open"
- Modal: "Recall Container for Weigh-Out `F2`"

---

## Keyboard Hint Badge Style

**Standard `<kbd>` Styling:**
```javascript
<kbd style={{ 
  marginLeft: '8px', 
  fontSize: '11px', 
  padding: '2px 6px', 
  background: '#f0f0f0', 
  border: '1px solid #d9d9d9', 
  borderRadius: '3px' 
}}>F2</kbd>
```

**Appearance:**
- Light gray background
- Subtle border
- Rounded corners
- Smaller font size
- Clearly indicates keyboard key

---

## Future Shortcut Candidates

### Potential Additional Shortcuts:

#### F1 - Help/Guide
- Open context-sensitive help
- Show workflow guide for current page

#### F3 - Search
- Quick farmer search (Purchases)
- Quick manufacturer search (Sales)

#### F4 - Print
- Print last receipt
- Quick print menu

#### F5 - Refresh
- Reload data/lists
- Refresh statistics

#### ESC - Cancel
- Close modals (already standard)
- Cancel current operation

#### CTRL+S - Save
- Quick save settings
- Save draft transactions

#### CTRL+P - Print
- Alternative print shortcut
- Print current view

---

## Training Guide

### For New Operators

**Step 1: Learn the Workflow**
- Understand weigh-in (tare) → loading → weigh-out (gross) process
- Practice with demo data first

**Step 2: Practice F2**
- After weigh-in, try pressing F2 instead of clicking button
- Notice how modal opens instantly
- Practice selecting from list

**Step 3: Build Muscle Memory**
- Use F2 consistently for a few days
- Will become automatic within a week
- Speeds up operations significantly

### Quick Reference Card
```
┌─────────────────────────────────────────┐
│   PADDY COLLECTION - KEYBOARD SHORTCUTS │
├─────────────────────────────────────────┤
│                                         │
│  F3  →  New Purchase/Sale               │
│         Start new transaction           │
│                                         │
│  F2  →  Recall Container/Lorry         │
│         Continue pending transaction    │
│                                         │
│  ESC →  Close Modal/Cancel              │
│                                         │
└─────────────────────────────────────────┘
```

---

## Testing Shortcuts

### ✅ Test 1: Purchases F3 (New)
1. Go to Purchases page
2. Press F3
3. **Verify:** "New Purchase - Enter Lorry" modal opens
4. **Verify:** Lorry input field is focused
5. **Verify:** Can proceed with workflow

### ✅ Test 2: Sales F3 (New)
1. Go to Sales page
2. Press F3
3. **Verify:** "New Sale - Enter Container/Lorry" modal opens
4. **Verify:** Container input field is focused
5. **Verify:** Can proceed with workflow

### ✅ Test 3: F3 Disabled State
1. Start a transaction (modal open)
2. Press F3
3. **Verify:** Nothing happens (correct)
4. **Verify:** Prevents duplicate transactions

### ✅ Test 4: Purchases F2 (Recall)
1. Start new purchase (F3 or button)
2. Record gross weight
3. Press F2
4. **Verify:** Recall modal opens
5. **Verify:** Can select lorry

### ✅ Test 5: Sales F2 (Recall)
1. Start new sale (F3 or button)
2. Record tare weight
3. Press F2
4. **Verify:** Recall modal opens
5. **Verify:** Can select container

### ✅ Test 6: F2 Disabled State
1. When no pending sessions
2. Press F2
3. **Verify:** Nothing happens (correct)
4. **Verify:** Button is disabled

### ✅ Test 7: Multiple Sessions
1. Create multiple weigh-ins
2. Press F2
3. **Verify:** All pending sessions shown
4. **Verify:** Can select any session

### ✅ Test 8: Visual Indicators
1. Look for F3 badge on "New" button
2. Look for F2 badge on "Recall" button
3. Hover over buttons
4. **Verify:** Tooltips show correct shortcuts
5. Open modals
6. **Verify:** Workflow alerts mention shortcuts

### ✅ Test 9: Full Workflow with Shortcuts
**Purchases:**
1. Press F3 → Enter lorry → Enter gross weight
2. Press F2 → Select lorry → Enter tare → Select farmer
3. **Verify:** Complete without mouse

**Sales:**
1. Press F3 → Enter container → Enter tare
2. Press F2 → Select container → Enter gross
3. **Verify:** Complete without mouse

---

## Troubleshooting

### Issue: F3 doesn't work
**Solution:**
- Ensure no transaction is already in progress
- Check weightInMode or activeSession is not active
- Verify you're on Purchases or Sales page
- Try refreshing page

### Issue: F3 opens wrong modal
**Solution:**
- Check you're on correct page (Purchases vs Sales)
- F3 is context-aware (different modals per module)

### Issue: F2 doesn't work
**Solution:**
- Ensure modal is not already open
- Check no input field is focused
- Verify pending sessions exist
- Try refreshing page

### Issue: F2 opens wrong modal
**Solution:**
- Check you're on correct page (Purchases vs Sales)
- F2 is context-aware

### Issue: Shortcuts conflict with browser
**Solution:**
- Some browsers use F3 for search
- Application prevents default behavior
- If issue persists, check browser extensions

### Issue: Want different shortcuts
**Solution:**
- Can be changed in code
- Update both `handleKeyPress` function and UI labels
- Maintain consistency across modules
- Consider F-key conflicts (F1=Help, F5=Refresh, F11=Fullscreen)

---

## Files Modified

### Changes Made:

1. **Purchases.jsx**
   - Added F3 keyboard listener for starting new purchase
   - Updated button with F3 badge and tooltip: "Press F3 to start"
   - Updated workflow alert: "Press F3 or click 'New Purchase'"
   - Added state dependencies to useEffect

2. **Sales.jsx**
   - Added F3 keyboard listener for starting new sale
   - Updated button with F3 badge and tooltip: "Press F3 to start"
   - Updated workflow alert: "Press F3 or click 'New Sale'"
   - Added state dependencies to useEffect

3. **KEYBOARD_SHORTCUTS.md**
   - Added F3 documentation
   - Updated quick reference card
   - Updated module-specific sections
   - Added testing scenarios for F3

---

## Summary

**Standard Keyboard Shortcuts Across Purchases and Sales:**

| Shortcut | Function              | Purpose                           |
|----------|-----------------------|-----------------------------------|
| **F3**   | New Purchase/Sale     | Start new transaction             |
| **F2**   | Recall Container      | Continue pending transaction      |
| **ESC**  | Cancel/Close          | Close modals and cancel operations|

**Benefits:**
- ✅ Consistent user experience across modules
- ✅ Faster operations with keyboard-only workflow
- ✅ Better muscle memory (F3 = New, F2 = Recall)
- ✅ Clear visual indicators on all buttons
- ✅ Professional UX with keyboard hints
- ✅ Reduced hand movement during high-volume periods

**Workflow Integration:**

**Purchases:**
1. **Press F3** → Start new purchase
2. Enter lorry number & gross weight
3. **Press F2** → Recall for tare weight
4. Complete transaction

**Sales:**
1. **Press F3** → Start new sale
2. Enter container & tare weight
3. **Press F2** → Recall for gross weight
4. Complete transaction

**Visual Hints:**
- All buttons show keyboard badge (F3, F2)
- Tooltips clearly state shortcuts
- Workflow alerts reference both shortcuts
- Consistent styling across modules

---

**Status:** ✅ Implemented  
**Version:** 2.0  
**Date:** November 15, 2025

**Press F3 to start new transactions and F2 to recall containers!** ⌨️✨
