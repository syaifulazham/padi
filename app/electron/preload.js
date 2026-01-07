const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database
  testConnection: () => ipcRenderer.invoke('db:test'),

  // Farmers
  farmers: {
    getAll: () => ipcRenderer.invoke('farmers:getAll'),
    getById: (id) => ipcRenderer.invoke('farmers:getById', id),
    create: (data) => ipcRenderer.invoke('farmers:create', data),
    update: (id, data) => ipcRenderer.invoke('farmers:update', id, data),
    delete: (id) => ipcRenderer.invoke('farmers:delete', id),
    search: (query) => ipcRenderer.invoke('farmers:search', query)
  },

  // Farmer Documents
  farmerDocuments: {
    getByFarmerId: (farmerId) => ipcRenderer.invoke('farmerDocuments:getByFarmerId', farmerId),
    getSubsidyCard: (farmerId) => ipcRenderer.invoke('farmerDocuments:getSubsidyCard', farmerId),
    findByHashcode: (hashcode) => ipcRenderer.invoke('farmerDocuments:findByHashcode', hashcode),
    create: (data) => ipcRenderer.invoke('farmerDocuments:create', data),
    update: (id, data) => ipcRenderer.invoke('farmerDocuments:update', id, data),
    delete: (id) => ipcRenderer.invoke('farmerDocuments:delete', id),
    uploadImage: (farmerId, imageData) => ipcRenderer.invoke('farmerDocuments:uploadImage', farmerId, imageData),
    getImage: (filePath) => ipcRenderer.invoke('farmerDocuments:getImage', filePath)
  },

  // Purchases
  purchases: {
    create: (data) => ipcRenderer.invoke('purchases:create', data),
    getAll: (filters) => ipcRenderer.invoke('purchases:getAll', filters),
    getById: (id) => ipcRenderer.invoke('purchases:getById', id),
    getByReceipt: (receiptNumber) => ipcRenderer.invoke('purchases:getByReceipt', receiptNumber),
    getUnsold: (seasonId) => ipcRenderer.invoke('purchases:getUnsold', seasonId),
    getTotalStats: (seasonId) => ipcRenderer.invoke('purchases:getTotalStats', seasonId),
    createSplit: (parentTransactionId, splitWeightKg, userId) => ipcRenderer.invoke('purchases:createSplit', parentTransactionId, splitWeightKg, userId),
    updatePayment: (updateData) => ipcRenderer.invoke('purchases:updatePayment', updateData),
    cancelPendingLorry: (sessionData, userId, reason) => ipcRenderer.invoke('purchases:cancelPendingLorry', sessionData, userId, reason),
    getSplitChildren: (parentTransactionId) => ipcRenderer.invoke('purchases:getSplitChildren', parentTransactionId)
  },

  // Sales
  sales: {
    create: (data) => ipcRenderer.invoke('sales:create', data),
    getAll: (filters) => ipcRenderer.invoke('sales:getAll', filters),
    getById: (id) => ipcRenderer.invoke('sales:getById', id),
    getTotalStats: (seasonId) => ipcRenderer.invoke('sales:getTotalStats', seasonId)
  },

  // Stockpiles
  stockpiles: {
    getSummary: (seasonId) => ipcRenderer.invoke('stockpiles:getSummary', seasonId),
    getProductMovements: (seasonId, productId, filters) => ipcRenderer.invoke('stockpiles:getProductMovements', seasonId, productId, filters),
    getStats: (seasonId) => ipcRenderer.invoke('stockpiles:getStats', seasonId),
    getLowStockAlerts: (seasonId, thresholdKg) => ipcRenderer.invoke('stockpiles:getLowStockAlerts', seasonId, thresholdKg)
  },

  // Inventory
  inventory: {
    getAll: () => ipcRenderer.invoke('inventory:getAll'),
    getBySeasonGrade: (seasonId, gradeId) => ipcRenderer.invoke('inventory:getBySeasonGrade', seasonId, gradeId),
    getMovements: (filters) => ipcRenderer.invoke('inventory:getMovements', filters)
  },

  // Seasons
  seasons: {
    getAll: (filters) => ipcRenderer.invoke('seasons:getAll', filters),
    getActive: () => ipcRenderer.invoke('seasons:getActive'),
    getById: (id) => ipcRenderer.invoke('seasons:getById', id),
    create: (data) => ipcRenderer.invoke('seasons:create', data),
    update: (id, data) => ipcRenderer.invoke('seasons:update', id, data),
    getSeasonTypes: () => ipcRenderer.invoke('seasons:getSeasonTypes'),
    close: (id) => ipcRenderer.invoke('seasons:close', id)
  },

  // Season Price History
  seasonPrice: {
    getCurrent: (seasonId) => ipcRenderer.invoke('seasonPrice:getCurrent', seasonId),
    update: (seasonId, pricePerTon, notes, createdBy) => ipcRenderer.invoke('seasonPrice:update', seasonId, pricePerTon, notes, createdBy),
    getHistory: (seasonId) => ipcRenderer.invoke('seasonPrice:getHistory', seasonId),
    initialize: (seasonId, pricePerTon, notes, createdBy) => ipcRenderer.invoke('seasonPrice:initialize', seasonId, pricePerTon, notes, createdBy)
  },

  // Manufacturers
  manufacturers: {
    getAll: () => ipcRenderer.invoke('manufacturers:getAll'),
    getById: (id) => ipcRenderer.invoke('manufacturers:getById', id),
    create: (data) => ipcRenderer.invoke('manufacturers:create', data),
    update: (id, data) => ipcRenderer.invoke('manufacturers:update', id, data)
  },

  // Paddy Products
  products: {
    getAll: () => ipcRenderer.invoke('products:getAll'),
    getActive: () => ipcRenderer.invoke('products:getActive'),
    getById: (id) => ipcRenderer.invoke('products:getById', id),
    create: (data) => ipcRenderer.invoke('products:create', data),
    update: (id, data) => ipcRenderer.invoke('products:update', id, data),
    delete: (id) => ipcRenderer.invoke('products:delete', id),
    getInventorySummary: (seasonId) => ipcRenderer.invoke('products:getInventorySummary', seasonId)
  },

  // Season Product Prices
  seasonProductPrices: {
    getSeasonProductPrices: (seasonId) => ipcRenderer.invoke('seasonProductPrices:getSeasonProductPrices', seasonId),
    getProductPrice: (seasonId, productId) => ipcRenderer.invoke('seasonProductPrices:getProductPrice', seasonId, productId),
    initializeSeasonPrices: (seasonId, productPrices) => ipcRenderer.invoke('seasonProductPrices:initializeSeasonPrices', seasonId, productPrices),
    updateProductPrice: (seasonId, productId, pricePerTon, notes, createdBy) => ipcRenderer.invoke('seasonProductPrices:updateProductPrice', seasonId, productId, pricePerTon, notes, createdBy),
    getPriceHistory: (seasonId, productId) => ipcRenderer.invoke('seasonProductPrices:getPriceHistory', seasonId, productId),
    copyPricesFromSeason: (targetSeasonId, sourceSeasonId, createdBy) => ipcRenderer.invoke('seasonProductPrices:copyPricesFromSeason', targetSeasonId, sourceSeasonId, createdBy)
  },

  // Grades
  grades: {
    getAll: () => ipcRenderer.invoke('grades:getAll'),
    getById: (id) => ipcRenderer.invoke('grades:getById', id)
  },

  // Weighbridge
  weighbridge: {
    read: () => ipcRenderer.invoke('weighbridge:read'),
    connect: () => ipcRenderer.invoke('weighbridge:connect'),
    disconnect: () => ipcRenderer.invoke('weighbridge:disconnect')
  },

  // Printer
  printer: {
    print: (type, data) => ipcRenderer.invoke('printer:print', type, data),
    getPrinters: () => ipcRenderer.invoke('printer:getPrinters'),
    purchaseReceipt: (transactionId, options) => ipcRenderer.invoke('print:purchaseReceipt', transactionId, options),
    salesReceipt: (salesId, options) => ipcRenderer.invoke('print:salesReceipt', salesId, options)
  },

  // Reports
  reports: {
    dailySummary: (date) => ipcRenderer.invoke('reports:dailySummary', date),
    farmerSummary: (farmerId, seasonId) => ipcRenderer.invoke('reports:farmerSummary', farmerId, seasonId),
    inventorySummary: () => ipcRenderer.invoke('reports:inventorySummary'),
    seasonPerformance: (seasonId) => ipcRenderer.invoke('reports:seasonPerformance', seasonId)
  },

  // Authentication
  auth: {
    hasUsers: () => ipcRenderer.invoke('auth:hasUsers'),
    login: (username, password) => ipcRenderer.invoke('auth:login', username, password)
  },

  // Users
  users: {
    getById: (userId) => ipcRenderer.invoke('users:getById', userId),
    getAll: () => ipcRenderer.invoke('users:getAll'),
    create: (userData) => ipcRenderer.invoke('users:create', userData),
    update: (userId, userData) => ipcRenderer.invoke('users:update', userId, userData),
    delete: (userId) => ipcRenderer.invoke('users:delete', userId),
    changePassword: (userId, oldPassword, newPassword) => ipcRenderer.invoke('users:changePassword', userId, oldPassword, newPassword)
  },

  // Settings
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    save: (data) => ipcRenderer.invoke('settings:save', data),
    getCompanyDetails: () => ipcRenderer.invoke('settings:getCompanyDetails'),
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    reset: () => ipcRenderer.invoke('settings:reset'),
    selectFolder: () => ipcRenderer.invoke('settings:selectFolder')
  },

  // System
  system: {
    getInfo: () => ipcRenderer.invoke('system:getInfo')
  },

  // Backup & Restore
  backup: {
    create: (backupPath) => ipcRenderer.invoke('backup:create', backupPath),
    restore: (filepath) => ipcRenderer.invoke('backup:restore', filepath),
    selectFile: () => ipcRenderer.invoke('backup:selectFile'),
    openFolder: (folderPath) => ipcRenderer.invoke('backup:openFolder', folderPath)
  },

  // Database
  database: {
    cleanup: () => ipcRenderer.invoke('database:cleanup')
  }
});
