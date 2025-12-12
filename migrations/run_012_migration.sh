#!/bin/bash

# Migration Script for 012_alter_farmers_table
# Run this script to apply the database changes

echo "====================================="
echo "Running Migration 012"
echo "Altering Farmers Table"
echo "====================================="

# Database credentials
DB_USER="azham"
DB_PASSWORD="DBAzham231"
DB_NAME="paddy_collection_db"
DB_HOST="localhost"

# Run the migration
mysql -u"$DB_USER" -p"$DB_PASSWORD" -h"$DB_HOST" "$DB_NAME" < 012_alter_farmers_table.sql

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Changes applied:"
    echo "  1. Renamed farm_size_hectares → farm_size_acres"
    echo "  2. Added bank2_name column"
    echo "  3. Added bank2_account_number column"
    echo ""
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please check the error messages above."
    echo ""
    exit 1
fi
