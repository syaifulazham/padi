#!/bin/bash

# Final Setup Script - Clean and complete

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment variables
if [ -f "../.env" ]; then
    while IFS='=' read -r key value; do
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        value="${value%\"}"
        value="${value#\"}"
        export "$key=$value"
    done < <(grep -v '^#' ../.env | grep -v '^$')
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

echo -e "${GREEN}=== Final Database Setup ===${NC}\n"

# Step 1: Clean any duplicate inventory data from previous attempts
echo -e "${YELLOW}Step 1: Cleaning previous data...${NC}"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <<EOF
DELETE FROM inventory_movements;
DELETE FROM inventory_stock;
DELETE FROM purchase_documents;
DELETE FROM purchase_transactions WHERE transaction_id > 0;
EOF
echo -e "${GREEN}✓ Previous data cleaned${NC}\n"

# Step 2: Insert sample data (which will trigger inventory creation)
echo -e "${YELLOW}Step 2: Inserting sample data...${NC}"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "../migrations/010_insert_sample_data.sql"
echo -e "${GREEN}✓ Sample data inserted${NC}\n"

# Step 3: Verify installation
echo -e "${YELLOW}Step 3: Verifying installation...${NC}"

# Count tables
TABLE_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME' AND table_type = 'BASE TABLE';")

# Count views
VIEW_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM information_schema.views WHERE table_schema = '$DB_NAME';")

# Count triggers
TRIGGER_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = '$DB_NAME';")

# Count procedures
PROCEDURE_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = '$DB_NAME' AND routine_type = 'PROCEDURE';")

# Count sample data
FARMER_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM farmers;")
TRANSACTION_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM purchase_transactions;")
INVENTORY_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM inventory_stock WHERE current_quantity_kg > 0;")

echo -e "${GREEN}Database Objects Created:${NC}"
echo -e "  📊 Tables: ${YELLOW}${TABLE_COUNT}${NC} (expected: 35+)"
echo -e "  👁️  Views: ${YELLOW}${VIEW_COUNT}${NC} (expected: 9)"
echo -e "  ⚡ Triggers: ${YELLOW}${TRIGGER_COUNT}${NC} (expected: 6)"
echo -e "  🔧 Procedures: ${YELLOW}${PROCEDURE_COUNT}${NC} (expected: 6)"
echo -e ""
echo -e "${GREEN}Sample Data Loaded:${NC}"
echo -e "  👨‍🌾 Farmers: ${YELLOW}${FARMER_COUNT}${NC}"
echo -e "  📦 Purchases: ${YELLOW}${TRANSACTION_COUNT}${NC}"
echo -e "  📊 Inventory Items: ${YELLOW}${INVENTORY_COUNT}${NC}"

if [ "$TABLE_COUNT" -gt 30 ] && [ "$VIEW_COUNT" -eq 9 ] && [ "$TRIGGER_COUNT" -eq 6 ]; then
    echo -e "\n${GREEN}✅ ===  SETUP COMPLETE! ===${NC}\n"
    echo -e "🎉 Your Paddy Harvest Collection Center database is ready!"
    echo -e ""
    echo -e "📝 Test Connection:"
    echo -e "   ${YELLOW}mysql -h $DB_HOST -u $DB_USER -p $DB_NAME${NC}"
    echo -e ""
    echo -e "🔐 Default Credentials:"
    echo -e "   Username: ${YELLOW}admin${NC}"
    echo -e "   Password: ${YELLOW}password${NC}"
    echo -e "   ${RED}⚠️  Change before production!${NC}"
else
    echo -e "\n${RED}⚠️  Some objects may be missing. Please verify.${NC}"
fi
