#!/usr/bin/env python3
"""
Generate clean init_database.sql from MySQL database
"""
import subprocess
import re

def run_mysql(query, database='paddy_collection_db'):
    """Execute MySQL query and return output"""
    cmd = ['mysql', '-u', 'azham', '-pDBAzham231', '-D', database, '-N', '-B', '-e', query]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
    return result.stdout.strip()

def get_table_create(table):
    """Get CREATE TABLE statement for a table"""
    result = run_mysql(f"SHOW CREATE TABLE `{table}`")
    if result:
        parts = result.split('\t')
        if len(parts) >= 2:
            create_stmt = parts[1]
            # Replace literal \n with actual newlines
            create_stmt = create_stmt.replace('\\n', '\n')
            # Remove AUTO_INCREMENT value
            create_stmt = re.sub(r'AUTO_INCREMENT=\d+ ', '', create_stmt)
            # Remove partition clause
            create_stmt = re.sub(r'\s*/\*!50100 PARTITION BY.*?\*/;?$', ';', create_stmt, flags=re.DOTALL)
            # Ensure statement ends with semicolon
            if not create_stmt.rstrip().endswith(';'):
                create_stmt = create_stmt.rstrip() + ';'
            return create_stmt
    return None

def main():
    output = []
    
    # Header
    output.append("""-- ============================================
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
""")
    
    # Get all tables
    tables_result = run_mysql("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='paddy_collection_db' AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME")
    tables = [t for t in tables_result.split('\n') if t]
    
    print(f"Found {len(tables)} tables")
    
    for table in tables:
        print(f"  Processing table: {table}")
        create_stmt = get_table_create(table)
        if create_stmt:
            output.append(f"DROP TABLE IF EXISTS `{table}`;")
            output.append(create_stmt)
            output.append("")
    
    # Views
    output.append("""
-- ============================================
-- VIEWS
-- ============================================
""")
    
    views_result = run_mysql("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='paddy_collection_db' AND TABLE_TYPE='VIEW' ORDER BY TABLE_NAME")
    views = [v for v in views_result.split('\n') if v]
    
    print(f"Found {len(views)} views")
    
    for view in views:
        print(f"  Processing view: {view}")
        result = run_mysql(f"SHOW CREATE VIEW `{view}`")
        if result:
            parts = result.split('\t')
            if len(parts) >= 2:
                create_stmt = parts[1]
                # Remove DEFINER
                create_stmt = re.sub(r'DEFINER=`[^`]+`@`[^`]+`\s+', '', create_stmt)
                # Change to CREATE OR REPLACE
                create_stmt = re.sub(r'^CREATE ', 'CREATE OR REPLACE ', create_stmt)
                output.append(f"DROP VIEW IF EXISTS `{view}`;")
                output.append(create_stmt + ";")
                output.append("")
    
    # Procedures
    output.append("""
-- ============================================
-- STORED PROCEDURES
-- ============================================

DELIMITER //
""")
    
    procs_result = run_mysql("SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA='paddy_collection_db' AND ROUTINE_TYPE='PROCEDURE' ORDER BY ROUTINE_NAME")
    procedures = [p for p in procs_result.split('\n') if p]
    
    print(f"Found {len(procedures)} procedures")
    
    for proc in procedures:
        print(f"  Processing procedure: {proc}")
        result = run_mysql(f"SHOW CREATE PROCEDURE `{proc}`")
        if result:
            parts = result.split('\t')
            if len(parts) >= 3:
                create_stmt = re.sub(r'DEFINER=`[^`]+`@`[^`]+`\s+', '', parts[2])
                # Replace literal \n with actual newlines for readability
                create_stmt = create_stmt.replace('\\n', '\n')
                output.append(f"DROP PROCEDURE IF EXISTS `{proc}`; //")
                output.append(create_stmt + " //")
                output.append("")
    
    output.append("DELIMITER ;")
    output.append("")
    
    # Triggers
    output.append("""
-- ============================================
-- TRIGGERS
-- ============================================

DELIMITER //
""")
    
    triggers_result = run_mysql("SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA='paddy_collection_db' ORDER BY TRIGGER_NAME")
    triggers = [t for t in triggers_result.split('\n') if t]
    
    print(f"Found {len(triggers)} triggers")
    
    for trigger in triggers:
        print(f"  Processing trigger: {trigger}")
        result = run_mysql(f"SHOW CREATE TRIGGER `{trigger}`")
        if result:
            parts = result.split('\t')
            if len(parts) >= 3:
                create_stmt = re.sub(r'DEFINER=`[^`]+`@`[^`]+`\s+', '', parts[2])
                # Replace literal \n with actual newlines for readability
                create_stmt = create_stmt.replace('\\n', '\n')
                output.append(f"DROP TRIGGER IF EXISTS `{trigger}`; //")
                output.append(create_stmt + " //")
                output.append("")
    
    output.append("DELIMITER ;")
    output.append("")
    
    # Default data
    output.append("""
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
""")
    
    # Write to file
    with open('init_database.sql', 'w') as f:
        f.write('\n'.join(output))
    
    print(f"\nGenerated init_database.sql with {len(output)} lines")
    print(f"  Tables: {len(tables)}")
    print(f"  Views: {len(views)}")
    print(f"  Procedures: {len(procedures)}")
    print(f"  Triggers: {len(triggers)}")

if __name__ == '__main__':
    main()
