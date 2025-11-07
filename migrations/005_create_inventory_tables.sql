-- Migration 005: Inventory Management Tables
-- Description: Stock tracking and inventory movements
-- Created: 2025-11-07

USE paddy_collection_db;

-- ============================================
-- INVENTORY STOCK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_stock (
    stock_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season_id INT UNSIGNED NOT NULL,
    grade_id INT UNSIGNED NOT NULL,
    current_quantity_kg DECIMAL(15,2) DEFAULT 0.00,
    reserved_quantity_kg DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Reserved for pending sales',
    available_quantity_kg DECIMAL(15,2) GENERATED ALWAYS AS (current_quantity_kg - reserved_quantity_kg) STORED,
    
    -- Value tracking
    average_cost_per_kg DECIMAL(10,2),
    total_value DECIMAL(15,2) GENERATED ALWAYS AS (current_quantity_kg * average_cost_per_kg) STORED,
    
    -- Quality monitoring
    storage_location VARCHAR(100),
    last_quality_check_date DATE,
    quality_status ENUM('good', 'fair', 'poor', 'rejected') DEFAULT 'good',
    
    last_movement_date DATETIME,
    notes TEXT,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_season_grade (season_id, grade_id),
    INDEX idx_season_id (season_id),
    INDEX idx_grade_id (grade_id),
    INDEX idx_storage_location (storage_location),
    INDEX idx_quality_status (quality_status),
    
    FOREIGN KEY (season_id) REFERENCES harvesting_seasons(season_id) ON DELETE RESTRICT,
    FOREIGN KEY (grade_id) REFERENCES paddy_grades(grade_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INVENTORY MOVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_movements (
    movement_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season_id INT UNSIGNED NOT NULL,
    grade_id INT UNSIGNED NOT NULL,
    movement_type ENUM('purchase', 'sale', 'adjustment', 'transfer', 'wastage', 'return') NOT NULL,
    movement_direction ENUM('in', 'out') NOT NULL,
    
    quantity_kg DECIMAL(15,2) NOT NULL,
    unit_price_per_kg DECIMAL(10,2),
    total_value DECIMAL(15,2),
    
    -- Reference to source transaction
    reference_type ENUM('purchase', 'sales', 'adjustment', 'other'),
    reference_id INT UNSIGNED COMMENT 'ID from purchase_transactions or sales_transactions',
    reference_number VARCHAR(30),
    
    -- Stock levels after movement
    stock_before_kg DECIMAL(15,2),
    stock_after_kg DECIMAL(15,2),
    
    movement_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    notes TEXT,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    
    INDEX idx_season_id (season_id),
    INDEX idx_grade_id (grade_id),
    INDEX idx_movement_type (movement_type),
    INDEX idx_movement_date (movement_date),
    INDEX idx_reference (reference_type, reference_id),
    
    FOREIGN KEY (season_id) REFERENCES harvesting_seasons(season_id) ON DELETE RESTRICT,
    FOREIGN KEY (grade_id) REFERENCES paddy_grades(grade_id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STOCK ADJUSTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stock_adjustments (
    adjustment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season_id INT UNSIGNED NOT NULL,
    grade_id INT UNSIGNED NOT NULL,
    adjustment_type ENUM('count_correction', 'quality_downgrade', 'wastage', 'theft', 'other') NOT NULL,
    
    quantity_adjustment_kg DECIMAL(15,2) NOT NULL COMMENT 'Positive for increase, negative for decrease',
    quantity_before_kg DECIMAL(15,2) NOT NULL,
    quantity_after_kg DECIMAL(15,2) NOT NULL,
    
    adjustment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL,
    supporting_document_path VARCHAR(500),
    
    approved_by INT UNSIGNED,
    approval_date DATETIME,
    approval_notes TEXT,
    
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    
    INDEX idx_season_id (season_id),
    INDEX idx_grade_id (grade_id),
    INDEX idx_adjustment_type (adjustment_type),
    INDEX idx_status (status),
    INDEX idx_adjustment_date (adjustment_date),
    
    FOREIGN KEY (season_id) REFERENCES harvesting_seasons(season_id) ON DELETE RESTRICT,
    FOREIGN KEY (grade_id) REFERENCES paddy_grades(grade_id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
