import React, { useState, useEffect } from 'react';
import { Card, Table, Statistic, Row, Col, Button, Space, Tag, DatePicker } from 'antd';
import { ReloadOutlined, PrinterOutlined, FileExcelOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const PurchaseHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().startOf('day'), dayjs().endOf('day')]);

  useEffect(() => {
    loadTransactions();
  }, [dateRange]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const [startDate, endDate] = dateRange;
      const result = await window.electronAPI.purchases?.getAll({
        date_from: startDate.format('YYYY-MM-DD'),
        date_to: endDate.format('YYYY-MM-DD')
      });
      
      if (result?.success) {
        setTransactions(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: transactions.length,
    totalWeight: transactions.reduce((sum, p) => sum + (parseFloat(p.net_weight_kg) || 0), 0),
    totalAmount: transactions.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0)
  };

  const columns = [
    {
      title: 'Receipt',
      dataIndex: 'receipt_number',
      key: 'receipt_number',
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Date & Time',
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      width: 160,
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : '-'
    },
    {
      title: 'Lorry',
      dataIndex: 'vehicle_number',
      key: 'vehicle_number',
      width: 120
    },
    {
      title: 'Farmer',
      dataIndex: 'farmer_name',
      key: 'farmer_name',
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.farmer_code}</div>
        </div>
      )
    },
    {
      title: 'Gross (kg)',
      dataIndex: 'gross_weight_kg',
      key: 'gross_weight_kg',
      width: 100,
      align: 'right',
      render: (weight) => weight ? parseFloat(weight).toFixed(2) : '-'
    },
    {
      title: 'Tare (kg)',
      dataIndex: 'tare_weight_kg',
      key: 'tare_weight_kg',
      width: 100,
      align: 'right',
      render: (weight) => weight ? parseFloat(weight).toFixed(2) : '-'
    },
    {
      title: 'Net (kg)',
      dataIndex: 'net_weight_kg',
      key: 'net_weight_kg',
      width: 120,
      align: 'right',
      render: (weight) => (
        <strong style={{ color: '#1890ff' }}>
          {weight ? parseFloat(weight).toFixed(2) : '-'}
        </strong>
      )
    },
    {
      title: 'Price/kg',
      dataIndex: 'final_price_per_kg',
      key: 'final_price_per_kg',
      width: 100,
      align: 'right',
      render: (price) => price ? `RM ${parseFloat(price).toFixed(2)}` : '-'
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      align: 'right',
      render: (amount) => (
        <strong style={{ color: '#52c41a' }}>
          {amount ? `RM ${parseFloat(amount).toFixed(2)}` : '-'}
        </strong>
      )
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
      )
    }
  ];

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header with Date Filter */}
        <Row justify="space-between" align="middle">
          <Col>
            <h2 style={{ margin: 0 }}>Purchase Transaction History</h2>
          </Col>
          <Col>
            <Space>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                format="DD/MM/YYYY"
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={loadTransactions}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                icon={<PrinterOutlined />}
                disabled={transactions.length === 0}
              >
                Print
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                disabled={transactions.length === 0}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Transactions"
                value={stats.total}
                suffix="transactions"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Weight"
                value={stats.totalWeight.toFixed(2)}
                suffix="KG"
                precision={2}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Amount"
                value={stats.totalAmount}
                prefix="RM"
                precision={2}
              />
            </Card>
          </Col>
        </Row>

        {/* Transactions Table */}
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="transaction_id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Total ${total} transactions`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: 1400 }}
        />
      </Space>
    </Card>
  );
};

export default PurchaseHistory;
