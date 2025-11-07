# Triggers & Stored Procedures

## 🔄 Database Triggers

### 1. Auto-Set Season Type
Automatically sets season_type when inserting transactions:
```sql
CREATE TRIGGER trg_purchase_set_season_type
BEFORE INSERT ON purchase_transactions
FOR EACH ROW
BEGIN
    SELECT season_type INTO @season_type
    FROM harvesting_seasons WHERE season_id = NEW.season_id;
    SET NEW.season_type = @season_type;
END;
```

### 2. Update Inventory on Purchase
Automatically updates inventory when purchase completed:
```sql
CREATE TRIGGER trg_purchase_update_inventory
AFTER INSERT ON purchase_transactions
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE inventory_stock
        SET current_stock_kg = current_stock_kg + NEW.net_weight_kg
        WHERE season_id = NEW.season_id AND grade_id = NEW.grade_id;
    END IF;
END;
```

## 📝 Stored Procedures

### sp_create_season
Creates a new harvesting season with configuration.

**Parameters:**
- p_season_number
- p_season_year  
- p_start_date
- p_season_type
- p_user_id

### sp_generate_receipt_number
Generates sequential receipt numbers.

**Parameters:**
- p_type ('purchase' or 'sales')
- p_year

### sp_health_check
Performs database health monitoring and logs results.

---
**See comprehensive blueprint for complete trigger and procedure code**
