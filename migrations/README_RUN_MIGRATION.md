# Running Database Migrations

## Split Receipt Tracking Migration

To enable split receipt tracking in the database, you need to run migration `011_add_split_receipt_tracking.sql`.

### How to Run

**Option 1: Using MySQL Client**
```bash
mysql -u your_username -p paddy_collection_db < migrations/011_add_split_receipt_tracking.sql
```

**Option 2: Using MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your database
3. Open the file: `migrations/011_add_split_receipt_tracking.sql`
4. Click "Execute" (lightning bolt icon)

**Option 3: Using phpMyAdmin**
1. Login to phpMyAdmin
2. Select database `paddy_collection_db`
3. Click "SQL" tab
4. Copy and paste the contents of `011_add_split_receipt_tracking.sql`
5. Click "Go"

### What This Migration Does

✅ Adds `parent_transaction_id` column - tracks which receipt was split from  
✅ Adds `is_split_parent` column - marks receipts that have been split  
✅ Adds `split_date` column - when the split occurred  
✅ Adds `split_by` column - which user performed the split  
✅ Adds foreign keys for data integrity  
✅ Adds indexes for better query performance  

### Verification

After running the migration, verify it worked:

```sql
-- Check if new columns exist
DESCRIBE purchase_transactions;

-- Should show:
-- parent_transaction_id | int unsigned | YES | MUL | NULL
-- is_split_parent      | tinyint(1)   | YES |     | 0
-- split_date           | datetime     | YES |     | NULL
-- split_by             | int unsigned | YES | MUL | NULL
```

### Important Notes

⚠️ **Backup First**: Always backup your database before running migrations  
⚠️ **Production**: Test in development environment first  
⚠️ **No Data Loss**: This migration only adds columns, doesn't delete anything  

### Rollback (if needed)

If you need to undo this migration:

```sql
USE paddy_collection_db;

ALTER TABLE purchase_transactions
DROP FOREIGN KEY fk_split_by,
DROP FOREIGN KEY fk_parent_transaction,
DROP INDEX idx_is_split_parent,
DROP INDEX idx_parent_transaction_id,
DROP COLUMN split_by,
DROP COLUMN split_date,
DROP COLUMN is_split_parent,
DROP COLUMN parent_transaction_id;
```
