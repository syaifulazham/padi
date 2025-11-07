import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import AddFarmerModal from './AddFarmerModal';
import BulkUploadModal from './BulkUploadModal';

const Farmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

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
        message.error('Failed to load farmers');
      }
    } catch (error) {
      message.error('Error loading farmers');
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
      message.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Subsidy No.',
      dataIndex: 'farmer_code',
      key: 'farmer_code',
      width: 150,
    },
    {
      title: 'IC Number',
      dataIndex: 'ic_number',
      key: 'ic_number',
      width: 150,
    },
    {
      title: 'Full Name',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 120,
    },
    {
      title: 'Farm Size (ha)',
      dataIndex: 'farm_size_hectares',
      key: 'farm_size_hectares',
      width: 120,
      render: (val) => val ? parseFloat(val).toFixed(2) : '-'
    },
    {
      title: 'Status',
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
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => message.info('Edit feature coming soon')}
          >
            Edit
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => message.info('Delete feature coming soon')}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Search farmers..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          Search
        </Button>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setAddModalOpen(true)}
        >
          Add Farmer
        </Button>
        <Button 
          icon={<UploadOutlined />}
          onClick={() => setBulkUploadOpen(true)}
        >
          Bulk Upload
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={farmers}
        rowKey="farmer_id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showTotal: (total) => `Total ${total} farmers`,
        }}
      />

      {/* Add Farmer Modal */}
      <AddFarmerModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={loadFarmers}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onSuccess={loadFarmers}
      />
    </div>
  );
};

export default Farmers;
