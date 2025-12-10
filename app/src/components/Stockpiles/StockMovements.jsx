import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Row, Col, Statistic, Table, Tag, Space, Button, DatePicker, Select, message, Spin } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, InboxOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const StockMovements = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const productId = searchParams.get('productId');
  const productName = searchParams.get('productName');
  const productCode = searchParams.get('productCode');
  
  const [loading, setLoading] = useState(false);
  const [activeSeason, setActiveSeason] = useState(null);
  const [movements, setMovements] = useState([]);
  const [productSummary, setProductSummary] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: null,
    movementType: 'ALL'
  });

  useEffect(() => {
    if (!productId) {
      message.error('No product selected');
      navigate('/stockpiles');
      return;
    }
    loadActiveSeason();
  }, [productId]);

  useEffect(() => {
    if (activeSeason && productId) {
      loadProductSummary();
      loadMovements();
    }
  }, [activeSeason, productId, filters]);

  const loadActiveSeason = async () => {
    try {
      const result = await window.electronAPI.seasons?.getActive();
      if (result?.success && result.data) {
        setActiveSeason(result.data);
      } else {
        message.warning('No active season found');
      }
    } catch (error) {
      console.error('Failed to load active season:', error);
      message.error('Failed to load active season');
    }
  };

  const loadProductSummary = async () => {
    try {
      const result = await window.electronAPI.stockpiles?.getSummary(activeSeason.season_id);
      if (result?.success) {
        const product = result.data.find(p => p.product_id === parseInt(productId));
        setProductSummary(product);
      }
    } catch (error) {
      console.error('Failed to load product summary:', error);
    }
  };

  const loadMovements = async () => {
    if (!activeSeason) return;
    
    try {
      setLoading(true);
      const apiFilters = {};
      
      if (filters.dateRange && filters.dateRange.length === 2) {
        apiFilters.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        apiFilters.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }
      
      if (filters.movementType !== 'ALL') {
        apiFilters.movementType = filters.movementType;
      }
      
      const result = await window.electronAPI.stockpiles?.getProductMovements(
        activeSeason.season_id,
        parseInt(productId),
        apiFilters
      );
      
      if (result?.success) {
        setMovements(result.data || []);
      } else {
        message.error('Failed to load movements');
      }
    } catch (error) {
      console.error('Failed to load movements:', error);
      message.error('Failed to load movements');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'movement_type',
      key: 'movement_type',
      width: 120,
      fixed: 'left',
      render: (type) => (
        <Tag 
          color={type === 'PURCHASE' ? 'green' : 'orange'} 
          icon={type === 'PURCHASE' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        >
          {type}
        </Tag>
      ),
    },
    {
      title: 'Reference',
      dataIndex: 'reference_number',
      key: 'reference_number',
      width: 180,
    },
    {
      title: 'Date',
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      width: 160,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Party',
      key: 'party',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.party_name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.party_code}</div>
        </div>
      ),
    },
    {
      title: 'Weight',
      dataIndex: 'weight_kg',
      key: 'weight_kg',
      align: 'right',
      width: 150,
      render: (weight, record) => (
        <div style={{ color: record.movement_type === 'PURCHASE' ? '#52c41a' : '#ff4d4f', fontWeight: 500 }}>
          {record.movement_type === 'PURCHASE' ? '+' : '-'}{(weight / 1000).toFixed(3)} ton
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      width: 150,
      render: (amount) => `RM ${parseFloat(amount).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      title: 'Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'paid' ? 'green' : 'orange'}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/stockpiles')}
                  >
                    Back to Stockpiles
                  </Button>
                  <h2 style={{ margin: 0 }}>
                    <InboxOutlined style={{ marginRight: 8 }} />
                    Stock Movements - {productName}
                  </h2>
                  <Tag>{productCode}</Tag>
                  {activeSeason && (
                    <Tag color="green">
                      🌾 {activeSeason.season_name || `Season ${activeSeason.season_number}/${activeSeason.year}`}
                    </Tag>
                  )}
                </Space>
              </Col>
              <Col>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    loadProductSummary();
                    loadMovements();
                  }}
                >
                  Refresh
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Product Summary Cards */}
      {productSummary && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total Purchased"
                value={productSummary.total_purchased_ton}
                precision={3}
                suffix="ton"
                valueStyle={{ color: '#52c41a', fontSize: 24 }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                {productSummary.purchase_count} transactions
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total Sold"
                value={productSummary.total_sold_ton}
                precision={3}
                suffix="ton"
                valueStyle={{ color: '#ff4d4f', fontSize: 24 }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                {productSummary.sales_count} transactions
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Current Stock"
                value={productSummary.current_stock_ton}
                precision={3}
                suffix="ton"
                valueStyle={{ color: '#1890ff', fontSize: 24, fontWeight: 700 }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                {productSummary.current_stock_kg.toFixed(2)} kg
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <RangePicker
            value={filters.dateRange}
            onChange={(dates) => handleFilterChange('dateRange', dates)}
            format="DD/MM/YYYY"
            placeholder={['Start Date', 'End Date']}
          />
          <Select
            value={filters.movementType}
            onChange={(value) => handleFilterChange('movementType', value)}
            style={{ width: 180 }}
          >
            <Select.Option value="ALL">All Movements</Select.Option>
            <Select.Option value="PURCHASE">Purchases Only</Select.Option>
            <Select.Option value="SALE">Sales Only</Select.Option>
          </Select>
          {(filters.dateRange || filters.movementType !== 'ALL') && (
            <Button
              onClick={() => setFilters({ dateRange: null, movementType: 'ALL' })}
            >
              Clear Filters
            </Button>
          )}
        </Space>
      </Card>

      {/* Movements Table */}
      <Card title={`Movement History (${movements.length} records)`}>
        <Table
          columns={columns}
          dataSource={movements}
          rowKey={(record) => `${record.movement_type}-${record.transaction_id}`}
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} movements`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default StockMovements;
