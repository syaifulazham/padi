/**
 * Run a single migration file
 * Usage: node electron/database/run-single-migration.js <migration-filename>
 */

const fs = require('fs');
const path = require('path');
const db = require('./connection');

async function runSingleMigration() {
  try {
    const migrationFile = process.argv[2];
    
    if (!migrationFile) {
      console.error('❌ Please specify a migration file');
      console.log('Usage: node electron/database/run-single-migration.js <migration-filename>');
      process.exit(1);
    }

    const filePath = path.join(__dirname, 'migrations', migrationFile);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`📝 Running migration: ${migrationFile}`);
    console.log('SQL:', sql);
    console.log('');
    
    // Split by semicolon and run each statement separately
    const statements = sql.split(';').filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing statement...');
        try {
          await db.query(statement);
          console.log('✅ Statement executed successfully');
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️  Column already exists, skipping...');
          } else if (error.code === 'ER_DUP_KEYNAME') {
            console.log('⚠️  Index already exists, skipping...');
          } else if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
            console.log('⚠️  Constraint already dropped, skipping...');
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('');
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  }
}

runSingleMigration();
