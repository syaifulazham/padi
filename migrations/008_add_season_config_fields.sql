-- Migration: Add season configuration fields
-- Date: 2025-11-13
-- Purpose: Add opening_price, deduction_config (JSON), mode, and year fields to harvesting_seasons

ALTER TABLE harvesting_seasons
ADD COLUMN year INT UNSIGNED AFTER season_name,
ADD COLUMN season_number INT UNSIGNED AFTER year,
ADD COLUMN opening_price_per_kg DECIMAL(10,2) AFTER season_number,
ADD COLUMN deduction_config JSON COMMENT 'JSON array of deduction types with percentages' AFTER opening_price_per_kg,
ADD COLUMN mode ENUM('LIVE', 'DEMO') NOT NULL DEFAULT 'LIVE' COMMENT 'LIVE for production, DEMO for training' AFTER deduction_config;

-- Add index for mode
CREATE INDEX idx_mode ON harvesting_seasons(mode);

-- Update existing records to set year from season_code
UPDATE harvesting_seasons
SET year = CAST(SUBSTRING(season_code, 1, 4) AS UNSIGNED),
    season_number = 1,
    opening_price_per_kg = 1.80,
    mode = 'LIVE'
WHERE year IS NULL;

-- Sample deduction_config structure (commented for reference):
-- [
--   {"type": "Wap Basah", "5": 0.05, "10": 0.10, "15": 0.15},
--   {"type": "Hampa", "5": 0.03, "10": 0.06, "15": 0.09},
--   {"type": "Rusak", "5": 0.04, "10": 0.08, "15": 0.12}
-- ]
