import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import {
  TeamOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useI18n } from '../../i18n/I18nProvider';

const Dashboard = () => {
  const { t } = useI18n();
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
        
        // Calculate today's purchases (exclude cancelled)
        const today = new Date().toISOString().split('T')[0];
        const todayData = result.data.filter(p => {
          if (!p.transaction_date || p.status === 'cancelled') return false;
          // Convert to string if it's a Date object
          const dateStr = p.transaction_date instanceof Date 
            ? p.transaction_date.toISOString() 
            : String(p.transaction_date);
          return dateStr.startsWith(today);
        });
        
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
      title: t('dashboard.receipt'),
      dataIndex: 'receipt_number',
      key: 'receipt_number',
    },
    {
      title: t('dashboard.farmer'),
      dataIndex: 'farmer_name',
      key: 'farmer_name',
      render: (text, record) => (
        record.status === 'cancelled' ? (
          <Tag color="red">N/A</Tag>
        ) : (
          text
        )
      ),
    },
    {
      title: t('dashboard.product'),
      dataIndex: 'product_code',
      key: 'product_code',
    },
    {
      title: t('dashboard.weightKg'),
      dataIndex: 'net_weight_kg',
      key: 'net_weight_kg',
      render: (val) => parseFloat(val).toFixed(2)
    },
    {
      title: t('dashboard.amountRm'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (val) => `RM ${parseFloat(val).toFixed(2)}`
    },
    {
      title: t('dashboard.date'),
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      render: (val) => {
        if (!val) return '-';
        try {
          const date = val instanceof Date ? val : new Date(val);
          return date.toLocaleString();
        } catch (e) {
          return String(val);
        }
      }
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dashboard.totalFarmers')}
              value={stats.totalFarmers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dashboard.todaysPurchases')}
              value={stats.todayPurchases}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dashboard.currentStockKg')}
              value={stats.currentStock}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dashboard.todaysAmount')}
              value={stats.totalAmount}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              suffix="RM"
            />
          </Card>
        </Col>
      </Row>

      <Card title={t('dashboard.recentPurchases')} style={{ marginTop: 24 }}>
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
