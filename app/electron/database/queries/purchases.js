const db = require('../connection');

/**
 * Purchases Service
 * Operations for purchase transactions
 */

/**
 * Create new purchase transaction
 */
async function create(purchaseData) {
  try {
    return await db.transaction(async (connection) => {
      // Generate receipt number using OUT parameter
      await connection.execute(
        'CALL sp_generate_receipt_number(?, @receipt_number)',
        [purchaseData.season_id]
      );
      
      // Get the OUT parameter value
      const [receiptResult] = await connection.execute(
        'SELECT @receipt_number as receipt_number'
      );
      const receiptNumber = receiptResult[0].receipt_number;
      
      // Calculate penalties and totals
      const [calcResult] = await connection.execute(`
        CALL sp_calculate_purchase_amount(?, ?, ?, ?, ?, ?, @moisture_penalty, @fm_penalty, @final_price, @total_amount)
      `, [
        purchaseData.net_weight_kg,
        purchaseData.base_price_per_kg,
        purchaseData.moisture_content,
        purchaseData.foreign_matter,
        purchaseData.season_id,
        purchaseData.grade_id
      ]);
      
      // Get calculated values
      const [calculated] = await connection.execute(`
        SELECT 
          @moisture_penalty as moisture_penalty,
          @fm_penalty as foreign_matter_penalty,
          @final_price as final_price_per_kg,
          @total_amount as total_amount
      `);
      
      const calc = calculated[0];
      
      // Insert purchase transaction
      const [result] = await connection.execute(`
        INSERT INTO purchase_transactions (
          receipt_number, season_id, farmer_id, grade_id, transaction_date,
          gross_weight_kg, tare_weight_kg, net_weight_kg,
          moisture_content, foreign_matter,
          base_price_per_kg, moisture_penalty, foreign_matter_penalty,
          final_price_per_kg, total_amount,
          vehicle_number, driver_name,
          status, payment_status,
          weighbridge_id, weighing_log_id,
          created_by
        ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        receiptNumber,
        purchaseData.season_id,
        purchaseData.farmer_id,
        purchaseData.grade_id,
        purchaseData.gross_weight_kg,
        purchaseData.tare_weight_kg || 0,
        purchaseData.net_weight_kg,
        purchaseData.moisture_content,
        purchaseData.foreign_matter,
        purchaseData.base_price_per_kg,
        calc.moisture_penalty,
        calc.foreign_matter_penalty,
        calc.final_price_per_kg,
        calc.total_amount,
        purchaseData.vehicle_number || null,
        purchaseData.driver_name || null,
        'completed',
        'unpaid',
        purchaseData.weighbridge_id || null,
        purchaseData.weighing_log_id || null,
        purchaseData.created_by || 1
      ]);
      
      return {
        success: true,
        data: {
          transaction_id: result.insertId,
          receipt_number: receiptNumber,
          calculated: calc,
          message: 'Purchase transaction created successfully'
        }
      };
    });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all purchases with filters
 */
async function getAll(filters = {}) {
  try {
    let sql = `
      SELECT 
        pt.*,
        f.farmer_code,
        f.full_name as farmer_name,
        pg.grade_name,
        hs.season_name
      FROM purchase_transactions pt
      JOIN farmers f ON pt.farmer_id = f.farmer_id
      JOIN paddy_grades pg ON pt.grade_id = pg.grade_id
      JOIN harvesting_seasons hs ON pt.season_id = hs.season_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.season_id) {
      sql += ' AND pt.season_id = ?';
      params.push(filters.season_id);
    }
    
    if (filters.farmer_id) {
      sql += ' AND pt.farmer_id = ?';
      params.push(filters.farmer_id);
    }
    
    if (filters.status) {
      sql += ' AND pt.status = ?';
      params.push(filters.status);
    }
    
    if (filters.date_from) {
      sql += ' AND DATE(pt.transaction_date) >= ?';
      params.push(filters.date_from);
    }
    
    if (filters.date_to) {
      sql += ' AND DATE(pt.transaction_date) <= ?';
      params.push(filters.date_to);
    }
    
    sql += ' ORDER BY pt.transaction_date DESC';
    
    if (filters.limit) {
      // LIMIT doesn't work with prepared statement parameters, use direct value
      const limitValue = parseInt(filters.limit);
      sql += ` LIMIT ${limitValue}`;
    }
    
    const rows = await db.query(sql, params);
    return { success: true, data: rows };
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get purchase by ID
 */
async function getById(transactionId) {
  try {
    const sql = `
      SELECT 
        pt.*,
        f.farmer_code,
        f.full_name as farmer_name,
        f.phone as farmer_phone,
        f.address as farmer_address,
        pg.grade_name,
        pg.grade_code,
        hs.season_name,
        hs.season_code
      FROM purchase_transactions pt
      JOIN farmers f ON pt.farmer_id = f.farmer_id
      JOIN paddy_grades pg ON pt.grade_id = pg.grade_id
      JOIN harvesting_seasons hs ON pt.season_id = hs.season_id
      WHERE pt.transaction_id = ?
    `;
    
    const rows = await db.query(sql, [transactionId]);
    
    if (rows.length === 0) {
      return { success: false, error: 'Purchase transaction not found' };
    }
    
    return { success: true, data: rows[0] };
  } catch (error) {
    console.error('Error fetching purchase:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get purchase by receipt number
 */
async function getByReceipt(receiptNumber) {
  try {
    const sql = `
      SELECT 
        pt.*,
        f.farmer_code,
        f.full_name as farmer_name,
        pg.grade_name,
        hs.season_name
      FROM purchase_transactions pt
      JOIN farmers f ON pt.farmer_id = f.farmer_id
      JOIN paddy_grades pg ON pt.grade_id = pg.grade_id
      JOIN harvesting_seasons hs ON pt.season_id = hs.season_id
      WHERE pt.receipt_number = ?
    `;
    
    const rows = await db.query(sql, [receiptNumber]);
    
    if (rows.length === 0) {
      return { success: false, error: 'Receipt not found' };
    }
    
    return { success: true, data: rows[0] };
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get daily summary
 */
async function getDailySummary(date) {
  try {
    const sql = `
      SELECT * FROM vw_daily_purchase_summary
      WHERE purchase_date = ?
      ORDER BY season_name, grade_name
    `;
    
    const rows = await db.query(sql, [date]);
    return { success: true, data: rows };
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  create,
  getAll,
  getById,
  getByReceipt,
  getDailySummary
};
