-- Migration 008: Database Views
-- Description: Reporting and summary views
-- Created: 2025-11-07

USE paddy_collection_db;

-- ============================================
-- DAILY PURCHASE SUMMARY VIEW
-- ============================================
CREATE OR REPLACE VIEW vw_daily_purchase_summary AS
SELECT 
    DATE(pt.transaction_date) AS purchase_date,
    hs.season_id,
    hs.season_name,
    pg.grade_id,
    pg.grade_name,
    COUNT(pt.transaction_id) AS total_transactions,
    COUNT(DISTINCT pt.farmer_id) AS unique_farmers,
    SUM(pt.net_weight_kg) AS total_weight_kg,
    AVG(pt.final_price_per_kg) AS avg_price_per_kg,
    SUM(pt.total_amount) AS total_amount,
    AVG(pt.moisture_content) AS avg_moisture_content,
    AVG(pt.foreign_matter) AS avg_foreign_matter
FROM purchase_transactions pt
JOIN harvesting_seasons hs ON pt.season_id = hs.season_id
JOIN paddy_grades pg ON pt.grade_id = pg.grade_id
WHERE pt.status = 'completed'
GROUP BY DATE(pt.transaction_date), hs.season_id, hs.season_name, pg.grade_id, pg.grade_name;

-- ============================================
-- FARMER PURCHASE SUMMARY VIEW
-- ============================================
CREATE OR REPLACE VIEW vw_farmer_purchase_summary AS
SELECT 
    f.farmer_id,
    f.farmer_code,
    f.full_name AS farmer_name,
    f.phone,
    f.status AS farmer_status,
    hs.season_id,
    hs.season_name,
    COUNT(pt.transaction_id) AS total_transactions,
    SUM(pt.net_weight_kg) AS total_weight_kg,
    SUM(pt.total_amount) AS total_amount,
    AVG(pt.final_price_per_kg) AS avg_price_per_kg,
    MIN(pt.transaction_date) AS first_transaction_date,
    MAX(pt.transaction_date) AS last_transaction_date,
    AVG(pt.moisture_content) AS avg_moisture_content,
    AVG(pt.foreign_matter) AS avg_foreign_matter
FROM farmers f
LEFT JOIN purchase_transactions pt ON f.farmer_id = pt.farmer_id AND pt.status = 'completed'
LEFT JOIN harvesting_seasons hs ON pt.season_id = hs.season_id
GROUP BY f.farmer_id, f.farmer_code, f.full_name, f.phone, f.status, hs.season_id, hs.season_name;

-- ============================================
-- CURRENT INVENTORY SUMMARY VIEW
-- ============================================
CREATE OR REPLACE VIEW vw_current_inventory_summary AS
SELECT 
    ist.stock_id,
    hs.season_id,
    hs.season_name,
    hs.status AS season_status,
    pg.grade_id,
    pg.grade_name,
    ist.current_quantity_kg,
    ist.reserved_quantity_kg,
    ist.available_quantity_kg,
    ist.average_cost_per_kg,
    ist.total_value,
    ist.storage_location,
    ist.quality_status,
    ist.last_quality_check_date,
    ist.last_movement_date
FROM inventory_stock ist
JOIN harvesting_seasons hs ON ist.season_id = hs.season_id
JOIN paddy_grades pg ON ist.grade_id = pg.grade_id
WHERE ist.current_quantity_kg > 0
ORDER BY hs.season_name, pg.display_order;

-- ============================================
-- MANUFACTURER SALES SUMMARY VIEW
-- ============================================
CREATE OR REPLACE VIEW vw_manufacturer_sales_summary AS
SELECT 
    m.manufacturer_id,
    m.manufacturer_code,
    m.company_name,
    m.status AS manufacturer_status,
    hs.season_id,
    hs.season_name,
    COUNT(st.sales_id) AS total_sales,
    SUM(st.total_quantity_kg) AS total_quantity_kg,
    SUM(st.total_amount) AS total_amount,
    SUM(st.paid_amount) AS total_paid,
    SUM(st.total_amount - st.paid_amount) AS outstanding_amount,
    AVG(st.sale_price_per_kg) AS avg_price_per_kg,
    MIN(st.sale_date) AS first_sale_date,
    MAX(st.sale_date) AS last_sale_date
FROM manufacturers m
LEFT JOIN sales_transactions st ON m.manufacturer_id = st.manufacturer_id AND st.status = 'completed'
LEFT JOIN harvesting_seasons hs ON st.season_id = hs.season_id
GROUP BY m.manufacturer_id, m.manufacturer_code, m.company_name, m.status, hs.season_id, hs.season_name;

-- ============================================
-- CONTAINER LOADING DETAILS VIEW
-- ============================================
CREATE OR REPLACE VIEW vw_container_loading_details AS
SELECT 
    dc.container_id,
    dc.container_number,
    dc.container_type,
    st.sales_id,
    st.sales_number,
    m.company_name AS manufacturer_name,
    dc.target_capacity_kg,
    dc.actual_loaded_kg,
    dc.status AS container_status,
    COUNT(cli.loading_item_id) AS items_loaded,
    SUM(cli.quantity_loaded_kg) AS total_loaded_kg,
    ROUND((dc.actual_loaded_kg / NULLIF(dc.target_capacity_kg, 0)) * 100, 2) AS loading_percentage,
    dc.loading_started_at,
    dc.loading_completed_at,
    TIMESTAMPDIFF(MINUTE, dc.loading_started_at, dc.loading_completed_at) AS loading_duration_minutes
FROM delivery_containers dc
JOIN sales_transactions st ON dc.sales_id = st.sales_id
JOIN manufacturers m ON st.manufacturer_id = m.manufacturer_id
LEFT JOIN container_loading_items cli ON dc.container_id = cli.container_id
GROUP BY dc.container_id, dc.container_number, dc.container_type, st.sales_id, st.sales_number, 
         m.company_name, dc.target_capacity_kg, dc.actual_loaded_kg, dc.status,
         dc.loading_started_at, dc.loading_completed_at;

-- ============================================
-- PRODUCTION PURCHASES VIEW (Excludes Demo/Training)
-- ============================================
CREATE OR REPLACE VIEW vw_production_purchases AS
SELECT 
    pt.*,
    hs.season_name,
    hs.season_code,
    stc.type_name AS season_type,
    f.farmer_code,
    f.full_name AS farmer_name,
    f.phone AS farmer_phone,
    pg.grade_name,
    pg.grade_code
FROM purchase_transactions pt
JOIN harvesting_seasons hs ON pt.season_id = hs.season_id
JOIN season_type_config stc ON hs.season_type_id = stc.type_id
JOIN farmers f ON pt.farmer_id = f.farmer_id
JOIN paddy_grades pg ON pt.grade_id = pg.grade_id
WHERE stc.is_production = TRUE
  AND pt.status = 'completed'
ORDER BY pt.transaction_date DESC;

-- ============================================
-- SEASON PERFORMANCE VIEW
-- ============================================
CREATE OR REPLACE VIEW vw_season_performance AS
SELECT 
    hs.season_id,
    hs.season_code,
    hs.season_name,
    hs.status,
    hs.start_date,
    hs.end_date,
    DATEDIFF(IFNULL(hs.end_date, CURDATE()), hs.start_date) AS duration_days,
    
    -- Purchase metrics
    COUNT(DISTINCT pt.transaction_id) AS total_purchases,
    COUNT(DISTINCT pt.farmer_id) AS unique_farmers,
    SUM(pt.net_weight_kg) AS total_purchased_kg,
    SUM(pt.total_amount) AS total_purchase_amount,
    AVG(pt.final_price_per_kg) AS avg_purchase_price,
    
    -- Sales metrics
    COUNT(DISTINCT st.sales_id) AS total_sales,
    COUNT(DISTINCT st.manufacturer_id) AS unique_manufacturers,
    IFNULL(SUM(st.total_quantity_kg), 0) AS total_sold_kg,
    IFNULL(SUM(st.total_amount), 0) AS total_sales_amount,
    
    -- Inventory
    IFNULL(SUM(ist.current_quantity_kg), 0) AS current_stock_kg,
    
    -- Financial
    IFNULL(SUM(st.total_amount), 0) - SUM(pt.total_amount) AS gross_margin
    
FROM harvesting_seasons hs
LEFT JOIN purchase_transactions pt ON hs.season_id = pt.season_id AND pt.status = 'completed'
LEFT JOIN sales_transactions st ON hs.season_id = st.season_id AND st.status = 'completed'
LEFT JOIN inventory_stock ist ON hs.season_id = ist.season_id
GROUP BY hs.season_id, hs.season_code, hs.season_name, hs.status, hs.start_date, hs.end_date;

-- ============================================
-- GRADE PERFORMANCE VIEW
-- ============================================
CREATE OR REPLACE VIEW vw_grade_performance AS
SELECT 
    pg.grade_id,
    pg.grade_code,
    pg.grade_name,
    hs.season_id,
    hs.season_name,
    
    COUNT(pt.transaction_id) AS total_transactions,
    SUM(pt.net_weight_kg) AS total_purchased_kg,
    AVG(pt.final_price_per_kg) AS avg_purchase_price,
    MIN(pt.final_price_per_kg) AS min_price,
    MAX(pt.final_price_per_kg) AS max_price,
    
    AVG(pt.moisture_content) AS avg_moisture,
    AVG(pt.foreign_matter) AS avg_foreign_matter,
    
    IFNULL(ist.current_quantity_kg, 0) AS current_stock_kg,
    IFNULL(ist.available_quantity_kg, 0) AS available_stock_kg
    
FROM paddy_grades pg
CROSS JOIN harvesting_seasons hs
LEFT JOIN purchase_transactions pt ON pg.grade_id = pt.grade_id 
    AND hs.season_id = pt.season_id 
    AND pt.status = 'completed'
LEFT JOIN inventory_stock ist ON pg.grade_id = ist.grade_id 
    AND hs.season_id = ist.season_id
WHERE hs.status IN ('active', 'closed')
GROUP BY pg.grade_id, pg.grade_code, pg.grade_name, hs.season_id, hs.season_name, 
         ist.current_quantity_kg, ist.available_quantity_kg
HAVING total_transactions > 0 OR current_stock_kg > 0;

-- ============================================
-- PENDING PAYMENTS VIEW
-- ============================================
CREATE OR REPLACE VIEW vw_pending_payments AS
SELECT 
    'sales' AS transaction_type,
    st.sales_id AS transaction_id,
    st.sales_number AS transaction_number,
    st.sale_date AS transaction_date,
    m.manufacturer_id AS party_id,
    m.company_name AS party_name,
    m.phone AS party_phone,
    st.total_amount,
    st.paid_amount,
    (st.total_amount - st.paid_amount) AS outstanding_amount,
    st.due_date,
    DATEDIFF(CURDATE(), st.due_date) AS days_overdue,
    st.payment_status
FROM sales_transactions st
JOIN manufacturers m ON st.manufacturer_id = m.manufacturer_id
WHERE st.payment_status IN ('pending', 'partial')
  AND st.status = 'completed'
  
UNION ALL

SELECT 
    'purchase' AS transaction_type,
    pt.transaction_id,
    pt.receipt_number AS transaction_number,
    pt.transaction_date,
    f.farmer_id AS party_id,
    f.full_name AS party_name,
    f.phone AS party_phone,
    pt.total_amount,
    0 AS paid_amount,
    pt.total_amount AS outstanding_amount,
    NULL AS due_date,
    NULL AS days_overdue,
    pt.payment_status
FROM purchase_transactions pt
JOIN farmers f ON pt.farmer_id = f.farmer_id
WHERE pt.payment_status = 'unpaid'
  AND pt.status = 'completed'

ORDER BY transaction_date DESC;
