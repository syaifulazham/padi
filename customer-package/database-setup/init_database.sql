-- ============================================
-- PADDY COLLECTION CENTER - COMPLETE DATABASE INITIALIZATION
-- Version: 1.0.0
-- MySQL 8.0+
-- ============================================
-- This script creates the entire database schema from scratch
-- including all tables, views, stored procedures, triggers, and default data
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS paddy_collection_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE paddy_collection_db;

SET NAMES utf8mb4;
SET time_zone = '+08:00';
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('admin', 'operator', 'viewer') NOT NULL DEFAULT 'operator',
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    is_active TINYINT(1) DEFAULT 1,
    last_login DATETIME,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Farmers table
CREATE TABLE IF NOT EXISTS farmers (
    farmer_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmer_code VARCHAR(20) NOT NULL UNIQUE,
    ic_number VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    postcode VARCHAR(10),
    city VARCHAR(50),
    state VARCHAR(50),
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(30),
    farm_location TEXT,
    farm_size_hectares DECIMAL(10,2),
    subsidy_card_qr_hash VARCHAR(64) COMMENT 'Hashed QR code from subsidy card',
    status ENUM('active', 'inactive', 'blacklisted') NOT NULL DEFAULT 'active',
    registration_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    INDEX idx_farmer_code (farmer_code),
    INDEX idx_ic_number (ic_number),
    INDEX idx_full_name (full_name),
    INDEX idx_status (status),
    INDEX idx_registration_date (registration_date),
    INDEX idx_subsidy_qr_hash (subsidy_card_qr_hash),
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Farmer documents table
CREATE TABLE IF NOT EXISTS farmer_documents (
    document_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT UNSIGNED NOT NULL,
    document_type ENUM('ic_copy', 'bank_statement', 'land_grant', 'coupon_card', 'other') NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT UNSIGNED,
    upload_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    INDEX idx_farmer_id (farmer_id),
    INDEX idx_document_type (document_type),
    FOREIGN KEY (farmer_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Manufacturers table
CREATE TABLE IF NOT EXISTS manufacturers (
    manufacturer_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    manufacturer_code VARCHAR(20) NOT NULL UNIQUE,
    company_name VARCHAR(200) NOT NULL,
    registration_number VARCHAR(50),
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    postcode VARCHAR(10),
    city VARCHAR(50),
    state VARCHAR(50),
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    payment_terms INT UNSIGNED DEFAULT 30 COMMENT 'Days',
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    contract_start_date DATE,
    contract_end_date DATE,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    INDEX idx_manufacturer_code (manufacturer_code),
    INDEX idx_company_name (company_name),
    INDEX idx_status (status),
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Paddy grades table
CREATE TABLE IF NOT EXISTS paddy_grades (
    grade_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    grade_code VARCHAR(10) NOT NULL UNIQUE,
    grade_name VARCHAR(50) NOT NULL,
    description TEXT,
    min_moisture_content DECIMAL(5,2),
    max_moisture_content DECIMAL(5,2),
    max_foreign_matter DECIMAL(5,2),
    display_order INT UNSIGNED DEFAULT 0,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    INDEX idx_grade_code (grade_code),
    INDEX idx_status (status),
    INDEX idx_display_order (display_order),
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEASON MANAGEMENT TABLES
-- ============================================

-- Season type config table
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

-- Harvesting seasons table
CREATE TABLE IF NOT EXISTS harvesting_seasons (
    season_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season_code VARCHAR(20) NOT NULL UNIQUE,
    season_name VARCHAR(100) NOT NULL,
    season_number INT UNSIGNED NOT NULL DEFAULT 1,
    year VARCHAR(4) NOT NULL,
    mode ENUM('LIVE', 'DEMO') NOT NULL DEFAULT 'LIVE',
    season_type_id INT UNSIGNED NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('planned', 'active', 'closed', 'cancelled') NOT NULL DEFAULT 'planned',
    target_quantity_kg DECIMAL(15,2),
    actual_quantity_kg DECIMAL(15,2) DEFAULT 0.00,
    total_purchases DECIMAL(15,2) DEFAULT 0.00,
    total_sales DECIMAL(15,2) DEFAULT 0.00,
    opening_price_per_ton DECIMAL(10,2),
    current_price_per_ton DECIMAL(10,2),
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

-- Season grade standards table
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

-- Season grade pricing table
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

-- Season price history table
CREATE TABLE IF NOT EXISTS season_price_history (
    price_history_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    season_id INT UNSIGNED NOT NULL,
    price_per_ton DECIMAL(10,2) NOT NULL,
    effective_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    created_by INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (season_id) REFERENCES harvesting_seasons(season_id) ON DELETE CASCADE,
    INDEX idx_season_effective_date (season_id, effective_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Season closure summary table
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

-- ============================================
-- PADDY PRODUCTS SYSTEM
-- ============================================

-- Paddy products table
CREATE TABLE IF NOT EXISTS paddy_products (
    product_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(20) NOT NULL UNIQUE,
    product_name VARCHAR(100) NOT NULL,
    product_type ENUM('BERAS', 'BENIH') NOT NULL COMMENT 'Rice or Seed',
    variety ENUM('BIASA', 'WANGI') NOT NULL COMMENT 'Regular or Fragrant',
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_type (product_type),
    INDEX idx_variety (variety),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Season product prices table
CREATE TABLE IF NOT EXISTS season_product_prices (
    season_product_price_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    opening_price_per_ton DECIMAL(10,2) NOT NULL,
    current_price_per_ton DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (season_id) REFERENCES harvesting_seasons(season_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES paddy_products(product_id) ON DELETE RESTRICT,
    UNIQUE KEY unique_season_product (season_id, product_id),
    INDEX idx_season_id (season_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product price history table
CREATE TABLE IF NOT EXISTS product_price_history (
    price_history_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    price_per_ton DECIMAL(10,2) NOT NULL,
    effective_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_by INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (season_id) REFERENCES harvesting_seasons(season_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES paddy_products(product_id) ON DELETE RESTRICT,
    INDEX idx_season_product (season_id, product_id),
    INDEX idx_effective_date (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRANSACTION TABLES
-- ============================================

-- Purchase transactions table
CREATE TABLE IF NOT EXISTS purchase_transactions (
    transaction_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    receipt_number VARCHAR(30) NOT NULL UNIQUE,
    season_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED,
    farmer_id INT UNSIGNED NOT NULL,
    grade_id INT UNSIGNED NOT NULL,
    transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gross_weight_kg DECIMAL(10,2) NOT NULL,
    tare_weight_kg DECIMAL(10,2) DEFAULT 0.00,
    net_weight_kg DECIMAL(10,2) NOT NULL,
    effective_weight_kg DECIMAL(10,2),
    moisture_content DECIMAL(5,2),
    foreign_matter DECIMAL(5,2),
    base_price_per_kg DECIMAL(10,2) NOT NULL,
    moisture_penalty DECIMAL(10,2) DEFAULT 0.00,
    foreign_matter_penalty DECIMAL(10,2) DEFAULT 0.00,
    deduction_config JSON NULL COMMENT 'Custom deduction configuration',
    bonus_amount DECIMAL(10,2) DEFAULT 0.00,
    final_price_per_kg DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    vehicle_number VARCHAR(20),
    driver_name VARCHAR(100),
    status ENUM('pending', 'completed', 'cancelled', 'split') NOT NULL DEFAULT 'completed',
    payment_status ENUM('unpaid', 'partial', 'paid') NOT NULL DEFAULT 'unpaid',
    payment_date DATETIME,
    weighbridge_id INT UNSIGNED,
    weighing_log_id INT UNSIGNED,
    is_printed BOOLEAN DEFAULT FALSE,
    print_count INT UNSIGNED DEFAULT 0,
    last_printed_at DATETIME,
    is_split BOOLEAN DEFAULT FALSE,
    original_transaction_id INT UNSIGNED,
    split_portion_number INT UNSIGNED,
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
    INDEX idx_product_id (product_id),
    INDEX idx_farmer_id (farmer_id),
    INDEX idx_grade_id (grade_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (season_id) REFERENCES harvesting_seasons(season_id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES paddy_products(product_id) ON DELETE RESTRICT,
    FOREIGN KEY (farmer_id) REFERENCES farmers(farmer_id) ON DELETE RESTRICT,
    FOREIGN KEY (grade_id) REFERENCES paddy_grades(grade_id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (cancelled_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchase documents table
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

-- Sales transactions table
CREATE TABLE IF NOT EXISTS sales_transactions (
    sales_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sales_number VARCHAR(30) NOT NULL UNIQUE,
    season_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED,
    manufacturer_id INT UNSIGNED NOT NULL,
    sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivery_order_number VARCHAR(30),
    vehicle_number VARCHAR(20),
    driver_name VARCHAR(100),
    driver_ic VARCHAR(20),
    driver_phone VARCHAR(20),
    gross_weight_kg DECIMAL(15,2),
    tare_weight_kg DECIMAL(15,2),
    net_weight_kg DECIMAL(15,2),
    total_quantity_kg DECIMAL(15,2) NOT NULL,
    sale_price_per_kg DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_status ENUM('pending', 'partial', 'paid') NOT NULL DEFAULT 'pending',
    payment_terms INT UNSIGNED DEFAULT 30 COMMENT 'Days',
    due_date DATE,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    payment_date DATETIME,
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
    INDEX idx_sales_product_id (product_id),
    INDEX idx_manufacturer_id (manufacturer_id),
    INDEX idx_sale_date (sale_date),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    FOREIGN KEY (season_id) REFERENCES harvesting_seasons(season_id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES paddy_products(product_id) ON DELETE RESTRICT,
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(manufacturer_id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (cancelled_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sales purchase mapping table
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

-- ============================================
-- CONTAINER MANAGEMENT TABLES
-- ============================================

-- Delivery containers table
CREATE TABLE IF NOT EXISTS delivery_containers (
    container_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sales_id INT UNSIGNED NOT NULL,
    container_number VARCHAR(30) NOT NULL,
    container_type ENUM('truck', 'lorry', 'container_20ft', 'container_40ft') NOT NULL,
    target_capacity_kg DECIMAL(10,2),
    actual_loaded_kg DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('pending', 'loading', 'loaded', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    loading_started_at DATETIME,
    loading_completed_at DATETIME,
    loading_started_by INT UNSIGNED,
    loading_completed_by INT UNSIGNED,
    seal_number VARCHAR(50),
    seal_applied_at DATETIME,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    INDEX idx_sales_id (sales_id),
    INDEX idx_container_number (container_number),
    INDEX idx_status (status),
    FOREIGN KEY (sales_id) REFERENCES sales_transactions(sales_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (loading_started_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (loading_completed_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Container loading items table
CREATE TABLE IF NOT EXISTS container_loading_items (
    loading_item_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    container_id INT UNSIGNED NOT NULL,
    transaction_id INT UNSIGNED NOT NULL,
    split_portion_id INT UNSIGNED,
    quantity_loaded_kg DECIMAL(10,2) NOT NULL,
    grade_id INT UNSIGNED NOT NULL,
    loading_sequence INT UNSIGNED,
    loading_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    INDEX idx_container_id (container_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_grade_id (grade_id),
    INDEX idx_loading_timestamp (loading_timestamp),
    FOREIGN KEY (container_id) REFERENCES delivery_containers(container_id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES purchase_transactions(transaction_id) ON DELETE RESTRICT,
    FOREIGN KEY (grade_id) REFERENCES paddy_grades(grade_id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Receipt split history table
CREATE TABLE IF NOT EXISTS receipt_split_history (
    split_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    original_transaction_id INT UNSIGNED NOT NULL,
    split_count INT UNSIGNED NOT NULL,
    split_reason TEXT,
    original_net_weight_kg DECIMAL(10,2) NOT NULL,
    original_total_amount DECIMAL(15,2) NOT NULL,
    split_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    split_by INT UNSIGNED,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_original_transaction (original_transaction_id),
    INDEX idx_split_date (split_date),
    FOREIGN KEY (original_transaction_id) REFERENCES purchase_transactions(transaction_id) ON DELETE RESTRICT,
    FOREIGN KEY (split_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Receipt split portions table
CREATE TABLE IF NOT EXISTS receipt_split_portions (
    portion_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    split_id INT UNSIGNED NOT NULL,
    portion_number INT UNSIGNED NOT NULL,
    new_receipt_number VARCHAR(30) NOT NULL UNIQUE,
    portion_weight_kg DECIMAL(10,2) NOT NULL,
    portion_amount DECIMAL(15,2) NOT NULL,
    loaded_container_id INT UNSIGNED,
    loading_item_id INT UNSIGNED,
    status ENUM('available', 'loaded', 'cancelled') NOT NULL DEFAULT 'available',
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_split_id (split_id),
    INDEX idx_new_receipt_number (new_receipt_number),
    INDEX idx_loaded_container (loaded_container_id),
    INDEX idx_status (status),
    FOREIGN KEY (split_id) REFERENCES receipt_split_history(split_id) ON DELETE CASCADE,
    FOREIGN KEY (loaded_container_id) REFERENCES delivery_containers(container_id) ON DELETE SET NULL,
    FOREIGN KEY (loading_item_id) REFERENCES container_loading_items(loading_item_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INVENTORY TABLES
-- ============================================

-- Inventory stock table
CREATE TABLE IF NOT EXISTS inventory_stock (
    stock_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season_id INT UNSIGNED NOT NULL,
    grade_id INT UNSIGNED NOT NULL,
    current_quantity_kg DECIMAL(15,2) DEFAULT 0.00,
    reserved_quantity_kg DECIMAL(15,2) DEFAULT 0.00,
    available_quantity_kg DECIMAL(15,2) GENERATED ALWAYS AS (current_quantity_kg - reserved_quantity_kg) STORED,
    average_cost_per_kg DECIMAL(10,2),
    total_value DECIMAL(15,2) GENERATED ALWAYS AS (current_quantity_kg * average_cost_per_kg) STORED,
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

-- Inventory movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
    movement_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season_id INT UNSIGNED NOT NULL,
    grade_id INT UNSIGNED,
    movement_type ENUM('purchase', 'sale', 'adjustment', 'transfer', 'wastage', 'return') NOT NULL,
    movement_direction ENUM('in', 'out') NOT NULL,
    quantity_kg DECIMAL(15,2) NOT NULL,
    unit_price_per_kg DECIMAL(10,2),
    total_value DECIMAL(15,2),
    reference_type ENUM('purchase', 'sales', 'adjustment', 'other'),
    reference_id INT UNSIGNED,
    reference_number VARCHAR(30),
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

-- Stock adjustments table
CREATE TABLE IF NOT EXISTS stock_adjustments (
    adjustment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    season_id INT UNSIGNED NOT NULL,
    grade_id INT UNSIGNED NOT NULL,
    adjustment_type ENUM('count_correction', 'quality_downgrade', 'wastage', 'theft', 'other') NOT NULL,
    quantity_adjustment_kg DECIMAL(15,2) NOT NULL,
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

-- ============================================
-- HARDWARE TABLES
-- ============================================

-- Weighbridge configuration table
CREATE TABLE IF NOT EXISTS weighbridge_config (
    config_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    weighbridge_name VARCHAR(100) NOT NULL,
    serial_port VARCHAR(20) NOT NULL,
    baud_rate INT UNSIGNED DEFAULT 9600,
    data_bits INT DEFAULT 8,
    stop_bits INT DEFAULT 1,
    parity ENUM('none', 'odd', 'even') DEFAULT 'none',
    max_capacity_kg DECIMAL(10,2),
    precision_kg DECIMAL(5,2) DEFAULT 1.00,
    calibration_date DATE,
    calibration_due_date DATE,
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_weighbridge_name (weighbridge_name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Weighing logs table
CREATE TABLE IF NOT EXISTS weighing_logs (
    log_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    weighbridge_id INT UNSIGNED,
    transaction_id INT UNSIGNED,
    weighing_type ENUM('gross', 'tare', 'net') NOT NULL,
    weight_kg DECIMAL(10,2) NOT NULL,
    weighing_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    operator_id INT UNSIGNED,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_weighbridge_id (weighbridge_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_weighing_type (weighing_type),
    INDEX idx_weighing_timestamp (weighing_timestamp),
    FOREIGN KEY (weighbridge_id) REFERENCES weighbridge_config(config_id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_id) REFERENCES purchase_transactions(transaction_id) ON DELETE SET NULL,
    FOREIGN KEY (operator_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STORED PROCEDURES
-- ============================================

DELIMITER $$

-- Generate receipt number
DROP PROCEDURE IF EXISTS sp_generate_receipt_number$$
CREATE PROCEDURE sp_generate_receipt_number(
    IN p_season_id INT UNSIGNED,
    OUT p_receipt_number VARCHAR(30)
)
BEGIN
    DECLARE v_season_code VARCHAR(20);
    DECLARE v_season_number INT;
    DECLARE v_year VARCHAR(4);
    DECLARE v_year_2digit VARCHAR(2);
    DECLARE v_mode VARCHAR(10);
    DECLARE v_next_number INT;
    DECLARE v_season_prefix VARCHAR(30);
    DECLARE v_demo_suffix VARCHAR(10);
    
    SELECT 
        season_code,
        season_number,
        year,
        mode
    INTO 
        v_season_code,
        v_season_number,
        v_year,
        v_mode
    FROM harvesting_seasons
    WHERE season_id = p_season_id;
    
    SET v_year_2digit = RIGHT(v_year, 2);
    SET v_season_prefix = CONCAT('P/', v_season_code, '/', v_season_number, v_year_2digit);
    SET v_demo_suffix = IF(v_mode = 'LIVE', '', '-demo');
    
    SELECT IFNULL(MAX(
        CAST(
            REPLACE(
                SUBSTRING_INDEX(receipt_number, '/', -1),
                '-demo',
                ''
            ) AS UNSIGNED
        )
    ), 0) + 1
    INTO v_next_number
    FROM purchase_transactions
    WHERE season_id = p_season_id
      AND receipt_number LIKE CONCAT(v_season_prefix, '/%');
    
    SET p_receipt_number = CONCAT(v_season_prefix, '/', LPAD(v_next_number, 6, '0'), v_demo_suffix);
END$$

-- Generate sales number
DROP PROCEDURE IF EXISTS sp_generate_sales_number$$
CREATE PROCEDURE sp_generate_sales_number(
    IN p_season_id INT UNSIGNED,
    OUT p_sales_number VARCHAR(30)
)
BEGIN
    DECLARE v_season_code VARCHAR(20);
    DECLARE v_season_number INT;
    DECLARE v_year VARCHAR(4);
    DECLARE v_year_2digit VARCHAR(2);
    DECLARE v_mode VARCHAR(10);
    DECLARE v_next_number INT;
    DECLARE v_season_prefix VARCHAR(30);
    DECLARE v_demo_suffix VARCHAR(10);
    
    SELECT 
        season_code,
        season_number,
        year,
        mode
    INTO 
        v_season_code,
        v_season_number,
        v_year,
        v_mode
    FROM harvesting_seasons
    WHERE season_id = p_season_id;
    
    SET v_year_2digit = RIGHT(v_year, 2);
    SET v_season_prefix = CONCAT('S/', v_season_code, '/', v_season_number, v_year_2digit);
    SET v_demo_suffix = IF(v_mode = 'LIVE', '', '-demo');
    
    SELECT IFNULL(MAX(
        CAST(
            REPLACE(
                SUBSTRING_INDEX(sales_number, '/', -1),
                '-demo',
                ''
            ) AS UNSIGNED
        )
    ), 0) + 1
    INTO v_next_number
    FROM sales_transactions
    WHERE season_id = p_season_id
      AND sales_number LIKE CONCAT(v_season_prefix, '/%');
    
    SET p_sales_number = CONCAT(v_season_prefix, '/', LPAD(v_next_number, 6, '0'), v_demo_suffix);
END$$

DELIMITER ;

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password_hash, full_name, role) VALUES
('admin', '$2b$10$YRDoNpkfCAxik6XZUhJ4PuU8llzTFq3eJOj42/Ov7w22gepIolqf2', 'Administrator', 'admin')
ON DUPLICATE KEY UPDATE username=username;

-- Insert default paddy products
INSERT INTO paddy_products (product_code, product_name, product_type, variety, description) VALUES
('PB-BIASA', 'Padi Beras (Biasa)', 'BERAS', 'BIASA', 'Regular rice paddy'),
('PB-WANGI', 'Padi Beras (Beras Wangi)', 'BERAS', 'WANGI', 'Fragrant rice paddy'),
('PN-BIASA', 'Padi Benih (Biasa)', 'BENIH', 'BIASA', 'Regular seed paddy'),
('PN-WANGI', 'Padi Benih (Beras Wangi)', 'BENIH', 'WANGI', 'Fragrant seed paddy')
ON DUPLICATE KEY UPDATE product_code=product_code;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

SELECT '✓ Database initialization completed successfully!' AS status,
       'paddy_collection_db' AS database_name,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'paddy_collection_db') AS total_tables,
       (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'paddy_collection_db') AS total_procedures;
