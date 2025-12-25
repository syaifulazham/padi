const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const { dialog } = require('electron');

const execAsync = promisify(exec);

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function createBackup(backupDir) {
  try {
    console.log('📦 Starting MySQL backup...');
    
    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `padi_backup_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);
    
    // Get database config from environment
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '3306';
    const dbName = process.env.DB_NAME || 'paddy_collection_db';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '';
    
    console.log('📋 Backup details:', {
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
      filepath
    });
    
    // Build mysqldump command
    // Note: Using --no-tablespaces to avoid SUPER privilege requirement
    const dumpCommand = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} --no-tablespaces --single-transaction --quick --lock-tables=false ${dbName}`;
    
    // Execute mysqldump and write to file
    const { stdout, stderr } = await execAsync(dumpCommand);
    
    if (stderr && !stderr.includes('Warning')) {
      console.error('Mysqldump stderr:', stderr);
    }
    
    // Write dump to file
    await fs.writeFile(filepath, stdout, 'utf8');
    
    // Verify file was created
    const stats = await fs.stat(filepath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log('✅ Backup created successfully:', {
      filename,
      size: `${fileSizeMB} MB`,
      path: filepath
    });
    
    return {
      success: true,
      filename,
      filepath,
      size: stats.size,
      sizeFormatted: `${fileSizeMB} MB`
    };
  } catch (error) {
    console.error('❌ Backup failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to create backup'
    };
  }
}

async function restoreBackup(filepath) {
  try {
    console.log('📥 Starting MySQL restore from:', filepath);
    
    // Verify file exists
    const stats = await fs.stat(filepath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`   File size: ${fileSizeMB} MB`);
    
    // Get database config from environment
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '3306';
    const dbName = process.env.DB_NAME || 'paddy_collection_db';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '';
    
    console.log('📋 Restore details:', {
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
      fileSize: `${fileSizeMB} MB`
    });
    
    console.log('⏳ Restoring database... this may take a few moments');
    
    // Build mysql restore command with file redirection
    // Using shell redirection is more reliable than piping through stdin
    const restoreCommand = `mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} ${dbName} < "${filepath}"`;
    
    // Execute restore with shell option
    const { stdout, stderr } = await execAsync(restoreCommand, {
      shell: '/bin/bash',
      maxBuffer: 100 * 1024 * 1024 // 100MB buffer for large backups
    });
    
    if (stderr && !stderr.includes('Warning') && !stderr.includes('Using a password')) {
      console.error('⚠️  MySQL restore stderr:', stderr);
      // Don't fail on warnings, many are benign
    }
    
    if (stdout) {
      console.log('MySQL restore output:', stdout);
    }
    
    console.log('✅ Restore completed successfully');
    console.log(`   Restored ${fileSizeMB} MB from backup`);
    
    return {
      success: true,
      message: 'Database restored successfully',
      fileSize: `${fileSizeMB} MB`
    };
  } catch (error) {
    console.error('❌ Restore failed:', error);
    console.error('   Error details:', error.stack);
    return {
      success: false,
      error: error.message || 'Failed to restore backup'
    };
  }
}

async function selectBackupFile() {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Select Backup File',
      filters: [
        { name: 'SQL Backup Files', extensions: ['sql'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (result.canceled || !result.filePaths.length) {
      return { success: false, canceled: true };
    }
    
    return {
      success: true,
      filePath: result.filePaths[0]
    };
  } catch (error) {
    console.error('Error selecting backup file:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function openBackupFolder(folderPath) {
  try {
    const { shell } = require('electron');
    
    // Ensure folder exists
    await fs.mkdir(folderPath, { recursive: true });
    
    // Open folder in file explorer
    await shell.openPath(folderPath);
    
    return { success: true };
  } catch (error) {
    console.error('Error opening backup folder:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  createBackup,
  restoreBackup,
  selectBackupFile,
  openBackupFolder
};
