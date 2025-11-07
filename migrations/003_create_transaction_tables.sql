-- Migration 003: Transaction Tables
-- Description: Purchase and sales transaction management
-- Created: 2025-11-07

USE paddy_collection_db;

-- ============================================
-- PURCHASE TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_transactions (
    transaction_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    receipt_number VARCHAR(30) NOT NULL UNIQUE,
    season_id INT UNSIGNED NOT NULL,
    farmer_id INT UNSIGNED NOT NULL,
    grade_id INT UNSIGNED NOT NULL,
    transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Weight measurements
    gross_weight_kg DECIMAL(10,2) NOT NULL,
    tare_weight_kg DECIMAL(10,2) DEFAULT 0.00,
    net_weight_kg DECIMAL(10,2) NOT NULL,
    
    -- Quality measurements
    moisture_content DECIMAL(5,2),
    foreign_matter DECIMAL(5,2),
    
    -- Pricing
    base_price_per_kg DECIMAL(10,2) NOT NULL,
    moisture_penalty DECIMAL(10,2) DEFAULT 0.00,
    foreign_matter_penalty DECIMAL(10,2) DEFAULT 0.00,
    bonus_amount DECIMAL(10,2) DEFAULT 0.00,
    final_price_per_kg DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    
    -- Vehicle information
    vehicle_number VARCHAR(20),
    driver_name VARCHAR(100),
    
    -- Status tracking
    status ENUM('pending', 'completed', 'cancelled', 'split') NOT NULL DEFAULT 'completed',
    payment_status ENUM('unpaid', 'partial', 'paid') NOT NULL DEFAULT 'unpaid',
    payment_date DATETIME,
    
    -- Weighbridge reference
    weighbridge_id INT UNSIGNED,
    weighing_log_id INT UNSIGNED,
    
    -- Receipt printing
    is_printed BOOLEAN DEFAULT FALSE,
    print_count INT UNSIGNED DEFAULT 0,
    last_printed_at DATETIME,
    
    notes TEXT,
    cancelled_at DATETIME,
    cancelled_by INT UNSIGNED,
    cancellation_reason TEXT,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    
    INDEX idx_receipt_number (receipt_number),
    INDEX idx_season_id (season_id),
    INDEX idx_farmer_id (farmer_id),
    INDEX idx_grade_id (grade_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (season_id) REFERENCES harvesting_seasons(season_id) ON DELETE RESTRICT,
    FOREIGN KEY (farmer_id) REFERENCES farmers(farmer_id) ON DELETE RESTRICT,
    FOREIGN KEY (grade_id) REFERENCES paddy_grades(grade_id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (cancelled_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PURCHASE DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_documents (
    document_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT UNSIGNED NOT NULL,
    document_type ENUM('weighing_slip', 'quality_cert', 'photo', 'other') NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT UNSIGNED,
    upload_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_document_type (document_type),
    
    FOREIGN KEY (transaction_id) REFERENCES purchase_transactions(transaction_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SALES TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales_transactions (
    sales_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sales_number VARCHAR(30) NOT NULL UNIQUE,
    season_id INT UNSIGNED NOT NULL,
    manufacturer_id INT UNSIGNED NOT NULL,
    sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Delivery information
    delivery_order_number VARCHAR(30),
    vehicle_number VARCHAR(20),
    driver_name VARCHAR(100),
    driver_ic VARCHAR(20),
    driver_phone VARCHAR(20),
    
    -- Sale details
    total_quantity_kg DECIMAL(15,2) NOT NULL,
    sale_price_per_kg DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    
    -- Payment
    payment_status ENUM('pending', 'partial', 'paid') NOT NULL DEFAULT 'pending',
    payment_terms INT UNSIGNED DEFAULT 30 COMMENT 'Days',
    due_date DATE,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    payment_date DATETIME,
    
    -- Status
    status ENUM('pending', 'loading', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    loading_started_at DATETIME,
    loading_completed_at DATETIME,
    
    notes TEXT,
    cancelled_at DATETIME,
    cancelled_by INT UNSIGNED,
    cancellation_reason TEXT,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    
    INDEX idx_sales_number (sales_number),
    INDEX idx_season_id (season_id),
    INDEX idx_manufacturer_id (manufacturer_id),
    INDEX idx_sale_date (sale_date),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    
    FOREIGN KEY (season_id) REFERENCES harvesting_seasons(season_id) ON DELETE RESTRICT,
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(manufacturer_id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (cancelled_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SALES PURCHASE MAPPING TABLE (Traceability)
-- ============================================
CREATE TABLE IF NOT EXISTS sales_purchase_mapping (
    mapping_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sales_id INT UNSIGNED NOT NULL,
    transaction_id INT UNSIGNED NOT NULL,
    quantity_kg DECIMAL(10,2) NOT NULL,
    grade_id INT UNSIGNED NOT NULL,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    
    INDEX idx_sales_id (sales_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_grade_id (grade_id),
    
    FOREIGN KEY (sales_id) REFERENCES sales_transactions(sales_id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES purchase_transactions(transaction_id) ON DELETE RESTRICT,
    FOREIGN KEY (grade_id) REFERENCES paddy_grades(grade_id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
