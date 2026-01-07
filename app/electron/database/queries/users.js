const db = require('../connection');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const users = {
  // Check if any users exist
  hasUsers: async () => {
    try {
      const rows = await db.query('SELECT COUNT(*) as count FROM users');
      return { success: true, hasUsers: rows[0].count > 0 };
    } catch (error) {
      console.error('Error checking users:', error);
      return { success: false, message: error.message };
    }
  },

  // Authenticate user with username and password
  authenticate: async (username, password) => {
    try {
      const rows = await db.query(
        'SELECT * FROM users WHERE username = ? AND status = "active"',
        [username]
      );

      if (rows.length === 0) {
        return { success: false, message: 'Invalid username or password' };
      }

      const user = rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return { success: false, message: 'Invalid username or password' };
      }

      // Update last login
      await db.query(
        'UPDATE users SET last_login = NOW() WHERE user_id = ?',
        [user.user_id]
      );

      // Return user data without password hash
      const { password_hash, ...userData } = user;
      return { success: true, data: userData };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return { success: false, message: error.message };
    }
  },

  // Get user by ID
  getById: async (userId) => {
    try {
      const rows = await db.query(
        'SELECT user_id, username, full_name, role, status, last_login, created_at FROM users WHERE user_id = ?',
        [userId]
      );

      if (rows.length === 0) {
        return { success: false, message: 'User not found' };
      }

      return { success: true, data: rows[0] };
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, message: error.message };
    }
  },

  // Get all users
  getAll: async () => {
    try {
      const rows = await db.query(
        'SELECT user_id, username, full_name, role, status, last_login, created_at FROM users ORDER BY created_at DESC'
      );

      return { success: true, data: rows };
    } catch (error) {
      console.error('Error getting users:', error);
      return { success: false, message: error.message };
    }
  },

  // Create new user
  create: async (userData) => {
    try {
      const { username, password, full_name, role = 'operator' } = userData;

      // Hash password
      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

      const result = await db.query(
        'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
        [username, password_hash, full_name, role]
      );

      return { success: true, data: { user_id: result.insertId } };
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return { success: false, message: 'Username already exists' };
      }
      return { success: false, message: error.message };
    }
  },

  // Update user
  update: async (userId, userData) => {
    try {
      const updates = [];
      const values = [];

      if (userData.full_name !== undefined) {
        updates.push('full_name = ?');
        values.push(userData.full_name);
      }

      if (userData.role !== undefined) {
        updates.push('role = ?');
        values.push(userData.role);
      }

      if (userData.status !== undefined) {
        updates.push('status = ?');
        values.push(userData.status);
      }

      if (userData.password) {
        const password_hash = await bcrypt.hash(userData.password, SALT_ROUNDS);
        updates.push('password_hash = ?');
        values.push(password_hash);
      }

      if (updates.length === 0) {
        return { success: false, message: 'No fields to update' };
      }

      values.push(userId);

      await db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
        values
      );

      return { success: true, message: 'User updated successfully' };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, message: error.message };
    }
  },

  // Delete user
  delete: async (userId) => {
    try {
      await db.query('DELETE FROM users WHERE user_id = ?', [userId]);
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: error.message };
    }
  },

  // Change password
  changePassword: async (userId, oldPassword, newPassword) => {
    try {
      // Verify old password
      const rows = await db.query(
        'SELECT password_hash FROM users WHERE user_id = ?',
        [userId]
      );

      if (rows.length === 0) {
        return { success: false, message: 'User not found' };
      }

      const passwordMatch = await bcrypt.compare(oldPassword, rows[0].password_hash);
      if (!passwordMatch) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Hash and update new password
      const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await db.query(
        'UPDATE users SET password_hash = ? WHERE user_id = ?',
        [password_hash, userId]
      );

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, message: error.message };
    }
  }
};

module.exports = users;
