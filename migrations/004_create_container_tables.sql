-- Migration 004: Container Management Tables
-- Description: Container tracking and receipt splitting
-- Created: 2025-11-07

USE paddy_collection_db;

-- ============================================
-- DELIVERY CONTAINERS TABLE
-- ============================================
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

-- ============================================
-- CONTAINER LOADING ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS container_loading_items (
    loading_item_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    container_id INT UNSIGNED NOT NULL,
    transaction_id INT UNSIGNED NOT NULL,
    split_portion_id INT UNSIGNED COMMENT 'Reference to split receipt if applicable',
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

-- ============================================
-- RECEIPT SPLIT HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS receipt_split_history (
    split_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    original_transaction_id INT UNSIGNED NOT NULL,
    split_count INT UNSIGNED NOT NULL COMMENT 'How many parts this receipt was split into',
    split_reason TEXT,
    
    -- Original receipt details for audit
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

-- ============================================
-- RECEIPT SPLIT PORTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS receipt_split_portions (
    portion_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    split_id INT UNSIGNED NOT NULL,
    portion_number INT UNSIGNED NOT NULL COMMENT 'Part 1, 2, 3, etc.',
    new_receipt_number VARCHAR(30) NOT NULL UNIQUE,
    portion_weight_kg DECIMAL(10,2) NOT NULL,
    portion_amount DECIMAL(15,2) NOT NULL,
    
    -- Track which container this portion was loaded into
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
