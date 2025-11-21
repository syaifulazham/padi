const db = require('../connection');

/**
 * Season Product Prices Service
 * Manage product-specific pricing per season
 */

/**
 * Get all product prices for a season
 */
async function getSeasonProductPrices(seasonId) {
  try {
    const sql = `
      SELECT 
        spp.season_product_price_id,
        spp.season_id,
        spp.product_id,
        spp.opening_price_per_ton,
        spp.current_price_per_ton,
        spp.created_at,
        spp.updated_at,
        p.product_code,
        p.product_name,
        p.product_type,
        p.variety
      FROM season_product_prices spp
      INNER JOIN paddy_products p ON spp.product_id = p.product_id
      WHERE spp.season_id = ?
      ORDER BY p.product_type, p.variety, p.product_name
    `;
    
    const rows = await db.query(sql, [seasonId]);
    
    return { 
      success: true, 
      data: rows 
    };
  } catch (error) {
    console.error('Error fetching season product prices:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get price for specific product in season
 */
async function getProductPrice(seasonId, productId) {
  try {
    const sql = `
      SELECT 
        season_product_price_id,
        season_id,
        product_id,
        opening_price_per_ton,
        current_price_per_ton,
        created_at,
        updated_at
      FROM season_product_prices
      WHERE season_id = ? AND product_id = ?
    `;
    
    const rows = await db.query(sql, [seasonId, productId]);
    
    if (rows.length === 0) {
      return { success: false, error: 'Product price not found for this season' };
    }
    
    return { 
      success: true, 
      data: rows[0] 
    };
  } catch (error) {
    console.error('Error fetching product price:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Initialize product prices for a season
 * Call this when creating a new season
 */
async function initializeSeasonPrices(seasonId, productPrices) {
  try {
    return await db.transaction(async (connection) => {
      for (const priceData of productPrices) {
        // Insert into season_product_prices
        await connection.execute(`
          INSERT INTO season_product_prices (
            season_id, product_id, opening_price_per_ton, current_price_per_ton
          ) VALUES (?, ?, ?, ?)
        `, [
          seasonId,
          priceData.product_id,
          priceData.opening_price_per_ton,
          priceData.opening_price_per_ton // Initially current = opening
        ]);
        
        // Record in price history
        await connection.execute(`
          INSERT INTO product_price_history (
            season_id, product_id, price_per_ton, effective_date, notes, created_by
          ) VALUES (?, ?, ?, NOW(), ?, ?)
        `, [
          seasonId,
          priceData.product_id,
          priceData.opening_price_per_ton,
          'Opening price',
          priceData.created_by || 1
        ]);
      }
      
      return {
        success: true,
        data: {
          season_id: seasonId,
          products_initialized: productPrices.length,
          message: 'Product prices initialized successfully'
        }
      };
    });
  } catch (error) {
    console.error('Error initializing season prices:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update product price for a season
 */
async function updateProductPrice(seasonId, productId, pricePerTon, notes = null, createdBy = null) {
  try {
    return await db.transaction(async (connection) => {
      // Record in price history
      await connection.execute(`
        INSERT INTO product_price_history (
          season_id, product_id, price_per_ton, effective_date, notes, created_by
        ) VALUES (?, ?, ?, NOW(), ?, ?)
      `, [seasonId, productId, pricePerTon, notes, createdBy]);
      
      // Update or insert current price (UPSERT)
      await connection.execute(`
        INSERT INTO season_product_prices 
          (season_id, product_id, opening_price_per_ton, current_price_per_ton)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          current_price_per_ton = VALUES(current_price_per_ton),
          updated_at = CURRENT_TIMESTAMP
      `, [seasonId, productId, pricePerTon, pricePerTon]);
      
      console.log(`✅ Updated price for product ${productId} in season ${seasonId}: RM ${pricePerTon}/ton`);
      
      return {
        success: true,
        data: {
          season_id: seasonId,
          product_id: productId,
          price_per_ton: pricePerTon,
          message: 'Product price updated successfully'
        }
      };
    });
  } catch (error) {
    console.error('Error updating product price:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get price history for a product in a season
 */
async function getPriceHistory(seasonId, productId) {
  try {
    const sql = `
      SELECT 
        price_history_id,
        season_id,
        product_id,
        price_per_ton,
        effective_date,
        notes,
        created_by,
        created_at
      FROM product_price_history
      WHERE season_id = ? AND product_id = ?
      ORDER BY effective_date DESC, created_at DESC
    `;
    
    const rows = await db.query(sql, [seasonId, productId]);
    
    return { 
      success: true, 
      data: rows 
    };
  } catch (error) {
    console.error('Error fetching price history:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Copy product prices from another season
 */
async function copyPricesFromSeason(targetSeasonId, sourceSeasonId, createdBy = null) {
  try {
    return await db.transaction(async (connection) => {
      // Get source season prices
      const sourcePrices = await connection.execute(`
        SELECT product_id, current_price_per_ton
        FROM season_product_prices
        WHERE season_id = ?
      `, [sourceSeasonId]);
      
      if (sourcePrices[0].length === 0) {
        throw new Error('No product prices found in source season');
      }
      
      // Insert into target season
      for (const price of sourcePrices[0]) {
        await connection.execute(`
          INSERT INTO season_product_prices (
            season_id, product_id, opening_price_per_ton, current_price_per_ton
          ) VALUES (?, ?, ?, ?)
        `, [
          targetSeasonId,
          price.product_id,
          price.current_price_per_ton,
          price.current_price_per_ton
        ]);
        
        // Record in history
        await connection.execute(`
          INSERT INTO product_price_history (
            season_id, product_id, price_per_ton, effective_date, notes, created_by
          ) VALUES (?, ?, ?, NOW(), ?, ?)
        `, [
          targetSeasonId,
          price.product_id,
          price.current_price_per_ton,
          `Copied from season ${sourceSeasonId}`,
          createdBy
        ]);
      }
      
      return {
        success: true,
        data: {
          target_season_id: targetSeasonId,
          source_season_id: sourceSeasonId,
          products_copied: sourcePrices[0].length,
          message: 'Prices copied successfully'
        }
      };
    });
  } catch (error) {
    console.error('Error copying prices:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getSeasonProductPrices,
  getProductPrice,
  initializeSeasonPrices,
  updateProductPrice,
  getPriceHistory,
  copyPricesFromSeason
};
