-- Migration: Add effective_weight_kg column to purchase_transactions
-- Date: 2026-01-17
-- Description: Add effective_weight_kg to track weight after deductions for payment calculations

USE paddy_collection_db;

-- Add effective_weight_kg column to purchase_transactions table
ALTER TABLE purchase_transactions
ADD COLUMN effective_weight_kg DECIMAL(10,2) DEFAULT NULL COMMENT 'Effective weight after deductions applied' 
AFTER net_weight_kg;

-- Add index for effective_weight_kg for better query performance
CREATE INDEX idx_effective_weight_kg ON purchase_transactions(effective_weight_kg);
