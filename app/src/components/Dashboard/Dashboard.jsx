import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table } from 'antd';
import {
  TeamOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  DollarOutlined,
} from '@ant-design/icons';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalFarmers: 0,
    todayPurchases: 0,
    currentStock: 0,
    totalAmount: 0
  });

  const [recentPurchases, setRecentPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load recent purchases
      const result = await window.electronAPI.purchases.getAll({ limit: 10 });
      if (result.success) {
        setRecentPurchases(result.data);
        
        // Calculate today's purchases
        const today = new Date().toISOString().split('T')[0];
        const todayData = result.data.filter(p => 
          p.transaction_date.startsWith(today)
        );
        
        setStats({
          totalFarmers: 5, // You can fetch this from farmers API
          todayPurchases: todayData.length,
          currentStock: 6500, // From inventory
          totalAmount: todayData.reduce((sum, p) => sum + parseFloat(p.total_amount), 0)
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Receipt',
      dataIndex: 'receipt_number',
      key: 'receipt_number',
    },
    {
      title: 'Farmer',
      dataIndex: 'farmer_name',
      key: 'farmer_name',
    },
    {
      title: 'Grade',
      dataIndex: 'grade_name',
      key: 'grade_name',
    },
    {
      title: 'Weight (kg)',
      dataIndex: 'net_weight_kg',
      key: 'net_weight_kg',
      render: (val) => parseFloat(val).toFixed(2)
    },
    {
      title: 'Amount (RM)',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (val) => `RM ${parseFloat(val).toFixed(2)}`
    },
    {
      title: 'Date',
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      render: (val) => new Date(val).toLocaleString()
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Farmers"
              value={stats.totalFarmers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Today's Purchases"
              value={stats.todayPurchases}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Current Stock (kg)"
              value={stats.currentStock}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Today's Amount"
              value={stats.totalAmount}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              suffix="RM"
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Purchases" style={{ marginTop: 24 }}>
        <Table
          columns={columns}
          dataSource={recentPurchases}
          rowKey="transaction_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
