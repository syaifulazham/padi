const db = require('../connection');

/**
 * Farmers Service
 * CRUD operations for farmers table
 */

/**
 * Get all farmers with optional filters
 */
async function getAll(filters = {}) {
  try {
    let sql = `
      SELECT 
        farmer_id,
        farmer_code,
        ic_number,
        full_name,
        phone,
        email,
        address,
        city,
        state,
        postcode,
        bank_name,
        bank_account_number,
        farm_size_hectares,
        status,
        registration_date,
        created_at
      FROM farmers
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.search) {
      sql += ' AND (full_name LIKE ? OR farmer_code LIKE ? OR ic_number LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    sql += ' ORDER BY full_name ASC';
    
    const rows = await db.query(sql, params);
    return { success: true, data: rows };
  } catch (error) {
    console.error('Error fetching farmers:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get farmer by ID
 */
async function getById(farmerId) {
  try {
    const sql = `
      SELECT * FROM farmers WHERE farmer_id = ?
    `;
    const rows = await db.query(sql, [farmerId]);
    
    if (rows.length === 0) {
      return { success: false, error: 'Farmer not found' };
    }
    
    return { success: true, data: rows[0] };
  } catch (error) {
    console.error('Error fetching farmer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create new farmer
 */
async function create(farmerData) {
  try {
    const sql = `
      INSERT INTO farmers (
        farmer_code, ic_number, full_name, phone, email,
        address, postcode, city, state,
        bank_name, bank_account_number,
        farm_size_hectares, status, registration_date,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      farmerData.farmer_code,
      farmerData.ic_number,
      farmerData.full_name,
      farmerData.phone || null,
      farmerData.email || null,
      farmerData.address || null,
      farmerData.postcode || null,
      farmerData.city || null,
      farmerData.state || null,
      farmerData.bank_name || null,
      farmerData.bank_account_number || null,
      farmerData.farm_size_hectares || null,
      farmerData.status || 'active',
      farmerData.registration_date || new Date(),
      farmerData.created_by || 1
    ];
    
    const result = await db.query(sql, params);
    
    return {
      success: true,
      data: {
        farmer_id: result.insertId,
        message: 'Farmer created successfully'
      }
    };
  } catch (error) {
    console.error('Error creating farmer:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, error: 'Farmer code or IC number already exists' };
    }
    return { success: false, error: error.message };
  }
}

/**
 * Update farmer
 */
async function update(farmerId, farmerData) {
  try {
    const sql = `
      UPDATE farmers SET
        farmer_code = ?,
        ic_number = ?,
        full_name = ?,
        phone = ?,
        email = ?,
        address = ?,
        postcode = ?,
        city = ?,
        state = ?,
        bank_name = ?,
        bank_account_number = ?,
        farm_size_hectares = ?,
        status = ?,
        updated_by = ?
      WHERE farmer_id = ?
    `;
    
    const params = [
      farmerData.farmer_code,
      farmerData.ic_number,
      farmerData.full_name,
      farmerData.phone || null,
      farmerData.email || null,
      farmerData.address || null,
      farmerData.postcode || null,
      farmerData.city || null,
      farmerData.state || null,
      farmerData.bank_name || null,
      farmerData.bank_account_number || null,
      farmerData.farm_size_hectares || null,
      farmerData.status || 'active',
      farmerData.updated_by || 1,
      farmerId
    ];
    
    await db.query(sql, params);
    
    return { success: true, message: 'Farmer updated successfully' };
  } catch (error) {
    console.error('Error updating farmer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete farmer (soft delete - set status to inactive)
 */
async function deleteFarmer(farmerId) {
  try {
    const sql = `UPDATE farmers SET status = 'inactive' WHERE farmer_id = ?`;
    await db.query(sql, [farmerId]);
    return { success: true, message: 'Farmer deactivated successfully' };
  } catch (error) {
    console.error('Error deleting farmer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Search farmers
 */
async function search(searchTerm) {
  try {
    const sql = `
      SELECT 
        farmer_id, farmer_code, ic_number, full_name, phone, status
      FROM farmers
      WHERE (full_name LIKE ? OR farmer_code LIKE ? OR ic_number LIKE ?)
        AND status = 'active'
      ORDER BY full_name ASC
      LIMIT 20
    `;
    
    const term = `%${searchTerm}%`;
    const rows = await db.query(sql, [term, term, term]);
    
    return { success: true, data: rows };
  } catch (error) {
    console.error('Error searching farmers:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get farmer statistics
 */
async function getStatistics(farmerId, seasonId) {
  try {
    const rows = await db.callProcedure('sp_get_farmer_stats', [farmerId, seasonId]);
    return { success: true, data: rows[0][0] };
  } catch (error) {
    console.error('Error getting farmer stats:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteFarmer,
  search,
  getStatistics
};
