import React, { useState, useEffect } from 'react';
import { Card, Table, Statistic, Row, Col, Button, Space, Tag, DatePicker, message, Tooltip, Modal } from 'antd';
import { ReloadOutlined, PrinterOutlined, FileExcelOutlined, UserSwitchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';

const { RangePicker } = DatePicker;

const PurchaseHistory = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().startOf('day'), dayjs().endOf('day')]);
  const [activeSeason, setActiveSeason] = useState(null);
  const [dateRangeLoaded, setDateRangeLoaded] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    loadActiveSeason();
  }, []);

  useEffect(() => {
    if (activeSeason && !dateRangeLoaded) {
      loadSeasonDateRange();
    }
  }, [activeSeason]);

  useEffect(() => {
    if (activeSeason && dateRangeLoaded) {
      loadTransactions();
    }
  }, [dateRange, activeSeason, dateRangeLoaded]);

  const loadActiveSeason = async () => {
    try {
      const result = await window.electronAPI.seasons?.getActive();
      if (result?.success && result.data) {
        setActiveSeason(result.data);
        console.log('✅ Active season loaded for purchase history:', result.data);
      }
    } catch (error) {
      console.error('Failed to load active season:', error);
    }
  };

  const loadSeasonDateRange = async () => {
    try {
      const result = await window.electronAPI.purchases?.getSeasonDateRange(activeSeason.season_id);
      if (result?.success && result.data) {
        const { earliest_date, latest_date } = result.data;
        setDateRange([
          dayjs(earliest_date).startOf('day'),
          dayjs(latest_date).endOf('day')
        ]);
        setDateRangeLoaded(true);
        console.log('✅ Season date range loaded:', earliest_date, 'to', latest_date);
      }
    } catch (error) {
      console.error('Failed to load season date range:', error);
      setDateRangeLoaded(true);
    }
  };

  const loadTransactions = async () => {
    if (!activeSeason || !dateRangeLoaded) {
      console.log('⏳ Waiting for active season and date range to load...');
      return;
    }
    
    setLoading(true);
    try {
      const [startDate, endDate] = dateRange;
      const result = await window.electronAPI.purchases?.getAll({
        date_from: startDate.format('YYYY-MM-DD'),
        date_to: endDate.format('YYYY-MM-DD'),
        season_id: activeSeason.season_id  // ✅ Filter by active season
      });
      
      console.log('📊 Purchase history loaded for season:', activeSeason.season_id);
      console.log('📊 Transactions found:', result?.data?.length || 0);
      
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

  const handleReprint = async (record) => {
    try {
      message.loading({ content: t('purchasesHistory.messages.generatingReceipt'), key: 'reprint' });
      
      const result = await window.electronAPI.printer?.purchaseReceipt(record.transaction_id, { forcePrint: true });
      
      if (result?.success) {
        if (result.mode === 'pdf') {
          message.success({
            content: (
              <div>
                <div>
                  {t('purchasesHistory.messages.receiptSavedAsPdfPrefix')}
                  {' '}
                  {result.filename}
                </div>
                <div style={{ fontSize: '12px', marginTop: 4 }}>
                  {t('purchasesHistory.messages.locationPrefix')}
                  {' '}
                  {result.path}
                </div>
              </div>
            ),
            key: 'reprint',
            duration: 5
          });
        } else {
          message.success({ content: t('purchasesHistory.messages.receiptSentToPrinter'), key: 'reprint' });
        }
      } else {
        message.error({
          content: `${t('purchasesHistory.messages.failedToPrintPrefix')}${result?.error}`,
          key: 'reprint'
        });
      }
    } catch (error) {
      console.error('Failed to reprint:', error);
      message.error({ content: t('purchasesHistory.messages.failedToReprintReceipt'), key: 'reprint' });
    }
  };

  const handleReceiptPreview = async (record) => {
    try {
      console.log('👁️  Previewing receipt:', record.receipt_number);
      setSelectedReceipt(record);
      
      const previewResult = await window.electronAPI.printer?.purchaseReceipt(record.transaction_id, { preview: true });
      
      if (previewResult?.success && previewResult.html) {
        setPreviewHtml(previewResult.html);
        setPreviewModalOpen(true);
      } else {
        message.error('Failed to generate receipt preview');
      }
    } catch (error) {
      console.error('Error previewing receipt:', error);
      message.error('Failed to preview receipt');
    }
  };

  // Calculate statistics
  const stats = {
    total: transactions.length,
    totalWeight: transactions.reduce((sum, p) => sum + (parseFloat(p.net_weight_kg) || 0), 0)
  };

  const columns = [
    {
      title: t('purchasesHistory.table.receipt'),
      dataIndex: 'receipt_number',
      key: 'receipt_number',
      width: 150,
      render: (text, record) => (
        <Tag 
          color="blue" 
          style={{ cursor: 'pointer' }}
          onClick={() => handleReceiptPreview(record)}
        >
          {text}
        </Tag>
      )
    },
    {
      title: t('purchasesHistory.table.dateTime'),
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      width: 160,
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : t('purchasesHistory.misc.dash')
    },
    {
      title: t('purchasesHistory.table.lorry'),
      dataIndex: 'vehicle_number',
      key: 'vehicle_number',
      width: 120
    },
    {
      title: t('purchasesHistory.table.farmer'),
      dataIndex: 'farmer_name',
      key: 'farmer_name',
      width: 200,
      render: (text, record) => (
        record.status === 'cancelled' ? (
          <Tag color="red">{t('purchasesHistory.misc.notApplicable')}</Tag>
        ) : (
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>{record.farmer_code}</div>
          </div>
        )
      )
    },
    {
      title: t('purchasesHistory.table.product'),
      dataIndex: 'product_name',
      key: 'product_name',
      width: 180,
      render: (text) => text ? <Tag color="green">{text}</Tag> : <Tag>{t('purchasesHistory.misc.dash')}</Tag>
    },
    {
      title: t('purchasesHistory.table.grossKg'),
      dataIndex: 'gross_weight_kg',
      key: 'gross_weight_kg',
      width: 100,
      align: 'right',
      render: (weight) => weight ? parseFloat(weight).toFixed(2) : t('purchasesHistory.misc.dash')
    },
    {
      title: t('purchasesHistory.table.tareKg'),
      dataIndex: 'tare_weight_kg',
      key: 'tare_weight_kg',
      width: 100,
      align: 'right',
      render: (weight) => weight ? parseFloat(weight).toFixed(2) : t('purchasesHistory.misc.dash')
    },
    {
      title: t('purchasesHistory.table.netKg'),
      dataIndex: 'net_weight_kg',
      key: 'net_weight_kg',
      width: 120,
      align: 'right',
      render: (weight) => (
        <strong style={{ color: '#1890ff' }}>
          {weight ? parseFloat(weight).toFixed(2) : t('purchasesHistory.misc.dash')}
        </strong>
      )
    },
    {
      title: t('purchasesHistory.table.pricePerKg'),
      dataIndex: 'final_price_per_kg',
      key: 'final_price_per_kg',
      width: 100,
      align: 'right',
      render: (price) => price ? `${t('purchasesHistory.misc.rm')} ${parseFloat(price).toFixed(2)}` : t('purchasesHistory.misc.dash')
    },
    {
      title: t('purchasesHistory.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => (
        <Space direction="vertical" size={2}>
          {status !== 'completed' && (
            <Tag color={
              status === 'cancelled' ? 'red' : 'default'
            }>
              {status ? (t(`purchasesHistory.transactionStatuses.${status}`) || status.toUpperCase()) : t('purchasesHistory.statuses.unknown')}
            </Tag>
          )}
          {status !== 'cancelled' && (
            <Tag color={record.payment_status === 'paid' ? 'green' : 'orange'} style={{ fontSize: '10px' }}>
              {record.payment_status === 'paid' ? 'Updated' : record.payment_status === 'unpaid' ? 'Need Update' : ''}
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: t('purchasesHistory.table.actions'),
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        record.status === 'cancelled' ? (
          <Tag color="red">{t('purchasesHistory.misc.cancelled')}</Tag>
        ) : (
          <Space size={4}>
            <Tooltip title={t('purchasesHistory.actions.reprintReceiptTooltip')}>
              <Button
                type="primary"
                icon={<PrinterOutlined />}
                size="small"
                onClick={() => handleReprint(record)}
              >
                {t('purchasesHistory.actions.reprint')}
              </Button>
            </Tooltip>
            <Tooltip title="Change Farmer">
              <Button
                icon={<UserSwitchOutlined />}
                size="small"
                onClick={() => navigate(`/purchases/change-farmer?transactionId=${record.transaction_id}`)}
              />
            </Tooltip>
          </Space>
        )
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
              {t('purchasesHistory.title')}
              {activeSeason && (
                <Tag color="blue" style={{ marginLeft: 12, fontSize: 14 }}>
                  🌾 {activeSeason.season_name || t('purchasesHistory.seasonLabel').replace('{season_number}', activeSeason.season_number).replace('{year}', activeSeason.year)}
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
                {t('purchasesHistory.actions.refresh')}
              </Button>
              <Button
                icon={<PrinterOutlined />}
                disabled={transactions.length === 0}
              >
                {t('purchasesHistory.actions.print')}
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                disabled={transactions.length === 0}
              >
                {t('purchasesHistory.actions.export')}
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title={t('purchasesHistory.stats.totalTransactions')}
                value={stats.total}
                suffix={t('purchasesHistory.stats.transactionsSuffix')}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title={t('purchasesHistory.stats.totalWeight')}
                value={stats.totalWeight.toFixed(2)}
                suffix={t('purchasesHistory.stats.kgSuffix')}
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
            showTotal: (total) => t('purchasesHistory.pagination.totalTransactions').replace('{total}', total),
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: 1500 }}
          rowClassName={(record) => 
            record.payment_status === 'unpaid' && record.status !== 'cancelled' ? 'row-need-update' : ''
          }
        />

        {/* Receipt Preview Modal */}
        <Modal
          title={`Receipt Preview: ${selectedReceipt?.receipt_number || ''}`}
          open={previewModalOpen}
          onCancel={() => {
            setPreviewModalOpen(false);
            setPreviewHtml('');
            setSelectedReceipt(null);
          }}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div>
                {selectedReceipt?.status !== 'cancelled' && (
                  <Button
                    key="changeFarmer"
                    icon={<UserSwitchOutlined />}
                    onClick={() => {
                      setPreviewModalOpen(false);
                      navigate(`/purchases/change-farmer?transactionId=${selectedReceipt?.transaction_id}`);
                    }}
                  >
                    Change Farmer
                  </Button>
                )}
              </div>
              <Space>
                <Button 
                  key="print" 
                  type="primary" 
                  icon={<PrinterOutlined />} 
                  onClick={() => {
                    handleReprint(selectedReceipt);
                    setPreviewModalOpen(false);
                  }}
                >
                  Print
                </Button>
                <Button key="close" onClick={() => {
                  setPreviewModalOpen(false);
                  setPreviewHtml('');
                  setSelectedReceipt(null);
                }}>
                  Close
                </Button>
              </Space>
            </div>
          }
          width={900}
          bodyStyle={{ padding: 0, maxHeight: '80vh', overflow: 'auto' }}
        >
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </Modal>
      </Space>
    </Card>
  );
};

export default PurchaseHistory;
