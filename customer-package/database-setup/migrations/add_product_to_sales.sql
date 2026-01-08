-- Migration: Add product_id to sales_transactions table
-- Date: 2024-12-09
-- Description: Link sales to specific paddy products

-- Add product_id column to sales_transactions (must match paddy_products.product_id type)
ALTER TABLE sales_transactions ADD COLUMN product_id INT UNSIGNED DEFAULT NULL AFTER season_id;

-- Add foreign key constraint
ALTER TABLE sales_transactions ADD CONSTRAINT fk_sales_product FOREIGN KEY (product_id) REFERENCES paddy_products(product_id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_sales_product ON sales_transactions(product_id);
