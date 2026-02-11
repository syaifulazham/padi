/**
 * Generate HTML receipt for purchase transactions
 * Improved version with full-width printing
 */

/**
 * Get paper size configuration
 */
function getPaperSizeConfig(paperSize) {
  const configs = {
    '80mm': {
      pageWidth: '80mm',
      pageHeight: 'auto',
      fontSize: '8px',
      companyNameSize: '11px',
      receiptNumberSize: '10px',
      padding: '2mm 5mm 5mm 5mm',
      labelWidth: '120px',
      maxContentWidth: '100%',
      usePageSize: true,
      scale: 1
    },
    'a4_portrait': {
      pageWidth: '210mm',
      pageHeight: '297mm',
      fontSize: '12px',
      companyNameSize: '18px',
      receiptNumberSize: '18px',
      padding: '5mm 10mm 10mm 10mm',
      labelWidth: '350px',
      maxContentWidth: '100%',
      usePageSize: true,
      scale: 1
    },
    'a5_landscape': {
      pageWidth: '210mm',
      pageHeight: '148mm',
      fontSize: '10px',
      companyNameSize: '14px',
      receiptNumberSize: '14px',
      padding: '3mm 5mm 5mm 5mm',
      labelWidth: '150px',
      maxContentWidth: '100%',
      usePageSize: true,
      scale: 1
    }
  };
  
  return configs[paperSize] || configs['80mm'];
}

function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || num === '' || isNaN(num)) {
    return '0.00';
  }
  return parseFloat(num).toLocaleString('en-MY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatDate(dateString) {
  if (!dateString) {
    return '-';
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleDateString('en-GB');
}

function formatTime(dateString) {
  if (!dateString) {
    return '-';
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleTimeString('en-GB', { hour12: false });
}

function generatePurchaseReceipt(transaction, farmer, season, companyDetails, paperSize = '80mm') {
  // Calculate deductions breakdown
  const deductions = transaction.deduction_config || [];
  const deductionText = deductions.map(d => `${d.deduction} ${d.value}%`).join(', ');
  const totalDeductionPercent = deductions.reduce((sum, d) => sum + parseFloat(d.value), 0);
  
  // Calculate berat bersih (net weight after deductions)
  // Berat bersih = berat kasar - (berat kasar × potongan%)
  const beratKasar = parseFloat(transaction.net_weight_kg); // Net weight before deductions (gross - tare)
  const potonganKg = beratKasar * (totalDeductionPercent / 100);
  const beratBersih = beratKasar - potonganKg; // Net weight after deductions
  
  // Calculate times (using transaction timestamps)
  const timeIn = formatTime(transaction.transaction_date);
  const timeOut = formatTime(transaction.transaction_date); // Same for now, can be different if tracked
  
  // Get paper size configuration
  const sizeConfig = getPaperSizeConfig(paperSize);
  const isLandscape = paperSize === 'a5_landscape';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      ${sizeConfig.usePageSize ? `size: ${sizeConfig.pageWidth} ${sizeConfig.pageHeight};` : ''}
      margin: ${sizeConfig.padding};
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Courier New', monospace;
      font-size: ${sizeConfig.fontSize};
      line-height: 1.3;
      width: 100%; /* Changed to 100% */
      margin: 0;
      padding: 0;
      color: #000;
    }
    
    .container {
      width: 100%; /* Full width container */
      margin: 0;
      padding: 0;
    }
    
    .header {
      text-align: left;
      margin-bottom: 8px;
      padding-bottom: 20px;
      width: 100%; /* Full width header */
    }
    
    .company-name {
      font-weight: bold;
      font-size: ${sizeConfig.companyNameSize};
      margin-bottom: 2px;
    }
    
    .company-info {
      font-size: calc(${sizeConfig.fontSize} * 1.1);
      line-height: 1.3;
    }
    
    .right-header {
      text-align: right;
      float: right;
      margin-top: -60px;
      margin-bottom: 8px;
    }
    
    .location {
      font-size: ${sizeConfig.fontSize};
      margin-bottom: 3px;
    }
    
    .receipt-number {
      font-size: ${sizeConfig.receiptNumberSize};
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .title {
      font-weight: bold;
      margin: 8px 0 4px 0;
    }
    
    .details-section {
      margin-bottom: 8px;
      width: 100%; /* Full width */
    }
    
    .row {
      display: flex;
      margin-bottom: 2px;
      width: 100%;
    }
    
    .row-split {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
      width: 100%;
    }
    
    .label {
      width: 100px;
      display: inline-block;
    }
    
    .value {
      flex: 1;
    }
    
    .right-value {
      text-align: right;
    }
    
    .weights-section {
      margin: 10px 0;
      padding: 5px 0;
      width: 100%; /* Full width */
    }
    
    .weight-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
      width: 100%;
    }
    
    .weight-label {
      width: 50%;
    }
    
    .weight-value {
      width: 50%;
      text-align: right;
    }
    
    .deduction-note {
      font-style: italic;
      margin-left: 10px;
    }
    
    .net-weight {
      margin-top: 3px;
      padding-bottom: 5px;
    }
    
    .footer {
      margin-top: 15px;
      width: 100%; /* Full width footer */
    }
    
    .signature-row {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      width: 100%;
    }
    
    .signature-box {
      text-align: center;
      width: 30%;
    }
    
    .signature-line {
      border-bottom: 0.5px dashed #000;
      height: 30px;
      margin-bottom: 3px;
    }
    
    .signature-label {
      font-size: ${sizeConfig.fontSize};
      font-weight: bold;
    }
    
    .bold {
      font-weight: bold;
    }
    
    @media print {
      body {
        margin: 0;
        padding: ${sizeConfig.padding};
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="company-name">${companyDetails.name || 'BERKAT PADI SDN BHD'}</div>
      <div class="company-info">
        ${companyDetails.address || 'LOT 14633 PKT 100 SAWAH, SUNGAI NIPAH<br>45300 SUNGAI BESAR, SELANGOR'}<br>
        Tel: ${companyDetails.phone || '019-2499963'}<br>
        Lesen Belian Padi : ${companyDetails.licence_no || companyDetails.license || 'E6380'}
      </div>
    </div>
    
    <div class="right-header">
      ${totalDeductionPercent === 0 ? '<div class="bold" style="margin-bottom: 3px;">NOTA TIMBANG</div>' : ''}
      <div class="location">Kawasan: ${season.location || companyDetails.location || 'PANCHANG BEDENA'}</div>
      <div class="receipt-number" style="${totalDeductionPercent === 0 ? 'font-size: 12px;' : ''}">${transaction.receipt_number || transaction.receiptNumber || 'N/A'}</div>
    </div>
    
    <div style="clear: both;"></div>
    
    <!-- Title -->
    <div class="title">${totalDeductionPercent === 0 ? 'NOTA TIMBANG' : 'RESIT BELIAN'}</div>
    
    <!-- Farmer Details (Left) and Transaction Details (Right) -->
    <div class="details-section">
      <div class="row-split">
        <div style="width: 60%;">
          <div class="row">
            <span class="label">NAMA</span>
            <span class="value">: ${farmer.full_name || ''}</span>
          </div>
          <div class="row">
            <span class="label">NO K/P</span>
            <span class="value">: ${farmer.ic_number || ''}</span>
          </div>
          <div class="row">
            <span class="label">ALAMAT</span>
            <span class="value">: ${farmer.address || farmer.farmer_address || ''}</span>
          </div>
          <div class="row">
            <span class="label"></span>
            <span class="value">: ${farmer.postcode || ''} ${farmer.city || ''}, ${farmer.state || ''}</span>
          </div>
        </div>
        <div style="width: 38%; text-align: right;">
          <div class="row">
            <span class="bold">TARIKH MASUK: ${formatDate(transaction.transaction_date)}</span>
          </div>
          <div class="row">
            <span>SUBSIDI</span>
            <span>: ${transaction.subsidy_code || 'B001/D8858'}</span>
          </div>
          <div class="row">
            <span>GIRO</span>
            <span>: ${farmer.bank_name && farmer.bank_account_number ? `${farmer.bank_account_number}` : '-'}</span>
          </div>
          <div class="row">
            <span>BPM</span>
            <span>: ${farmer.bank2_name && farmer.bank2_account_number ? `${farmer.bank2_account_number}` : '.-'}</span>
          </div>
        </div>
      </div>
      
      <div class="row" style="margin-top: 5px;">
        <span class="label">NO. LORI</span>
        <span class="value">: ${transaction.vehicle_number || ''}</span>
      </div>
    </div>
    
    <!-- Weights Section -->
    <div class="weights-section">
      <div class="weight-row">
        <div class="weight-label">
          <span class="bold">BERAT MASUK</span>
          <span>: ${formatNumber(transaction.gross_weight_kg, 2)} KG</span>
        </div>
        <div class="weight-value">
          <span class="bold">MASA MASUK</span>
          <span>: ${timeIn}</span>
        </div>
      </div>
      
      <div class="weight-row">
        <div class="weight-label">
          <span class="bold">BERAT KELUAR</span>
          <span>: ${formatNumber(transaction.tare_weight_kg, 2)} KG</span>
        </div>
        <div class="weight-value">
          <span class="bold">MASA KELUAR</span>
          <span>: ${timeOut}</span>
        </div>
      </div>
      
      <div class="weight-row">
        <div class="weight-label">
          <span class="bold">BERAT KASAR</span>
          <span>: ${formatNumber(beratKasar, 2)} KG</span>
        </div>
        <div class="weight-value">
          <span class="bold">HARGA/TAN</span>
          <span>: RM ${formatNumber(transaction.base_price_per_kg * 1000, 2)}</span>
        </div>
      </div>
      
      ${totalDeductionPercent > 0 ? `
      <div class="weight-row">
        <div class="weight-label">
          <span class="bold">POTONGAN</span>
          <span>: ${formatNumber(totalDeductionPercent, 2)}%</span>
          ${deductionText ? `<div class="deduction-note">(${deductionText})</div>` : ''}
        </div>
        <div class="weight-value">
          <span class="bold">AMAUN</span>
          <span>: RM ${formatNumber(transaction.total_amount, 2)}</span>
        </div>
      </div>
      ` : ''}
      
      <div class="net-weight">
        <div class="weight-row">
          <div class="weight-label">
            <span class="bold">BERAT BERSIH</span>
            <span>: ${formatNumber(beratBersih, 2)} KG</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer Signatures -->
    <div class="footer">
      <div class="signature-row">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">DITIMBANG OLEH</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">PEMANDU LORI</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">DITERIMA OLEH</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate HTML receipt for sales transactions
 * Similar to purchase receipt but includes list of associated purchase receipts
 */
function generateSalesReceipt(salesTransaction, season, companyDetails, paperSize = '80mm') {
  // Get paper size configuration
  const sizeConfig = getPaperSizeConfig(paperSize);
  
  // Calculate grand total of berat kasar and berat bersih
  const purchaseReceipts = salesTransaction.purchase_receipts || [];
  const totalBeratKasar = purchaseReceipts.reduce((sum, r) => {
    return sum + parseFloat(r.original_weight || r.gross_weight_kg - r.tare_weight_kg || 0);
  }, 0);
  
  const totalBeratBersih = purchaseReceipts.reduce((sum, r) => {
    return sum + parseFloat(r.effective_weight_kg || r.net_weight_kg || 0);
  }, 0);
  
  // Calculate total amount
  const totalAmaun = purchaseReceipts.reduce((sum, r) => {
    return sum + parseFloat(r.total_amount || 0);
  }, 0);

  // Check if ALL receipts have deductions configured (not just some)
  const hasDeductions = purchaseReceipts.length > 0 && purchaseReceipts.every(r => {
    const deductionConfig = r.deduction_config;
    // Check if deduction_config exists and is not empty/null
    if (!deductionConfig || deductionConfig === '[]' || deductionConfig === '') return false;
    try {
      const deductions = typeof deductionConfig === 'string' ? JSON.parse(deductionConfig) : deductionConfig;
      return Array.isArray(deductions) && deductions.length > 0;
    } catch {
      return false;
    }
  });
  
  // Generate purchase receipts table rows conditionally
  const purchaseTableRows = purchaseReceipts.map((receipt, index) => {
    const beratKasar = parseFloat(receipt.original_weight || receipt.gross_weight_kg - receipt.tare_weight_kg || 0);
    const beratBersih = parseFloat(receipt.effective_weight_kg || receipt.net_weight_kg || 0);
    
    // Calculate PTG from deduction_config
    let ptg = 0;
    try {
      const deductionConfig = receipt.deduction_config;
      if (deductionConfig) {
        const deductions = typeof deductionConfig === 'string' ? JSON.parse(deductionConfig) : deductionConfig;
        if (Array.isArray(deductions)) {
          ptg = deductions.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
        }
      }
    } catch (error) {
      console.error('Error parsing deduction_config for receipt:', receipt.receipt_number, error);
    }
    
    const harga = parseFloat(receipt.base_price_per_kg || 0) * 1000;
    const amaun = parseFloat(receipt.total_amount || 0);

    if (hasDeductions) {
      return `
        <tr>
          <td style="padding: 3px 5px; border-bottom: 1px solid #ddd; text-align: center;">${index + 1}</td>
          <td style="padding: 3px 5px; border-bottom: 1px solid #ddd;">${receipt.receipt_number}</td>
          <td style="padding: 3px 5px; border-bottom: 1px solid #ddd; text-align: right;">${formatNumber(beratKasar, 2)}</td>
          <td style="padding: 3px 5px; border-bottom: 1px solid #ddd; text-align: right;">${formatNumber(beratBersih, 2)}</td>
          <td style="padding: 3px 5px; border-bottom: 1px solid #ddd; text-align: right;">${formatNumber(ptg, 2)}</td>
          <td style="padding: 3px 5px; border-bottom: 1px solid #ddd; text-align: right;">${formatNumber(harga, 2)}</td>
          <td style="padding: 3px 5px; border-bottom: 1px solid #ddd; text-align: right;">${formatNumber(amaun, 2)}</td>
        </tr>
      `;
    } else {
      return `
        <tr>
          <td style="padding: 3px 5px; border-bottom: 1px solid #ddd; text-align: center;">${index + 1}</td>
          <td style="padding: 3px 5px; border-bottom: 1px solid #ddd;">${receipt.receipt_number}</td>
          <td style="padding: 3px 5px; border-bottom: 1px solid #ddd; text-align: right;">${formatNumber(beratKasar, 2)}</td>
          <td style="padding: 3px 5px; border-bottom: 1px solid #ddd; text-align: right;">${formatNumber(harga, 2)}</td>
          <td style="padding: 3px 5px; border-bottom: 1px solid #ddd; text-align: right;">${formatNumber(amaun, 2)}</td>
        </tr>
      `;
    }
  }).join('');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      ${sizeConfig.usePageSize ? `size: ${sizeConfig.pageWidth} ${sizeConfig.pageHeight};` : ''}
      margin: ${sizeConfig.padding};
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Courier New', monospace;
      line-height: 1.3;
      width: 100%;
      margin: 0;
      padding: 0;
      color: #000;
    }
    
    .container {
      width: 100%;
      margin: 0;
      padding: 0;
    }
    
    @media print {
      body, .container {
        font-size: ${sizeConfig.fontSize};
      }
      .company-info {
        font-size: calc(${sizeConfig.fontSize} * 0.85);
      }
      .page-title {
        font-size: calc(${sizeConfig.fontSize} * 1.1);
      }
      .info-row {
        font-size: calc(${sizeConfig.fontSize} * 0.9);
      }
      .manufacturer-address {
        font-size: calc(${sizeConfig.fontSize} * 0.9);
      }
    }
    
    .header {
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
      width: 100%;
    }
    
    .company-name {
      font-weight: bold;
      font-size: ${sizeConfig.companyNameSize};
      margin-bottom: 3px;
    }
    
    .company-info {
      line-height: 1.3;
    }
    
    .page-title {
      text-align: right;
      font-weight: bold;
      margin: 10px 0;
    }
    
    .title {
      font-weight: bold;
      margin: 8px 0 4px 0;
    }
    
    .main-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      width: 100%;
    }
    
    .left-section {
      width: 48%;
    }
    
    .right-section {
      width: 48%;
    }
    
    .info-box {
      border: 1px solid #000;
      padding: 8px;
      margin-bottom: 10px;
      min-height: 60px;
    }
    
    .box-title {
      font-weight: bold;
      margin-bottom: 5px;
      text-decoration: underline;
    }
    
    .info-row {
      margin-bottom: 3px;
    }
    
    .receipt-info {
      margin: 10px 0;
    }
    
    .purchase-receipts-section {
      margin: 10px 0;
      width: 100%;
    }
    
    .purchase-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 5px;
    }
    
    .purchase-table th {
      background: #fff;
      border-bottom: 1px solid #000;
      border-top: 1px solid #000;
      padding: 5px;
      text-align: center;
      font-weight: bold;
    }
    
    .purchase-table td {
      padding: 3px 5px;
      border-bottom: 1px solid #ddd;
    }
    
    .purchase-table .total-row {
      font-weight: bold;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
    }
    
    .footer {
      margin-top: 30px;
      page-break-inside: avoid;
      width: 100%;
    }
    
    .signature-row {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      page-break-inside: avoid;
      width: 100%;
    }
    
    .signature-box {
      width: 48%;
    }
    
    .signature-title {
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .signature-field {
      margin-bottom: 5px;
    }
    
    .signature-line {
      border-bottom: 1px solid #000;
      display: inline-block;
      width: 200px;
      height: 20px;
    }
    
    .bold {
      font-weight: bold;
    }
    
    @media print {
      body {
        margin: 0;
        padding: ${sizeConfig.padding};
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="company-name">${companyDetails.name || 'BERKAT PADI SDN BHD'}</div>
      <div class="company-info">
        ${companyDetails.address || 'LOT 14633 PKT 100, SUNGAI NIPAH, 45300 SUNGAI BESAR, SELANGOR'} No Tel: ${companyDetails.phone || '019-2499963'}
      </div>
      <div class="company-info">
        (Lesen Beli Padi: ${companyDetails.licence_no || companyDetails.license || 'N/A'})
      </div>
    </div>
    
    <div class="page-title">NOTA PENGHANTARAN PADI</div>
    
    <!-- Main Section with Left and Right Columns -->
    <div class="main-section">
      <!-- Left Column -->
      <div class="left-section">
        <div class="bold" style="margin-bottom: 5px;">PENGHANTARAN PADI KE</div>
        <div class="manufacturer-address">
          Pengurus,<br>
          ${salesTransaction.manufacturer_name || 'KILANG BERAS RAKYAT SEKINCHAN'},<br>
          ${salesTransaction.manufacturer_address || 'LOT 322'},<br>
          ${salesTransaction.manufacturer_postcode || '45400'} ${salesTransaction.manufacturer_city || 'SEKINCHAN'}<br>
          ${salesTransaction.manufacturer_state || 'SELANGOR'}
        </div>
        
        <div class="receipt-info">
          <div><span class="bold">NO RESIT PENGHANTARA</span> ${salesTransaction.sales_number || 'N/A'}</div>
          <div><span class="bold">TARIKH :</span> ${formatDate(salesTransaction.sale_date)}</div>
          <div><span class="bold">PRODUK :</span> ${salesTransaction.product_name || 'N/A'}</div>
        </div>
      </div>
      
      <!-- Right Column with Boxed Sections -->
      <div class="right-section">
        <!-- Driver Info Box -->
        <div class="info-box">
          <div class="box-title">Maklumat Pemandu Penghantaran :</div>
          <div class="info-row">Nama: ${salesTransaction.driver_name || ''}</div>
          <div class="info-row">No KP: -</div>
          <div class="info-row">No Pendaftaran Lori: ${salesTransaction.vehicle_number || ''}</div>
        </div>
        
        <!-- Weighing Info Box -->
        <div class="info-box">
          <div class="box-title">Maklumat Timbangan :</div>
          <div class="info-row"><span class="bold">TIMBANG MASUK : ${formatNumber(salesTransaction.tare_weight_kg, 2)} KG</span></div>
          <div class="info-row"><span class="bold">TIMBANG KELUAR : ${formatNumber(salesTransaction.gross_weight_kg, 2)} KG</span></div>
          <div class="info-row"><span class="bold">BERAT KASAR: ${formatNumber(salesTransaction.net_weight_kg, 2)} KG</span></div>
          <div class="info-row">Masa Masuk: ${formatTime(salesTransaction.sale_date)}</div>
          <div class="info-row">Masa Keluar: ${formatTime(salesTransaction.sale_date)}</div>
        </div>
      </div>
    </div>
    
    <!-- Purchase Receipts Table -->
    <div class="purchase-receipts-section">
      <table class="purchase-table">
        <thead>
          <tr>
            <th style="width: 5%;"></th>
            <th style="text-align: left;">NO RESIT</th>
            <th style="text-align: right;">B. KASAR</th>
            ${hasDeductions ? '<th style="text-align: right;">B. BERSIH</th>' : ''}
            ${hasDeductions ? '<th style="text-align: right;">PTG</th>' : ''}
            <th style="text-align: right;">HARGA</th>
            <th style="text-align: right;">AMAUN</th>
          </tr>
        </thead>
        <tbody>
          ${purchaseTableRows}
          <tr class="total-row">
            <td colspan="2" style="text-align: left; padding: 8px; border-top: 2px solid #000;"><span class="bold">Jumlah Berat Hantar</span></td>
            <td style="text-align: right; padding: 8px; border-top: 2px solid #000;">${formatNumber(totalBeratKasar, 2)} KG</td>
            ${hasDeductions ? `<td style="text-align: right; padding: 8px; border-top: 2px solid #000;">${formatNumber(totalBeratBersih, 2)} KG</td>` : ''}
            ${hasDeductions ? '<td style="border-top: 2px solid #000;"></td>' : ''}
            <td style="border-top: 2px solid #000;"></td>
            <td style="text-align: right; padding: 8px; border-top: 2px solid #000;"><span class="bold">${formatNumber(totalAmaun, 2)}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Footer Signatures -->
    <div class="footer">
      <div class="signature-row">
        <div class="signature-box">
          <div class="signature-title">Dihantar Oleh:</div>
          <div class="signature-field">Tanda tangan : <span class="signature-line"></span></div>
          <div class="signature-field">Nama : <span class="signature-line"></span></div>
        </div>
        <div class="signature-box">
          <div class="signature-title">Diterima dan disemak oleh:</div>
          <div class="signature-field">Tanda tangan : <span class="signature-line"></span></div>
          <div class="signature-field">Nama : <span class="signature-line"></span></div>
          <div class="signature-field">No KP : <span class="signature-line"></span></div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

module.exports = {
  generatePurchaseReceipt,
  generateSalesReceipt
};
