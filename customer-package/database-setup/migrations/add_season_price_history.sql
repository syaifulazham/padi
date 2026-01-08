-- Create table for tracking season price changes
CREATE TABLE IF NOT EXISTS season_price_history (
  price_history_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  season_id INT UNSIGNED NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  effective_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NULL,
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (season_id) REFERENCES harvesting_seasons(season_id) ON DELETE CASCADE,
  INDEX idx_season_effective_date (season_id, effective_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Records price changes throughout a season';

-- Add current_price_per_kg to harvesting_seasons table
ALTER TABLE harvesting_seasons 
ADD COLUMN current_price_per_kg DECIMAL(10,2) NULL 
COMMENT 'Current active price per kg for purchases'
AFTER opening_price_per_ton;
