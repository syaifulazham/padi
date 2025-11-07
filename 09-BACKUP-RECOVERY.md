# Backup & Recovery

## 💾 Backup Strategy

### Daily Backup
```bash
mysqldump -u root -p paddy_collection_db > backup_$(date +%Y%m%d).sql
```

### Compressed Backup
```bash
mysqldump -u root -p paddy_collection_db | gzip > backup.sql.gz
```

### Automated Backup (Cron)
```bash
# Daily at 2 AM
0 2 * * * mysqldump -u root -p paddy_collection_db | gzip > /backups/paddy_$(date +\%Y\%m\%d).sql.gz
```

## 🔄 Recovery

### Restore from Backup
```bash
mysql -u root -p paddy_collection_db < backup.sql
```

### Restore from Compressed
```bash
gunzip < backup.sql.gz | mysql -u root -p paddy_collection_db
```

---
**See comprehensive blueprint for complete backup procedures**
