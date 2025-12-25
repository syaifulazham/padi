import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Input, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import AddManufacturerModal from './AddManufacturerModal';
import { useI18n } from '../../i18n/I18nProvider';

const Manufacturers = () => {
  const { t } = useI18n();
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState(null);

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
        message.error(t('manufacturers.loadFailed'));
      }
    } catch (error) {
      message.error(t('manufacturers.loadError'));
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
      message.error(t('manufacturers.searchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (manufacturer) => {
    setEditingManufacturer(manufacturer);
    setAddModalOpen(true);
  };

  const handleModalClose = () => {
    setAddModalOpen(false);
    setEditingManufacturer(null);
  };

  const columns = [
    {
      title: t('manufacturers.columns.companyName'),
      dataIndex: 'company_name',
      key: 'company_name',
      width: 200,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: t('manufacturers.columns.registrationNo'),
      dataIndex: 'registration_number',
      key: 'registration_number',
      width: 150,
    },
    {
      title: t('manufacturers.columns.contactPerson'),
      dataIndex: 'contact_person',
      key: 'contact_person',
      width: 150,
    },
    {
      title: t('manufacturers.columns.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: t('manufacturers.columns.email'),
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: t('manufacturers.columns.city'),
      dataIndex: 'city',
      key: 'city',
      width: 120,
    },
    {
      title: t('manufacturers.columns.code'),
      dataIndex: 'manufacturer_code',
      key: 'manufacturer_code',
      width: 100,
    },
    {
      title: t('manufacturers.columns.status'),
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
      title: t('manufacturers.columns.actions'),
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {t('manufacturers.actions.edit')}
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => message.info(t('manufacturers.actions.deleteComingSoon'))}
          >
            {t('manufacturers.actions.delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder={t('manufacturers.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          {t('manufacturers.search')}
        </Button>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setAddModalOpen(true)}
        >
          {t('manufacturers.addManufacturer')}
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
          showTotal: (total) => t('manufacturers.paginationTotal').replace('{total}', total),
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
      />

      {/* Add/Edit Manufacturer Modal */}
      <AddManufacturerModal
        open={addModalOpen}
        onClose={handleModalClose}
        onSuccess={loadManufacturers}
        editingManufacturer={editingManufacturer}
      />
    </div>
  );
};

export default Manufacturers;
