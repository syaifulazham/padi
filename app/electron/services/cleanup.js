const db = require('../database/connection');

async function cleanupAllData() {
  let connection;
  try {
    console.log('🧹 Starting database cleanup...');
    console.log('⚠️  WARNING: This will delete ALL data except users!');
    
    // Get connection and start transaction manually
    connection = await db.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Disable foreign key checks temporarily
      console.log('   Disabling foreign key checks...');
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
      
      // List of tables to clean (excluding users table)
      // Order matters: delete from child tables first to respect relationships
      const tablesToClean = [
        'sales_purchase_mapping',          // Child of sales_transactions and purchase_transactions
        'product_price_history',           // Child of season_product_prices
        'season_product_prices',           // Child of harvesting_seasons and paddy_products
        'season_price_history',            // Child of harvesting_seasons
        'sales_transactions',              // Child of multiple tables
        'purchase_transactions',           // Child of multiple tables
        'farmer_documents',                // Child of farmers
        'harvesting_seasons',              // Referenced by many tables
        'paddy_products',                  // Referenced by many tables
        'paddy_grades',                    // Referenced by many tables
        'manufacturers',                   // Referenced by sales
        'farmers'                          // Referenced by purchases
      ];
      
      let deletedCounts = {};
      let totalDeleted = 0;
      
      // Delete data from each table
      for (const table of tablesToClean) {
        try {
          console.log(`   Cleaning table: ${table}...`);
          const [result] = await connection.execute(`DELETE FROM ${table}`);
          deletedCounts[table] = result.affectedRows;
          totalDeleted += result.affectedRows;
          console.log(`   ✓ Deleted ${result.affectedRows} rows from ${table}`);
        } catch (tableError) {
          console.error(`   ✗ Error cleaning ${table}:`, tableError.message);
          throw new Error(`Failed to clean table ${table}: ${tableError.message}`);
        }
      }
      
      // Reset auto-increment counters
      console.log('   Resetting auto-increment counters...');
      for (const table of tablesToClean) {
        try {
          await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
        } catch (alterError) {
          // Some tables might not have auto-increment, continue
          console.log(`   Note: Could not reset auto-increment for ${table}`);
        }
      }
      
      // Re-enable foreign key checks
      console.log('   Re-enabling foreign key checks...');
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      
      // Commit transaction
      console.log('   Committing transaction...');
      await connection.commit();
      
      console.log('✅ Database cleanup completed successfully');
      console.log(`📊 Total rows deleted: ${totalDeleted}`);
      console.log('📊 Summary by table:', deletedCounts);
      
      return {
        success: true,
        message: 'All data cleaned successfully (users preserved)',
        deletedCounts,
        totalDeleted
      };
      
    } catch (txError) {
      // Rollback on error
      console.error('   Rolling back transaction...');
      await connection.rollback();
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      throw txError;
    } finally {
      // Always release connection
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    console.error('   Error details:', error.stack);
    return {
      success: false,
      error: error.message || 'Failed to clean database'
    };
  }
}

module.exports = {
  cleanupAllData
};
