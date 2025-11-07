# Schema Overview

## 📊 Database Architecture

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PADDY COLLECTION SYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   USERS ──────┐                                                             │
│       │       │                                                             │
│       │       ├──────> HARVESTING_SEASONS ◄────┬─────────────────┐         │
│       │       │              │                  │                 │         │
│       │       │              ├─► SEASON_GRADE_STANDARDS           │         │
│       │       │              ├─► SEASON_GRADE_PRICING             │         │
│       │       │              │                                    │         │
│       │       │        ┌─────┴────────┐                          │         │
│       │       │        │              │                          │         │
│       │       │        ▼              ▼                          │         │
│       │       │   PURCHASE_TRANS   SALES_TRANS ◄──┐             │         │
│       │       │        │              │            │             │         │
│       │       │        │              │            │             │         │
│   FARMERS ◄───┼────────┘              │      DELIVERY_CONTAINERS │         │
│       │       │                       │            │             │         │
│       ├─► FARMER_DOCUMENTS            │            │             │         │
│       │                               │            │             │         │
│       └─► PURCHASE_DOCUMENTS          │      CONTAINER_LOADING   │         │
│                                       │            │             │         │
│                                       └────────────┘             │         │
│                                                                  │         │
│   MANUFACTURERS ◄────────────────────────────────────────────────┘         │
│                                                                             │
│   PADDY_GRADES ──────┬──────────────────────────────────┐                  │
│                      │                                  │                  │
│                      ├──> SEASON_GRADE_PRICING          │                  │
│                      ├──> PURCHASE_TRANSACTIONS         │                  │
│                      ├──> SALES_TRANSACTIONS            │                  │
│                      └──> INVENTORY_STOCK               │                  │
│                                                         │                  │
│   INVENTORY_STOCK ◄──────────────────────────────────────┘                 │
│         │                                                                   │
│         └──> INVENTORY_MOVEMENTS                                           │
│                                                                             │
│   WEIGHBRIDGES ──> WEIGHING_LOGS                                           │
│                                                                             │
│   PRINTER_CONFIGURATIONS ──┐                                               │
│   RECEIPT_TEMPLATES ───────┼──> USER_PRINT_PREFERENCES                     │
│                            └──> RECEIPT_PRINT_LOG                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📈 Database Statistics

### Tables by Category

| Category | Tables | Purpose |
|----------|--------|---------|
| **User Management** | 1 | Authentication and access control |
| **Farmer Management** | 2 | Farmer records and documents |
| **Manufacturer Management** | 1 | Buyer/manufacturer information |
| **Season Management** | 5 | Seasons, grades, pricing, standards |
| **Transactions** | 3 | Purchases, sales, mappings |
| **Container Management** | 3 | Delivery containers and loading |
| **Inventory** | 2 | Stock levels and movements |
| **Hardware** | 4 | Weighbridges, printers, templates |
| **System Configuration** | 4 | Settings, audit logs |
| **Print Management** | 4 | Printer config and logging |
| **Total** | **35** | **Core tables** |
| **Views** | **10+** | **Reporting views** |

### Expected Growth (Annual)

| Table | Estimated Rows/Year | Storage/Year | Retention |
|-------|---------------------|--------------|-----------|
| farmers | +500 | 100 KB | Permanent |
| manufacturers | +20 | 10 KB | Permanent |
| harvesting_seasons | +2 | <1 KB | Permanent |
| purchase_transactions | +8,000 | 2 MB | Permanent |
| sales_transactions | +200 | 50 KB | Permanent |
| inventory_movements | +8,500 | 1.5 MB | Permanent |
| delivery_containers | +50 | 20 KB | Permanent |
| weighing_logs | +16,000 | 3 MB | 3 years |
| audit_logs | +50,000 | 10 MB | 2 years |
| receipt_print_log | +8,200 | 1 MB | 1 year |
| **Total Growth/Year** | **~90,000 rows** | **~20 MB** | **Mixed** |

### 5-Year Projection

| Metric | Value |
|--------|-------|
| Total Rows | ~450,000 |
| Total Size | ~100-150 MB |
| Core Data | ~50 MB (permanent) |
| Logs | ~50-100 MB (rotating) |

## 🗂️ Table Groups

### Core Business Tables (8 tables)

**Purpose:** Essential business entities

- `users` - System users
- `farmers` - Paddy farmers/suppliers
- `manufacturers` - Paddy buyers
- `paddy_grades` - Quality grades
- `harvesting_seasons` - Season management
- `season_grade_standards` - Quality standards per season
- `season_grade_pricing` - Pricing per grade per season
- `season_closure_summary` - Season financial summaries

### Transaction Tables (5 tables)

**Purpose:** Business transactions and traceability

- `purchase_transactions` - Purchases from farmers
- `purchase_documents` - Purchase attachments
- `sales_transactions` - Sales to manufacturers
- `sales_purchase_mapping` - Traceability mapping
- `receipt_split_history` - Split receipt audit trail

### Inventory Tables (2 tables)

**Purpose:** Stock tracking

- `inventory_stock` - Current stock levels
- `inventory_movements` - Movement history

### Container Management (3 tables)

**Purpose:** Delivery and loading operations

- `delivery_containers` - Container/shipment records
- `container_loading_items` - Line items per container
- `receipt_split_history` - Receipt splitting for partial loads

### Hardware Integration (4 tables)

**Purpose:** Physical device management

- `weighbridges` - Scale configuration
- `weighing_logs` - Weighing operation logs
- `printer_configurations` - Printer setup
- `receipt_templates` - Print templates

### System Tables (7 tables)

**Purpose:** Configuration and audit

- `system_settings` - Global settings
- `system_print_settings` - Print configuration
- `season_type_config` - Season type settings
- `user_print_preferences` - User print defaults
- `receipt_print_log` - Print job history
- `farmer_documents` - Document storage
- `audit_logs` - System audit trail

## 🔗 Key Relationships

### 1. Season → Transactions
```
harvesting_seasons (1) ──→ (N) purchase_transactions
harvesting_seasons (1) ──→ (N) sales_transactions
```

### 2. Farmer → Purchases
```
farmers (1) ──→ (N) purchase_transactions
farmers (1) ──→ (N) farmer_documents
```

### 3. Manufacturer → Sales
```
manufacturers (1) ──→ (N) sales_transactions
manufacturers (1) ──→ (N) delivery_containers
```

### 4. Grades → Pricing & Transactions
```
paddy_grades (1) ──→ (N) season_grade_pricing
paddy_grades (1) ──→ (N) purchase_transactions
paddy_grades (1) ──→ (N) sales_transactions
```

### 5. Containers → Sales
```
delivery_containers (1) ──→ (N) container_loading_items
container_loading_items (N) ──→ (1) sales_transactions
```

### 6. Traceability Chain
```
purchase_transactions ──→ sales_purchase_mapping ──→ sales_transactions
                                    │
                                    ↓
                          delivery_containers ──→ manufacturer
```

## 🎯 Design Principles

### 1. Data Integrity
- Foreign key constraints on all relationships
- Check constraints for business rules
- NOT NULL constraints on critical fields
- UNIQUE constraints on business keys

### 2. Audit Trail
- `created_at`, `created_by` on all core tables
- `updated_at`, `updated_by` for modification tracking
- Complete `audit_logs` table for sensitive operations
- Triggers for automatic audit logging

### 3. Performance
- Indexes on all foreign keys
- Composite indexes for common queries
- Partitioning on large tables (by year)
- Views for complex reporting queries

### 4. Flexibility
- Season types (production, demo, training, testing)
- JSON fields for extensible configuration
- Template system for receipts
- Configurable quality standards per season

### 5. Traceability
- Complete chain from farmer to manufacturer
- Sales-purchase mapping
- Container loading history
- Receipt splitting with parent-child relationships

## 📊 Data Flow

### Purchase Flow
```
1. Farmer arrives with lorry
2. Weighbridge: Capture gross weight
3. Unload paddy
4. Weighbridge: Capture tare weight
5. System: Calculate net weight
6. Quality check: Assess grade, moisture, etc.
7. System: Calculate amount (with penalties)
8. Generate receipt
9. Update inventory (+)
10. Print receipt for farmer
```

### Sales Flow
```
1. Select manufacturer order
2. Plan container loading
3. Select sales receipts to load
4. If receipt too large: Split receipt
5. Load container (update items)
6. Weigh loaded container
7. Generate delivery order
8. Update inventory (-)
9. Dispatch to manufacturer
10. Track payment
```

### Inventory Flow
```
Purchase → inventory_movements (+) → inventory_stock
Sales → inventory_movements (-) → inventory_stock
Adjustment → inventory_movements (±) → inventory_stock
```

## 🔐 Security Model

### User Roles
- **Admin:** Full access
- **Manager:** Read/Write, no delete
- **Operator:** Limited write (transactions only)
- **Accountant:** Read-only financial data
- **Viewer:** Read-only all data

### Row-Level Security
- Users can only see/edit their own records (via views)
- Season-based filtering (active season only)
- Archive filtering (exclude archived by default)

## 📝 Naming Conventions

### Tables
- Lowercase with underscores
- Plural nouns: `farmers`, `purchases`
- Descriptive names: `season_grade_pricing`

### Columns
- Lowercase with underscores
- Suffix with type: `_id`, `_date`, `_kg`, `_at`
- Consistent naming: `created_at`, `updated_at`

### Foreign Keys
- `fk_[table]_[referenced_table]_[column]`
- Example: `fk_purchase_farmer_id`

### Indexes
- `idx_[table]_[columns]`
- Example: `idx_purchase_season_date`

### Views
- `vw_[description]`
- Example: `vw_daily_purchase_summary`

### Procedures
- `sp_[action]_[entity]`
- Example: `sp_create_season`

---

**Related Files:**
- [02-CORE-TABLES.md](./02-CORE-TABLES.md) - Detailed table definitions
- [04-INDEXES-OPTIMIZATION.md](./04-INDEXES-OPTIMIZATION.md) - Performance tuning
- [README.md](./README.md) - Main documentation

**Last Updated:** 2025-11-06
