-- Migration: Update season price to per metric ton and simplify deduction format
-- Date: 2025-11-15
-- Purpose: Change opening_price from per kg to per metric ton (1000 kg)
--          Deduction format simplified from {type, percentage_5, percentage_10, percentage_15}
--          to {deduction, value} with ability to add custom deduction items

-- Rename column from opening_price_per_kg to opening_price_per_ton
ALTER TABLE harvesting_seasons
CHANGE COLUMN opening_price_per_kg opening_price_per_ton DECIMAL(10,2) COMMENT 'Opening price per metric ton (1000 KG)';

-- Update existing prices: multiply by 1000 to convert from per kg to per ton
UPDATE harvesting_seasons
SET opening_price_per_ton = opening_price_per_ton * 1000
WHERE opening_price_per_ton IS NOT NULL AND opening_price_per_ton < 100;

-- Note: Deduction_config JSON structure change is handled at application level
-- Old format: [{"type": "Wap Basah", "percentage_5": 0.05, "percentage_10": 0.10, "percentage_15": 0.15}]
-- New format: [{"deduction": "Wap Basah", "value": 0.05}]
-- Existing JSON data will be migrated by application on first edit/view
