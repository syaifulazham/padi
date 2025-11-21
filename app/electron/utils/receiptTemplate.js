/**
 * Generate HTML receipt for purchase transactions
 * Matches the physical receipt layout from BERKAT PADI SDN BHD
 */

/**
 * Get paper size configuration
 */
function getPaperSizeConfig(paperSize) {
  const configs = {
    '80mm': {
      pageWidth: '80mm',
      pageHeight: 'auto',
      fontSize: '10px',
      companyNameSize: '14px',
      receiptNumberSize: '16px',
      padding: '5mm'
    },
    'a4_portrait': {
      pageWidth: '210mm',
      pageHeight: '297mm',
      fontSize: '12px',
      companyNameSize: '18px',
      receiptNumberSize: '20px',
      padding: '15mm'
    },
    'a5_landscape': {
      pageWidth: '210mm',
      pageHeight: '148mm',
      fontSize: '11px',
      companyNameSize: '16px',
      receiptNumberSize: '18px',
      padding: '10mm'
    }
  };
  
  return configs[paperSize] || configs['80mm'];
}

function formatNumber(num, decimals = 2) {
  return parseFloat(num).toLocaleString('en-MY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB');
}

function formatTime(dateString) {
  const date = new Date(dateString);
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
      size: ${sizeConfig.pageWidth} ${sizeConfig.pageHeight};
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
      width: ${sizeConfig.pageWidth};
      padding: ${sizeConfig.padding};
      color: #000;
    }
    
    .header {
      text-align: left;
      margin-bottom: 8px;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
    }
    
    .company-name {
      font-weight: bold;
      font-size: ${sizeConfig.companyNameSize};
      margin-bottom: 2px;
    }
    
    .company-info {
      font-size: calc(${sizeConfig.fontSize} * 0.9);
      line-height: 1.2;
    }
    
    .right-header {
      text-align: right;
      float: right;
      margin-top: -60px;
    }
    
    .location {
      font-size: ${sizeConfig.fontSize};
      margin-bottom: 3px;
    }
    
    .receipt-number {
      font-size: ${sizeConfig.receiptNumberSize};
      font-weight: bold;
    }
    
    .title {
      font-weight: bold;
      margin: 8px 0 5px 0;
      font-size: 11px;
    }
    
    .details-section {
      margin-bottom: 8px;
    }
    
    .row {
      display: flex;
      margin-bottom: 2px;
    }
    
    .row-split {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    
    .label {
      width: 120px;
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
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 5px 0;
    }
    
    .weight-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    
    .weight-label {
      width: 50%;
    }
    
    .weight-value {
      width: 50%;
      text-align: right;
    }
    
    .deduction-note {
      font-size: 8px;
      font-style: italic;
      margin-left: 10px;
    }
    
    .net-weight {
      font-weight: bold;
      font-size: 11px;
      margin-top: 3px;
      padding-bottom: 5px;
    }
    
    .footer {
      margin-top: 15px;
    }
    
    .signature-row {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }
    
    .signature-box {
      text-align: center;
      width: 30%;
    }
    
    .signature-line {
      border-bottom: 1px solid #000;
      height: 30px;
      margin-bottom: 3px;
    }
    
    .signature-label {
      font-size: 8px;
    }
    
    .bold {
      font-weight: bold;
    }
    
    @media print {
      body {
        margin: 0;
        padding: ${sizeConfig.padding};
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="company-name">${companyDetails.name || 'BERKAT PADI SDN BHD'}</div>
    <div class="company-info">
      ${companyDetails.address || 'LOT 14633 PKT 100 SAWAH, SUNGAI NIPAH<br>45300 SUNGAI BESAR, SELANGOR'}<br>
      Tel:${companyDetails.phone || '019249396301323396636'}<br>
      Lesen Belian Padi : ${companyDetails.licence_no || companyDetails.license || 'E6380'}
    </div>
  </div>
  
  <div class="right-header">
    <div class="location">Kawasan: ${season.location || companyDetails.location || 'PANCHANG BEDENA'}</div>
    <div class="receipt-number">${transaction.receipt_number}</div>
  </div>
  
  <div style="clear: both;"></div>
  
  <!-- Title -->
  <div class="title">Resit Belian</div>
  
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
          <span>: ${transaction.giro || ''}</span>
        </div>
        <div class="row">
          <span>BPM</span>
          <span>: ${transaction.bpm || '.-'}</span>
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
    
    <div class="net-weight">
      <div class="weight-row">
        <div class="weight-label">
          <span>BERAT BERSIH</span>
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
</body>
</html>
  `.trim();
}

module.exports = {
  generatePurchaseReceipt
};
