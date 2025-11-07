// Quick database connection test
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('Testing database connection...');
  console.log('Environment variables:');
  console.log('  DB_HOST:', process.env.DB_HOST);
  console.log('  DB_PORT:', process.env.DB_PORT);
  console.log('  DB_NAME:', process.env.DB_NAME);
  console.log('  DB_USER:', process.env.DB_USER);
  console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NOT SET');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('\n✅ Database connected successfully!');
    
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM farmers');
    console.log('✅ Query successful - Farmers count:', rows[0].count);
    
    await connection.end();
    console.log('\n🎉 Connection test passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    process.exit(1);
  }
}

testConnection();
