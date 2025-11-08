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

  // Purchases
  purchases: {
    create: (data) => ipcRenderer.invoke('purchases:create', data),
    getAll: (filters) => ipcRenderer.invoke('purchases:getAll', filters),
    getById: (id) => ipcRenderer.invoke('purchases:getById', id),
    getByReceipt: (receiptNumber) => ipcRenderer.invoke('purchases:getByReceipt', receiptNumber)
  },

  // Sales
  sales: {
    create: (data) => ipcRenderer.invoke('sales:create', data),
    getAll: (filters) => ipcRenderer.invoke('sales:getAll', filters),
    getById: (id) => ipcRenderer.invoke('sales:getById', id)
  },

  // Inventory
  inventory: {
    getAll: () => ipcRenderer.invoke('inventory:getAll'),
    getBySeasonGrade: (seasonId, gradeId) => ipcRenderer.invoke('inventory:getBySeasonGrade', seasonId, gradeId),
    getMovements: (filters) => ipcRenderer.invoke('inventory:getMovements', filters)
  },

  // Seasons
  seasons: {
    getAll: () => ipcRenderer.invoke('seasons:getAll'),
    getActive: () => ipcRenderer.invoke('seasons:getActive'),
    getById: (id) => ipcRenderer.invoke('seasons:getById', id),
    create: (data) => ipcRenderer.invoke('seasons:create', data),
    close: (id) => ipcRenderer.invoke('seasons:close', id)
  },

  // Manufacturers
  manufacturers: {
    getAll: () => ipcRenderer.invoke('manufacturers:getAll'),
    getById: (id) => ipcRenderer.invoke('manufacturers:getById', id),
    create: (data) => ipcRenderer.invoke('manufacturers:create', data),
    update: (id, data) => ipcRenderer.invoke('manufacturers:update', id, data)
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
    getPrinters: () => ipcRenderer.invoke('printer:getPrinters')
  },

  // Reports
  reports: {
    dailySummary: (date) => ipcRenderer.invoke('reports:dailySummary', date),
    farmerSummary: (farmerId, seasonId) => ipcRenderer.invoke('reports:farmerSummary', farmerId, seasonId),
    inventorySummary: () => ipcRenderer.invoke('reports:inventorySummary'),
    seasonPerformance: (seasonId) => ipcRenderer.invoke('reports:seasonPerformance', seasonId)
  },

  // Users
  users: {
    login: (username, password) => ipcRenderer.invoke('users:login', username, password),
    logout: () => ipcRenderer.invoke('users:logout'),
    getCurrentUser: () => ipcRenderer.invoke('users:getCurrentUser')
  },

  // Settings
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    save: (data) => ipcRenderer.invoke('settings:save', data),
    getCompanyDetails: () => ipcRenderer.invoke('settings:getCompanyDetails'),
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    reset: () => ipcRenderer.invoke('settings:reset')
  },

  // System
  system: {
    getInfo: () => ipcRenderer.invoke('system:getInfo')
  }
});
