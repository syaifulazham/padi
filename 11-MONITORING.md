# Monitoring & Health Checks

## 🏥 Health Check Queries

### Database Size
```sql
SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'paddy_collection_db';
```

### Table Counts
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'paddy_collection_db';
```

### Daily Transactions
```sql
SELECT COUNT(*) FROM purchase_transactions 
WHERE transaction_date = CURRENT_DATE;
```

### Active Connections
```sql
SELECT COUNT(*) FROM information_schema.processlist
WHERE db = 'paddy_collection_db';
```

## 📊 Automated Monitoring

### Health Check Event
```sql
CREATE EVENT evt_daily_health_check
ON SCHEDULE EVERY 1 DAY
DO CALL sp_health_check();
```

---
**See comprehensive blueprint for complete monitoring setup**
