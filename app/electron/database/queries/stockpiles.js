const db = require('../connection');

/**
 * Get current stockpile summary by product for a season
 */
async function getStockpileSummary(seasonId) {
  try {
    const query = `
      SELECT 
        p.product_id,
        p.product_code,
        p.product_name,
        p.product_type,
        p.variety,
        
        -- Purchase metrics (from parent receipts only)
        COALESCE(purchases.total_purchased_kg, 0) as total_purchased_kg,
        COALESCE(purchases.purchase_count, 0) as purchase_count,
        COALESCE(purchases.last_purchase_date, NULL) as last_purchase_date,
        
        -- Sales metrics (from ALL receipts - parent and children)
        COALESCE(sales.total_sold_kg, 0) as total_sold_kg,
        COALESCE(sales.sales_count, 0) as sales_count,
        COALESCE(sales.last_sale_date, NULL) as last_sale_date,
        
        -- Stock calculation
        COALESCE(purchases.total_purchased_kg, 0) - COALESCE(sales.total_sold_kg, 0) as current_stock_kg,
        
        -- Price info
        spp.current_price_per_ton
        
      FROM paddy_products p
      
      -- Purchases subquery (parent receipts only)
      LEFT JOIN (
        SELECT 
          product_id,
          SUM(net_weight_kg) as total_purchased_kg,
          COUNT(transaction_id) as purchase_count,
          MAX(created_at) as last_purchase_date
        FROM purchase_transactions
        WHERE season_id = ?
          AND parent_transaction_id IS NULL
        GROUP BY product_id
      ) as purchases ON p.product_id = purchases.product_id
      
      -- Sales subquery (via sales transactions to avoid multiplication)
      LEFT JOIN (
        SELECT 
          pt.product_id,
          SUM(spm.quantity_kg) as total_sold_kg,
          COUNT(DISTINCT spm.sales_id) as sales_count,
          MAX(st.created_at) as last_sale_date
        FROM sales_transactions st
        INNER JOIN sales_purchase_mapping spm ON st.sales_id = spm.sales_id
        INNER JOIN purchase_transactions pt ON spm.transaction_id = pt.transaction_id
        WHERE st.season_id = ?
        GROUP BY pt.product_id
      ) as sales ON p.product_id = sales.product_id
      
      -- Price info
      LEFT JOIN season_product_prices spp ON p.product_id = spp.product_id 
        AND spp.season_id = ?
        
      WHERE p.is_active = 1
      ORDER BY p.product_type, p.variety
    `;

    const rows = await db.query(query, [seasonId, seasonId, seasonId]);
    
    return {
      success: true,
      data: rows.map(row => ({
        ...row,
        current_stock_kg: parseFloat(row.current_stock_kg),
        current_stock_ton: parseFloat((row.current_stock_kg / 1000).toFixed(3)),
        total_purchased_kg: parseFloat(row.total_purchased_kg),
        total_purchased_ton: parseFloat((row.total_purchased_kg / 1000).toFixed(3)),
        total_sold_kg: parseFloat(row.total_sold_kg),
        total_sold_ton: parseFloat((row.total_sold_kg / 1000).toFixed(3)),
        stock_value: row.current_price_per_ton 
          ? parseFloat(((row.current_stock_kg / 1000) * row.current_price_per_ton).toFixed(2))
          : 0
      }))
    };
  } catch (error) {
    console.error('Error getting stockpile summary:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get detailed stockpile movements for a product
 */
async function getProductMovements(seasonId, productId, filters = {}) {
  try {
    const { startDate, endDate, movementType } = filters;
    
    let query = `
      SELECT 
        'PURCHASE' as movement_type,
        pt.transaction_id,
        pt.receipt_number as reference_number,
        pt.transaction_date,
        f.full_name as party_name,
        f.farmer_code as party_code,
        pt.net_weight_kg as weight_kg,
        pt.total_amount,
        pt.payment_status,
        pt.created_at
      FROM purchase_transactions pt
      JOIN farmers f ON pt.farmer_id = f.farmer_id
      WHERE pt.season_id = ? AND pt.product_id = ?
        AND pt.parent_transaction_id IS NULL
      
      UNION ALL
      
      SELECT 
        'SALE' as movement_type,
        st.sales_id as transaction_id,
        st.sales_number as reference_number,
        st.sale_date as transaction_date,
        m.company_name as party_name,
        m.manufacturer_code as party_code,
        spm.quantity_kg as weight_kg,
        st.total_amount,
        st.payment_status,
        st.created_at
      FROM sales_transactions st
      JOIN manufacturers m ON st.manufacturer_id = m.manufacturer_id
      JOIN sales_purchase_mapping spm ON st.sales_id = spm.sales_id
      JOIN purchase_transactions pt ON spm.transaction_id = pt.transaction_id
      WHERE st.season_id = ? AND pt.product_id = ?
    `;

    const params = [seasonId, productId, seasonId, productId];
    
    // Add date filters if provided
    if (startDate && endDate) {
      query = query.replace(
        'WHERE pt.season_id = ? AND pt.product_id = ?',
        'WHERE pt.season_id = ? AND pt.product_id = ? AND pt.transaction_date BETWEEN ? AND ?'
      );
      query = query.replace(
        'WHERE st.season_id = ? AND pt.product_id = ?',
        'WHERE st.season_id = ? AND pt.product_id = ? AND st.sale_date BETWEEN ? AND ?'
      );
      params.splice(2, 0, startDate, endDate);
      params.splice(6, 0, startDate, endDate);
    }
    
    // Add movement type filter
    if (movementType && movementType !== 'ALL') {
      query = `SELECT * FROM (${query}) as movements WHERE movement_type = ?`;
      params.push(movementType);
    }
    
    query += ' ORDER BY transaction_date DESC, created_at DESC';
    
    const rows = await db.query(query, params);
    
    return {
      success: true,
      data: rows
    };
  } catch (error) {
    console.error('Error getting product movements:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get stockpile statistics for a season
 */
async function getStockpileStats(seasonId) {
  try {
    const query = `
      SELECT 
        -- Total purchases
        COALESCE(SUM(pt.net_weight_kg), 0) as total_purchased_kg,
        COUNT(DISTINCT pt.transaction_id) as total_purchase_transactions,
        
        -- Total sales
        COALESCE(SUM(st.net_weight_kg), 0) as total_sold_kg,
        COUNT(DISTINCT st.transaction_id) as total_sale_transactions,
        
        -- Current stock
        COALESCE(SUM(pt.net_weight_kg), 0) - COALESCE(SUM(st.net_weight_kg), 0) as current_stock_kg,
        
        -- Unique products
        COUNT(DISTINCT pt.product_id) + COUNT(DISTINCT st.product_id) as products_with_activity
        
      FROM purchase_transactions pt
      FULL OUTER JOIN sales_transactions st ON 1=1
      WHERE (pt.season_id = ? OR pt.season_id IS NULL)
        AND (st.season_id = ? OR st.season_id IS NULL)
    `;
    
    // MySQL doesn't support FULL OUTER JOIN, use UNION instead
    const alternativeQuery = `
      SELECT 
        SUM(total_purchased_kg) as total_purchased_kg,
        SUM(total_purchase_transactions) as total_purchase_transactions,
        SUM(total_sold_kg) as total_sold_kg,
        SUM(total_sale_transactions) as total_sale_transactions,
        SUM(total_purchased_kg) - SUM(total_sold_kg) as current_stock_kg
      FROM (
        SELECT 
          COALESCE(SUM(net_weight_kg), 0) as total_purchased_kg,
          COUNT(DISTINCT transaction_id) as total_purchase_transactions,
          0 as total_sold_kg,
          0 as total_sale_transactions
        FROM purchase_transactions
        WHERE season_id = ?
          AND parent_transaction_id IS NULL
        
        UNION ALL
        
        SELECT 
          0 as total_purchased_kg,
          0 as total_purchase_transactions,
          COALESCE(SUM(spm.quantity_kg), 0) as total_sold_kg,
          COUNT(DISTINCT st.sales_id) as total_sale_transactions
        FROM sales_transactions st
        LEFT JOIN sales_purchase_mapping spm ON st.sales_id = spm.sales_id
        WHERE st.season_id = ?
      ) as combined
    `;
    
    const rows = await db.query(alternativeQuery, [seasonId, seasonId]);
    const stats = rows[0] || {};
    
    return {
      success: true,
      data: {
        total_purchased_kg: parseFloat(stats.total_purchased_kg || 0),
        total_purchased_ton: parseFloat(((stats.total_purchased_kg || 0) / 1000).toFixed(3)),
        total_purchase_transactions: parseInt(stats.total_purchase_transactions || 0),
        total_sold_kg: parseFloat(stats.total_sold_kg || 0),
        total_sold_ton: parseFloat(((stats.total_sold_kg || 0) / 1000).toFixed(3)),
        total_sale_transactions: parseInt(stats.total_sale_transactions || 0),
        current_stock_kg: parseFloat(stats.current_stock_kg || 0),
        current_stock_ton: parseFloat(((stats.current_stock_kg || 0) / 1000).toFixed(3)),
        turnover_rate: stats.total_purchased_kg > 0 
          ? parseFloat(((stats.total_sold_kg / stats.total_purchased_kg) * 100).toFixed(2))
          : 0
      }
    };
  } catch (error) {
    console.error('Error getting stockpile stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get low stock alerts (products with stock below threshold)
 */
async function getLowStockAlerts(seasonId, thresholdKg = 1000) {
  try {
    const summaryResult = await getStockpileSummary(seasonId);
    
    if (!summaryResult.success) {
      return summaryResult;
    }
    
    const lowStockItems = summaryResult.data.filter(
      item => item.current_stock_kg < thresholdKg && item.current_stock_kg >= 0
    );
    
    return {
      success: true,
      data: lowStockItems
    };
  } catch (error) {
    console.error('Error getting low stock alerts:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getStockpileSummary,
  getProductMovements,
  getStockpileStats,
  getLowStockAlerts
};
