-- Migration 012: Alter Farmers Table
-- Description: Rename farm_size_hectares to farm_size_acres and add second bank fields
-- Created: 2025-12-12

USE paddy_collection_db;

SET NAMES utf8mb4;
SET time_zone = '+08:00';

-- ============================================
-- ALTER FARMERS TABLE
-- ============================================

-- Step 1: Add new columns for second bank
ALTER TABLE farmers 
ADD COLUMN bank2_name VARCHAR(100) AFTER bank_account_number,
ADD COLUMN bank2_account_number VARCHAR(30) AFTER bank2_name;

-- Step 2: Rename farm_size_hectares to farm_size_acres
-- Note: We'll keep the data as-is; conversion should be done at application level if needed
ALTER TABLE farmers 
CHANGE COLUMN farm_size_hectares farm_size_acres DECIMAL(10,2);

-- Verification queries
SELECT 'Migration 012 completed successfully' AS status;
SELECT COUNT(*) AS total_farmers FROM farmers;
DESCRIBE farmers;
