const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Fix Windows DPI scaling issues for printing
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('high-dpi-support', 'true');
  app.commandLine.appendSwitch('force-device-scale-factor', '1');
}

// Load .env from multiple possible locations (for portable version)
const possibleEnvPaths = [
  // Current working directory (where user launched the exe from) - HIGHEST PRIORITY
  path.join(process.cwd(), '.env'),
  // Next to the executable (for portable version)
  path.join(path.dirname(process.execPath), '.env'),
  // In user data directory
  path.join(app.getPath('userData'), '.env'),
  // In app resources
  path.join(process.resourcesPath, '.env'),
  // Development path
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../../.env')
];

let envLoaded = false;
let loadedEnvPath = null;
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    console.log('✓ Loading .env from:', envPath);
    require('dotenv').config({ path: envPath });
    envLoaded = true;
    loadedEnvPath = envPath;
    break;
  }
}

if (!envLoaded) {
  console.error('⚠ Warning: .env file not found in any location');
  console.error('  Searched paths:', possibleEnvPaths);
  loadedEnvPath = 'NOT FOUND - Using defaults';
  // Set defaults
  process.env.QR_HASH_SECRET = process.env.QR_HASH_SECRET || 'f6062c05ab1559acdd77be781745b1845d8cc23bddf583c99ce6f5e40e6790b1';
  process.env.DB_HOST = process.env.DB_HOST || 'localhost';
  process.env.DB_PORT = process.env.DB_PORT || '3306';
  process.env.DB_NAME = process.env.DB_NAME || 'paddy_collection_db';
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
}

// Store for error reporting
global.envConfig = {
  loadedPath: loadedEnvPath,
  searchedPaths: possibleEnvPaths,
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT,
  dbUser: process.env.DB_USER || 'NOT SET',
  dbName: process.env.DB_NAME,
  hasPassword: !!process.env.DB_PASSWORD
};

// Import services
const db = require('./database/connection');
const farmerService = require('./database/queries/farmers');
const farmerDocumentsService = require('./database/queries/farmerDocuments');
const manufacturerService = require('./database/queries/manufacturers');
const productService = require('./database/queries/products');
const seasonProductPriceService = require('./database/queries/seasonProductPrices');
const purchaseService = require('./database/queries/purchases');
const salesService = require('./database/queries/sales');
const stockpilesService = require('./database/queries/stockpiles');
const seasonService = require('./database/queries/seasons');
const seasonPriceService = require('./database/queries/seasonPriceHistory');
const userService = require('./database/queries/users');
const weighbridgeService = require('./hardware/weighbridge');
const settingsService = require('./services/settings');
const backupService = require('./services/backup');
const cleanupService = require('./services/cleanup');
const { generatePurchaseReceipt, generateSalesReceipt } = require('./utils/receiptTemplate');

let mainWindow;
let dbConnectionFailed = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../icons/sparrow.png'),
    title: 'Paddy Collection Center'
  });

  // Load React app (development or production)
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  console.log('🚀 Starting Electron...');
  console.log('   Environment:', process.env.NODE_ENV);
  console.log('   Is Development:', isDev);
  console.log('   Is Packaged:', app.isPackaged);
  
  if (isDev) {
    console.log('   Loading from: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
    
    // Add more detailed logging
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('✅ Page loaded successfully');
    });
    
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('❌ Page failed to load:', errorCode, errorDescription);
    });
    
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log(`Console [${level}]:`, message);
    });
  } else {
    const indexPath = path.join(__dirname, '../build/index.html');
    console.log('   Loading from:', indexPath);
    console.log('   __dirname:', __dirname);
    console.log('   Resolved path:', path.resolve(__dirname, '../build/index.html'));
    
    // Check if file exists
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
      console.log('   ✅ index.html exists');
    } else {
      console.error('   ❌ index.html NOT FOUND at:', indexPath);
    }
    
    mainWindow.loadFile(indexPath);
    
    // Open DevTools in production to see errors
    mainWindow.webContents.openDevTools();
    
    // Log page load events
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('✅ Production page loaded successfully');
    });
    
    // Log console messages from renderer
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log(`[RENDERER ${level}]:`, message);
      if (level === 2) { // 2 = error
        console.error('Renderer Error at', sourceId, 'line', line);
      }
    });
  }

  // Log any loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  
  // Check database connection after window loads
  setTimeout(() => {
    const dbStatus = db.getConnectionStatus();
    if (!dbStatus.connected && dbStatus.error) {
      dbConnectionFailed = true;
      const errorLines = [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'DATABASE CONNECTION FAILED',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '❌ ERROR: ' + dbStatus.error.message,
        '',
        '📁 CONFIGURATION DETAILS:',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        `.env File Loaded From: ${global.envConfig.loadedPath}`,
        '',
        'Database Settings Used:',
        `  • Host: ${global.envConfig.dbHost}`,
        `  • Port: ${global.envConfig.dbPort}`,
        `  • User: ${global.envConfig.dbUser}`,
        `  • Database: ${global.envConfig.dbName}`,
        `  • Password: ${global.envConfig.hasPassword ? 'SET (hidden)' : 'NOT SET ❌'}`,
        '',
        '📍 SEARCHED FOR .env IN:',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      ];
      
      global.envConfig.searchedPaths.forEach((p, i) => {
        const isLoaded = p === global.envConfig.loadedPath;
        errorLines.push(`  ${i + 1}. ${p} ${isLoaded ? '✓ LOADED' : ''}`);
      });
      
      errorLines.push('');
      errorLines.push('🔧 TROUBLESHOOTING:');
      errorLines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      errorLines.push('1. Create .env file next to the .exe if not found');
      errorLines.push('2. Verify MySQL is running (check Windows Services)');
      errorLines.push('3. Check DB_USER in .env matches MySQL user');
      errorLines.push('4. Verify DB_PASSWORD is correct');
      errorLines.push('5. Ensure database exists: ' + global.envConfig.dbName);
      
      const errorMessage = errorLines.join('\n');
      
      // Store error details for UI
      global.envConfig.error = dbStatus.error.message;
      
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Database connection failed with details:');
      console.error('Error:', dbStatus.error);
      console.error('Config:', global.envConfig);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Will show database setup page in UI');
    }
  }, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup on quit
app.on('before-quit', async () => {
  try {
    await db.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
});

// ===========================================
// IPC Handlers - Database Operations
// ===========================================

// Test database connection
ipcMain.handle('db:test', async () => {
  try {
    const [rows] = await db.query('SELECT 1 as result');
    return { success: true, message: 'Database connected' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Get current database configuration
ipcMain.handle('db:getConfig', async () => {
  return global.envConfig;
});

// Test database connection with provided credentials
ipcMain.handle('db:testConnection', async (event, config) => {
  const mysql = require('mysql2/promise');
  
  try {
    const connection = await mysql.createConnection({
      host: config.host.trim(),
      port: parseInt(config.port),
      user: config.user.trim(),
      password: config.password.trim(),
      database: config.database.trim()
    });
    
    await connection.query('SELECT 1');
    await connection.end();
    
    return { 
      success: true, 
      message: 'Connection successful! All credentials are valid.' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: error.message 
    };
  }
});

// Save database configuration to .env file
ipcMain.handle('db:saveConfig', async (event, config) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Determine where to save .env
    let envPath;
    if (app.isPackaged) {
      // For packaged app, save next to executable
      envPath = path.join(path.dirname(process.execPath), '.env');
    } else {
      // For dev, save in app root
      envPath = path.join(__dirname, '../.env');
    }
    
    // Read existing .env or create template
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add DB configuration
    const updateEnvVar = (content, key, value) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${value}`);
      } else {
        return content + `\n${key}=${value}`;
      }
    };
    
    envContent = updateEnvVar(envContent, 'DB_HOST', config.host.trim());
    envContent = updateEnvVar(envContent, 'DB_PORT', config.port);
    envContent = updateEnvVar(envContent, 'DB_USER', config.user.trim());
    envContent = updateEnvVar(envContent, 'DB_PASSWORD', config.password.trim());
    envContent = updateEnvVar(envContent, 'DB_NAME', config.database.trim());
    
    // Ensure QR_HASH_SECRET exists
    if (!envContent.includes('QR_HASH_SECRET=')) {
      envContent = updateEnvVar(envContent, 'QR_HASH_SECRET', 
        process.env.QR_HASH_SECRET || 'f6062c05ab1559acdd77be781745b1845d8cc23bddf583c99ce6f5e40e6790b1');
    }
    
    // Write .env file
    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
    
    // Update process.env
    process.env.DB_HOST = config.host.trim();
    process.env.DB_PORT = config.port;
    process.env.DB_USER = config.user.trim();
    process.env.DB_PASSWORD = config.password.trim();
    process.env.DB_NAME = config.database.trim();
    
    // Update global config
    global.envConfig.dbHost = config.host.trim();
    global.envConfig.dbPort = config.port;
    global.envConfig.dbUser = config.user.trim();
    global.envConfig.dbName = config.database.trim();
    global.envConfig.hasPassword = !!config.password.trim();
    global.envConfig.loadedPath = envPath;
    
    console.log('✅ Configuration saved to:', envPath);
    
    // Try to reconnect
    try {
      const connection = await db.pool.getConnection();
      connection.release();
      dbConnectionFailed = false;
      console.log('✅ Database reconnected successfully');
    } catch (err) {
      console.error('❌ Failed to reconnect:', err.message);
    }
    
    return { 
      success: true, 
      message: 'Configuration saved successfully',
      envPath 
    };
  } catch (error) {
    console.error('❌ Error saving configuration:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// Get current database connection status
ipcMain.handle('db:getConnectionStatus', async () => {
  const status = db.getConnectionStatus();
  return {
    connected: status.connected,
    error: status.error ? status.error.message : null
  };
});

// Authentication
ipcMain.handle('auth:hasUsers', async () => {
  return await userService.hasUsers();
});

ipcMain.handle('auth:login', async (event, username, password) => {
  return await userService.authenticate(username, password);
});

ipcMain.handle('users:getById', async (event, userId) => {
  return await userService.getById(userId);
});

ipcMain.handle('users:getAll', async () => {
  return await userService.getAll();
});

ipcMain.handle('users:create', async (event, userData) => {
  return await userService.create(userData);
});

ipcMain.handle('users:update', async (event, userId, userData) => {
  return await userService.update(userId, userData);
});

ipcMain.handle('users:delete', async (event, userId) => {
  return await userService.delete(userId);
});

ipcMain.handle('users:changePassword', async (event, userId, oldPassword, newPassword) => {
  return await userService.changePassword(userId, oldPassword, newPassword);
});

// Farmers
ipcMain.handle('farmers:getAll', async () => {
  return await farmerService.getAll();
});

ipcMain.handle('farmers:getById', async (event, id) => {
  return await farmerService.getById(id);
});

ipcMain.handle('farmers:create', async (event, data) => {
  return await farmerService.create(data);
});

ipcMain.handle('farmers:update', async (event, id, data) => {
  return await farmerService.update(id, data);
});

ipcMain.handle('farmers:delete', async (event, id) => {
  return await farmerService.delete(id);
});

ipcMain.handle('farmers:search', async (event, query) => {
  return await farmerService.search(query);
});

// Farmer Documents
ipcMain.handle('farmerDocuments:getByFarmerId', async (event, farmerId) => {
  return await farmerDocumentsService.getByFarmerId(farmerId);
});

ipcMain.handle('farmerDocuments:getSubsidyCard', async (event, farmerId) => {
  return await farmerDocumentsService.getSubsidyCard(farmerId);
});

ipcMain.handle('farmerDocuments:findByHashcode', async (event, hashcode) => {
  return await farmerDocumentsService.findByHashcode(hashcode);
});

ipcMain.handle('farmerDocuments:create', async (event, data) => {
  return await farmerDocumentsService.create(data);
});

ipcMain.handle('farmerDocuments:update', async (event, id, data) => {
  return await farmerDocumentsService.update(id, data);
});

ipcMain.handle('farmerDocuments:delete', async (event, id) => {
  return await farmerDocumentsService.delete(id);
});

// File upload handler for subsidy card images
ipcMain.handle('farmerDocuments:uploadImage', async (event, farmerId, imageData) => {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(app.getPath('userData'), 'uploads', 'subsidy_cards');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Generate filename: farmerId_timestamp.png
    const timestamp = Date.now();
    const filename = `${farmerId}_${timestamp}.png`;
    const filePath = path.join(uploadsDir, filename);
    
    // Convert base64 to buffer and save
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    await fs.writeFile(filePath, buffer);
    
    // Get file size
    const stats = await fs.stat(filePath);
    
    return {
      success: true,
      data: {
        filePath: filePath,
        fileName: filename,
        fileSize: stats.size
      }
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: error.message };
  }
});

// Get image as base64 for display
ipcMain.handle('farmerDocuments:getImage', async (event, filePath) => {
  const fs = require('fs').promises;
  
  try {
    const buffer = await fs.readFile(filePath);
    const base64 = buffer.toString('base64');
    return {
      success: true,
      data: `data:image/png;base64,${base64}`
    };
  } catch (error) {
    console.error('Error reading image:', error);
    return { success: false, error: error.message };
  }
});

// Manufacturers
ipcMain.handle('manufacturers:getAll', async () => {
  return await manufacturerService.getAll();
});

ipcMain.handle('manufacturers:getById', async (event, id) => {
  return await manufacturerService.getById(id);
});

ipcMain.handle('manufacturers:create', async (event, data) => {
  return await manufacturerService.create(data);
});

ipcMain.handle('manufacturers:update', async (event, id, data) => {
  return await manufacturerService.update(id, data);
});

ipcMain.handle('manufacturers:delete', async (event, id) => {
  return await manufacturerService.delete(id);
});

ipcMain.handle('manufacturers:search', async (event, query) => {
  return await manufacturerService.search(query);
});

// Paddy Products
ipcMain.handle('products:getAll', async () => {
  return await productService.getAll();
});

ipcMain.handle('products:getActive', async () => {
  return await productService.getActive();
});

ipcMain.handle('products:getById', async (event, id) => {
  return await productService.getById(id);
});

ipcMain.handle('products:create', async (event, data) => {
  return await productService.create(data);
});

ipcMain.handle('products:update', async (event, id, data) => {
  return await productService.update(id, data);
});

ipcMain.handle('products:delete', async (event, id) => {
  return await productService.delete(id);
});

ipcMain.handle('products:getInventorySummary', async (event, seasonId) => {
  return await productService.getInventorySummary(seasonId);
});

// Season Product Prices
ipcMain.handle('seasonProductPrices:getSeasonProductPrices', async (event, seasonId) => {
  return await seasonProductPriceService.getSeasonProductPrices(seasonId);
});

ipcMain.handle('seasonProductPrices:getProductPrice', async (event, seasonId, productId) => {
  return await seasonProductPriceService.getProductPrice(seasonId, productId);
});

ipcMain.handle('seasonProductPrices:initializeSeasonPrices', async (event, seasonId, productPrices) => {
  return await seasonProductPriceService.initializeSeasonPrices(seasonId, productPrices);
});

ipcMain.handle('seasonProductPrices:updateProductPrice', async (event, seasonId, productId, pricePerTon, notes, createdBy) => {
  return await seasonProductPriceService.updateProductPrice(seasonId, productId, pricePerTon, notes, createdBy);
});

ipcMain.handle('seasonProductPrices:getPriceHistory', async (event, seasonId, productId) => {
  return await seasonProductPriceService.getPriceHistory(seasonId, productId);
});

ipcMain.handle('seasonProductPrices:copyPricesFromSeason', async (event, targetSeasonId, sourceSeasonId, createdBy) => {
  return await seasonProductPriceService.copyPricesFromSeason(targetSeasonId, sourceSeasonId, createdBy);
});

// Purchases
ipcMain.handle('purchases:create', async (event, data) => {
  return await purchaseService.create(data);
});

ipcMain.handle('purchases:getAll', async (event, filters) => {
  return await purchaseService.getAll(filters);
});

ipcMain.handle('purchases:getById', async (event, id) => {
  return await purchaseService.getById(id);
});

ipcMain.handle('purchases:getByReceipt', async (event, receiptNumber) => {
  return await purchaseService.getByReceipt(receiptNumber);
});

ipcMain.handle('purchases:getUnsold', async (event, seasonId) => {
  return await purchaseService.getUnsold(seasonId);
});

ipcMain.handle('purchases:createSplit', async (event, parentTransactionId, splitWeightKg, userId) => {
  return await purchaseService.createSplit(parentTransactionId, splitWeightKg, userId);
});

ipcMain.handle('purchases:getTotalStats', async (event, seasonId) => {
  return await purchaseService.getTotalStats(seasonId);
});

ipcMain.handle('purchases:updatePayment', async (event, updateData) => {
  return await purchaseService.updatePayment(updateData);
});

ipcMain.handle('purchases:cancelPendingLorry', async (event, sessionData, userId, reason) => {
  return await purchaseService.cancelPendingLorry(sessionData, userId, reason);
});

ipcMain.handle('purchases:getSplitChildren', async (event, parentTransactionId) => {
  return await purchaseService.getSplitChildren(parentTransactionId);
});

// Sales
ipcMain.handle('sales:create', async (event, data) => {
  return await salesService.create(data);
});

ipcMain.handle('sales:getAll', async (event, filters) => {
  return await salesService.getAll(filters);
});

ipcMain.handle('sales:getById', async (event, id) => {
  return await salesService.getById(id);
});

ipcMain.handle('sales:getBySalesNumber', async (event, salesNumber) => {
  return await salesService.getBySalesNumber(salesNumber);
});

ipcMain.handle('sales:getTotalStats', async (event, seasonId) => {
  return await salesService.getTotalStats(seasonId);
});

// Stockpiles
ipcMain.handle('stockpiles:getSummary', async (event, seasonId) => {
  return await stockpilesService.getStockpileSummary(seasonId);
});

ipcMain.handle('stockpiles:getProductMovements', async (event, seasonId, productId, filters) => {
  return await stockpilesService.getProductMovements(seasonId, productId, filters);
});

ipcMain.handle('stockpiles:getStats', async (event, seasonId) => {
  return await stockpilesService.getStockpileStats(seasonId);
});

ipcMain.handle('stockpiles:getLowStockAlerts', async (event, seasonId, thresholdKg) => {
  return await stockpilesService.getLowStockAlerts(seasonId, thresholdKg);
});

// Seasons
ipcMain.handle('seasons:getAll', async (event, filters) => {
  return await seasonService.getAll(filters);
});

ipcMain.handle('seasons:getById', async (event, id) => {
  return await seasonService.getById(id);
});

ipcMain.handle('seasons:create', async (event, data) => {
  return await seasonService.create(data);
});

ipcMain.handle('seasons:update', async (event, id, data) => {
  return await seasonService.update(id, data);
});

ipcMain.handle('seasons:getActive', async (event) => {
  return await seasonService.getActive();
});

ipcMain.handle('seasons:getSeasonTypes', async (event) => {
  return await seasonService.getSeasonTypes();
});

// Season Price History
ipcMain.handle('seasonPrice:getCurrent', async (event, seasonId) => {
  return await seasonPriceService.getCurrentPrice(seasonId);
});

ipcMain.handle('seasonPrice:update', async (event, seasonId, pricePerTon, notes, createdBy) => {
  return await seasonPriceService.updatePrice(seasonId, pricePerTon, notes, createdBy);
});

ipcMain.handle('seasonPrice:getHistory', async (event, seasonId) => {
  return await seasonPriceService.getHistory(seasonId);
});

ipcMain.handle('seasonPrice:initialize', async (event, seasonId, pricePerTon, notes, createdBy) => {
  return await seasonPriceService.initializePrice(seasonId, pricePerTon, notes, createdBy);
});

// Weighbridge
ipcMain.handle('weighbridge:read', async () => {
  try {
    const weight = await weighbridgeService.readWeight();
    return { success: true, weight };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('weighbridge:connect', async () => {
  return await weighbridgeService.connect();
});

ipcMain.handle('weighbridge:disconnect', async () => {
  return await weighbridgeService.disconnect();
});

// Settings
ipcMain.handle('settings:getAll', async () => {
  return await settingsService.getAll();
});

ipcMain.handle('settings:save', async (event, data) => {
  return await settingsService.save(data);
});

ipcMain.handle('settings:getCompanyDetails', async () => {
  return await settingsService.getCompanyDetails();
});

ipcMain.handle('settings:get', async (event, key) => {
  return await settingsService.get(key);
});

ipcMain.handle('settings:set', async (event, key, value) => {
  return await settingsService.set(key, value);
});

ipcMain.handle('settings:reset', async () => {
  return await settingsService.reset();
});

// System Info
ipcMain.handle('system:getInfo', async () => {
  return await settingsService.getSystemInfo();
});

// Folder selection dialog
ipcMain.handle('settings:selectFolder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select PDF Save Location',
      buttonLabel: 'Select Folder'
    });
    
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    
    return { 
      success: true, 
      path: result.filePaths[0] 
    };
  } catch (error) {
    console.error('Error selecting folder:', error);
    return { success: false, error: error.message };
  }
});

// Backup & Restore
ipcMain.handle('backup:create', async (event, backupPath) => {
  return await backupService.createBackup(backupPath);
});

ipcMain.handle('backup:restore', async (event, filepath) => {
  return await backupService.restoreBackup(filepath);
});

ipcMain.handle('backup:selectFile', async () => {
  return await backupService.selectBackupFile();
});

ipcMain.handle('backup:openFolder', async (event, folderPath) => {
  return await backupService.openBackupFolder(folderPath);
});

// Database Cleanup
ipcMain.handle('database:cleanup', async () => {
  return await cleanupService.cleanupAllData();
});

// ===========================================
// Receipt Printing
// ===========================================

ipcMain.handle('print:purchaseReceipt', async (event, transactionId, options = {}) => {
  try {
    console.log('🖨️  Printing receipt for transaction:', transactionId, options);
    
    // Check print settings
    const defaultPrinterResult = await settingsService.get('default_printer');
    const defaultPrinter = defaultPrinterResult?.data || null;
    const printToPdfResult = await settingsService.get('print_to_pdf');
    const printToPdf = printToPdfResult?.data || false;
    const pdfSavePathResult = await settingsService.get('pdf_save_path');
    const pdfSavePath = pdfSavePathResult?.data || null;
    const pdfAutoOpenResult = await settingsService.get('pdf_auto_open');
    const pdfAutoOpen = pdfAutoOpenResult?.data || false;
    const paperSizeResult = await settingsService.get('paper_size');
    let paperSize = paperSizeResult?.data || '80mm';
    
    // Validate paper size
    const validSizes = ['80mm', 'a4_portrait', 'a5_landscape'];
    if (!validSizes.includes(paperSize)) {
      console.warn(`⚠️  Invalid paper size "${paperSize}", defaulting to "80mm"`);
      paperSize = '80mm';
    }
    
    console.log('📋 Print Settings Retrieved:', {
      defaultPrinter,
      printToPdf,
      pdfSavePath,
      pdfAutoOpen,
      paperSize,
      paperSizeRaw: paperSizeResult,
      forcePrint: options.forcePrint
    });
    
    // Check if configured printer exists
    let printerAvailable = false;
    if (defaultPrinter) {
      const printers = await mainWindow.webContents.getPrintersAsync();
      console.log(`🖨️  System printers (${printers.length}):`, printers.map(p => ({name: p.name, isDefault: p.isDefault})));
      printerAvailable = printers.some(p => p.name === defaultPrinter);
      console.log(`🔍 Printer "${defaultPrinter}" available:`, printerAvailable);
      if (!printerAvailable) {
        console.warn(`⚠️  Configured printer "${defaultPrinter}" not found`);
      }
    } else {
      console.warn('⚠️  No default printer configured in settings');
    }
    
    // Decide: Print to PDF if explicitly enabled OR if no printer configured/available
    // BUT if forcePrint is true (e.g., for reprints), try to print to physical printer
    const shouldPrintToPdf = options.forcePrint 
      ? (!defaultPrinter || !printerAvailable)  // Only PDF if no printer available
      : (printToPdf || !defaultPrinter || !printerAvailable);  // Respect print_to_pdf setting
    
    console.log(`💡 Decision: shouldPrintToPdf = ${shouldPrintToPdf}`, {
      reason: shouldPrintToPdf 
        ? (options.forcePrint ? 'no_printer' : (printToPdf ? 'pdf_enabled' : (!defaultPrinter ? 'no_printer_configured' : 'printer_not_found')))
        : 'print_to_physical_printer'
    });
    
    // Fetch transaction details
    const transactionResult = await purchaseService.getById(transactionId);
    if (!transactionResult.success || !transactionResult.data) {
      return { success: false, error: 'Transaction not found' };
    }
    
    const transaction = transactionResult.data;
    
    // Debug: Log transaction to verify receipt_number
    if (!transaction.receipt_number) {
      console.warn('⚠️ WARNING: receipt_number is undefined for transaction ID:', transactionId);
      console.warn('   Transaction keys:', Object.keys(transaction));
      console.warn('   Transaction data:', JSON.stringify(transaction, null, 2));
    }
    
    // Fetch farmer details
    const farmerResult = await farmerService.getById(transaction.farmer_id);
    if (!farmerResult.success || !farmerResult.data) {
      return { success: false, error: 'Farmer not found' };
    }
    
    const farmer = farmerResult.data;
    
    // Fetch season details
    const seasonResult = await seasonService.getById(transaction.season_id);
    const season = seasonResult?.data || {};
    
    // Fetch company details
    const companyResult = await settingsService.getCompanyDetails();
    const companyDetails = companyResult?.data || {};
    
    // Generate receipt HTML with paper size
    console.log(`📄 Generating receipt HTML with paper size: "${paperSize}"`);
    const receiptHTML = generatePurchaseReceipt(transaction, farmer, season, companyDetails, paperSize);
    console.log(`✅ Receipt HTML generated (${receiptHTML.length} chars)`);
    
    // Create hidden window for printing/PDF - larger size for A4/A5
    const printWindow = new BrowserWindow({
      width: 1200,
      height: 1600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        zoomFactor: 1.0
      }
    });
    
    // Load the receipt HTML
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(receiptHTML)}`);
    
    // Small delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (shouldPrintToPdf) {
      // Save as PDF
      const fs = require('fs');
      const pathModule = require('path');
      
      // Determine PDF path - use configured path or default to desktop
      let finalPdfPath = pdfSavePath;
      if (!finalPdfPath) {
        const { app } = require('electron');
        finalPdfPath = pathModule.join(app.getPath('desktop'), 'Receipts');
        console.log('📁 No PDF path configured, using default:', finalPdfPath);
      }
      
      // Ensure directory exists
      if (!fs.existsSync(finalPdfPath)) {
        fs.mkdirSync(finalPdfPath, { recursive: true });
      }
      
      // Generate filename
      const filename = `Receipt_${transaction.receipt_number}_${Date.now()}.pdf`;
      const pdfPath = pathModule.join(finalPdfPath, filename);
      
      // Get page size based on paper size setting
      // Use explicit dimensions to avoid rotation issues
      let pdfOptions;
      
      if (paperSize === 'a4_portrait') {
        pdfOptions = {
          pageSize: 'A4',
          landscape: false,
          printBackground: true,
          margin: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }
        };
      } else if (paperSize === 'a5_landscape') {
        // Use explicit landscape dimensions without landscape flag
        // CSS defines 210mm x 148mm, PDF must match without rotation
        pdfOptions = {
          pageSize: {
            width: 595.28,   // 210mm in points
            height: 419.53   // 148mm in points
          },
          printBackground: true,
          margin: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }
        };
      } else {
        // For 80mm thermal, use custom size with proper dimensions
        // 80mm = 226.77 points, 297mm = 841.89 points (1 inch = 72 points, 1mm = 2.834645 points)
        pdfOptions = {
          pageSize: {
            width: 226.77,  // 80mm in points
            height: 841.89  // 297mm (A4 height) in points
          },
          printBackground: true,
          margin: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }
        };
      }
      
      // Generate PDF
      const pdfData = await printWindow.webContents.printToPDF(pdfOptions);
      
      // Save to file
      fs.writeFileSync(pdfPath, pdfData);
      
      printWindow.close();
      
      console.log('✅ Receipt saved as PDF:', pdfPath);
      
      // Auto-open if enabled
      if (pdfAutoOpen) {
        const { shell } = require('electron');
        shell.openPath(pdfPath);
      }
      
      const reason = printToPdf ? 'configured' : (!defaultPrinter ? 'no_printer_set' : 'printer_not_found');
      
      return { 
        success: true, 
        mode: 'pdf',
        path: pdfPath,
        filename: filename,
        reason: reason
      };
      
    } else {
      // Print to configured physical printer
      console.log(`🖨️  Printing to configured printer: ${defaultPrinter}`);
      
      // Use microns for print API (1mm = 1000 microns)
      // Note: Windows ignores landscape flag, use explicit dimensions instead
      const pageSizes = {
        '80mm': { width: 80000, height: 297000, landscape: false },    // 80mm x 297mm
        'a4_portrait': { width: 210000, height: 297000, landscape: false },  // A4 portrait
        'a5_landscape': { width: 210000, height: 148000, landscape: false }   // A5 landscape (210x148mm)
      };
      const pageSize = pageSizes[paperSize] || pageSizes['80mm'];
      
      // Check if user wants to use print dialog - await the promise
      const usePrintDialogResult = await settingsService.get('use_print_dialog');
      const usePrintDialog = usePrintDialogResult?.data || false;
      
      const printOptions = {
        silent: !usePrintDialog, // Show dialog if setting is enabled
        printBackground: true,
        color: false,
        // deviceName: defaultPrinter, // Removed - causes Windows to ignore all settings
        scaleFactor: 100, // Prevent auto-scaling (100 = 100%)
        preferCSSPageSize: true, // Respect CSS @page size
        margins: {
          marginType: 'none'
        },
        pageSize: {
          width: pageSize.width,
          height: pageSize.height
        },
        landscape: pageSize.landscape
      };
      
      console.log('🖨️  Print options:', { ...printOptions, usePrintDialog });
      
      // Print using promise wrapper
      return new Promise((resolve) => {
        printWindow.webContents.print(printOptions, (success, errorType) => {
          printWindow.close();
          if (!success) {
            console.error('❌ Print failed:', errorType);
            resolve({ 
              success: false, 
              mode: 'print',
              error: `Print failed: ${errorType}` 
            });
          } else {
            console.log(`✅ Receipt sent to printer: ${defaultPrinter}`);
            resolve({ success: true, mode: 'print' });
          }
        });
      });
    }
    
  } catch (error) {
    console.error('Error printing receipt:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('print:salesReceipt', async (event, salesId, options = {}) => {
  try {
    console.log('🖨️  Printing sales receipt for sales ID:', salesId, options);
    
    // Check print settings
    const defaultPrinterResult = await settingsService.get('default_printer');
    const defaultPrinter = defaultPrinterResult?.data || null;
    const printToPdfResult = await settingsService.get('print_to_pdf');
    const printToPdf = printToPdfResult?.data || false;
    const pdfSavePathResult = await settingsService.get('pdf_save_path');
    const pdfSavePath = pdfSavePathResult?.data || null;
    const pdfAutoOpenResult = await settingsService.get('pdf_auto_open');
    const pdfAutoOpen = pdfAutoOpenResult?.data || false;
    const paperSizeResult = await settingsService.get('paper_size');
    let paperSize = paperSizeResult?.data || '80mm';
    
    // Validate paper size
    const validSizes = ['80mm', 'a4_portrait', 'a5_landscape'];
    if (!validSizes.includes(paperSize)) {
      console.warn(`⚠️  Invalid paper size "${paperSize}", defaulting to "80mm"`);
      paperSize = '80mm';
    }
    
    console.log('📋 Print Settings Retrieved (Sales):', {
      defaultPrinter,
      printToPdf,
      pdfSavePath,
      pdfAutoOpen,
      paperSize,
      paperSizeRaw: paperSizeResult,
      forcePrint: options.forcePrint
    });
    
    // Check if configured printer exists
    let printerAvailable = false;
    if (defaultPrinter) {
      const printers = await mainWindow.webContents.getPrintersAsync();
      console.log(`🖨️  System printers (${printers.length}):`, printers.map(p => ({name: p.name, isDefault: p.isDefault})));
      printerAvailable = printers.some(p => p.name === defaultPrinter);
      console.log(`🔍 Printer "${defaultPrinter}" available:`, printerAvailable);
      if (!printerAvailable) {
        console.warn(`⚠️  Configured printer "${defaultPrinter}" not found`);
      }
    } else {
      console.warn('⚠️  No default printer configured in settings');
    }
    
    // Decide: Print to PDF if explicitly enabled OR if no printer configured/available
    // BUT if forcePrint is true (e.g., for reprints), try to print to physical printer
    const shouldPrintToPdf = options.forcePrint 
      ? (!defaultPrinter || !printerAvailable)  // Only PDF if no printer available
      : (printToPdf || !defaultPrinter || !printerAvailable);  // Respect print_to_pdf setting
    
    console.log(`💡 Decision: shouldPrintToPdf = ${shouldPrintToPdf}`, {
      reason: shouldPrintToPdf 
        ? (options.forcePrint ? 'no_printer' : (printToPdf ? 'pdf_enabled' : (!defaultPrinter ? 'no_printer_configured' : 'printer_not_found')))
        : 'print_to_physical_printer'
    });
    
    // Fetch sales transaction details with purchase receipts
    const salesResult = await salesService.getById(salesId);
    if (!salesResult.success || !salesResult.data) {
      return { success: false, error: 'Sales transaction not found' };
    }
    
    const salesTransaction = salesResult.data;
    
    console.log('📋 Sales transaction data received:');
    console.log('   - sales_id:', salesTransaction.sales_id);
    console.log('   - sales_number:', salesTransaction.sales_number);
    console.log('   - season_id:', salesTransaction.season_id);
    console.log('   - season_name:', salesTransaction.season_name);
    console.log('   - gross_weight_kg:', salesTransaction.gross_weight_kg);
    console.log('   - tare_weight_kg:', salesTransaction.tare_weight_kg);
    console.log('   - net_weight_kg:', salesTransaction.net_weight_kg);
    console.log('   - sale_price_per_kg:', salesTransaction.sale_price_per_kg);
    console.log('   - total_amount:', salesTransaction.total_amount);
    console.log('   - sale_date:', salesTransaction.sale_date);
    console.log('   - vehicle_number:', salesTransaction.vehicle_number);
    
    // Debug: Log sales transaction to verify sales_number
    if (!salesTransaction.sales_number) {
      console.warn('⚠️ WARNING: sales_number is undefined for sales ID:', salesId);
      console.warn('   Sales transaction keys:', Object.keys(salesTransaction));
      console.warn('   Sales transaction data:', JSON.stringify(salesTransaction, null, 2));
    }
    
    // Fetch season details
    let season = {};
    if (salesTransaction.season_id) {
      const seasonResult = await seasonService.getById(salesTransaction.season_id);
      season = seasonResult?.data || {};
    } else {
      console.warn('⚠️ WARNING: season_id is undefined for sales ID:', salesId);
      console.warn('   Using fallback season name from join:', salesTransaction.season_name);
      // Use season info from the join if available
      season = {
        season_name: salesTransaction.season_name || 'Unknown Season',
        year: salesTransaction.season_year || new Date().getFullYear()
      };
    }
    
    // Fetch company details
    const companyResult = await settingsService.getCompanyDetails();
    const companyDetails = companyResult?.data || {};
    
    // Generate sales receipt HTML with paper size
    const receiptHTML = generateSalesReceipt(salesTransaction, season, companyDetails, paperSize);
    
    // Create hidden window for printing/PDF - larger size for A4/A5
    const printWindow = new BrowserWindow({
      width: 1200,
      height: 1600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        zoomFactor: 1.0
      }
    });
    
    // Load the receipt HTML
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(receiptHTML)}`);
    
    // Small delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (shouldPrintToPdf) {
      // Save as PDF
      const fs = require('fs');
      const pathModule = require('path');
      
      // Determine PDF path - use configured path or default to desktop
      let finalPdfPath = pdfSavePath;
      if (!finalPdfPath) {
        const { app } = require('electron');
        finalPdfPath = pathModule.join(app.getPath('desktop'), 'Receipts');
        console.log('📁 No PDF path configured, using default:', finalPdfPath);
      }
      
      // Ensure directory exists
      if (!fs.existsSync(finalPdfPath)) {
        fs.mkdirSync(finalPdfPath, { recursive: true });
      }
      
      // Generate filename
      const salesNum = salesTransaction.sales_number || `ID${salesId}`;
      const filename = `SalesReceipt_${salesNum}_${Date.now()}.pdf`;
      const pdfPath = pathModule.join(finalPdfPath, filename);
      
      // Get page size based on paper size setting
      let pdfOptions;
      
      if (paperSize === 'a4_portrait') {
        pdfOptions = {
          pageSize: 'A4',
          landscape: false,
          printBackground: true,
          margin: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }
        };
      } else if (paperSize === 'a5_landscape') {
        // Use explicit landscape dimensions without landscape flag
        // CSS defines 210mm x 148mm, PDF must match without rotation
        pdfOptions = {
          pageSize: {
            width: 595.28,   // 210mm in points
            height: 419.53   // 148mm in points
          },
          printBackground: true,
          margin: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }
        };
      } else {
        // For 80mm thermal
        pdfOptions = {
          pageSize: {
            width: 226.77,  // 80mm in points
            height: 841.89  // 297mm (A4 height) in points
          },
          printBackground: true,
          margin: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }
        };
      }
      
      // Generate PDF
      const pdfData = await printWindow.webContents.printToPDF(pdfOptions);
      
      // Save to file
      fs.writeFileSync(pdfPath, pdfData);
      
      printWindow.close();
      
      console.log('✅ Sales receipt saved as PDF:', pdfPath);
      
      // Auto-open if enabled
      if (pdfAutoOpen) {
        const { shell } = require('electron');
        shell.openPath(pdfPath);
      }
      
      const reason = printToPdf ? 'configured' : (!defaultPrinter ? 'no_printer_set' : 'printer_not_found');
      
      return { 
        success: true, 
        mode: 'pdf',
        path: pdfPath,
        filename: filename,
        reason: reason
      };
      
    } else {
      // Print to configured physical printer
      console.log(`🖨️  Printing to configured printer: ${defaultPrinter}`);
      
      // Note: Windows ignores landscape flag, use explicit dimensions instead
      const pageSizes = {
        '80mm': { width: 80000, height: 297000, landscape: false },
        'a4_portrait': { width: 210000, height: 297000, landscape: false },
        'a5_landscape': { width: 210000, height: 148000, landscape: false }   // A5 landscape (210x148mm)
      };
      const pageSize = pageSizes[paperSize] || pageSizes['80mm'];
      
      // Check if user wants to use print dialog - await the promise
      const usePrintDialogResult = await settingsService.get('use_print_dialog');
      const usePrintDialog = usePrintDialogResult?.data || false;
      
      const printOptions = {
        silent: !usePrintDialog, // Show dialog if setting is enabled
        printBackground: true,
        color: false,
        // deviceName: defaultPrinter, // Removed - causes Windows to ignore all settings
        scaleFactor: 100, // Prevent auto-scaling (100 = 100%)
        preferCSSPageSize: true, // Respect CSS @page size
        margins: {
          marginType: 'none'
        },
        pageSize: {
          width: pageSize.width,
          height: pageSize.height
        },
        landscape: pageSize.landscape
      };
      
      console.log('🖨️  Print options (Sales):', { ...printOptions, usePrintDialog });
      
      // Print using promise wrapper
      return new Promise((resolve) => {
        printWindow.webContents.print(printOptions, (success, errorType) => {
          printWindow.close();
          if (!success) {
            console.error('❌ Print failed:', errorType);
            resolve({ 
              success: false, 
              mode: 'print',
              error: `Print failed: ${errorType}` 
            });
          } else {
            console.log(`✅ Receipt sent to printer: ${defaultPrinter}`);
            resolve({ success: true, mode: 'print' });
          }
        });
      });
    }
    
  } catch (error) {
    console.error('Error printing sales receipt:', error);
    return { success: false, error: error.message };
  }
});

// Get list of installed printers
ipcMain.handle('printer:getPrinters', async () => {
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    return {
      success: true,
      data: printers
    };
  } catch (error) {
    console.error('Error getting printers:', error);
    return { success: false, error: error.message };
  }
});

// Test print with mockup receipt
ipcMain.handle('printer:testPrint', async () => {
  try {
    const settingsService = require('./services/settings');
    const { generatePurchaseReceipt } = require('./utils/receiptTemplate');
    
    // Get print settings - await the promises
    const paperSizeResult = await settingsService.get('paper_size');
    const paperSize = paperSizeResult?.data || 'a5_landscape';
    
    const usePrintDialogResult = await settingsService.get('use_print_dialog');
    const usePrintDialog = usePrintDialogResult?.data || false;
    
    console.log('🧪 Test Print - Paper size:', paperSize);
    console.log('🧪 Test Print - Use dialog:', usePrintDialog);
    
    // Generate mockup receipt data
    const mockupTransaction = {
      receipt_number: 'TEST-001',
      transaction_date: new Date().toISOString(),
      lorry_weight: 15250.50,
      paddy_weight: 12450.75,
      moisture_percentage: 18.5,
      impurities_percentage: 2.3,
      variety: 'MR219',
      price_per_ton: 980.00,
      total_deduction: 245.50,
      net_weight: 12205.25,
      total_amount: 11961.14,
      deduction_config: [
        { deduction: 'Moisture', value: 1.5 },
        { deduction: 'Impurities', value: 0.8 }
      ]
    };
    
    const mockupFarmer = {
      name: 'Ahmad bin Ali',
      ic_number: '800101-01-5678',
      address: 'No. 123, Kampung Padi, 12345 Sungai Besar, Selangor',
      vehicle_no: 'WXY 1234'
    };
    
    const mockupSeason = {
      location: 'PANCHANG BEDENA'
    };
    
    // Get company info - await the promises
    const companyNameResult = await settingsService.get('company_name');
    const companyName = companyNameResult?.data || 'TEST COMPANY';
    
    const companyAddressResult = await settingsService.get('company_address');
    const companyAddress = companyAddressResult?.data || 'Test Address';
    
    const companyPhoneResult = await settingsService.get('company_phone');
    const companyPhone = companyPhoneResult?.data || '012-3456789';
    
    const companyRegNoResult = await settingsService.get('company_registration_no');
    const companyRegNo = companyRegNoResult?.data || 'TEST-123';
    
    const licenceNoResult = await settingsService.get('paddy_purchasing_licence_no');
    const licenceNo = licenceNoResult?.data || 'LICENCE-001';
    
    const companyLocationResult = await settingsService.get('company_location');
    const companyLocation = companyLocationResult?.data || 'Test Location';
    
    const mockupCompanyDetails = {
      name: companyName,
      address: companyAddress,
      phone: companyPhone,
      registration_no: companyRegNo,
      licence_no: licenceNo,
      location: companyLocation
    };
    
    const htmlContent = generatePurchaseReceipt(
      mockupTransaction,
      mockupFarmer,
      mockupSeason,
      mockupCompanyDetails,
      paperSize
    );
    
    // Create hidden print window
    const printWindow = new BrowserWindow({
      width: 1200,
      height: 1600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        zoomFactor: 1.0
      }
    });
    
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    
    // Page sizes in microns
    const pageSizes = {
      '80mm': { width: 80000, height: 297000, landscape: false },
      'a4_portrait': { width: 210000, height: 297000, landscape: false },
      'a5_landscape': { width: 210000, height: 148000, landscape: false }
    };
    const pageSize = pageSizes[paperSize] || pageSizes['80mm'];
    
    const printOptions = {
      silent: !usePrintDialog, // Use dialog if enabled in settings
      printBackground: true,
      color: false,
      scaleFactor: 100,
      preferCSSPageSize: true,
      margins: { marginType: 'none' },
      pageSize: {
        width: pageSize.width,
        height: pageSize.height
      },
      landscape: pageSize.landscape
    };
    
    console.log('🧪 Test Print options:', printOptions);
    
    return new Promise((resolve) => {
      printWindow.webContents.print(printOptions, (success, errorType) => {
        printWindow.close();
        if (!success) {
          console.error('❌ Test print failed:', errorType);
          resolve({ success: false, error: `Print failed: ${errorType}` });
        } else {
          console.log('✅ Test print sent successfully');
          resolve({ success: true });
        }
      });
    });
    
  } catch (error) {
    console.error('Error in test print:', error);
    return { success: false, error: error.message };
  }
});

// ===========================================
// Error Handling
// ===========================================

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});
