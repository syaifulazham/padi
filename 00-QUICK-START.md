# Quick Start Guide

## 🚀 Database Setup in 10 Minutes

### Prerequisites

✅ MySQL 8.0+ installed  
✅ Database client tool (MySQL Workbench or command line)  
✅ Administrative access to MySQL server  
✅ Basic knowledge of SQL

---

## Step 1: Create Database

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create database
CREATE DATABASE IF NOT EXISTS paddy_collection_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Use the database
USE paddy_collection_db;

-- Set session variables
SET NAMES utf8mb4;
SET time_zone = '+08:00';  -- Malaysia timezone
```

---

## Step 2: Create Application User

```sql
-- Create application user
CREATE USER IF NOT EXISTS 'paddy_app'@'localhost' 
  IDENTIFIED BY 'YourSecurePassword123!';

-- Grant privileges
GRANT SELECT, INSERT, UPDATE ON paddy_collection_db.* 
  TO 'paddy_app'@'localhost';
GRANT EXECUTE ON paddy_collection_db.* 
  TO 'paddy_app'@'localhost';
FLUSH PRIVILEGES;
```

---

## Step 3: Run Migration Scripts

```bash
# Navigate to migrations folder
cd migrations/

# Apply migrations in order
mysql -u root -p paddy_collection_db < 001_create_base_tables.sql
mysql -u root -p paddy_collection_db < 002_create_season_tables.sql
mysql -u root -p paddy_collection_db < 003_create_transaction_tables.sql
mysql -u root -p paddy_collection_db < 004_create_container_tables.sql
mysql -u root -p paddy_collection_db < 005_create_inventory_tables.sql
mysql -u root -p paddy_collection_db < 006_create_hardware_tables.sql
mysql -u root -p paddy_collection_db < 007_create_system_tables.sql
mysql -u root -p paddy_collection_db < 008_create_views.sql
mysql -u root -p paddy_collection_db < 009_create_triggers_procedures.sql
mysql -u root -p paddy_collection_db < 010_insert_sample_data.sql
```

**Or use the automated script:**

```bash
./scripts/setup_database.sh
```

---

## Step 4: Configure Environment

Create `.env` file in your Electron app root:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=paddy_collection_db
DB_USER=paddy_app
DB_PASSWORD=YourSecurePassword123!

# Connection Pool
DB_CONNECTION_LIMIT=10
DB_WAIT_FOR_CONNECTIONS=true
DB_CONNECTION_TIMEOUT=10000
```

---

## Step 5: Test Connection

```javascript
// test-connection.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('✅ Database connected successfully!');
    
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Users table accessible: ${rows[0].count} users`);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
```

Run test:
```bash
node test-connection.js
```

---

## Step 6: Verify Installation

```sql
-- Check tables
SELECT TABLE_NAME, TABLE_ROWS 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'paddy_collection_db'
ORDER BY TABLE_NAME;

-- Should show 35+ tables

-- Check sample data
SELECT COUNT(*) FROM farmers;           -- Should have 3 farmers
SELECT COUNT(*) FROM manufacturers;     -- Should have 2 manufacturers
SELECT COUNT(*) FROM paddy_grades;      -- Should have 5 grades
SELECT COUNT(*) FROM harvesting_seasons; -- Should have 1 season
```

---

## Step 7: Configure Backup

```bash
# Create backup directory
sudo mkdir -p /var/backups/mysql

# Add to crontab (daily backup at 2 AM)
crontab -e

# Add this line:
0 2 * * * /usr/bin/mysqldump -u root -pYourPassword paddy_collection_db | gzip > /var/backups/mysql/paddy_$(date +\%Y\%m\%d).sql.gz
```

---

## Common Issues & Solutions

### Issue 1: "Access denied for user"

**Solution:**
```sql
-- Reset password
ALTER USER 'paddy_app'@'localhost' 
  IDENTIFIED BY 'NewSecurePassword123!';
FLUSH PRIVILEGES;
```

### Issue 2: "Unknown database"

**Solution:**
```sql
-- Recreate database
CREATE DATABASE paddy_collection_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### Issue 3: "Table already exists"

**Solution:**
```sql
-- Drop and recreate (WARNING: deletes all data)
DROP DATABASE IF EXISTS paddy_collection_db;
-- Then run Step 1 again
```

### Issue 4: Character encoding issues

**Solution:**
```sql
-- Set correct character set
ALTER DATABASE paddy_collection_db 
  CHARACTER SET = utf8mb4 
  COLLATE = utf8mb4_unicode_ci;
```

### Issue 5: Connection timeout

**Solution:**
```ini
# Edit my.cnf or my.ini
[mysqld]
connect_timeout = 10
wait_timeout = 600
interactive_timeout = 600
```

---

## Next Steps

1. ✅ Database created
2. ✅ Tables created
3. ✅ Sample data loaded
4. ✅ Connection tested

**Now you can:**

- Review the full schema: [01-SCHEMA-OVERVIEW.md](./01-SCHEMA-OVERVIEW.md)
- Understand core tables: [02-CORE-TABLES.md](./02-CORE-TABLES.md)
- Configure backups: [09-BACKUP-RECOVERY.md](./09-BACKUP-RECOVERY.md)
- Set up monitoring: [11-MONITORING.md](./11-MONITORING.md)

---

## Quick Reference Commands

```bash
# Connect to database
mysql -u paddy_app -p paddy_collection_db

# Backup database
mysqldump -u root -p paddy_collection_db > backup.sql

# Restore database
mysql -u root -p paddy_collection_db < backup.sql

# Check database size
mysql -u root -p -e "SELECT table_schema AS 'Database', 
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' 
  FROM information_schema.tables 
  WHERE table_schema = 'paddy_collection_db' 
  GROUP BY table_schema;"

# Export query to CSV
mysql -u paddy_app -p paddy_collection_db -e "SELECT * FROM farmers" 
  > farmers.csv

# Show table structure
mysql -u paddy_app -p -e "DESCRIBE paddy_collection_db.purchase_transactions;"
```

---

## Performance Tips

1. **Use connection pooling** (already configured in .env)
2. **Enable query cache** (MySQL 5.7 only)
3. **Regular optimization:**
   ```sql
   OPTIMIZE TABLE purchase_transactions;
   OPTIMIZE TABLE sales_transactions;
   ```
4. **Monitor slow queries:**
   ```sql
   SET GLOBAL slow_query_log = 'ON';
   SET GLOBAL long_query_time = 2;
   ```

---

## Security Checklist

- [ ] Changed default root password
- [ ] Created application user with limited privileges
- [ ] Disabled remote root access
- [ ] Enabled binary logging
- [ ] Configured firewall rules
- [ ] Set up SSL/TLS (for remote connections)
- [ ] Regular security updates

---

## Support

If you encounter issues:

1. Check MySQL error log: `/var/log/mysql/error.log`
2. Review this guide's troubleshooting section
3. Check [12-TESTING.md](./12-TESTING.md) for validation queries
4. Contact development team

---

**Setup Time:** ~10 minutes  
**Difficulty:** ⭐⭐☆☆☆ (Beginner-Intermediate)  
**Status:** Production Ready ✅
