const db = require('../connection');

/**
 * Sales Service
 * Operations for sales transactions
 */

/**
 * Create new sales transaction
 */
async function create(saleData) {
  try {
    return await db.transaction(async (connection) => {
      // Generate sales number (format: SALE-YYYYMMDD-XXXX)
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Get the last sales number for today
      const [lastSale] = await connection.execute(
        `SELECT sales_number FROM sales_transactions 
         WHERE sales_number LIKE ? 
         ORDER BY sales_number DESC LIMIT 1`,
        [`SALE-${dateStr}-%`]
      );
      
      let sequenceNum = 1;
      if (lastSale.length > 0) {
        const lastNum = lastSale[0].sales_number.split('-')[2];
        sequenceNum = parseInt(lastNum) + 1;
      }
      
      const salesNumber = `SALE-${dateStr}-${sequenceNum.toString().padStart(4, '0')}`;
      
      // Calculate total amount
      const totalAmount = saleData.net_weight_kg * saleData.base_price_per_kg;
      
      // Insert sales transaction
      const [result] = await connection.execute(`
        INSERT INTO sales_transactions (
          sales_number, season_id, product_id, manufacturer_id, sale_date,
          vehicle_number, driver_name,
          total_quantity_kg, gross_weight_kg, tare_weight_kg, net_weight_kg,
          sale_price_per_kg, total_amount,
          payment_status, status, notes,
          created_by
        ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'completed', ?, ?)
      `, [
        salesNumber,
        saleData.season_id,
        saleData.product_id || null,
        saleData.manufacturer_id,
        saleData.vehicle_number,
        saleData.driver_name || null,
        saleData.net_weight_kg,
        saleData.gross_weight_kg,
        saleData.tare_weight_kg,
        saleData.net_weight_kg,
        saleData.base_price_per_kg,
        totalAmount,
        saleData.notes || null,
        saleData.created_by
      ]);
      
      const salesId = result.insertId;
      
      // Process receipts and handle auto-splits
      for (const receipt of saleData.purchase_receipts) {
        let finalTransactionId = receipt.transaction_id;
        let finalQuantity = receipt.net_weight_kg;
        
        // Check if this receipt was auto-split (has split metadata)
        if (receipt.is_split && receipt.split_remaining_weight) {
          console.log(`🔪 Processing auto-split receipt: ${receipt.receipt_number}`);
          console.log(`   - Split weight (to buyer): ${receipt.net_weight_kg} kg`);
          console.log(`   - Remaining weight: ${receipt.split_remaining_weight} kg`);
          
          // Get original purchase transaction
          const [originalPurchase] = await connection.execute(
            'SELECT * FROM purchase_transactions WHERE transaction_id = ?',
            [receipt.transaction_id]
          );
          
          if (originalPurchase.length === 0) {
            throw new Error(`Original purchase transaction ${receipt.transaction_id} not found`);
          }
          
          const parent = originalPurchase[0];
          
          // Calculate proportions for split
          const splitNetWeight = parseFloat(receipt.net_weight_kg);
          const remainingNetWeight = parseFloat(receipt.split_remaining_weight);
          
          // For sales splits, gross_weight_kg = net_weight_kg and tare_weight_kg = 0
          // This is because we're splitting already-weighed paddy, not re-weighing containers
          const splitGrossWeight = splitNetWeight;
          const splitTareWeight = 0;
          const remainingGrossWeight = remainingNetWeight;
          const remainingTareWeight = 0;
          
          // Calculate amounts
          const splitAmount = splitNetWeight * parent.final_price_per_kg;
          const remainingAmount = remainingNetWeight * parent.final_price_per_kg;
          
          // Generate split receipt numbers
          const timestamp = Date.now();
          const splitReceipt1Number = `${parent.receipt_number}-SP1-${timestamp}`;
          const splitReceipt2Number = `${parent.receipt_number}-SP2-${timestamp}`;
          
          // Mark parent as split
          await connection.execute(
            'UPDATE purchase_transactions SET is_split_parent = 1 WHERE transaction_id = ?',
            [parent.transaction_id]
          );
          
          // Create first split (goes to buyer)
          const [insertResult1] = await connection.execute(`
            INSERT INTO purchase_transactions (
              receipt_number, season_id, farmer_id, grade_id, product_id, transaction_date,
              gross_weight_kg, tare_weight_kg, net_weight_kg,
              moisture_content, foreign_matter,
              base_price_per_kg, moisture_penalty, foreign_matter_penalty, bonus_amount,
              final_price_per_kg, total_amount,
              vehicle_number, driver_name, payment_status, weighbridge_id,
              parent_transaction_id, created_by, updated_by, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            splitReceipt1Number, parent.season_id, parent.farmer_id, parent.grade_id, parent.product_id,
            parent.transaction_date, splitGrossWeight, splitTareWeight, splitNetWeight,
            parent.moisture_content, parent.foreign_matter, parent.base_price_per_kg,
            parent.moisture_penalty * (splitNetWeight / parent.net_weight_kg),
            parent.foreign_matter_penalty * (splitNetWeight / parent.net_weight_kg),
            parent.bonus_amount * (splitNetWeight / parent.net_weight_kg),
            parent.final_price_per_kg, splitAmount,
            parent.vehicle_number, parent.driver_name, parent.payment_status, parent.weighbridge_id,
            parent.transaction_id, saleData.created_by, saleData.created_by,
            `Auto-split for sale. Split: ${splitNetWeight.toFixed(2)} kg, Remaining: ${remainingNetWeight.toFixed(2)} kg`
          ]);
          
          const splitChild1Id = insertResult1.insertId;
          console.log(`✅ Created split portion for buyer: ${splitReceipt1Number} (${splitNetWeight.toFixed(2)} kg)`);
          
          // Create second split (remaining portion)
          await connection.execute(`
            INSERT INTO purchase_transactions (
              receipt_number, season_id, farmer_id, grade_id, product_id, transaction_date,
              gross_weight_kg, tare_weight_kg, net_weight_kg,
              moisture_content, foreign_matter,
              base_price_per_kg, moisture_penalty, foreign_matter_penalty, bonus_amount,
              final_price_per_kg, total_amount,
              vehicle_number, driver_name, payment_status, weighbridge_id,
              parent_transaction_id, created_by, updated_by, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            splitReceipt2Number, parent.season_id, parent.farmer_id, parent.grade_id, parent.product_id,
            parent.transaction_date, remainingGrossWeight, remainingTareWeight, remainingNetWeight,
            parent.moisture_content, parent.foreign_matter, parent.base_price_per_kg,
            parent.moisture_penalty * (remainingNetWeight / parent.net_weight_kg),
            parent.foreign_matter_penalty * (remainingNetWeight / parent.net_weight_kg),
            parent.bonus_amount * (remainingNetWeight / parent.net_weight_kg),
            parent.final_price_per_kg, remainingAmount,
            parent.vehicle_number, parent.driver_name, parent.payment_status, parent.weighbridge_id,
            parent.transaction_id, saleData.created_by, saleData.created_by,
            `Auto-split remaining portion. Available for future sales.`
          ]);
          
          console.log(`✅ Created remaining portion: ${splitReceipt2Number} (${remainingNetWeight.toFixed(2)} kg)`);
          
          // Use the split portion ID for mapping
          finalTransactionId = splitChild1Id;
          finalQuantity = splitNetWeight;
        }
        
        // Insert sales purchase mapping
        await connection.execute(`
          INSERT INTO sales_purchase_mapping (
            sales_id, transaction_id, quantity_kg, grade_id, created_by
          ) 
          SELECT ?, pt.transaction_id, ?, pt.grade_id, ?
          FROM purchase_transactions pt
          WHERE pt.transaction_id = ?
        `, [
          salesId,
          finalQuantity,
          saleData.created_by,
          finalTransactionId
        ]);
      }
      
      return {
        success: true,
        data: {
          sales_id: salesId,
          sales_number: salesNumber,
          receipt_number: salesNumber, // Alias for frontend compatibility
          total_amount: totalAmount,
          receipts_count: saleData.purchase_receipts.length
        }
      };
    });
  } catch (error) {
    console.error('Error creating sales transaction:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all sales transactions with filters
 */
async function getAll(filters = {}) {
  try {
    let sql = `
      SELECT 
        st.sales_id,
        st.sales_number,
        st.sale_date,
        st.vehicle_number,
        st.driver_name,
        st.total_quantity_kg,
        st.gross_weight_kg,
        st.tare_weight_kg,
        st.net_weight_kg,
        st.sale_price_per_kg,
        st.total_amount,
        st.payment_status,
        st.status,
        st.notes,
        m.company_name as manufacturer_name,
        m.contact_person as manufacturer_contact,
        hs.season_name,
        pp.product_name,
        COUNT(DISTINCT spm.transaction_id) as purchase_receipts_count,
        st.created_at
      FROM sales_transactions st
      JOIN manufacturers m ON st.manufacturer_id = m.manufacturer_id
      JOIN harvesting_seasons hs ON st.season_id = hs.season_id
      LEFT JOIN paddy_products pp ON st.product_id = pp.product_id
      LEFT JOIN sales_purchase_mapping spm ON st.sales_id = spm.sales_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters
    if (filters.startDate) {
      sql += ' AND DATE(st.sale_date) >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      sql += ' AND DATE(st.sale_date) <= ?';
      params.push(filters.endDate);
    }
    if (filters.manufacturer_id) {
      sql += ' AND st.manufacturer_id = ?';
      params.push(filters.manufacturer_id);
    }
    if (filters.status) {
      sql += ' AND st.status = ?';
      params.push(filters.status);
    }
    if (filters.payment_status) {
      sql += ' AND st.payment_status = ?';
      params.push(filters.payment_status);
    }
    
    sql += ' GROUP BY st.sales_id ORDER BY st.sale_date DESC, st.sales_number DESC';
    
    const rows = await db.query(sql, params);
    return { success: true, data: rows };
  } catch (error) {
    console.error('Error fetching sales:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get sales transaction by ID with details
 */
async function getById(salesId) {
  try {
    console.log('🔍 Fetching sales transaction by ID:', salesId);
    
    // Get main sales transaction
    const sales = await db.query(`
      SELECT 
        st.*,
        m.company_name as manufacturer_name,
        m.contact_person as manufacturer_contact,
        m.phone as manufacturer_phone,
        hs.season_name,
        hs.year as season_year,
        pp.product_name,
        pp.product_code
      FROM sales_transactions st
      JOIN manufacturers m ON st.manufacturer_id = m.manufacturer_id
      JOIN harvesting_seasons hs ON st.season_id = hs.season_id
      LEFT JOIN paddy_products pp ON st.product_id = pp.product_id
      WHERE st.sales_id = ?
    `, [salesId]);
    
    console.log('📦 Sales query result type:', typeof sales);
    console.log('📦 Is array?:', Array.isArray(sales));
    console.log('📦 Sales query returned:', sales ? sales.length : 0, 'rows');
    
    if (sales && sales.length > 0) {
      console.log('📋 First row keys:', Object.keys(sales[0]));
      console.log('📋 Sales number:', sales[0].sales_number);
      console.log('📋 Gross weight:', sales[0].gross_weight_kg);
    } else {
      console.error('❌ Sales query returned empty or invalid result');
      console.error('   Sales value:', sales);
    }
    
    if (!sales || sales.length === 0) {
      console.error('❌ Sales transaction not found for ID:', salesId);
      return { success: false, error: 'Sales transaction not found' };
    }
    
    // Get purchase receipts mapping
    const purchaseReceipts = await db.query(`
      SELECT 
        spm.quantity_kg,
        pt.receipt_number,
        pt.transaction_date,
        pt.net_weight_kg as original_weight,
        pt.gross_weight_kg,
        pt.tare_weight_kg,
        f.full_name as farmer_name,
        f.farmer_code,
        pg.grade_name
      FROM sales_purchase_mapping spm
      JOIN purchase_transactions pt ON spm.transaction_id = pt.transaction_id
      JOIN farmers f ON pt.farmer_id = f.farmer_id
      JOIN paddy_grades pg ON spm.grade_id = pg.grade_id
      WHERE spm.sales_id = ?
      ORDER BY pt.transaction_date
    `, [salesId]);
    
    const result = {
      success: true,
      data: {
        ...sales[0],
        purchase_receipts: purchaseReceipts
      }
    };
    
    console.log('✅ Returning sales data with keys:', Object.keys(result.data));
    return result;
  } catch (error) {
    console.error('❌ Error fetching sales by ID:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get sales by sales number
 */
async function getBySalesNumber(salesNumber) {
  try {
    const [sales] = await db.query(`
      SELECT sales_id FROM sales_transactions WHERE sales_number = ?
    `, [salesNumber]);
    
    if (!sales || sales.length === 0) {
      return { success: false, error: 'Sales transaction not found' };
    }
    
    return getById(sales[0].sales_id);
  } catch (error) {
    console.error('Error fetching sales by number:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get total sales statistics
 * @param {number} seasonId - Optional season ID to filter by active season
 */
async function getTotalStats(seasonId = null) {
  try {
    let sql = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(net_weight_kg), 0) as total_net_weight_kg,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM sales_transactions
      WHERE status = 'completed'
    `;
    
    const params = [];
    
    // Filter by season if provided
    if (seasonId) {
      sql += ' AND season_id = ?';
      params.push(seasonId);
    }
    
    console.log('📊 Sales getTotalStats - SQL:', sql);
    console.log('📊 Sales getTotalStats - Params:', params);
    console.log('📊 Sales getTotalStats - Season ID:', seasonId);
    
    const rows = await db.query(sql, params);
    
    console.log('📊 Sales getTotalStats - Result:', rows[0]);
    
    return { success: true, data: rows[0] };
  } catch (error) {
    console.error('Error fetching sales total stats:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  create,
  getAll,
  getById,
  getBySalesNumber,
  getTotalStats
};
