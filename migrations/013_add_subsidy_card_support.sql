-- Migration 013: Add Subsidy Card Support
-- Description: Add QR hashcode column and subsidy_card document type
-- Created: 2025-12-12

USE paddy_collection_db;

SET NAMES utf8mb4;
SET time_zone = '+08:00';

-- ============================================
-- ALTER FARMER_DOCUMENTS TABLE
-- ============================================

-- Step 1: Add qr_hashcode column to store the QR code hash from subsidy card
ALTER TABLE farmer_documents 
ADD COLUMN qr_hashcode VARCHAR(500) AFTER file_size,
ADD INDEX idx_qr_hashcode (qr_hashcode(255));

-- Step 2: Modify document_type ENUM to include 'subsidy_card'
ALTER TABLE farmer_documents 
MODIFY COLUMN document_type ENUM('ic_copy', 'bank_statement', 'land_grant', 'coupon_card', 'subsidy_card', 'other') NOT NULL;

-- Verification queries
SELECT 'Migration 013 completed successfully' AS status;
DESCRIBE farmer_documents;
