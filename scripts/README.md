# Database Scripts

This folder contains automation scripts for database management.

## Available Scripts

### setup_database.sh
Automated database setup script that:
- Creates the database
- Creates application user
- Runs all migration files in order
- Verifies installation

**Usage:**
```bash
./setup_database.sh
```

### backup.sh
Database backup automation script.

**Usage:**
```bash
./backup.sh [backup_name]
```

**Features:**
- Creates compressed backups
- Timestamps each backup
- Stores in `../backups/` directory

### restore.sh
Database restore from backup.

**Usage:**
```bash
./restore.sh [backup_file]
```

## Requirements

- MySQL 8.0+ installed
- Bash shell
- MySQL client tools
- Appropriate permissions

## Configuration

Scripts read from `../.env` file for database credentials:
- DB_HOST
- DB_PORT
- DB_NAME
- DB_USER
- DB_PASSWORD

## Status

⚠️ **Scripts need to be created.**

Templates are provided in the documentation (00-QUICK-START.md).
