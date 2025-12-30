import React, { useState, useEffect } from 'react';
import { Card, Table, Statistic, Row, Col, Button, Space, Tag, DatePicker, message, Modal, Input, Form, InputNumber, Divider, Alert, Radio } from 'antd';
import { ReloadOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, PlusOutlined, MinusCircleOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useI18n } from '../../i18n/I18nProvider';

const { RangePicker } = DatePicker;

// Payment Modal Content Component with Deduction Editing
const PaymentModalContent = ({ transaction, form, seasonDeductionConfig }) => {
  const { t } = useI18n();
  const [previewAmount, setPreviewAmount] = useState(null);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [deductionPresets, setDeductionPresets] = useState([]);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);

  useEffect(() => {
    calculatePreview(form.getFieldValue('deductions') || []);
  }, [transaction]);

  useEffect(() => {
    const raw = seasonDeductionConfig || [];
    const isNewFormat = Array.isArray(raw) && raw.length > 0 && raw[0]?.preset_name !== undefined;
    const presets = isNewFormat
      ? raw
      : (Array.isArray(raw) && raw.length > 0
        ? [{ preset_name: t('purchasesPayment.presets.standard'), deductions: raw }]
        : []);

    setDeductionPresets(presets);
    setSelectedPresetIndex(0);
  }, [seasonDeductionConfig]);

  const calculatePreview = (deductions) => {
    if (!deductions || !transaction) return;
    
    const netWeight = parseFloat(transaction.net_weight_kg);
    const basePrice = parseFloat(transaction.base_price_per_kg);
    const finalPrice = parseFloat(transaction.final_price_per_kg) || basePrice;
    const totalDeduction = deductions.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
    const effectiveWeight = netWeight * (1 - totalDeduction / 100);
    const totalAmount = effectiveWeight * finalPrice;
    
    setPreviewAmount({
      totalDeduction: totalDeduction.toFixed(2),
      effectiveWeight: effectiveWeight.toFixed(2),
      deductedWeight: (netWeight - effectiveWeight).toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    });
    
    // Update amount field
    form.setFieldsValue({ amount: totalAmount });
  };

  const handleValuesChange = (_, allValues) => {
    if (allValues.deductions) {
      calculatePreview(allValues.deductions);
    }
  };

  const applyPreset = (preset) => {
    const deductions = preset?.deductions || [];
    form.setFieldsValue({ deductions });
    calculatePreview(deductions);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div style={{
        background: '#e6f7ff',
        padding: '8px 12px',
        borderRadius: 4,
        fontSize: 12
      }}>
        <strong>{t('purchasesPayment.modal.tipTitle')}</strong> {t('purchasesPayment.modal.tipBody')}
      </div>

      <div style={{ 
        background: '#fafafa', 
        padding: 12, 
        borderRadius: 4,
        fontSize: 12
      }}>
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <div style={{ color: '#999' }}>{t('purchasesPayment.modal.info.receipt')}</div>
            <Tag color="blue" style={{ margin: 0 }}>{transaction.receipt_number}</Tag>
          </Col>
          <Col span={12}>
            <div style={{ color: '#999' }}>{t('purchasesPayment.modal.info.farmer')}</div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{transaction.farmer_name}</div>
          </Col>
          <Col span={12}>
            <div style={{ color: '#999' }}>{t('purchasesPayment.modal.info.netWeight')}</div>
            <strong>{parseFloat(transaction.net_weight_kg).toFixed(2)} {t('purchasesPayment.misc.kg')}</strong>
          </Col>
          <Col span={12}>
            <div style={{ color: '#999' }}>{t('purchasesPayment.modal.info.pricePerTon')}</div>
            <strong>{t('purchasesPayment.misc.rm')} {(parseFloat(transaction.base_price_per_kg) * 1000).toFixed(2)}</strong>
          </Col>
        </Row>
      </div>

      <Form 
        form={form} 
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{t('purchasesPayment.modal.deductions.title')}</div>
          <Button
            size="small"
            onClick={() => setPresetModalOpen(true)}
            disabled={!deductionPresets || deductionPresets.length === 0}
          >
            {t('purchasesPayment.modal.deductions.selectPreset')}
          </Button>
        </div>

        <Form.List name="deductions">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 6 }} align="baseline" size="small">
                  <Form.Item
                    {...field}
                    label={index === 0 ? t('purchasesPayment.modal.deductions.typeLabel') : ''}
                    name={[field.name, 'deduction']}
                    rules={[{ required: true, message: t('purchasesPayment.validations.required') }]}
                    style={{ width: 180, marginBottom: 0 }}
                  >
                    <Input placeholder={t('purchasesPayment.modal.deductions.typePlaceholder')} size="small" />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    label={index === 0 ? t('purchasesPayment.modal.deductions.rateLabel') : ''}
                    name={[field.name, 'value']}
                    rules={[
                      { required: true, message: t('purchasesPayment.validations.required') },
                      { type: 'number', min: 0, max: 100, message: t('purchasesPayment.validations.zeroToHundredPercent') }
                    ]}
                    style={{ width: 100, marginBottom: 0 }}
                  >
                    <InputNumber
                      placeholder={t('purchasesPayment.modal.deductions.ratePlaceholder')}
                      precision={2}
                      min={0}
                      max={100}
                      step={0.5}
                      size="small"
                      style={{ width: '100%' }}
                      addonAfter={t('purchasesPayment.misc.percent')}
                    />
                  </Form.Item>
                  {fields.length > 0 && (
                    <MinusCircleOutlined
                      style={{ fontSize: 16, color: '#ff4d4f', cursor: 'pointer', marginTop: index === 0 ? 22 : 0 }}
                      onClick={() => remove(field.name)}
                    />
                  )}
                </Space>
              ))}
              <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  size="small"
                  block
                  icon={<PlusOutlined />}
                >
                  {t('purchasesPayment.modal.deductions.addDeduction')}
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Modal
          title={t('purchasesPayment.presetModal.title')}
          open={presetModalOpen}
          onCancel={() => setPresetModalOpen(false)}
          onOk={() => {
            const preset = deductionPresets?.[selectedPresetIndex];
            applyPreset(preset);
            setPresetModalOpen(false);
          }}
          okText={t('purchasesPayment.presetModal.apply')}
          cancelText={t('purchasesPayment.presetModal.cancel')}
          width={420}
          centered
          destroyOnClose
        >
          {(!deductionPresets || deductionPresets.length === 0) ? (
            <Alert
              type="warning"
              message={t('purchasesPayment.presetModal.noPresets')}
              showIcon
            />
          ) : (
            <Radio.Group
              style={{ width: '100%' }}
              value={selectedPresetIndex}
              onChange={(e) => setSelectedPresetIndex(e.target.value)}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {deductionPresets.map((p, idx) => (
                  <Radio key={idx} value={idx}>
                    {p?.preset_name || t('purchasesPayment.presetModal.presetN').replace('{n}', idx + 1)}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          )}
        </Modal>

        {previewAmount && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              padding: '10px 12px',
              borderRadius: 4,
              fontSize: 12
            }}>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>{t('purchasesPayment.modal.summary.title')}</div>
              <Row gutter={[8, 4]}>
                <Col span={12} style={{ color: '#666' }}>{t('purchasesPayment.modal.summary.netWeight')}</Col>
                <Col span={12} style={{ textAlign: 'right', fontWeight: 500 }}>
                  {parseFloat(transaction.net_weight_kg).toFixed(2)} {t('purchasesPayment.misc.kg')}
                </Col>
                <Col span={12} style={{ color: '#ff4d4f' }}>{t('purchasesPayment.modal.summary.deduction')}</Col>
                <Col span={12} style={{ textAlign: 'right', fontWeight: 500, color: '#ff4d4f' }}>
                  -{previewAmount.totalDeduction}{t('purchasesPayment.misc.percent')} (-{previewAmount.deductedWeight} {t('purchasesPayment.misc.kg')})
                </Col>
                <Col span={12} style={{ color: '#1890ff' }}>{t('purchasesPayment.modal.summary.effectiveWeight')}</Col>
                <Col span={12} style={{ textAlign: 'right', fontWeight: 600, color: '#1890ff' }}>
                  {previewAmount.effectiveWeight} {t('purchasesPayment.misc.kg')}
                </Col>
                <Col span={24}><Divider style={{ margin: '4px 0' }} /></Col>
                <Col span={12} style={{ fontWeight: 600, fontSize: 14 }}>{t('purchasesPayment.modal.summary.totalAmount')}</Col>
                <Col span={12} style={{ textAlign: 'right', fontWeight: 700, color: '#52c41a', fontSize: 16 }}>
                  {t('purchasesPayment.misc.rm')} {previewAmount.totalAmount}
                </Col>
              </Row>
            </div>
          </>
        )}

        <Form.Item name="amount" hidden>
          <Input type="number" />
        </Form.Item>
      </Form>
    </Space>
  );
};

const Payment = () => {
  const { t } = useI18n();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('day')]);
  const [activeSeason, setActiveSeason] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [form] = Form.useForm();

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
        console.log('✅ Active season loaded for payments:', result.data);
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
      const result = await window.electronAPI.purchases?.getAll({
        date_from: startDate.format('YYYY-MM-DD'),
        date_to: endDate.format('YYYY-MM-DD'),
        season_id: activeSeason.season_id
      });
      
      if (result?.success) {
        const validTransactions = (result.data || []).filter(t => t.status !== 'cancelled');
        setTransactions(validTransactions);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (record) => {
    setSelectedTransaction(record);
    
    // Parse deduction_config
    let deductions = [];
    try {
      if (record.deduction_config) {
        deductions = typeof record.deduction_config === 'string' 
          ? JSON.parse(record.deduction_config) 
          : record.deduction_config;
      }
    } catch (error) {
      console.error('Error parsing deduction_config:', error);
      deductions = [];
    }
    
    form.setFieldsValue({
      amount: record.total_amount,
      deductions: deductions.length > 0 ? deductions : []
    });
    
    setPaymentModalOpen(true);
  };

  const handlePaymentConfirm = async () => {
    try {
      const values = await form.validateFields();
      
      message.loading({ content: t('purchasesPayment.messages.processingPayment'), key: 'payment' });
      
      // Update deductions and recalculate amount
      const result = await window.electronAPI.purchases?.updatePayment({
        transaction_id: selectedTransaction.transaction_id,
        deduction_config: values.deductions || [],
        payment_status: 'paid'
      });
      
      if (result?.success) {
        message.success({ content: t('purchasesPayment.messages.paymentRecordedSuccessfully'), key: 'payment' });
        
        // Regenerate receipt with updated deductions
        try {
          const printResult = await window.electronAPI.printer?.purchaseReceipt(selectedTransaction.transaction_id);
          if (printResult?.success) {
            if (printResult.mode === 'pdf') {
              message.success({
                content: (
                  <div>
                    <div>
                      {t('purchasesPayment.messages.receiptRegeneratedPrefix')}
                      {' '}
                      {printResult.filename}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: 4 }}>
                      {t('purchasesPayment.messages.locationPrefix')}
                      {' '}
                      {printResult.path}
                    </div>
                  </div>
                ),
                duration: 5
              });
            } else {
              message.success(t('purchasesPayment.messages.receiptPrintedSuccessfully'));
            }
          }
        } catch (printError) {
          console.error('Print error:', printError);
          message.warning(t('purchasesPayment.messages.paymentRecordedButReceiptPrintingFailed'));
        }
        
        setPaymentModalOpen(false);
        form.resetFields();
        loadTransactions();
      } else {
        message.error({ content: result?.error || t('purchasesPayment.messages.failedToRecordPayment'), key: 'payment' });
      }
    } catch (error) {
      console.error('Payment failed:', error);
      message.error({ content: t('purchasesPayment.messages.failedToRecordPayment'), key: 'payment' });
    }
  };

  // Calculate statistics
  const stats = {
    total: transactions.length,
    unpaid: transactions.filter(t => t.payment_status === 'unpaid').length,
    paid: transactions.filter(t => t.payment_status === 'paid').length,
    totalUnpaidAmount: transactions
      .filter(t => t.payment_status === 'unpaid')
      .reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0),
    totalPaidAmount: transactions
      .filter(t => t.payment_status === 'paid')
      .reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0)
  };

  const columns = [
    {
      title: t('purchasesPayment.table.receipt'),
      dataIndex: 'receipt_number',
      key: 'receipt_number',
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: t('purchasesPayment.table.date'),
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      width: 120,
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : t('purchasesPayment.misc.dash')
    },
    {
      title: t('purchasesPayment.table.farmer'),
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
      title: t('purchasesPayment.table.product'),
      dataIndex: 'product_name',
      key: 'product_name',
      width: 180,
      render: (text) => text ? <Tag color="green">{text}</Tag> : <Tag>{t('purchasesPayment.misc.dash')}</Tag>
    },
    {
      title: t('purchasesPayment.table.netWeightKg'),
      dataIndex: 'net_weight_kg',
      key: 'net_weight_kg',
      width: 120,
      align: 'right',
      render: (weight) => (
        <strong>{weight ? parseFloat(weight).toFixed(2) : t('purchasesPayment.misc.dash')}</strong>
      )
    },
    {
      title: t('purchasesPayment.table.deductionPercent'),
      dataIndex: 'deduction_config',
      key: 'deduction_config',
      width: 110,
      align: 'center',
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
        return (
          <Tag color={totalPercent > 0 ? 'orange' : 'default'}>
            {totalPercent.toFixed(2)}%
          </Tag>
        );
      }
    },
    {
      title: t('purchasesPayment.table.amount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      align: 'right',
      render: (amount) => (
        <strong style={{ color: '#52c41a', fontSize: 15 }}>
          {amount ? `${t('purchasesPayment.misc.rm')} ${parseFloat(amount).toFixed(2)}` : t('purchasesPayment.misc.dash')}
        </strong>
      )
    },
    {
      title: t('purchasesPayment.table.paymentStatus'),
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 120,
      filters: [
        { text: t('purchasesPayment.statuses.unpaid'), value: 'unpaid' },
        { text: t('purchasesPayment.statuses.paid'), value: 'paid' }
      ],
      onFilter: (value, record) => record.payment_status === value,
      render: (status) => (
        <Tag 
          color={status === 'paid' ? 'green' : 'orange'}
          icon={status === 'paid' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
        >
          {status ? (t(`purchasesPayment.statuses.${status}`) || status.toUpperCase()) : t('purchasesPayment.statuses.unknown')}
        </Tag>
      )
    },
    {
      title: t('purchasesPayment.table.actions'),
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<DollarOutlined />}
          size="small"
          disabled={record.payment_status === 'paid'}
          onClick={() => handlePayment(record)}
        >
          {record.payment_status === 'paid' ? t('purchasesPayment.actions.paid') : t('purchasesPayment.actions.pay')}
        </Button>
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
              {t('purchasesPayment.title')}
              {activeSeason && (
                <Tag color="blue" style={{ marginLeft: 12, fontSize: 14 }}>
                  🌾 {activeSeason.season_name || t('purchasesPayment.seasonLabel').replace('{season_number}', activeSeason.season_number).replace('{year}', activeSeason.year)}
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
                {t('purchasesPayment.actions.refresh')}
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title={t('purchasesPayment.stats.totalTransactions')}
                value={stats.total}
                suffix={t('purchasesPayment.stats.transactionsSuffix')}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={t('purchasesPayment.stats.unpaid')}
                value={stats.unpaid}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={t('purchasesPayment.stats.unpaidAmount')}
                value={stats.totalUnpaidAmount}
                prefix={t('purchasesPayment.misc.rm')}
                precision={2}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={t('purchasesPayment.stats.paidAmount')}
                value={stats.totalPaidAmount}
                prefix={t('purchasesPayment.misc.rm')}
                precision={2}
                valueStyle={{ color: '#52c41a' }}
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
            showTotal: (total) => t('purchasesPayment.pagination.totalTransactions').replace('{total}', total),
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: 1200 }}
        />
      </Space>

      {/* Payment Modal */}
      <Modal
        title={
          <div style={{ fontSize: 14 }}>
            <DollarOutlined style={{ color: '#52c41a', marginRight: 6 }} />
            {t('purchasesPayment.modal.title')}
          </div>
        }
        open={paymentModalOpen}
        onOk={handlePaymentConfirm}
        onCancel={() => {
          setPaymentModalOpen(false);
          form.resetFields();
        }}
        okText={t('purchasesPayment.modal.confirmPayment')}
        okButtonProps={{ icon: <CheckCircleOutlined />, size: 'middle' }}
        cancelButtonProps={{ size: 'middle' }}
        width={500}
        centered
        destroyOnClose
      >
        {selectedTransaction && (
          <PaymentModalContent 
            transaction={selectedTransaction}
            form={form}
            seasonDeductionConfig={activeSeason?.deduction_config || []}
          />
        )}
      </Modal>
    </Card>
  );
};

export default Payment;
