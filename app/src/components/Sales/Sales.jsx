import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Input, InputNumber, Button, Space, Row, Col, message, Modal, Statistic, Alert, Tag, Table, Divider } from 'antd';
import { PlusOutlined, ClockCircleOutlined, TruckOutlined, SearchOutlined, SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const STORAGE_KEY = 'paddy_sales_weight_in_sessions';

const Sales = () => {
  // Load pending sessions from localStorage on mount
  const [pendingSessions, setPendingSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('✅ Loaded', parsed.length, 'pending sales sessions from storage');
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load pending sales sessions:', error);
    }
    return [];
  });
  
  const [loading, setLoading] = useState(false);
  const [containerModalOpen, setContainerModalOpen] = useState(false);
  const [recallModalOpen, setRecallModalOpen] = useState(false);
  const [manufacturerSearchModal, setManufacturerSearchModal] = useState(false);
  const [weightInMode, setWeightInMode] = useState(false);
  const [currentContainer, setCurrentContainer] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [manufacturers, setManufacturers] = useState([]);
  const [manufacturerOptions, setManufacturerOptions] = useState([]);
  const [manufacturerSearchText, setManufacturerSearchText] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [receiptSelectionModal, setReceiptSelectionModal] = useState(false);
  const [availableReceipts, setAvailableReceipts] = useState([]);
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [splitReceiptModal, setSplitReceiptModal] = useState(false);
  const [receiptToSplit, setReceiptToSplit] = useState(null);
  const [activeSeason, setActiveSeason] = useState(null);
  
  const [splitForm] = Form.useForm();
  
  const [containerForm] = Form.useForm();
  const [weightForm] = Form.useForm();
  const [finalForm] = Form.useForm();
  const containerInputRef = useRef(null);

  // Filter pending sessions by active season
  const seasonPendingSessions = pendingSessions.filter(
    session => !session.season_id || session.season_id === activeSeason?.season_id
  );

  useEffect(() => {
    loadManufacturers();
    loadActiveSeason();
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) {
        message.info(
          <span>
            📦 Restored <strong>{parsed.length}</strong> pending container{parsed.length === 1 ? '' : 's'} from storage
            <br />
            <small>Your weight-in records are safe!</small>
          </span>,
          6
        );
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingSessions));
      console.log('💾 Saved', pendingSessions.length, 'pending sales sessions to storage');
    } catch (error) {
      console.error('Failed to save pending sales sessions:', error);
      message.error('Failed to save weight-in records to storage');
    }
  }, [pendingSessions]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        showRecallModal();
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (!weightInMode && !activeSession) {
          startNewSale();
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pendingSessions, weightInMode, activeSession]);

  const loadActiveSeason = async () => {
    try {
      const result = await window.electronAPI.seasons?.getActive();
      if (result?.success && result.data) {
        setActiveSeason(result.data);
        console.log('✅ Active season loaded for sales:', result.data);
      } else {
        message.warning('No active season found. Please activate a season in Settings.');
      }
    } catch (error) {
      console.error('Failed to load active season:', error);
    }
  };

  const loadManufacturers = async () => {
    try {
      const result = await window.electronAPI.manufacturers?.getAll();
      if (result?.success) {
        setManufacturers(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load manufacturers:', error);
    }
  };

  const searchManufacturers = (searchText) => {
    if (!searchText || searchText.length < 2) {
      setManufacturerOptions([]);
      return;
    }
    const filtered = manufacturers.filter(m => {
      const searchLower = searchText.toLowerCase();
      return (
        m.company_name?.toLowerCase().includes(searchLower) ||
        m.manufacturer_code?.toLowerCase().includes(searchLower) ||
        m.registration_number?.includes(searchText)
      );
    }).slice(0, 50);
    setManufacturerOptions(filtered);
  };

  const openManufacturerSearch = () => {
    setManufacturerSearchText('');
    setManufacturerOptions([]);
    setManufacturerSearchModal(true);
  };

  const selectManufacturer = (manufacturer) => {
    setSelectedManufacturer(manufacturer);
    finalForm.setFieldsValue({ 
      manufacturer_id: manufacturer.manufacturer_id,
      manufacturer_display: `${manufacturer.company_name} (${manufacturer.manufacturer_code})`
    });
    setManufacturerSearchModal(false);
    message.success(`Selected: ${manufacturer.company_name}`);
  };

  const startNewSale = () => {
    containerForm.resetFields();
    setContainerModalOpen(true);
  };

  const handleContainerSubmit = (values) => {
    setCurrentContainer(values.vehicle_number);
    setContainerModalOpen(false);
    weightForm.resetFields();
    setWeightInMode(true);
  };

  const handleWeightIn = (values) => {
    if (!activeSeason) {
      message.error('No active season! Please activate a season in Settings.');
      return;
    }
    
    const session = {
      vehicle_number: currentContainer,
      tare_weight: values.tare_weight,
      timestamp: new Date().toISOString(),
      season_id: activeSeason.season_id  // ✅ Tie to active season
    };
    setPendingSessions([...pendingSessions, session]);
    message.success(
      <span>
        ✅ Weigh-in (tare) recorded for <strong>{currentContainer}</strong>: {values.tare_weight} kg
        <br />
        <small>💾 Container ready for loading - data saved</small>
      </span>, 5
    );
    setWeightInMode(false);
    setCurrentContainer(null);
  };

  const cancelWeightIn = () => {
    setWeightInMode(false);
    setCurrentContainer(null);
    weightForm.resetFields();
  };

  const showRecallModal = () => {
    if (seasonPendingSessions.length === 0) {
      message.warning('No pending containers to recall for this season');
      return;
    }
    setRecallModalOpen(true);
  };

  const recallContainer = (session) => {
    setActiveSession(session);
    setRecallModalOpen(false);
    setSelectedManufacturer(null);
    setSelectedReceipts([]);
    finalForm.resetFields();
    finalForm.setFieldsValue({ price_per_kg: 3.00 });
  };

  const loadAvailableReceipts = async () => {
    if (!activeSeason) {
      message.warning('No active season found');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Loading receipts for season:', activeSeason.season_id);
      const result = await window.electronAPI.purchases?.getUnsold(activeSeason.season_id);
      if (result?.success) {
        setAvailableReceipts(result.data || []);
        console.log('✅ Loaded receipts:', result.data?.length || 0);
      } else {
        message.error('Failed to load available receipts');
      }
    } catch (error) {
      console.error('Failed to load receipts:', error);
      message.error('Failed to load available receipts');
    } finally {
      setLoading(false);
    }
  };

  const openReceiptSelectionModal = async () => {
    const grossWeight = finalForm.getFieldValue('gross_weight');
    if (!grossWeight || grossWeight <= 0) {
      message.warning('Please enter gross weight first');
      return;
    }
    if (!activeSession) {
      message.warning('No active session');
      return;
    }
    
    // Load fresh receipts from active season
    await loadAvailableReceipts();
    setReceiptSelectionModal(true);
  };

  const handleReceiptSelection = (selectedRowKeys, selectedRows) => {
    setSelectedReceipts(selectedRows);
  };

  const confirmReceiptSelection = () => {
    if (selectedReceipts.length === 0) {
      message.warning('Please select at least one receipt');
      return;
    }
    setReceiptSelectionModal(false);
    message.success(`Selected ${selectedReceipts.length} receipt(s)`);
  };

  const removeSelectedReceipt = (receipt) => {
    setSelectedReceipts(selectedReceipts.filter(r => r !== receipt));
    message.info('Receipt removed from selection');
  };

  const openSplitModal = (receipt) => {
    setReceiptToSplit(receipt);
    
    // Calculate weight difference
    const grossWeight = finalForm.getFieldValue('gross_weight');
    const tareWeight = activeSession?.tare_weight || 0;
    const containerNetWeight = grossWeight && tareWeight ? grossWeight - tareWeight : 0;
    const currentSelectedTotal = selectedReceipts.reduce((sum, r) => sum + parseFloat(r.net_weight_kg || 0), 0);
    const weightDifference = containerNetWeight - currentSelectedTotal; // Positive = need more, Negative = over capacity
    
    // Debug logging
    console.log('🔍 Split Modal Calculation:', {
      grossWeight,
      tareWeight,
      containerNetWeight,
      currentSelectedTotal,
      weightDifference,
      receiptWeight: receipt.net_weight_kg,
      scenario: weightDifference < 0 ? 'OVER-CAPACITY' : 'UNDER-CAPACITY'
    });
    
    // Auto-calculate split amounts based on scenario
    let suggestedSplitWeight = 0;
    
    if (weightDifference < 0) {
      // OVER-CAPACITY: Need to REDUCE this receipt
      // Split 1 = Amount to KEEP in sale (receipt weight minus the excess)
      // Split 2 = Excess to REMOVE from sale
      const excessWeight = Math.abs(weightDifference);
      if (excessWeight < receipt.net_weight_kg) {
        suggestedSplitWeight = Math.round((receipt.net_weight_kg - excessWeight) * 100) / 100;
      }
    } else if (weightDifference > 0) {
      // UNDER-CAPACITY: Need to ADD more weight
      // Split 1 = Amount to ADD to sale
      // Split 2 = Remainder stays in original receipt
      if (weightDifference < receipt.net_weight_kg) {
        suggestedSplitWeight = Math.round(weightDifference * 100) / 100;
      }
    }
    
    console.log('💡 Suggested Split Weight:', suggestedSplitWeight, 'Remaining:', receipt.net_weight_kg - suggestedSplitWeight);
    
    splitForm.setFieldsValue({
      original_weight: receipt.net_weight_kg,
      split_weight: suggestedSplitWeight,
      remaining_weight: receipt.net_weight_kg - suggestedSplitWeight,
      weight_needed: weightDifference
    });
    setSplitReceiptModal(true);
  };

  const handleSplitWeightChange = (splitWeight) => {
    const originalWeight = receiptToSplit?.net_weight_kg || 0;
    const remaining = originalWeight - (splitWeight || 0);
    splitForm.setFieldsValue({ remaining_weight: remaining });
  };

  const confirmSplitReceipt = (values) => {
    if (values.split_weight <= 0 || values.split_weight >= receiptToSplit.net_weight_kg) {
      message.error('Split weight must be greater than 0 and less than original weight');
      return;
    }

    // Determine if we're in over-capacity scenario
    const weightNeeded = values.weight_needed;
    const isOverCapacity = weightNeeded < 0;

    // Create split portion (the amount specified in split_weight)
    const splitReceipt = {
      ...receiptToSplit,
      receipt_number: `${receiptToSplit.receipt_number}-SPLIT`,
      net_weight_kg: values.split_weight,
      is_split: true,
      original_receipt: receiptToSplit.receipt_number
    };

    // Create remaining portion
    const remainingReceipt = {
      ...receiptToSplit,
      net_weight_kg: values.remaining_weight,
      has_been_split: true
    };

    let updatedSelected;

    if (isOverCapacity) {
      // OVER-CAPACITY: Replace original with split portion only (keep in sale)
      // The remaining portion is removed from selection
      updatedSelected = selectedReceipts.map(r => 
        r.transaction_id === receiptToSplit.transaction_id ? splitReceipt : r
      );
      message.success(
        <span>
          Receipt split! Keeping <strong>{values.split_weight} kg</strong> in sale, 
          removed <strong>{values.remaining_weight} kg</strong> excess
        </span>
      );
    } else {
      // UNDER-CAPACITY: Keep original updated + add split portion
      updatedSelected = selectedReceipts.map(r => 
        r.transaction_id === receiptToSplit.transaction_id ? remainingReceipt : r
      );
      updatedSelected.push(splitReceipt);
      message.success(
        <span>
          Receipt split! Added <strong>{values.split_weight} kg</strong> to sale, 
          <strong>{values.remaining_weight} kg</strong> stays in original
        </span>
      );
    }

    setSelectedReceipts(updatedSelected);
    setSplitReceiptModal(false);
  };

  const selectedTotalWeight = selectedReceipts.reduce((sum, r) => sum + parseFloat(r.net_weight_kg || 0), 0);

  const completeSale = async (values) => {
    if (!values.manufacturer_id) {
      message.error('Please select a manufacturer');
      return;
    }
    if (!values.gross_weight || values.gross_weight <= 0) {
      message.error('Please enter valid gross weight');
      return;
    }
    const netWeight = values.gross_weight - activeSession.tare_weight;
    if (netWeight <= 0) {
      message.error('Net weight must be greater than zero');
      return;
    }
    if (selectedReceipts.length === 0) {
      message.error('Please select purchase receipts for this sale');
      return;
    }
    const weightDifference = Math.abs(netWeight - selectedTotalWeight);
    if (weightDifference > 0.5) {
      message.error(`Weight mismatch: Container net (${netWeight.toFixed(2)} kg) vs Selected receipts (${selectedTotalWeight.toFixed(2)} kg). Difference: ${weightDifference.toFixed(2)} kg. Please adjust selection or split a receipt.`);
      return;
    }
    if (!values.price_per_kg || values.price_per_kg <= 0) {
      message.error('Please enter valid price per kg');
      return;
    }
    
    setLoading(true);
    try {
      if (!activeSeason) {
        message.error('No active season! Please activate a season in Settings.');
        setLoading(false);
        return;
      }
      
      const saleData = {
        season_id: activeSeason.season_id,
        manufacturer_id: values.manufacturer_id,
        gross_weight_kg: parseFloat(values.gross_weight),
        tare_weight_kg: parseFloat(activeSession.tare_weight),
        net_weight_kg: parseFloat(netWeight),
        base_price_per_kg: parseFloat(values.price_per_kg),
        vehicle_number: activeSession.vehicle_number,
        driver_name: values.driver_name || null,
        purchase_receipts: selectedReceipts.map(r => ({
          transaction_id: r.transaction_id,
          receipt_number: r.receipt_number,
          net_weight_kg: r.net_weight_kg
        })),
        created_by: 1
      };
      console.log('Submitting sale data:', saleData);
      const result = await window.electronAPI.sales?.create(saleData);
      
      if (result?.success) {
        message.success(
          <span>
            ✅ Sale completed! Receipt: <strong>{result.data.receipt_number}</strong>
            <br />
            <small>🗑️ Weight-in record removed from storage</small>
          </span>, 5
        );
        setPendingSessions(pendingSessions.filter(s => s.vehicle_number !== activeSession.vehicle_number));
        setActiveSession(null);
        setSelectedManufacturer(null);
        setSelectedReceipts([]);
        finalForm.resetFields();
        
        // Trigger navbar stats refresh
        console.log('✅ Sale completed, dispatching transaction-completed event');
        window.dispatchEvent(new Event('transaction-completed'));
      } else {
        message.error('Failed to save sale: ' + (result?.error || 'Unknown error'));
      }
    } catch (error) {
      message.error('Failed to complete sale');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cancelWeighOut = () => {
    setActiveSession(null);
    setSelectedManufacturer(null);
    setSelectedReceipts([]);
    finalForm.resetFields();
  };

  const receiptColumns = [
    {
      title: 'Receipt',
      dataIndex: 'receipt_number',
      key: 'receipt_number',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Date',
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-'
    },
    {
      title: 'Farmer',
      dataIndex: 'farmer_name',
      key: 'farmer_name',
    },
    {
      title: 'Net Weight (kg)',
      dataIndex: 'net_weight_kg',
      key: 'net_weight_kg',
      align: 'right',
      render: (weight) => <strong>{parseFloat(weight).toFixed(2)}</strong>
    }
  ];

  return (
    <div onContextMenu={(e) => { e.preventDefault(); showRecallModal(); }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card>
            <Statistic
              title={
                <span>
                  Pending Containers (Waiting for Weigh-Out)
                  <Tag color="green" style={{ marginLeft: 8, fontSize: '10px' }}>💾 Auto-Save</Tag>
                </span>
              }
              value={seasonPendingSessions.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
              Records safe from page refresh
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Active Session"
              value={activeSession ? `${activeSession.vehicle_number}` : 'None'}
              valueStyle={{ color: activeSession ? '#52c41a' : '#d9d9d9' }}
            />
          </Card>
        </Col>
      </Row>

      {weightInMode && (
        <Card style={{ marginBottom: 16, background: '#fffbe6', borderColor: '#faad14' }}>
          <Alert
            message={`Weigh In (Tare): ${currentContainer}`}
            description="Enter the EMPTY container weight (before loading)"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form form={weightForm} layout="vertical" onFinish={handleWeightIn}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="tare_weight" label="Tare Weight - Empty Container (KG)" rules={[{ required: true, message: 'Please enter tare weight' }]}>
                  <InputNumber min={0} step={0.01} style={{ width: '100%', fontSize: '24px' }} placeholder="Enter empty container weight" size="large" autoFocus />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Space>
                <Button size="large" onClick={cancelWeightIn}>Cancel</Button>
                <Button type="primary" size="large" htmlType="submit" icon={<SaveOutlined />}>Save Tare Weight</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      {activeSession && (
        <Card style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#52c41a' }}>
          <Alert
            message={`Weighing Out (After Loading): ${activeSession.vehicle_number}`}
            description="Enter gross weight and select manufacturer"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form form={finalForm} layout="vertical" onFinish={completeSale} onValuesChange={(changedValues) => { if ('gross_weight' in changedValues) finalForm.setFieldsValue(finalForm.getFieldsValue()); }}>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ padding: '16px', background: '#fff9e6', borderRadius: '4px', border: '1px solid #faad14' }}>
                  <div style={{ fontSize: '12px', color: '#999' }}>Tare (empty)</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>{activeSession.tare_weight} KG</div>
                </div>
              </Col>
              <Col span={8}>
                <Form.Item name="gross_weight" label="Gross Weight (loaded)" rules={[{ required: true, message: 'Please enter weight' }]}>
                  <InputNumber min={0} step={0.01} style={{ width: '100%', fontSize: '18px' }} placeholder="Enter weight" size="large" suffix="KG" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <div style={{ padding: '16px', background: '#f6ffed', borderRadius: '4px', border: '1px solid #52c41a' }}>
                  <div style={{ fontSize: '12px', color: '#999' }}>Container Net</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                    <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.gross_weight !== currentValues.gross_weight}>
                      {({ getFieldValue }) => {
                        const gross = getFieldValue('gross_weight');
                        return gross ? (gross - activeSession.tare_weight).toFixed(2) : '---';
                      }}
                    </Form.Item> KG
                  </div>
                </div>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="manufacturer_id" hidden><Input /></Form.Item>
                <Form.Item name="manufacturer_display" label="Manufacturer (Buyer)" rules={[{ required: true, message: 'Please select manufacturer' }]}>
                  <Input size="large" readOnly placeholder="Click Search to select manufacturer" suffix={<Button type="primary" icon={<SearchOutlined />} onClick={openManufacturerSearch}>Search</Button>} style={{ cursor: 'pointer' }} onClick={openManufacturerSearch} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="price_per_kg" label="Price per KG (RM)" rules={[{ required: true }]}>
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="RM" size="large" />
                </Form.Item>
              </Col>
            </Row>
            <Divider>Purchase Receipts</Divider>
            <Card style={{ marginBottom: 16, background: '#fafafa' }}>
              <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                  <Space>
                    <h3 style={{ margin: 0 }}>Selected Receipts: {selectedReceipts.length}</h3>
                    <Tag color="blue">Total: {selectedTotalWeight.toFixed(2)} kg</Tag>
                    <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.gross_weight !== currentValues.gross_weight}>
                      {({ getFieldValue }) => {
                        const gross = getFieldValue('gross_weight');
                        const netWeight = gross ? gross - activeSession.tare_weight : 0;
                        const diff = netWeight - selectedTotalWeight;
                        return (
                          <Tag color={Math.abs(diff) > 0.5 ? 'red' : 'green'}>
                            Diff: {diff.toFixed(2)} kg {Math.abs(diff) > 0.5 ? '⚠️' : '✓'}
                          </Tag>
                        );
                      }}
                    </Form.Item>
                  </Space>
                </Col>
                <Col>
                  <Button type="dashed" icon={<PlusOutlined />} onClick={openReceiptSelectionModal} loading={loading}>
                    Select Receipts
                  </Button>
                </Col>
              </Row>
              {selectedReceipts.length > 0 ? (
                <Table
                  dataSource={selectedReceipts}
                  columns={[
                    ...receiptColumns,
                    {
                      title: 'Action',
                      key: 'action',
                      render: (_, record) => (
                        <Space>
                          <Button size="small" onClick={() => openSplitModal(record)} disabled={record.is_split}>
                            Split
                          </Button>
                          <Button size="small" danger onClick={() => removeSelectedReceipt(record)}>
                            Remove
                          </Button>
                        </Space>
                      )
                    }
                  ]}
                  rowKey={(record, index) => record.transaction_id + '-' + index}
                  pagination={false}
                  size="small"
                />
              ) : (
                <Alert message="No receipts selected" description="Click 'Select Receipts' to add purchase receipts to this sale" type="info" showIcon />
              )}
            </Card>
            <Form.Item name="driver_name" label="Driver Name (Optional)">
              <Input placeholder="Driver name..." size="large" />
            </Form.Item>
            <Form.Item name="notes" label="Notes (Optional)">
              <Input.TextArea rows={2} placeholder="Additional notes..." />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button size="large" onClick={cancelWeighOut}>Cancel</Button>
                <Button type="primary" size="large" htmlType="submit" icon={<CheckCircleOutlined />} loading={loading}>Complete Sale & Print Receipt</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Button type="primary" size="large" icon={<PlusOutlined />} onClick={startNewSale} disabled={weightInMode || activeSession} title="Press F3 to start">New Sale (Weigh-In Tare) <kbd style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: '3px' }}>F3</kbd></Button>
              <Button size="large" icon={<ClockCircleOutlined />} onClick={showRecallModal} disabled={seasonPendingSessions.length === 0 || weightInMode || activeSession} title="Press F2 to open">Recall Container ({seasonPendingSessions.length}) <kbd style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: '3px' }}>F2</kbd></Button>
            </Space>
          </Col>
        </Row>
        <Alert type="info" message="Sales Workflow (Complete)" description="1. Press F3 or click 'New Sale' → 2. Enter container number → 3. Enter TARE weight (empty) → 4. After loading, press F2 → 5. Enter GROSS weight (weigh-out) → 6. Click 'Select Receipts' to choose purchase receipts → 7. Split receipts if needed to match net weight → 8. Select manufacturer → 9. Complete!" showIcon style={{ marginTop: 16 }} />
      </Card>

      <Modal 
        title="New Sale - Enter Container/Lorry" 
        open={containerModalOpen} 
        onCancel={() => setContainerModalOpen(false)} 
        footer={null} 
        width={500}
        afterOpenChange={(open) => {
          if (open && containerInputRef.current) {
            setTimeout(() => containerInputRef.current?.focus(), 100);
          }
        }}
      >
        <Form form={containerForm} layout="vertical" onFinish={handleContainerSubmit}>
          <Form.Item name="vehicle_number" label="Container/Lorry Registration Number" rules={[{ required: true, message: 'Please enter vehicle registration' }]} normalize={(value) => value?.toUpperCase()}>
            <Input 
              ref={containerInputRef}
              placeholder="e.g., ABC 1234" 
              size="large" 
              autoFocus 
              style={{ fontSize: '20px', textTransform: 'uppercase' }} 
            />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setContainerModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" size="large">OK - Next: Weigh In (Tare)</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={<span>Recall Container for Weigh-Out <kbd style={{ marginLeft: '12px', fontSize: '11px', padding: '3px 8px', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: '3px' }}>F2</kbd></span>} open={recallModalOpen} onCancel={() => setRecallModalOpen(false)} footer={null} width={700}>
        <Alert message="Select Container to Complete Weighing" description="Click on a container to complete the weigh-out process (after loading). Press F2 anytime to open this modal." type="info" showIcon style={{ marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {seasonPendingSessions.map((session, index) => (
            <Button key={index} size="large" style={{ height: '100px', display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', padding: '16px', textAlign: 'left' }} onClick={() => recallContainer(session)}>
              <TruckOutlined style={{ fontSize: '32px', marginRight: '16px' }} />
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{session.vehicle_number}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Tare: {session.tare_weight} kg</div>
                <div style={{ fontSize: '10px', color: '#999' }}>{dayjs(session.timestamp).format('HH:mm:ss')}</div>
              </div>
            </Button>
          ))}
        </div>
      </Modal>

      <Modal title="Search Manufacturer" open={manufacturerSearchModal} onCancel={() => setManufacturerSearchModal(false)} footer={null} width={900}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Input size="large" placeholder="Search by company name, code, or registration number..." prefix={<SearchOutlined />} value={manufacturerSearchText} onChange={(e) => { setManufacturerSearchText(e.target.value); searchManufacturers(e.target.value); }} autoFocus allowClear />
          {manufacturerSearchText.length > 0 && manufacturerSearchText.length < 2 && <Alert message="Type at least 2 characters to search" type="info" showIcon />}
          {manufacturerSearchText.length >= 2 && manufacturerOptions.length === 0 && <Alert message="No manufacturers found" description="Try different search terms" type="warning" showIcon />}
          {manufacturerOptions.length > 0 && (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {manufacturerOptions.map(m => (
                <Card key={m.manufacturer_id} hoverable onClick={() => selectManufacturer(m)} style={{ marginBottom: 8 }}>
                  <Row justify="space-between" align="middle">
                    <Col span={18}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{m.company_name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Code: {m.manufacturer_code} | Reg: {m.registration_number}</div>
                    </Col>
                    <Col span={6} style={{ textAlign: 'right' }}>
                      <Button type="primary">Select</Button>
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
          )}
        </Space>
      </Modal>

      <Modal
        title="Select Purchase Receipts"
        open={receiptSelectionModal}
        onCancel={() => setReceiptSelectionModal(false)}
        onOk={confirmReceiptSelection}
        width={1000}
        okText="Confirm Selection"
      >
        {activeSession && (
          <>
            <Alert
              message="Select Purchase Receipts to Load"
              description={
                <div>
                  <p style={{ marginBottom: 4 }}>Select purchase receipts that will be loaded into this container.</p>
                  <p style={{ marginBottom: 0 }}>
                    <strong>Container Net Weight: {finalForm.getFieldValue('gross_weight') ? (finalForm.getFieldValue('gross_weight') - activeSession.tare_weight).toFixed(2) : '---'} kg</strong>
                    {' '}- Once the selected total meets or exceeds this weight, other receipts will be disabled.
                  </p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              dataSource={availableReceipts}
              columns={receiptColumns}
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys: selectedReceipts.map(r => r.transaction_id),
                onChange: handleReceiptSelection,
                getCheckboxProps: (record) => {
                  const containerNetWeight = finalForm.getFieldValue('gross_weight') 
                    ? finalForm.getFieldValue('gross_weight') - activeSession.tare_weight 
                    : 0;
                  const currentSelectedTotal = selectedReceipts.reduce((sum, r) => sum + parseFloat(r.net_weight_kg || 0), 0);
                  const isAlreadySelected = selectedReceipts.some(r => r.transaction_id === record.transaction_id);
                  
                  // Disable if:
                  // 1. Not already selected AND
                  // 2. Current selected total >= container net weight
                  const shouldDisable = !isAlreadySelected && currentSelectedTotal >= containerNetWeight;
                  
                  return {
                    disabled: shouldDisable,
                  };
                },
              }}
              rowKey="transaction_id"
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Total ${total} receipts`,
              }}
              scroll={{ y: 400 }}
              summary={(pageData) => {
                const totalWeight = selectedReceipts.reduce((sum, r) => sum + parseFloat(r.net_weight_kg || 0), 0);
                const containerNetWeight = finalForm.getFieldValue('gross_weight') 
                  ? finalForm.getFieldValue('gross_weight') - activeSession.tare_weight 
                  : 0;
                const diff = containerNetWeight - totalWeight;
                
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <strong>Selected Total:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <Space>
                          <Tag color="blue" style={{ fontSize: '14px' }}>
                            {selectedReceipts.length} receipts = {totalWeight.toFixed(2)} kg
                          </Tag>
                          <Tag color={Math.abs(diff) <= 0.5 ? 'green' : diff > 0 ? 'orange' : 'red'} style={{ fontSize: '14px' }}>
                            {diff > 0 ? `Need ${diff.toFixed(2)} kg more` : diff < 0 ? `Over by ${Math.abs(diff).toFixed(2)} kg` : 'Perfect match ✓'}
                          </Tag>
                        </Space>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </>
        )}
      </Modal>

      <Modal
        title="Split Receipt"
        open={splitReceiptModal}
        onCancel={() => setSplitReceiptModal(false)}
        footer={null}
        width={600}
      >
        {receiptToSplit && (
          <>
            <Alert
              message={`Splitting Receipt: ${receiptToSplit.receipt_number}`}
              description={
                <div>
                  <Form.Item noStyle shouldUpdate>
                    {() => {
                      const weightNeeded = splitForm.getFieldValue('weight_needed');
                      const isOverCapacity = weightNeeded < 0;
                      const excessWeight = Math.abs(weightNeeded);
                      
                      return (
                        <>
                          {isOverCapacity ? (
                            <>
                              <p style={{ marginBottom: 4, color: '#ff4d4f' }}>
                                <strong>⚠️ OVER-CAPACITY by {excessWeight.toFixed(2)} kg</strong>
                              </p>
                              <p style={{ marginBottom: 0 }}>
                                <strong>Split 1 (Keep in sale):</strong> Auto-calculated to remove the excess weight.
                                <br />
                                <strong>Split 2 (Remove):</strong> The excess {excessWeight.toFixed(2)} kg will go back to available receipts.
                              </p>
                            </>
                          ) : (
                            <>
                              <p style={{ marginBottom: 4, color: '#52c41a' }}>
                                <strong>Need {weightNeeded > 0 ? `${weightNeeded.toFixed(2)} kg more` : 'to fill container'}</strong>
                              </p>
                              <p style={{ marginBottom: 0 }}>
                                {weightNeeded > 0 && weightNeeded < receiptToSplit.net_weight_kg
                                  ? `Split 1 has been auto-calculated to match the exact weight needed.`
                                  : `Split this receipt into the amount needed. Adjust as required.`
                                }
                              </p>
                            </>
                          )}
                        </>
                      );
                    }}
                  </Form.Item>
                </div>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form form={splitForm} layout="vertical" onFinish={confirmSplitReceipt}>
              <Form.Item name="weight_needed" hidden><InputNumber /></Form.Item>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="original_weight" label="Original Weight (kg)">
                    <InputNumber disabled style={{ width: '100%' }} size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item 
                    name="split_weight" 
                    label={
                      <span>
                        Split Amount (kg) <Tag color="green" style={{ fontSize: '10px' }}>Auto-Calculated</Tag>
                      </span>
                    }
                    rules={[{ required: true, message: 'Please enter split weight' }]}
                  >
                    <InputNumber 
                      min={0.01} 
                      max={receiptToSplit.net_weight_kg - 0.01}
                      step={0.01} 
                      style={{ width: '100%' }} 
                      size="large"
                      onChange={handleSplitWeightChange}
                      autoFocus
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="remaining_weight" label="Remaining (kg)">
                    <InputNumber disabled style={{ width: '100%' }} size="large" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item noStyle shouldUpdate>
                {() => {
                  const splitWeight = splitForm.getFieldValue('split_weight') || 0;
                  const remainingWeight = splitForm.getFieldValue('remaining_weight') || 0;
                  const weightNeeded = splitForm.getFieldValue('weight_needed') || 0;
                  const isOverCapacity = weightNeeded < 0;
                  
                  return (
                    <Alert
                      message="Split Breakdown"
                      description={
                        <div>
                          <p style={{ marginBottom: 4 }}>
                            <strong>Split 1 (Keep in sale):</strong> {typeof splitWeight === 'number' ? splitWeight.toFixed(2) : '0.00'} kg 
                            {' '}→ {isOverCapacity ? 'Keeps this amount in the sale' : 'Added to this sale as new split portion'}
                          </p>
                          <p style={{ marginBottom: 0 }}>
                            <strong>Split 2 ({isOverCapacity ? 'Removed' : 'Remaining'}):</strong> {typeof remainingWeight === 'number' ? remainingWeight.toFixed(2) : '0.00'} kg 
                            {' '}→ {isOverCapacity ? 'Removed from sale, goes back to available receipts' : `Stays in original <code>${receiptToSplit.receipt_number}</code> for future sales`}
                          </p>
                        </div>
                      }
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  );
                }}
              </Form.Item>
              <Form.Item>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => setSplitReceiptModal(false)}>Cancel</Button>
                  <Button type="primary" htmlType="submit" size="large">Confirm Split</Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Sales;
