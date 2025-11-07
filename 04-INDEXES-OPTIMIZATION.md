# Indexes & Optimization

## 📊 Index Strategy

### Primary Indexes
All tables use AUTO_INCREMENT primary keys:
```sql
table_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY
```

### Foreign Key Indexes
Automatically created on all foreign key relationships.

### Composite Indexes
For common query patterns:
```sql
-- Purchase queries by season and date
CREATE INDEX idx_purchase_season_date 
ON purchase_transactions(season_id, transaction_date);

-- Sales queries  
CREATE INDEX idx_sales_season_date 
ON sales_transactions(season_id, transaction_date);
```

### Full-Text Search Indexes
```sql
-- Farmer search
ALTER TABLE farmers 
ADD FULLTEXT INDEX ft_farmer_search (name, nric, address, lot_number);

-- Manufacturer search
ALTER TABLE manufacturers 
ADD FULLTEXT INDEX ft_manufacturer_search (company_name, contact_person);
```

## ⚡ Performance Optimization

### Regular Maintenance
```sql
-- Optimize tables monthly
OPTIMIZE TABLE purchase_transactions;
OPTIMIZE TABLE sales_transactions;

-- Analyze tables weekly
ANALYZE TABLE purchase_transactions;
```

### Query Optimization
```sql
-- Use EXPLAIN to check query performance
EXPLAIN SELECT * FROM purchase_transactions 
WHERE season_id = 1 AND transaction_date >= '2025-01-01';
```

### Table Partitioning
Large tables partitioned by year for better performance.

---
**See comprehensive blueprint for complete index definitions and optimization strategies**
