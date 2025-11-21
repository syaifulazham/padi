import React, { useState, useEffect } from 'react';
import { Card, Table, Statistic, Row, Col, Button, Space, Tag, DatePicker } from 'antd';
import { ReloadOutlined, PrinterOutlined, FileExcelOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const SalesHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().startOf('day'), dayjs().endOf('day')]);
  const [activeSeason, setActiveSeason] = useState(null);

  useEffect(() => {
    loadActiveSeason();
  }, []);

  useEffect(() => {
    if (activeSeason) {
      loadTransactions();
    }
  }, [dateRange, activeSeason]);

  const loadActiveSeason = async () => {
    try {
      const result = await window.electronAPI.seasons?.getActive();
      if (result?.success && result.data) {
        setActiveSeason(result.data);
        console.log('✅ Active season loaded for sales history:', result.data);
      }
    } catch (error) {
      console.error('Failed to load active season:', error);
    }
  };

  const loadTransactions = async () => {
    if (!activeSeason) {
      console.log('⏳ Waiting for active season to load...');
      return;
    }
    
    setLoading(true);
    try {
      const [startDate, endDate] = dateRange;
      const result = await window.electronAPI.sales?.getAll({
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        season_id: activeSeason.season_id  // ✅ Filter by active season
      });
      
      console.log('📊 Sales history loaded for season:', activeSeason.season_id);
      console.log('📊 Transactions found:', result?.data?.length || 0);
      
      if (result?.success) {
        setTransactions(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load sales transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: transactions.length,
    totalWeight: transactions.reduce((sum, s) => sum + (parseFloat(s.net_weight_kg) || 0), 0),
    totalAmount: transactions.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0)
  };

  const columns = [
    {
      title: 'Sales Number',
      dataIndex: 'sales_number',
      key: 'sales_number',
      width: 150,
      render: (text) => <Tag color="green">{text}</Tag>
    },
    {
      title: 'Date & Time',
      dataIndex: 'sale_date',
      key: 'sale_date',
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
      title: 'Manufacturer',
      dataIndex: 'manufacturer_name',
      key: 'manufacturer_name',
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.manufacturer_code}</div>
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
        <strong style={{ color: '#52c41a' }}>
          {weight ? parseFloat(weight).toFixed(2) : '-'}
        </strong>
      )
    },
    {
      title: 'Price/kg',
      dataIndex: 'sale_price_per_kg',
      key: 'sale_price_per_kg',
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
        <strong style={{ color: '#fa8c16' }}>
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
            <h2 style={{ margin: 0 }}>
              Sales Transaction History
              {activeSeason && (
                <Tag color="blue" style={{ marginLeft: 12, fontSize: 14 }}>
                  🌾 {activeSeason.season_name || `Season ${activeSeason.season_number}/${activeSeason.year}`}
                </Tag>
              )}
            </h2>
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
                title="Total Weight Sold"
                value={stats.totalWeight.toFixed(2)}
                suffix="KG"
                precision={2}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Revenue"
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
          rowKey="sales_id"
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

export default SalesHistory;
