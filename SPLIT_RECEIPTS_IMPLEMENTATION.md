# Split Receipts Implementation

## Overview
Split receipts allow you to divide a purchase receipt into smaller portions when needed for sales. This is useful when a single purchase receipt contains more weight than what fits in a sales container.

## Database Schema

### New Columns Added to `purchase_transactions`

```sql
parent_transaction_id INT UNSIGNED NULL
  - References the original transaction if this is a split portion
  - NULL for original receipts, set for split children

is_split_parent BOOLEAN DEFAULT FALSE
  - TRUE if this receipt has been split into child receipts
  - The parent receipt's weight is reduced when split

split_date DATETIME NULL
  - Timestamp when the split was performed

split_by INT UNSIGNED NULL
  - User ID who performed the split operation
```

## How It Works

### Creating a Split Receipt

1. **API Call**: `window.electronAPI.purchases.createSplit(parentTransactionId, splitWeightKg, userId)`

2. **Process**:
   - Validates split weight is valid (0 < split < parent weight)
   - Checks if parent has available unsold quantity
   - Creates a new child receipt with the split weight
   - Updates parent receipt to reduce its weight by the split amount
   - Maintains all original properties (farmer, grade, price, etc.)
   - Generates receipt number: `{PARENT_RECEIPT}-SPLIT-{timestamp}`

3. **Result**:
   ```javascript
   {
     success: true,
     data: {
       split: { /* new split receipt */ },
       parent: {
         transaction_id: 123,
         receipt_number: "PUR-2025-001",
         new_weight_kg: 500.00  // reduced weight
       }
     }
   }
   ```

### Example Scenario

**Original Receipt:**
- Receipt: `PUR-2025-001`
- Weight: 1000 kg
- Farmer: Ahmad
- Grade: Premium

**Split 400 kg:**

**Result - Parent (Updated):**
- Receipt: `PUR-2025-001`
- Weight: 600 kg  ← reduced
- is_split_parent: TRUE
- Notes: "Split on 2025-11-24... Created split receipt: PUR-2025-001-SPLIT-..."

**Result - Child (New):**
- Receipt: `PUR-2025-001-SPLIT-1732425600000`
- Weight: 400 kg  ← split portion
- parent_transaction_id: 123
- split_date: 2025-11-24 11:00:00
- Farmer: Ahmad (inherited)
- Grade: Premium (inherited)
- All other properties inherited proportionally

## Benefits

1. **Database Integrity**: All splits are tracked in the database
2. **Traceability**: Can trace split receipts back to original
3. **Accurate Inventory**: Weights are properly accounted for
4. **Audit Trail**: Who split, when, and how much
5. **Prevents Duplication**: Parent weight is reduced automatically

## Usage in Sales Flow

When creating a sale and the container weight doesn't match available receipts exactly:

```javascript
// Example: Container needs exactly 450 kg, but receipt has 600 kg
const result = await window.electronAPI.purchases.createSplit(
  parentReceiptId,  // Receipt with 600 kg
  450,              // Amount needed
  currentUserId     // Who is performing the split
);

// Use result.data.split in the sale
// The parent now has 150 kg remaining for future sales
```

## Migration

Run migration file: `migrations/011_add_split_receipt_tracking.sql`

This will:
- Add the new columns to track splits
- Add foreign keys for referential integrity
- Add indexes for performance
- Update any existing split receipts (if any)

## Querying

### Find all split children of a receipt:
```sql
SELECT * FROM purchase_transactions
WHERE parent_transaction_id = ?
```

### Find original parent of a split:
```sql
SELECT pt.*, parent.receipt_number as parent_receipt
FROM purchase_transactions pt
LEFT JOIN purchase_transactions parent ON pt.parent_transaction_id = parent.transaction_id
WHERE pt.transaction_id = ?
```

### Find all receipts that have been split:
```sql
SELECT * FROM purchase_transactions
WHERE is_split_parent = TRUE
```

## Important Notes

1. **Cannot split sold receipts**: System checks available quantity before splitting
2. **Proportional values**: Penalties, bonuses calculated proportionally
3. **Immutable original**: Split doesn't modify original transaction_date or farmer
4. **Single operation**: Split is atomic (database transaction)
5. **Auto-reload needed**: After split, reload available receipts to see both portions
