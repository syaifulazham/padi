-- Migration 002: Season Management Tables
-- Description: Harvesting seasons, pricing, and quality standards
-- Created: 2025-11-07

USE paddy_collection_db;

-- ============================================
-- SEASON TYPE CONFIG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS season_type_config (
    type_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type_code VARCHAR(20) NOT NULL UNIQUE,
    type_name VARCHAR(50) NOT NULL,
    description TEXT,
    color_code VARCHAR(10) COMMENT 'Hex color for UI',
    is_production BOOLEAN DEFAULT TRUE,
    display_order INT UNSIGNED DEFAULT 0,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    INDEX idx_type_code (type_code),
    INDEX idx_status (status),
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- HARVESTING SEASONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS harvesting_seasons (
    season_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season_code VARCHAR(20) NOT NULL UNIQUE,
    season_name VARCHAR(100) NOT NULL,
    season_type_id INT UNSIGNED NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('planned', 'active', 'closed', 'cancelled') NOT NULL DEFAULT 'planned',
    target_quantity_kg DECIMAL(15,2),
    actual_quantity_kg DECIMAL(15,2) DEFAULT 0.00,
    total_purchases DECIMAL(15,2) DEFAULT 0.00,
    total_sales DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT,
    closed_at DATETIME,
    closed_by INT UNSIGNED,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    INDEX idx_season_code (season_code),
    INDEX idx_season_type (season_type_id),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date),
    FOREIGN KEY (season_type_id) REFERENCES season_type_config(type_id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (closed_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEASON GRADE STANDARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS season_grade_standards (
    standard_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season_id INT UNSIGNED NOT NULL,
    grade_id INT UNSIGNED NOT NULL,
    moisture_penalty_per_percent DECIMAL(10,2) DEFAULT 0.00,
    foreign_matter_penalty_per_percent DECIMAL(10,2) DEFAULT 0.00,
    min_acceptable_moisture DECIMAL(5,2),
    max_acceptable_moisture DECIMAL(5,2),
    max_acceptable_foreign_matter DECIMAL(5,2),
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE,
    effective_to DATE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    UNIQUE KEY uk_season_grade (season_id, grade_id),
    INDEX idx_season_id (season_id),
    INDEX idx_grade_id (grade_id),
    FOREIGN KEY (season_id) REFERENCES harvesting_seasons(season_id) ON DELETE CASCADE,
    FOREIGN KEY (grade_id) REFERENCES paddy_grades(grade_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEASON GRADE PRICING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS season_grade_pricing (
    pricing_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season_id INT UNSIGNED NOT NULL,
    grade_id INT UNSIGNED NOT NULL,
    base_price_per_kg DECIMAL(10,2) NOT NULL,
    moisture_penalty_per_percent DECIMAL(10,2) DEFAULT 0.00,
    foreign_matter_penalty_per_percent DECIMAL(10,2) DEFAULT 0.00,
    bonus_price_per_kg DECIMAL(10,2) DEFAULT 0.00,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    INDEX idx_season_id (season_id),
    INDEX idx_grade_id (grade_id),
    INDEX idx_effective_dates (effective_from, effective_to),
    INDEX idx_active (is_active),
    FOREIGN KEY (season_id) REFERENCES harvesting_seasons(season_id) ON DELETE CASCADE,
    FOREIGN KEY (grade_id) REFERENCES paddy_grades(grade_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEASON CLOSURE SUMMARY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS season_closure_summary (
    closure_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season_id INT UNSIGNED NOT NULL UNIQUE,
    total_farmers INT UNSIGNED DEFAULT 0,
    total_purchases INT UNSIGNED DEFAULT 0,
    total_quantity_kg DECIMAL(15,2) DEFAULT 0.00,
    total_purchase_amount DECIMAL(15,2) DEFAULT 0.00,
    total_sales INT UNSIGNED DEFAULT 0,
    total_sales_quantity_kg DECIMAL(15,2) DEFAULT 0.00,
    total_sales_amount DECIMAL(15,2) DEFAULT 0.00,
    closing_stock_kg DECIMAL(15,2) DEFAULT 0.00,
    average_price_per_kg DECIMAL(10,2),
    notes TEXT,
    closure_date DATETIME NOT NULL,
    closed_by INT UNSIGNED,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_season_id (season_id),
    INDEX idx_closure_date (closure_date),
    FOREIGN KEY (season_id) REFERENCES harvesting_seasons(season_id) ON DELETE CASCADE,
    FOREIGN KEY (closed_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
