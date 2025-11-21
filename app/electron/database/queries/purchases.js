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
      // Use effective_weight_kg if deductions are present, otherwise use net_weight_kg
      console.log('💰 Purchase Calculation Debug:');
      console.log('  - net_weight_kg:', purchaseData.net_weight_kg, typeof purchaseData.net_weight_kg);
      console.log('  - effective_weight_kg:', purchaseData.effective_weight_kg, typeof purchaseData.effective_weight_kg);
      console.log('  - Is effective_weight_kg truthy?', !!purchaseData.effective_weight_kg);
      console.log('  - Is effective_weight_kg > 0?', purchaseData.effective_weight_kg > 0);
      
      // Explicitly check if effective_weight_kg exists and is a valid number
      let weightForCalculation;
      if (purchaseData.effective_weight_kg !== null && 
          purchaseData.effective_weight_kg !== undefined && 
          !isNaN(purchaseData.effective_weight_kg) && 
          purchaseData.effective_weight_kg > 0) {
        weightForCalculation = parseFloat(purchaseData.effective_weight_kg);
        console.log('  ✅ Using effective_weight_kg:', weightForCalculation);
      } else {
        weightForCalculation = parseFloat(purchaseData.net_weight_kg);
        console.log('  ⚠️  Falling back to net_weight_kg:', weightForCalculation);
      }
      
      console.log('  - weightForCalculation:', weightForCalculation);
      console.log('  - base_price_per_kg:', purchaseData.base_price_per_kg);
      console.log('  - deduction_config:', purchaseData.deduction_config);
      console.log('  - Expected result:', weightForCalculation * purchaseData.base_price_per_kg);
      
      const [calcResult] = await connection.execute(`
        CALL sp_calculate_purchase_amount(?, ?, ?, ?, ?, ?, @moisture_penalty, @fm_penalty, @final_price, @total_amount)
      `, [
        weightForCalculation,
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
      console.log('📊 Stored Procedure Results:');
      console.log('  - final_price_per_kg:', calc.final_price_per_kg);
      console.log('  - total_amount:', calc.total_amount);
      console.log('  - Expected (weight × price):', weightForCalculation * purchaseData.base_price_per_kg);
      
      // Override total_amount calculation if effective_weight_kg is provided (deductions present)
      let finalTotalAmount = calc.total_amount;
      if (purchaseData.effective_weight_kg && purchaseData.effective_weight_kg > 0) {
        // Recalculate using effective weight to ensure accuracy
        finalTotalAmount = weightForCalculation * calc.final_price_per_kg;
        console.log('✅ Overriding total_amount with deduction-aware calculation:', finalTotalAmount);
      }
      
      console.log('📝 Data being inserted to database:');
      console.log('  - net_weight_kg (for DB):', purchaseData.net_weight_kg);
      console.log('  - total_amount (final):', finalTotalAmount);
      console.log('  - deduction_config:', JSON.stringify(purchaseData.deduction_config));
      
      // Insert purchase transaction
      const [result] = await connection.execute(`
        INSERT INTO purchase_transactions (
          receipt_number, season_id, farmer_id, grade_id, transaction_date,
          gross_weight_kg, tare_weight_kg, net_weight_kg,
          moisture_content, foreign_matter,
          base_price_per_kg, moisture_penalty, foreign_matter_penalty,
          deduction_config,
          final_price_per_kg, total_amount,
          vehicle_number, driver_name,
          status, payment_status,
          weighbridge_id, weighing_log_id,
          created_by
        ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        purchaseData.deduction_config ? JSON.stringify(purchaseData.deduction_config) : null,
        calc.final_price_per_kg,
        finalTotalAmount,  // Use recalculated amount with effective weight
        purchaseData.vehicle_number || null,
        purchaseData.driver_name || null,
        'completed',
        'unpaid',
        purchaseData.weighbridge_id || null,
        purchaseData.weighing_log_id || null,
        purchaseData.created_by || 1
      ]);
      
      console.log('✅ Purchase inserted with ID:', result.insertId);
      console.log('📋 Receipt Number:', receiptNumber);
      
      // Verify what was saved
      const [savedData] = await connection.execute(
        'SELECT net_weight_kg, total_amount, deduction_config FROM purchase_transactions WHERE transaction_id = ?',
        [result.insertId]
      );
      console.log('🔍 Verification - Data saved in DB:');
      console.log('  - net_weight_kg:', savedData[0].net_weight_kg);
      console.log('  - total_amount (saved):', savedData[0].total_amount);
      console.log('  - total_amount (expected):', finalTotalAmount);
      console.log('  - deduction_config:', savedData[0].deduction_config);

      // If, for any reason (e.g. DB trigger), the saved total_amount does not
      // match our deduction-aware calculation, correct it immediately so that
      // receipts and reports use the proper post-deduction amount.
      if (savedData[0].total_amount !== finalTotalAmount) {
        console.log('⚠️  total_amount mismatch detected. Applying corrective UPDATE...');
        await connection.execute(
          'UPDATE purchase_transactions SET total_amount = ? WHERE transaction_id = ?',
          [finalTotalAmount, result.insertId]
        );

        const [recheck] = await connection.execute(
          'SELECT net_weight_kg, total_amount FROM purchase_transactions WHERE transaction_id = ?',
          [result.insertId]
        );
        console.log('✅ total_amount corrected in DB:');
        console.log('  - net_weight_kg:', recheck[0].net_weight_kg);
        console.log('  - total_amount:', recheck[0].total_amount);
      }
      
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

/**
 * Get unsold purchases (available for sales)
 * @param {number} seasonId - Optional season ID to filter by active season
 */
async function getUnsold(seasonId = null) {
  try {
    let sql = `
      SELECT 
        pt.transaction_id,
        pt.receipt_number,
        pt.transaction_date,
        pt.net_weight_kg,
        pt.grade_id,
        f.farmer_code,
        f.full_name as farmer_name,
        pg.grade_name,
        hs.season_name,
        COALESCE(SUM(spm.quantity_kg), 0) as sold_quantity_kg,
        pt.net_weight_kg - COALESCE(SUM(spm.quantity_kg), 0) as available_quantity_kg
      FROM purchase_transactions pt
      JOIN farmers f ON pt.farmer_id = f.farmer_id
      JOIN paddy_grades pg ON pt.grade_id = pg.grade_id
      JOIN harvesting_seasons hs ON pt.season_id = hs.season_id
      LEFT JOIN sales_purchase_mapping spm ON pt.transaction_id = spm.transaction_id
      WHERE pt.status = 'completed'
    `;
    
    const params = [];
    
    // Filter by season if provided
    if (seasonId) {
      sql += ` AND pt.season_id = ?`;
      params.push(seasonId);
    }
    
    sql += `
      GROUP BY 
        pt.transaction_id,
        pt.receipt_number,
        pt.transaction_date,
        pt.net_weight_kg,
        pt.grade_id,
        f.farmer_code,
        f.full_name,
        pg.grade_name,
        hs.season_name
      HAVING available_quantity_kg > 0
      ORDER BY pt.transaction_date DESC
    `;
    
    console.log('📊 Purchase getUnsold - Season ID:', seasonId);
    const rows = await db.query(sql, params);
    console.log('📊 Purchase getUnsold - Found receipts:', rows.length);
    
    // Return rows with available_quantity_kg as net_weight_kg for the UI
    const formattedRows = rows.map(row => ({
      ...row,
      net_weight_kg: row.available_quantity_kg,
      original_weight_kg: row.net_weight_kg
    }));
    
    return { success: true, data: formattedRows };
  } catch (error) {
    console.error('Error fetching unsold purchases:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get total purchase statistics
 * @param {number} seasonId - Optional season ID to filter by active season
 */
async function getTotalStats(seasonId = null) {
  try {
    let sql = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(net_weight_kg), 0) as total_net_weight_kg,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM purchase_transactions
      WHERE status = 'completed'
    `;
    
    const params = [];
    
    // Filter by season if provided
    if (seasonId) {
      sql += ' AND season_id = ?';
      params.push(seasonId);
    }
    
    console.log('📊 Purchase getTotalStats - SQL:', sql);
    console.log('📊 Purchase getTotalStats - Params:', params);
    console.log('📊 Purchase getTotalStats - Season ID:', seasonId);
    
    const rows = await db.query(sql, params);
    
    console.log('📊 Purchase getTotalStats - Result:', rows[0]);
    
    return { success: true, data: rows[0] };
  } catch (error) {
    console.error('Error fetching purchase total stats:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  create,
  getAll,
  getById,
  getByReceipt,
  getDailySummary,
  getUnsold,
  getTotalStats
};
