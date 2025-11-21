const db = require('../connection');

/**
 * Paddy Products Service
 * Manage global paddy product types
 */

/**
 * Get all products
 */
async function getAll() {
  try {
    const sql = `
      SELECT 
        product_id,
        product_code,
        product_name,
        product_type,
        variety,
        description,
        is_active,
        created_at,
        updated_at
      FROM paddy_products
      ORDER BY product_type, variety, product_name
    `;
    
    const rows = await db.query(sql);
    
    return { 
      success: true, 
      data: rows 
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get active products only
 */
async function getActive() {
  try {
    const sql = `
      SELECT 
        product_id,
        product_code,
        product_name,
        product_type,
        variety,
        description,
        is_active,
        created_at,
        updated_at
      FROM paddy_products
      WHERE is_active = 1
      ORDER BY product_type, variety, product_name
    `;
    
    const rows = await db.query(sql);
    
    return { 
      success: true, 
      data: rows 
    };
  } catch (error) {
    console.error('Error fetching active products:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get product by ID
 */
async function getById(productId) {
  try {
    const sql = `
      SELECT 
        product_id,
        product_code,
        product_name,
        product_type,
        variety,
        description,
        is_active,
        created_at,
        updated_at
      FROM paddy_products
      WHERE product_id = ?
    `;
    
    const rows = await db.query(sql, [productId]);
    
    if (rows.length === 0) {
      return { success: false, error: 'Product not found' };
    }
    
    return { 
      success: true, 
      data: rows[0] 
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create new product
 */
async function create(productData) {
  try {
    const sql = `
      INSERT INTO paddy_products (
        product_code,
        product_name,
        product_type,
        variety,
        description,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.pool.execute(sql, [
      productData.product_code,
      productData.product_name,
      productData.product_type,
      productData.variety,
      productData.description || null,
      productData.is_active !== undefined ? productData.is_active : 1
    ]);
    
    return {
      success: true,
      data: {
        product_id: result.insertId,
        product_code: productData.product_code,
        message: 'Product created successfully'
      }
    };
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Handle duplicate product code
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, error: 'Product code already exists' };
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Update product
 */
async function update(productId, productData) {
  try {
    const sql = `
      UPDATE paddy_products
      SET 
        product_code = ?,
        product_name = ?,
        product_type = ?,
        variety = ?,
        description = ?,
        is_active = ?
      WHERE product_id = ?
    `;
    
    const [result] = await db.pool.execute(sql, [
      productData.product_code,
      productData.product_name,
      productData.product_type,
      productData.variety,
      productData.description || null,
      productData.is_active !== undefined ? productData.is_active : 1,
      productId
    ]);
    
    if (result.affectedRows === 0) {
      return { success: false, error: 'Product not found' };
    }
    
    return {
      success: true,
      data: {
        product_id: productId,
        message: 'Product updated successfully'
      }
    };
  } catch (error) {
    console.error('Error updating product:', error);
    
    // Handle duplicate product code
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, error: 'Product code already exists' };
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Delete product (only if no live transactions exist)
 */
async function deleteProduct(productId) {
  try {
    // Check if product has any LIVE mode transactions
    const checkSql = `
      SELECT COUNT(*) as count
      FROM purchase_transactions pt
      INNER JOIN harvesting_seasons hs ON pt.season_id = hs.season_id
      WHERE pt.product_id = ? AND hs.mode = 'LIVE'
      
      UNION ALL
      
      SELECT COUNT(*) as count
      FROM sales_transactions st
      INNER JOIN harvesting_seasons hs ON st.season_id = hs.season_id
      WHERE st.product_id = ? AND hs.mode = 'LIVE'
    `;
    
    const rows = await db.query(checkSql, [productId, productId]);
    const totalCount = rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    
    if (totalCount > 0) {
      return { 
        success: false, 
        error: `Cannot delete product. ${totalCount} LIVE transaction(s) exist for this product.` 
      };
    }
    
    // Safe to delete
    const deleteSql = `DELETE FROM paddy_products WHERE product_id = ?`;
    const [result] = await db.pool.execute(deleteSql, [productId]);
    
    if (result.affectedRows === 0) {
      return { success: false, error: 'Product not found' };
    }
    
    return {
      success: true,
      data: {
        product_id: productId,
        message: 'Product deleted successfully'
      }
    };
  } catch (error) {
    console.error('Error deleting product:', error);
    
    // Handle foreign key constraint
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return { 
        success: false, 
        error: 'Cannot delete product. Transactions exist for this product.' 
      };
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Get product inventory summary
 */
async function getInventorySummary(seasonId = null) {
  try {
    let sql = `
      SELECT 
        p.product_id,
        p.product_name,
        p.product_type,
        p.variety,
        COALESCE(SUM(pt.net_weight_kg), 0) as total_purchases_kg,
        COALESCE(SUM(st.net_weight_kg), 0) as total_sales_kg,
        (COALESCE(SUM(pt.net_weight_kg), 0) - COALESCE(SUM(st.net_weight_kg), 0)) as current_stock_kg
      FROM paddy_products p
      LEFT JOIN purchase_transactions pt ON p.product_id = pt.product_id AND pt.status = 'completed'
      LEFT JOIN sales_transactions st ON p.product_id = st.product_id AND st.status = 'completed'
    `;
    
    const params = [];
    
    if (seasonId) {
      sql += ` WHERE (pt.season_id = ? OR pt.season_id IS NULL) AND (st.season_id = ? OR st.season_id IS NULL)`;
      params.push(seasonId, seasonId);
    }
    
    sql += ` GROUP BY p.product_id, p.product_name, p.product_type, p.variety ORDER BY p.product_name`;
    
    const rows = await db.query(sql, params);
    
    return { 
      success: true, 
      data: rows 
    };
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getAll,
  getActive,
  getById,
  create,
  update,
  delete: deleteProduct,
  getInventorySummary
};
