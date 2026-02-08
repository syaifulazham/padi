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
      console.log('🧩 purchases.create() code version: 2025-12-12T19:00+08 safeParams');

      if (!purchaseData) {
        return { success: false, error: 'Missing purchase data' };
      }

      const toNull = (v) => (v === undefined ? null : v);
      const safeParams = (params) => (Array.isArray(params) ? params.map((v) => (v === undefined ? null : v)) : params);

      const seasonId = Number(purchaseData.season_id);
      const farmerId = Number(purchaseData.farmer_id);

      if (!seasonId || Number.isNaN(seasonId)) {
        return { success: false, error: 'Invalid season_id' };
      }
      if (!farmerId || Number.isNaN(farmerId)) {
        return { success: false, error: 'Invalid farmer_id' };
      }

      purchaseData.season_id = seasonId;
      purchaseData.farmer_id = farmerId;
      purchaseData.product_id = toNull(purchaseData.product_id);
      purchaseData.gross_weight_kg = Number(purchaseData.gross_weight_kg);
      purchaseData.tare_weight_kg = toNull(purchaseData.tare_weight_kg);
      purchaseData.net_weight_kg = Number(purchaseData.net_weight_kg);
      purchaseData.moisture_content = Number(toNull(purchaseData.moisture_content) ?? 14.0);
      purchaseData.foreign_matter = Number(toNull(purchaseData.foreign_matter) ?? 0.0);
      purchaseData.base_price_per_kg = Number(purchaseData.base_price_per_kg);
      purchaseData.vehicle_number = toNull(purchaseData.vehicle_number);
      purchaseData.driver_name = toNull(purchaseData.driver_name);
      purchaseData.weighbridge_id = toNull(purchaseData.weighbridge_id);
      purchaseData.weighing_log_id = toNull(purchaseData.weighing_log_id);
      purchaseData.created_by = Number(toNull(purchaseData.created_by) ?? 1);
      purchaseData.effective_weight_kg = toNull(purchaseData.effective_weight_kg);
      if (purchaseData.effective_weight_kg !== null) {
        purchaseData.effective_weight_kg = Number(purchaseData.effective_weight_kg);
      }

      if (!purchaseData.gross_weight_kg || Number.isNaN(purchaseData.gross_weight_kg)) {
        return { success: false, error: 'Invalid gross_weight_kg' };
      }
      if (!purchaseData.net_weight_kg || Number.isNaN(purchaseData.net_weight_kg)) {
        return { success: false, error: 'Invalid net_weight_kg' };
      }
      if (!purchaseData.base_price_per_kg || Number.isNaN(purchaseData.base_price_per_kg)) {
        return { success: false, error: 'Invalid base_price_per_kg' };
      }

      // Diagnostics: confirm DB/schema and grades visibility
      try {
        const [dbRows] = await connection.execute('SELECT DATABASE() as db');
        const currentDb = dbRows?.[0]?.db;
        const [gradeCountRows] = await connection.execute('SELECT COUNT(*) as cnt FROM paddy_grades');
        const gradeCnt = gradeCountRows?.[0]?.cnt;
        const [gradeSampleRows] = await connection.execute(
          "SELECT grade_id, grade_code, status FROM paddy_grades ORDER BY grade_id ASC LIMIT 5"
        );
        console.log('🧪 Grades diagnostics:', {
          database: currentDb,
          grade_count: gradeCnt,
          grade_sample: gradeSampleRows
        });
      } catch (e) {
        console.warn('🧪 Grades diagnostics failed:', e?.message || e);
      }

      // Ensure grade_id exists to avoid FK constraint errors
      let resolvedGradeId = purchaseData.grade_id;
      if (resolvedGradeId !== null && resolvedGradeId !== undefined) {
        resolvedGradeId = Number(resolvedGradeId);
      }

      if (!resolvedGradeId || Number.isNaN(resolvedGradeId)) {
        const [defaultGradeRows] = await connection.execute(
          `SELECT grade_id FROM paddy_grades WHERE status = 'active' ORDER BY display_order ASC, grade_id ASC LIMIT 1`
        );
        resolvedGradeId = defaultGradeRows?.[0]?.grade_id;

        if (!resolvedGradeId) {
          const [anyGradeRows] = await connection.execute(
            `SELECT grade_id FROM paddy_grades ORDER BY display_order ASC, grade_id ASC LIMIT 1`
          );
          resolvedGradeId = anyGradeRows?.[0]?.grade_id;
        }
      } else {
        const [gradeRows] = await connection.execute(
          `SELECT grade_id FROM paddy_grades WHERE grade_id = ? AND status = 'active' LIMIT 1`,
          safeParams([resolvedGradeId])
        );
        if (!gradeRows || gradeRows.length === 0) {
          const [defaultGradeRows] = await connection.execute(
            `SELECT grade_id FROM paddy_grades WHERE status = 'active' ORDER BY display_order ASC, grade_id ASC LIMIT 1`
          );
          resolvedGradeId = defaultGradeRows?.[0]?.grade_id;

          if (!resolvedGradeId) {
            const [anyGradeRows] = await connection.execute(
              `SELECT grade_id FROM paddy_grades ORDER BY display_order ASC, grade_id ASC LIMIT 1`
            );
            resolvedGradeId = anyGradeRows?.[0]?.grade_id;
          }
        }
      }

      if (!resolvedGradeId) {
        try {
          const [gradeCountRows] = await connection.execute('SELECT COUNT(*) as cnt FROM paddy_grades');
          const gradeCnt = gradeCountRows?.[0]?.cnt;

          if (Number(gradeCnt) === 0) {
            await connection.execute(
              `INSERT IGNORE INTO paddy_grades (grade_code, grade_name, description, min_moisture_content, max_moisture_content, max_foreign_matter, display_order, status)
               VALUES
               ('PREM', 'Premium', 'Highest quality paddy', 12.0, 14.0, 1.0, 1, 'active'),
               ('A', 'Grade A', 'High quality paddy', 13.0, 15.0, 2.0, 2, 'active'),
               ('B', 'Grade B', 'Medium quality paddy', 14.0, 16.0, 3.0, 3, 'active'),
               ('C', 'Grade C', 'Standard quality paddy', 15.0, 18.0, 5.0, 4, 'active'),
               ('REJ', 'Reject', 'Below standard quality', 18.0, 25.0, 10.0, 5, 'active')`
            );
          }

          const [retryRows] = await connection.execute(
            `SELECT grade_id FROM paddy_grades WHERE status = 'active' ORDER BY display_order ASC, grade_id ASC LIMIT 1`
          );
          resolvedGradeId = retryRows?.[0]?.grade_id;

          if (!resolvedGradeId) {
            const [anyGradeRows] = await connection.execute(
              `SELECT grade_id FROM paddy_grades ORDER BY display_order ASC, grade_id ASC LIMIT 1`
            );
            resolvedGradeId = anyGradeRows?.[0]?.grade_id;
          }
        } catch (e) {
          console.warn('🧪 Grade auto-seed failed:', e?.message || e);
        }

        if (!resolvedGradeId) {
          return { success: false, error: 'No active paddy grades found. Please configure grades before creating purchases.' };
        }
      }

      purchaseData.grade_id = resolvedGradeId;

      // Generate receipt number using OUT parameter
      await connection.execute(
        'CALL sp_generate_receipt_number(?, @receipt_number)',
        safeParams([purchaseData.season_id])
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
      `, safeParams([
        weightForCalculation,
        purchaseData.base_price_per_kg,
        purchaseData.moisture_content,
        purchaseData.foreign_matter,
        purchaseData.season_id,
        purchaseData.grade_id
      ]));
      
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
      console.log('  - product_id:', purchaseData.product_id);
      console.log('  - grade_id:', purchaseData.grade_id);
      console.log('  - net_weight_kg (for DB):', purchaseData.net_weight_kg);
      console.log('  - total_amount (final):', finalTotalAmount);
      console.log('  - deduction_config:', JSON.stringify(purchaseData.deduction_config));
      
      // Insert purchase transaction
      const [result] = await connection.execute(`
        INSERT INTO purchase_transactions (
          receipt_number, season_id, farmer_id, grade_id, product_id, transaction_date,
          gross_weight_kg, tare_weight_kg, net_weight_kg,
          moisture_content, foreign_matter,
          base_price_per_kg, moisture_penalty, foreign_matter_penalty,
          deduction_config,
          final_price_per_kg, total_amount,
          vehicle_number, driver_name,
          status, payment_status,
          weighbridge_id, weighing_log_id,
          created_by
        ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, safeParams([
        receiptNumber,
        purchaseData.season_id,
        purchaseData.farmer_id,
        purchaseData.grade_id,
        purchaseData.product_id,
        purchaseData.gross_weight_kg,
        purchaseData.tare_weight_kg ?? 0,
        purchaseData.net_weight_kg,
        purchaseData.moisture_content,
        purchaseData.foreign_matter,
        purchaseData.base_price_per_kg,
        calc.moisture_penalty,
        calc.foreign_matter_penalty,
        purchaseData.deduction_config ? JSON.stringify(purchaseData.deduction_config) : null,
        calc.final_price_per_kg,
        finalTotalAmount,  // Use recalculated amount with effective weight
        purchaseData.vehicle_number,
        purchaseData.driver_name,
        'completed',
        'unpaid',
        purchaseData.weighbridge_id,
        purchaseData.weighing_log_id,
        purchaseData.created_by
      ]));
      
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
        hs.season_name,
        pp.product_name,
        pp.product_code
      FROM purchase_transactions pt
      JOIN farmers f ON pt.farmer_id = f.farmer_id
      JOIN paddy_grades pg ON pt.grade_id = pg.grade_id
      JOIN harvesting_seasons hs ON pt.season_id = hs.season_id
      LEFT JOIN paddy_products pp ON pt.product_id = pp.product_id
      WHERE pt.parent_transaction_id IS NULL
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
        hs.season_code,
        pp.product_name,
        pp.product_code
      FROM purchase_transactions pt
      JOIN farmers f ON pt.farmer_id = f.farmer_id
      JOIN paddy_grades pg ON pt.grade_id = pg.grade_id
      JOIN harvesting_seasons hs ON pt.season_id = hs.season_id
      LEFT JOIN paddy_products pp ON pt.product_id = pp.product_id
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
        pt.gross_weight_kg,
        pt.tare_weight_kg,
        pt.grade_id,
        pt.product_id,
        pt.is_split_parent,
        pt.parent_transaction_id,
        f.farmer_code,
        f.full_name as farmer_name,
        pg.grade_name,
        hs.season_name,
        pp.product_name,
        pp.product_code,
        COALESCE(SUM(spm.quantity_kg), 0) as sold_quantity_kg,
        pt.net_weight_kg - COALESCE(SUM(spm.quantity_kg), 0) as available_quantity_kg
      FROM purchase_transactions pt
      JOIN farmers f ON pt.farmer_id = f.farmer_id
      JOIN paddy_grades pg ON pt.grade_id = pg.grade_id
      JOIN harvesting_seasons hs ON pt.season_id = hs.season_id
      LEFT JOIN paddy_products pp ON pt.product_id = pp.product_id
      LEFT JOIN sales_purchase_mapping spm ON pt.transaction_id = spm.transaction_id
      WHERE pt.status = 'completed'
        AND (pt.is_split_parent IS NULL OR pt.is_split_parent = 0)
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
        pt.gross_weight_kg,
        pt.tare_weight_kg,
        pt.grade_id,
        pt.product_id,
        pt.is_split_parent,
        pt.parent_transaction_id,
        f.farmer_code,
        f.full_name,
        pg.grade_name,
        hs.season_name,
        pp.product_name,
        pp.product_code
      HAVING available_quantity_kg > 0
      ORDER BY pt.transaction_date DESC, pt.transaction_id ASC
    `;
    
    console.log('📊 Purchase getUnsold - Season ID:', seasonId);
    console.log('📊 Purchase getUnsold - SQL:', sql);
    console.log('📊 Purchase getUnsold - Params:', params);
    
    // Debug: Check total purchases without HAVING filter
    const debugSql = sql.replace('HAVING available_quantity_kg > 0', '');
    const debugRows = await db.query(debugSql, params);
    console.log('🔍 DEBUG - Total purchases (including sold):', debugRows.length);
    if (debugRows.length > 0) {
      console.log('🔍 DEBUG - All purchases sample:', debugRows.slice(0, 3).map(r => ({
        receipt: r.receipt_number,
        net_weight: r.net_weight_kg,
        sold: r.sold_quantity_kg,
        available: r.available_quantity_kg
      })));
    }
    
    const rows = await db.query(sql, params);
    console.log('📊 Purchase getUnsold - Found receipts (available > 0):', rows.length);
    
    // Log first few receipts for debugging
    if (rows.length > 0) {
      console.log('📊 Sample receipts:', rows.slice(0, 3).map(r => ({
        receipt: r.receipt_number,
        net_weight: r.net_weight_kg,
        sold: r.sold_quantity_kg,
        available: r.available_quantity_kg
      })));
    }
    
    // Return rows with available_quantity_kg as net_weight_kg for the UI
    // For sales splits: gross_weight_kg = net_weight_kg and tare_weight_kg = 0
    const formattedRows = rows.map(row => {
      const originalNetWeight = parseFloat(row.net_weight_kg);
      const availableNetWeight = parseFloat(row.available_quantity_kg);
      const originalGrossWeight = parseFloat(row.gross_weight_kg);
      const originalTareWeight = parseFloat(row.tare_weight_kg);
      
      // For available portions, set gross = net and tare = 0
      // This represents the available paddy quantity without container weight
      const availableGrossWeight = availableNetWeight;
      const availableTareWeight = 0;
      
      return {
        ...row,
        net_weight_kg: availableNetWeight,
        gross_weight_kg: availableGrossWeight,
        tare_weight_kg: availableTareWeight,
        original_weight_kg: originalNetWeight,
        original_gross_weight_kg: originalGrossWeight,
        original_tare_weight_kg: originalTareWeight
      };
    });
    
    console.log('📊 Purchase getUnsold - Returning formatted rows:', formattedRows.length);
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
        AND parent_transaction_id IS NULL
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

/**
 * Create a split receipt from an existing purchase transaction
 * @param {number} parentTransactionId - The transaction ID to split from
 * @param {number} splitWeightKg - The weight for the split portion
 * @param {number} userId - User performing the split
 * @returns {Object} Result with success status and split receipt data
 */
async function createSplit(parentTransactionId, splitWeightKg, userId = 1) {
  try {
    console.log('📋 Creating split receipt:', {
      parent: parentTransactionId,
      splitWeight: splitWeightKg,
      user: userId
    });

    // Get parent transaction
    const parentResult = await getById(parentTransactionId);
    if (!parentResult.success || !parentResult.data) {
      return { success: false, error: 'Parent transaction not found' };
    }

    const parent = parentResult.data;

    // Validate split weight (should be based on NET weight - available paddy)
    if (splitWeightKg <= 0 || splitWeightKg >= parent.net_weight_kg) {
      return { success: false, error: 'Invalid split weight - must be between 0 and net weight' };
    }

    // Check if parent has already been sold (check available quantity)
    const checkSoldSql = `
      SELECT COALESCE(SUM(spm.quantity_kg), 0) as sold_quantity
      FROM sales_purchase_mapping spm
      WHERE spm.transaction_id = ?
    `;
    const soldResult = await db.query(checkSoldSql, [parentTransactionId]);
    const soldQuantity = soldResult[0]?.sold_quantity || 0;
    const availableNetQuantity = parent.net_weight_kg - soldQuantity;

    if (availableNetQuantity <= 0) {
      return { success: false, error: 'Parent receipt has already been fully sold' };
    }

    // Generate split receipt numbers (keep them short to fit VARCHAR(30))
    // Create 2 new child receipts from the parent
    // Use simple suffixes -A and -B to ensure uniqueness and fit within VARCHAR(30)
    const splitReceipt1Number = `${parent.receipt_number}-A`;
    const splitReceipt2Number = `${parent.receipt_number}-B`;

    // For sales splits: gross_weight_kg = net_weight_kg and tare_weight_kg = 0
    // Use the EXACT weights calculated by the frontend modal
    const splitNetWeightKg = splitWeightKg;  // From frontend calculation
    const remainingNetWeightKg = parent.net_weight_kg - splitNetWeightKg;
    
    // Gross = Net, Tare = 0 (no container weight for split receipts)
    const splitGrossWeightKg = splitNetWeightKg;
    const splitTareWeightKg = 0;
    const remainingGrossWeightKg = remainingNetWeightKg;
    const remainingTareWeightKg = 0;

    // Use transaction helper for proper MySQL transaction handling
    console.log('🔄 Starting transaction to create 2 child receipts (NET weight based, no tare)...');
    console.log('   Parent:', parent.receipt_number, 'Product ID:', parent.product_id);
    console.log('   Parent Original: Gross:', parent.gross_weight_kg, 'kg, Tare:', parent.tare_weight_kg, 'kg, Net:', parent.net_weight_kg, 'kg');
    console.log('   Split requested (from frontend modal):', splitWeightKg, 'kg');
    console.log('   Child 1 (to buyer):', splitReceipt1Number, '- Net:', splitNetWeightKg.toFixed(2), 'Gross:', splitGrossWeightKg.toFixed(2), 'Tare:', splitTareWeightKg);
    console.log('   Child 2 (remaining):', splitReceipt2Number, '- Net:', remainingNetWeightKg.toFixed(2), 'Gross:', remainingGrossWeightKg.toFixed(2), 'Tare:', remainingTareWeightKg);
    console.log('   ℹ️ Note: For sales splits, Gross = Net and Tare = 0 (paddy quantities only, no containers)');
    
    if (splitNetWeightKg === remainingNetWeightKg) {
      console.warn('⚠️ WARNING: Both children have SAME net weight! Splitting exactly in half.');
    }
    
    const result = await db.transaction(async (connection) => {
      // Create FIRST split child receipt (the requested split weight)
      console.log('📝 Inserting Child 1...');
      const insertSql = `
        INSERT INTO purchase_transactions (
          receipt_number,
          season_id,
          farmer_id,
          grade_id,
          product_id,
          transaction_date,
          gross_weight_kg,
          tare_weight_kg,
          net_weight_kg,
          moisture_content,
          foreign_matter,
          base_price_per_kg,
          moisture_penalty,
          foreign_matter_penalty,
          bonus_amount,
          deduction_config,
          final_price_per_kg,
          total_amount,
          vehicle_number,
          driver_name,
          status,
          payment_status,
          weighbridge_id,
          parent_transaction_id,
          split_date,
          split_by,
          created_by,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, NOW(), ?, ?, ?)
      `;

      // Calculate total amount with deductions applied (effective weight)
      let totalDeductionRate = 0;
      if (parent.deduction_config) {
        const deductionConfig = typeof parent.deduction_config === 'string' 
          ? JSON.parse(parent.deduction_config) 
          : parent.deduction_config;
        
        if (Array.isArray(deductionConfig) && deductionConfig.length > 0) {
          totalDeductionRate = deductionConfig.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
        }
      }
      
      const effectiveWeight1 = splitNetWeightKg * (1 - totalDeductionRate / 100);
      const effectiveWeight2 = remainingNetWeightKg * (1 - totalDeductionRate / 100);
      
      const totalAmount1 = effectiveWeight1 * parent.final_price_per_kg;
      const totalAmount2 = effectiveWeight2 * parent.final_price_per_kg;
      
      console.log('💰 Calculating amounts with deductions:');
      console.log('   Deduction rate:', totalDeductionRate.toFixed(2), '%');
      console.log('   Child 1: Net', splitNetWeightKg.toFixed(2), 'kg → Effective', effectiveWeight1.toFixed(2), 'kg → Amount RM', totalAmount1.toFixed(2));
      console.log('   Child 2: Net', remainingNetWeightKg.toFixed(2), 'kg → Effective', effectiveWeight2.toFixed(2), 'kg → Amount RM', totalAmount2.toFixed(2));

      const deductionConfigJson = parent.deduction_config 
        ? (typeof parent.deduction_config === 'string' ? parent.deduction_config : JSON.stringify(parent.deduction_config))
        : null;
      
      const insertParams1 = [
        splitReceipt1Number,
        parent.season_id,
        parent.farmer_id,
        parent.grade_id,
        parent.product_id, // Add product_id from parent
        parent.transaction_date,
        splitGrossWeightKg, // Gross weight for child 1
        splitTareWeightKg, // Proportional tare weight
        splitNetWeightKg, // Net weight for child 1
        parent.moisture_content,
        parent.foreign_matter,
        parent.base_price_per_kg,
        parent.moisture_penalty * (splitNetWeightKg / parent.net_weight_kg), // Proportional penalty
        parent.foreign_matter_penalty * (splitNetWeightKg / parent.net_weight_kg), // Proportional penalty
        parent.bonus_amount * (splitNetWeightKg / parent.net_weight_kg), // Proportional bonus
        deductionConfigJson, // Copy parent's deduction config
        parent.final_price_per_kg,
        totalAmount1,
        parent.vehicle_number,
        parent.driver_name,
        parent.payment_status,
        parent.weighbridge_id,
        parentTransactionId,
        userId,
        userId,
        `Split child 1 (to buyer) from ${parent.receipt_number}. Net: ${splitNetWeightKg.toFixed(2)} kg. Effective: ${effectiveWeight1.toFixed(2)} kg (with ${totalDeductionRate.toFixed(2)}% deduction). Note: Gross = Net, Tare = 0 (paddy quantity only).`
      ];

      const [insertResult1] = await connection.execute(insertSql, insertParams1);
      const splitChild1Id = insertResult1.insertId;
      
      if (!splitChild1Id) {
        throw new Error('Failed to create first split child receipt');
      }
      
      console.log('✅ Child 1 inserted to DB:', { 
        id: splitChild1Id, 
        receipt: splitReceipt1Number, 
        net_weight_kg: splitNetWeightKg.toFixed(2),
        gross_weight_kg: splitGrossWeightKg.toFixed(2),
        tare_weight_kg: splitTareWeightKg,
        total_amount: totalAmount1.toFixed(2),
        note: 'Gross = Net, Tare = 0'
      });

      // Create SECOND split child receipt (the remaining weight)
      console.log('📝 Inserting Child 2...');
      const insertParams2 = [
        splitReceipt2Number,
        parent.season_id,
        parent.farmer_id,
        parent.grade_id,
        parent.product_id, // Add product_id from parent
        parent.transaction_date,
        remainingGrossWeightKg, // Gross weight for child 2
        remainingTareWeightKg, // Proportional tare weight
        remainingNetWeightKg, // Net weight for child 2
        parent.moisture_content,
        parent.foreign_matter,
        parent.base_price_per_kg,
        parent.moisture_penalty * (remainingNetWeightKg / parent.net_weight_kg), // Proportional penalty
        parent.foreign_matter_penalty * (remainingNetWeightKg / parent.net_weight_kg), // Proportional penalty
        parent.bonus_amount * (remainingNetWeightKg / parent.net_weight_kg), // Proportional bonus
        deductionConfigJson, // Copy parent's deduction config
        parent.final_price_per_kg,
        totalAmount2,
        parent.vehicle_number,
        parent.driver_name,
        parent.payment_status,
        parent.weighbridge_id,
        parentTransactionId,
        userId,
        userId,
        `Split child 2 (remaining, available for future sales) from ${parent.receipt_number}. Net: ${remainingNetWeightKg.toFixed(2)} kg. Effective: ${effectiveWeight2.toFixed(2)} kg (with ${totalDeductionRate.toFixed(2)}% deduction). Note: Gross = Net, Tare = 0 (paddy quantity only).`
      ];

      const [insertResult2] = await connection.execute(insertSql, insertParams2);
      const splitChild2Id = insertResult2.insertId;
      
      if (!splitChild2Id) {
        throw new Error('Failed to create second split child receipt');
      }
      
      console.log('✅ Child 2 inserted to DB:', { 
        id: splitChild2Id, 
        receipt: splitReceipt2Number, 
        net_weight_kg: remainingNetWeightKg.toFixed(2),
        gross_weight_kg: remainingGrossWeightKg.toFixed(2),
        tare_weight_kg: remainingTareWeightKg,
        total_amount: totalAmount2.toFixed(2),
        note: 'Gross = Net, Tare = 0'
      });

      // Mark parent transaction as split (keep original weight for totals)
      const updateParentSql = `
        UPDATE purchase_transactions
        SET is_split_parent = 1,
            updated_by = ?,
            notes = CONCAT(COALESCE(notes, ''), '\n', 'Split on ', NOW(), ' by user ', ?, '. Created 2 child receipts: ', ?, ' and ', ?)
        WHERE transaction_id = ?
      `;

      await connection.execute(updateParentSql, [
        userId,
        userId,
        splitReceipt1Number,
        splitReceipt2Number,
        parentTransactionId
      ]);
      
      console.log('✅ Parent marked as split (weight preserved)');
      console.log('🎯 Transaction complete - returning both child IDs:', { child1: splitChild1Id, child2: splitChild2Id });

      return { child1: splitChild1Id, child2: splitChild2Id };
    });

    console.log('✅ Split receipts created:', {
      child1Id: result.child1,
      child1Receipt: splitReceipt1Number,
      child1Net: splitNetWeightKg.toFixed(2),
      child2Id: result.child2,
      child2Receipt: splitReceipt2Number,
      child2Net: remainingNetWeightKg.toFixed(2),
      note: 'Both children have Gross = Net and Tare = 0'
    });

    // Fetch both created split receipts
    console.log('🔍 Fetching child 1 by ID:', result.child1);
    const child1Result = await getById(result.child1);
    console.log('🔍 Child 1 fetch result:', child1Result.success ? 'SUCCESS' : 'FAILED');
    
    console.log('🔍 Fetching child 2 by ID:', result.child2);
    const child2Result = await getById(result.child2);
    console.log('🔍 Child 2 fetch result:', child2Result.success ? 'SUCCESS' : 'FAILED');

    if (!child1Result.success || !child2Result.success) {
      console.error('❌ Failed to fetch split child receipts');
      console.error('   Child 1:', child1Result);
      console.error('   Child 2:', child2Result);
      return { 
        success: false, 
        error: 'Split created but failed to fetch child receipt details' 
      };
    }

    console.log('✅ Both child receipts fetched successfully');
    console.log('   Child 1:', child1Result.data.receipt_number, child1Result.data.net_weight_kg, 'kg');
    console.log('   Child 2:', child2Result.data.receipt_number, child2Result.data.net_weight_kg, 'kg');

    return {
      success: true,
      data: {
        child1: child1Result.data,
        child2: child2Result.data,
        parent: {
          transaction_id: parentTransactionId,
          receipt_number: parent.receipt_number,
          is_fully_split: true
        }
      }
    };

  } catch (error) {
    console.error('Error creating split receipt:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update payment with new deductions and recalculate amount
 */
async function updatePayment(updateData) {
  try {
    return await db.transaction(async (connection) => {
      const { transaction_id, deduction_config, effective_weight_kg, total_amount, payment_status } = updateData;

      // Get current transaction data
      const [current] = await connection.execute(
        'SELECT * FROM purchase_transactions WHERE transaction_id = ?',
        [transaction_id]
      );

      if (current.length === 0) {
        return { success: false, error: 'Transaction not found' };
      }

      const transaction = current[0];
      
      // Calculate total deduction rate first
      let totalDeductionRate = 0;
      if (deduction_config && deduction_config.length > 0) {
        totalDeductionRate = deduction_config.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
      }
      
      // Use provided values (already rounded from frontend) or calculate with rounding
      let effectiveWeight;
      let newTotalAmount;
      
      if (effective_weight_kg !== undefined && total_amount !== undefined) {
        // Use pre-calculated rounded values from frontend
        effectiveWeight = effective_weight_kg;
        newTotalAmount = total_amount;
      } else {
        // Fallback: calculate with rounding
        const netWeight = parseFloat(transaction.net_weight_kg);
        const finalPricePerKg = parseFloat(transaction.final_price_per_kg) || parseFloat(transaction.base_price_per_kg);
        
        effectiveWeight = Math.round(netWeight * (1 - totalDeductionRate / 100));
        newTotalAmount = effectiveWeight * finalPricePerKg;
      }
      
      console.log('💰 Payment Update with Rounding:');
      console.log('  - transaction_id:', transaction_id);
      console.log('  - effective_weight_kg (rounded):', effectiveWeight);
      console.log('  - total_amount:', newTotalAmount);
      
      // Update transaction with new deductions, effective weight, and amount
      await connection.execute(`
        UPDATE purchase_transactions 
        SET 
          deduction_config = ?,
          effective_weight_kg = ?,
          total_amount = ?,
          payment_status = ?,
          updated_at = NOW()
        WHERE transaction_id = ?
      `, [
        JSON.stringify(deduction_config),
        effectiveWeight,
        newTotalAmount,
        payment_status || transaction.payment_status,
        transaction_id
      ]);
      
      console.log('✅ Payment updated successfully');
      
      return {
        success: true,
        data: {
          transaction_id,
          new_total_amount: newTotalAmount,
          effective_weight: effectiveWeight,
          total_deduction_rate: totalDeductionRate,
          message: 'Payment updated successfully'
        }
      };
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancel a pending lorry session by creating a cancelled transaction record
 * @param {Object} sessionData - The pending session data
 * @param {number} userId - User performing the cancellation
 * @param {string} reason - Cancellation reason
 * @returns {Object} Result with success status
 */
async function cancelPendingLorry(sessionData, userId = 1, reason = 'Cancelled by operator') {
  try {
    return await db.transaction(async (connection) => {
      console.log('🚫 Cancelling pending lorry:', sessionData.lorry_reg_no);

      if (!sessionData || !sessionData.lorry_reg_no) {
        return { success: false, error: 'Missing session data' };
      }

      const seasonId = Number(sessionData.season_id);
      if (!seasonId || Number.isNaN(seasonId)) {
        return { success: false, error: 'Invalid season_id' };
      }

      // Get default grade
      const [defaultGradeRows] = await connection.execute(
        `SELECT grade_id FROM paddy_grades WHERE status = 'active' ORDER BY display_order ASC, grade_id ASC LIMIT 1`
      );
      const gradeId = defaultGradeRows?.[0]?.grade_id;

      if (!gradeId) {
        return { success: false, error: 'No active grade found' };
      }

      // Generate receipt number
      await connection.execute(
        'CALL sp_generate_receipt_number(?, @receipt_number)',
        [seasonId]
      );
      
      const [receiptResult] = await connection.execute(
        'SELECT @receipt_number as receipt_number'
      );
      const receiptNumber = receiptResult[0].receipt_number;

      // Create cancelled transaction record with minimal data
      const [result] = await connection.execute(`
        INSERT INTO purchase_transactions (
          receipt_number, season_id, farmer_id, grade_id, product_id,
          transaction_date, gross_weight_kg, tare_weight_kg, net_weight_kg,
          moisture_content, foreign_matter, base_price_per_kg,
          moisture_penalty, foreign_matter_penalty,
          final_price_per_kg, total_amount,
          vehicle_number, status, payment_status,
          cancelled_at, cancelled_by, cancellation_reason,
          created_by, notes
        ) VALUES (?, ?, 1, ?, NULL, NOW(), ?, 0, 0, 14.0, 0.0, 0, 0, 0, 0, 0, ?, 'cancelled', 'unpaid', NOW(), ?, ?, ?, ?)
      `, [
        receiptNumber,
        seasonId,
        gradeId,
        sessionData.weight_with_load || 0,
        sessionData.lorry_reg_no,
        userId,
        reason,
        userId,
        `Cancelled during weigh-out. Weigh-in: ${sessionData.weight_with_load} kg`
      ]);

      console.log('✅ Cancelled transaction created:', {
        id: result.insertId,
        receipt: receiptNumber,
        lorry: sessionData.lorry_reg_no
      });

      return {
        success: true,
        data: {
          transaction_id: result.insertId,
          receipt_number: receiptNumber,
          message: 'Lorry session cancelled successfully'
        }
      };
    });
  } catch (error) {
    console.error('Error cancelling pending lorry:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get split children for a parent transaction
 */
async function getSplitChildren(parentTransactionId) {
  try {
    const sql = `
      SELECT 
        pt.*,
        f.farmer_code,
        f.full_name as farmer_name,
        pg.grade_name,
        hs.season_name,
        pp.product_name,
        pp.product_code
      FROM purchase_transactions pt
      JOIN farmers f ON pt.farmer_id = f.farmer_id
      JOIN paddy_grades pg ON pt.grade_id = pg.grade_id
      JOIN harvesting_seasons hs ON pt.season_id = hs.season_id
      LEFT JOIN paddy_products pp ON pt.product_id = pp.product_id
      WHERE pt.parent_transaction_id = ?
      ORDER BY pt.created_at ASC
    `;
    
    const rows = await db.query(sql, [parentTransactionId]);
    return { success: true, data: rows };
  } catch (error) {
    console.error('Error fetching split children:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get date range (min/max) of transactions for a season
 * @param {number} seasonId - Season ID to get date range for
 */
async function getSeasonDateRange(seasonId) {
  try {
    const sql = `
      SELECT 
        DATE(MIN(transaction_date)) as earliest_date,
        DATE(MAX(transaction_date)) as latest_date,
        COUNT(*) as transaction_count
      FROM purchase_transactions
      WHERE season_id = ?
        AND status = 'completed'
        AND parent_transaction_id IS NULL
    `;
    
    const rows = await db.query(sql, [seasonId]);
    
    if (rows.length === 0 || rows[0].transaction_count === 0) {
      const today = new Date().toISOString().split('T')[0];
      return { 
        success: true, 
        data: { 
          earliest_date: today, 
          latest_date: today,
          transaction_count: 0
        } 
      };
    }
    
    return { success: true, data: rows[0] };
  } catch (error) {
    console.error('Error fetching season date range:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Change farmer assignment on a purchase transaction
 * @param {number} transactionId - The transaction to reassign
 * @param {number} newFarmerId - The new farmer ID
 * @param {number} userId - User performing the change
 * @param {string} reason - Reason for the change
 */
async function changeFarmer(transactionId, newFarmerId, userId, reason = '') {
  try {
    console.log('🔄 Changing farmer for transaction:', transactionId, '→ new farmer:', newFarmerId);

    // Verify transaction exists
    const txRows = await db.query(
      'SELECT transaction_id, farmer_id, receipt_number, status FROM purchase_transactions WHERE transaction_id = ?',
      [transactionId]
    );
    if (!txRows || txRows.length === 0) {
      return { success: false, error: 'Transaction not found' };
    }
    const tx = txRows[0];
    if (tx.status === 'cancelled') {
      return { success: false, error: 'Cannot change farmer on a cancelled transaction' };
    }
    const oldFarmerId = tx.farmer_id;

    // Verify new farmer exists
    const farmerRows = await db.query(
      'SELECT farmer_id, full_name, farmer_code FROM farmers WHERE farmer_id = ?',
      [newFarmerId]
    );
    if (!farmerRows || farmerRows.length === 0) {
      return { success: false, error: 'New farmer not found' };
    }

    // Update the farmer_id on the main transaction
    await db.query(
      'UPDATE purchase_transactions SET farmer_id = ?, updated_at = NOW() WHERE transaction_id = ?',
      [newFarmerId, transactionId]
    );

    // Also update all split (child) receipts that reference this transaction
    const childRows = await db.query(
      'SELECT transaction_id, receipt_number FROM purchase_transactions WHERE parent_transaction_id = ?',
      [transactionId]
    );
    if (childRows && childRows.length > 0) {
      await db.query(
        'UPDATE purchase_transactions SET farmer_id = ?, updated_at = NOW() WHERE parent_transaction_id = ?',
        [newFarmerId, transactionId]
      );
      console.log(`✅ Also updated ${childRows.length} split receipt(s):`, childRows.map(c => c.receipt_number));
    }

    console.log(`✅ Farmer changed on receipt ${tx.receipt_number}: farmer_id ${oldFarmerId} → ${newFarmerId} by user ${userId}. Reason: ${reason}`);

    return {
      success: true,
      data: {
        transaction_id: transactionId,
        receipt_number: tx.receipt_number,
        old_farmer_id: oldFarmerId,
        new_farmer_id: newFarmerId,
        new_farmer_name: farmerRows[0].full_name,
        new_farmer_code: farmerRows[0].farmer_code,
        affected_split_receipts: childRows ? childRows.map(c => c.receipt_number) : []
      }
    };
  } catch (error) {
    console.error('Error changing farmer:', error);
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
  getTotalStats,
  createSplit,
  updatePayment,
  cancelPendingLorry,
  getSplitChildren,
  getSeasonDateRange,
  changeFarmer
};
