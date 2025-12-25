import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UploadOutlined, ScanOutlined } from '@ant-design/icons';
import AddFarmerModal from './AddFarmerModal';
import BulkUploadModal from './BulkUploadModal';
import QRScannerModal from './QRScannerModal';
import { useI18n } from '../../i18n/I18nProvider';

const Farmers = () => {
  const { t } = useI18n();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);

  useEffect(() => {
    loadFarmers();
  }, []);

  const loadFarmers = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.farmers.getAll();
      if (result.success) {
        setFarmers(result.data);
      } else {
        message.error(t('farmers.loadFailed'));
      }
    } catch (error) {
      message.error(t('farmers.loadError'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      loadFarmers();
      return;
    }
    
    setLoading(true);
    try {
      const result = await window.electronAPI.farmers.search(searchText);
      if (result.success) {
        setFarmers(result.data);
      }
    } catch (error) {
      message.error(t('farmers.searchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (qrCode) => {
    setScannerOpen(false);
    setLoading(true);
    
    try {
      console.log('Searching farmer by QR code:', qrCode);
      const result = await window.electronAPI.farmerDocuments.findByHashcode(qrCode);
      
      if (result.success) {
        message.success(
          t('farmers.found')
            .replace('{fullName}', result.data.full_name)
            .replace('{farmerCode}', result.data.farmer_code)
        );
        
        // Get the full farmer details
        const farmerResult = await window.electronAPI.farmers.getById(result.data.farmer_id);
        
        if (farmerResult.success) {
          // Automatically filter to show only this farmer
          setFarmers([farmerResult.data]);
          setSearchText(result.data.farmer_code);
        } else {
          message.warning(t('farmers.couldNotLoadDetails'));
          loadFarmers();
        }
      } else {
        message.warning(t('farmers.notFoundQr'));
      }
    } catch (error) {
      console.error('Error searching by QR code:', error);
      message.error(t('farmers.searchByQrFailed').replace('{error}', error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (farmer) => {
    setEditingFarmer(farmer);
    setAddModalOpen(true);
  };

  const handleModalClose = () => {
    setAddModalOpen(false);
    setEditingFarmer(null);
  };

  const columns = [
    {
      title: t('farmers.columns.subsidyNo'),
      dataIndex: 'farmer_code',
      key: 'farmer_code',
      width: 150,
    },
    {
      title: t('farmers.columns.icNumber'),
      dataIndex: 'ic_number',
      key: 'ic_number',
      width: 150,
    },
    {
      title: t('farmers.columns.fullName'),
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: t('farmers.columns.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: t('farmers.columns.city'),
      dataIndex: 'city',
      key: 'city',
      width: 120,
    },
    {
      title: t('farmers.columns.farmSizeAcres'),
      dataIndex: 'farm_size_acres',
      key: 'farm_size_acres',
      width: 120,
      render: (val) => val ? parseFloat(val).toFixed(2) : '-'
    },
    {
      title: t('farmers.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <span style={{
          color: status === 'active' ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {status.toUpperCase()}
        </span>
      )
    },
    {
      title: t('farmers.columns.actions'),
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {t('farmers.actions.edit')}
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => message.info(t('farmers.actions.deleteComingSoon'))}
          >
            {t('farmers.actions.delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ 
        marginBottom: 16, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <Space>
          <Input
            placeholder={t('farmers.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 300 }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            {t('farmers.search')}
          </Button>
          <Button 
            icon={<ScanOutlined />} 
            onClick={() => setScannerOpen(true)}
            title={t('farmers.scanQrTitle')}
          >
            {t('farmers.scanQr')}
          </Button>
        </Space>
        
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setAddModalOpen(true)}
          >
            {t('farmers.addFarmer')}
          </Button>
          <Button 
            icon={<UploadOutlined />}
            onClick={() => setBulkUploadOpen(true)}
          >
            {t('farmers.bulkUpload')}
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={farmers}
        rowKey="farmer_id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showTotal: (total) => t('farmers.paginationTotal').replace('{total}', total),
        }}
      />

      {/* Add Farmer Modal */}
      <AddFarmerModal
        open={addModalOpen}
        onClose={handleModalClose}
        onSuccess={loadFarmers}
        editingFarmer={editingFarmer}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onSuccess={loadFarmers}
      />

      {/* QR Scanner Modal */}
      <QRScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleQRScan}
      />
    </div>
  );
};

export default Farmers;
