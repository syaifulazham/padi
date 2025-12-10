-- Migration 011: Add split receipt tracking
-- Description: Add columns to track split receipts and their parent transactions
-- Created: 2025-11-24

USE paddy_collection_db;

-- Add columns to track split receipts
ALTER TABLE purchase_transactions
ADD COLUMN parent_transaction_id INT UNSIGNED NULL COMMENT 'Reference to parent transaction if this is a split' AFTER transaction_id,
ADD COLUMN is_split_parent BOOLEAN DEFAULT FALSE COMMENT 'True if this receipt has been split into children' AFTER parent_transaction_id,
ADD COLUMN split_date DATETIME NULL COMMENT 'When this receipt was split' AFTER is_split_parent,
ADD COLUMN split_by INT UNSIGNED NULL COMMENT 'User who performed the split' AFTER split_date;

-- Add foreign key for parent transaction
ALTER TABLE purchase_transactions
ADD CONSTRAINT fk_parent_transaction 
FOREIGN KEY (parent_transaction_id) REFERENCES purchase_transactions(transaction_id) ON DELETE RESTRICT;

-- Add foreign key for split_by user
ALTER TABLE purchase_transactions
ADD CONSTRAINT fk_split_by 
FOREIGN KEY (split_by) REFERENCES users(user_id) ON DELETE SET NULL;

-- Add index for parent_transaction_id
ALTER TABLE purchase_transactions
ADD INDEX idx_parent_transaction_id (parent_transaction_id),
ADD INDEX idx_is_split_parent (is_split_parent);

-- Update existing split receipts (if any) based on status
UPDATE purchase_transactions
SET is_split_parent = TRUE
WHERE status = 'split';
