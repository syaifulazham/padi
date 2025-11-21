-- Update price columns to use per ton instead of per kg

-- Update season_price_history table
ALTER TABLE season_price_history 
CHANGE COLUMN price_per_kg price_per_ton DECIMAL(10,2) NOT NULL 
COMMENT 'Price per ton (metric ton = 1000 kg)';

-- Update harvesting_seasons table
ALTER TABLE harvesting_seasons 
CHANGE COLUMN current_price_per_kg current_price_per_ton DECIMAL(10,2) NULL 
COMMENT 'Current active price per ton for purchases';
