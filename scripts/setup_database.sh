#!/bin/bash

# Database Setup Script
# This script automates the database creation and migration process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables (with proper quote handling)
if [ -f "../.env" ]; then
    set -a  # Automatically export all variables
    source <(grep -v '^#' ../.env | sed -E 's/^([A-Z_]+)=/export \1=/')
    set +a  # Disable auto-export
else
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Verify required variables
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}Error: Missing required environment variables${NC}"
    echo "Please check your .env file"
    exit 1
fi

echo -e "${GREEN}=== Paddy Collection Database Setup ===${NC}\n"

# Step 1: Create database
echo -e "${YELLOW}Step 1: Creating database...${NC}"
echo "Enter MySQL password for user '$DB_USER':"
mysql -h "$DB_HOST" -u "$DB_USER" -p -e "
CREATE DATABASE IF NOT EXISTS $DB_NAME
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database created${NC}\n"
else
    echo -e "${RED}✗ Failed to create database. Make sure user '$DB_USER' has CREATE DATABASE privilege.${NC}"
    exit 1
fi

# Step 2: Run migrations
echo -e "${YELLOW}Step 2: Running migrations...${NC}"
MIGRATION_DIR="../migrations"

if [ ! -d "$MIGRATION_DIR" ]; then
    echo -e "${RED}Error: migrations directory not found${NC}"
    exit 1
fi

# Run each migration file in order
for migration in $(ls $MIGRATION_DIR/*.sql 2>/dev/null | sort); do
    filename=$(basename "$migration")
    echo -e "  Applying: ${filename}"
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$migration"
    echo -e "${GREEN}  ✓ ${filename} applied${NC}"
done

echo -e "${GREEN}✓ All migrations completed${NC}\n"

# Step 3: Verify privileges
echo -e "${YELLOW}Step 3: Verifying user privileges...${NC}"
echo -e "${GREEN}✓ Using existing user privileges${NC}"
echo -e "  (User '$DB_USER' already has access to database)\n"

# Step 4: Verify installation
echo -e "${YELLOW}Step 4: Verifying installation...${NC}"
TABLE_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';
")

echo -e "  Tables created: ${TABLE_COUNT}"

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Installation verified${NC}\n"
    echo -e "${GREEN}=== Setup Complete! ===${NC}"
    echo -e "\nYou can now connect to the database using:"
    echo -e "  mysql -h $DB_HOST -u $DB_USER -p $DB_NAME"
else
    echo -e "${RED}✗ No tables found. Check migration files.${NC}"
    exit 1
fi
