const db = require('../connection');
const fs = require('fs').promises;
const path = require('path');
const qrHasher = require('../../utils/qrHasher');

/**
 * Farmer Documents Service
 * CRUD operations for farmer_documents table
 * 
 * SECURITY NOTE: QR codes are NEVER stored directly.
 * Only HMAC-SHA256 hashes are stored for verification.
 */

/**
 * Get all documents for a farmer
 */
async function getByFarmerId(farmerId) {
  try {
    const sql = `
      SELECT 
        document_id,
        farmer_id,
        document_type,
        document_name,
        file_path,
        file_size,
        qr_hashcode,
        upload_date,
        notes,
        created_at
      FROM farmer_documents
      WHERE farmer_id = ?
      ORDER BY upload_date DESC
    `;
    
    const rows = await db.query(sql, [farmerId]);
    return { success: true, data: rows };
  } catch (error) {
    console.error('Error fetching farmer documents:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get subsidy card for a farmer
 */
async function getSubsidyCard(farmerId) {
  try {
    const sql = `
      SELECT 
        document_id,
        farmer_id,
        document_type,
        document_name,
        file_path,
        file_size,
        qr_hashcode,
        upload_date,
        notes
      FROM farmer_documents
      WHERE farmer_id = ? AND document_type = 'subsidy_card'
      ORDER BY upload_date DESC
      LIMIT 1
    `;
    
    const rows = await db.query(sql, [farmerId]);
    
    if (rows.length === 0) {
      return { success: false, error: 'No subsidy card found' };
    }
    
    return { success: true, data: rows[0] };
  } catch (error) {
    console.error('Error fetching subsidy card:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Search by QR code (raw code will be hashed before search)
 * @param {string} rawQrCode - The raw QR code to search for
 */
async function findByHashcode(rawQrCode) {
  try {
    if (!rawQrCode) {
      return { success: false, error: 'QR code cannot be empty' };
    }

    // Hash the raw QR code before searching
    const hashedCode = qrHasher.hash(rawQrCode);
    console.log('🔍 Searching for QR code (hashed)');
    
    const sql = `
      SELECT 
        fd.document_id,
        fd.farmer_id,
        fd.document_type,
        fd.file_path,
        fd.qr_hashcode,
        f.farmer_code,
        f.ic_number,
        f.full_name
      FROM farmer_documents fd
      JOIN farmers f ON fd.farmer_id = f.farmer_id
      WHERE fd.qr_hashcode = ?
      LIMIT 1
    `;
    
    const rows = await db.query(sql, [hashedCode]);
    
    if (rows.length === 0) {
      return { success: false, error: 'No document found with this QR code' };
    }
    
    return { success: true, data: rows[0] };
  } catch (error) {
    console.error('Error searching by QR code:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload a new document
 * @param {object} documentData - Document data (qr_hashcode will be hashed if provided)
 */
async function create(documentData) {
  try {
    // Hash the QR code if provided (never store raw QR codes)
    let hashedQrCode = null;
    if (documentData.qr_hashcode) {
      hashedQrCode = qrHasher.hash(documentData.qr_hashcode);
      console.log('🔐 QR code hashed before storage (original never stored)');
    }

    const sql = `
      INSERT INTO farmer_documents (
        farmer_id, document_type, document_name, file_path,
        file_size, qr_hashcode, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      documentData.farmer_id,
      documentData.document_type,
      documentData.document_name,
      documentData.file_path,
      documentData.file_size || null,
      hashedQrCode,
      documentData.notes || null,
      documentData.created_by || 1
    ];
    
    const result = await db.query(sql, params);
    
    return {
      success: true,
      data: {
        document_id: result.insertId,
        message: 'Document uploaded successfully (QR code securely hashed)'
      }
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update document (mainly for updating QR hashcode)
 * @param {number} documentId - Document ID to update
 * @param {object} documentData - Document data (qr_hashcode will be hashed if provided)
 */
async function update(documentId, documentData) {
  try {
    // Hash the QR code if provided (never store raw QR codes)
    let hashedQrCode = null;
    if (documentData.qr_hashcode) {
      hashedQrCode = qrHasher.hash(documentData.qr_hashcode);
      console.log('🔐 QR code hashed before update (original never stored)');
    }

    const sql = `
      UPDATE farmer_documents SET
        document_name = ?,
        qr_hashcode = ?,
        notes = ?
      WHERE document_id = ?
    `;
    
    const params = [
      documentData.document_name,
      hashedQrCode,
      documentData.notes || null,
      documentId
    ];
    
    await db.query(sql, params);
    
    return { success: true, message: 'Document updated successfully (QR code securely hashed)' };
  } catch (error) {
    console.error('Error updating document:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete document
 */
async function deleteDocument(documentId) {
  try {
    // First get the file path to delete the physical file
    const getFileSql = `SELECT file_path FROM farmer_documents WHERE document_id = ?`;
    const rows = await db.query(getFileSql, [documentId]);
    
    if (rows.length > 0 && rows[0].file_path) {
      try {
        await fs.unlink(rows[0].file_path);
      } catch (err) {
        console.warn('Could not delete file:', err.message);
      }
    }
    
    // Delete the database record
    const sql = `DELETE FROM farmer_documents WHERE document_id = ?`;
    await db.query(sql, [documentId]);
    
    return { success: true, message: 'Document deleted successfully' };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getByFarmerId,
  getSubsidyCard,
  findByHashcode,
  create,
  update,
  delete: deleteDocument
};
