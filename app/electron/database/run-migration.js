/**
 * Simple migration runner
 * Run migrations manually using: node electron/database/run-migration.js
 */

const fs = require('fs');
const path = require('path');
const db = require('./connection');

async function runMigration() {
  try {
    const migrations = [
      'add_deduction_config_to_purchases.sql',
      'add_season_price_history.sql',
      'update_price_to_per_ton.sql',
      'create_paddy_products_system.sql',
      'add_product_to_sales.sql'
    ];

    for (const migrationFile of migrations) {
      const filePath = path.join(__dirname, 'migrations', migrationFile);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`📝 Running migration: ${migrationFile}`);
      console.log('SQL:', sql);
      
      // Split by semicolon and run each statement separately
      const statements = sql.split(';').filter(s => s.trim().length > 0);
      
      for (const statement of statements) {
        console.log('Running statement...');
        await db.query(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
