const db = require('../connection');
const seasonPriceService = require('./seasonPriceHistory');
const seasonProductPriceService = require('./seasonProductPrices');
const productService = require('./products');

/**
 * Seasons Service
 * Operations for harvesting seasons
 */

/**
 * Helper function to convert undefined values to null for SQL
 */
function sanitizeForSQL(value) {
  return value === undefined ? null : value;
}

/**
 * Get all seasons
 */
async function getAll(filters = {}) {
  try {
    let sql = `
      SELECT 
        hs.season_id,
        hs.season_code,
        hs.season_name,
        hs.year,
        hs.season_number,
        hs.opening_price_per_ton,
        hs.current_price_per_ton,
        hs.deduction_config,
        hs.mode,
        hs.season_type_id,
        hs.start_date,
        hs.end_date,
        hs.status,
        hs.target_quantity_kg,
        hs.actual_quantity_kg,
        hs.total_purchases,
        hs.total_sales,
        hs.notes,
        hs.closed_at,
        hs.created_at,
        hs.updated_at,
        stc.type_name as season_type_name
      FROM harvesting_seasons hs
      LEFT JOIN season_type_config stc ON hs.season_type_id = stc.type_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters
    if (filters.status) {
      sql += ' AND hs.status = ?';
      params.push(filters.status);
    }
    if (filters.mode) {
      sql += ' AND hs.mode = ?';
      params.push(filters.mode);
    }
    if (filters.year) {
      sql += ' AND hs.year = ?';
      params.push(filters.year);
    }
    
    sql += ' ORDER BY hs.year DESC, hs.season_number DESC, hs.start_date DESC';
    
    const rows = await db.query(sql, params);
    
    // Parse deduction_config JSON for each row (MySQL JSON type may already be parsed)
    const formattedRows = rows.map(row => ({
      ...row,
      deduction_config: row.deduction_config 
        ? (typeof row.deduction_config === 'string' ? JSON.parse(row.deduction_config) : row.deduction_config)
        : []
    }));
    
    return { success: true, data: formattedRows };
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get season by ID
 */
async function getById(seasonId) {
  try {
    const rows = await db.query(`
      SELECT 
        hs.*,
        stc.type_name as season_type_name,
        stc.description as season_type_description
      FROM harvesting_seasons hs
      LEFT JOIN season_type_config stc ON hs.season_type_id = stc.type_id
      WHERE hs.season_id = ?
    `, [seasonId]);
    
    if (!rows || rows.length === 0) {
      return { success: false, error: 'Season not found' };
    }
    
    const season = rows[0];
    
    // Parse deduction_config JSON (MySQL JSON type may already be parsed)
    const seasonData = {
      ...season,
      deduction_config: season.deduction_config 
        ? (typeof season.deduction_config === 'string' ? JSON.parse(season.deduction_config) : season.deduction_config)
        : []
    };
    
    return { success: true, data: seasonData };
  } catch (error) {
    console.error('Error fetching season by ID:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create new season
 */
async function create(seasonData) {
  try {
    console.log('Creating season with data:', seasonData);
    
    // If setting this season to 'active', deactivate all other seasons first
    if (seasonData.status === 'active') {
      await db.query(`
        UPDATE harvesting_seasons
        SET status = 'closed'
        WHERE status = 'active'
      `);
    }
    
    // Stringify deduction_config if it's an object/array
    const deductionConfig = seasonData.deduction_config 
      ? JSON.stringify(seasonData.deduction_config) 
      : null;
    
    const result = await db.query(`
      INSERT INTO harvesting_seasons (
        season_code, season_name, year, season_number,
        opening_price_per_ton, deduction_config, mode,
        season_type_id, start_date, end_date,
        status, target_quantity_kg, notes,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sanitizeForSQL(seasonData.season_code),
      sanitizeForSQL(seasonData.season_name),
      sanitizeForSQL(seasonData.year),
      sanitizeForSQL(seasonData.season_number),
      sanitizeForSQL(seasonData.opening_price_per_ton),
      deductionConfig,
      seasonData.mode || 'LIVE',
      sanitizeForSQL(seasonData.season_type_id),
      sanitizeForSQL(seasonData.start_date),
      sanitizeForSQL(seasonData.end_date),
      seasonData.status || 'planned',
      sanitizeForSQL(seasonData.target_quantity_kg),
      sanitizeForSQL(seasonData.notes),
      seasonData.created_by || 1
    ]);
    
    const seasonId = result.insertId;
    
    // Initialize product prices for all active products
    if (seasonData.opening_price_per_ton) {
      // Get all active products
      const productsResult = await productService.getActive();
      
      if (productsResult?.success && productsResult.data.length > 0) {
        // Initialize prices for each product with the season's opening price
        const productPrices = productsResult.data.map(product => ({
          product_id: product.product_id,
          opening_price_per_ton: seasonData.opening_price_per_ton,
          created_by: seasonData.created_by || 1
        }));
        
        await seasonProductPriceService.initializeSeasonPrices(seasonId, productPrices);
        console.log(`✅ Initialized prices for ${productPrices.length} products in season ${seasonId}`);
      }
    }
    
    return {
      success: true,
      data: {
        season_id: seasonId,
        season_code: seasonData.season_code
      }
    };
  } catch (error) {
    console.error('Error creating season:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update season
 */
async function update(seasonId, seasonData) {
  try {
    // If setting this season to 'active', deactivate all other seasons first
    if (seasonData.status === 'active') {
      await db.query(`
        UPDATE harvesting_seasons
        SET status = 'closed'
        WHERE status = 'active' AND season_id != ?
      `, [seasonId]);
    }
    
    // Stringify deduction_config if it's an object/array
    const deductionConfig = seasonData.deduction_config 
      ? JSON.stringify(seasonData.deduction_config) 
      : null;
    
    await db.query(`
      UPDATE harvesting_seasons
      SET 
        season_name = ?,
        year = ?,
        season_number = ?,
        opening_price_per_ton = ?,
        deduction_config = ?,
        mode = ?,
        season_type_id = ?,
        start_date = ?,
        end_date = ?,
        status = ?,
        target_quantity_kg = ?,
        notes = ?,
        updated_by = ?
      WHERE season_id = ?
    `, [
      sanitizeForSQL(seasonData.season_name),
      sanitizeForSQL(seasonData.year),
      sanitizeForSQL(seasonData.season_number),
      sanitizeForSQL(seasonData.opening_price_per_ton),
      deductionConfig,
      seasonData.mode || 'LIVE',
      sanitizeForSQL(seasonData.season_type_id),
      sanitizeForSQL(seasonData.start_date),
      sanitizeForSQL(seasonData.end_date),
      sanitizeForSQL(seasonData.status),
      sanitizeForSQL(seasonData.target_quantity_kg),
      sanitizeForSQL(seasonData.notes),
      seasonData.updated_by || 1,
      seasonId
    ]);
    
    return { success: true, data: { season_id: seasonId } };
  } catch (error) {
    console.error('Error updating season:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get active season
 */
async function getActive() {
  try {
    const rows = await db.query(`
      SELECT 
        hs.*,
        stc.type_name as season_type_name
      FROM harvesting_seasons hs
      LEFT JOIN season_type_config stc ON hs.season_type_id = stc.type_id
      WHERE hs.status = 'active'
      ORDER BY hs.start_date DESC
      LIMIT 1
    `);
    
    if (!rows || rows.length === 0) {
      return { success: false, error: 'No active season found' };
    }
    
    const season = rows[0];
    
    // Parse deduction_config JSON (MySQL JSON type may already be parsed)
    const seasonData = {
      ...season,
      deduction_config: season.deduction_config 
        ? (typeof season.deduction_config === 'string' ? JSON.parse(season.deduction_config) : season.deduction_config)
        : []
    };
    
    return { success: true, data: seasonData };
  } catch (error) {
    console.error('Error fetching active season:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get season types
 */
async function getSeasonTypes() {
  try {
    const rows = await db.query(`
      SELECT 
        type_id,
        type_code,
        type_name,
        description,
        color_code,
        is_production,
        display_order,
        status
      FROM season_type_config
      WHERE status = 'active'
      ORDER BY display_order, type_code
    `);
    
    return { success: true, data: rows };
  } catch (error) {
    console.error('Error fetching season types:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  getActive,
  getSeasonTypes
};
