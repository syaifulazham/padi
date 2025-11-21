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
          sales_number, season_id, manufacturer_id, sale_date,
          vehicle_number, driver_name,
          total_quantity_kg, gross_weight_kg, tare_weight_kg, net_weight_kg,
          sale_price_per_kg, total_amount,
          payment_status, status, notes,
          created_by
        ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'completed', ?, ?)
      `, [
        salesNumber,
        saleData.season_id,
        saleData.manufacturer_id,
        saleData.vehicle_number,
        saleData.driver_name,
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
      
      // Insert sales purchase mapping (traceability)
      for (const receipt of saleData.purchase_receipts) {
        await connection.execute(`
          INSERT INTO sales_purchase_mapping (
            sales_id, transaction_id, quantity_kg, grade_id, created_by
          ) 
          SELECT ?, pt.transaction_id, ?, pt.grade_id, ?
          FROM purchase_transactions pt
          WHERE pt.transaction_id = ?
        `, [
          salesId,
          receipt.net_weight_kg,
          saleData.created_by,
          receipt.transaction_id
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
        COUNT(DISTINCT spm.transaction_id) as purchase_receipts_count,
        st.created_at
      FROM sales_transactions st
      JOIN manufacturers m ON st.manufacturer_id = m.manufacturer_id
      JOIN harvesting_seasons hs ON st.season_id = hs.season_id
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
    // Get main sales transaction
    const [sales] = await db.query(`
      SELECT 
        st.*,
        m.company_name as manufacturer_name,
        m.contact_person as manufacturer_contact,
        m.phone as manufacturer_phone,
        hs.season_name,
        hs.year as season_year
      FROM sales_transactions st
      JOIN manufacturers m ON st.manufacturer_id = m.manufacturer_id
      JOIN harvesting_seasons hs ON st.season_id = hs.season_id
      WHERE st.sales_id = ?
    `, [salesId]);
    
    if (!sales || sales.length === 0) {
      return { success: false, error: 'Sales transaction not found' };
    }
    
    // Get purchase receipts mapping
    const purchaseReceipts = await db.query(`
      SELECT 
        spm.quantity_kg,
        pt.receipt_number,
        pt.transaction_date,
        pt.net_weight_kg as original_weight,
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
    
    return {
      success: true,
      data: {
        ...sales[0],
        purchase_receipts: purchaseReceipts
      }
    };
  } catch (error) {
    console.error('Error fetching sales by ID:', error);
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
