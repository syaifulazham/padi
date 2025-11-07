# Core Tables

## 📋 Overview

This file contains the CREATE TABLE statements for all core business tables. For the complete SQL code, refer to the comprehensive database blueprint provided earlier.

## 🗂️ Table List

### User Management
1. **users** - System users and authentication

### Farmer Management  
2. **farmers** - Farmer master data
3. **farmer_documents** - Document attachments (coupon cards, etc.)

### Manufacturer Management
4. **manufacturers** - Paddy buyers

### Grade & Season Management
5. **paddy_grades** - Quality grades (Premium, A, B, C, Reject)
6. **harvesting_seasons** - Season records (production, demo, training)
7. **season_type_config** - Season type configuration
8. **season_grade_standards** - Quality standards per season
9. **season_grade_pricing** - Pricing per grade per season
10. **season_closure_summary** - Season summaries

### Transaction Management
11. **purchase_transactions** - Purchases from farmers
12. **purchase_documents** - Purchase attachments
13. **sales_transactions** - Sales to manufacturers
14. **sales_purchase_mapping** - Traceability

## 📝 Quick Reference

### Core Table Schema Pattern

All core tables follow this pattern:
```sql
CREATE TABLE table_name (
    table_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- Business columns
    status ENUM(...) NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    -- Indexes
    -- Foreign keys
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 📖 Detailed SQL Definitions

**Location:** The complete CREATE TABLE statements should be organized in migration files:

- `migrations/001_create_base_tables.sql` - Users, farmers, manufacturers
- `migrations/002_create_season_tables.sql` - Seasons, grades, pricing
- `migrations/003_create_transaction_tables.sql` - Purchases and sales

**Note:** Migration files need to be created with actual SQL code.

---

**Next:** [03-SUPPORTING-TABLES.md](./03-SUPPORTING-TABLES.md)  
**Related:** [01-SCHEMA-OVERVIEW.md](./01-SCHEMA-OVERVIEW.md)
