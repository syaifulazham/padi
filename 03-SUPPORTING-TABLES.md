# Supporting Tables

Container management, inventory, weighbridge, and print configuration tables.

## Table Overview

### Container Management
- **delivery_containers** - Container tracking for deliveries
- **container_loading_items** - Items loaded into containers
- **receipt_split_history** - Receipt splitting audit trail

### Inventory Management
- **inventory_stock** - Current stock levels by grade and season
- **inventory_movements** - Stock movement transactions

### Hardware Integration
- **weighbridges** - Weighbridge configuration
- **weighing_logs** - Weight measurement records
- **printer_configurations** - Printer setup
- **receipt_templates** - Print templates
- **user_print_preferences** - User printer preferences
- **receipt_print_log** - Print history

### System Tables
- **system_settings** - Application configuration
- **system_print_settings** - Print system settings
- **audit_logs** - System audit trail

## SQL Definitions

Complete CREATE TABLE statements should be in:
- `migrations/004_create_container_tables.sql`
- `migrations/005_create_inventory_tables.sql`
- `migrations/006_create_hardware_tables.sql`
- `migrations/007_create_system_tables.sql`

---

**Previous:** [02-CORE-TABLES.md](./02-CORE-TABLES.md)  
**Next:** [04-INDEXES-OPTIMIZATION.md](./04-INDEXES-OPTIMIZATION.md)
