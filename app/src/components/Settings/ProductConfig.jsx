import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Tag, Statistic, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const ProductConfig = () => {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProducts();
    loadInventory();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.products.getAll();
      if (result?.success) {
        setProducts(result.data);
      } else {
        message.error('Failed to load products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    try {
      const result = await window.electronAPI.products.getInventorySummary();
      if (result?.success) {
        setInventory(result.data);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const handleAdd = () => {
    setModalMode('create');
    setSelectedProduct(null);
    form.resetFields();
    form.setFieldsValue({
      product_type: 'BERAS',
      variety: 'BIASA',
      is_active: 1
    });
    setModalVisible(true);
  };

  const handleEdit = (product) => {
    setModalMode('edit');
    setSelectedProduct(product);
    form.setFieldsValue({
      product_code: product.product_code,
      product_name: product.product_name,
      product_type: product.product_type,
      variety: product.variety,
      description: product.description,
      is_active: product.is_active
    });
    setModalVisible(true);
  };

  const handleDelete = async (productId) => {
    try {
      const result = await window.electronAPI.products.delete(productId);
      if (result?.success) {
        message.success('Product deleted successfully');
        loadProducts();
        loadInventory();
      } else {
        message.error(result?.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      message.error('Failed to delete product');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let result;
      if (modalMode === 'create') {
        result = await window.electronAPI.products.create(values);
      } else {
        result = await window.electronAPI.products.update(selectedProduct.product_id, values);
      }

      if (result?.success) {
        message.success(`Product ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
        setModalVisible(false);
        form.resetFields();
        loadProducts();
        loadInventory();
      } else {
        message.error(result?.error || `Failed to ${modalMode} product`);
      }
    } catch (error) {
      console.error(`Error ${modalMode} product:`, error);
      message.error(`Failed to ${modalMode} product`);
    } finally {
      setLoading(false);
    }
  };

  const getInventoryForProduct = (productId) => {
    const inv = inventory.find(i => i.product_id === productId);
    return inv ? parseFloat(inv.current_stock_kg || 0) : 0;
  };

  const columns = [
    {
      title: 'Product Code',
      dataIndex: 'product_code',
      key: 'product_code',
      width: 120,
      render: (code) => <Tag color="blue">{code}</Tag>
    },
    {
      title: 'Product Name',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 250
    },
    {
      title: 'Type',
      dataIndex: 'product_type',
      key: 'product_type',
      width: 100,
      render: (type) => (
        <Tag color={type === 'BERAS' ? 'green' : 'orange'}>
          {type === 'BERAS' ? '🌾 Beras' : '🌱 Benih'}
        </Tag>
      )
    },
    {
      title: 'Variety',
      dataIndex: 'variety',
      key: 'variety',
      width: 100,
      render: (variety) => (
        <Tag color={variety === 'WANGI' ? 'purple' : 'default'}>
          {variety === 'WANGI' ? '✨ Wangi' : 'Biasa'}
        </Tag>
      )
    },
    {
      title: 'Current Stock',
      key: 'stock',
      width: 150,
      align: 'right',
      render: (_, record) => {
        const stock = getInventoryForProduct(record.product_id);
        return (
          <span style={{ 
            fontWeight: 600,
            color: stock > 0 ? '#52c41a' : '#999'
          }}>
            {stock.toFixed(2)} kg
          </span>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
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
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Product"
            description="Are you sure you want to delete this product? This will fail if there are LIVE transactions."
            onConfirm={() => handleDelete(record.product_id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Calculate total inventory
  const totalStock = inventory.reduce((sum, item) => 
    sum + parseFloat(item.current_stock_kg || 0), 0
  );

  return (
    <div>
      <Card
        title={
          <Space>
            <InboxOutlined style={{ fontSize: 24 }} />
            <span>Paddy Product Configuration</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="large"
          >
            Add Product
          </Button>
        }
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Products"
                value={products.length}
                prefix={<InboxOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Active Products"
                value={products.filter(p => p.is_active).length}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Stock"
                value={totalStock.toFixed(2)}
                suffix="kg"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={products}
          rowKey="product_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} products`
          }}
        />
      </Card>

      {/* Add/Edit Product Modal */}
      <Modal
        title={modalMode === 'create' ? 'Add New Product' : 'Edit Product'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={600}
        okText={modalMode === 'create' ? 'Create' : 'Update'}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="product_code"
            label="Product Code"
            rules={[
              { required: true, message: 'Please enter product code' },
              { pattern: /^[A-Z0-9-]+$/, message: 'Use uppercase letters, numbers, and hyphens only' }
            ]}
          >
            <Input 
              placeholder="e.g., PB-BIASA" 
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>

          <Form.Item
            name="product_name"
            label="Product Name"
            rules={[{ required: true, message: 'Please enter product name' }]}
          >
            <Input placeholder="e.g., Padi Beras (Biasa)" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="product_type"
                label="Product Type"
                rules={[{ required: true, message: 'Please select type' }]}
              >
                <Select placeholder="Select type">
                  <Option value="BERAS">🌾 Beras (Rice)</Option>
                  <Option value="BENIH">🌱 Benih (Seed)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="variety"
                label="Variety"
                rules={[{ required: true, message: 'Please select variety' }]}
              >
                <Select placeholder="Select variety">
                  <Option value="BIASA">Biasa (Regular)</Option>
                  <Option value="WANGI">✨ Wangi (Fragrant)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea 
              rows={3} 
              placeholder="Optional description"
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select>
              <Option value={1}>Active</Option>
              <Option value={0}>Inactive</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductConfig;
