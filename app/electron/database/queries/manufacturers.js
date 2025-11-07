const db = require('../connection');

/**
 * Manufacturers Service
 * CRUD operations for manufacturers table
 */

/**
 * Get all manufacturers with optional filters
 */
async function getAll(filters = {}) {
  try {
    let sql = `
      SELECT 
        manufacturer_id,
        manufacturer_code,
        company_name,
        registration_number,
        contact_person,
        phone,
        email,
        address,
        city,
        state,
        postcode,
        credit_limit,
        payment_terms,
        status,
        contract_start_date,
        contract_end_date,
        notes,
        created_at
      FROM manufacturers
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.search) {
      sql += ' AND (company_name LIKE ? OR registration_number LIKE ? OR contact_person LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    sql += ' ORDER BY company_name ASC';
    
    const rows = await db.query(sql, params);
    return { success: true, data: rows };
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get manufacturer by ID
 */
async function getById(manufacturerId) {
  try {
    const sql = `
      SELECT * FROM manufacturers WHERE manufacturer_id = ?
    `;
    const rows = await db.query(sql, [manufacturerId]);
    
    if (rows.length === 0) {
      return { success: false, error: 'Manufacturer not found' };
    }
    
    return { success: true, data: rows[0] };
  } catch (error) {
    console.error('Error fetching manufacturer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create new manufacturer
 */
async function create(manufacturerData) {
  try {
    const sql = `
      INSERT INTO manufacturers (
        manufacturer_code, company_name, registration_number,
        contact_person, phone, email,
        address, postcode, city, state,
        credit_limit, payment_terms,
        status, contract_start_date, contract_end_date, notes,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      manufacturerData.manufacturer_code,
      manufacturerData.company_name,
      manufacturerData.registration_number || null,
      manufacturerData.contact_person || null,
      manufacturerData.phone || null,
      manufacturerData.email || null,
      manufacturerData.address || null,
      manufacturerData.postcode || null,
      manufacturerData.city || null,
      manufacturerData.state || null,
      manufacturerData.credit_limit || 0.00,
      manufacturerData.payment_terms || 30,
      manufacturerData.status || 'active',
      manufacturerData.contract_start_date || null,
      manufacturerData.contract_end_date || null,
      manufacturerData.notes || null,
      manufacturerData.created_by || 1
    ];
    
    const result = await db.query(sql, params);
    
    return {
      success: true,
      data: {
        manufacturer_id: result.insertId,
        message: 'Manufacturer created successfully'
      }
    };
  } catch (error) {
    console.error('Error creating manufacturer:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, error: 'Company registration number already exists' };
    }
    return { success: false, error: error.message };
  }
}

/**
 * Update manufacturer
 */
async function update(manufacturerId, manufacturerData) {
  try {
    const sql = `
      UPDATE manufacturers SET
        manufacturer_code = ?,
        company_name = ?,
        registration_number = ?,
        contact_person = ?,
        phone = ?,
        email = ?,
        address = ?,
        postcode = ?,
        city = ?,
        state = ?,
        credit_limit = ?,
        payment_terms = ?,
        status = ?,
        contract_start_date = ?,
        contract_end_date = ?,
        notes = ?,
        updated_by = ?
      WHERE manufacturer_id = ?
    `;
    
    const params = [
      manufacturerData.manufacturer_code,
      manufacturerData.company_name,
      manufacturerData.registration_number || null,
      manufacturerData.contact_person || null,
      manufacturerData.phone || null,
      manufacturerData.email || null,
      manufacturerData.address || null,
      manufacturerData.postcode || null,
      manufacturerData.city || null,
      manufacturerData.state || null,
      manufacturerData.credit_limit || 0.00,
      manufacturerData.payment_terms || 30,
      manufacturerData.status || 'active',
      manufacturerData.contract_start_date || null,
      manufacturerData.contract_end_date || null,
      manufacturerData.notes || null,
      manufacturerData.updated_by || 1,
      manufacturerId
    ];
    
    await db.query(sql, params);
    
    return { success: true, message: 'Manufacturer updated successfully' };
  } catch (error) {
    console.error('Error updating manufacturer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete manufacturer (soft delete - set status to inactive)
 */
async function deleteManufacturer(manufacturerId) {
  try {
    const sql = `UPDATE manufacturers SET status = 'inactive' WHERE manufacturer_id = ?`;
    await db.query(sql, [manufacturerId]);
    return { success: true, message: 'Manufacturer deactivated successfully' };
  } catch (error) {
    console.error('Error deleting manufacturer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Search manufacturers
 */
async function search(searchTerm) {
  try {
    const sql = `
      SELECT 
        manufacturer_id, manufacturer_code, company_name, registration_number, 
        contact_person, phone, status
      FROM manufacturers
      WHERE (company_name LIKE ? OR registration_number LIKE ? OR contact_person LIKE ?)
        AND status = 'active'
      ORDER BY company_name ASC
      LIMIT 20
    `;
    
    const term = `%${searchTerm}%`;
    const rows = await db.query(sql, [term, term, term]);
    
    return { success: true, data: rows };
  } catch (error) {
    console.error('Error searching manufacturers:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteManufacturer,
  search
};
