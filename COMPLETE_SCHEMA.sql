-- ============================================
-- PADDY COLLECTION CENTER - COMPLETE DATABASE SCHEMA
-- Version: 1.0.0
-- MySQL 8.0+
-- ============================================

-- Create and use database
CREATE DATABASE IF NOT EXISTS paddy_collection_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE paddy_collection_db;

SET NAMES utf8mb4;
SET time_zone = '+08:00';
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
SET GLOBAL event_scheduler = ON;

-- ============================================
-- CORE TABLES
-- ============================================

-- See README.md and 02-CORE-TABLES.md for complete table definitions
-- This is a reference file. Use migration scripts for production deployment.

-- Note: The complete schema is split across multiple migration files
-- in the ./migrations/ directory for better organization and versioning.

