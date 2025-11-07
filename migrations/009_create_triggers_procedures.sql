-- Migration 009: Triggers and Stored Procedures
-- Description: Database automation and business logic
-- Created: 2025-11-07

USE paddy_collection_db;

DELIMITER $$

-- ============================================
-- TRIGGER: Update Inventory on Purchase
-- ============================================
CREATE TRIGGER trg_after_purchase_insert
AFTER INSERT ON purchase_transactions
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' THEN
        -- Update or insert inventory stock
        INSERT INTO inventory_stock (season_id, grade_id, current_quantity_kg, average_cost_per_kg, last_movement_date)
        VALUES (NEW.season_id, NEW.grade_id, NEW.net_weight_kg, NEW.final_price_per_kg, NEW.transaction_date)
        ON DUPLICATE KEY UPDATE
            current_quantity_kg = current_quantity_kg + NEW.net_weight_kg,
            average_cost_per_kg = ((average_cost_per_kg * current_quantity_kg) + (NEW.final_price_per_kg * NEW.net_weight_kg)) 
                                / (current_quantity_kg + NEW.net_weight_kg),
            last_movement_date = NEW.transaction_date;
        
        -- Log inventory movement
        INSERT INTO inventory_movements (
            season_id, grade_id, movement_type, movement_direction, 
            quantity_kg, unit_price_per_kg, total_value,
            reference_type, reference_id, reference_number,
            movement_date, created_by
        ) VALUES (
            NEW.season_id, NEW.grade_id, 'purchase', 'in',
            NEW.net_weight_kg, NEW.final_price_per_kg, NEW.total_amount,
            'purchase', NEW.transaction_id, NEW.receipt_number,
            NEW.transaction_date, NEW.created_by
        );
    END IF;
END$$

-- ============================================
-- TRIGGER: Update Inventory on Sales
-- ============================================
CREATE TRIGGER trg_after_sales_complete
AFTER UPDATE ON sales_transactions
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Reduce inventory (this will be detailed in sales_purchase_mapping)
        -- Log the sales movement
        INSERT INTO inventory_movements (
            season_id, grade_id, movement_type, movement_direction,
            quantity_kg, unit_price_per_kg, total_value,
            reference_type, reference_id, reference_number,
            movement_date, created_by
        ) VALUES (
            NEW.season_id, NULL, 'sale', 'out',
            NEW.total_quantity_kg, NEW.sale_price_per_kg, NEW.total_amount,
            'sales', NEW.sales_id, NEW.sales_number,
            NEW.sale_date, NEW.updated_by
        );
    END IF;
END$$

-- ============================================
-- TRIGGER: Update Stock on Container Loading
-- ============================================
CREATE TRIGGER trg_after_container_item_insert
AFTER INSERT ON container_loading_items
FOR EACH ROW
BEGIN
    DECLARE v_season_id INT UNSIGNED;
    
    -- Get season_id from the transaction
    SELECT season_id INTO v_season_id
    FROM purchase_transactions
    WHERE transaction_id = NEW.transaction_id;
    
    -- Update inventory stock
    UPDATE inventory_stock
    SET current_quantity_kg = current_quantity_kg - NEW.quantity_loaded_kg,
        last_movement_date = NEW.loading_timestamp
    WHERE season_id = v_season_id
      AND grade_id = NEW.grade_id;
    
    -- Update container actual loaded weight
    UPDATE delivery_containers
    SET actual_loaded_kg = actual_loaded_kg + NEW.quantity_loaded_kg
    WHERE container_id = NEW.container_id;
END$$

-- ============================================
-- TRIGGER: Validate Purchase Transaction
-- ============================================
CREATE TRIGGER trg_before_purchase_insert
BEFORE INSERT ON purchase_transactions
FOR EACH ROW
BEGIN
    -- Calculate net weight if not provided
    IF NEW.net_weight_kg IS NULL OR NEW.net_weight_kg = 0 THEN
        SET NEW.net_weight_kg = NEW.gross_weight_kg - NEW.tare_weight_kg;
    END IF;
    
    -- Calculate final price with penalties
    SET NEW.final_price_per_kg = NEW.base_price_per_kg - NEW.moisture_penalty - NEW.foreign_matter_penalty + NEW.bonus_amount;
    
    -- Calculate total amount
    SET NEW.total_amount = NEW.net_weight_kg * NEW.final_price_per_kg;
    
    -- Set default status
    IF NEW.status IS NULL THEN
        SET NEW.status = 'completed';
    END IF;
END$$

-- ============================================
-- TRIGGER: Update Season Totals on Purchase
-- ============================================
CREATE TRIGGER trg_update_season_on_purchase
AFTER INSERT ON purchase_transactions
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE harvesting_seasons
        SET actual_quantity_kg = actual_quantity_kg + NEW.net_weight_kg,
            total_purchases = total_purchases + NEW.total_amount
        WHERE season_id = NEW.season_id;
    END IF;
END$$

-- ============================================
-- TRIGGER: Update Season Totals on Sales
-- ============================================
CREATE TRIGGER trg_update_season_on_sales
AFTER INSERT ON sales_transactions
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE harvesting_seasons
        SET total_sales = total_sales + NEW.total_amount
        WHERE season_id = NEW.season_id;
    END IF;
END$$

-- ============================================
-- STORED PROCEDURE: Calculate Purchase Amount
-- ============================================
CREATE PROCEDURE sp_calculate_purchase_amount(
    IN p_net_weight_kg DECIMAL(10,2),
    IN p_base_price DECIMAL(10,2),
    IN p_moisture_content DECIMAL(5,2),
    IN p_foreign_matter DECIMAL(5,2),
    IN p_season_id INT UNSIGNED,
    IN p_grade_id INT UNSIGNED,
    OUT p_moisture_penalty DECIMAL(10,2),
    OUT p_foreign_matter_penalty DECIMAL(10,2),
    OUT p_final_price DECIMAL(10,2),
    OUT p_total_amount DECIMAL(15,2)
)
BEGIN
    DECLARE v_moisture_penalty_rate DECIMAL(10,2) DEFAULT 0;
    DECLARE v_fm_penalty_rate DECIMAL(10,2) DEFAULT 0;
    DECLARE v_max_acceptable_moisture DECIMAL(5,2);
    DECLARE v_max_acceptable_fm DECIMAL(5,2);
    
    -- Get penalty rates from season grade standards
    SELECT 
        moisture_penalty_per_percent,
        foreign_matter_penalty_per_percent,
        max_acceptable_moisture,
        max_acceptable_foreign_matter
    INTO 
        v_moisture_penalty_rate,
        v_fm_penalty_rate,
        v_max_acceptable_moisture,
        v_max_acceptable_fm
    FROM season_grade_standards
    WHERE season_id = p_season_id
      AND grade_id = p_grade_id
      AND is_active = TRUE
    LIMIT 1;
    
    -- Calculate moisture penalty
    IF p_moisture_content > v_max_acceptable_moisture THEN
        SET p_moisture_penalty = (p_moisture_content - v_max_acceptable_moisture) * v_moisture_penalty_rate;
    ELSE
        SET p_moisture_penalty = 0;
    END IF;
    
    -- Calculate foreign matter penalty
    IF p_foreign_matter > v_max_acceptable_fm THEN
        SET p_foreign_matter_penalty = (p_foreign_matter - v_max_acceptable_fm) * v_fm_penalty_rate;
    ELSE
        SET p_foreign_matter_penalty = 0;
    END IF;
    
    -- Calculate final price and total
    SET p_final_price = p_base_price - p_moisture_penalty - p_foreign_matter_penalty;
    SET p_total_amount = p_net_weight_kg * p_final_price;
END$$

-- ============================================
-- STORED PROCEDURE: Get Current Stock Level
-- ============================================
CREATE PROCEDURE sp_get_stock_level(
    IN p_season_id INT UNSIGNED,
    IN p_grade_id INT UNSIGNED,
    OUT p_current_stock DECIMAL(15,2),
    OUT p_reserved_stock DECIMAL(15,2),
    OUT p_available_stock DECIMAL(15,2)
)
BEGIN
    SELECT 
        IFNULL(current_quantity_kg, 0),
        IFNULL(reserved_quantity_kg, 0),
        IFNULL(available_quantity_kg, 0)
    INTO 
        p_current_stock,
        p_reserved_stock,
        p_available_stock
    FROM inventory_stock
    WHERE season_id = p_season_id
      AND grade_id = p_grade_id;
END$$

-- ============================================
-- STORED PROCEDURE: Close Season
-- ============================================
CREATE PROCEDURE sp_close_season(
    IN p_season_id INT UNSIGNED,
    IN p_closed_by INT UNSIGNED
)
BEGIN
    DECLARE v_total_farmers INT;
    DECLARE v_total_purchases INT;
    DECLARE v_total_purchase_qty DECIMAL(15,2);
    DECLARE v_total_purchase_amt DECIMAL(15,2);
    DECLARE v_total_sales INT;
    DECLARE v_total_sales_qty DECIMAL(15,2);
    DECLARE v_total_sales_amt DECIMAL(15,2);
    DECLARE v_closing_stock DECIMAL(15,2);
    DECLARE v_avg_price DECIMAL(10,2);
    
    -- Get purchase statistics
    SELECT 
        COUNT(DISTINCT farmer_id),
        COUNT(*),
        IFNULL(SUM(net_weight_kg), 0),
        IFNULL(SUM(total_amount), 0),
        IFNULL(AVG(final_price_per_kg), 0)
    INTO 
        v_total_farmers,
        v_total_purchases,
        v_total_purchase_qty,
        v_total_purchase_amt,
        v_avg_price
    FROM purchase_transactions
    WHERE season_id = p_season_id
      AND status = 'completed';
    
    -- Get sales statistics
    SELECT 
        IFNULL(COUNT(*), 0),
        IFNULL(SUM(total_quantity_kg), 0),
        IFNULL(SUM(total_amount), 0)
    INTO 
        v_total_sales,
        v_total_sales_qty,
        v_total_sales_amt
    FROM sales_transactions
    WHERE season_id = p_season_id
      AND status = 'completed';
    
    -- Get closing stock
    SELECT IFNULL(SUM(current_quantity_kg), 0)
    INTO v_closing_stock
    FROM inventory_stock
    WHERE season_id = p_season_id;
    
    -- Insert closure summary
    INSERT INTO season_closure_summary (
        season_id, total_farmers, total_purchases, total_quantity_kg,
        total_purchase_amount, total_sales, total_sales_quantity_kg,
        total_sales_amount, closing_stock_kg, average_price_per_kg,
        closure_date, closed_by
    ) VALUES (
        p_season_id, v_total_farmers, v_total_purchases, v_total_purchase_qty,
        v_total_purchase_amt, v_total_sales, v_total_sales_qty,
        v_total_sales_amt, v_closing_stock, v_avg_price,
        NOW(), p_closed_by
    );
    
    -- Update season status
    UPDATE harvesting_seasons
    SET status = 'closed',
        closed_at = NOW(),
        closed_by = p_closed_by
    WHERE season_id = p_season_id;
    
    SELECT 'Season closed successfully' AS message;
END$$

-- ============================================
-- STORED PROCEDURE: Generate Receipt Number
-- ============================================
CREATE PROCEDURE sp_generate_receipt_number(
    IN p_season_id INT UNSIGNED,
    OUT p_receipt_number VARCHAR(30)
)
BEGIN
    DECLARE v_season_code VARCHAR(20);
    DECLARE v_next_number INT;
    DECLARE v_year VARCHAR(4);
    
    -- Get season code
    SELECT season_code INTO v_season_code
    FROM harvesting_seasons
    WHERE season_id = p_season_id;
    
    -- Get current year
    SET v_year = YEAR(CURDATE());
    
    -- Get next number for this season
    SELECT IFNULL(MAX(CAST(SUBSTRING(receipt_number, -6) AS UNSIGNED)), 0) + 1
    INTO v_next_number
    FROM purchase_transactions
    WHERE season_id = p_season_id
      AND YEAR(transaction_date) = v_year;
    
    -- Generate receipt number: SEASON-YEAR-XXXXXX
    SET p_receipt_number = CONCAT(v_season_code, '-', v_year, '-', LPAD(v_next_number, 6, '0'));
END$$

-- ============================================
-- STORED PROCEDURE: Get Farmer Statistics
-- ============================================
CREATE PROCEDURE sp_get_farmer_stats(
    IN p_farmer_id INT UNSIGNED,
    IN p_season_id INT UNSIGNED
)
BEGIN
    SELECT 
        f.farmer_code,
        f.full_name,
        COUNT(pt.transaction_id) AS total_deliveries,
        SUM(pt.net_weight_kg) AS total_weight_kg,
        SUM(pt.total_amount) AS total_earnings,
        AVG(pt.final_price_per_kg) AS avg_price_per_kg,
        AVG(pt.moisture_content) AS avg_moisture,
        AVG(pt.foreign_matter) AS avg_foreign_matter,
        MIN(pt.transaction_date) AS first_delivery,
        MAX(pt.transaction_date) AS last_delivery
    FROM farmers f
    LEFT JOIN purchase_transactions pt ON f.farmer_id = pt.farmer_id
        AND pt.season_id = p_season_id
        AND pt.status = 'completed'
    WHERE f.farmer_id = p_farmer_id
    GROUP BY f.farmer_id, f.farmer_code, f.full_name;
END$$

DELIMITER ;
