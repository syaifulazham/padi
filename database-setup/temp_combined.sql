-- ============================================
-- PADDY COLLECTION CENTER - COMPLETE DATABASE INITIALIZATION
-- Version: 1.0.0
-- MySQL 8.0+
-- ============================================
-- This script creates the entire database schema from scratch
-- including all tables, views, stored procedures, triggers, and default data
-- Generated from development database
-- ============================================

USE paddy_collection_db;

SET NAMES utf8mb4;
SET time_zone = '+08:00';
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ============================================
-- DATABASE SCHEMA
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
/*!50100 PARTITION BY RANGE (year(`created_at`))
(PARTITION p_before_2025 VALUES LESS THAN (2025) ENGINE = InnoDB,
 PARTITION p_2025 VALUES LESS THAN (2026) ENGINE = InnoDB,
 PARTITION p_2026 VALUES LESS THAN (2027) ENGINE = InnoDB,
 PARTITION p_future VALUES LESS THAN MAXVALUE ENGINE = InnoDB) */;

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

/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`azham`@`localhost`*/ /*!50003 TRIGGER `trg_after_container_item_insert` AFTER INSERT ON `container_loading_items` FOR EACH ROW BEGIN
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=2035 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Global paddy product types';

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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='History of product price changes';

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`azham`@`localhost`*/ /*!50003 TRIGGER `trg_before_purchase_insert` BEFORE INSERT ON `purchase_transactions` FOR EACH ROW BEGIN
    
    IF NEW.net_weight_kg IS NULL OR NEW.net_weight_kg = 0 THEN
        SET NEW.net_weight_kg = NEW.gross_weight_kg - NEW.tare_weight_kg;
    END IF;
    
    
    SET NEW.final_price_per_kg = NEW.base_price_per_kg - NEW.moisture_penalty - NEW.foreign_matter_penalty + NEW.bonus_amount;
    
    
    SET NEW.total_amount = NEW.net_weight_kg * NEW.final_price_per_kg;
    
    
    IF NEW.status IS NULL THEN
        SET NEW.status = 'completed';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`azham`@`localhost`*/ /*!50003 TRIGGER `trg_after_purchase_insert` AFTER INSERT ON `purchase_transactions` FOR EACH ROW BEGIN
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`azham`@`localhost`*/ /*!50003 TRIGGER `trg_update_season_on_purchase` AFTER INSERT ON `purchase_transactions` FOR EACH ROW BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE harvesting_seasons
        SET actual_quantity_kg = actual_quantity_kg + NEW.net_weight_kg,
            total_purchases = total_purchases + NEW.total_amount
        WHERE season_id = NEW.season_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`azham`@`localhost`*/ /*!50003 TRIGGER `trg_update_season_on_sales` AFTER INSERT ON `sales_transactions` FOR EACH ROW BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE harvesting_seasons
        SET total_sales = total_sales + NEW.total_amount
        WHERE season_id = NEW.season_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`azham`@`localhost`*/ /*!50003 TRIGGER `trg_after_sales_complete` AFTER UPDATE ON `sales_transactions` FOR EACH ROW BEGIN
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
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
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
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Product prices per season';

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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `vw_container_loading_details`;

SET @saved_cs_client     = @@character_set_client;

/*!50001 CREATE VIEW `vw_container_loading_details` AS SELECT 
 1 AS `container_id`,
 1 AS `container_number`,
 1 AS `container_type`,
 1 AS `sales_id`,
 1 AS `sales_number`,
 1 AS `manufacturer_name`,
 1 AS `target_capacity_kg`,
 1 AS `actual_loaded_kg`,
 1 AS `container_status`,
 1 AS `items_loaded`,
 1 AS `total_loaded_kg`,
 1 AS `loading_percentage`,
 1 AS `loading_started_at`,
 1 AS `loading_completed_at`,
 1 AS `loading_duration_minutes`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_current_inventory_summary`;

SET @saved_cs_client     = @@character_set_client;

/*!50001 CREATE VIEW `vw_current_inventory_summary` AS SELECT 
 1 AS `stock_id`,
 1 AS `season_id`,
 1 AS `season_name`,
 1 AS `season_status`,
 1 AS `grade_id`,
 1 AS `grade_name`,
 1 AS `current_quantity_kg`,
 1 AS `reserved_quantity_kg`,
 1 AS `available_quantity_kg`,
 1 AS `average_cost_per_kg`,
 1 AS `total_value`,
 1 AS `storage_location`,
 1 AS `quality_status`,
 1 AS `last_quality_check_date`,
 1 AS `last_movement_date`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_daily_purchase_summary`;

SET @saved_cs_client     = @@character_set_client;

/*!50001 CREATE VIEW `vw_daily_purchase_summary` AS SELECT 
 1 AS `purchase_date`,
 1 AS `season_id`,
 1 AS `season_name`,
 1 AS `grade_id`,
 1 AS `grade_name`,
 1 AS `total_transactions`,
 1 AS `unique_farmers`,
 1 AS `total_weight_kg`,
 1 AS `avg_price_per_kg`,
 1 AS `total_amount`,
 1 AS `avg_moisture_content`,
 1 AS `avg_foreign_matter`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_farmer_purchase_summary`;

SET @saved_cs_client     = @@character_set_client;

/*!50001 CREATE VIEW `vw_farmer_purchase_summary` AS SELECT 
 1 AS `farmer_id`,
 1 AS `farmer_code`,
 1 AS `farmer_name`,
 1 AS `phone`,
 1 AS `farmer_status`,
 1 AS `season_id`,
 1 AS `season_name`,
 1 AS `total_transactions`,
 1 AS `total_weight_kg`,
 1 AS `total_amount`,
 1 AS `avg_price_per_kg`,
 1 AS `first_transaction_date`,
 1 AS `last_transaction_date`,
 1 AS `avg_moisture_content`,
 1 AS `avg_foreign_matter`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_grade_performance`;

SET @saved_cs_client     = @@character_set_client;

/*!50001 CREATE VIEW `vw_grade_performance` AS SELECT 
 1 AS `grade_id`,
 1 AS `grade_code`,
 1 AS `grade_name`,
 1 AS `season_id`,
 1 AS `season_name`,
 1 AS `total_transactions`,
 1 AS `total_purchased_kg`,
 1 AS `avg_purchase_price`,
 1 AS `min_price`,
 1 AS `max_price`,
 1 AS `avg_moisture`,
 1 AS `avg_foreign_matter`,
 1 AS `current_stock_kg`,
 1 AS `available_stock_kg`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_manufacturer_sales_summary`;

SET @saved_cs_client     = @@character_set_client;

/*!50001 CREATE VIEW `vw_manufacturer_sales_summary` AS SELECT 
 1 AS `manufacturer_id`,
 1 AS `manufacturer_code`,
 1 AS `company_name`,
 1 AS `manufacturer_status`,
 1 AS `season_id`,
 1 AS `season_name`,
 1 AS `total_sales`,
 1 AS `total_quantity_kg`,
 1 AS `total_amount`,
 1 AS `total_paid`,
 1 AS `outstanding_amount`,
 1 AS `avg_price_per_kg`,
 1 AS `first_sale_date`,
 1 AS `last_sale_date`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_pending_payments`;

SET @saved_cs_client     = @@character_set_client;

/*!50001 CREATE VIEW `vw_pending_payments` AS SELECT 
 1 AS `transaction_type`,
 1 AS `transaction_id`,
 1 AS `transaction_number`,
 1 AS `transaction_date`,
 1 AS `party_id`,
 1 AS `party_name`,
 1 AS `party_phone`,
 1 AS `total_amount`,
 1 AS `paid_amount`,
 1 AS `outstanding_amount`,
 1 AS `due_date`,
 1 AS `days_overdue`,
 1 AS `payment_status`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_production_purchases`;

SET @saved_cs_client     = @@character_set_client;

/*!50001 CREATE VIEW `vw_production_purchases` AS SELECT 
 1 AS `transaction_id`,
 1 AS `receipt_number`,
 1 AS `season_id`,
 1 AS `farmer_id`,
 1 AS `grade_id`,
 1 AS `transaction_date`,
 1 AS `gross_weight_kg`,
 1 AS `tare_weight_kg`,
 1 AS `net_weight_kg`,
 1 AS `moisture_content`,
 1 AS `foreign_matter`,
 1 AS `base_price_per_kg`,
 1 AS `moisture_penalty`,
 1 AS `foreign_matter_penalty`,
 1 AS `bonus_amount`,
 1 AS `final_price_per_kg`,
 1 AS `total_amount`,
 1 AS `vehicle_number`,
 1 AS `driver_name`,
 1 AS `status`,
 1 AS `payment_status`,
 1 AS `payment_date`,
 1 AS `weighbridge_id`,
 1 AS `weighing_log_id`,
 1 AS `is_printed`,
 1 AS `print_count`,
 1 AS `last_printed_at`,
 1 AS `notes`,
 1 AS `cancelled_at`,
 1 AS `cancelled_by`,
 1 AS `cancellation_reason`,
 1 AS `created_at`,
 1 AS `created_by`,
 1 AS `updated_at`,
 1 AS `updated_by`,
 1 AS `season_name`,
 1 AS `season_code`,
 1 AS `season_type`,
 1 AS `farmer_code`,
 1 AS `farmer_name`,
 1 AS `farmer_phone`,
 1 AS `grade_name`,
 1 AS `grade_code`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_season_performance`;

SET @saved_cs_client     = @@character_set_client;

/*!50001 CREATE VIEW `vw_season_performance` AS SELECT 
 1 AS `season_id`,
 1 AS `season_code`,
 1 AS `season_name`,
 1 AS `status`,
 1 AS `start_date`,
 1 AS `end_date`,
 1 AS `duration_days`,
 1 AS `total_purchases`,
 1 AS `unique_farmers`,
 1 AS `total_purchased_kg`,
 1 AS `total_purchase_amount`,
 1 AS `avg_purchase_price`,
 1 AS `total_sales`,
 1 AS `unique_manufacturers`,
 1 AS `total_sold_kg`,
 1 AS `total_sales_amount`,
 1 AS `current_stock_kg`,
 1 AS `gross_margin`*/;
SET character_set_client = @saved_cs_client;
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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


/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`azham`@`localhost` PROCEDURE `sp_calculate_purchase_amount`(
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`azham`@`localhost` PROCEDURE `sp_close_season`(
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`azham`@`localhost` PROCEDURE `sp_generate_receipt_number`(
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`azham`@`localhost` PROCEDURE `sp_generate_sales_number`(
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`azham`@`localhost` PROCEDURE `sp_get_farmer_stats`(
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`azham`@`localhost` PROCEDURE `sp_get_stock_level`(
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;







/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`azham`@`localhost` SQL SECURITY DEFINER */











/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`azham`@`localhost` SQL SECURITY DEFINER */











/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`azham`@`localhost` SQL SECURITY DEFINER */











/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`azham`@`localhost` SQL SECURITY DEFINER */











/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`azham`@`localhost` SQL SECURITY DEFINER */











/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`azham`@`localhost` SQL SECURITY DEFINER */











/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`azham`@`localhost` SQL SECURITY DEFINER */











/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`azham`@`localhost` SQL SECURITY DEFINER */











/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`azham`@`localhost` SQL SECURITY DEFINER */














