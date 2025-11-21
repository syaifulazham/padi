# Sales Workflow - Complete Implementation

## Overview
The Sales operation delivers harvest collection to third-party manufacturers. The workflow involves container weigh-in (tare), loading, weigh-out (gross), purchase receipt selection, and optional receipt splitting to match weights.

## Complete Workflow

### Step 1: Container Weigh-In (Tare - Empty Container)
```
1. Click "New Sale (Weigh-In Tare)" button
2. Enter container/lorry registration number (e.g., "ABC 1234")
3. Enter TARE weight (empty container weight before loading)
4. Container is saved to pending sessions with localStorage persistence
```

**Key Features:**
- **Auto-save**: Tare weight saved to localStorage immediately
- **Persistence**: Data survives page refresh/crashes
- **F3 Shortcut**: Quick recall of pending containers

### Step 2: Loading Process
```
Physical operation: Load paddy from purchase receipts into the container
(This happens offline - operator loads the paddy)
```

### Step 3: Recall Container for Weigh-Out
```
1. Press F3 or click "Recall Container"
2. Select the container from the pending list
3. Weigh-out panel opens
```

### Step 4: Enter Gross Weight (Full Container)
```
1. Enter GROSS weight (loaded container weight)
2. System automatically calculates: Net Weight = Gross - Tare
3. Net weight is displayed in real-time
```

### Step 5: Select Purchase Receipts
```
1. Click "Select Receipts" button
2. Modal opens showing all unsold purchase receipts
3. Select receipts using checkboxes (multi-select)
4. View total weight of selected receipts
5. Click "Confirm Selection"
```

**Receipt Information Displayed:**
- Receipt number
- Transaction date
- Farmer name
- Net weight (kg)

### Step 6: Weight Balancing & Receipt Splitting
```
System compares:
- Container Net Weight (Gross - Tare)
- Selected Receipts Total Weight

If difference > 0.5 kg:
1. Click "Split" button on a receipt
2. Enter split amount (must be < original weight)
3. System creates:
   - Updated original receipt (with remaining weight)
   - New split receipt (with "-SPLIT" suffix, split amount)
4. Repeat until weights match within 0.5 kg tolerance
```

**Visual Indicators:**
- **Green tag** ✓: Weights match (difference ≤ 0.5 kg)
- **Red tag** ⚠️: Weights don't match (difference > 0.5 kg)

### Step 7: Select Manufacturer
```
1. Click "Search" button in Manufacturer field
2. Search by company name, code, or registration number
3. Select manufacturer from results
```

### Step 8: Complete Sale
```
1. Optionally enter driver name
2. Optionally add notes
3. Click "Complete Sale & Print Receipt"
4. System validates:
   - Manufacturer selected
   - Valid gross weight
   - Net weight > 0
   - At least one receipt selected
   - Weight difference ≤ 0.5 kg
   - Valid price per kg
5. Sale is saved to database
6. Container removed from pending sessions
7. Success message with receipt number displayed
```

## Data Persistence

### localStorage Storage
**Key:** `paddy_sales_weight_in_sessions`

**Structure:**
```json
[
  {
    "vehicle_number": "ABC 1234",
    "tare_weight": 2500,
    "timestamp": "2025-11-13T04:30:00.000Z"
  }
]
```

**Features:**
- Auto-save on every state change
- Auto-restore on page load
- Notification on restore
- Survives browser crash, page refresh, or application restart

## UI Components

### Stats Cards (Top)
1. **Pending Containers**: Count with "Auto-Save" badge
2. **Active Session**: Current container being processed

### Weight-In Panel (Yellow)
- Shows when entering tare weight
- Large input field for weight entry
- Save/Cancel buttons

### Weigh-Out Panel (Green)
- Shows when processing a container
- Three weight displays:
  - **Tare** (yellow) - Empty container
  - **Gross** (input) - Loaded container  
  - **Net** (green) - Calculated difference
- Purchase receipts section with:
  - Selected receipts table
  - Weight difference indicator
  - Select/Split/Remove actions
- Manufacturer search field
- Price per kg input
- Driver name (optional)
- Notes (optional)

### Modals
1. **Container Registration**: Enter vehicle number
2. **Recall Container** (F3): Grid of pending containers
3. **Manufacturer Search**: Search and select manufacturer
4. **Receipt Selection**: Multi-select purchase receipts table
5. **Split Receipt**: Split weight calculator

## Validation Rules

### Weight Validation
- Gross weight must be > 0
- Net weight (Gross - Tare) must be > 0
- Selected receipts total must match container net ±0.5 kg

### Receipt Validation
- At least one purchase receipt must be selected
- Split weight must be > 0 and < original weight
- Cannot split a receipt that's already split

### Required Fields
- Container/Vehicle number
- Tare weight
- Gross weight
- Manufacturer
- Price per kg
- At least one receipt

## Keyboard Shortcuts
- **F3**: Open "Recall Container" modal

## Weight Difference Tolerance
- **Acceptable**: ≤ 0.5 kg difference
- **Not Acceptable**: > 0.5 kg difference (blocks completion)

## Data Flow

```
1. Container Weigh-In (Tare)
   ↓
2. Save to localStorage
   ↓
3. Loading (Offline)
   ↓
4. Recall Container (F3)
   ↓
5. Enter Gross Weight
   ↓
6. Select Purchase Receipts
   ↓
7. Split Receipts (if needed)
   ↓
8. Select Manufacturer
   ↓
9. Submit Sale
   ↓
10. Save to Database
    ↓
11. Remove from localStorage
    ↓
12. Show Success Receipt Number
```

## API Integration

### Required Endpoints

#### 1. Get Manufacturers
```javascript
window.electronAPI.manufacturers.getAll()
// Returns: { success: true, data: [...] }
```

#### 2. Get Unsold Purchase Receipts
```javascript
window.electronAPI.purchases.getUnsold()
// Returns: { success: true, data: [...] }
```

#### 3. Create Sale
```javascript
window.electronAPI.sales.create({
  season_id: number,
  manufacturer_id: number,
  gross_weight_kg: number,
  tare_weight_kg: number,
  net_weight_kg: number,
  base_price_per_kg: number,
  vehicle_number: string,
  driver_name: string | null,
  purchase_receipts: [
    {
      transaction_id: number,
      receipt_number: string,
      net_weight_kg: number
    }
  ],
  created_by: number
})
// Returns: { success: true, data: { receipt_number: string } }
```

## Receipt Splitting Logic

### Original Receipt
```json
{
  "transaction_id": 123,
  "receipt_number": "PUR-2025-001",
  "net_weight_kg": 1000.00
}
```

### After Split (500 kg)
```json
[
  {
    "transaction_id": 123,
    "receipt_number": "PUR-2025-001",
    "net_weight_kg": 500.00,
    "has_been_split": true
  },
  {
    "transaction_id": 123,
    "receipt_number": "PUR-2025-001-SPLIT",
    "net_weight_kg": 500.00,
    "is_split": true,
    "original_receipt": "PUR-2025-001"
  }
]
```

## Example Scenario

### Scenario: Sell 5000 kg to Manufacturer

1. **Weigh-In**: Container "XYZ 9999", Tare = 2500 kg
2. **Loading**: Load paddy from various purchase receipts
3. **Weigh-Out**: Container "XYZ 9999", Gross = 7500 kg
4. **Calculate**: Net = 7500 - 2500 = **5000 kg**
5. **Select Receipts**:
   - PUR-001: 2000 kg
   - PUR-002: 1500 kg
   - PUR-003: 2000 kg
   - **Total: 5500 kg** (⚠️ 500 kg over!)
6. **Split Receipt**: Split PUR-003 into:
   - PUR-003: 1500 kg (remaining)
   - PUR-003-SPLIT: 500 kg (removed from selection)
7. **New Total**: 2000 + 1500 + 1500 = **5000 kg** ✓
8. **Select Manufacturer**: "Rice Mill Sdn Bhd"
9. **Price**: RM 3.00 per kg
10. **Complete**: Sale saved, Receipt: SAL-2025-001

## Benefits

### 1. Data Safety
- No loss of tare weight records
- Survives page refresh, crashes, power failure
- Visual confirmation of data persistence

### 2. Accuracy
- Weight validation prevents mismatches
- Receipt splitting ensures exact weight matching
- Real-time weight difference calculation

### 3. Efficiency
- F3 shortcut for quick recall
- Multi-receipt selection
- Flexible receipt splitting

### 4. Traceability
- Links sales to purchase receipts
- Complete audit trail
- Receipt number generation

### 5. User Experience
- Visual weight indicators (green/red)
- Clear workflow steps
- Helpful alerts and messages

## Troubleshooting

### Issue: Weights Don't Match
**Solution**: Use receipt splitting to adjust weights

### Issue: Cannot Complete Sale
**Check**:
- Weight difference ≤ 0.5 kg?
- At least one receipt selected?
- Manufacturer selected?
- All required fields filled?

### Issue: Container Not in Recall List
**Cause**: Not weighed-in (tare not recorded)
**Solution**: Start new sale and enter tare weight first

### Issue: No Available Receipts
**Cause**: All purchase receipts already sold
**Solution**: Complete new purchases first

### Issue: Cannot Split Receipt
**Cause**: Receipt already split
**Solution**: Split a different receipt or remove and re-add receipts

## Color Coding

- **Yellow/Orange** 🟡: Tare weight (empty container)
- **Green** 🟢: Gross weight, Net weight (loaded container)
- **Blue** 🔵: Receipt numbers, totals
- **Red** 🔴: Weight mismatch warning

## Testing Checklist

- [ ] Enter tare weight and save
- [ ] Refresh page - container restored?
- [ ] Recall container (F3)
- [ ] Enter gross weight
- [ ] Select multiple receipts
- [ ] Check weight difference display
- [ ] Split a receipt
- [ ] Verify split creates two entries
- [ ] Remove a receipt
- [ ] Search and select manufacturer
- [ ] Complete sale with matched weights
- [ ] Verify sale saves successfully
- [ ] Check container removed from pending

---

**Status**: ✅ Complete Implementation  
**Version**: 1.0  
**Features**: 3/3 Parts Complete  
**Last Updated**: November 13, 2025

## Summary

The Sales workflow is now fully implemented with:
1. ✅ Container weigh-in/weigh-out with persistence
2. ✅ Purchase receipt selection
3. ✅ Receipt splitting for weight matching

All data is protected by localStorage auto-save, and the workflow guides users through each step with visual indicators and validation.
