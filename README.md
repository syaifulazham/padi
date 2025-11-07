# Paddy Harvest Collection Center - Database Blueprint

## 📋 Overview

Complete database design and implementation guide for the Paddy Harvest Collection Center Management System.

**Database Engine:** MySQL 8.0+  
**Character Set:** utf8mb4  
**Collation:** utf8mb4_unicode_ci  
**Storage Engine:** InnoDB

---

## 📚 Documentation Structure

### Core Documentation

1. **[00-QUICK-START.md](./00-QUICK-START.md)**
   - Quick setup guide
   - Environment configuration
   - Initial installation steps

2. **[01-SCHEMA-OVERVIEW.md](./01-SCHEMA-OVERVIEW.md)**
   - Entity relationship diagram
   - Table relationships
   - Database statistics
   - Design principles

3. **[02-CORE-TABLES.md](./02-CORE-TABLES.md)**
   - User management tables
   - Farmer management tables
   - Manufacturer management tables
   - Season management tables
   - Transaction tables (purchases & sales)

4. **[03-SUPPORTING-TABLES.md](./03-SUPPORTING-TABLES.md)**
   - Container & delivery management
   - Inventory management
   - Weighbridge management
   - Print configuration
   - System configuration
   - Audit & logging

5. **[04-INDEXES-OPTIMIZATION.md](./04-INDEXES-OPTIMIZATION.md)**
   - Index strategy
   - Performance optimization
   - Query optimization guidelines

6. **[05-TRIGGERS-PROCEDURES.md](./05-TRIGGERS-PROCEDURES.md)**
   - Stored procedures
   - Triggers for data integrity
   - Automated functions

7. **[06-VIEWS.md](./06-VIEWS.md)**
   - Reporting views
   - Summary views
   - Production data views

8. **[07-SAMPLE-DATA.md](./07-SAMPLE-DATA.md)**
   - Sample data inserts
   - Test data scripts

9. **[08-MIGRATIONS.md](./08-MIGRATIONS.md)**
   - Migration scripts
   - Migration strategy
   - Version control

10. **[09-BACKUP-RECOVERY.md](./09-BACKUP-RECOVERY.md)**
    - Backup strategy
    - Recovery procedures
    - Automated backup scripts

11. **[10-SECURITY.md](./10-SECURITY.md)**
    - User roles & permissions
    - Access control
    - Security best practices

12. **[11-MONITORING.md](./11-MONITORING.md)**
    - Health checks
    - Performance monitoring
    - Maintenance tasks

13. **[12-TESTING.md](./12-TESTING.md)**
    - Data validation queries
    - Testing procedures
    - Quality assurance

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>

# 2. Navigate to project folder
cd padi

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Create SQL migration files
# (See migrations/README.md for details)

# 5. Run setup script
cd scripts
./setup_database.sh

# 6. Verify installation
mysql -u your_db_user -p paddy_collection_db
```

## ⚠️ Security Note

- ✅ `.env` file is excluded from Git via `.gitignore`
- ✅ Use `.env.example` as template
- ⚠️ Never commit credentials to Git
- ⚠️ Change default passwords before production

---

## 📊 Database Statistics

### Tables Overview

| Category | Tables | Description |
|----------|--------|-------------|
| Core Business | 8 | Farmers, Manufacturers, Seasons, Grades |
| Transactions | 5 | Purchases, Sales, Mappings |
| Inventory | 2 | Stock, Movements |
| Container Management | 3 | Containers, Loading, Split History |
| Hardware Integration | 4 | Weighbridges, Printers, Templates |
| System | 5 | Settings, Audit, Users |
| **Total** | **35+** | **Plus views and procedures** |

### Expected Data Growth (Per Year)

| Table | Rows/Year | Retention |
|-------|-----------|-----------|
| purchase_transactions | ~8,000 | Permanent |
| sales_transactions | ~200 | Permanent |
| inventory_movements | ~8,500 | Permanent |
| weighing_logs | ~16,000 | 3 years |
| audit_logs | ~50,000 | 2 years |
| receipt_print_log | ~8,200 | 1 year |

---

## 🏗️ Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CORE ENTITIES                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  USERS ──┐                                                   │
│          │                                                   │
│          ├──> HARVESTING_SEASONS                             │
│          │         │                                         │
│          │         ├──> PURCHASE_TRANSACTIONS                │
│          │         │          │                              │
│          │         │          └──> FARMERS                   │
│          │         │                                         │
│          │         └──> SALES_TRANSACTIONS                   │
│          │                    │                              │
│          │                    └──> MANUFACTURERS             │
│          │                                                   │
│          └──> INVENTORY_STOCK                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technology Stack

- **Database:** MySQL 8.0+
- **Application:** Electron + React
- **ORM/Query Builder:** mysql2 (Node.js)
- **Migration Tool:** Custom migration scripts
- **Backup:** mysqldump + automated scripts

---

## 📖 Key Features

### ✅ Data Management
- Multi-season support (production, demo, training, testing)
- Complete traceability from farmer to manufacturer
- Real-time inventory tracking
- Receipt splitting for container loading

### ✅ Quality Control
- Quality grading system
- Moisture content tracking
- Foreign matter monitoring
- Automatic penalty calculations

### ✅ Hardware Integration
- Weighbridge serial port integration
- Multiple printer support (dot matrix, thermal, laser)
- Configurable receipt templates

### ✅ Security & Audit
- Role-based access control
- Complete audit trail
- User activity logging
- Transaction history

### ✅ Reporting
- Daily/weekly/monthly summaries
- Farmer performance reports
- Inventory status reports
- Financial summaries

---

## 🛠️ Installation Requirements

### Minimum Requirements
- MySQL 8.0 or higher
- 2GB RAM minimum
- 10GB disk space
- Linux/Windows Server

### Recommended Requirements
- MySQL 8.0.30+
- 8GB RAM
- 50GB SSD storage
- Ubuntu 22.04 LTS or Windows Server 2019+

---

## 📝 Configuration Files

```
database_blueprint/
├── README.md                          # This file
├── 00-QUICK-START.md                  # Quick setup guide
├── 01-SCHEMA-OVERVIEW.md              # Schema documentation
├── 02-CORE-TABLES.md                  # Core table definitions
├── 03-SUPPORTING-TABLES.md            # Supporting tables
├── 04-INDEXES-OPTIMIZATION.md         # Performance tuning
├── 05-TRIGGERS-PROCEDURES.md          # Stored logic
├── 06-VIEWS.md                        # Database views
├── 07-SAMPLE-DATA.md                  # Test data
├── 08-MIGRATIONS.md                   # Migration scripts
├── 09-BACKUP-RECOVERY.md              # Backup procedures
├── 10-SECURITY.md                     # Security configuration
├── 11-MONITORING.md                   # Monitoring setup
├── 12-TESTING.md                      # Testing procedures
├── .env.example                       # Environment template
├── scripts/
│   ├── setup_database.sh              # Setup automation
│   ├── backup.sh                      # Backup script
│   └── restore.sh                     # Restore script
└── migrations/
    ├── 001_create_base_tables.sql
    ├── 002_create_season_tables.sql
    ├── 003_create_transaction_tables.sql
    └── ...
```

---

## 🤝 Contributing

When making changes to the database:

1. Create a new migration file
2. Test in development environment
3. Update relevant documentation
4. Run validation queries
5. Create backup before applying to production

---

## 📞 Support

For issues or questions:

1. Check the documentation files
2. Review the testing procedures
3. Check the troubleshooting section in each file
4. Contact the development team

---

## 📄 License

[Your License Here]

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-01 | Initial database design |
| 1.1.0 | 2025-02-01 | Added container management |
| 1.2.0 | 2025-03-01 | Added receipt splitting feature |

---

## ✅ Pre-Production Checklist

- [ ] All tables created successfully
- [ ] Indexes optimized
- [ ] Triggers and procedures tested
- [ ] Sample data loaded
- [ ] Backup system configured
- [ ] Security settings applied
- [ ] Monitoring enabled
- [ ] Documentation complete
- [ ] User training completed
- [ ] Go-live date scheduled

---

**Last Updated:** 2025-11-06  
**Maintained By:** Development Team  
**Database Version:** 1.2.0
