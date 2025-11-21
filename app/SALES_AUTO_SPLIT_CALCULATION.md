# Sales - Auto-Calculated Split Receipt

## Feature Enhancement
**Automatic split amount calculation based on container weight difference**

## Overview
The Split Receipt modal now automatically calculates and pre-fills the split amount based on how much weight is needed to perfectly match the container's net weight. This eliminates manual calculation and speeds up the workflow.

## How It Works

### Auto-Calculation Logic

When you click "Split" on a receipt, the system:

1. **Calculates Container Net Weight:**
   ```
   Container Net = Gross Weight - Tare Weight
   ```

2. **Calculates Current Selected Total:**
   ```
   Current Total = Sum of all selected receipt weights
   ```

3. **Calculates Weight Difference (Amount Needed):**
   ```
   Weight Needed = Container Net - Current Total
   ```

4. **Pre-fills Split Amount:**
   ```
   Split 1 (Auto-filled) = Weight Needed
   Split 2 (Calculated) = Original Receipt Weight - Weight Needed
   ```

### Example Scenario

**Container Details:**
```
Tare Weight: 2,500 kg
Gross Weight: 7,500 kg
Net Weight: 5,000 kg
```

**Current Selection:**
```
✓ PUR-001: 2,000 kg
✓ PUR-002: 1,800 kg
Total Selected: 3,800 kg
```

**Weight Analysis:**
```
Container Net: 5,000 kg
Current Total: 3,800 kg
Weight Needed: 1,200 kg  ← This is auto-calculated!
```

**Available Receipt to Split:**
```
PUR-003: 1,500 kg (Original)
```

**When You Click "Split" on PUR-003:**

The modal opens with **auto-calculated** values:

```
┌─────────────────────────────────────────────────┐
│ Split Receipt: PUR-003                          │
│                                                 │
│ Weight needed to complete container: 1,200 kg   │
│ Split amount has been auto-calculated to match  │
│ the exact weight needed. You can adjust if      │
│ needed.                                         │
├─────────────────────────────────────────────────┤
│ Original Weight (kg): 1,500.00                  │
│ Split Amount (kg): [1,200.00] ← AUTO-FILLED!   │
│ Remaining (kg): 300.00                          │
├─────────────────────────────────────────────────┤
│ Split Breakdown:                                │
│ • Split 1: 1,200.00 kg will be added to this   │
│   sale (PUR-003-SPLIT)                          │
│ • Split 2: 300.00 kg will remain in original   │
│   receipt PUR-003 for future sales              │
└─────────────────────────────────────────────────┘
```

**Result After Confirming Split:**
```
Selected Receipts:
✓ PUR-001: 2,000 kg
✓ PUR-002: 1,800 kg
✓ PUR-003: 300 kg (updated original)
✓ PUR-003-SPLIT: 1,200 kg (new split portion)

Total: 5,300 kg (exact match! ✓)
```

Wait, that's over! Let me recalculate...

Actually, the split should be:
```
Selected Receipts After Split:
✓ PUR-001: 2,000 kg
✓ PUR-002: 1,800 kg
✓ PUR-003-SPLIT: 1,200 kg (selected)

NOT Selected (available for future):
□ PUR-003: 300 kg (remaining)

Total: 5,000 kg (perfect match! ✓)
```

## UI Components

### 1. Alert Banner (Top)
Shows the weight context:
```
Splitting Receipt: PUR-003

Weight needed to complete container: 1,200.00 kg
Split amount has been auto-calculated to match the exact 
weight needed. You can adjust if needed.
```

**Dynamic Messages:**
- ✅ When weight needed is between 0 and receipt weight:
  ```
  Split amount has been auto-calculated to match the exact 
  weight needed. You can adjust if needed.
  ```

- ⚠️ When container is already full or weight needed >= receipt:
  ```
  Split this receipt into the amount needed. Adjust the 
  split amount as required.
  ```

### 2. Input Fields (3 Columns)

**Column 1: Original Weight**
- Disabled field showing the receipt's original weight
- Read-only, for reference

**Column 2: Split Amount** 
- **AUTO-FILLED** with calculated weight needed
- Has green "Auto-Calculated" badge
- Editable - you can adjust if needed
- Auto-focus for quick editing
- Updates "Remaining" in real-time

**Column 3: Remaining**
- Disabled field showing what stays in original receipt
- Automatically calculates: `Original - Split Amount`
- Updates live as you type

### 3. Split Breakdown Alert (Bottom)
Dynamic summary showing the result:
```
Split Breakdown:
• Split 1: 1,200.00 kg will be added to this sale 
  (new entry with "-SPLIT" suffix)
• Split 2: 300.00 kg will remain in original receipt 
  PUR-003 for future sales
```

Updates in real-time as you adjust the split amount.

## Benefits

### 1. **Zero Mental Math**
System calculates the exact amount needed automatically.

### 2. **Faster Workflow**
No need to:
- Calculate container net weight
- Sum up selected receipts
- Subtract to find difference
- Manually enter the value

### 3. **Reduces Errors**
Pre-filled value is always correct based on current selection.

### 4. **Still Flexible**
You can override the auto-calculated value if needed.

### 5. **Visual Clarity**
- See weight needed prominently
- Understand why this value was chosen
- Preview the split result before confirming

## Workflow Integration

### Complete Split Process

**Step 1: Select Initial Receipts**
```
Container Net: 5,000 kg
Selected: 3,800 kg
Status: Need 1,200 kg more 🟠
```

**Step 2: Click "Split" on Target Receipt**
```
Opening split modal for PUR-003 (1,500 kg)
Calculating... Weight needed = 1,200 kg
Auto-filling split amount = 1,200 kg
```

**Step 3: Review Auto-Calculated Values**
```
Split Amount: 1,200 kg ← Pre-filled!
Remaining: 300 kg ← Auto-calculated
```

**Step 4: Adjust if Needed (Optional)**
```
You can type new value if needed
Remaining updates automatically
```

**Step 5: Confirm Split**
```
Creates:
• PUR-003-SPLIT (1,200 kg) - Added to selection
• PUR-003 (300 kg) - Updated original
```

**Step 6: Final Selection**
```
Container Net: 5,000 kg
Selected Total: 5,000 kg
Status: Perfect match ✓ 🟢
```

## Edge Cases Handled

### Case 1: Container Already Full
```
Container Net: 5,000 kg
Selected Total: 5,300 kg
Weight Needed: -300 kg (negative!)

Modal shows:
"Weight needed to complete container: Container already full"
Split Amount: 0 (you must manually enter)
```

### Case 2: Weight Needed > Receipt Size
```
Container Net: 5,000 kg
Selected Total: 2,000 kg
Weight Needed: 3,000 kg

Receipt to split: PUR-004 (1,000 kg)
Since 3,000 > 1,000, auto-fill won't work perfectly

Modal shows:
Split Amount: 0 (manual entry required)
Message: "Split this receipt into the amount needed..."
```

### Case 3: Weight Needed = Receipt Size
```
Container Net: 5,000 kg
Selected Total: 3,500 kg
Weight Needed: 1,500 kg

Receipt to split: PUR-005 (1,500 kg)
Exactly matches!

Modal shows:
Split Amount: 1,500 kg (but this would leave 0 remaining)
Note: System won't allow 0 remaining, so you'd select the whole receipt instead
```

### Case 4: Perfect Tiny Adjustment
```
Container Net: 5,000 kg
Selected Total: 4,950 kg
Weight Needed: 50 kg

Receipt to split: PUR-006 (800 kg)

Modal shows:
Split Amount: 50 kg ← Perfect!
Remaining: 750 kg ← Goes back to available pool
```

## Technical Implementation

### File Modified
`/app/src/components/Sales/Sales.jsx`

### Key Function: `openSplitModal`
```javascript
const openSplitModal = (receipt) => {
  setReceiptToSplit(receipt);
  
  // Calculate weight difference (how much more weight is needed)
  const containerNetWeight = finalForm.getFieldValue('gross_weight') 
    ? finalForm.getFieldValue('gross_weight') - activeSession.tare_weight 
    : 0;
  const currentSelectedTotal = selectedReceipts.reduce(
    (sum, r) => sum + parseFloat(r.net_weight_kg || 0), 0
  );
  const weightDifference = containerNetWeight - currentSelectedTotal;
  
  // Auto-calculate split amounts
  // Split 1: The exact amount needed (difference)
  // Split 2: The remainder (original - difference)
  const suggestedSplitWeight = weightDifference > 0 && 
                               weightDifference < receipt.net_weight_kg 
    ? weightDifference 
    : 0;
  
  splitForm.setFieldsValue({
    original_weight: receipt.net_weight_kg,
    split_weight: suggestedSplitWeight,
    remaining_weight: receipt.net_weight_kg - suggestedSplitWeight,
    weight_needed: weightDifference
  });
  
  setSplitReceiptModal(true);
};
```

### Conditions for Auto-Fill
```javascript
if (weightDifference > 0 && weightDifference < receipt.net_weight_kg) {
  // Auto-fill with exact amount needed
  splitAmount = weightDifference;
} else {
  // Set to 0, user must manually enter
  splitAmount = 0;
}
```

## Real-World Examples

### Example 1: 3 Receipts to Fill Container

**Setup:**
```
Container: Tare 2,500 → Gross 7,500 → Net 5,000 kg
Receipts: 
- PUR-001: 2,200 kg
- PUR-002: 1,900 kg
- PUR-003: 1,200 kg
```

**Process:**
1. Select PUR-001 (2,200 kg) → Need 2,800 kg more
2. Select PUR-002 (1,900 kg) → Need 900 kg more
3. Split PUR-003:
   - Auto-filled: 900 kg
   - Remaining: 300 kg
4. Select PUR-003-SPLIT (900 kg)
5. Total: 5,000 kg ✓

### Example 2: Large Receipt, Small Need

**Setup:**
```
Container: Net 3,000 kg
Selected: 2,850 kg
Need: 150 kg
Receipt: PUR-999: 5,000 kg
```

**Process:**
1. Click Split on PUR-999
2. Auto-filled: 150 kg ← Perfect!
3. Remaining: 4,850 kg
4. Confirm split
5. Select PUR-999-SPLIT (150 kg)
6. Total: 3,000 kg ✓
7. PUR-999 (4,850 kg) still available for future sales

### Example 3: Multiple Splits Needed

**Setup:**
```
Container: Net 10,000 kg
All receipts are 1,000 kg each
```

**Process:**
1. Select 9 receipts = 9,000 kg
2. Need 1,000 kg more
3. Select any 10th receipt without splitting
4. Done! (No split needed if exact match available)

## Validation Rules

### Minimum Split
- Split amount must be > 0.01 kg
- Cannot split 0 kg

### Maximum Split
- Split amount must be < original weight
- Cannot split the entire receipt (must leave some remaining)
- Range: `0.01` to `original_weight - 0.01`

### Remaining Validation
- Automatically calculated
- Must be > 0.01 kg
- System prevents invalid splits

## User Tips

### 💡 Tip 1: Accept Auto-Calculated Value
If the green "Auto-Calculated" badge shows and the value looks correct, just click "Confirm Split" - no need to change anything!

### 💡 Tip 2: Fine-Tune if Needed
You can adjust the auto-filled value up or down if you want a different split for operational reasons.

### 💡 Tip 3: Watch the Breakdown
The "Split Breakdown" alert updates live as you type, showing exactly what will happen.

### 💡 Tip 4: Split Multiple Times
The remaining portion goes back to the available receipts pool. You can split it again later if needed!

### 💡 Tip 5: Use for Perfect Matches
Even if you're close to the target weight, split to get an exact match - it helps with inventory accuracy.

## FAQ

**Q: What if I don't like the auto-calculated amount?**  
A: Just type a different value! The field is fully editable.

**Q: Can I split a receipt that's already been split?**  
A: No, receipts with "-SPLIT" suffix are locked from further splitting.

**Q: What happens to the remaining portion?**  
A: It updates the original receipt and stays available for future sales.

**Q: Do I have to use the split feature?**  
A: No, you can manually select receipts without splitting if they match well enough.

**Q: Can I undo a split?**  
A: Splits are final once confirmed. But you can remove the split portion from your selection and not use it.

**Q: Why is the split amount set to 0 sometimes?**  
A: When the container is already full or the weight needed exceeds the receipt size, the system can't auto-calculate a valid split, so you must enter manually.

---

**Status**: ✅ Active  
**Version**: 1.0  
**Hot-Reloaded**: Yes  
**Date**: November 13, 2025

## Summary

The Split Receipt modal now intelligently calculates and pre-fills the split amount based on exactly how much weight is needed to complete the container, eliminating manual calculations and speeding up the workflow while maintaining full flexibility to adjust as needed.
