const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import services
const db = require('./database/connection');
const farmerService = require('./database/queries/farmers');
const manufacturerService = require('./database/queries/manufacturers');
const purchaseService = require('./database/queries/purchases');
const weighbridgeService = require('./hardware/weighbridge');

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
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

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

// ===========================================
// Error Handling
// ===========================================

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});
