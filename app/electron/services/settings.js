const Store = require('electron-store');
const os = require('os');

// Initialize electron-store with schema
const store = new Store({
  name: 'settings',
  defaults: {
    // Company Details
    company: {
      name: '',
      address: '',
      phone: '',
      registration_no: '',
      paddy_purchasing_licence_no: '',
      location: ''
    },
    
    // Application Settings
    application: {
      name: 'Paddy Collection Center',
      language: 'en',
      currency: 'MYR',
      date_format: 'YYYY-MM-DD'
    },
    
    // Database Settings
    database: {
      host: 'localhost',
      port: 3306,
      name: 'paddy_collection_db',
      connection_limit: 10
    },
    
    // Weighbridge Settings
    weighbridge: {
      port: 'COM3',
      baud_rate: 9600,
      auto_connect: true
    },
    
    // Printer Settings
    printer: {
      default_printer: 'Epson LQ-310',
      auto_print: true,
      print_copies: 1,
      paper_size: '80mm',
      print_to_pdf: false,
      pdf_save_path: '',
      pdf_auto_open: false,
      receipt_header: '',
      receipt_footer: ''
    },
    
    // Backup Settings
    backup: {
      auto_backup: true,
      backup_frequency: 'daily',
      backup_retention_days: 30,
      backup_path: './backups'
    }
  }
});

/**
 * Get all settings
 */
const getAll = async () => {
  try {
    const settings = store.store;
    
    // Flatten nested structure for easier form handling
    return {
      success: true,
      data: {
        // Company
        company_name: settings.company.name,
        company_address: settings.company.address,
        company_phone: settings.company.phone || '',
        company_registration_no: settings.company.registration_no,
        paddy_purchasing_licence_no: settings.company.paddy_purchasing_licence_no,
        company_location: settings.company.location || '',
        
        // Application
        app_name: settings.application.name,
        language: settings.application.language,
        currency: settings.application.currency,
        date_format: settings.application.date_format,
        
        // Database
        db_host: settings.database.host,
        db_port: settings.database.port,
        db_name: settings.database.name,
        db_connection_limit: settings.database.connection_limit,
        
        // Weighbridge
        weighbridge_port: settings.weighbridge.port,
        weighbridge_baud_rate: settings.weighbridge.baud_rate,
        weighbridge_auto_connect: settings.weighbridge.auto_connect,
        
        // Printer
        default_printer: settings.printer.default_printer,
        auto_print: settings.printer.auto_print,
        print_copies: settings.printer.print_copies,
        paper_size: settings.printer.paper_size,
        print_to_pdf: settings.printer.print_to_pdf,
        pdf_save_path: settings.printer.pdf_save_path,
        pdf_auto_open: settings.printer.pdf_auto_open,
        receipt_header: settings.printer.receipt_header,
        receipt_footer: settings.printer.receipt_footer,
        
        // Backup
        auto_backup: settings.backup.auto_backup,
        backup_frequency: settings.backup.backup_frequency,
        backup_retention_days: settings.backup.backup_retention_days,
        backup_path: settings.backup.backup_path
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Save settings
 */
const save = async (data) => {
  try {
    // Company Details
    if (data.company_name !== undefined) {
      store.set('company.name', data.company_name);
    }
    if (data.company_address !== undefined) {
      store.set('company.address', data.company_address);
    }
    if (data.company_phone !== undefined) {
      store.set('company.phone', data.company_phone);
    }
    if (data.company_registration_no !== undefined) {
      store.set('company.registration_no', data.company_registration_no);
    }
    if (data.paddy_purchasing_licence_no !== undefined) {
      store.set('company.paddy_purchasing_licence_no', data.paddy_purchasing_licence_no);
    }
    if (data.company_location !== undefined) {
      store.set('company.location', data.company_location);
    }
    
    // Application Settings
    if (data.app_name !== undefined) {
      store.set('application.name', data.app_name);
    }
    if (data.language !== undefined) {
      store.set('application.language', data.language);
    }
    if (data.currency !== undefined) {
      store.set('application.currency', data.currency);
    }
    if (data.date_format !== undefined) {
      store.set('application.date_format', data.date_format);
    }
    
    // Database Settings
    if (data.db_host !== undefined) {
      store.set('database.host', data.db_host);
    }
    if (data.db_port !== undefined) {
      store.set('database.port', data.db_port);
    }
    if (data.db_name !== undefined) {
      store.set('database.name', data.db_name);
    }
    if (data.db_connection_limit !== undefined) {
      store.set('database.connection_limit', data.db_connection_limit);
    }
    
    // Weighbridge Settings
    if (data.weighbridge_port !== undefined) {
      store.set('weighbridge.port', data.weighbridge_port);
    }
    if (data.weighbridge_baud_rate !== undefined) {
      store.set('weighbridge.baud_rate', data.weighbridge_baud_rate);
    }
    if (data.weighbridge_auto_connect !== undefined) {
      store.set('weighbridge.auto_connect', data.weighbridge_auto_connect);
    }
    
    // Printer Settings
    if (data.default_printer !== undefined) {
      store.set('printer.default_printer', data.default_printer);
    }
    if (data.auto_print !== undefined) {
      store.set('printer.auto_print', data.auto_print);
    }
    if (data.print_copies !== undefined) {
      store.set('printer.print_copies', data.print_copies);
    }
    if (data.paper_size !== undefined) {
      store.set('printer.paper_size', data.paper_size);
    }
    if (data.print_to_pdf !== undefined) {
      store.set('printer.print_to_pdf', data.print_to_pdf);
    }
    if (data.pdf_save_path !== undefined) {
      store.set('printer.pdf_save_path', data.pdf_save_path);
    }
    if (data.pdf_auto_open !== undefined) {
      store.set('printer.pdf_auto_open', data.pdf_auto_open);
    }
    if (data.receipt_header !== undefined) {
      store.set('printer.receipt_header', data.receipt_header);
    }
    if (data.receipt_footer !== undefined) {
      store.set('printer.receipt_footer', data.receipt_footer);
    }
    
    // Backup Settings
    if (data.auto_backup !== undefined) {
      store.set('backup.auto_backup', data.auto_backup);
    }
    if (data.backup_frequency !== undefined) {
      store.set('backup.backup_frequency', data.backup_frequency);
    }
    if (data.backup_retention_days !== undefined) {
      store.set('backup.backup_retention_days', data.backup_retention_days);
    }
    if (data.backup_path !== undefined) {
      store.set('backup.backup_path', data.backup_path);
    }
    
    return {
      success: true,
      message: 'Settings saved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get company details specifically
 */
const getCompanyDetails = async () => {
  try {
    const company = store.get('company') || {};
    return {
      success: true,
      data: {
        name: company.name || '',
        address: company.address || '',
        registration_no: company.registration_no || '',
        licence_no: company.paddy_purchasing_licence_no || '',
        location: company.location || ''
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get system information
 */
const getSystemInfo = async () => {
  try {
    const app = require('electron').app;
    
    return {
      success: true,
      data: {
        version: app.getVersion() || '1.0.0',
        electron_version: process.versions.electron,
        node_version: process.versions.node,
        platform: os.platform(),
        database_status: 'Connected', // This would need actual check
        database_version: '8.0', // This would need actual query
        database_name: store.get('database.name')
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Reset settings to defaults
 */
const reset = async () => {
  try {
    store.clear();
    return {
      success: true,
      message: 'Settings reset to defaults'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get specific setting value
 */
const get = async (key) => {
  try {
    // Map flat keys to nested structure
    const keyMap = {
      'default_printer': 'printer.default_printer',
      'paper_size': 'printer.paper_size',
      'print_to_pdf': 'printer.print_to_pdf',
      'pdf_save_path': 'printer.pdf_save_path',
      'pdf_auto_open': 'printer.pdf_auto_open'
    };
    
    const storeKey = keyMap[key] || key;
    const value = store.get(storeKey);
    
    return {
      success: true,
      data: value
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Set specific setting value
 */
const set = async (key, value) => {
  try {
    store.set(key, value);
    return {
      success: true,
      message: 'Setting updated'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  getAll,
  save,
  getCompanyDetails,
  getSystemInfo,
  reset,
  get,
  set
};
