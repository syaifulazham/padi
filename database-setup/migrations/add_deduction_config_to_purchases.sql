-- Add deduction_config JSON column to purchase_transactions
-- This allows storing custom deduction rates per transaction

ALTER TABLE purchase_transactions 
ADD COLUMN deduction_config JSON NULL 
COMMENT 'Custom deduction configuration for this transaction' 
AFTER foreign_matter_penalty;
