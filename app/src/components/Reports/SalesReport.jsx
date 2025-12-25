import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Statistic, Row, Col, DatePicker, message, Tabs } from 'antd';
import { DownloadOutlined, DollarOutlined, InboxOutlined, ShoppingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as XLSX from 'xlsx';
import { useI18n } from '../../i18n/I18nProvider';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;

const SalesReport = ({ activeSeason }) => {
  const { t } = useI18n();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([
    dayjs(activeSeason.start_date),
    dayjs(activeSeason.end_date)
  ]);

  useEffect(() => {
    loadSales();
  }, [activeSeason, dateRange]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.sales.getAll({ season_id: activeSeason.season_id });
      if (result.success) {
        let filtered = result.data.filter(s => s.status === 'completed');
        
        // Apply date filter
        if (dateRange && dateRange[0] && dateRange[1]) {
          filtered = filtered.filter(s => {
            const saleDate = dayjs(s.transaction_date);
            return saleDate.isSameOrAfter(dateRange[0], 'day') && 
                   saleDate.isSameOrBefore(dateRange[1], 'day');
          });
        }
        
        setSales(filtered);
      }
    } catch (error) {
      console.error('Error loading sales:', error);
      message.error(t('reports.sales.messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    const totalTransactions = sales.length;
    const totalWeight = sales.reduce((sum, s) => sum + parseFloat(s.net_weight_kg || 0), 0);
    const totalAmount = sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
    return { totalTransactions, totalWeight, totalAmount };
  };

  const calculateManufacturerSummary = () => {
    const manufacturerMap = {};
    
    sales.forEach(sale => {
      const manufacturerName = sale.manufacturer_name || t('reports.sales.misc.unknown');
      if (!manufacturerMap[manufacturerName]) {
        manufacturerMap[manufacturerName] = {
          manufacturer_name: manufacturerName,
          transactions: 0,
          total_weight: 0,
          total_amount: 0
        };
      }
      
      manufacturerMap[manufacturerName].transactions += 1;
      manufacturerMap[manufacturerName].total_weight += parseFloat(sale.net_weight_kg || 0);
      manufacturerMap[manufacturerName].total_amount += parseFloat(sale.total_amount || 0);
    });
    
    return Object.values(manufacturerMap).sort((a, b) => b.total_weight - a.total_weight);
  };

  const handleDownloadAll = () => {
    try {
      const summary = calculateSummary();
      
      // Prepare data for Excel
      const data = sales.map(s => ({
        [t('reports.sales.excel.columns.transactionId')]: s.transaction_id,
        [t('reports.sales.excel.columns.date')]: dayjs(s.transaction_date).format('DD/MM/YYYY'),
        [t('reports.sales.excel.columns.time')]: dayjs(s.transaction_date).format('HH:mm:ss'),
        [t('reports.sales.excel.columns.manufacturer')]: s.manufacturer_name,
        [t('reports.sales.excel.columns.product')]: s.product_name,
        [t('reports.sales.excel.columns.grossWeightKg')]: parseFloat(s.gross_weight_kg).toFixed(2),
        [t('reports.sales.excel.columns.tareWeightKg')]: parseFloat(s.tare_weight_kg).toFixed(2),
        [t('reports.sales.excel.columns.netWeightKg')]: parseFloat(s.net_weight_kg).toFixed(2),
        [t('reports.sales.excel.columns.pricePerKgRm')]: parseFloat(s.final_price_per_kg || 0).toFixed(2),
        [t('reports.sales.excel.columns.totalAmountRm')]: parseFloat(s.total_amount).toFixed(2),
        [t('reports.sales.excel.columns.lorryNo')]: s.vehicle_number || t('reports.sales.misc.na'),
        [t('reports.sales.excel.columns.notes')]: s.notes || ''
      }));

      // Add summary rows
      data.push({});
      data.push({
        [t('reports.sales.excel.columns.transactionId')]: t('reports.sales.excel.summary.label'),
        [t('reports.sales.excel.columns.date')]: '',
        [t('reports.sales.excel.columns.time')]: '',
        [t('reports.sales.excel.columns.manufacturer')]: '',
        [t('reports.sales.excel.columns.product')]: '',
        [t('reports.sales.excel.columns.grossWeightKg')]: '',
        [t('reports.sales.excel.columns.tareWeightKg')]: '',
        [t('reports.sales.excel.columns.netWeightKg')]: summary.totalWeight.toFixed(2),
        [t('reports.sales.excel.columns.pricePerKgRm')]: '',
        [t('reports.sales.excel.columns.totalAmountRm')]: summary.totalAmount.toFixed(2),
        [t('reports.sales.excel.columns.lorryNo')]: '',
        [t('reports.sales.excel.columns.notes')]: t('reports.sales.excel.summary.totalTransactions').replace('{total}', summary.totalTransactions)
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, t('reports.sales.excel.sheets.salesReport'));

      // Add manufacturer summary sheet
      const manufacturerSummary = calculateManufacturerSummary();
      const manufacturerData = manufacturerSummary.map(m => ({
        [t('reports.sales.excel.manufacturerSummary.columns.manufacturer')]: m.manufacturer_name,
        [t('reports.sales.excel.manufacturerSummary.columns.transactions')]: m.transactions,
        [t('reports.sales.excel.manufacturerSummary.columns.totalWeightKg')]: m.total_weight.toFixed(2),
        [t('reports.sales.excel.manufacturerSummary.columns.totalAmountRm')]: m.total_amount.toFixed(2),
        [t('reports.sales.excel.manufacturerSummary.columns.avgWeightPerTransactionKg')]: (m.total_weight / m.transactions).toFixed(2)
      }));
      
      const wsManufacturer = XLSX.utils.json_to_sheet(manufacturerData);
      XLSX.utils.book_append_sheet(wb, wsManufacturer, t('reports.sales.excel.sheets.byManufacturer'));

      // Generate filename
      const filename = `Sales_Report_${activeSeason.season_name}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      
      // Download
      XLSX.writeFile(wb, filename);
      message.success(t('reports.sales.messages.downloaded'));
    } catch (error) {
      console.error('Error downloading report:', error);
      message.error(t('reports.sales.messages.downloadFailed'));
    }
  };

  const salesColumns = [
    {
      title: t('reports.sales.columns.date'),
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      width: 150
    },
    {
      title: t('reports.sales.columns.transactionId'),
      dataIndex: 'transaction_id',
      key: 'transaction_id',
      width: 120
    },
    {
      title: t('reports.sales.columns.manufacturer'),
      dataIndex: 'manufacturer_name',
      key: 'manufacturer_name',
      width: 200
    },
    {
      title: t('reports.sales.columns.product'),
      dataIndex: 'product_name',
      key: 'product_name',
      width: 150
    },
    {
      title: t('reports.sales.columns.netWeightKg'),
      dataIndex: 'net_weight_kg',
      key: 'net_weight_kg',
      align: 'right',
      render: (val) => parseFloat(val).toFixed(2),
      width: 120
    },
    {
      title: t('reports.sales.columns.pricePerKg'),
      dataIndex: 'final_price_per_kg',
      key: 'final_price_per_kg',
      align: 'right',
      render: (val) => val ? `RM ${parseFloat(val).toFixed(2)}` : t('reports.sales.misc.na'),
      width: 100
    },
    {
      title: t('reports.sales.columns.totalAmount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      render: (val) => `RM ${parseFloat(val).toFixed(2)}`,
      width: 120
    },
    {
      title: t('reports.sales.columns.lorryNo'),
      dataIndex: 'vehicle_number',
      key: 'vehicle_number',
      render: (val) => val || t('reports.sales.misc.na'),
      width: 100
    }
  ];

  const manufacturerColumns = [
    {
      title: t('reports.sales.manufacturerSummary.columns.manufacturer'),
      dataIndex: 'manufacturer_name',
      key: 'manufacturer_name',
      width: 300
    },
    {
      title: t('reports.sales.manufacturerSummary.columns.transactions'),
      dataIndex: 'transactions',
      key: 'transactions',
      align: 'right',
      width: 120
    },
    {
      title: t('reports.sales.manufacturerSummary.columns.totalWeightKg'),
      dataIndex: 'total_weight',
      key: 'total_weight',
      align: 'right',
      render: (val) => val.toFixed(2),
      width: 150
    },
    {
      title: t('reports.sales.manufacturerSummary.columns.totalAmountRm'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      render: (val) => `RM ${val.toFixed(2)}`,
      width: 150
    },
    {
      title: t('reports.sales.manufacturerSummary.columns.avgWeightPerTransaction'),
      key: 'avg_weight',
      align: 'right',
      render: (_, record) => `${(record.total_weight / record.transactions).toFixed(2)} ${t('reports.sales.misc.kg')}`,
      width: 180
    }
  ];

  const summary = calculateSummary();
  const manufacturerSummary = calculateManufacturerSummary();

  return (
    <Card
      title={
        <Space>
          <DollarOutlined />
          {t('reports.sales.title')} - {activeSeason.season_name}
        </Space>
      }
      extra={
        <Space>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
            allowClear={false}
          />
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadAll}
            disabled={sales.length === 0}
          >
            {t('reports.sales.downloadExcel')}
          </Button>
        </Space>
      }
    >
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title={t('reports.sales.stats.totalTransactions')}
              value={summary.totalTransactions}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title={t('reports.sales.stats.totalWeightSold')}
              value={summary.totalWeight}
              precision={2}
              suffix={t('reports.sales.misc.kg')}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title={t('reports.sales.stats.totalRevenue')}
              value={summary.totalAmount}
              precision={2}
              prefix="RM"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs 
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: t('reports.sales.tabs.allSalesTransactions'),
            children: (
              <Table
                columns={salesColumns}
                dataSource={sales}
                rowKey="sale_id"
                loading={loading}
                pagination={{
                  pageSize: 20,
                  showTotal: (total) => t('reports.sales.pagination.totalTransactions').replace('{total}', total),
                  showSizeChanger: true
                }}
                scroll={{ x: 1200 }}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ background: '#fafafa' }}>
                      <Table.Summary.Cell index={0} colSpan={4}>
                        <strong>{t('reports.sales.misc.total')}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right">
                        <strong>{summary.totalWeight.toFixed(2)}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} />
                      <Table.Summary.Cell index={6} align="right">
                        <strong>RM {summary.totalAmount.toFixed(2)}</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={7} />
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            )
          },
          {
            key: '2',
            label: t('reports.sales.tabs.summaryByManufacturer'),
            children: (
              <Table
                columns={manufacturerColumns}
                dataSource={manufacturerSummary}
                rowKey="manufacturer_name"
                loading={loading}
                pagination={false}
                summary={() => {
                  const totalTrans = manufacturerSummary.reduce((sum, m) => sum + m.transactions, 0);
                  const totalWeight = manufacturerSummary.reduce((sum, m) => sum + m.total_weight, 0);
                  const totalAmount = manufacturerSummary.reduce((sum, m) => sum + m.total_amount, 0);
                  
                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row style={{ background: '#fafafa' }}>
                        <Table.Summary.Cell index={0}>
                          <strong>{t('reports.sales.misc.total')}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <strong>{totalTrans}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">
                          <strong>{totalWeight.toFixed(2)}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">
                          <strong>RM {totalAmount.toFixed(2)}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} />
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            )
          }
        ]}
      />
    </Card>
  );
};

export default SalesReport;
