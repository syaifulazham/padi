# Database Migrations

This folder contains SQL migration scripts for setting up the database schema.

## Migration Files

Execute these files in numerical order:

1. **001_create_base_tables.sql** - Base tables (users, farmers, manufacturers)
2. **002_create_season_tables.sql** - Season management tables
3. **003_create_transaction_tables.sql** - Purchase and sales transactions
4. **004_create_container_tables.sql** - Container and delivery management
5. **005_create_inventory_tables.sql** - Inventory tracking tables
6. **006_create_hardware_tables.sql** - Weighbridge and printer tables
7. **007_create_system_tables.sql** - System configuration and audit tables
8. **008_create_views.sql** - Database views for reporting
9. **009_create_triggers_procedures.sql** - Triggers and stored procedures
10. **010_insert_sample_data.sql** - Sample/test data

## Usage

### Manual Execution

```bash
mysql -u root -p paddy_collection_db < 001_create_base_tables.sql
mysql -u root -p paddy_collection_db < 002_create_season_tables.sql
# ... continue with remaining files
```

### Automated Execution

Use the setup script:
```bash
cd ../scripts
./setup_database.sh
```

## Creating Migration Files

Each migration file should:
- Be idempotent (can be run multiple times safely)
- Include proper error handling
- Have descriptive comments
- Follow MySQL 8.0+ syntax

### Template

```sql
-- Migration: [Description]
-- Created: YYYY-MM-DD

USE paddy_collection_db;

-- Drop existing if needed (development only)
-- DROP TABLE IF EXISTS table_name;

-- Create table
CREATE TABLE IF NOT EXISTS table_name (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- columns here
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Status

⚠️ **Migration files need to be created with actual SQL code.**

Refer to the documentation files (02-CORE-TABLES.md, 03-SUPPORTING-TABLES.md, etc.) for table structure references.
