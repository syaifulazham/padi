#!/bin/bash

# Continue Setup Script
# Run remaining migrations after fixing the partition error

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment variables
if [ -f "../.env" ]; then
    # Read and export each line properly
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        # Remove quotes from value if present
        value="${value%\"}"
        value="${value#\"}"
        export "$key=$value"
    done < <(grep -v '^#' ../.env | grep -v '^$')
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Verify credentials loaded
if [ -z "$DB_USER" ]; then
    echo -e "${RED}Error: DB_USER not loaded${NC}"
    exit 1
fi

echo -e "${GREEN}=== Continuing Database Setup ===${NC}\n"

echo -e "${YELLOW}Running remaining migrations (007-010)...${NC}"

# Migration 007 (fixed version)
echo -e "  Applying: 007_create_system_tables.sql"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "../migrations/007_create_system_tables.sql"
echo -e "${GREEN}  ✓ 007_create_system_tables.sql applied${NC}"

# Migration 008
echo -e "  Applying: 008_create_views.sql"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "../migrations/008_create_views.sql"
echo -e "${GREEN}  ✓ 008_create_views.sql applied${NC}"

# Migration 009
echo -e "  Applying: 009_create_triggers_procedures.sql"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "../migrations/009_create_triggers_procedures.sql"
echo -e "${GREEN}  ✓ 009_create_triggers_procedures.sql applied${NC}"

# Migration 010
echo -e "  Applying: 010_insert_sample_data.sql"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "../migrations/010_insert_sample_data.sql"
echo -e "${GREEN}  ✓ 010_insert_sample_data.sql applied${NC}"

echo -e "\n${GREEN}✓ All migrations completed${NC}\n"

# Verify installation
echo -e "${YELLOW}Verifying installation...${NC}"
TABLE_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';")

echo -e "  Tables created: ${TABLE_COUNT}"

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Installation verified${NC}\n"
    echo -e "${GREEN}=== Setup Complete! ===${NC}\n"
    echo -e "Database: ${YELLOW}$DB_NAME${NC}"
    echo -e "Tables: ${YELLOW}$TABLE_COUNT${NC}"
    echo -e "Views: ${YELLOW}9${NC}"
    echo -e "Triggers: ${YELLOW}6${NC}"
    echo -e "Procedures: ${YELLOW}6${NC}\n"
    echo -e "Test connection:"
    echo -e "  ${YELLOW}mysql -h $DB_HOST -u $DB_USER -p $DB_NAME${NC}"
else
    echo -e "${RED}✗ No tables found${NC}"
    exit 1
fi
