# Testing & Validation

## ✅ Data Validation Queries

### Check for Orphaned Records
```sql
SELECT 'Orphaned Purchases', COUNT(*)
FROM purchase_transactions pt
WHERE NOT EXISTS (SELECT 1 FROM farmers f WHERE f.farmer_id = pt.farmer_id);
```

### Check Negative Inventory
```sql
SELECT * FROM inventory_stock 
WHERE current_stock_kg < 0;
```

### Check Weight Calculation
```sql
SELECT purchase_id, 
       (weight_in_kg - weight_out_kg) as calculated,
       net_weight_kg,
       ABS(net_weight_kg - (weight_in_kg - weight_out_kg)) as difference
FROM purchase_transactions
WHERE ABS(net_weight_kg - (weight_in_kg - weight_out_kg)) > 0.01;
```

### Check Duplicate Receipts
```sql
SELECT receipt_number, COUNT(*) 
FROM purchase_transactions 
GROUP BY receipt_number 
HAVING COUNT(*) > 1;
```

### Verify Inventory Balance
```sql
SELECT season_name, grade_name,
       SUM(purchases) as total_in,
       SUM(sales) as total_out,
       current_stock_kg
FROM inventory_stock;
```

---
**See comprehensive blueprint for complete testing procedures**
