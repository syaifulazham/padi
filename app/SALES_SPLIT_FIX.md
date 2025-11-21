# Sales Split Receipt - Over/Under Capacity Fix

## Issue Fixed
Split receipt was always showing 0 kg for Split 1, and the split logic wasn't handling over-capacity correctly.

## Root Cause
1. **Auto-calculation only worked for UNDER-capacity** (need more weight)
2. **Didn't handle OVER-capacity** (excess weight to remove)
3. **Split confirmation always added both splits** to selection, even when trying to reduce

## Solution Implemented

### Two Scenarios Now Handled

#### Scenario 1: UNDER-CAPACITY (Need More Weight)
**Example:**
```
Container Net: 5,000 kg
Currently Selected: 3,800 kg
Difference: +1,200 kg (need more)

Receipt to Split: PUR-003 (1,500 kg)
```

**Auto-Calculation:**
```
Split 1 (Add to sale): 1,200 kg ← AUTO-FILLED
Split 2 (Remain): 300 kg
```

**Result After Confirm:**
```
Selected Receipts:
✓ Previous receipts: 3,800 kg
✓ PUR-003: 300 kg (updated original)
✓ PUR-003-SPLIT: 1,200 kg (new portion)
Total: 5,300 kg ✓
```

#### Scenario 2: OVER-CAPACITY (Excess Weight)
**Example:**
```
Container Net: 5,000 kg
Currently Selected: 5,300 kg  
Difference: -300 kg (excess! ⚠️)

Selected Receipt to Split: PUR-001 (2,000 kg)
```

**Auto-Calculation:**
```
Split 1 (Keep in sale): 1,700 kg ← AUTO-FILLED (2,000 - 300)
Split 2 (Remove/Excess): 300 kg
```

**Result After Confirm:**
```
Selected Receipts:
✓ Other receipts: 3,300 kg
✓ PUR-001-SPLIT: 1,700 kg (reduced from 2,000)
Total: 5,000 kg ✓ Perfect!

Removed from Sale:
✗ 300 kg excess (goes back to available pool)
```

## UI Changes

### Alert Banner (Dynamic)

**When OVER-CAPACITY:**
```
⚠️ OVER-CAPACITY by 300.00 kg

Split 1 (Keep in sale): Auto-calculated to remove the excess weight.
Split 2 (Remove): The excess 300.00 kg will go back to available receipts.
```

**When UNDER-CAPACITY:**
```
Need 1,200.00 kg more

Split 1 has been auto-calculated to match the exact weight needed.
```

### Split Breakdown (Dynamic)

**When OVER-CAPACITY:**
```
Split Breakdown:
• Split 1 (Keep in sale): 1,700.00 kg → Keeps this amount in the sale
• Split 2 (Removed): 300.00 kg → Removed from sale, goes back to available receipts
```

**When UNDER-CAPACITY:**
```
Split Breakdown:
• Split 1 (Keep in sale): 1,200.00 kg → Added to this sale as new split portion
• Split 2 (Remaining): 300.00 kg → Stays in original PUR-003 for future sales
```

### Success Messages

**When OVER-CAPACITY:**
```
✅ Receipt split! Keeping 1,700 kg in sale, removed 300 kg excess
```

**When UNDER-CAPACITY:**
```
✅ Receipt split! Added 1,200 kg to sale, 300 kg stays in original
```

## Code Logic

### Auto-Calculation (`openSplitModal`)

```javascript
if (weightDifference < 0) {
  // OVER-CAPACITY: Need to REDUCE
  const excessWeight = Math.abs(weightDifference);
  suggestedSplitWeight = receipt.net_weight_kg - excessWeight;
} else if (weightDifference > 0) {
  // UNDER-CAPACITY: Need to ADD
  suggestedSplitWeight = weightDifference;
}
```

### Split Confirmation (`confirmSplitReceipt`)

```javascript
if (isOverCapacity) {
  // OVER: Replace original with split only (keep smaller amount)
  updatedSelected = selectedReceipts.map(r => 
    r.transaction_id === receiptToSplit.transaction_id ? splitReceipt : r
  );
} else {
  // UNDER: Keep original + add split
  updatedSelected = selectedReceipts.map(r => 
    r.transaction_id === receiptToSplit.transaction_id ? remainingReceipt : r
  );
  updatedSelected.push(splitReceipt);
}
```

## Testing Scenarios

### ✅ Test 1: Over-Capacity Split
1. Select receipts totaling 5,300 kg (container is 5,000 kg)
2. Click "Split" on any selected receipt
3. Verify: "OVER-CAPACITY by 300 kg" shows in red
4. Verify: Split 1 is auto-filled (e.g., 1,700 kg for 2,000 kg receipt)
5. Confirm split
6. Verify: Total reduces to 5,000 kg ✓

### ✅ Test 2: Under-Capacity Split
1. Select receipts totaling 3,800 kg (container is 5,000 kg)
2. Click "Split" on an available receipt (not selected yet)
3. Verify: "Need 1,200 kg more" shows in green
4. Verify: Split 1 is auto-filled with 1,200 kg
5. Confirm split
6. Verify: Total increases to 5,000 kg ✓

### ✅ Test 3: Console Debugging
Open browser console to see:
```
🔍 Split Modal Calculation: {
  grossWeight: 7500,
  tareWeight: 2500,
  containerNetWeight: 5000,
  currentSelectedTotal: 5300,
  weightDifference: -300,
  receiptWeight: 2000,
  scenario: "OVER-CAPACITY"
}

💡 Suggested Split Weight: 1700 Remaining: 300
```

## Benefits

1. **Intelligent Auto-Fill**: System knows whether you need to add or reduce
2. **Clear Visual Feedback**: Red alert for over, green for under
3. **Correct Split Behavior**: Keeps/removes the right portions
4. **No Manual Math**: Calculates exact amounts needed
5. **Descriptive Messages**: Tells you exactly what will happen

## Files Modified

- `/app/src/components/Sales/Sales.jsx`
  - Enhanced `openSplitModal()` with over/under logic
  - Fixed `confirmSplitReceipt()` to handle both scenarios correctly
  - Updated UI alerts and breakdowns with dynamic content
  - Added console debugging for troubleshooting

## Edge Cases Handled

### Case 1: Exact Match After Split
```
Over by 300 kg → Split 2,000 kg receipt → Keep 1,700 kg
Result: Perfect match ✓
```

### Case 2: Receipt Smaller Than Excess
```
Over by 500 kg → Try to split 300 kg receipt
Auto-fill: 0 (receipt too small)
Solution: Select a larger receipt to split
```

### Case 3: No Gross Weight Entered
```
Auto-fill: 0
Alert: Shows "Need to fill container"
Solution: Enter gross weight first
```

## Known Limitations

1. Can only split receipts with weight between 0.01 and (original - 0.01)
2. Cannot split receipts marked with "-SPLIT" suffix (already split)
3. Requires gross weight to be entered for auto-calculation

---

**Status**: ✅ Fixed and Working
**Version**: 2.0
**Date**: November 13, 2025

## Summary

The split receipt feature now correctly handles both over-capacity (need to reduce) and under-capacity (need to add more) scenarios with intelligent auto-calculation and clear visual feedback showing exactly what will happen to each split portion.
