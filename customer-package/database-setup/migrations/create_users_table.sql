-- Migration: Create Users Table
-- Date: 2026-01-07
-- Description: Add users table for authentication

CREATE TABLE IF NOT EXISTS users (
  user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'operator', 'viewer') NOT NULL DEFAULT 'operator',
  is_active TINYINT(1) DEFAULT 1,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User accounts for authentication';

-- Insert default admin user (password: admin123)
-- Password hash generated with bcrypt
INSERT INTO users (username, password_hash, full_name, role) VALUES
('admin', '$2b$10$YRDoNpkfCAxik6XZUhJ4PuU8llzTFq3eJOj42/Ov7w22gepIolqf2', 'Administrator', 'admin');
