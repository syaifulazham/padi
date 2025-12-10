const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import services
const db = require('./database/connection');
const farmerService = require('./database/queries/farmers');
const manufacturerService = require('./database/queries/manufacturers');
const productService = require('./database/queries/products');
const seasonProductPriceService = require('./database/queries/seasonProductPrices');
const purchaseService = require('./database/queries/purchases');
const salesService = require('./database/queries/sales');
const stockpilesService = require('./database/queries/stockpiles');
const seasonService = require('./database/queries/seasons');
const seasonPriceService = require('./database/queries/seasonPriceHistory');
const weighbridgeService = require('./hardware/weighbridge');
const settingsService = require('./services/settings');
const { generatePurchaseReceipt, generateSalesReceipt } = require('./utils/receiptTemplate');

let mainWindow;

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
    icon: path.join(__dirname, '../public/icon.png'),
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
    mainWindow.loadFile(indexPath);
  }

  // Log any loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Failed to load:', errorDescription);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

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

// ===========================================
// Receipt Printing
// ===========================================

ipcMain.handle('print:purchaseReceipt', async (event, transactionId) => {
  try {
    console.log('🖨️  Printing receipt for transaction:', transactionId);
    
    // Check print settings
    const printToPdfResult = await settingsService.get('print_to_pdf');
    const printToPdf = printToPdfResult?.data || false;
    const pdfSavePathResult = await settingsService.get('pdf_save_path');
    const pdfSavePath = pdfSavePathResult?.data || null;
    const pdfAutoOpenResult = await settingsService.get('pdf_auto_open');
    const pdfAutoOpen = pdfAutoOpenResult?.data || false;
    const paperSizeResult = await settingsService.get('paper_size');
    const paperSize = paperSizeResult?.data || '80mm';
    
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
    const receiptHTML = generatePurchaseReceipt(transaction, farmer, season, companyDetails, paperSize);
    
    // Create hidden window for printing/PDF
    const printWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    
    // Load the receipt HTML
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(receiptHTML)}`);
    
    // Small delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (printToPdf && pdfSavePath) {
      // Save as PDF
      const fs = require('fs');
      const pathModule = require('path');
      
      // Ensure directory exists
      if (!fs.existsSync(pdfSavePath)) {
        fs.mkdirSync(pdfSavePath, { recursive: true });
      }
      
      // Generate filename
      const filename = `Receipt_${transaction.receipt_number}_${Date.now()}.pdf`;
      const pdfPath = pathModule.join(pdfSavePath, filename);
      
      // Get page size based on paper size setting
      // Use standard page sizes to avoid Adobe Acrobat warnings
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
        pdfOptions = {
          pageSize: 'A5',
          landscape: true,
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
      
      return { 
        success: true, 
        mode: 'pdf',
        path: pdfPath,
        filename: filename
      };
      
    } else {
      // Print to physical printer
      // Use microns for print API (1mm = 1000 microns)
      const pageSizes = {
        '80mm': { width: 80000, height: 297000, landscape: false },    // 80mm x 297mm
        'a4_portrait': { width: 210000, height: 297000, landscape: false },  // A4 portrait
        'a5_landscape': { width: 210000, height: 148000, landscape: true }   // A5 landscape
      };
      const pageSize = pageSizes[paperSize] || pageSizes['80mm'];
      
      const printOptions = {
        silent: false, // Set to true for auto-print without dialog
        printBackground: true,
        color: false,
        margins: {
          marginType: 'none'
        },
        pageSize: {
          width: pageSize.width,
          height: pageSize.height
        },
        landscape: pageSize.landscape
      };
      
      // Print using promise wrapper
      return new Promise((resolve) => {
        printWindow.webContents.print(printOptions, (success, errorType) => {
          if (!success) {
            console.error('Print failed:', errorType);
          }
          printWindow.close();
          console.log('✅ Receipt printed successfully');
          resolve({ success: true, mode: 'print' });
        });
      });
    }
    
  } catch (error) {
    console.error('Error printing receipt:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('print:salesReceipt', async (event, salesId) => {
  try {
    console.log('🖨️  Printing sales receipt for sales ID:', salesId);
    
    // Check print settings
    const printToPdfResult = await settingsService.get('print_to_pdf');
    const printToPdf = printToPdfResult?.data || false;
    const pdfSavePathResult = await settingsService.get('pdf_save_path');
    const pdfSavePath = pdfSavePathResult?.data || null;
    const pdfAutoOpenResult = await settingsService.get('pdf_auto_open');
    const pdfAutoOpen = pdfAutoOpenResult?.data || false;
    const paperSizeResult = await settingsService.get('paper_size');
    const paperSize = paperSizeResult?.data || '80mm';
    
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
    
    // Create hidden window for printing/PDF
    const printWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    
    // Load the receipt HTML
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(receiptHTML)}`);
    
    // Small delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (printToPdf && pdfSavePath) {
      // Save as PDF
      const fs = require('fs');
      const pathModule = require('path');
      
      // Ensure directory exists
      if (!fs.existsSync(pdfSavePath)) {
        fs.mkdirSync(pdfSavePath, { recursive: true });
      }
      
      // Generate filename
      const salesNum = salesTransaction.sales_number || `ID${salesId}`;
      const filename = `SalesReceipt_${salesNum}_${Date.now()}.pdf`;
      const pdfPath = pathModule.join(pdfSavePath, filename);
      
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
        pdfOptions = {
          pageSize: 'A5',
          landscape: true,
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
      
      return { 
        success: true, 
        mode: 'pdf',
        path: pdfPath,
        filename: filename
      };
      
    } else {
      // Print to physical printer
      const pageSizes = {
        '80mm': { width: 80000, height: 297000, landscape: false },
        'a4_portrait': { width: 210000, height: 297000, landscape: false },
        'a5_landscape': { width: 210000, height: 148000, landscape: true }
      };
      const pageSize = pageSizes[paperSize] || pageSizes['80mm'];
      
      const printOptions = {
        silent: false,
        printBackground: true,
        color: false,
        margins: {
          marginType: 'none'
        },
        pageSize: {
          width: pageSize.width,
          height: pageSize.height
        },
        landscape: pageSize.landscape
      };
      
      // Print using promise wrapper
      return new Promise((resolve) => {
        printWindow.webContents.print(printOptions, (success, errorType) => {
          if (!success) {
            console.error('Print failed:', errorType);
          }
          printWindow.close();
          console.log('✅ Sales receipt printed successfully');
          resolve({ success: true, mode: 'print' });
        });
      });
    }
    
  } catch (error) {
    console.error('Error printing sales receipt:', error);
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
