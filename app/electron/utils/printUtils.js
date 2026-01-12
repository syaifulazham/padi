/**
 * Print Utilities Module
 * Contains improved print options for consistent output between dialog and silent modes
 */

/**
 * Get standardized print options based on paper size and dialog preferences
 * @param {String} paperSize - '80mm', 'a4_portrait', or 'a5_landscape'
 * @param {Boolean} showDialog - Whether to show the print dialog
 * @param {String} printerName - Name of printer to use (optional)
 * @returns {Object} Print options for Electron's webContents.print()
 */
function getPrintOptions(paperSize, showDialog, printerName) {
  // Build base options
  const options = {
    silent: !showDialog,
    printBackground: true,
    color: true,
    deviceName: printerName || undefined,
    margins: { marginType: 'default' }
  };
  
  // Set page size using standard strings where possible
  // This improves compatibility with Windows printer drivers
  if (paperSize === 'a4_portrait') {
    options.pageSize = 'A4';
    options.landscape = false;
  } else if (paperSize === 'a5_landscape') {
    options.pageSize = 'A5';
    options.landscape = true;
  } else {
    // For 80mm thermal: use custom size in microns
    // Note: Non-thermal printers may not support this - use A4 as fallback
    options.pageSize = { width: 80000, height: 297000 };
    options.landscape = false;
  }
  
  return options;
}

/**
 * Get PDF options for printToPDF function
 * @param {String} paperSize - '80mm', 'a4_portrait', or 'a5_landscape'
 * @returns {Object} Options for webContents.printToPDF()
 */
function getPdfOptions(paperSize) {
  if (paperSize === 'a4_portrait') {
    return {
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
    return {
      pageSize: {
        width: 210000, // 210mm in microns
        height: 148000  // 148mm in microns
      },
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
    // 80mm thermal paper
    return {
      pageSize: {
        width: 80000,   // 80mm in microns
        height: 297000  // 297mm (A4 height) in microns
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
}

module.exports = {
  getPrintOptions,
  getPdfOptions
};
