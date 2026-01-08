const mysql = require('mysql2/promise');
const path = require('path');

// Load .env from app root
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Track connection status
let dbConnectionStatus = {
  connected: false,
  error: null
};

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    dbConnectionStatus.connected = true;
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('   Please check your database configuration');
    dbConnectionStatus.error = err;
    // Don't exit - let the app show error dialog to user
  });

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  }
  if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  }
  if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused.');
  }
});

/**
 * Execute a query with automatic error handling
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise<array>} Query results
 */
async function query(sql, params) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Query error:', error.message);
    console.error('SQL:', sql);
    throw error;
  }
}

/**
 * Execute a transaction
 * @param {function} callback - Transaction callback function
 * @returns {Promise<any>} Transaction result
 */
async function transaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    const result = await callback(connection);
    await connection.commit();
    connection.release();
    return result;
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}

/**
 * Execute stored procedure
 * @param {string} procedureName - Procedure name
 * @param {array} params - Procedure parameters
 * @returns {Promise<array>} Procedure results
 */
async function callProcedure(procedureName, params) {
  const placeholders = params.map(() => '?').join(', ');
  const sql = `CALL ${procedureName}(${placeholders})`;
  return await query(sql, params);
}

module.exports = {
  pool,
  query,
  transaction,
  callProcedure,
  end: () => pool.end(),
  getConnectionStatus: () => dbConnectionStatus
};
