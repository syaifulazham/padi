import React, { useState, useEffect } from 'react';
import { Card, Table, Statistic, Row, Col, Button, Space, Tag, DatePicker, message, Modal, Input, Form, InputNumber, Divider, Alert, Radio, Descriptions, Progress } from 'antd';
import { ReloadOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, PlusOutlined, MinusCircleOutlined, PrinterOutlined, SettingOutlined, AppstoreOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useI18n } from '../../i18n/I18nProvider';
import './SalesNote.css';

const { RangePicker } = DatePicker;

// Deduction Modal Content Component for updating receipt deductions
const DeductionModalContent = ({ receipt, form, seasonDeductionConfig }) => {
  const { t } = useI18n();
  const [previewAmount, setPreviewAmount] = useState(null);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [deductionPresets, setDeductionPresets] = useState([]);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);

  useEffect(() => {
    calculatePreview(form.getFieldValue('deductions') || []);
  }, [receipt]);

  useEffect(() => {
    const raw = seasonDeductionConfig || [];
    const isNewFormat = Array.isArray(raw) && raw.length > 0 && raw[0]?.preset_name !== undefined;
    const presets = isNewFormat
      ? raw
      : (Array.isArray(raw) && raw.length > 0
        ? [{ preset_name: 'Standard', deductions: raw }]
        : []);

    setDeductionPresets(presets);
    setSelectedPresetIndex(0);
  }, [seasonDeductionConfig]);

  const calculatePreview = (deductions) => {
    if (!deductions || !receipt) return;
    
    const netWeight = parseFloat(receipt.net_weight_kg);
    const basePrice = parseFloat(receipt.base_price_per_kg);
    const finalPrice = parseFloat(receipt.final_price_per_kg) || basePrice;
    const totalDeduction = deductions.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
    const effectiveWeightRaw = netWeight * (1 - totalDeduction / 100);
    const effectiveWeight = Math.round(effectiveWeightRaw);
    const totalAmount = effectiveWeight * finalPrice;
    
    setPreviewAmount({
      totalDeduction: totalDeduction.toFixed(2),
      effectiveWeight: effectiveWeight.toString(),
      deductedWeight: (netWeight - effectiveWeight).toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    });
    
    form.setFieldsValue({ amount: totalDeduction === 0 ? undefined : totalAmount });
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
        <strong>Update Deductions:</strong> Adjust deduction percentages to recalculate the total amount for this receipt.
      </div>

      <div style={{ 
        background: '#fafafa', 
        padding: 12, 
        borderRadius: 4,
        fontSize: 12
      }}>
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <div style={{ color: '#999' }}>Receipt Number</div>
            <Tag color="blue" style={{ margin: 0 }}>{receipt.receipt_number}</Tag>
          </Col>
          <Col span={12}>
            <div style={{ color: '#999' }}>Farmer</div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{receipt.farmer_name}</div>
          </Col>
          <Col span={12}>
            <div style={{ color: '#999' }}>Net Weight</div>
            <strong>{parseFloat(receipt.net_weight_kg).toFixed(2)} kg</strong>
          </Col>
          <Col span={12}>
            <div style={{ color: '#999' }}>Price/Ton</div>
            <strong>RM {(parseFloat(receipt.base_price_per_kg) * 1000).toFixed(2)}</strong>
          </Col>
        </Row>
      </div>

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 500, fontSize: 13 }}>Deduction Configuration</div>
          {deductionPresets.length > 1 && (
            <Button
              size="small"
              icon={<AppstoreOutlined />}
              onClick={() => setPresetModalOpen(true)}
            >
              Apply Preset
            </Button>
          )}
        </div>

        <Form.List name="deductions">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    name={[field.name, 'deduction']}
                    fieldKey={[field.fieldKey, 'deduction']}
                    rules={[{ required: true, message: 'Required' }]}
                    style={{ marginBottom: 0, flex: 1 }}
                  >
                    <Input placeholder="Deduction name" />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'value']}
                    fieldKey={[field.fieldKey, 'value']}
                    rules={[
                      { required: true, message: 'Required' },
                      { type: 'number', min: 0, max: 100, message: '0-100%' }
                    ]}
                    style={{ marginBottom: 0, width: 100 }}
                  >
                    <InputNumber
                      placeholder="0.00"
                      precision={2}
                      min={0}
                      max={100}
                      step={0.5}
                      addonAfter="%"
                    />
                  </Form.Item>
                  {fields.length > 1 && (
                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                  )}
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Deduction
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Modal
          title="Apply Deduction Preset"
          open={presetModalOpen}
          onOk={() => {
            applyPreset(deductionPresets[selectedPresetIndex]);
            setPresetModalOpen(false);
          }}
          onCancel={() => setPresetModalOpen(false)}
        >
          {deductionPresets.length === 0 ? (
            <Alert message="No presets available" type="info" />
          ) : (
            <Radio.Group
              style={{ width: '100%' }}
              value={selectedPresetIndex}
              onChange={(e) => setSelectedPresetIndex(e.target.value)}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {deductionPresets.map((p, idx) => (
                  <Radio key={idx} value={idx}>
                    {p?.preset_name || `Preset ${idx + 1}`}
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
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Calculation Summary</div>
              <Row gutter={[8, 4]}>
                <Col span={12} style={{ color: '#666' }}>Net Weight</Col>
                <Col span={12} style={{ textAlign: 'right', fontWeight: 500 }}>
                  {parseFloat(receipt.net_weight_kg).toFixed(2)} kg
                </Col>
                <Col span={12} style={{ color: '#ff4d4f' }}>Deduction</Col>
                <Col span={12} style={{ textAlign: 'right', fontWeight: 500, color: '#ff4d4f' }}>
                  -{previewAmount.totalDeduction}% (-{previewAmount.deductedWeight} kg)
                </Col>
                <Col span={12} style={{ color: '#1890ff' }}>Effective Weight</Col>
                <Col span={12} style={{ textAlign: 'right', fontWeight: 600, color: '#1890ff' }}>
                  {previewAmount.effectiveWeight} kg
                </Col>
                <Col span={24}><Divider style={{ margin: '4px 0' }} /></Col>
                <Col span={12} style={{ fontWeight: 600, fontSize: 14 }}>Total Amount</Col>
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

const SalesNote = () => {
  const { t } = useI18n();
  const [salesNotes, setSalesNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('day')]);
  const [activeSeason, setActiveSeason] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSalesNote, setSelectedSalesNote] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [deductionModalOpen, setDeductionModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [form] = Form.useForm();
  const [bulkDeductionModalOpen, setBulkDeductionModalOpen] = useState(false);
  const [bulkUpdateProgress, setBulkUpdateProgress] = useState(0);
  const [bulkUpdateTotal, setBulkUpdateTotal] = useState(0);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [selectedPresetForBulk, setSelectedPresetForBulk] = useState(0);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [userInputCode, setUserInputCode] = useState('');
  const [pendingSalesNote, setPendingSalesNote] = useState(null);

  useEffect(() => {
    loadActiveSeason();
  }, []);

  useEffect(() => {
    if (activeSeason) {
      loadSalesNotes();
    }
  }, [dateRange, activeSeason]);

  const loadActiveSeason = async () => {
    try {
      const result = await window.electronAPI.seasons?.getActive();
      if (result?.success && result.data) {
        setActiveSeason(result.data);
        console.log('✅ Active season loaded for sales notes:', result.data);
      }
    } catch (error) {
      console.error('Failed to load active season:', error);
    }
  };

  const loadSalesNotes = async () => {
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
        season_id: activeSeason.season_id
      });
      
      if (result?.success) {
        setSalesNotes(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load sales notes:', error);
      setSalesNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (salesNote) => {
    setSelectedSalesNote(salesNote);
    
    try {
      const result = await window.electronAPI.sales?.getById(salesNote.sales_id);
      if (result?.success && result.data?.purchase_receipts) {
        setReceipts(result.data.purchase_receipts);
        setDetailModalOpen(true);
      } else {
        message.error('Failed to load receipts for this sales note');
        console.error('Sales getById result:', result);
      }
    } catch (error) {
      console.error('Failed to load sales note details:', error);
      message.error('Failed to load sales note details');
    }
  };

  const handleUpdateDeduction = (receipt) => {
    setSelectedReceipt(receipt);
    
    let deductions = [];
    try {
      if (receipt.deduction_config) {
        deductions = typeof receipt.deduction_config === 'string' 
          ? JSON.parse(receipt.deduction_config) 
          : receipt.deduction_config;
      }
    } catch (error) {
      console.error('Error parsing deduction_config:', error);
      deductions = [];
    }
    
    const totalDeduction = deductions.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
    
    form.setFieldsValue({
      amount: totalDeduction === 0 ? undefined : receipt.total_amount,
      deductions: deductions.length > 0 ? deductions : []
    });
    
    setDeductionModalOpen(true);
  };

  const handleDeductionConfirm = async () => {
    try {
      const values = await form.validateFields();
      
      message.loading({ content: 'Updating deduction...', key: 'deduction' });
      
      const deductions = values.deductions || [];
      const netWeight = parseFloat(selectedReceipt.net_weight_kg);
      const finalPrice = parseFloat(selectedReceipt.final_price_per_kg) || parseFloat(selectedReceipt.base_price_per_kg);
      const totalDeductionRate = deductions.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
      const effectiveWeightRaw = netWeight * (1 - totalDeductionRate / 100);
      const effectiveWeight = Math.round(effectiveWeightRaw);
      const totalAmount = effectiveWeight * finalPrice;
      
      const result = await window.electronAPI.purchases?.updatePayment({
        transaction_id: selectedReceipt.transaction_id,
        deduction_config: deductions,
        effective_weight_kg: effectiveWeight,
        total_amount: totalAmount,
        payment_status: 'paid'
      });
      
      if (result?.success) {
        message.success({ content: 'Deduction updated successfully!', key: 'deduction' });
        setDeductionModalOpen(false);
        form.resetFields();
        
        const updatedResult = await window.electronAPI.sales?.getById(selectedSalesNote.sales_id);
        if (updatedResult?.success && updatedResult.data?.receipts) {
          setReceipts(updatedResult.data.receipts);
        }
        
        loadSalesNotes();
      } else {
        message.error({ content: result?.error || 'Failed to update deduction', key: 'deduction' });
      }
    } catch (error) {
      console.error('Error updating deduction:', error);
      message.error({ content: 'Failed to update deduction', key: 'deduction' });
    }
  };

  const handlePrintReceipt = async (receipt) => {
    try {
      message.loading({ content: 'Printing receipt...', key: 'print' });
      
      const result = await window.electronAPI.printer?.purchaseReceipt(receipt.transaction_id, { forcePrint: true });
      
      if (result?.success) {
        if (result.mode === 'pdf') {
          message.success({ content: 'Receipt opened in PDF viewer', key: 'print' });
        } else {
          message.success({ content: 'Receipt printed successfully!', key: 'print' });
        }
      } else {
        message.error({ content: result?.error || 'Failed to print receipt', key: 'print' });
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      message.error({ content: 'Failed to print receipt', key: 'print' });
    }
  };

  const handlePrintSalesNote = async (salesNote) => {
    try {
      console.log('🖨️  Printing sales receipt for:', salesNote.sales_number);
      const result = await window.electronAPI.printer?.salesReceipt(salesNote.sales_id, { forcePrint: true });
      
      if (result?.success) {
        if (result.mode === 'pdf') {
          message.success('Sales receipt opened in PDF viewer');
        } else {
          message.success('Sales receipt printed successfully');
        }
      } else {
        message.error(result?.error || 'Failed to print sales receipt');
      }
    } catch (error) {
      console.error('Error printing sales receipt:', error);
      message.error('Failed to print sales receipt');
    }
  };

  const handleViewSalesNote = async (salesNote) => {
    try {
      console.log('👁️  Previewing sales receipt for:', salesNote.sales_number);
      
      // Fetch full sales note details
      const result = await window.electronAPI.sales?.getById(salesNote.sales_id);
      if (!result?.success || !result.data) {
        message.error('Failed to load sales note details');
        return;
      }

      // Generate preview HTML
      const previewResult = await window.electronAPI.printer?.salesReceipt(salesNote.sales_id, { preview: true });
      
      if (previewResult?.success && previewResult.html) {
        setPreviewHtml(previewResult.html);
        setPreviewModalOpen(true);
      } else {
        message.error('Failed to generate sales receipt preview');
      }
    } catch (error) {
      console.error('Error previewing sales receipt:', error);
      message.error('Failed to preview sales receipt');
    }
  };

  const generateVerificationCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleBulkDeductionOpen = async (salesNote) => {
    try {
      const result = await window.electronAPI.sales?.getById(salesNote.sales_id);
      if (!result?.success || !result.data?.purchase_receipts) {
        message.error('Failed to load receipts for this sales note');
        return;
      }

      const receipts = result.data.purchase_receipts;
      
      // Check if this sales note is completed (all receipts have deductions)
      const isCompleted = receipts.length > 0 && receipts.every(r => {
        const deductionConfig = r.deduction_config;
        if (!deductionConfig || deductionConfig === '[]' || deductionConfig === '') return false;
        try {
          const deductions = typeof deductionConfig === 'string' ? JSON.parse(deductionConfig) : deductionConfig;
          return Array.isArray(deductions) && deductions.length > 0;
        } catch {
          return false;
        }
      });

      if (isCompleted) {
        // Show verification modal for completed sales notes
        const code = generateVerificationCode();
        setVerificationCode(code);
        setUserInputCode('');
        setPendingSalesNote(salesNote);
        setReceipts(receipts);
        setVerificationModalOpen(true);
        console.log('🔒 Sales note is completed. Verification required. Code:', code);
      } else {
        // Open bulk deduction modal directly for incomplete sales notes
        setSelectedSalesNote(salesNote);
        setReceipts(receipts);
        setBulkDeductionModalOpen(true);
        setSelectedPresetForBulk(0);
      }
    } catch (error) {
      console.error('Failed to load sales note receipts:', error);
      message.error('Failed to load sales note receipts');
    }
  };

  const handleVerificationSubmit = () => {
    if (userInputCode.toUpperCase() === verificationCode) {
      message.success('Verification successful');
      setVerificationModalOpen(false);
      setSelectedSalesNote(pendingSalesNote);
      setBulkDeductionModalOpen(true);
      setSelectedPresetForBulk(0);
      setVerificationCode('');
      setUserInputCode('');
      setPendingSalesNote(null);
    } else {
      message.error('Verification code does not match');
      setUserInputCode('');
    }
  };

  const handleBulkDeductionUpdate = async () => {
    if (!activeSeason?.deduction_config) {
      message.error('No deduction presets configured for this season');
      return;
    }

    const raw = activeSeason.deduction_config;
    const isNewFormat = Array.isArray(raw) && raw.length > 0 && raw[0]?.preset_name !== undefined;
    const presets = isNewFormat
      ? raw
      : (Array.isArray(raw) && raw.length > 0
        ? [{ preset_name: 'Standard', deductions: raw }]
        : []);

    if (presets.length === 0) {
      message.error('No deduction presets available');
      return;
    }

    const selectedPreset = presets[selectedPresetForBulk];
    if (!selectedPreset || !selectedPreset.deductions) {
      message.error('Invalid preset selected');
      return;
    }

    setBulkUpdating(true);
    setBulkUpdateProgress(0);
    setBulkUpdateTotal(receipts.length);

    let successCount = 0;
    let failCount = 0;

    const processedTransactionIds = new Set(); // Track processed receipts to avoid duplicates

    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i];
      
      // Skip if already processed (e.g., as a sibling)
      if (processedTransactionIds.has(receipt.transaction_id)) {
        setBulkUpdateProgress(i + 1);
        continue;
      }
      
      try {
        // Calculate new effective weight and total amount
        const netWeight = parseFloat(receipt.net_weight_kg);
        const pricePerKg = parseFloat(receipt.final_price_per_kg || receipt.base_price_per_kg);
        const totalDeductionRate = selectedPreset.deductions.reduce(
          (sum, d) => sum + parseFloat(d.value || 0),
          0
        );
        const effectiveWeight = Math.round(netWeight * (1 - totalDeductionRate / 100));
        const totalAmount = effectiveWeight * pricePerKg;

        // Set payment_status based on deductions: 'paid' if deductions > 0, else 'unpaid'
        const paymentStatus = totalDeductionRate > 0 ? 'paid' : 'unpaid';

        // Collect all transaction IDs to update (current + parent + siblings)
        const transactionsToUpdate = [receipt.transaction_id];
        
        // If this is a split receipt, also update parent and siblings
        if (receipt.parent_transaction_id) {
          console.log(`📋 Receipt ${receipt.receipt_number} is a split receipt. Fetching parent and siblings...`);
          
          // Add parent
          transactionsToUpdate.push(receipt.parent_transaction_id);
          
          // Fetch and add siblings
          const siblingsResult = await window.electronAPI.purchases?.getSplitChildren(receipt.parent_transaction_id);
          if (siblingsResult?.success && siblingsResult.data) {
            siblingsResult.data.forEach(sibling => {
              if (sibling.transaction_id !== receipt.transaction_id) {
                transactionsToUpdate.push(sibling.transaction_id);
              }
            });
          }
          
          console.log(`✅ Will update ${transactionsToUpdate.length} receipts (current + parent + siblings)`);
        }

        // Update all related receipts
        for (const txId of transactionsToUpdate) {
          const result = await window.electronAPI.purchases.updatePayment({
            transaction_id: txId,
            deduction_config: selectedPreset.deductions,
            effective_weight_kg: effectiveWeight,
            total_amount: totalAmount,
            payment_status: paymentStatus
          });

          if (result?.success) {
            processedTransactionIds.add(txId);
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to update transaction ${txId}:`, result?.error);
          }
        }
      } catch (error) {
        failCount++;
        console.error(`Error updating receipt ${receipt.receipt_number}:`, error);
      }

      setBulkUpdateProgress(i + 1);
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setBulkUpdating(false);
    setBulkDeductionModalOpen(false);
    
    if (failCount === 0) {
      message.success(`Successfully updated ${successCount} receipt(s)`);
    } else {
      message.warning(`Updated ${successCount} receipt(s), ${failCount} failed`);
    }

    // Reload sales notes to reflect changes
    loadSalesNotes();
  };

  const columns = [
    {
      title: 'Sales Number',
      dataIndex: 'sales_number',
      key: 'sales_number',
      render: (text, record) => (
        <Tag 
          color="blue" 
          style={{ cursor: 'pointer' }}
          onClick={() => handleViewDetails(record)}
        >
          {text}
        </Tag>
      )
    },
    {
      title: 'Date',
      dataIndex: 'sale_date',
      key: 'sale_date',
      render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Manufacturer',
      dataIndex: 'manufacturer_name',
      key: 'manufacturer_name',
    },
    {
      title: 'Vehicle',
      dataIndex: 'vehicle_number',
      key: 'vehicle_number',
    },
    {
      title: 'Total Weight',
      dataIndex: 'total_quantity_kg',
      key: 'total_quantity_kg',
      render: (text) => `${parseFloat(text).toFixed(2)} kg`,
      align: 'right'
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (text) => `RM ${parseFloat(text).toFixed(2)}`,
      align: 'right'
    },
    {
      title: 'Receipts',
      dataIndex: 'receipts_count',
      key: 'receipts_count',
      align: 'center'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleBulkDeductionOpen(record)}
          />
          <Button
            type="link"
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => handlePrintSalesNote(record)}
          />
        </Space>
      )
    }
  ];

  const receiptColumns = [
    {
      title: 'Receipt Number',
      dataIndex: 'receipt_number',
      key: 'receipt_number',
      render: (text) => <Tag color="green">{text}</Tag>
    },
    {
      title: 'Farmer',
      dataIndex: 'farmer_name',
      key: 'farmer_name',
    },
    {
      title: 'Net Weight',
      dataIndex: 'net_weight_kg',
      key: 'net_weight_kg',
      render: (text) => `${parseFloat(text).toFixed(2)} kg`,
      align: 'right'
    },
    {
      title: 'Price/kg',
      dataIndex: 'base_price_per_kg',
      key: 'base_price_per_kg',
      render: (text) => `RM ${parseFloat(text).toFixed(2)}`,
      align: 'right'
    },
    {
      title: 'Deduction',
      dataIndex: 'deduction_config',
      key: 'deduction_config',
      render: (config) => {
        try {
          const deductions = typeof config === 'string' ? JSON.parse(config) : config;
          if (!deductions || deductions.length === 0) return '-';
          const total = deductions.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
          return <Tag color="orange">{total.toFixed(2)}%</Tag>;
        } catch {
          return '-';
        }
      },
      align: 'center'
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (text) => `RM ${parseFloat(text).toFixed(2)}`,
      align: 'right'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<DollarOutlined />}
            onClick={() => handleUpdateDeduction(record)}
          >
            Update
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => handlePrintReceipt(record)}
          >
            Print
          </Button>
        </Space>
      )
    }
  ];

  const totalAmount = salesNotes.reduce((sum, note) => sum + parseFloat(note.total_amount || 0), 0);

  return (
    <div>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Statistic
                title="Total Sales Notes"
                value={salesNotes.length}
                prefix={<DollarOutlined />}
              />
            </Col>
            <Col xs={24} sm={12}>
              <Statistic
                title="Total Amount"
                value={totalAmount}
                precision={2}
                prefix="RM"
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
          </Row>

          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              format="DD/MM/YYYY"
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={loadSalesNotes}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>

          <Table
            dataSource={salesNotes}
            columns={columns}
            rowKey="sales_id"
            loading={loading}
            pagination={{ pageSize: 20 }}
            rowClassName={(record) => {
              // Green background if all receipts have deductions set
              const receiptsCount = Number(record.receipts_count);
              const receiptsWithDeductions = Number(record.receipts_with_deductions);
              console.log(`Sales ${record.sales_number}: receipts_count=${receiptsCount}, receipts_with_deductions=${receiptsWithDeductions}, types: ${typeof record.receipts_count}, ${typeof record.receipts_with_deductions}`);
              if (receiptsCount > 0 && receiptsCount === receiptsWithDeductions) {
                console.log(`✅ Applying green background to ${record.sales_number}`);
                return 'sales-note-complete';
              }
              return '';
            }}
          />
        </Space>
      </Card>

      <Modal
        title={`Sales Note: ${selectedSalesNote?.sales_number}`}
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setSelectedSalesNote(null);
          setReceipts([]);
        }}
        footer={[
          <Button key="view" icon={<PrinterOutlined />} onClick={() => handleViewSalesNote(selectedSalesNote)}>
            View
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => handlePrintSalesNote(selectedSalesNote)}>
            Print
          </Button>,
          <Button key="close" onClick={() => {
            setDetailModalOpen(false);
            setSelectedSalesNote(null);
            setReceipts([]);
          }}>
            Close
          </Button>
        ]}
        width={1200}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Manufacturer">{selectedSalesNote?.manufacturer_name}</Descriptions.Item>
            <Descriptions.Item label="Date">{dayjs(selectedSalesNote?.sale_date).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="Vehicle">{selectedSalesNote?.vehicle_number}</Descriptions.Item>
            <Descriptions.Item label="Driver">{selectedSalesNote?.driver_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="Total Weight">{parseFloat(selectedSalesNote?.total_quantity_kg || 0).toFixed(2)} kg</Descriptions.Item>
            <Descriptions.Item label="Total Amount">RM {parseFloat(selectedSalesNote?.total_amount || 0).toFixed(2)}</Descriptions.Item>
          </Descriptions>

          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Purchase Receipts</div>
            <Table
              dataSource={receipts}
              columns={receiptColumns}
              rowKey="transaction_id"
              pagination={false}
              size="small"
            />
          </div>
        </Space>
      </Modal>

      <Modal
        title="Update Deduction"
        open={deductionModalOpen}
        onOk={handleDeductionConfirm}
        onCancel={() => {
          setDeductionModalOpen(false);
          form.resetFields();
        }}
        width={600}
      >
        {selectedReceipt && (
          <DeductionModalContent
            receipt={selectedReceipt}
            form={form}
            seasonDeductionConfig={activeSeason?.deduction_config}
          />
        )}
      </Modal>

      <Modal
        title="Sales Receipt Preview"
        open={previewModalOpen}
        onCancel={() => {
          setPreviewModalOpen(false);
          setPreviewHtml('');
        }}
        footer={[
          <Button key="close" onClick={() => {
            setPreviewModalOpen(false);
            setPreviewHtml('');
          }}>
            Close
          </Button>
        ]}
        width={900}
        bodyStyle={{ padding: 0, maxHeight: '80vh', overflow: 'auto' }}
      >
        <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </Modal>

      {/* Verification Modal for Completed Sales Notes */}
      <Modal
        title="🔒 Verification Required"
        open={verificationModalOpen}
        onOk={handleVerificationSubmit}
        onCancel={() => {
          setVerificationModalOpen(false);
          setVerificationCode('');
          setUserInputCode('');
          setPendingSalesNote(null);
        }}
        okText="Verify"
        width={500}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="This sales note has been completed with deductions"
            description="To edit this sales note, please enter the verification code below."
            type="warning"
            showIcon
          />
          
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 16 }}>
              Verification Code:
            </div>
            <div style={{ 
              padding: '16px', 
              background: '#f5f5f5', 
              borderRadius: '4px',
              fontSize: '24px',
              fontWeight: 'bold',
              letterSpacing: '8px',
              textAlign: 'center',
              fontFamily: 'monospace',
              border: '2px dashed #d9d9d9'
            }}>
              {verificationCode}
            </div>
          </div>

          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              Enter Code:
            </div>
            <Input
              value={userInputCode}
              onChange={(e) => setUserInputCode(e.target.value)}
              placeholder="Enter verification code"
              maxLength={6}
              style={{ textTransform: 'uppercase', fontSize: '18px', letterSpacing: '4px', textAlign: 'center' }}
              onPressEnter={handleVerificationSubmit}
              autoFocus
            />
          </div>
        </Space>
      </Modal>

      <Modal
        title={`Bulk Update Deduction - ${selectedSalesNote?.sales_number}`}
        open={bulkDeductionModalOpen}
        onOk={handleBulkDeductionUpdate}
        onCancel={() => {
          if (!bulkUpdating) {
            setBulkDeductionModalOpen(false);
            setReceipts([]);
            setBulkUpdateProgress(0);
          }
        }}
        okText="Update All Receipts"
        okButtonProps={{ disabled: bulkUpdating }}
        cancelButtonProps={{ disabled: bulkUpdating }}
        closable={!bulkUpdating}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Alert
            message={`This will update deduction for all ${receipts.length} receipt(s) under this sales note`}
            type="info"
            showIcon
          />

          {!bulkUpdating ? (
            <>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>Select Deduction Preset:</div>
                {(() => {
                  const raw = activeSeason?.deduction_config || [];
                  const isNewFormat = Array.isArray(raw) && raw.length > 0 && raw[0]?.preset_name !== undefined;
                  const presets = isNewFormat
                    ? raw
                    : (Array.isArray(raw) && raw.length > 0
                      ? [{ preset_name: 'Standard', deductions: raw }]
                      : []);

                  if (presets.length === 0) {
                    return <Alert message="No deduction presets configured" type="warning" />;
                  }

                  return (
                    <Radio.Group
                      style={{ width: '100%' }}
                      value={selectedPresetForBulk}
                      onChange={(e) => setSelectedPresetForBulk(e.target.value)}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {presets.map((preset, idx) => (
                          <Radio key={idx} value={idx}>
                            <Space direction="vertical" size={0}>
                              <span style={{ fontWeight: 500 }}>{preset?.preset_name || `Preset ${idx + 1}`}</span>
                              <span style={{ fontSize: 12, color: '#666' }}>
                                {preset?.deductions?.map(d => `${d.deduction}: ${d.value}%`).join(', ')}
                              </span>
                            </Space>
                          </Radio>
                        ))}
                      </Space>
                    </Radio.Group>
                  );
                })()}
              </div>
            </>
          ) : (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>
                Updating receipts... ({bulkUpdateProgress} / {bulkUpdateTotal})
              </div>
              <Progress
                percent={Math.round((bulkUpdateProgress / bulkUpdateTotal) * 100)}
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                Please wait while we update all receipts...
              </div>
            </div>
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default SalesNote;
