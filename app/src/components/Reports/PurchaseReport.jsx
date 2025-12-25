import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Statistic, Row, Col, DatePicker, message, Spin, Modal, Tag } from 'antd';
import { DownloadOutlined, ShoppingCartOutlined, DollarOutlined, InboxOutlined, SplitCellsOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as XLSX from 'xlsx';
import { useI18n } from '../../i18n/I18nProvider';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;

const PurchaseReport = ({ activeSeason }) => {
  const { t } = useI18n();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([
    dayjs(activeSeason.start_date),
    dayjs(activeSeason.end_date)
  ]);
  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [splitReceipts, setSplitReceipts] = useState([]);
  const [loadingSplits, setLoadingSplits] = useState(false);

  useEffect(() => {
    loadPurchases();
  }, [activeSeason, dateRange]);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.purchases.getAll({ season_id: activeSeason.season_id });
      if (result.success) {
        let filtered = result.data.filter(p => p.status === 'completed' && !p.parent_transaction_id);
        
        // Apply date filter
        if (dateRange && dateRange[0] && dateRange[1]) {
          filtered = filtered.filter(p => {
            const purchaseDate = dayjs(p.transaction_date);
            return purchaseDate.isSameOrAfter(dateRange[0], 'day') && 
                   purchaseDate.isSameOrBefore(dateRange[1], 'day');
          });
        }
        
        setPurchases(filtered);
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
      message.error(t('reports.purchases.messages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    const totalTransactions = purchases.length;
    const totalWeight = purchases.reduce((sum, p) => sum + parseFloat(p.net_weight_kg || 0), 0);
    const totalAmount = purchases.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
    return { totalTransactions, totalWeight, totalAmount };
  };

  const handleDownload = () => {
    try {
      const summary = calculateSummary();
      
      // Prepare data for Excel
      const data = purchases.map(p => ({
        [t('reports.purchases.excel.columns.receiptNo')]: p.receipt_number,
        [t('reports.purchases.excel.columns.date')]: dayjs(p.transaction_date).format('DD/MM/YYYY'),
        [t('reports.purchases.excel.columns.time')]: dayjs(p.transaction_date).format('HH:mm:ss'),
        [t('reports.purchases.excel.columns.farmerName')]: p.farmer_name,
        [t('reports.purchases.excel.columns.product')]: p.product_name,
        [t('reports.purchases.excel.columns.grossWeightKg')]: parseFloat(p.gross_weight_kg).toFixed(2),
        [t('reports.purchases.excel.columns.tareWeightKg')]: parseFloat(p.tare_weight_kg).toFixed(2),
        [t('reports.purchases.excel.columns.netWeightKg')]: parseFloat(p.net_weight_kg).toFixed(2),
        [t('reports.purchases.excel.columns.pricePerKgRm')]: parseFloat(p.final_price_per_kg).toFixed(2),
        [t('reports.purchases.excel.columns.totalAmountRm')]: parseFloat(p.total_amount).toFixed(2),
        [t('reports.purchases.excel.columns.lorryNo')]: p.vehicle_number || t('reports.purchases.misc.na'),
        [t('reports.purchases.excel.columns.notes')]: p.notes || ''
      }));

      // Add summary rows
      data.push({});
      data.push({
        [t('reports.purchases.excel.columns.receiptNo')]: t('reports.purchases.excel.summary.label'),
        [t('reports.purchases.excel.columns.date')]: '',
        [t('reports.purchases.excel.columns.time')]: '',
        [t('reports.purchases.excel.columns.farmerName')]: '',
        [t('reports.purchases.excel.columns.product')]: '',
        [t('reports.purchases.excel.columns.grossWeightKg')]: '',
        [t('reports.purchases.excel.columns.tareWeightKg')]: '',
        [t('reports.purchases.excel.columns.netWeightKg')]: summary.totalWeight.toFixed(2),
        [t('reports.purchases.excel.columns.pricePerKgRm')]: '',
        [t('reports.purchases.excel.columns.totalAmountRm')]: summary.totalAmount.toFixed(2),
        [t('reports.purchases.excel.columns.lorryNo')]: '',
        [t('reports.purchases.excel.columns.notes')]: t('reports.purchases.excel.summary.totalTransactions').replace('{total}', summary.totalTransactions)
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, t('reports.purchases.excel.sheets.purchaseReport'));

      // Generate filename
      const filename = `Purchase_Report_${activeSeason.season_name}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      
      // Download
      XLSX.writeFile(wb, filename);
      message.success(t('reports.purchases.messages.downloaded'));
    } catch (error) {
      console.error('Error downloading report:', error);
      message.error(t('reports.purchases.messages.downloadFailed'));
    }
  };

  const columns = [
    {
      title: t('reports.purchases.columns.date'),
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      width: 150
    },
    {
      title: t('reports.purchases.columns.receiptNo'),
      dataIndex: 'receipt_number',
      key: 'receipt_number',
      width: 120
    },
    {
      title: t('reports.purchases.columns.farmer'),
      dataIndex: 'farmer_name',
      key: 'farmer_name',
      width: 200
    },
    {
      title: t('reports.purchases.columns.product'),
      dataIndex: 'product_name',
      key: 'product_name',
      width: 150
    },
    {
      title: t('reports.purchases.columns.netWeightKg'),
      dataIndex: 'net_weight_kg',
      key: 'net_weight_kg',
      align: 'right',
      render: (val) => parseFloat(val).toFixed(2),
      width: 120
    },
    {
      title: t('reports.purchases.columns.pricePerKg'),
      dataIndex: 'final_price_per_kg',
      key: 'final_price_per_kg',
      align: 'right',
      render: (val) => `RM ${parseFloat(val).toFixed(2)}`,
      width: 100
    },
    {
      title: t('reports.purchases.columns.totalAmount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      render: (val) => `RM ${parseFloat(val).toFixed(2)}`,
      width: 120
    },
    {
      title: t('reports.purchases.columns.lorryNo'),
      dataIndex: 'vehicle_number',
      key: 'vehicle_number',
      render: (val) => val || t('reports.purchases.misc.na'),
      width: 100
    },
    {
      title: t('reports.purchases.columns.action'),
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => {
        if (record.is_split_parent) {
          return (
            <Button
              size="small"
              icon={<SplitCellsOutlined />}
              onClick={() => handleViewSplits(record)}
            >
              {t('reports.purchases.actions.splits')}
            </Button>
          );
        }
        return null;
      }
    }
  ];

  const handleViewSplits = async (parentRecord) => {
    setSelectedParent(parentRecord);
    setSplitModalVisible(true);
    setLoadingSplits(true);
    
    try {
      // Get all purchases and filter for splits of this parent
      const result = await window.electronAPI.purchases.getAll({ season_id: activeSeason.season_id });
      if (result.success) {
        const splits = result.data.filter(p => p.parent_transaction_id === parentRecord.transaction_id);
        setSplitReceipts(splits);
      }
    } catch (error) {
      console.error('Error loading split receipts:', error);
      message.error(t('reports.purchases.messages.loadSplitsFailed'));
    } finally {
      setLoadingSplits(false);
    }
  };

  const splitColumns = [
    {
      title: t('reports.purchases.split.columns.receiptNo'),
      dataIndex: 'receipt_number',
      key: 'receipt_number'
    },
    {
      title: t('reports.purchases.split.columns.date'),
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: t('reports.purchases.split.columns.netWeightKg'),
      dataIndex: 'net_weight_kg',
      key: 'net_weight_kg',
      align: 'right',
      render: (val) => parseFloat(val).toFixed(2)
    },
    {
      title: t('reports.purchases.split.columns.amount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      render: (val) => `RM ${parseFloat(val).toFixed(2)}`
    },
    {
      title: t('reports.purchases.split.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : status === 'sold' ? 'blue' : 'orange'}>
          {t(`reports.purchases.status.${status}`, status).toUpperCase()}
        </Tag>
      )
    }
  ];

  const calculateSplitSummary = () => {
    const totalWeight = splitReceipts.reduce((sum, s) => sum + parseFloat(s.net_weight_kg || 0), 0);
    const totalAmount = splitReceipts.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
    return { totalWeight, totalAmount };
  };

  const summary = calculateSummary();

  return (
    <Card
      title={
        <Space>
          <ShoppingCartOutlined />
          {t('reports.purchases.title')} - {activeSeason.season_name}
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
            onClick={handleDownload}
            disabled={purchases.length === 0}
          >
            {t('reports.purchases.downloadExcel')}
          </Button>
        </Space>
      }
    >
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title={t('reports.purchases.stats.totalTransactions')}
              value={summary.totalTransactions}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title={t('reports.purchases.stats.totalWeightPurchased')}
              value={summary.totalWeight}
              precision={2}
              suffix={t('reports.purchases.misc.kg')}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title={t('reports.purchases.stats.totalAmountPaid')}
              value={summary.totalAmount}
              precision={2}
              prefix="RM"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={purchases}
        rowKey="purchase_id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showTotal: (total) => t('reports.purchases.pagination.totalTransactions').replace('{total}', total),
          showSizeChanger: true
        }}
        scroll={{ x: 1200 }}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row style={{ background: '#fafafa' }}>
              <Table.Summary.Cell index={0} colSpan={4}>
                <strong>{t('reports.purchases.misc.total')}</strong>
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

      <Modal
        title={
          <Space>
            <SplitCellsOutlined />
            {t('reports.purchases.split.title')}
          </Space>
        }
        open={splitModalVisible}
        onCancel={() => setSplitModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setSplitModalVisible(false)}>
            {t('reports.purchases.split.close')}
          </Button>
        ]}
        width={800}
      >
        {selectedParent && (
          <div style={{ marginBottom: 16 }}>
            <Card size="small" style={{ background: '#f5f5f5' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#999' }}>{t('reports.purchases.split.parentReceipt')}</div>
                  <div style={{ fontWeight: 600 }}>{selectedParent.receipt_number}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#999' }}>{t('reports.purchases.split.originalWeight')}</div>
                  <div style={{ fontWeight: 600 }}>{parseFloat(selectedParent.net_weight_kg).toFixed(2)} {t('reports.purchases.misc.kg')}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 12, color: '#999' }}>{t('reports.purchases.split.originalAmount')}</div>
                  <div style={{ fontWeight: 600 }}>RM {parseFloat(selectedParent.total_amount).toFixed(2)}</div>
                </Col>
              </Row>
            </Card>
          </div>
        )}

        <Table
          columns={splitColumns}
          dataSource={splitReceipts}
          rowKey="purchase_id"
          loading={loadingSplits}
          pagination={false}
          size="small"
          summary={() => {
            if (splitReceipts.length === 0) return null;
            const summary = calculateSplitSummary();
            return (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: '#fafafa' }}>
                  <Table.Summary.Cell index={0}>
                    <strong>{t('reports.purchases.split.summaryTotal').replace('{count}', splitReceipts.length)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} />
                  <Table.Summary.Cell index={2} align="right">
                    <strong>{summary.totalWeight.toFixed(2)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <strong>RM {summary.totalAmount.toFixed(2)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} />
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Modal>
    </Card>
  );
};

export default PurchaseReport;
