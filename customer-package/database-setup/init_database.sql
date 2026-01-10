-- ============================================
-- PADDY COLLECTION CENTER - DATABASE INITIALIZATION
-- Version: 1.0.0
-- MySQL 8.0+
-- ============================================

CREATE DATABASE IF NOT EXISTS paddy_collection_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE paddy_collection_db;

SET NAMES utf8mb4;
SET time_zone = '+08:00';
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ============================================
-- TABLES
-- ============================================

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `audit_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_type` enum('create','read','update','delete','login','logout','export','print','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `record_id` int unsigned DEFAULT NULL,
  `action_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `old_values` json DEFAULT NULL COMMENT 'Previous values before change',
  `new_values` json DEFAULT NULL COMMENT 'New values after change',
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_method` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('success','failed','error') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'success',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audit_id`,`created_at`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_table_name` (`table_name`),
  KEY `idx_record_id` (`record_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `backup_logs`;
CREATE TABLE `backup_logs` (
  `backup_id` int unsigned NOT NULL AUTO_INCREMENT,
  `backup_filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `backup_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `backup_type` enum('full','incremental','differential') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'full',
  `backup_size_mb` decimal(10,2) DEFAULT NULL,
  `backup_started_at` datetime NOT NULL,
  `backup_completed_at` datetime DEFAULT NULL,
  `status` enum('in_progress','completed','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_progress',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `triggered_by` enum('manual','scheduled','automated') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  `triggered_user_id` int unsigned DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`backup_id`),
  KEY `idx_backup_type` (`backup_type`),
  KEY `idx_status` (`status`),
  KEY `idx_backup_started_at` (`backup_started_at`),
  KEY `triggered_user_id` (`triggered_user_id`),
  CONSTRAINT `backup_logs_ibfk_1` FOREIGN KEY (`triggered_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `container_loading_items`;
CREATE TABLE `container_loading_items` (
  `loading_item_id` int unsigned NOT NULL AUTO_INCREMENT,
  `container_id` int unsigned NOT NULL,
  `transaction_id` int unsigned NOT NULL,
  `split_portion_id` int unsigned DEFAULT NULL COMMENT 'Reference to split receipt if applicable',
  `quantity_loaded_kg` decimal(10,2) NOT NULL,
  `grade_id` int unsigned NOT NULL,
  `loading_sequence` int unsigned DEFAULT NULL,
  `loading_timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`loading_item_id`),
  KEY `idx_container_id` (`container_id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_grade_id` (`grade_id`),
  KEY `idx_loading_timestamp` (`loading_timestamp`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `container_loading_items_ibfk_1` FOREIGN KEY (`container_id`) REFERENCES `delivery_containers` (`container_id`) ON DELETE CASCADE,
  CONSTRAINT `container_loading_items_ibfk_2` FOREIGN KEY (`transaction_id`) REFERENCES `purchase_transactions` (`transaction_id`) ON DELETE RESTRICT,
  CONSTRAINT `container_loading_items_ibfk_3` FOREIGN KEY (`grade_id`) REFERENCES `paddy_grades` (`grade_id`) ON DELETE RESTRICT,
  CONSTRAINT `container_loading_items_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `delivery_containers`;
CREATE TABLE `delivery_containers` (
  `container_id` int unsigned NOT NULL AUTO_INCREMENT,
  `sales_id` int unsigned NOT NULL,
  `container_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `container_type` enum('truck','lorry','container_20ft','container_40ft') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_capacity_kg` decimal(10,2) DEFAULT NULL,
  `actual_loaded_kg` decimal(10,2) DEFAULT '0.00',
  `status` enum('pending','loading','loaded','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `loading_started_at` datetime DEFAULT NULL,
  `loading_completed_at` datetime DEFAULT NULL,
  `loading_started_by` int unsigned DEFAULT NULL,
  `loading_completed_by` int unsigned DEFAULT NULL,
  `seal_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seal_applied_at` datetime DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`container_id`),
  KEY `idx_sales_id` (`sales_id`),
  KEY `idx_container_number` (`container_number`),
  KEY `idx_status` (`status`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `loading_started_by` (`loading_started_by`),
  KEY `loading_completed_by` (`loading_completed_by`),
  CONSTRAINT `delivery_containers_ibfk_1` FOREIGN KEY (`sales_id`) REFERENCES `sales_transactions` (`sales_id`) ON DELETE CASCADE,
  CONSTRAINT `delivery_containers_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `delivery_containers_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `delivery_containers_ibfk_4` FOREIGN KEY (`loading_started_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `delivery_containers_ibfk_5` FOREIGN KEY (`loading_completed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `error_logs`;
CREATE TABLE `error_logs` (
  `error_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `error_level` enum('debug','info','warning','error','critical') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'error',
  `error_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `error_details` json DEFAULT NULL,
  `source_file` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source_line` int unsigned DEFAULT NULL,
  `source_function` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `request_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_method` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stack_trace` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_resolved` tinyint(1) DEFAULT '0',
  `resolved_at` datetime DEFAULT NULL,
  `resolved_by` int unsigned DEFAULT NULL,
  `resolution_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`error_id`),
  KEY `idx_error_level` (`error_level`),
  KEY `idx_error_code` (`error_code`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_is_resolved` (`is_resolved`),
  KEY `resolved_by` (`resolved_by`),
  CONSTRAINT `error_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `error_logs_ibfk_2` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `farmer_documents`;
CREATE TABLE `farmer_documents` (
  `document_id` int unsigned NOT NULL AUTO_INCREMENT,
  `farmer_id` int unsigned NOT NULL,
  `document_type` enum('ic_copy','bank_statement','land_grant','coupon_card','subsidy_card','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int unsigned DEFAULT NULL,
  `qr_hashcode` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `upload_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`document_id`),
  KEY `idx_farmer_id` (`farmer_id`),
  KEY `idx_document_type` (`document_type`),
  KEY `created_by` (`created_by`),
  KEY `idx_qr_hashcode` (`qr_hashcode`(255)),
  CONSTRAINT `farmer_documents_ibfk_1` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`farmer_id`) ON DELETE CASCADE,
  CONSTRAINT `farmer_documents_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `farmers`;
CREATE TABLE `farmers` (
  `farmer_id` int unsigned NOT NULL AUTO_INCREMENT,
  `farmer_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ic_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `postcode` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank2_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank2_account_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `farm_location` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `farm_size_acres` decimal(10,2) DEFAULT NULL,
  `status` enum('active','inactive','blacklisted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `registration_date` date NOT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`farmer_id`),
  UNIQUE KEY `farmer_code` (`farmer_code`),
  UNIQUE KEY `ic_number` (`ic_number`),
  KEY `idx_farmer_code` (`farmer_code`),
  KEY `idx_ic_number` (`ic_number`),
  KEY `idx_full_name` (`full_name`),
  KEY `idx_status` (`status`),
  KEY `idx_registration_date` (`registration_date`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `farmers_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `farmers_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `harvesting_seasons`;
CREATE TABLE `harvesting_seasons` (
  `season_id` int unsigned NOT NULL AUTO_INCREMENT,
  `season_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `season_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int unsigned DEFAULT NULL,
  `season_number` int unsigned DEFAULT NULL,
  `opening_price_per_ton` decimal(10,2) DEFAULT NULL COMMENT 'Opening price per metric ton (1000 KG)',
  `current_price_per_ton` decimal(10,2) DEFAULT NULL COMMENT 'Current active price per ton for purchases',
  `deduction_config` json DEFAULT NULL COMMENT 'JSON array of deduction types with percentages',
  `mode` enum('LIVE','DEMO') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'LIVE' COMMENT 'LIVE for production, DEMO for training',
  `season_type_id` int unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('planned','active','closed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planned',
  `target_quantity_kg` decimal(15,2) DEFAULT NULL,
  `actual_quantity_kg` decimal(15,2) DEFAULT '0.00',
  `total_purchases` decimal(15,2) DEFAULT '0.00',
  `total_sales` decimal(15,2) DEFAULT '0.00',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `closed_at` datetime DEFAULT NULL,
  `closed_by` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`season_id`),
  UNIQUE KEY `season_code` (`season_code`),
  KEY `idx_season_code` (`season_code`),
  KEY `idx_season_type` (`season_type_id`),
  KEY `idx_status` (`status`),
  KEY `idx_start_date` (`start_date`),
  KEY `idx_end_date` (`end_date`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `closed_by` (`closed_by`),
  KEY `idx_mode` (`mode`),
  CONSTRAINT `harvesting_seasons_ibfk_1` FOREIGN KEY (`season_type_id`) REFERENCES `season_type_config` (`type_id`) ON DELETE RESTRICT,
  CONSTRAINT `harvesting_seasons_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `harvesting_seasons_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `harvesting_seasons_ibfk_4` FOREIGN KEY (`closed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventory_movements`;
CREATE TABLE `inventory_movements` (
  `movement_id` int unsigned NOT NULL AUTO_INCREMENT,
  `season_id` int unsigned NOT NULL,
  `grade_id` int unsigned NOT NULL,
  `movement_type` enum('purchase','sale','adjustment','transfer','wastage','return') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `movement_direction` enum('in','out') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_kg` decimal(15,2) NOT NULL,
  `unit_price_per_kg` decimal(10,2) DEFAULT NULL,
  `total_value` decimal(15,2) DEFAULT NULL,
  `reference_type` enum('purchase','sales','adjustment','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` int unsigned DEFAULT NULL COMMENT 'ID from purchase_transactions or sales_transactions',
  `reference_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock_before_kg` decimal(15,2) DEFAULT NULL,
  `stock_after_kg` decimal(15,2) DEFAULT NULL,
  `movement_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`movement_id`),
  KEY `idx_season_id` (`season_id`),
  KEY `idx_grade_id` (`grade_id`),
  KEY `idx_movement_type` (`movement_type`),
  KEY `idx_movement_date` (`movement_date`),
  KEY `idx_reference` (`reference_type`,`reference_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `inventory_movements_ibfk_1` FOREIGN KEY (`season_id`) REFERENCES `harvesting_seasons` (`season_id`) ON DELETE RESTRICT,
  CONSTRAINT `inventory_movements_ibfk_2` FOREIGN KEY (`grade_id`) REFERENCES `paddy_grades` (`grade_id`) ON DELETE RESTRICT,
  CONSTRAINT `inventory_movements_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `inventory_stock`;
CREATE TABLE `inventory_stock` (
  `stock_id` int unsigned NOT NULL AUTO_INCREMENT,
  `season_id` int unsigned NOT NULL,
  `grade_id` int unsigned NOT NULL,
  `current_quantity_kg` decimal(15,2) DEFAULT '0.00',
  `reserved_quantity_kg` decimal(15,2) DEFAULT '0.00' COMMENT 'Reserved for pending sales',
  `available_quantity_kg` decimal(15,2) GENERATED ALWAYS AS ((`current_quantity_kg` - `reserved_quantity_kg`)) STORED,
  `average_cost_per_kg` decimal(10,2) DEFAULT NULL,
  `total_value` decimal(15,2) GENERATED ALWAYS AS ((`current_quantity_kg` * `average_cost_per_kg`)) STORED,
  `storage_location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_quality_check_date` date DEFAULT NULL,
  `quality_status` enum('good','fair','poor','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'good',
  `last_movement_date` datetime DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`stock_id`),
  UNIQUE KEY `uk_season_grade` (`season_id`,`grade_id`),
  KEY `idx_season_id` (`season_id`),
  KEY `idx_grade_id` (`grade_id`),
  KEY `idx_storage_location` (`storage_location`),
  KEY `idx_quality_status` (`quality_status`),
  CONSTRAINT `inventory_stock_ibfk_1` FOREIGN KEY (`season_id`) REFERENCES `harvesting_seasons` (`season_id`) ON DELETE RESTRICT,
  CONSTRAINT `inventory_stock_ibfk_2` FOREIGN KEY (`grade_id`) REFERENCES `paddy_grades` (`grade_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `manufacturers`;
CREATE TABLE `manufacturers` (
  `manufacturer_id` int unsigned NOT NULL AUTO_INCREMENT,
  `manufacturer_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `registration_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_person` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `postcode` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `credit_limit` decimal(15,2) DEFAULT '0.00',
  `payment_terms` int unsigned DEFAULT '30' COMMENT 'Days',
  `status` enum('active','inactive','suspended') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `contract_start_date` date DEFAULT NULL,
  `contract_end_date` date DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`manufacturer_id`),
  UNIQUE KEY `manufacturer_code` (`manufacturer_code`),
  KEY `idx_manufacturer_code` (`manufacturer_code`),
  KEY `idx_company_name` (`company_name`),
  KEY `idx_status` (`status`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `manufacturers_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `manufacturers_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `paddy_grades`;
CREATE TABLE `paddy_grades` (
  `grade_id` int unsigned NOT NULL AUTO_INCREMENT,
  `grade_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `grade_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `min_moisture_content` decimal(5,2) DEFAULT NULL,
  `max_moisture_content` decimal(5,2) DEFAULT NULL,
  `max_foreign_matter` decimal(5,2) DEFAULT NULL,
  `display_order` int unsigned DEFAULT '0',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`grade_id`),
  UNIQUE KEY `grade_code` (`grade_code`),
  KEY `idx_grade_code` (`grade_code`),
  KEY `idx_status` (`status`),
  KEY `idx_display_order` (`display_order`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `paddy_grades_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `paddy_grades_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `paddy_products`;
CREATE TABLE `paddy_products` (
  `product_id` int unsigned NOT NULL AUTO_INCREMENT,
  `product_code` varchar(20) NOT NULL,
  `product_name` varchar(100) NOT NULL,
  `product_type` enum('BERAS','BENIH') NOT NULL COMMENT 'Rice or Seed',
  `variety` enum('BIASA','WANGI') NOT NULL COMMENT 'Regular or Fragrant',
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `product_code` (`product_code`),
  KEY `idx_product_type` (`product_type`),
  KEY `idx_variety` (`variety`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Global paddy product types';

DROP TABLE IF EXISTS `printer_configurations`;
CREATE TABLE `printer_configurations` (
  `printer_id` int unsigned NOT NULL AUTO_INCREMENT,
  `printer_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `printer_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `printer_type` enum('dot_matrix','thermal','laser','inkjet') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection_type` enum('usb','network','serial','bluetooth') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection_string` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IP address, COM port, or device path',
  `port_number` int unsigned DEFAULT NULL,
  `paper_width_mm` int unsigned DEFAULT NULL,
  `paper_height_mm` int unsigned DEFAULT NULL,
  `default_copies` int unsigned DEFAULT '1',
  `location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','offline','error') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `last_test_print` datetime DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`printer_id`),
  UNIQUE KEY `printer_code` (`printer_code`),
  KEY `idx_printer_code` (`printer_code`),
  KEY `idx_printer_type` (`printer_type`),
  KEY `idx_status` (`status`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `printer_configurations_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `printer_configurations_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `product_price_history`;
CREATE TABLE `product_price_history` (
  `price_history_id` int unsigned NOT NULL AUTO_INCREMENT,
  `season_id` int unsigned NOT NULL,
  `product_id` int unsigned NOT NULL,
  `price_per_ton` decimal(10,2) NOT NULL,
  `effective_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text,
  `created_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`price_history_id`),
  KEY `product_id` (`product_id`),
  KEY `idx_season_product` (`season_id`,`product_id`),
  KEY `idx_effective_date` (`effective_date`),
  CONSTRAINT `product_price_history_ibfk_1` FOREIGN KEY (`season_id`) REFERENCES `harvesting_seasons` (`season_id`) ON DELETE CASCADE,
  CONSTRAINT `product_price_history_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `paddy_products` (`product_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='History of product price changes';

DROP TABLE IF EXISTS `purchase_documents`;
CREATE TABLE `purchase_documents` (
  `document_id` int unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` int unsigned NOT NULL,
  `document_type` enum('weighing_slip','quality_cert','photo','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int unsigned DEFAULT NULL,
  `upload_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`document_id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_document_type` (`document_type`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `purchase_documents_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `purchase_transactions` (`transaction_id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_documents_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `purchase_transactions`;
CREATE TABLE `purchase_transactions` (
  `transaction_id` int unsigned NOT NULL AUTO_INCREMENT,
  `parent_transaction_id` int unsigned DEFAULT NULL COMMENT 'Reference to parent transaction if this is a split',
  `is_split_parent` tinyint(1) DEFAULT '0' COMMENT 'True if this receipt has been split into children',
  `split_date` datetime DEFAULT NULL COMMENT 'When this receipt was split',
  `split_by` int unsigned DEFAULT NULL COMMENT 'User who performed the split',
  `receipt_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `season_id` int unsigned NOT NULL,
  `farmer_id` int unsigned NOT NULL,
  `grade_id` int unsigned NOT NULL,
  `product_id` int unsigned DEFAULT NULL,
  `transaction_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `gross_weight_kg` decimal(10,2) NOT NULL,
  `tare_weight_kg` decimal(10,2) DEFAULT '0.00',
  `net_weight_kg` decimal(10,2) NOT NULL,
  `moisture_content` decimal(5,2) DEFAULT NULL,
  `foreign_matter` decimal(5,2) DEFAULT NULL,
  `base_price_per_kg` decimal(10,2) NOT NULL,
  `moisture_penalty` decimal(10,2) DEFAULT '0.00',
  `foreign_matter_penalty` decimal(10,2) DEFAULT '0.00',
  `deduction_config` json DEFAULT NULL COMMENT 'Custom deduction configuration for this transaction',
  `bonus_amount` decimal(10,2) DEFAULT '0.00',
  `final_price_per_kg` decimal(10,2) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `vehicle_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','completed','cancelled','split') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `payment_status` enum('unpaid','partial','paid') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `payment_date` datetime DEFAULT NULL,
  `weighbridge_id` int unsigned DEFAULT NULL,
  `weighing_log_id` int unsigned DEFAULT NULL,
  `is_printed` tinyint(1) DEFAULT '0',
  `print_count` int unsigned DEFAULT '0',
  `last_printed_at` datetime DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cancelled_at` datetime DEFAULT NULL,
  `cancelled_by` int unsigned DEFAULT NULL,
  `cancellation_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`transaction_id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `idx_receipt_number` (`receipt_number`),
  KEY `idx_season_id` (`season_id`),
  KEY `idx_farmer_id` (`farmer_id`),
  KEY `idx_grade_id` (`grade_id`),
  KEY `idx_transaction_date` (`transaction_date`),
  KEY `idx_status` (`status`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_created_at` (`created_at`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `cancelled_by` (`cancelled_by`),
  KEY `idx_product_id` (`product_id`),
  KEY `fk_split_by` (`split_by`),
  KEY `idx_parent_transaction_id` (`parent_transaction_id`),
  KEY `idx_is_split_parent` (`is_split_parent`),
  CONSTRAINT `fk_parent_transaction` FOREIGN KEY (`parent_transaction_id`) REFERENCES `purchase_transactions` (`transaction_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_split_by` FOREIGN KEY (`split_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_transactions_ibfk_1` FOREIGN KEY (`season_id`) REFERENCES `harvesting_seasons` (`season_id`) ON DELETE RESTRICT,
  CONSTRAINT `purchase_transactions_ibfk_2` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`farmer_id`) ON DELETE RESTRICT,
  CONSTRAINT `purchase_transactions_ibfk_3` FOREIGN KEY (`grade_id`) REFERENCES `paddy_grades` (`grade_id`) ON DELETE RESTRICT,
  CONSTRAINT `purchase_transactions_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_transactions_ibfk_5` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_transactions_ibfk_6` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_transactions_ibfk_7` FOREIGN KEY (`product_id`) REFERENCES `paddy_products` (`product_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `receipt_print_log`;
CREATE TABLE `receipt_print_log` (
  `print_log_id` int unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` int unsigned DEFAULT NULL,
  `sales_id` int unsigned DEFAULT NULL,
  `printer_id` int unsigned DEFAULT NULL,
  `template_id` int unsigned DEFAULT NULL,
  `print_type` enum('original','duplicate','copy','reprint') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'original',
  `copy_number` int unsigned DEFAULT '1',
  `print_timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `printed_by` int unsigned DEFAULT NULL,
  `print_status` enum('success','failed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'success',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`print_log_id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_sales_id` (`sales_id`),
  KEY `idx_printer_id` (`printer_id`),
  KEY `idx_print_timestamp` (`print_timestamp`),
  KEY `idx_printed_by` (`printed_by`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `receipt_print_log_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `purchase_transactions` (`transaction_id`) ON DELETE SET NULL,
  CONSTRAINT `receipt_print_log_ibfk_2` FOREIGN KEY (`sales_id`) REFERENCES `sales_transactions` (`sales_id`) ON DELETE SET NULL,
  CONSTRAINT `receipt_print_log_ibfk_3` FOREIGN KEY (`printer_id`) REFERENCES `printer_configurations` (`printer_id`) ON DELETE SET NULL,
  CONSTRAINT `receipt_print_log_ibfk_4` FOREIGN KEY (`template_id`) REFERENCES `receipt_templates` (`template_id`) ON DELETE SET NULL,
  CONSTRAINT `receipt_print_log_ibfk_5` FOREIGN KEY (`printed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `receipt_split_history`;
CREATE TABLE `receipt_split_history` (
  `split_id` int unsigned NOT NULL AUTO_INCREMENT,
  `original_transaction_id` int unsigned NOT NULL,
  `split_count` int unsigned NOT NULL COMMENT 'How many parts this receipt was split into',
  `split_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `original_net_weight_kg` decimal(10,2) NOT NULL,
  `original_total_amount` decimal(15,2) NOT NULL,
  `split_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `split_by` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`split_id`),
  KEY `idx_original_transaction` (`original_transaction_id`),
  KEY `idx_split_date` (`split_date`),
  KEY `split_by` (`split_by`),
  CONSTRAINT `receipt_split_history_ibfk_1` FOREIGN KEY (`original_transaction_id`) REFERENCES `purchase_transactions` (`transaction_id`) ON DELETE RESTRICT,
  CONSTRAINT `receipt_split_history_ibfk_2` FOREIGN KEY (`split_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `receipt_split_portions`;
CREATE TABLE `receipt_split_portions` (
  `portion_id` int unsigned NOT NULL AUTO_INCREMENT,
  `split_id` int unsigned NOT NULL,
  `portion_number` int unsigned NOT NULL COMMENT 'Part 1, 2, 3, etc.',
  `new_receipt_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `portion_weight_kg` decimal(10,2) NOT NULL,
  `portion_amount` decimal(15,2) NOT NULL,
  `loaded_container_id` int unsigned DEFAULT NULL,
  `loading_item_id` int unsigned DEFAULT NULL,
  `status` enum('available','loaded','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`portion_id`),
  UNIQUE KEY `new_receipt_number` (`new_receipt_number`),
  KEY `idx_split_id` (`split_id`),
  KEY `idx_new_receipt_number` (`new_receipt_number`),
  KEY `idx_loaded_container` (`loaded_container_id`),
  KEY `idx_status` (`status`),
  KEY `loading_item_id` (`loading_item_id`),
  CONSTRAINT `receipt_split_portions_ibfk_1` FOREIGN KEY (`split_id`) REFERENCES `receipt_split_history` (`split_id`) ON DELETE CASCADE,
  CONSTRAINT `receipt_split_portions_ibfk_2` FOREIGN KEY (`loaded_container_id`) REFERENCES `delivery_containers` (`container_id`) ON DELETE SET NULL,
  CONSTRAINT `receipt_split_portions_ibfk_3` FOREIGN KEY (`loading_item_id`) REFERENCES `container_loading_items` (`loading_item_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `receipt_templates`;
CREATE TABLE `receipt_templates` (
  `template_id` int unsigned NOT NULL AUTO_INCREMENT,
  `template_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_type` enum('purchase_receipt','sales_receipt','weighing_slip','report') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'HTML or plain text template',
  `header_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `footer_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `page_width_mm` int unsigned DEFAULT NULL,
  `page_height_mm` int unsigned DEFAULT NULL,
  `margin_top_mm` int unsigned DEFAULT '10',
  `margin_bottom_mm` int unsigned DEFAULT '10',
  `margin_left_mm` int unsigned DEFAULT '10',
  `margin_right_mm` int unsigned DEFAULT '10',
  `font_family` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Arial',
  `font_size_pt` int unsigned DEFAULT '12',
  `is_default` tinyint(1) DEFAULT '0',
  `status` enum('active','inactive','draft') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`template_id`),
  UNIQUE KEY `template_code` (`template_code`),
  KEY `idx_template_code` (`template_code`),
  KEY `idx_template_type` (`template_type`),
  KEY `idx_status` (`status`),
  KEY `idx_is_default` (`is_default`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `receipt_templates_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `receipt_templates_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sales_purchase_mapping`;
CREATE TABLE `sales_purchase_mapping` (
  `mapping_id` int unsigned NOT NULL AUTO_INCREMENT,
  `sales_id` int unsigned NOT NULL,
  `transaction_id` int unsigned NOT NULL,
  `quantity_kg` decimal(10,2) NOT NULL,
  `grade_id` int unsigned NOT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`mapping_id`),
  KEY `idx_sales_id` (`sales_id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_grade_id` (`grade_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `sales_purchase_mapping_ibfk_1` FOREIGN KEY (`sales_id`) REFERENCES `sales_transactions` (`sales_id`) ON DELETE CASCADE,
  CONSTRAINT `sales_purchase_mapping_ibfk_2` FOREIGN KEY (`transaction_id`) REFERENCES `purchase_transactions` (`transaction_id`) ON DELETE RESTRICT,
  CONSTRAINT `sales_purchase_mapping_ibfk_3` FOREIGN KEY (`grade_id`) REFERENCES `paddy_grades` (`grade_id`) ON DELETE RESTRICT,
  CONSTRAINT `sales_purchase_mapping_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sales_transactions`;
CREATE TABLE `sales_transactions` (
  `sales_id` int unsigned NOT NULL AUTO_INCREMENT,
  `sales_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `season_id` int unsigned NOT NULL,
  `product_id` int unsigned DEFAULT NULL,
  `manufacturer_id` int unsigned NOT NULL,
  `sale_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `delivery_order_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_ic` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_quantity_kg` decimal(15,2) NOT NULL,
  `gross_weight_kg` decimal(10,2) DEFAULT NULL,
  `tare_weight_kg` decimal(10,2) DEFAULT NULL,
  `net_weight_kg` decimal(10,2) DEFAULT NULL,
  `sale_price_per_kg` decimal(10,2) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `payment_status` enum('pending','partial','paid') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `payment_terms` int unsigned DEFAULT '30' COMMENT 'Days',
  `due_date` date DEFAULT NULL,
  `paid_amount` decimal(15,2) DEFAULT '0.00',
  `payment_date` datetime DEFAULT NULL,
  `status` enum('pending','loading','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `loading_started_at` datetime DEFAULT NULL,
  `loading_completed_at` datetime DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cancelled_at` datetime DEFAULT NULL,
  `cancelled_by` int unsigned DEFAULT NULL,
  `cancellation_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`sales_id`),
  UNIQUE KEY `sales_number` (`sales_number`),
  KEY `idx_sales_number` (`sales_number`),
  KEY `idx_season_id` (`season_id`),
  KEY `idx_manufacturer_id` (`manufacturer_id`),
  KEY `idx_sale_date` (`sale_date`),
  KEY `idx_status` (`status`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `cancelled_by` (`cancelled_by`),
  KEY `idx_sales_product` (`product_id`),
  CONSTRAINT `fk_sales_product` FOREIGN KEY (`product_id`) REFERENCES `paddy_products` (`product_id`) ON DELETE SET NULL,
  CONSTRAINT `sales_transactions_ibfk_1` FOREIGN KEY (`season_id`) REFERENCES `harvesting_seasons` (`season_id`) ON DELETE RESTRICT,
  CONSTRAINT `sales_transactions_ibfk_2` FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers` (`manufacturer_id`) ON DELETE RESTRICT,
  CONSTRAINT `sales_transactions_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `sales_transactions_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `sales_transactions_ibfk_5` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `season_closure_summary`;
CREATE TABLE `season_closure_summary` (
  `closure_id` int unsigned NOT NULL AUTO_INCREMENT,
  `season_id` int unsigned NOT NULL,
  `total_farmers` int unsigned DEFAULT '0',
  `total_purchases` int unsigned DEFAULT '0',
  `total_quantity_kg` decimal(15,2) DEFAULT '0.00',
  `total_purchase_amount` decimal(15,2) DEFAULT '0.00',
  `total_sales` int unsigned DEFAULT '0',
  `total_sales_quantity_kg` decimal(15,2) DEFAULT '0.00',
  `total_sales_amount` decimal(15,2) DEFAULT '0.00',
  `closing_stock_kg` decimal(15,2) DEFAULT '0.00',
  `average_price_per_kg` decimal(10,2) DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `closure_date` datetime NOT NULL,
  `closed_by` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`closure_id`),
  UNIQUE KEY `season_id` (`season_id`),
  KEY `idx_season_id` (`season_id`),
  KEY `idx_closure_date` (`closure_date`),
  KEY `closed_by` (`closed_by`),
  CONSTRAINT `season_closure_summary_ibfk_1` FOREIGN KEY (`season_id`) REFERENCES `harvesting_seasons` (`season_id`) ON DELETE CASCADE,
  CONSTRAINT `season_closure_summary_ibfk_2` FOREIGN KEY (`closed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `season_grade_pricing`;
CREATE TABLE `season_grade_pricing` (
  `pricing_id` int unsigned NOT NULL AUTO_INCREMENT,
  `season_id` int unsigned NOT NULL,
  `grade_id` int unsigned NOT NULL,
  `base_price_per_kg` decimal(10,2) NOT NULL,
  `moisture_penalty_per_percent` decimal(10,2) DEFAULT '0.00',
  `foreign_matter_penalty_per_percent` decimal(10,2) DEFAULT '0.00',
  `bonus_price_per_kg` decimal(10,2) DEFAULT '0.00',
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`pricing_id`),
  KEY `idx_season_id` (`season_id`),
  KEY `idx_grade_id` (`grade_id`),
  KEY `idx_effective_dates` (`effective_from`,`effective_to`),
  KEY `idx_active` (`is_active`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `season_grade_pricing_ibfk_1` FOREIGN KEY (`season_id`) REFERENCES `harvesting_seasons` (`season_id`) ON DELETE CASCADE,
  CONSTRAINT `season_grade_pricing_ibfk_2` FOREIGN KEY (`grade_id`) REFERENCES `paddy_grades` (`grade_id`) ON DELETE CASCADE,
  CONSTRAINT `season_grade_pricing_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `season_grade_pricing_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `season_grade_standards`;
CREATE TABLE `season_grade_standards` (
  `standard_id` int unsigned NOT NULL AUTO_INCREMENT,
  `season_id` int unsigned NOT NULL,
  `grade_id` int unsigned NOT NULL,
  `moisture_penalty_per_percent` decimal(10,2) DEFAULT '0.00',
  `foreign_matter_penalty_per_percent` decimal(10,2) DEFAULT '0.00',
  `min_acceptable_moisture` decimal(5,2) DEFAULT NULL,
  `max_acceptable_moisture` decimal(5,2) DEFAULT NULL,
  `max_acceptable_foreign_matter` decimal(5,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `effective_from` date DEFAULT NULL,
  `effective_to` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`standard_id`),
  UNIQUE KEY `uk_season_grade` (`season_id`,`grade_id`),
  KEY `idx_season_id` (`season_id`),
  KEY `idx_grade_id` (`grade_id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `season_grade_standards_ibfk_1` FOREIGN KEY (`season_id`) REFERENCES `harvesting_seasons` (`season_id`) ON DELETE CASCADE,
  CONSTRAINT `season_grade_standards_ibfk_2` FOREIGN KEY (`grade_id`) REFERENCES `paddy_grades` (`grade_id`) ON DELETE CASCADE,
  CONSTRAINT `season_grade_standards_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `season_grade_standards_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `season_price_history`;
CREATE TABLE `season_price_history` (
  `price_history_id` int unsigned NOT NULL AUTO_INCREMENT,
  `season_id` int unsigned NOT NULL,
  `price_per_ton` decimal(10,2) NOT NULL COMMENT 'Price per ton (metric ton = 1000 kg)',
  `effective_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`price_history_id`),
  KEY `idx_season_effective_date` (`season_id`,`effective_date` DESC),
  CONSTRAINT `season_price_history_ibfk_1` FOREIGN KEY (`season_id`) REFERENCES `harvesting_seasons` (`season_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Records price changes throughout a season';

DROP TABLE IF EXISTS `season_product_prices`;
CREATE TABLE `season_product_prices` (
  `season_product_price_id` int unsigned NOT NULL AUTO_INCREMENT,
  `season_id` int unsigned NOT NULL,
  `product_id` int unsigned NOT NULL,
  `opening_price_per_ton` decimal(10,2) NOT NULL,
  `current_price_per_ton` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`season_product_price_id`),
  UNIQUE KEY `unique_season_product` (`season_id`,`product_id`),
  KEY `idx_season_id` (`season_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `season_product_prices_ibfk_1` FOREIGN KEY (`season_id`) REFERENCES `harvesting_seasons` (`season_id`) ON DELETE CASCADE,
  CONSTRAINT `season_product_prices_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `paddy_products` (`product_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Product prices per season';

DROP TABLE IF EXISTS `season_type_config`;
CREATE TABLE `season_type_config` (
  `type_id` int unsigned NOT NULL AUTO_INCREMENT,
  `type_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `color_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hex color for UI',
  `is_production` tinyint(1) DEFAULT '1',
  `display_order` int unsigned DEFAULT '0',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`type_id`),
  UNIQUE KEY `type_code` (`type_code`),
  KEY `idx_type_code` (`type_code`),
  KEY `idx_status` (`status`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `season_type_config_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `season_type_config_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `stock_adjustments`;
CREATE TABLE `stock_adjustments` (
  `adjustment_id` int unsigned NOT NULL AUTO_INCREMENT,
  `season_id` int unsigned NOT NULL,
  `grade_id` int unsigned NOT NULL,
  `adjustment_type` enum('count_correction','quality_downgrade','wastage','theft','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_adjustment_kg` decimal(15,2) NOT NULL COMMENT 'Positive for increase, negative for decrease',
  `quantity_before_kg` decimal(15,2) NOT NULL,
  `quantity_after_kg` decimal(15,2) NOT NULL,
  `adjustment_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `supporting_document_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_by` int unsigned DEFAULT NULL,
  `approval_date` datetime DEFAULT NULL,
  `approval_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`adjustment_id`),
  KEY `idx_season_id` (`season_id`),
  KEY `idx_grade_id` (`grade_id`),
  KEY `idx_adjustment_type` (`adjustment_type`),
  KEY `idx_status` (`status`),
  KEY `idx_adjustment_date` (`adjustment_date`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `stock_adjustments_ibfk_1` FOREIGN KEY (`season_id`) REFERENCES `harvesting_seasons` (`season_id`) ON DELETE RESTRICT,
  CONSTRAINT `stock_adjustments_ibfk_2` FOREIGN KEY (`grade_id`) REFERENCES `paddy_grades` (`grade_id`) ON DELETE RESTRICT,
  CONSTRAINT `stock_adjustments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `stock_adjustments_ibfk_4` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `stock_adjustments_ibfk_5` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `system_notifications`;
CREATE TABLE `system_notifications` (
  `notification_id` int unsigned NOT NULL AUTO_INCREMENT,
  `notification_type` enum('info','warning','error','success') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` enum('all_users','specific_user','role') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all_users',
  `target_user_id` int unsigned DEFAULT NULL,
  `target_role` enum('admin','operator','viewer') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `action_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_label` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` enum('low','normal','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `idx_target_user` (`target_user_id`),
  KEY `idx_target_role` (`target_role`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_priority` (`priority`),
  KEY `idx_created_at` (`created_at`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `system_notifications_ibfk_1` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `system_notifications_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `system_print_settings`;
CREATE TABLE `system_print_settings` (
  `print_setting_id` int unsigned NOT NULL AUTO_INCREMENT,
  `setting_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `company_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_logo_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `show_company_logo` tinyint(1) DEFAULT '1',
  `show_barcode` tinyint(1) DEFAULT '1',
  `show_qr_code` tinyint(1) DEFAULT '0',
  `footer_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `terms_and_conditions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `decimal_places` int unsigned DEFAULT '2',
  `currency_symbol` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'RM',
  `currency_position` enum('before','after') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'before',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`print_setting_id`),
  UNIQUE KEY `setting_name` (`setting_name`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `system_print_settings_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `system_print_settings_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `setting_id` int unsigned NOT NULL AUTO_INCREMENT,
  `setting_category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `value_type` enum('string','number','boolean','json','date','datetime') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'string',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_editable` tinyint(1) DEFAULT '1',
  `is_encrypted` tinyint(1) DEFAULT '0',
  `display_order` int unsigned DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `uk_setting_key` (`setting_category`,`setting_key`),
  KEY `idx_category` (`setting_category`),
  KEY `idx_key` (`setting_key`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `system_settings_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_print_preferences`;
CREATE TABLE `user_print_preferences` (
  `preference_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `printer_id` int unsigned DEFAULT NULL,
  `template_id` int unsigned DEFAULT NULL,
  `auto_print` tinyint(1) DEFAULT '0',
  `default_copies` int unsigned DEFAULT '1',
  `print_quality` enum('draft','normal','high') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`preference_id`),
  UNIQUE KEY `uk_user_printer` (`user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_printer_id` (`printer_id`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `user_print_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `user_print_preferences_ibfk_2` FOREIGN KEY (`printer_id`) REFERENCES `printer_configurations` (`printer_id`) ON DELETE SET NULL,
  CONSTRAINT `user_print_preferences_ibfk_3` FOREIGN KEY (`template_id`) REFERENCES `receipt_templates` (`template_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_sessions`;
CREATE TABLE `user_sessions` (
  `session_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `session_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `login_timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `logout_timestamp` datetime DEFAULT NULL,
  `last_activity` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_info` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','expired','logged_out','forced_logout') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_token` (`session_token`),
  KEY `idx_status` (`status`),
  KEY `idx_last_activity` (`last_activity`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','operator','viewer') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'operator',
  `status` enum('active','inactive','suspended') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `last_login` datetime DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_username` (`username`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `weighbridges`;
CREATE TABLE `weighbridges` (
  `weighbridge_id` int unsigned NOT NULL AUTO_INCREMENT,
  `weighbridge_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `weighbridge_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serial_port` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'COM port or device path',
  `baud_rate` int unsigned DEFAULT '9600',
  `data_bits` int unsigned DEFAULT '8',
  `stop_bits` int unsigned DEFAULT '1',
  `parity` enum('none','even','odd','mark','space') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'none',
  `max_capacity_kg` decimal(10,2) DEFAULT NULL,
  `min_capacity_kg` decimal(10,2) DEFAULT NULL,
  `accuracy_class` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'e.g., Class III',
  `calibration_date` date DEFAULT NULL,
  `next_calibration_date` date DEFAULT NULL,
  `status` enum('active','inactive','maintenance','error') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `last_connection_test` datetime DEFAULT NULL,
  `connection_status` enum('connected','disconnected','error') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'disconnected',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`weighbridge_id`),
  UNIQUE KEY `weighbridge_code` (`weighbridge_code`),
  KEY `idx_weighbridge_code` (`weighbridge_code`),
  KEY `idx_status` (`status`),
  KEY `idx_connection_status` (`connection_status`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `weighbridges_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `weighbridges_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `weighing_logs`;
CREATE TABLE `weighing_logs` (
  `log_id` int unsigned NOT NULL AUTO_INCREMENT,
  `weighbridge_id` int unsigned NOT NULL,
  `transaction_id` int unsigned DEFAULT NULL COMMENT 'Link to purchase transaction if applicable',
  `weighing_type` enum('gross','tare','net','test') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `weight_kg` decimal(10,2) NOT NULL,
  `weight_unit` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'kg',
  `vehicle_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weighing_timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `raw_data` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Original data string from device',
  `operator_id` int unsigned DEFAULT NULL,
  `session_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Group related weighings',
  `status` enum('valid','invalid','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'valid',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_weighbridge_id` (`weighbridge_id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_weighing_timestamp` (`weighing_timestamp`),
  KEY `idx_vehicle_number` (`vehicle_number`),
  KEY `idx_session_id` (`session_id`),
  KEY `operator_id` (`operator_id`),
  CONSTRAINT `weighing_logs_ibfk_1` FOREIGN KEY (`weighbridge_id`) REFERENCES `weighbridges` (`weighbridge_id`) ON DELETE RESTRICT,
  CONSTRAINT `weighing_logs_ibfk_2` FOREIGN KEY (`transaction_id`) REFERENCES `purchase_transactions` (`transaction_id`) ON DELETE SET NULL,
  CONSTRAINT `weighing_logs_ibfk_3` FOREIGN KEY (`operator_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- VIEWS
-- ============================================

DROP VIEW IF EXISTS `vw_container_loading_details`;
CREATE OR REPLACE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_container_loading_details` AS select `dc`.`container_id` AS `container_id`,`dc`.`container_number` AS `container_number`,`dc`.`container_type` AS `container_type`,`st`.`sales_id` AS `sales_id`,`st`.`sales_number` AS `sales_number`,`m`.`company_name` AS `manufacturer_name`,`dc`.`target_capacity_kg` AS `target_capacity_kg`,`dc`.`actual_loaded_kg` AS `actual_loaded_kg`,`dc`.`status` AS `container_status`,count(`cli`.`loading_item_id`) AS `items_loaded`,sum(`cli`.`quantity_loaded_kg`) AS `total_loaded_kg`,round(((`dc`.`actual_loaded_kg` / nullif(`dc`.`target_capacity_kg`,0)) * 100),2) AS `loading_percentage`,`dc`.`loading_started_at` AS `loading_started_at`,`dc`.`loading_completed_at` AS `loading_completed_at`,timestampdiff(MINUTE,`dc`.`loading_started_at`,`dc`.`loading_completed_at`) AS `loading_duration_minutes` from (((`delivery_containers` `dc` join `sales_transactions` `st` on((`dc`.`sales_id` = `st`.`sales_id`))) join `manufacturers` `m` on((`st`.`manufacturer_id` = `m`.`manufacturer_id`))) left join `container_loading_items` `cli` on((`dc`.`container_id` = `cli`.`container_id`))) group by `dc`.`container_id`,`dc`.`container_number`,`dc`.`container_type`,`st`.`sales_id`,`st`.`sales_number`,`m`.`company_name`,`dc`.`target_capacity_kg`,`dc`.`actual_loaded_kg`,`dc`.`status`,`dc`.`loading_started_at`,`dc`.`loading_completed_at`;

DROP VIEW IF EXISTS `vw_current_inventory_summary`;
CREATE OR REPLACE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_current_inventory_summary` AS select `ist`.`stock_id` AS `stock_id`,`hs`.`season_id` AS `season_id`,`hs`.`season_name` AS `season_name`,`hs`.`status` AS `season_status`,`pg`.`grade_id` AS `grade_id`,`pg`.`grade_name` AS `grade_name`,`ist`.`current_quantity_kg` AS `current_quantity_kg`,`ist`.`reserved_quantity_kg` AS `reserved_quantity_kg`,`ist`.`available_quantity_kg` AS `available_quantity_kg`,`ist`.`average_cost_per_kg` AS `average_cost_per_kg`,`ist`.`total_value` AS `total_value`,`ist`.`storage_location` AS `storage_location`,`ist`.`quality_status` AS `quality_status`,`ist`.`last_quality_check_date` AS `last_quality_check_date`,`ist`.`last_movement_date` AS `last_movement_date` from ((`inventory_stock` `ist` join `harvesting_seasons` `hs` on((`ist`.`season_id` = `hs`.`season_id`))) join `paddy_grades` `pg` on((`ist`.`grade_id` = `pg`.`grade_id`))) where (`ist`.`current_quantity_kg` > 0) order by `hs`.`season_name`,`pg`.`display_order`;

DROP VIEW IF EXISTS `vw_daily_purchase_summary`;
CREATE OR REPLACE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_daily_purchase_summary` AS select cast(`pt`.`transaction_date` as date) AS `purchase_date`,`hs`.`season_id` AS `season_id`,`hs`.`season_name` AS `season_name`,`pg`.`grade_id` AS `grade_id`,`pg`.`grade_name` AS `grade_name`,count(`pt`.`transaction_id`) AS `total_transactions`,count(distinct `pt`.`farmer_id`) AS `unique_farmers`,sum(`pt`.`net_weight_kg`) AS `total_weight_kg`,avg(`pt`.`final_price_per_kg`) AS `avg_price_per_kg`,sum(`pt`.`total_amount`) AS `total_amount`,avg(`pt`.`moisture_content`) AS `avg_moisture_content`,avg(`pt`.`foreign_matter`) AS `avg_foreign_matter` from ((`purchase_transactions` `pt` join `harvesting_seasons` `hs` on((`pt`.`season_id` = `hs`.`season_id`))) join `paddy_grades` `pg` on((`pt`.`grade_id` = `pg`.`grade_id`))) where (`pt`.`status` = 'completed') group by cast(`pt`.`transaction_date` as date),`hs`.`season_id`,`hs`.`season_name`,`pg`.`grade_id`,`pg`.`grade_name`;

DROP VIEW IF EXISTS `vw_farmer_purchase_summary`;
CREATE OR REPLACE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_farmer_purchase_summary` AS select `f`.`farmer_id` AS `farmer_id`,`f`.`farmer_code` AS `farmer_code`,`f`.`full_name` AS `farmer_name`,`f`.`phone` AS `phone`,`f`.`status` AS `farmer_status`,`hs`.`season_id` AS `season_id`,`hs`.`season_name` AS `season_name`,count(`pt`.`transaction_id`) AS `total_transactions`,sum(`pt`.`net_weight_kg`) AS `total_weight_kg`,sum(`pt`.`total_amount`) AS `total_amount`,avg(`pt`.`final_price_per_kg`) AS `avg_price_per_kg`,min(`pt`.`transaction_date`) AS `first_transaction_date`,max(`pt`.`transaction_date`) AS `last_transaction_date`,avg(`pt`.`moisture_content`) AS `avg_moisture_content`,avg(`pt`.`foreign_matter`) AS `avg_foreign_matter` from ((`farmers` `f` left join `purchase_transactions` `pt` on(((`f`.`farmer_id` = `pt`.`farmer_id`) and (`pt`.`status` = 'completed')))) left join `harvesting_seasons` `hs` on((`pt`.`season_id` = `hs`.`season_id`))) group by `f`.`farmer_id`,`f`.`farmer_code`,`f`.`full_name`,`f`.`phone`,`f`.`status`,`hs`.`season_id`,`hs`.`season_name`;

DROP VIEW IF EXISTS `vw_grade_performance`;
CREATE OR REPLACE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_grade_performance` AS select `pg`.`grade_id` AS `grade_id`,`pg`.`grade_code` AS `grade_code`,`pg`.`grade_name` AS `grade_name`,`hs`.`season_id` AS `season_id`,`hs`.`season_name` AS `season_name`,count(`pt`.`transaction_id`) AS `total_transactions`,sum(`pt`.`net_weight_kg`) AS `total_purchased_kg`,avg(`pt`.`final_price_per_kg`) AS `avg_purchase_price`,min(`pt`.`final_price_per_kg`) AS `min_price`,max(`pt`.`final_price_per_kg`) AS `max_price`,avg(`pt`.`moisture_content`) AS `avg_moisture`,avg(`pt`.`foreign_matter`) AS `avg_foreign_matter`,ifnull(`ist`.`current_quantity_kg`,0) AS `current_stock_kg`,ifnull(`ist`.`available_quantity_kg`,0) AS `available_stock_kg` from (((`paddy_grades` `pg` join `harvesting_seasons` `hs`) left join `purchase_transactions` `pt` on(((`pg`.`grade_id` = `pt`.`grade_id`) and (`hs`.`season_id` = `pt`.`season_id`) and (`pt`.`status` = 'completed')))) left join `inventory_stock` `ist` on(((`pg`.`grade_id` = `ist`.`grade_id`) and (`hs`.`season_id` = `ist`.`season_id`)))) where (`hs`.`status` in ('active','closed')) group by `pg`.`grade_id`,`pg`.`grade_code`,`pg`.`grade_name`,`hs`.`season_id`,`hs`.`season_name`,`ist`.`current_quantity_kg`,`ist`.`available_quantity_kg` having ((`total_transactions` > 0) or (`current_stock_kg` > 0));

DROP VIEW IF EXISTS `vw_manufacturer_sales_summary`;
CREATE OR REPLACE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_manufacturer_sales_summary` AS select `m`.`manufacturer_id` AS `manufacturer_id`,`m`.`manufacturer_code` AS `manufacturer_code`,`m`.`company_name` AS `company_name`,`m`.`status` AS `manufacturer_status`,`hs`.`season_id` AS `season_id`,`hs`.`season_name` AS `season_name`,count(`st`.`sales_id`) AS `total_sales`,sum(`st`.`total_quantity_kg`) AS `total_quantity_kg`,sum(`st`.`total_amount`) AS `total_amount`,sum(`st`.`paid_amount`) AS `total_paid`,sum((`st`.`total_amount` - `st`.`paid_amount`)) AS `outstanding_amount`,avg(`st`.`sale_price_per_kg`) AS `avg_price_per_kg`,min(`st`.`sale_date`) AS `first_sale_date`,max(`st`.`sale_date`) AS `last_sale_date` from ((`manufacturers` `m` left join `sales_transactions` `st` on(((`m`.`manufacturer_id` = `st`.`manufacturer_id`) and (`st`.`status` = 'completed')))) left join `harvesting_seasons` `hs` on((`st`.`season_id` = `hs`.`season_id`))) group by `m`.`manufacturer_id`,`m`.`manufacturer_code`,`m`.`company_name`,`m`.`status`,`hs`.`season_id`,`hs`.`season_name`;

DROP VIEW IF EXISTS `vw_pending_payments`;
CREATE OR REPLACE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_pending_payments` AS select 'sales' AS `transaction_type`,`st`.`sales_id` AS `transaction_id`,`st`.`sales_number` AS `transaction_number`,`st`.`sale_date` AS `transaction_date`,`m`.`manufacturer_id` AS `party_id`,`m`.`company_name` AS `party_name`,`m`.`phone` AS `party_phone`,`st`.`total_amount` AS `total_amount`,`st`.`paid_amount` AS `paid_amount`,(`st`.`total_amount` - `st`.`paid_amount`) AS `outstanding_amount`,`st`.`due_date` AS `due_date`,(to_days(curdate()) - to_days(`st`.`due_date`)) AS `days_overdue`,`st`.`payment_status` AS `payment_status` from (`sales_transactions` `st` join `manufacturers` `m` on((`st`.`manufacturer_id` = `m`.`manufacturer_id`))) where ((`st`.`payment_status` in ('pending','partial')) and (`st`.`status` = 'completed')) union all select 'purchase' AS `transaction_type`,`pt`.`transaction_id` AS `transaction_id`,`pt`.`receipt_number` AS `transaction_number`,`pt`.`transaction_date` AS `transaction_date`,`f`.`farmer_id` AS `party_id`,`f`.`full_name` AS `party_name`,`f`.`phone` AS `party_phone`,`pt`.`total_amount` AS `total_amount`,0 AS `paid_amount`,`pt`.`total_amount` AS `outstanding_amount`,NULL AS `due_date`,NULL AS `days_overdue`,`pt`.`payment_status` AS `payment_status` from (`purchase_transactions` `pt` join `farmers` `f` on((`pt`.`farmer_id` = `f`.`farmer_id`))) where ((`pt`.`payment_status` = 'unpaid') and (`pt`.`status` = 'completed')) order by `transaction_date` desc;

DROP VIEW IF EXISTS `vw_production_purchases`;
CREATE OR REPLACE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_production_purchases` AS select `pt`.`transaction_id` AS `transaction_id`,`pt`.`receipt_number` AS `receipt_number`,`pt`.`season_id` AS `season_id`,`pt`.`farmer_id` AS `farmer_id`,`pt`.`grade_id` AS `grade_id`,`pt`.`transaction_date` AS `transaction_date`,`pt`.`gross_weight_kg` AS `gross_weight_kg`,`pt`.`tare_weight_kg` AS `tare_weight_kg`,`pt`.`net_weight_kg` AS `net_weight_kg`,`pt`.`moisture_content` AS `moisture_content`,`pt`.`foreign_matter` AS `foreign_matter`,`pt`.`base_price_per_kg` AS `base_price_per_kg`,`pt`.`moisture_penalty` AS `moisture_penalty`,`pt`.`foreign_matter_penalty` AS `foreign_matter_penalty`,`pt`.`bonus_amount` AS `bonus_amount`,`pt`.`final_price_per_kg` AS `final_price_per_kg`,`pt`.`total_amount` AS `total_amount`,`pt`.`vehicle_number` AS `vehicle_number`,`pt`.`driver_name` AS `driver_name`,`pt`.`status` AS `status`,`pt`.`payment_status` AS `payment_status`,`pt`.`payment_date` AS `payment_date`,`pt`.`weighbridge_id` AS `weighbridge_id`,`pt`.`weighing_log_id` AS `weighing_log_id`,`pt`.`is_printed` AS `is_printed`,`pt`.`print_count` AS `print_count`,`pt`.`last_printed_at` AS `last_printed_at`,`pt`.`notes` AS `notes`,`pt`.`cancelled_at` AS `cancelled_at`,`pt`.`cancelled_by` AS `cancelled_by`,`pt`.`cancellation_reason` AS `cancellation_reason`,`pt`.`created_at` AS `created_at`,`pt`.`created_by` AS `created_by`,`pt`.`updated_at` AS `updated_at`,`pt`.`updated_by` AS `updated_by`,`hs`.`season_name` AS `season_name`,`hs`.`season_code` AS `season_code`,`stc`.`type_name` AS `season_type`,`f`.`farmer_code` AS `farmer_code`,`f`.`full_name` AS `farmer_name`,`f`.`phone` AS `farmer_phone`,`pg`.`grade_name` AS `grade_name`,`pg`.`grade_code` AS `grade_code` from ((((`purchase_transactions` `pt` join `harvesting_seasons` `hs` on((`pt`.`season_id` = `hs`.`season_id`))) join `season_type_config` `stc` on((`hs`.`season_type_id` = `stc`.`type_id`))) join `farmers` `f` on((`pt`.`farmer_id` = `f`.`farmer_id`))) join `paddy_grades` `pg` on((`pt`.`grade_id` = `pg`.`grade_id`))) where ((`stc`.`is_production` = true) and (`pt`.`status` = 'completed')) order by `pt`.`transaction_date` desc;

DROP VIEW IF EXISTS `vw_season_performance`;
CREATE OR REPLACE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_season_performance` AS select `hs`.`season_id` AS `season_id`,`hs`.`season_code` AS `season_code`,`hs`.`season_name` AS `season_name`,`hs`.`status` AS `status`,`hs`.`start_date` AS `start_date`,`hs`.`end_date` AS `end_date`,(to_days(ifnull(`hs`.`end_date`,curdate())) - to_days(`hs`.`start_date`)) AS `duration_days`,count(distinct `pt`.`transaction_id`) AS `total_purchases`,count(distinct `pt`.`farmer_id`) AS `unique_farmers`,sum(`pt`.`net_weight_kg`) AS `total_purchased_kg`,sum(`pt`.`total_amount`) AS `total_purchase_amount`,avg(`pt`.`final_price_per_kg`) AS `avg_purchase_price`,count(distinct `st`.`sales_id`) AS `total_sales`,count(distinct `st`.`manufacturer_id`) AS `unique_manufacturers`,ifnull(sum(`st`.`total_quantity_kg`),0) AS `total_sold_kg`,ifnull(sum(`st`.`total_amount`),0) AS `total_sales_amount`,ifnull(sum(`ist`.`current_quantity_kg`),0) AS `current_stock_kg`,(ifnull(sum(`st`.`total_amount`),0) - sum(`pt`.`total_amount`)) AS `gross_margin` from (((`harvesting_seasons` `hs` left join `purchase_transactions` `pt` on(((`hs`.`season_id` = `pt`.`season_id`) and (`pt`.`status` = 'completed')))) left join `sales_transactions` `st` on(((`hs`.`season_id` = `st`.`season_id`) and (`st`.`status` = 'completed')))) left join `inventory_stock` `ist` on((`hs`.`season_id` = `ist`.`season_id`))) group by `hs`.`season_id`,`hs`.`season_code`,`hs`.`season_name`,`hs`.`status`,`hs`.`start_date`,`hs`.`end_date`;


-- ============================================
-- STORED PROCEDURES
-- ============================================

DELIMITER //

DROP PROCEDURE IF EXISTS `sp_calculate_purchase_amount`; //
CREATE PROCEDURE `sp_calculate_purchase_amount`(
    IN p_net_weight_kg DECIMAL(10,2),
    IN p_base_price DECIMAL(10,2),
    IN p_moisture_content DECIMAL(5,2),
    IN p_foreign_matter DECIMAL(5,2),
    IN p_season_id INT UNSIGNED,
    IN p_grade_id INT UNSIGNED,
    OUT p_moisture_penalty DECIMAL(10,2),
    OUT p_foreign_matter_penalty DECIMAL(10,2),
    OUT p_final_price DECIMAL(10,2),
    OUT p_total_amount DECIMAL(15,2)
)
BEGIN
    DECLARE v_moisture_penalty_rate DECIMAL(10,2) DEFAULT 0;
    DECLARE v_fm_penalty_rate DECIMAL(10,2) DEFAULT 0;
    DECLARE v_max_acceptable_moisture DECIMAL(5,2);
    DECLARE v_max_acceptable_fm DECIMAL(5,2);
    
    
    SELECT 
        moisture_penalty_per_percent,
        foreign_matter_penalty_per_percent,
        max_acceptable_moisture,
        max_acceptable_foreign_matter
    INTO 
        v_moisture_penalty_rate,
        v_fm_penalty_rate,
        v_max_acceptable_moisture,
        v_max_acceptable_fm
    FROM season_grade_standards
    WHERE season_id = p_season_id
      AND grade_id = p_grade_id
      AND is_active = TRUE
    LIMIT 1;
    
    
    IF p_moisture_content > v_max_acceptable_moisture THEN
        SET p_moisture_penalty = (p_moisture_content - v_max_acceptable_moisture) * v_moisture_penalty_rate;
    ELSE
        SET p_moisture_penalty = 0;
    END IF;
    
    
    IF p_foreign_matter > v_max_acceptable_fm THEN
        SET p_foreign_matter_penalty = (p_foreign_matter - v_max_acceptable_fm) * v_fm_penalty_rate;
    ELSE
        SET p_foreign_matter_penalty = 0;
    END IF;
    
    
    SET p_final_price = p_base_price - p_moisture_penalty - p_foreign_matter_penalty;
    SET p_total_amount = p_net_weight_kg * p_final_price;
END //

DROP PROCEDURE IF EXISTS `sp_close_season`; //
CREATE PROCEDURE `sp_close_season`(
    IN p_season_id INT UNSIGNED,
    IN p_closed_by INT UNSIGNED
)
BEGIN
    DECLARE v_total_farmers INT;
    DECLARE v_total_purchases INT;
    DECLARE v_total_purchase_qty DECIMAL(15,2);
    DECLARE v_total_purchase_amt DECIMAL(15,2);
    DECLARE v_total_sales INT;
    DECLARE v_total_sales_qty DECIMAL(15,2);
    DECLARE v_total_sales_amt DECIMAL(15,2);
    DECLARE v_closing_stock DECIMAL(15,2);
    DECLARE v_avg_price DECIMAL(10,2);
    
    
    SELECT 
        COUNT(DISTINCT farmer_id),
        COUNT(*),
        IFNULL(SUM(net_weight_kg), 0),
        IFNULL(SUM(total_amount), 0),
        IFNULL(AVG(final_price_per_kg), 0)
    INTO 
        v_total_farmers,
        v_total_purchases,
        v_total_purchase_qty,
        v_total_purchase_amt,
        v_avg_price
    FROM purchase_transactions
    WHERE season_id = p_season_id
      AND status = 'completed';
    
    
    SELECT 
        IFNULL(COUNT(*), 0),
        IFNULL(SUM(total_quantity_kg), 0),
        IFNULL(SUM(total_amount), 0)
    INTO 
        v_total_sales,
        v_total_sales_qty,
        v_total_sales_amt
    FROM sales_transactions
    WHERE season_id = p_season_id
      AND status = 'completed';
    
    
    SELECT IFNULL(SUM(current_quantity_kg), 0)
    INTO v_closing_stock
    FROM inventory_stock
    WHERE season_id = p_season_id;
    
    
    INSERT INTO season_closure_summary (
        season_id, total_farmers, total_purchases, total_quantity_kg,
        total_purchase_amount, total_sales, total_sales_quantity_kg,
        total_sales_amount, closing_stock_kg, average_price_per_kg,
        closure_date, closed_by
    ) VALUES (
        p_season_id, v_total_farmers, v_total_purchases, v_total_purchase_qty,
        v_total_purchase_amt, v_total_sales, v_total_sales_qty,
        v_total_sales_amt, v_closing_stock, v_avg_price,
        NOW(), p_closed_by
    );
    
    
    UPDATE harvesting_seasons
    SET status = 'closed',
        closed_at = NOW(),
        closed_by = p_closed_by
    WHERE season_id = p_season_id;
    
    SELECT 'Season closed successfully' AS message;
END //

DROP PROCEDURE IF EXISTS `sp_generate_receipt_number`; //
CREATE PROCEDURE `sp_generate_receipt_number`(
    IN p_season_id INT UNSIGNED,
    OUT p_receipt_number VARCHAR(30)
)
BEGIN
    DECLARE v_season_code VARCHAR(20);
    DECLARE v_season_number INT;
    DECLARE v_year VARCHAR(4);
    DECLARE v_year_2digit VARCHAR(2);
    DECLARE v_mode VARCHAR(10);
    DECLARE v_next_number INT;
    DECLARE v_season_prefix VARCHAR(30);
    DECLARE v_demo_suffix VARCHAR(10);
    
    
    SELECT 
        season_code,
        season_number,
        year,
        mode
    INTO 
        v_season_code,
        v_season_number,
        v_year,
        v_mode
    FROM harvesting_seasons
    WHERE season_id = p_season_id;
    
    
    SET v_year_2digit = RIGHT(v_year, 2);
    
    
    SET v_season_prefix = CONCAT('P/', v_season_code, '/', v_season_number, v_year_2digit);
    
    
    SET v_demo_suffix = IF(v_mode = 'LIVE', '', '-demo');
    
    
    
    SELECT IFNULL(MAX(
        CAST(
            REPLACE(
                SUBSTRING_INDEX(receipt_number, '/', -1),
                '-demo',
                ''
            ) AS UNSIGNED
        )
    ), 0) + 1
    INTO v_next_number
    FROM purchase_transactions
    WHERE season_id = p_season_id
      AND receipt_number LIKE CONCAT(v_season_prefix, '/%');
    
    
    SET p_receipt_number = CONCAT(v_season_prefix, '/', LPAD(v_next_number, 6, '0'), v_demo_suffix);
END //

DROP PROCEDURE IF EXISTS `sp_generate_sales_number`; //
CREATE PROCEDURE `sp_generate_sales_number`(
    IN p_season_id INT UNSIGNED,
    OUT p_sales_number VARCHAR(30)
)
BEGIN
    DECLARE v_season_code VARCHAR(20);
    DECLARE v_season_number INT;
    DECLARE v_year VARCHAR(4);
    DECLARE v_year_2digit VARCHAR(2);
    DECLARE v_mode VARCHAR(10);
    DECLARE v_next_number INT;
    DECLARE v_season_prefix VARCHAR(30);
    DECLARE v_demo_suffix VARCHAR(10);
    
    
    SELECT 
        season_code,
        season_number,
        year,
        mode
    INTO 
        v_season_code,
        v_season_number,
        v_year,
        v_mode
    FROM harvesting_seasons
    WHERE season_id = p_season_id;
    
    
    SET v_year_2digit = RIGHT(v_year, 2);
    
    
    SET v_season_prefix = CONCAT('S/', v_season_code, '/', v_season_number, v_year_2digit);
    
    
    SET v_demo_suffix = IF(v_mode = 'LIVE', '', '-demo');
    
    
    
    SELECT IFNULL(MAX(
        CAST(
            REPLACE(
                SUBSTRING_INDEX(sales_number, '/', -1),
                '-demo',
                ''
            ) AS UNSIGNED
        )
    ), 0) + 1
    INTO v_next_number
    FROM sales_transactions
    WHERE season_id = p_season_id
      AND sales_number LIKE CONCAT(v_season_prefix, '/%');
    
    
    SET p_sales_number = CONCAT(v_season_prefix, '/', LPAD(v_next_number, 6, '0'), v_demo_suffix);
END //

DROP PROCEDURE IF EXISTS `sp_get_farmer_stats`; //
CREATE PROCEDURE `sp_get_farmer_stats`(
    IN p_farmer_id INT UNSIGNED,
    IN p_season_id INT UNSIGNED
)
BEGIN
    SELECT 
        f.farmer_code,
        f.full_name,
        COUNT(pt.transaction_id) AS total_deliveries,
        SUM(pt.net_weight_kg) AS total_weight_kg,
        SUM(pt.total_amount) AS total_earnings,
        AVG(pt.final_price_per_kg) AS avg_price_per_kg,
        AVG(pt.moisture_content) AS avg_moisture,
        AVG(pt.foreign_matter) AS avg_foreign_matter,
        MIN(pt.transaction_date) AS first_delivery,
        MAX(pt.transaction_date) AS last_delivery
    FROM farmers f
    LEFT JOIN purchase_transactions pt ON f.farmer_id = pt.farmer_id
        AND pt.season_id = p_season_id
        AND pt.status = 'completed'
    WHERE f.farmer_id = p_farmer_id
    GROUP BY f.farmer_id, f.farmer_code, f.full_name;
END //

DROP PROCEDURE IF EXISTS `sp_get_stock_level`; //
CREATE PROCEDURE `sp_get_stock_level`(
    IN p_season_id INT UNSIGNED,
    IN p_grade_id INT UNSIGNED,
    OUT p_current_stock DECIMAL(15,2),
    OUT p_reserved_stock DECIMAL(15,2),
    OUT p_available_stock DECIMAL(15,2)
)
BEGIN
    SELECT 
        IFNULL(current_quantity_kg, 0),
        IFNULL(reserved_quantity_kg, 0),
        IFNULL(available_quantity_kg, 0)
    INTO 
        p_current_stock,
        p_reserved_stock,
        p_available_stock
    FROM inventory_stock
    WHERE season_id = p_season_id
      AND grade_id = p_grade_id;
END //

DELIMITER ;


-- ============================================
-- TRIGGERS
-- ============================================

DELIMITER //

DROP TRIGGER IF EXISTS `trg_after_container_item_insert`; //
CREATE TRIGGER `trg_after_container_item_insert` AFTER INSERT ON `container_loading_items` FOR EACH ROW BEGIN
    DECLARE v_season_id INT UNSIGNED;
    
    
    SELECT season_id INTO v_season_id
    FROM purchase_transactions
    WHERE transaction_id = NEW.transaction_id;
    
    
    UPDATE inventory_stock
    SET current_quantity_kg = current_quantity_kg - NEW.quantity_loaded_kg,
        last_movement_date = NEW.loading_timestamp
    WHERE season_id = v_season_id
      AND grade_id = NEW.grade_id;
    
    
    UPDATE delivery_containers
    SET actual_loaded_kg = actual_loaded_kg + NEW.quantity_loaded_kg
    WHERE container_id = NEW.container_id;
END //

DROP TRIGGER IF EXISTS `trg_after_purchase_insert`; //
CREATE TRIGGER `trg_after_purchase_insert` AFTER INSERT ON `purchase_transactions` FOR EACH ROW BEGIN
    IF NEW.status = 'completed' THEN
        
        INSERT INTO inventory_stock (season_id, grade_id, current_quantity_kg, average_cost_per_kg, last_movement_date)
        VALUES (NEW.season_id, NEW.grade_id, NEW.net_weight_kg, NEW.final_price_per_kg, NEW.transaction_date)
        ON DUPLICATE KEY UPDATE
            current_quantity_kg = current_quantity_kg + NEW.net_weight_kg,
            average_cost_per_kg = ((average_cost_per_kg * current_quantity_kg) + (NEW.final_price_per_kg * NEW.net_weight_kg)) 
                                / (current_quantity_kg + NEW.net_weight_kg),
            last_movement_date = NEW.transaction_date;
        
        
        INSERT INTO inventory_movements (
            season_id, grade_id, movement_type, movement_direction, 
            quantity_kg, unit_price_per_kg, total_value,
            reference_type, reference_id, reference_number,
            movement_date, created_by
        ) VALUES (
            NEW.season_id, NEW.grade_id, 'purchase', 'in',
            NEW.net_weight_kg, NEW.final_price_per_kg, NEW.total_amount,
            'purchase', NEW.transaction_id, NEW.receipt_number,
            NEW.transaction_date, NEW.created_by
        );
    END IF;
END //

DROP TRIGGER IF EXISTS `trg_after_sales_complete`; //
CREATE TRIGGER `trg_after_sales_complete` AFTER UPDATE ON `sales_transactions` FOR EACH ROW BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        
        
        INSERT INTO inventory_movements (
            season_id, grade_id, movement_type, movement_direction,
            quantity_kg, unit_price_per_kg, total_value,
            reference_type, reference_id, reference_number,
            movement_date, created_by
        ) VALUES (
            NEW.season_id, NULL, 'sale', 'out',
            NEW.total_quantity_kg, NEW.sale_price_per_kg, NEW.total_amount,
            'sales', NEW.sales_id, NEW.sales_number,
            NEW.sale_date, NEW.updated_by
        );
    END IF;
END //

DROP TRIGGER IF EXISTS `trg_before_purchase_insert`; //
CREATE TRIGGER `trg_before_purchase_insert` BEFORE INSERT ON `purchase_transactions` FOR EACH ROW BEGIN
    
    IF NEW.net_weight_kg IS NULL OR NEW.net_weight_kg = 0 THEN
        SET NEW.net_weight_kg = NEW.gross_weight_kg - NEW.tare_weight_kg;
    END IF;
    
    
    SET NEW.final_price_per_kg = NEW.base_price_per_kg - NEW.moisture_penalty - NEW.foreign_matter_penalty + NEW.bonus_amount;
    
    
    SET NEW.total_amount = NEW.net_weight_kg * NEW.final_price_per_kg;
    
    
    IF NEW.status IS NULL THEN
        SET NEW.status = 'completed';
    END IF;
END //

DROP TRIGGER IF EXISTS `trg_update_season_on_purchase`; //
CREATE TRIGGER `trg_update_season_on_purchase` AFTER INSERT ON `purchase_transactions` FOR EACH ROW BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE harvesting_seasons
        SET actual_quantity_kg = actual_quantity_kg + NEW.net_weight_kg,
            total_purchases = total_purchases + NEW.total_amount
        WHERE season_id = NEW.season_id;
    END IF;
END //

DROP TRIGGER IF EXISTS `trg_update_season_on_sales`; //
CREATE TRIGGER `trg_update_season_on_sales` AFTER INSERT ON `sales_transactions` FOR EACH ROW BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE harvesting_seasons
        SET total_sales = total_sales + NEW.total_amount
        WHERE season_id = NEW.season_id;
    END IF;
END //

DELIMITER ;


-- ============================================
-- DEFAULT DATA
-- ============================================

SET FOREIGN_KEY_CHECKS = 1;

-- Default admin user (password: admin123)
INSERT INTO users (username, password_hash, full_name, role, status, created_at, updated_at) 
VALUES ('admin', '$2b$10$fyOZUCJxv0cDDXhnoXZv7eILikN7NZyG7iwFspgbMe0EhMDZ2sHGu', 'Administrator', 'admin', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE username=username;

-- Season type configuration
INSERT INTO season_type_config (type_code, type_name, description, color_code, is_production, display_order, status, created_at, updated_at)
VALUES 
('PROD', 'Production', 'Regular production season', '#28a745', 1, 1, 'active', NOW(), NOW()),
('DEMO', 'Demo', 'Demonstration and testing', '#ffc107', 0, 2, 'active', NOW(), NOW()),
('TRAIN', 'Training', 'Training and learning', '#17a2b8', 0, 3, 'active', NOW(), NOW()),
('TEST', 'Testing', 'System testing only', '#6c757d', 0, 4, 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE type_code=type_code;

-- Paddy grades
INSERT INTO paddy_grades (grade_code, grade_name, description, min_moisture_content, max_moisture_content, max_foreign_matter, display_order, status, created_at, updated_at)
VALUES 
('PREM', 'Premium', 'Highest quality paddy', 12.00, 14.00, 1.00, 1, 'active', NOW(), NOW()),
('A', 'Grade A', 'High quality paddy', 13.00, 15.00, 2.00, 2, 'active', NOW(), NOW()),
('B', 'Grade B', 'Medium quality paddy', 14.00, 16.00, 3.00, 3, 'active', NOW(), NOW()),
('C', 'Grade C', 'Standard quality paddy', 15.00, 18.00, 5.00, 4, 'active', NOW(), NOW()),
('REJ', 'Reject', 'Below standard quality', 18.00, 25.00, 10.00, 5, 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE grade_code=grade_code;

-- Paddy products
INSERT INTO paddy_products (product_code, product_name, product_type, variety, is_active, created_at, updated_at)
VALUES 
('MR297', 'MR297 - Pertama Padi', 'BENIH', 'BIASA', 1, NOW(), NOW()),
('MR269', 'MR269 - Pertama Padi', 'BENIH', 'BIASA', 1, NOW(), NOW()),
('MRCL2', 'MRCL2 - Pertama Padi', 'BENIH', 'BIASA', 1, NOW(), NOW()),
('MR284', 'MR284 - Pertama Padi', 'BENIH', 'BIASA', 1, NOW(), NOW()),
('MRQ76-F', 'MRQ76 - FGV', 'BERAS', 'WANGI', 1, NOW(), NOW()),
('MRQ76-B', 'MRQ76 - BERNAS', 'BERAS', 'WANGI', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE product_code=product_code;

-- ============================================
-- INITIALIZATION COMPLETE
-- ============================================
