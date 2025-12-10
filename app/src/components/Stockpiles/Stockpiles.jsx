import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Table, Tag, Space, Button, message, Alert } from 'antd';
import { ReloadOutlined, EyeOutlined, WarningOutlined, InboxOutlined, ShoppingCartOutlined, ShopOutlined } from '@ant-design/icons';

const Stockpiles = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stockpiles, setStockpiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeSeason, setActiveSeason] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  useEffect(() => {
    loadActiveSeason();
  }, []);

  useEffect(() => {
    if (activeSeason) {
      loadStockpiles();
      loadStats();
      loadLowStockAlerts();
    }
  }, [activeSeason]);

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

  const loadStockpiles = async () => {
    if (!activeSeason) return;
    
    try {
      setLoading(true);
      const result = await window.electronAPI.stockpiles?.getSummary(activeSeason.season_id);
      if (result?.success) {
        setStockpiles(result.data || []);
      } else {
        message.error('Failed to load stockpiles');
      }
    } catch (error) {
      console.error('Failed to load stockpiles:', error);
      message.error('Failed to load stockpiles');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!activeSeason) return;
    
    try {
      const result = await window.electronAPI.stockpiles?.getStats(activeSeason.season_id);
      if (result?.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadLowStockAlerts = async () => {
    if (!activeSeason) return;
    
    try {
      const result = await window.electronAPI.stockpiles?.getLowStockAlerts(activeSeason.season_id, 1000);
      if (result?.success) {
        setLowStockAlerts(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load low stock alerts:', error);
    }
  };

  const viewMovements = (product) => {
    navigate(`/stockpiles/movements?productId=${product.product_id}&productName=${encodeURIComponent(product.product_name)}&productCode=${encodeURIComponent(product.product_code)}`);
  };

  const columns = [
    {
      title: 'Product',
      key: 'product',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.product_type === 'BERAS' ? '🌾' : '🌱'} {record.variety === 'WANGI' ? '✨' : ''} {record.product_name}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.product_code}</div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'product_type',
      key: 'product_type',
      width: 100,
      render: (type) => (
        <Tag color={type === 'BERAS' ? 'green' : 'orange'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Variety',
      dataIndex: 'variety',
      key: 'variety',
      width: 100,
      render: (variety) => (
        <Tag color={variety === 'WANGI' ? 'purple' : 'default'}>
          {variety}
        </Tag>
      ),
    },
    {
      title: 'Purchased',
      key: 'purchased',
      align: 'right',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, color: '#52c41a' }}>
            {record.total_purchased_ton.toFixed(3)} ton
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.purchase_count} transactions
          </div>
        </div>
      ),
    },
    {
      title: 'Sold',
      key: 'sold',
      align: 'right',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, color: '#ff4d4f' }}>
            {record.total_sold_ton.toFixed(3)} ton
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.sales_count} transactions
          </div>
        </div>
      ),
    },
    {
      title: 'Current Stock',
      key: 'stock',
      align: 'right',
      render: (_, record) => {
        const isLow = record.current_stock_kg < 1000;
        return (
          <div>
            <div style={{ fontWeight: 600, color: isLow ? '#ff4d4f' : '#1890ff', fontSize: 16 }}>
              {isLow && <WarningOutlined style={{ marginRight: 4 }} />}
              {record.current_stock_ton.toFixed(3)} ton
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>
              {record.current_stock_kg.toFixed(2)} kg
            </div>
          </div>
        );
      },
    },
    {
      title: 'Stock Value',
      key: 'value',
      align: 'right',
      render: (_, record) => (
        <div>
          {record.current_price_per_ton ? (
            <>
              <div style={{ fontWeight: 500, color: '#52c41a' }}>
                RM {record.stock_value.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                @ RM {parseFloat(record.current_price_per_ton).toFixed(2)}/ton
              </div>
            </>
          ) : (
            <Tag>No price set</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => viewMovements(record)}
        >
          View
        </Button>
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
                  <h2 style={{ margin: 0 }}>
                    📦 Stockpiles Management
                  </h2>
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
                    loadStockpiles();
                    loadStats();
                    loadLowStockAlerts();
                  }}
                >
                  Refresh
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Statistics Cards */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Purchased"
                value={stats.total_purchased_ton}
                precision={3}
                suffix="ton"
                prefix={<ShoppingCartOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                {stats.total_purchase_transactions} transactions
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Sold"
                value={stats.total_sold_ton}
                precision={3}
                suffix="ton"
                prefix={<ShopOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                {stats.total_sale_transactions} transactions
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Current Stock"
                value={stats.current_stock_ton}
                precision={3}
                suffix="ton"
                prefix={<InboxOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontWeight: 700 }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                {stats.current_stock_kg.toFixed(2)} kg
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Turnover Rate"
                value={stats.turnover_rate}
                precision={2}
                suffix="%"
                valueStyle={{ color: stats.turnover_rate > 50 ? '#52c41a' : '#faad14' }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                Sold / Purchased
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <Alert
          message={`Low Stock Alert: ${lowStockAlerts.length} product(s) below 1000 kg`}
          description={
            <Space wrap>
              {lowStockAlerts.map(item => (
                <Tag key={item.product_id} color="warning">
                  {item.product_name}: {item.current_stock_kg.toFixed(2)} kg
                </Tag>
              ))}
            </Space>
          }
          type="warning"
          icon={<WarningOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Stockpiles Table */}
      <Card title="Stockpiles by Product">
        <Table
          columns={columns}
          dataSource={stockpiles}
          rowKey="product_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} products`,
          }}
        />
      </Card>
    </div>
  );
};

export default Stockpiles;
