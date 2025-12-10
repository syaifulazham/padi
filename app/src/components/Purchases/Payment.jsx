import React, { useState, useEffect } from 'react';
import { Card, Table, Statistic, Row, Col, Button, Space, Tag, DatePicker, message, Modal, Input, Form, InputNumber, Divider, Alert } from 'antd';
import { ReloadOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, PlusOutlined, MinusCircleOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

// Payment Modal Content Component with Deduction Editing
const PaymentModalContent = ({ transaction, form }) => {
  const [previewAmount, setPreviewAmount] = useState(null);

  useEffect(() => {
    calculatePreview(form.getFieldValue('deductions') || []);
  }, []);

  const calculatePreview = (deductions) => {
    if (!deductions || !transaction) return;
    
    const netWeight = parseFloat(transaction.net_weight_kg);
    const basePrice = parseFloat(transaction.base_price_per_kg);
    const totalDeduction = deductions.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
    const effectiveWeight = netWeight * (1 - totalDeduction / 100);
    const totalAmount = effectiveWeight * basePrice;
    
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

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div style={{
        background: '#e6f7ff',
        padding: '8px 12px',
        borderRadius: 4,
        fontSize: 12
      }}>
        <strong>💡 Tip:</strong> Adjust deductions below. Amount recalculates automatically.
      </div>

      <div style={{ 
        background: '#fafafa', 
        padding: 12, 
        borderRadius: 4,
        fontSize: 12
      }}>
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <div style={{ color: '#999' }}>Receipt</div>
            <Tag color="blue" style={{ margin: 0 }}>{transaction.receipt_number}</Tag>
          </Col>
          <Col span={12}>
            <div style={{ color: '#999' }}>Farmer</div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{transaction.farmer_name}</div>
          </Col>
          <Col span={12}>
            <div style={{ color: '#999' }}>Net Weight</div>
            <strong>{parseFloat(transaction.net_weight_kg).toFixed(2)} kg</strong>
          </Col>
          <Col span={12}>
            <div style={{ color: '#999' }}>Price/ton</div>
            <strong>RM {(parseFloat(transaction.base_price_per_kg) * 1000).toFixed(2)}</strong>
          </Col>
        </Row>
      </div>

      <Form 
        form={form} 
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        <Form.List name="deductions">
          {(fields, { add, remove }) => (
            <>
              <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                Deductions:
              </div>
              {fields.map((field, index) => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 6 }} align="baseline" size="small">
                  <Form.Item
                    {...field}
                    label={index === 0 ? "Type" : ""}
                    name={[field.name, 'deduction']}
                    rules={[{ required: true, message: 'Required' }]}
                    style={{ width: 180, marginBottom: 0 }}
                  >
                    <Input placeholder="e.g., Moisture" size="small" />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    label={index === 0 ? "Rate (%)" : ""}
                    name={[field.name, 'value']}
                    rules={[
                      { required: true, message: 'Required' },
                      { type: 'number', min: 0, max: 100, message: '0-100%' }
                    ]}
                    style={{ width: 100, marginBottom: 0 }}
                  >
                    <InputNumber
                      placeholder="0.00"
                      precision={2}
                      min={0}
                      max={100}
                      step={0.5}
                      size="small"
                      style={{ width: '100%' }}
                      addonAfter="%"
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
                  Add Deduction
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

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
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>💰 Payment Summary</div>
              <Row gutter={[8, 4]}>
                <Col span={12} style={{ color: '#666' }}>Net Weight:</Col>
                <Col span={12} style={{ textAlign: 'right', fontWeight: 500 }}>
                  {parseFloat(transaction.net_weight_kg).toFixed(2)} kg
                </Col>
                <Col span={12} style={{ color: '#ff4d4f' }}>Deduction:</Col>
                <Col span={12} style={{ textAlign: 'right', fontWeight: 500, color: '#ff4d4f' }}>
                  -{previewAmount.totalDeduction}% (-{previewAmount.deductedWeight} kg)
                </Col>
                <Col span={12} style={{ color: '#1890ff' }}>Effective Weight:</Col>
                <Col span={12} style={{ textAlign: 'right', fontWeight: 600, color: '#1890ff' }}>
                  {previewAmount.effectiveWeight} kg
                </Col>
                <Col span={24}><Divider style={{ margin: '4px 0' }} /></Col>
                <Col span={12} style={{ fontWeight: 600, fontSize: 14 }}>Total Amount:</Col>
                <Col span={12} style={{ textAlign: 'right', fontWeight: 700, color: '#52c41a', fontSize: 16 }}>
                  RM {previewAmount.totalAmount}
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
        setTransactions(result.data || []);
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
      
      message.loading({ content: 'Processing payment...', key: 'payment' });
      
      // Update deductions and recalculate amount
      const result = await window.electronAPI.purchases?.updatePayment({
        transaction_id: selectedTransaction.transaction_id,
        deduction_config: values.deductions || [],
        payment_status: 'paid'
      });
      
      if (result?.success) {
        message.success({ content: 'Payment recorded successfully', key: 'payment' });
        
        // Regenerate receipt with updated deductions
        try {
          const printResult = await window.electronAPI.printer?.purchaseReceipt(selectedTransaction.transaction_id);
          if (printResult?.success) {
            if (printResult.mode === 'pdf') {
              message.success({
                content: (
                  <div>
                    <div>📄 Receipt regenerated: {printResult.filename}</div>
                    <div style={{ fontSize: '12px', marginTop: 4 }}>Location: {printResult.path}</div>
                  </div>
                ),
                duration: 5
              });
            } else {
              message.success('Receipt printed successfully');
            }
          }
        } catch (printError) {
          console.error('Print error:', printError);
          message.warning('Payment recorded but receipt printing failed');
        }
        
        setPaymentModalOpen(false);
        form.resetFields();
        loadTransactions();
      } else {
        message.error({ content: result?.error || 'Failed to record payment', key: 'payment' });
      }
    } catch (error) {
      console.error('Payment failed:', error);
      message.error({ content: 'Failed to record payment', key: 'payment' });
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
      title: 'Receipt',
      dataIndex: 'receipt_number',
      key: 'receipt_number',
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Date',
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      width: 120,
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-'
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
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 180,
      render: (text) => text ? <Tag color="green">{text}</Tag> : <Tag>-</Tag>
    },
    {
      title: 'Net Weight (kg)',
      dataIndex: 'net_weight_kg',
      key: 'net_weight_kg',
      width: 120,
      align: 'right',
      render: (weight) => (
        <strong>{weight ? parseFloat(weight).toFixed(2) : '-'}</strong>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      align: 'right',
      render: (amount) => (
        <strong style={{ color: '#52c41a', fontSize: 15 }}>
          {amount ? `RM ${parseFloat(amount).toFixed(2)}` : '-'}
        </strong>
      )
    },
    {
      title: 'Payment Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 120,
      filters: [
        { text: 'Unpaid', value: 'unpaid' },
        { text: 'Paid', value: 'paid' }
      ],
      onFilter: (value, record) => record.payment_status === value,
      render: (status) => (
        <Tag 
          color={status === 'paid' ? 'green' : 'orange'}
          icon={status === 'paid' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
        >
          {status?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
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
          {record.payment_status === 'paid' ? 'Paid' : 'Pay'}
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
              💰 Payment Management
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
            </Space>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Transactions"
                value={stats.total}
                suffix="transactions"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Unpaid"
                value={stats.unpaid}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Unpaid Amount"
                value={stats.totalUnpaidAmount}
                prefix="RM"
                precision={2}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Paid Amount"
                value={stats.totalPaidAmount}
                prefix="RM"
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
            showTotal: (total) => `Total ${total} transactions`,
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
            Record Payment
          </div>
        }
        open={paymentModalOpen}
        onOk={handlePaymentConfirm}
        onCancel={() => {
          setPaymentModalOpen(false);
          form.resetFields();
        }}
        okText="Confirm Payment"
        okButtonProps={{ icon: <CheckCircleOutlined />, size: 'middle' }}
        cancelButtonProps={{ size: 'middle' }}
        width={500}
        centered
      >
        {selectedTransaction && (
          <PaymentModalContent 
            transaction={selectedTransaction}
            form={form}
          />
        )}
      </Modal>
    </Card>
  );
};

export default Payment;
