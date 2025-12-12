import React, { useState } from 'react';
import { Modal, Upload, Button, Steps, Table, Select, message, Alert, Space } from 'antd';
import { UploadOutlined, DownloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Step } = Steps;
const { Option } = Select;

const BulkUploadModal = ({ open, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fileData, setFileData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mappedColumns, setMappedColumns] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Required fields mapping
  const requiredFields = {
    farmer_code: { label: 'Subsidy No.', required: true },
    ic_number: { label: 'IC Number', required: true },
    full_name: { label: 'Full Name', required: true },
    phone: { label: 'Phone', required: false },
    date_of_birth: { label: 'Date of Birth', required: false },
    address: { label: 'Address', required: false },
    postcode: { label: 'Postcode', required: false },
    city: { label: 'City', required: false },
    state: { label: 'State', required: false },
    bank_name: { label: 'Bank Name', required: false },
    bank_account_number: { label: 'Bank Account Number', required: false },
    bank2_name: { label: 'Bank Name 2', required: false },
    bank2_account_number: { label: 'Bank Account Number 2', required: false },
    farm_size_acres: { label: 'Farm Size (Acres)', required: false },
    status: { label: 'Status', required: false },
    notes: { label: 'Notes', required: false },
  };

  // Download CSV template
  const downloadCSVTemplate = () => {
    const headers = Object.keys(requiredFields).join(',');
    const example = 'B001/11711,850101015678,Ahmad bin Abdullah,0123456789,1985-01-01,Jalan Merdeka,12345,Kuala Lumpur,Selangor,Maybank,1234567890,CIMB,9876543210,5.5,active,Subsidy coupon holder';
    const csv = headers + '\n' + example;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'farmers_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    message.success('CSV template downloaded');
  };

  // Download Excel template
  const downloadExcelTemplate = () => {
    const ws_data = [
      Object.values(requiredFields).map(f => f.label),
      ['B001/11711', '850101015678', 'Ahmad bin Abdullah', '0123456789', '1985-01-01', 
       'Jalan Merdeka', '12345', 'Kuala Lumpur', 'Selangor', 'Maybank', '1234567890', 'CIMB', '9876543210', '5.5', 'active', 'Subsidy coupon holder']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Farmers');
    XLSX.writeFile(wb, 'farmers_template.xlsx');
    message.success('Excel template downloaded');
  };

  // Handle file upload
  const handleFileUpload = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          message.error('File must contain headers and at least one row of data');
          return;
        }
        
        const fileHeaders = jsonData[0];
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));
        
        setHeaders(fileHeaders);
        setFileData(rows);
        setCurrentStep(1);
        
        // Auto-map columns if they match
        const autoMapping = {};
        fileHeaders.forEach((header, index) => {
          const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
          Object.keys(requiredFields).forEach(field => {
            if (normalizedHeader.includes(field.replace(/_/g, '')) || 
                header.toLowerCase() === requiredFields[field].label.toLowerCase()) {
              autoMapping[field] = index;
            }
          });
        });
        setMappedColumns(autoMapping);
        
        message.success(`File loaded: ${rows.length} rows found`);
      } catch (error) {
        message.error('Error reading file: ' + error.message);
      }
    };
    
    reader.readAsArrayBuffer(file);
    return false; // Prevent auto upload
  };

  // Handle column mapping change
  const handleMappingChange = (field, headerIndex) => {
    setMappedColumns(prev => ({
      ...prev,
      [field]: headerIndex
    }));
  };

  // Handle multi-column mapping for address
  const handleAddressMultiChange = (selectedIndices) => {
    setMappedColumns(prev => ({
      ...prev,
      address: selectedIndices
    }));
  };

  // Generate preview
  const generatePreview = () => {
    if (!fileData || Object.keys(mappedColumns).length === 0) {
      message.warning('Please map at least the required fields');
      return;
    }

    // Check required fields
    const missingRequired = Object.keys(requiredFields)
      .filter(field => requiredFields[field].required && mappedColumns[field] === undefined);
    
    if (missingRequired.length > 0) {
      message.error(`Missing required fields: ${missingRequired.join(', ')}`);
      return;
    }

    const preview = fileData.slice(0, 10).map((row, index) => {
      const mappedRow = { key: index };
      Object.keys(mappedColumns).forEach(field => {
        const colIndex = mappedColumns[field];
        
        // Handle multi-column concatenation for address
        if (field === 'address' && Array.isArray(colIndex)) {
          const addressParts = colIndex
            .map(idx => row[idx])
            .filter(val => val !== undefined && val !== '')
            .map(val => String(val).trim());
          mappedRow[field] = addressParts.join(', ');
        } else {
          mappedRow[field] = row[colIndex] !== undefined ? row[colIndex] : '';
        }
      });
      return mappedRow;
    });

    setPreviewData(preview);
    setCurrentStep(2);
  };

  // Handle import
  const handleImport = async () => {
    setLoading(true);
    try {
      const farmersToImport = fileData.map(row => {
        const farmer = {};
        Object.keys(mappedColumns).forEach(field => {
          const colIndex = mappedColumns[field];
          let value;
          
          // Handle multi-column concatenation for address
          if (field === 'address' && Array.isArray(colIndex)) {
            const addressParts = colIndex
              .map(idx => row[idx])
              .filter(val => val !== undefined && val !== '')
              .map(val => String(val).trim());
            value = addressParts.length > 0 ? addressParts.join(', ') : null;
          } else {
            value = row[colIndex];
          }
          
          // Convert empty strings to null
          if (value === '' || value === undefined) {
            value = null;
          }
          
          // Convert farm_size to number
          if (field === 'farm_size_acres' && value !== null) {
            value = parseFloat(value);
          }
          
          // Auto-format IC number to 000000-00-0000
          if (field === 'ic_number' && value !== null) {
            const digitsOnly = String(value).replace(/\D/g, '');
            if (digitsOnly.length === 12) {
              value = `${digitsOnly.slice(0, 6)}-${digitsOnly.slice(6, 8)}-${digitsOnly.slice(8, 12)}`;
            }
          }
          
          farmer[field] = value;
        });
        
        // Set defaults
        if (!farmer.status) farmer.status = 'active';
        if (!farmer.farm_size_acres) farmer.farm_size_acres = 0;
        
        return farmer;
      });

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < farmersToImport.length; i++) {
        try {
          const result = await window.electronAPI.farmers.create(farmersToImport[i]);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            errors.push(`Row ${i + 2}: ${result.error}`);
          }
        } catch (error) {
          errorCount++;
          errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }

      if (successCount > 0) {
        message.success(`Successfully imported ${successCount} farmers`);
      }
      
      if (errorCount > 0) {
        message.warning(`${errorCount} farmers failed to import. Check console for details.`);
        console.error('Import errors:', errors);
      }

      if (successCount > 0) {
        onSuccess();
        handleClose();
      }
    } catch (error) {
      message.error('Import failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset and close
  const handleClose = () => {
    setCurrentStep(0);
    setFileData(null);
    setHeaders([]);
    setMappedColumns({});
    setPreviewData([]);
    setLoading(false);
    onClose();
  };

  // Preview table columns
  const previewColumns = Object.keys(mappedColumns).map(field => ({
    title: requiredFields[field].label,
    dataIndex: field,
    key: field,
    width: 150,
  }));

  return (
    <Modal
      title="Bulk Upload Farmers"
      open={open}
      onCancel={handleClose}
      width={1000}
      footer={null}
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title="Upload File" icon={<UploadOutlined />} />
        <Step title="Map Columns" icon={<CheckCircleOutlined />} />
        <Step title="Preview & Import" icon={<CheckCircleOutlined />} />
      </Steps>

      {/* Step 1: Upload File */}
      {currentStep === 0 && (
        <div>
          <Alert
            message="Download Template First"
            description="Download the template, fill it with your data, then upload it back. The uploaded file can have different column names - you'll map them in the next step."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <div style={{
            background: '#fafafa',
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: 24
          }}>
            <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: '14px', fontWeight: 600 }}>
              📋 Download Template
            </h4>
            <Space size="middle">
              <Button 
                icon={<DownloadOutlined />} 
                onClick={downloadExcelTemplate}
                type="primary"
                size="large"
              >
                Download Excel Template
              </Button>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={downloadCSVTemplate}
                size="large"
              >
                Download CSV Template
              </Button>
            </Space>
          </div>

          <div style={{
            background: '#fafafa',
            border: '1px dashed #d9d9d9',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: 12, fontSize: '14px', fontWeight: 600 }}>
              📤 Upload Your File
            </h4>
            <Upload
              accept=".csv,.xlsx,.xls"
              beforeUpload={handleFileUpload}
              maxCount={1}
              showUploadList={true}
            >
              <Button icon={<UploadOutlined />} size="large" type="dashed" block>
                Click to Upload CSV or Excel File
              </Button>
            </Upload>
          </div>
        </div>
      )}

      {/* Step 2: Map Columns */}
      {currentStep === 1 && (
        <div>
          <Alert
            message="Map Your Columns"
            description="Match your file columns to the required fields. Red fields are required."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {Object.keys(requiredFields).map(field => (
              <div key={field} style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 200, fontWeight: 'bold' }}>
                  {requiredFields[field].label}
                  {requiredFields[field].required && <span style={{ color: 'red' }}> *</span>}
                  {field === 'address' && <div style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>Multi-select</div>}
                </div>
                {field === 'address' ? (
                  <Select
                    mode="multiple"
                    style={{ flex: 1 }}
                    placeholder="Select one or more columns to concatenate"
                    value={mappedColumns[field]}
                    onChange={handleAddressMultiChange}
                    allowClear
                  >
                    {headers.map((header, index) => (
                      <Option key={index} value={index}>
                        {header} (Column {index + 1})
                      </Option>
                    ))}
                  </Select>
                ) : (
                  <Select
                    style={{ flex: 1 }}
                    placeholder="Select column from your file"
                    value={mappedColumns[field]}
                    onChange={(value) => handleMappingChange(field, value)}
                    allowClear
                  >
                    {headers.map((header, index) => (
                      <Option key={index} value={index}>
                        {header} (Column {index + 1})
                      </Option>
                    ))}
                  </Select>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCurrentStep(0)}>Back</Button>
              <Button type="primary" onClick={generatePreview}>
                Next: Preview Data
              </Button>
            </Space>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Import */}
      {currentStep === 2 && (
        <div>
          <Alert
            message={`Preview: Showing first ${previewData.length} of ${fileData.length} rows`}
            description="Review the data before importing. Click Import to proceed."
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Table
            columns={previewColumns}
            dataSource={previewData}
            scroll={{ x: 1000 }}
            pagination={false}
            size="small"
          />

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCurrentStep(1)}>Back</Button>
              <Button 
                type="primary" 
                loading={loading}
                onClick={handleImport}
              >
                Import {fileData.length} Farmers
              </Button>
            </Space>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default BulkUploadModal;
