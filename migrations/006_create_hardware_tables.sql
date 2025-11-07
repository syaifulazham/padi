-- Migration 006: Hardware Integration Tables
-- Description: Weighbridge and printer management
-- Created: 2025-11-07

USE paddy_collection_db;

-- ============================================
-- WEIGHBRIDGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS weighbridges (
    weighbridge_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    weighbridge_code VARCHAR(20) NOT NULL UNIQUE,
    weighbridge_name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    serial_port VARCHAR(50) COMMENT 'COM port or device path',
    baud_rate INT UNSIGNED DEFAULT 9600,
    data_bits INT UNSIGNED DEFAULT 8,
    stop_bits INT UNSIGNED DEFAULT 1,
    parity ENUM('none', 'even', 'odd', 'mark', 'space') DEFAULT 'none',
    
    max_capacity_kg DECIMAL(10,2),
    min_capacity_kg DECIMAL(10,2),
    accuracy_class VARCHAR(10) COMMENT 'e.g., Class III',
    calibration_date DATE,
    next_calibration_date DATE,
    
    status ENUM('active', 'inactive', 'maintenance', 'error') NOT NULL DEFAULT 'active',
    last_connection_test DATETIME,
    connection_status ENUM('connected', 'disconnected', 'error') DEFAULT 'disconnected',
    
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    
    INDEX idx_weighbridge_code (weighbridge_code),
    INDEX idx_status (status),
    INDEX idx_connection_status (connection_status),
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- WEIGHING LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS weighing_logs (
    log_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    weighbridge_id INT UNSIGNED NOT NULL,
    transaction_id INT UNSIGNED COMMENT 'Link to purchase transaction if applicable',
    
    weighing_type ENUM('gross', 'tare', 'net', 'test') NOT NULL,
    weight_kg DECIMAL(10,2) NOT NULL,
    weight_unit VARCHAR(10) DEFAULT 'kg',
    
    vehicle_number VARCHAR(20),
    weighing_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Raw data from weighbridge
    raw_data VARCHAR(500) COMMENT 'Original data string from device',
    
    operator_id INT UNSIGNED,
    session_id VARCHAR(50) COMMENT 'Group related weighings',
    
    status ENUM('valid', 'invalid', 'cancelled') NOT NULL DEFAULT 'valid',
    notes TEXT,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_weighbridge_id (weighbridge_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_weighing_timestamp (weighing_timestamp),
    INDEX idx_vehicle_number (vehicle_number),
    INDEX idx_session_id (session_id),
    
    FOREIGN KEY (weighbridge_id) REFERENCES weighbridges(weighbridge_id) ON DELETE RESTRICT,
    FOREIGN KEY (transaction_id) REFERENCES purchase_transactions(transaction_id) ON DELETE SET NULL,
    FOREIGN KEY (operator_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PRINTER CONFIGURATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS printer_configurations (
    printer_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    printer_code VARCHAR(20) NOT NULL UNIQUE,
    printer_name VARCHAR(100) NOT NULL,
    printer_type ENUM('dot_matrix', 'thermal', 'laser', 'inkjet') NOT NULL,
    
    -- Connection details
    connection_type ENUM('usb', 'network', 'serial', 'bluetooth') NOT NULL,
    connection_string VARCHAR(255) COMMENT 'IP address, COM port, or device path',
    port_number INT UNSIGNED,
    
    -- Printer settings
    paper_width_mm INT UNSIGNED,
    paper_height_mm INT UNSIGNED,
    default_copies INT UNSIGNED DEFAULT 1,
    
    location VARCHAR(100),
    department VARCHAR(50),
    
    status ENUM('active', 'inactive', 'offline', 'error') NOT NULL DEFAULT 'active',
    last_test_print DATETIME,
    
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    
    INDEX idx_printer_code (printer_code),
    INDEX idx_printer_type (printer_type),
    INDEX idx_status (status),
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RECEIPT TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS receipt_templates (
    template_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    template_code VARCHAR(20) NOT NULL UNIQUE,
    template_name VARCHAR(100) NOT NULL,
    template_type ENUM('purchase_receipt', 'sales_receipt', 'weighing_slip', 'report') NOT NULL,
    
    -- Template content
    template_content TEXT COMMENT 'HTML or plain text template',
    header_content TEXT,
    footer_content TEXT,
    
    -- Layout settings
    page_width_mm INT UNSIGNED,
    page_height_mm INT UNSIGNED,
    margin_top_mm INT UNSIGNED DEFAULT 10,
    margin_bottom_mm INT UNSIGNED DEFAULT 10,
    margin_left_mm INT UNSIGNED DEFAULT 10,
    margin_right_mm INT UNSIGNED DEFAULT 10,
    
    font_family VARCHAR(50) DEFAULT 'Arial',
    font_size_pt INT UNSIGNED DEFAULT 12,
    
    is_default BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive', 'draft') NOT NULL DEFAULT 'active',
    
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    
    INDEX idx_template_code (template_code),
    INDEX idx_template_type (template_type),
    INDEX idx_status (status),
    INDEX idx_is_default (is_default),
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- USER PRINT PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_print_preferences (
    preference_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    printer_id INT UNSIGNED,
    template_id INT UNSIGNED,
    auto_print BOOLEAN DEFAULT FALSE,
    default_copies INT UNSIGNED DEFAULT 1,
    print_quality ENUM('draft', 'normal', 'high') DEFAULT 'normal',
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_user_printer (user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_printer_id (printer_id),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (printer_id) REFERENCES printer_configurations(printer_id) ON DELETE SET NULL,
    FOREIGN KEY (template_id) REFERENCES receipt_templates(template_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RECEIPT PRINT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS receipt_print_log (
    print_log_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT UNSIGNED,
    sales_id INT UNSIGNED,
    printer_id INT UNSIGNED,
    template_id INT UNSIGNED,
    
    print_type ENUM('original', 'duplicate', 'copy', 'reprint') NOT NULL DEFAULT 'original',
    copy_number INT UNSIGNED DEFAULT 1,
    
    print_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    printed_by INT UNSIGNED,
    
    print_status ENUM('success', 'failed', 'cancelled') NOT NULL DEFAULT 'success',
    error_message TEXT,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_sales_id (sales_id),
    INDEX idx_printer_id (printer_id),
    INDEX idx_print_timestamp (print_timestamp),
    INDEX idx_printed_by (printed_by),
    
    FOREIGN KEY (transaction_id) REFERENCES purchase_transactions(transaction_id) ON DELETE SET NULL,
    FOREIGN KEY (sales_id) REFERENCES sales_transactions(sales_id) ON DELETE SET NULL,
    FOREIGN KEY (printer_id) REFERENCES printer_configurations(printer_id) ON DELETE SET NULL,
    FOREIGN KEY (template_id) REFERENCES receipt_templates(template_id) ON DELETE SET NULL,
    FOREIGN KEY (printed_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
