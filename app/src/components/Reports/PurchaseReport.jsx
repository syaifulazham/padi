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
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  // Check if any purchases have deduction_config (regardless of values)
  const hasDeductions = purchases.some(p => {
    if (!p.deduction_config) return false;
    try {
      const config = typeof p.deduction_config === 'string' 
        ? JSON.parse(p.deduction_config) 
        : p.deduction_config;
      // Return true if deduction_config array exists and has items
      return Array.isArray(config) && config.length > 0;
    } catch (e) {
      return false;
    }
  });

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

  // Build columns dynamically based on whether deductions exist
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
      width: 120,
      render: (receiptNo, record) => (
        <Button 
          type="link" 
          onClick={() => handleViewDetails(record)}
          style={{ padding: 0, height: 'auto' }}
        >
          {receiptNo}
        </Button>
      )
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
    // Conditionally add Deductions column if any purchases have deductions
    ...(hasDeductions ? [{
      title: 'Deductions',
      dataIndex: 'deduction_config',
      key: 'deduction_config',
      align: 'center',
      width: 100,
      render: (deductionConfig) => {
        let totalPercent = 0;
        if (deductionConfig) {
          try {
            const config = typeof deductionConfig === 'string' 
              ? JSON.parse(deductionConfig) 
              : deductionConfig;
            if (Array.isArray(config)) {
              totalPercent = config.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
            }
          } catch (e) {
            console.error('Error parsing deduction_config:', e);
          }
        }
        return totalPercent > 0 ? `${totalPercent.toFixed(2)}%` : '-';
      }
    }] : []),
    // Conditionally add Total Amount column only if NO deductions
    ...(!hasDeductions ? [{
      title: t('reports.purchases.columns.totalAmount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      render: (val) => `RM ${parseFloat(val).toFixed(2)}`,
      width: 120
    }] : []),
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
      // Get split children for this parent
      const result = await window.electronAPI.purchases.getSplitChildren(parentRecord.transaction_id);
      if (result.success) {
        setSplitReceipts(result.data);
      }
    } catch (error) {
      console.error('Error loading split receipts:', error);
      message.error(t('reports.purchases.messages.loadSplitsFailed'));
    } finally {
      setLoadingSplits(false);
    }
  };

  const handleViewDetails = async (record) => {
    setDetailModalVisible(true);
    setLoadingDetail(true);
    
    try {
      const result = await window.electronAPI.purchases.getById(record.transaction_id);
      if (result.success) {
        setSelectedPurchase(result.data);
      }
    } catch (error) {
      console.error('Error loading purchase details:', error);
      message.error('Failed to load purchase details');
    } finally {
      setLoadingDetail(false);
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
    return { totalWeight };
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
              {!hasDeductions && (
                <Table.Summary.Cell index={6} align="right">
                  <strong>RM {summary.totalAmount.toFixed(2)}</strong>
                </Table.Summary.Cell>
              )}
              {hasDeductions && <Table.Summary.Cell index={6} />}
              <Table.Summary.Cell index={7} />
              <Table.Summary.Cell index={8} />
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
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#999' }}>{t('reports.purchases.split.parentReceipt')}</div>
                  <div style={{ fontWeight: 600 }}>{selectedParent.receipt_number}</div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#999' }}>{t('reports.purchases.split.originalWeight')}</div>
                  <div style={{ fontWeight: 600 }}>{parseFloat(selectedParent.net_weight_kg).toFixed(2)} {t('reports.purchases.misc.kg')}</div>
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
                  <Table.Summary.Cell index={3} />
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Modal>

      <Modal
        title={`Purchase Details - ${selectedPurchase?.receipt_number || ''}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {loadingDetail ? (
          <Spin />
        ) : selectedPurchase ? (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#999' }}>Farmer</div>
                  <div style={{ fontWeight: 600 }}>{selectedPurchase.farmer_name}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{selectedPurchase.farmer_code}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#999' }}>Transaction Date</div>
                  <div style={{ fontWeight: 600 }}>{dayjs(selectedPurchase.transaction_date).format('DD/MM/YYYY HH:mm:ss')}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#999' }}>Product</div>
                  <div style={{ fontWeight: 600 }}>{selectedPurchase.product_name}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#999' }}>Grade</div>
                  <div style={{ fontWeight: 600 }}>{selectedPurchase.grade_name}</div>
                </div>
              </Col>
            </Row>

            <div style={{ marginTop: 16, marginBottom: 8, fontSize: 14, fontWeight: 600, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              Weight Information
            </div>
            <Row gutter={[16, 8]}>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#999' }}>Gross Weight</div>
                <div style={{ fontWeight: 600 }}>{parseFloat(selectedPurchase.gross_weight_kg).toFixed(2)} kg</div>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#999' }}>Tare Weight</div>
                <div style={{ fontWeight: 600 }}>{parseFloat(selectedPurchase.tare_weight_kg).toFixed(2)} kg</div>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#999' }}>Net Weight</div>
                <div style={{ fontWeight: 600, color: '#52c41a' }}>{parseFloat(selectedPurchase.net_weight_kg).toFixed(2)} kg</div>
              </Col>
            </Row>

            <div style={{ marginTop: 16, marginBottom: 8, fontSize: 14, fontWeight: 600, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              Quality & Pricing
            </div>
            <Row gutter={[16, 8]}>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#999' }}>Total Deductions</div>
                <div style={{ fontWeight: 600 }}>
                  {(() => {
                    let totalDeduction = 0;
                    if (selectedPurchase.deduction_config) {
                      try {
                        const config = typeof selectedPurchase.deduction_config === 'string' 
                          ? JSON.parse(selectedPurchase.deduction_config) 
                          : selectedPurchase.deduction_config;
                        if (Array.isArray(config)) {
                          totalDeduction = config.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
                        }
                      } catch (e) {
                        console.error('Error parsing deduction_config:', e);
                      }
                    }
                    return totalDeduction > 0 ? `${totalDeduction.toFixed(2)}%` : '-';
                  })()}
                </div>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#999' }}>Foreign Matter</div>
                <div style={{ fontWeight: 600 }}>{selectedPurchase.foreign_matter ? `${parseFloat(selectedPurchase.foreign_matter).toFixed(2)}%` : '-'}</div>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#999' }}>Base Price/kg</div>
                <div style={{ fontWeight: 600 }}>RM {parseFloat(selectedPurchase.base_price_per_kg).toFixed(2)}</div>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#999' }}>Final Price/kg</div>
                <div style={{ fontWeight: 600 }}>RM {parseFloat(selectedPurchase.final_price_per_kg).toFixed(2)}</div>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#999' }}>Total Amount</div>
                <div style={{ fontWeight: 600, fontSize: 16, color: '#1890ff' }}>RM {parseFloat(selectedPurchase.total_amount).toFixed(2)}</div>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#999' }}>Payment Status</div>
                <div>
                  <Tag color={selectedPurchase.payment_status === 'paid' ? 'green' : 'orange'}>
                    {selectedPurchase.payment_status?.toUpperCase()}
                  </Tag>
                </div>
              </Col>
            </Row>

            {selectedPurchase.vehicle_number && (
              <>
                <div style={{ marginTop: 16, marginBottom: 8, fontSize: 14, fontWeight: 600, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                  Vehicle Information
                </div>
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <div style={{ fontSize: 12, color: '#999' }}>Lorry No</div>
                    <div style={{ fontWeight: 600 }}>{selectedPurchase.vehicle_number}</div>
                  </Col>
                  {selectedPurchase.driver_name && (
                    <Col span={12}>
                      <div style={{ fontSize: 12, color: '#999' }}>Driver Name</div>
                      <div style={{ fontWeight: 600 }}>{selectedPurchase.driver_name}</div>
                    </Col>
                  )}
                </Row>
              </>
            )}

            {selectedPurchase.notes && (
              <>
                <div style={{ marginTop: 16, marginBottom: 8, fontSize: 14, fontWeight: 600, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                  Notes
                </div>
                <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                  {selectedPurchase.notes}
                </div>
              </>
            )}
          </div>
        ) : null}
      </Modal>
    </Card>
  );
};

export default PurchaseReport;
