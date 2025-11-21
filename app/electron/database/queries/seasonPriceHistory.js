const db = require('../connection');

/**
 * Season Price History Service
 * Operations for tracking price changes throughout seasons
 */

/**
 * Get current price for a season
 */
async function getCurrentPrice(seasonId) {
  try {
    const sql = `
      SELECT current_price_per_ton
      FROM harvesting_seasons
      WHERE season_id = ?
    `;
    
    const rows = await db.query(sql, [seasonId]);
    
    if (rows.length === 0) {
      return { success: false, error: 'Season not found' };
    }
    
    return { 
      success: true, 
      data: { 
        price_per_ton: rows[0].current_price_per_ton 
      } 
    };
  } catch (error) {
    console.error('Error fetching current price:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update season price and record in history
 */
async function updatePrice(seasonId, pricePerTon, notes = null, createdBy = null) {
  try {
    console.log('💰 Updating season price:', {
      seasonId,
      pricePerTon,
      notes,
      createdBy
    });

    return await db.transaction(async (connection) => {
      // Insert into price history
      console.log('📝 Inserting into price history...');
      await connection.execute(`
        INSERT INTO season_price_history (
          season_id, price_per_ton, effective_date, notes, created_by
        ) VALUES (?, ?, NOW(), ?, ?)
      `, [seasonId, pricePerTon, notes, createdBy]);
      
      // Update current price in seasons table
      console.log('🔄 Updating current price in seasons table...');
      const [updateResult] = await connection.execute(`
        UPDATE harvesting_seasons
        SET current_price_per_ton = ?
        WHERE season_id = ?
      `, [pricePerTon, seasonId]);
      
      console.log('✅ Update result:', updateResult);
      
      return {
        success: true,
        data: {
          season_id: seasonId,
          price_per_ton: pricePerTon,
          message: 'Price updated successfully'
        }
      };
    });
  } catch (error) {
    console.error('❌ Error updating price:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    return { success: false, error: error.message };
  }
}

/**
 * Get price history for a season
 */
async function getHistory(seasonId) {
  try {
    const sql = `
      SELECT 
        price_history_id,
        season_id,
        price_per_ton,
        effective_date,
        notes,
        created_by,
        created_at
      FROM season_price_history
      WHERE season_id = ?
      ORDER BY effective_date DESC, created_at DESC
    `;
    
    const rows = await db.query(sql, [seasonId]);
    
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
 * Get price effective on a specific date
 */
async function getPriceOnDate(seasonId, date) {
  try {
    const sql = `
      SELECT price_per_ton, effective_date
      FROM season_price_history
      WHERE season_id = ? AND effective_date <= ?
      ORDER BY effective_date DESC
      LIMIT 1
    `;
    
    const rows = await db.query(sql, [seasonId, date]);
    
    if (rows.length === 0) {
      return { success: false, error: 'No price found for this date' };
    }
    
    return { 
      success: true, 
      data: { 
        price_per_ton: rows[0].price_per_ton,
        effective_date: rows[0].effective_date
      } 
    };
  } catch (error) {
    console.error('Error fetching price on date:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Initialize price history when creating a new season
 * (Call this when a season is created with opening_price_per_ton)
 */
async function initializePrice(seasonId, pricePerTon, notes = 'Opening price', createdBy = null) {
  try {
    return await updatePrice(seasonId, pricePerTon, notes, createdBy);
  } catch (error) {
    console.error('Error initializing price:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getCurrentPrice,
  updatePrice,
  getHistory,
  getPriceOnDate,
  initializePrice
};
