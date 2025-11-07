import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Input, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';

const Manufacturers = () => {
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadManufacturers();
  }, []);

  const loadManufacturers = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.manufacturers.getAll();
      if (result.success) {
        setManufacturers(result.data);
      } else {
        message.error('Failed to load manufacturers');
      }
    } catch (error) {
      message.error('Error loading manufacturers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchText.trim()) {
      loadManufacturers();
      return;
    }
    
    setLoading(true);
    try {
      const filtered = manufacturers.filter(m => 
        m.company_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        m.registration_number?.toLowerCase().includes(searchText.toLowerCase()) ||
        m.contact_person?.toLowerCase().includes(searchText.toLowerCase())
      );
      setManufacturers(filtered);
    } catch (error) {
      message.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Company Name',
      dataIndex: 'company_name',
      key: 'company_name',
      width: 200,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Registration No.',
      dataIndex: 'registration_number',
      key: 'registration_number',
      width: 150,
    },
    {
      title: 'Contact Person',
      dataIndex: 'contact_person',
      key: 'contact_person',
      width: 150,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 120,
    },
    {
      title: 'Code',
      dataIndex: 'manufacturer_code',
      key: 'manufacturer_code',
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
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
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search manufacturers..."
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
          onClick={() => message.info('Add manufacturer feature coming soon')}
        >
          Add Manufacturer
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={manufacturers}
        rowKey="manufacturer_id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 20,
          showTotal: (total) => `Total ${total} manufacturers`,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
      />
    </div>
  );
};

export default Manufacturers;
