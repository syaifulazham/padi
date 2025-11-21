-- Migration: Add weight columns to sales_transactions table
-- Date: 2025-11-13
-- Purpose: Add gross_weight_kg, tare_weight_kg, net_weight_kg to sales_transactions

ALTER TABLE sales_transactions
ADD COLUMN gross_weight_kg DECIMAL(10,2) AFTER total_quantity_kg,
ADD COLUMN tare_weight_kg DECIMAL(10,2) AFTER gross_weight_kg,
ADD COLUMN net_weight_kg DECIMAL(10,2) AFTER tare_weight_kg;

-- Update existing records to set net_weight_kg = total_quantity_kg
UPDATE sales_transactions
SET net_weight_kg = total_quantity_kg
WHERE net_weight_kg IS NULL;
