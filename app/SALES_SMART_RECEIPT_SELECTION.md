# Sales - Smart Receipt Selection

## Feature Enhancement
**Auto-disable receipts when container capacity is reached**

## Overview
When selecting purchase receipts for a sale, the system now intelligently disables unselected receipts once the total selected weight meets or exceeds the container's net weight. This prevents over-selection and guides users to select the correct amount.

## How It Works

### Scenario Example

**Container Details:**
- Tare Weight (empty): 2,500 kg
- Gross Weight (loaded): 7,500 kg
- **Net Weight**: 5,000 kg

**Available Receipts:**
1. PUR-001: 2,000 kg ✓ (selectable)
2. PUR-002: 1,800 kg ✓ (selectable)
3. PUR-003: 1,500 kg ✓ (selectable)
4. PUR-004: 1,000 kg ✓ (selectable)
5. PUR-005: 800 kg ✓ (selectable)

### User Selection Flow

**Step 1: Select First Receipt**
- User selects PUR-001 (2,000 kg)
- Selected Total: 2,000 kg
- Need: 3,000 kg more
- Status: All other receipts remain enabled ✓

**Step 2: Select Second Receipt**
- User selects PUR-002 (1,800 kg)
- Selected Total: 3,800 kg
- Need: 1,200 kg more
- Status: All other receipts remain enabled ✓

**Step 3: Select Third Receipt**
- User selects PUR-003 (1,500 kg)
- Selected Total: 5,300 kg
- Over by: 300 kg ⚠️
- Status: **All unselected receipts (PUR-004, PUR-005) are now DISABLED** 🔒

**Step 4: Deselect to Adjust**
- User can still deselect PUR-003
- Selected Total: 3,800 kg
- Need: 1,200 kg more
- Status: Unselected receipts become enabled again ✓

**Step 5: Select Better Match**
- User selects PUR-004 (1,000 kg)
- Selected Total: 4,800 kg
- Need: 200 kg more
- Status: PUR-005 enabled (can still add), others disabled ✓

**Step 6: Final Selection**
- User splits PUR-005 to create 200 kg portion
- Selects the 200 kg split
- Selected Total: 5,000 kg
- Perfect match! ✓
- Status: All unselected receipts disabled 🔒

## UI Indicators

### Alert Message
Shows at the top of the modal:
```
Container Net Weight: 5,000.00 kg - Once the selected total meets or exceeds this weight, 
other receipts will be disabled.
```

### Summary Tags
Located at the bottom of the table:

**Blue Tag (Selection Count):**
```
3 receipts = 5,300.00 kg
```

**Dynamic Status Tag:**
- 🟢 **Green**: Perfect match (difference ≤ 0.5 kg)
  ```
  Perfect match ✓
  ```

- 🟠 **Orange**: Need more weight (under container capacity)
  ```
  Need 1,200.00 kg more
  ```

- 🔴 **Red**: Exceeded container capacity
  ```
  Over by 300.00 kg
  ```

## Business Logic

### Disable Condition
A receipt checkbox is disabled when:
```javascript
!isAlreadySelected && currentSelectedTotal >= containerNetWeight
```

**Translation:**
- The receipt is NOT already selected, AND
- The current total of selected receipts >= container net weight

### Enable Condition
A receipt checkbox remains enabled when:
- It's already selected (can always deselect), OR
- Current total < container net weight (room to add more)

## Benefits

### 1. **Prevents Over-Selection**
Users cannot accidentally select too many receipts that exceed container capacity.

### 2. **Visual Guidance**
Disabled checkboxes clearly show which receipts cannot be added.

### 3. **Flexible Adjustment**
Users can:
- Deselect any selected receipt at any time
- Re-select after deselecting others
- Use receipt splitting for fine-tuning

### 4. **Real-Time Feedback**
- Summary shows exactly how much more is needed
- Color-coded tags indicate status at a glance
- Container net weight displayed prominently

## Technical Implementation

### Component: `Sales.jsx`

**Key Code:**
```javascript
rowSelection={{
  getCheckboxProps: (record) => {
    const containerNetWeight = finalForm.getFieldValue('gross_weight') 
      ? finalForm.getFieldValue('gross_weight') - activeSession.tare_weight 
      : 0;
    const currentSelectedTotal = selectedReceipts.reduce(
      (sum, r) => sum + parseFloat(r.net_weight_kg || 0), 0
    );
    const isAlreadySelected = selectedReceipts.some(
      r => r.transaction_id === record.transaction_id
    );
    
    const shouldDisable = !isAlreadySelected && currentSelectedTotal >= containerNetWeight;
    
    return { disabled: shouldDisable };
  }
}}
```

**Summary Calculation:**
```javascript
summary={(pageData) => {
  const totalWeight = selectedReceipts.reduce(
    (sum, r) => sum + parseFloat(r.net_weight_kg || 0), 0
  );
  const containerNetWeight = finalForm.getFieldValue('gross_weight') 
    ? finalForm.getFieldValue('gross_weight') - activeSession.tare_weight 
    : 0;
  const diff = containerNetWeight - totalWeight;
  
  return (
    <Tag color={Math.abs(diff) <= 0.5 ? 'green' : diff > 0 ? 'orange' : 'red'}>
      {diff > 0 
        ? `Need ${diff.toFixed(2)} kg more` 
        : diff < 0 
          ? `Over by ${Math.abs(diff).toFixed(2)} kg` 
          : 'Perfect match ✓'
      }
    </Tag>
  );
}}
```

## User Workflow

### Complete Selection Process

1. **Open Receipt Selection Modal**
   - Click "Select Receipts" button
   - Modal shows available unsold receipts

2. **View Container Target**
   - Alert shows container net weight
   - Understand target weight needed

3. **Select Receipts**
   - Check receipts to load
   - Watch running total in summary
   - Observe status tag changes

4. **Auto-Disable Trigger**
   - When total >= container weight
   - Unselected receipts become disabled
   - Grey checkbox, unclickable

5. **Fine-Tune Selection**
   - Deselect receipts to adjust
   - Disabled receipts re-enable when total drops
   - Use split feature for exact matching

6. **Confirm Selection**
   - Ideally: Green "Perfect match ✓" tag
   - Acceptable: Orange tag with small difference
   - Click "Confirm Selection"

## Validation Rules

### At Confirmation
When user clicks "Confirm Selection":
- At least 1 receipt must be selected
- Total weight should match container ± 0.5 kg tolerance
- Modal closes and receipts are added to sale

### At Sale Completion
When user clicks "Complete Sale":
- Weight difference must be ≤ 0.5 kg
- Otherwise: Error message with exact difference shown

## Edge Cases Handled

### Case 1: No Gross Weight Entered
- Container net weight shows as "---"
- All receipts remain enabled
- User must enter gross weight first

### Case 2: All Receipts Too Large
- Each individual receipt > container capacity
- All disabled immediately
- User must split receipts first

### Case 3: Exact Match First Selection
- User selects receipt(s) that exactly match
- All other receipts disabled immediately
- Shows green "Perfect match ✓"

### Case 4: Multiple Deselects
- User deselects all receipts
- All receipts re-enabled
- Can start fresh selection

## Testing Scenarios

### ✅ Test 1: Normal Selection
- Container: 5,000 kg
- Select 3 receipts totaling 5,000 kg
- Verify other receipts disabled

### ✅ Test 2: Over-Selection
- Container: 3,000 kg
- Select 2 receipts totaling 3,500 kg
- Verify disabled + red "Over" tag

### ✅ Test 3: Deselection Re-enables
- Select receipts until disabled
- Deselect one receipt
- Verify some receipts re-enable

### ✅ Test 4: Split Integration
- Container: 2,000 kg
- Select 1,500 kg receipt
- Split another receipt to 500 kg
- Select split portion
- Verify perfect match

## FAQ

**Q: Can I deselect a receipt after others are disabled?**  
A: Yes! Already-selected receipts remain enabled and can always be deselected.

**Q: What happens if I need to select more after hitting the limit?**  
A: Deselect some receipts to bring the total below the container weight. Other receipts will re-enable.

**Q: Can I still use receipt splitting with this feature?**  
A: Absolutely! Splitting creates new receipt entries that appear in the available list. This is actually recommended for fine-tuning.

**Q: What if my receipts are all larger than the container?**  
A: You must split receipts first to create smaller portions that fit within the container capacity.

**Q: Does this prevent me from completing the sale?**  
A: No, it only guides selection. Final validation at completion still allows ±0.5 kg tolerance.

---

**Status**: ✅ Active  
**Version**: 1.0  
**Hot-Reloaded**: Yes  
**Date**: November 13, 2025

## Summary

Smart receipt selection automatically disables unselected receipts when the container capacity is reached, providing real-time visual guidance and preventing over-selection while maintaining full flexibility to adjust the selection.
