-- Migration 007: System Configuration and Audit Tables
-- Description: System settings, audit logs, and application configuration
-- Created: 2025-11-07

USE paddy_collection_db;

-- ============================================
-- SYSTEM SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_category VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    value_type ENUM('string', 'number', 'boolean', 'json', 'date', 'datetime') NOT NULL DEFAULT 'string',
    description TEXT,
    is_editable BOOLEAN DEFAULT TRUE,
    is_encrypted BOOLEAN DEFAULT FALSE,
    display_order INT UNSIGNED DEFAULT 0,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    
    UNIQUE KEY uk_setting_key (setting_category, setting_key),
    INDEX idx_category (setting_category),
    INDEX idx_key (setting_key),
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SYSTEM PRINT SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS system_print_settings (
    print_setting_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_name VARCHAR(100) NOT NULL UNIQUE,
    
    -- Company/Organization Info
    company_name VARCHAR(200),
    company_address TEXT,
    company_phone VARCHAR(20),
    company_email VARCHAR(100),
    company_logo_path VARCHAR(500),
    
    -- Receipt Settings
    show_company_logo BOOLEAN DEFAULT TRUE,
    show_barcode BOOLEAN DEFAULT TRUE,
    show_qr_code BOOLEAN DEFAULT FALSE,
    
    -- Footer message
    footer_message TEXT,
    terms_and_conditions TEXT,
    
    -- Number formatting
    decimal_places INT UNSIGNED DEFAULT 2,
    currency_symbol VARCHAR(10) DEFAULT 'RM',
    currency_position ENUM('before', 'after') DEFAULT 'before',
    
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT UNSIGNED,
    
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGINT UNSIGNED AUTO_INCREMENT,
    user_id INT UNSIGNED,
    username VARCHAR(50),
    
    action_type ENUM('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'print', 'other') NOT NULL,
    table_name VARCHAR(100),
    record_id INT UNSIGNED,
    
    -- What changed
    action_description TEXT,
    old_values JSON COMMENT 'Previous values before change',
    new_values JSON COMMENT 'New values after change',
    
    -- Request details
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    request_method VARCHAR(10),
    request_url VARCHAR(500),
    
    -- Status
    status ENUM('success', 'failed', 'error') NOT NULL DEFAULT 'success',
    error_message TEXT,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary key must include partition key for partitioned tables
    PRIMARY KEY (audit_id, created_at),
    
    INDEX idx_user_id (user_id),
    INDEX idx_action_type (action_type),
    INDEX idx_table_name (table_name),
    INDEX idx_record_id (record_id),
    INDEX idx_status (status)
    
    -- Note: Foreign key removed because MySQL doesn't support FKs on partitioned tables
    -- Application layer should maintain referential integrity for user_id
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p_before_2025 VALUES LESS THAN (2025),
    PARTITION p_2025 VALUES LESS THAN (2026),
    PARTITION p_2026 VALUES LESS THAN (2027),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- ============================================
-- USER SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    
    login_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logout_timestamp DATETIME,
    last_activity DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    device_info VARCHAR(200),
    
    status ENUM('active', 'expired', 'logged_out', 'forced_logout') NOT NULL DEFAULT 'active',
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_status (status),
    INDEX idx_last_activity (last_activity),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ERROR LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS error_logs (
    error_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    error_level ENUM('debug', 'info', 'warning', 'error', 'critical') NOT NULL DEFAULT 'error',
    error_code VARCHAR(50),
    error_message TEXT NOT NULL,
    error_details JSON,
    
    -- Source information
    source_file VARCHAR(500),
    source_line INT UNSIGNED,
    source_function VARCHAR(200),
    
    -- Context
    user_id INT UNSIGNED,
    request_url VARCHAR(500),
    request_method VARCHAR(10),
    ip_address VARCHAR(45),
    
    stack_trace TEXT,
    
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at DATETIME,
    resolved_by INT UNSIGNED,
    resolution_notes TEXT,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_error_level (error_level),
    INDEX idx_error_code (error_code),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_resolved (is_resolved),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SYSTEM NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS system_notifications (
    notification_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    notification_type ENUM('info', 'warning', 'error', 'success') NOT NULL DEFAULT 'info',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Target
    target_type ENUM('all_users', 'specific_user', 'role') NOT NULL DEFAULT 'all_users',
    target_user_id INT UNSIGNED,
    target_role ENUM('admin', 'operator', 'viewer'),
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    
    -- Action
    action_url VARCHAR(500),
    action_label VARCHAR(50),
    
    priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
    expires_at DATETIME,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    
    INDEX idx_target_user (target_user_id),
    INDEX idx_target_role (target_role),
    INDEX idx_is_read (is_read),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (target_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BACKUP LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS backup_logs (
    backup_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    backup_filename VARCHAR(255) NOT NULL,
    backup_path VARCHAR(500),
    backup_type ENUM('full', 'incremental', 'differential') NOT NULL DEFAULT 'full',
    backup_size_mb DECIMAL(10,2),
    
    backup_started_at DATETIME NOT NULL,
    backup_completed_at DATETIME,
    
    status ENUM('in_progress', 'completed', 'failed') NOT NULL DEFAULT 'in_progress',
    error_message TEXT,
    
    triggered_by ENUM('manual', 'scheduled', 'automated') NOT NULL DEFAULT 'manual',
    triggered_user_id INT UNSIGNED,
    
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_backup_type (backup_type),
    INDEX idx_status (status),
    INDEX idx_backup_started_at (backup_started_at),
    
    FOREIGN KEY (triggered_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
