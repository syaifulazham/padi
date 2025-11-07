-- Migration 001: Base Tables
-- Description: Core user, farmer, and manufacturer management tables
-- Created: 2025-11-07

USE paddy_collection_db;

SET NAMES utf8mb4;
SET time_zone = '+08:00';

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('admin', 'operator', 'viewer') NOT NULL DEFAULT 'operator',
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    last_login DATETIME,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FARMERS TABLE
-- ============================================
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
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FARMER DOCUMENTS TABLE
-- ============================================
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

-- ============================================
-- MANUFACTURERS TABLE
-- ============================================
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

-- ============================================
-- PADDY GRADES TABLE
-- ============================================
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
