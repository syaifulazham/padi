-- Migration 010: Sample Data
-- Description: Test and demo data for development
-- Created: 2025-11-07

USE paddy_collection_db;

-- ============================================
-- USERS
-- ============================================
INSERT IGNORE INTO users (username, password_hash, full_name, email, phone, role, status) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin@paddy.com', '0123456789', 'admin', 'active'),
('operator1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ahmad Bin Ali', 'operator1@paddy.com', '0198765432', 'operator', 'active'),
('operator2', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Siti Aminah', 'operator2@paddy.com', '0187654321', 'operator', 'active');

-- ============================================
-- SEASON TYPES
-- ============================================
INSERT IGNORE INTO season_type_config (type_code, type_name, description, color_code, is_production, display_order, status) VALUES
('PROD', 'Production', 'Regular production season', '#28a745', TRUE, 1, 'active'),
('DEMO', 'Demo', 'Demonstration and testing', '#ffc107', FALSE, 2, 'active'),
('TRAIN', 'Training', 'Training and learning', '#17a2b8', FALSE, 3, 'active'),
('TEST', 'Testing', 'System testing only', '#6c757d', FALSE, 4, 'active');

-- ============================================
-- PADDY GRADES
-- ============================================
INSERT IGNORE INTO paddy_grades (grade_code, grade_name, description, min_moisture_content, max_moisture_content, max_foreign_matter, display_order, status) VALUES
('PREM', 'Premium', 'Highest quality paddy', 12.0, 14.0, 1.0, 1, 'active'),
('A', 'Grade A', 'High quality paddy', 13.0, 15.0, 2.0, 2, 'active'),
('B', 'Grade B', 'Medium quality paddy', 14.0, 16.0, 3.0, 3, 'active'),
('C', 'Grade C', 'Standard quality paddy', 15.0, 18.0, 5.0, 4, 'active'),
('REJ', 'Reject', 'Below standard quality', 18.0, 25.0, 10.0, 5, 'active');

-- ============================================
-- HARVESTING SEASONS
-- ============================================
INSERT IGNORE INTO harvesting_seasons (season_code, season_name, season_type_id, start_date, end_date, status, target_quantity_kg) VALUES
('2025-S1', 'Main Season 2025 - First Harvest', 1, '2025-01-01', '2025-06-30', 'active', 1000000.00),
('2025-S2', 'Main Season 2025 - Second Harvest', 1, '2025-07-01', '2025-12-31', 'planned', 1200000.00),
('2025-DEMO', 'Demo Season 2025', 2, '2025-01-01', '2025-12-31', 'active', 50000.00);

-- ============================================
-- SEASON GRADE PRICING
-- ============================================
INSERT IGNORE INTO season_grade_pricing (season_id, grade_id, base_price_per_kg, moisture_penalty_per_percent, foreign_matter_penalty_per_percent, effective_from, is_active) VALUES
-- Season 1 pricing
(1, 1, 1.20, 0.05, 0.10, '2025-01-01', TRUE),
(1, 2, 1.10, 0.05, 0.10, '2025-01-01', TRUE),
(1, 3, 1.00, 0.05, 0.10, '2025-01-01', TRUE),
(1, 4, 0.90, 0.05, 0.10, '2025-01-01', TRUE),
(1, 5, 0.70, 0.05, 0.10, '2025-01-01', TRUE),
-- Demo season pricing
(3, 1, 1.15, 0.05, 0.10, '2025-01-01', TRUE),
(3, 2, 1.05, 0.05, 0.10, '2025-01-01', TRUE),
(3, 3, 0.95, 0.05, 0.10, '2025-01-01', TRUE);

-- ============================================
-- SEASON GRADE STANDARDS
-- ============================================
INSERT IGNORE INTO season_grade_standards (season_id, grade_id, moisture_penalty_per_percent, foreign_matter_penalty_per_percent, min_acceptable_moisture, max_acceptable_moisture, max_acceptable_foreign_matter, is_active, effective_from) VALUES
-- Season 1 standards
(1, 1, 0.05, 0.10, 12.0, 14.0, 1.0, TRUE, '2025-01-01'),
(1, 2, 0.05, 0.10, 13.0, 15.0, 2.0, TRUE, '2025-01-01'),
(1, 3, 0.05, 0.10, 14.0, 16.0, 3.0, TRUE, '2025-01-01'),
(1, 4, 0.05, 0.10, 15.0, 18.0, 5.0, TRUE, '2025-01-01'),
(1, 5, 0.05, 0.10, 18.0, 25.0, 10.0, TRUE, '2025-01-01');

-- ============================================
-- FARMERS
-- ============================================
INSERT IGNORE INTO farmers (farmer_code, ic_number, full_name, phone, email, address, postcode, city, state, bank_name, bank_account_number, farm_size_hectares, status, registration_date, created_by) VALUES
('F001', '700101-02-1234', 'Ahmad Bin Abdullah', '0123456789', 'ahmad@email.com', 'Lot 123, Kampung Padi', '06000', 'Jitra', 'Kedah', 'Maybank', '1234567890', 5.50, 'active', '2024-01-15', 1),
('F002', '750305-03-5678', 'Fatimah Binti Hassan', '0129876543', 'fatimah@email.com', 'No 45, Jalan Sawah', '06100', 'Changlun', 'Kedah', 'CIMB Bank', '9876543210', 3.75, 'active', '2024-02-20', 1),
('F003', '800707-04-9012', 'Lim Ah Kow', '0187654321', 'limahkow@email.com', '88, Taman Padi', '06200', 'Kuala Nerang', 'Kedah', 'Public Bank', '5555666677', 4.20, 'active', '2024-03-10', 1),
('F004', '690912-02-3456', 'Muthu A/L Raman', '0156789012', 'muthu@email.com', 'Estate Road, Kampung Baru', '06300', 'Kuala Ketil', 'Kedah', 'RHB Bank', '1111222233', 6.00, 'active', '2024-04-05', 1),
('F005', '721215-01-7890', 'Wong Mei Ling', '0198765432', 'wongml@email.com', 'Jalan Ladang 3', '06400', 'Pendang', 'Kedah', 'Hong Leong Bank', '9999888877', 2.80, 'active', '2024-05-12', 1);

-- ============================================
-- MANUFACTURERS
-- ============================================
INSERT IGNORE INTO manufacturers (manufacturer_code, company_name, registration_number, contact_person, phone, email, address, postcode, city, state, credit_limit, payment_terms, status, contract_start_date, created_by) VALUES
('M001', 'Bernas Rice Industries Sdn Bhd', 'ROC123456', 'Encik Rahman', '04-1234567', 'bernas@email.com', 'Kompleks Bernas, Jalan Industri', '08000', 'Sungai Petani', 'Kedah', 500000.00, 30, 'active', '2024-01-01', 1),
('M002', 'Kilang Beras Nasional Sdn Bhd', 'ROC234567', 'Puan Azizah', '04-2345678', 'kbn@email.com', 'Kawasan Perindustrian Utara', '08100', 'Bedong', 'Kedah', 300000.00, 30, 'active', '2024-01-15', 1),
('M003', 'Premium Rice Mill Co.', 'ROC345678', 'Mr. Lee', '04-3456789', 'premium@email.com', 'Lot 88, Taman Perindustrian', '08200', 'Gurun', 'Kedah', 250000.00, 45, 'active', '2024-02-01', 1);

-- ============================================
-- WEIGHBRIDGES
-- ============================================
INSERT IGNORE INTO weighbridges (weighbridge_code, weighbridge_name, location, serial_port, baud_rate, max_capacity_kg, min_capacity_kg, status, created_by) VALUES
('WB001', 'Main Weighbridge 1', 'Entrance Gate A', 'COM3', 9600, 50000.00, 10.00, 'active', 1),
('WB002', 'Weighbridge 2', 'Loading Bay B', 'COM4', 9600, 30000.00, 10.00, 'active', 1);

-- ============================================
-- PRINTER CONFIGURATIONS
-- ============================================
INSERT IGNORE INTO printer_configurations (printer_code, printer_name, printer_type, connection_type, connection_string, paper_width_mm, paper_height_mm, location, status, created_by) VALUES
('PRT001', 'Receipt Printer 1', 'dot_matrix', 'usb', 'USB001', 210, 297, 'Counter 1', 'active', 1),
('PRT002', 'Receipt Printer 2', 'thermal', 'usb', 'USB002', 80, 200, 'Counter 2', 'active', 1),
('PRT003', 'Report Printer', 'laser', 'network', '192.168.1.100', 210, 297, 'Office', 'active', 1);

-- ============================================
-- RECEIPT TEMPLATES
-- ============================================
INSERT IGNORE INTO receipt_templates (template_code, template_name, template_type, page_width_mm, page_height_mm, is_default, status, created_by) VALUES
('TPL001', 'Standard Purchase Receipt', 'purchase_receipt', 210, 297, TRUE, 'active', 1),
('TPL002', 'Weighing Slip', 'weighing_slip', 105, 148, TRUE, 'active', 1),
('TPL003', 'Sales Invoice', 'sales_receipt', 210, 297, TRUE, 'active', 1);

-- ============================================
-- SYSTEM SETTINGS
-- ============================================
INSERT IGNORE INTO system_settings (setting_category, setting_key, setting_value, value_type, description, is_editable, created_by) VALUES
('general', 'company_name', 'Paddy Collection Center', 'string', 'Company name', TRUE, 1),
('general', 'company_address', 'Jalan Padi Utama, 06000 Jitra, Kedah', 'string', 'Company address', TRUE, 1),
('general', 'company_phone', '04-9123456', 'string', 'Contact phone', TRUE, 1),
('general', 'company_email', 'info@paddycenter.com', 'string', 'Contact email', TRUE, 1),
('purchase', 'auto_generate_receipt', 'true', 'boolean', 'Auto generate receipt numbers', TRUE, 1),
('purchase', 'require_quality_check', 'true', 'boolean', 'Require quality measurements', TRUE, 1),
('purchase', 'default_tare_weight', '50', 'number', 'Default tare weight in kg', TRUE, 1),
('inventory', 'low_stock_alert', '1000', 'number', 'Low stock alert threshold in kg', TRUE, 1),
('inventory', 'enable_stock_reservation', 'true', 'boolean', 'Enable stock reservation for sales', TRUE, 1),
('print', 'auto_print_receipt', 'false', 'boolean', 'Auto print on transaction complete', TRUE, 1),
('print', 'default_copies', '2', 'number', 'Default number of copies', TRUE, 1);

-- ============================================
-- SYSTEM PRINT SETTINGS
-- ============================================
INSERT IGNORE INTO system_print_settings (setting_name, company_name, company_address, company_phone, company_email, footer_message, decimal_places, currency_symbol, status, created_by) VALUES
('default', 'Paddy Harvest Collection Center', 'Jalan Padi Utama\n06000 Jitra, Kedah\nMalaysia', '04-9123456', 'info@paddycenter.com', 
'Thank you for your business.\nPlease keep this receipt for your records.', 2, 'RM', 'active', 1);

-- ============================================
-- SAMPLE PURCHASE TRANSACTIONS (for testing)
-- ============================================
INSERT IGNORE INTO purchase_transactions (
    receipt_number, season_id, farmer_id, grade_id, transaction_date,
    gross_weight_kg, tare_weight_kg, net_weight_kg,
    moisture_content, foreign_matter,
    base_price_per_kg, moisture_penalty, foreign_matter_penalty,
    final_price_per_kg, total_amount,
    vehicle_number, status, payment_status,
    weighbridge_id, created_by
) VALUES
('2025-S1-2025-000001', 1, 1, 2, '2025-02-15 09:30:00', 1050.00, 50.00, 1000.00, 14.5, 1.8, 1.10, 0.00, 0.00, 1.10, 1100.00, 'WDK1234', 'completed', 'unpaid', 1, 2),
('2025-S1-2025-000002', 1, 2, 1, '2025-02-15 10:45:00', 1550.00, 50.00, 1500.00, 13.2, 0.8, 1.20, 0.00, 0.00, 1.20, 1800.00, 'WKC5678', 'completed', 'unpaid', 1, 2),
('2025-S1-2025-000003', 1, 3, 3, '2025-02-15 14:20:00', 2050.00, 50.00, 2000.00, 15.8, 2.5, 1.00, 0.00, 0.00, 1.00, 2000.00, 'WBA9012', 'completed', 'unpaid', 1, 3),
('2025-S1-2025-000004', 1, 4, 2, '2025-02-16 08:15:00', 1250.00, 50.00, 1200.00, 14.2, 1.5, 1.10, 0.00, 0.00, 1.10, 1320.00, 'WQA3456', 'completed', 'unpaid', 1, 2),
('2025-S1-2025-000005', 1, 5, 1, '2025-02-16 11:30:00', 850.00, 50.00, 800.00, 13.5, 1.0, 1.20, 0.00, 0.00, 1.20, 960.00, 'WJJ7890', 'completed', 'unpaid', 1, 2);

-- ============================================
-- SAMPLE SALES TRANSACTION
-- ============================================
INSERT IGNORE INTO sales_transactions (
    sales_number, season_id, manufacturer_id, sale_date,
    delivery_order_number, vehicle_number, driver_name,
    total_quantity_kg, sale_price_per_kg, total_amount,
    payment_status, payment_terms, status, created_by
) VALUES
('SALES-2025-0001', 1, 1, '2025-03-01 10:00:00', 'DO-2025-001', 'WXY1234', 'Karim Bin Ahmad', 5000.00, 1.30, 6500.00, 'pending', 30, 'completed', 1);

-- ============================================
-- Inventory Stock - Auto-created by Triggers
-- ============================================
-- Inventory stock is automatically created by the trg_after_purchase_insert trigger
-- when purchase transactions are inserted above.
-- No manual insertion needed here.

-- Note: Password for all sample users is 'password' (hashed with bcrypt)
-- Please change these passwords in production!

SELECT 'Sample data inserted successfully!' AS message;
SELECT 'Default user credentials: username=admin, password=password' AS info;
SELECT 'WARNING: Change all passwords before production use!' AS warning;
