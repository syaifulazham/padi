-- Migration: Create Paddy Products System
-- Date: 2025-11-21
-- Description: Add support for different paddy product types with individual pricing and inventory

-- 1. Create paddy_products table (global products)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Global paddy product types';

-- 2. Create season_product_prices table (product pricing per season)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Product prices per season';

-- 3. Create product_price_history table (track price changes per product per season)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='History of product price changes';

-- 4. Add product_id to purchase_transactions
ALTER TABLE purchase_transactions 
ADD COLUMN product_id INT UNSIGNED AFTER season_id,
ADD INDEX idx_product_id (product_id),
ADD FOREIGN KEY (product_id) REFERENCES paddy_products(product_id) ON DELETE RESTRICT;

-- 5. Add product_id to sales_transactions
ALTER TABLE sales_transactions 
ADD COLUMN product_id INT UNSIGNED AFTER season_id,
ADD INDEX idx_sales_product_id (product_id),
ADD FOREIGN KEY (product_id) REFERENCES paddy_products(product_id) ON DELETE RESTRICT;

-- 6. Insert default paddy products
INSERT INTO paddy_products (product_code, product_name, product_type, variety, description) VALUES
('PB-BIASA', 'Padi Beras (Biasa)', 'BERAS', 'BIASA', 'Regular rice paddy'),
('PB-WANGI', 'Padi Beras (Beras Wangi)', 'BERAS', 'WANGI', 'Fragrant rice paddy'),
('PN-BIASA', 'Padi Benih (Biasa)', 'BENIH', 'BIASA', 'Regular seed paddy'),
('PN-WANGI', 'Padi Benih (Beras Wangi)', 'BENIH', 'WANGI', 'Fragrant seed paddy');
