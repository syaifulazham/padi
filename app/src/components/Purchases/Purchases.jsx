import React, { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, Button, Space, Row, Col, message, Modal, Statistic, Alert, Tag, Table } from 'antd';
import { PlusOutlined, ClockCircleOutlined, TruckOutlined, SearchOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const Purchases = () => {
  const [pendingSessions, setPendingSessions] = useState([]); // Lorries waiting for weigh-out
  const [loading, setLoading] = useState(false);
  const [lorryModalOpen, setLorryModalOpen] = useState(false);
  const [recallModalOpen, setRecallModalOpen] = useState(false);
  const [farmerSearchModal, setFarmerSearchModal] = useState(false);
  const [weightInMode, setWeightInMode] = useState(false); // Show weight-in panel
  const [currentLorry, setCurrentLorry] = useState(null);
  const [activeSession, setActiveSession] = useState(null); // Currently weighing out
  const [farmers, setFarmers] = useState([]);
  const [farmerOptions, setFarmerOptions] = useState([]);
  const [farmerSearchText, setFarmerSearchText] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [lorryForm] = Form.useForm();
  const [weightForm] = Form.useForm();
  const [finalForm] = Form.useForm();

  useEffect(() => {
    loadFarmers();
  }, []);

  // Add keyboard shortcut for Recall Lorry (F2)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        showRecallModal();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pendingSessions]);

  const loadFarmers = async () => {
    try {
      const result = await window.electronAPI.farmers.getAll();
      if (result.success) {
        setFarmers(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load farmers:', error);
    }
  };

  const searchFarmers = (searchText) => {
    if (!searchText || searchText.length < 2) {
      setFarmerOptions([]);
      return;
    }

    const filtered = farmers
      .filter(farmer => {
        const searchLower = searchText.toLowerCase();
        return (
          farmer.full_name?.toLowerCase().includes(searchLower) ||
          farmer.farmer_code?.toLowerCase().includes(searchLower) ||
          farmer.ic_number?.includes(searchText)
        );
      })
      .slice(0, 50); // Limit to 50 results for modal

    setFarmerOptions(filtered);
  };

  const openFarmerSearch = () => {
    setFarmerSearchText('');
    setFarmerOptions([]);
    setFarmerSearchModal(true);
  };

  const selectFarmer = (farmer) => {
    console.log('Selecting farmer:', farmer);
    console.log('Farmer ID:', farmer.farmer_id);
    
    setSelectedFarmer(farmer);
    finalForm.setFieldsValue({ 
      farmer_id: farmer.farmer_id,
      farmer_display: `${farmer.full_name} (${farmer.farmer_code})`
    });
    
    console.log('Form values after setting:', finalForm.getFieldsValue());
    
    setFarmerSearchModal(false);
    message.success(`Selected: ${farmer.full_name}`);
  };


  // Step 1: Open modal to enter lorry registration
  const startNewPurchase = () => {
    lorryForm.resetFields();
    setLorryModalOpen(true);
  };

  // Step 2: After lorry entered, show weight-in panel on main page
  const handleLorrySubmit = (values) => {
    setCurrentLorry(values.lorry_reg_no.toUpperCase());
    setLorryModalOpen(false);
    weightForm.resetFields();
    setWeightInMode(true);
  };

  // Step 3: Save weight-in, add to pending sessions
  const handleWeightIn = (values) => {
    const session = {
      lorry_reg_no: currentLorry,
      weight_with_load: values.weight_with_load,
      timestamp: new Date().toISOString()
    };
    
    setPendingSessions([...pendingSessions, session]);
    message.success(`Weigh-in recorded for ${currentLorry}: ${values.weight_with_load} kg`);
    setWeightInMode(false);
    setCurrentLorry(null);
  };

  const cancelWeightIn = () => {
    setWeightInMode(false);
    setCurrentLorry(null);
    weightForm.resetFields();
  };

  // Step 4: Recall lorry for weigh-out (right-click or shortcut)
  const showRecallModal = () => {
    if (pendingSessions.length === 0) {
      message.warning('No pending lorries to recall');
      return;
    }
    setRecallModalOpen(true);
  };

  // Step 5: Select lorry from pending sessions
  const recallLorry = (session) => {
    setActiveSession(session);
    setRecallModalOpen(false);
    setSelectedFarmer(null);
    finalForm.resetFields();
    finalForm.setFieldsValue({
      price_per_kg: 2.50
    });
  };

  // Step 6: Complete purchase - save with farmer and weigh-out
  const completePurchase = async (values) => {
    console.log('Form values received:', values);
    console.log('Farmer ID:', values.farmer_id);
    
    // Validate required fields
    if (!values.farmer_id) {
      console.error('Validation failed: farmer_id is missing', values);
      message.error('Please select a farmer');
      return;
    }
    
    if (!values.weight_without_load || values.weight_without_load <= 0) {
      message.error('Please enter valid tare weight');
      return;
    }
    
    if (!values.price_per_kg || values.price_per_kg <= 0) {
      message.error('Please enter valid price per kg');
      return;
    }
    
    setLoading(true);
    try {
      const netWeight = activeSession.weight_with_load - values.weight_without_load;
      
      if (netWeight <= 0) {
        message.error('Net weight must be greater than zero. Check your weights.');
        setLoading(false);
        return;
      }
      
      const purchaseData = {
        season_id: 1, // Default season - you can make this dynamic later
        farmer_id: values.farmer_id,
        grade_id: 1, // Default grade
        gross_weight_kg: parseFloat(activeSession.weight_with_load),
        tare_weight_kg: parseFloat(values.weight_without_load),
        net_weight_kg: parseFloat(netWeight),
        moisture_content: 14.0, // Default moisture - can be made configurable
        foreign_matter: 0.0, // Default foreign matter
        base_price_per_kg: parseFloat(values.price_per_kg),
        vehicle_number: activeSession.lorry_reg_no,
        driver_name: null,
        weighbridge_id: null,
        weighing_log_id: null,
        created_by: 1 // Default user - you can get from auth later
      };

      console.log('Submitting purchase data:', purchaseData);
      const result = await window.electronAPI.purchases?.create(purchaseData);
      
      if (result?.success) {
        message.success(`Purchase completed! Receipt: ${result.data.receipt_number}`);
        
        // Remove from pending sessions
        setPendingSessions(pendingSessions.filter(s => s.lorry_reg_no !== activeSession.lorry_reg_no));
        setActiveSession(null);
        setSelectedFarmer(null);
        finalForm.resetFields();
      } else {
        message.error('Failed to save purchase: ' + (result?.error || 'Unknown error'));
      }
    } catch (error) {
      message.error('Failed to complete purchase');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cancelWeighOut = () => {
    setActiveSession(null);
    setSelectedFarmer(null);
    finalForm.resetFields();
  };

  return (
    <div onContextMenu={(e) => { e.preventDefault(); showRecallModal(); }}>
      {/* Quick Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Pending Lorries (Waiting for Weigh-Out)"
              value={pendingSessions.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Active Session"
              value={activeSession ? `${activeSession.lorry_reg_no}` : 'None'}
              valueStyle={{ color: activeSession ? '#1890ff' : '#d9d9d9' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Weight-In Panel */}
      {weightInMode && (
        <Card style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#52c41a' }}>
          <Alert
            message={`Weigh In: ${currentLorry}`}
            description="Enter the weight with load"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form
            form={weightForm}
            layout="vertical"
            onFinish={handleWeightIn}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="weight_with_load"
                  label="Weight with Load (KG)"
                  rules={[{ required: true, message: 'Please enter weight' }]}
                >
                  <InputNumber
                    min={0}
                    step={0.01}
                    style={{ width: '100%', fontSize: '24px' }}
                    placeholder="Enter weight with load"
                    size="large"
                    autoFocus
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Space>
                <Button size="large" onClick={cancelWeightIn}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                >
                  Save Weigh-In
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* Active Weigh-Out Panel */}
      {activeSession && (
        <Card style={{ marginBottom: 16, background: '#e6f7ff', borderColor: '#1890ff' }}>
          <Alert
            message={`Weighing Out: ${activeSession.lorry_reg_no}`}
            description="Complete the weigh-out process below"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form
            form={finalForm}
            layout="vertical"
            onFinish={completePurchase}
            onValuesChange={(changedValues) => {
              // Force re-render when weight_without_load changes
              if ('weight_without_load' in changedValues) {
                finalForm.setFieldsValue(finalForm.getFieldsValue());
              }
            }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ padding: '16px', background: '#fff', borderRadius: '4px' }}>
                  <div style={{ fontSize: '12px', color: '#999' }}>Weight In (with load)</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                    {activeSession.weight_with_load} KG
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="weight_without_load"
                  label="Weight Out (without load)"
                  rules={[{ required: true, message: 'Please enter weight' }]}
                >
                  <InputNumber
                    min={0}
                    step={0.01}
                    style={{ width: '100%', fontSize: '18px' }}
                    placeholder="Enter weight"
                    size="large"
                    suffix="KG"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <div style={{ padding: '16px', background: '#fff', borderRadius: '4px' }}>
                  <div style={{ fontSize: '12px', color: '#999' }}>Net Weight</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                    <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => 
                      prevValues.weight_without_load !== currentValues.weight_without_load
                    }>
                      {({ getFieldValue }) => {
                        const weightOut = getFieldValue('weight_without_load');
                        return weightOut 
                          ? (activeSession.weight_with_load - weightOut).toFixed(2)
                          : '---';
                      }}
                    </Form.Item> KG
                  </div>
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="farmer_id" hidden>
                  <Input />
                </Form.Item>
                <Form.Item
                  name="farmer_display"
                  label="Owner (Farmer)"
                  rules={[{ required: true, message: 'Please select farmer' }]}
                >
                  <Input
                    size="large"
                    readOnly
                    placeholder="Click Search to select farmer"
                    suffix={
                      <Button 
                        type="primary" 
                        icon={<SearchOutlined />}
                        onClick={openFarmerSearch}
                      >
                        Search
                      </Button>
                    }
                    style={{ cursor: 'pointer' }}
                    onClick={openFarmerSearch}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="price_per_kg"
                  label="Price per KG (RM)"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    min={0}
                    step={0.01}
                    style={{ width: '100%' }}
                    prefix="RM"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="notes" label="Notes (Optional)">
              <Input.TextArea rows={2} placeholder="Additional notes..." />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button size="large" onClick={cancelWeighOut}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                >
                  Complete Purchase & Print Receipt
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={startNewPurchase}
                disabled={weightInMode || activeSession}
              >
                New Purchase (Weigh-In)
              </Button>
              <Button
                size="large"
                icon={<ClockCircleOutlined />}
                onClick={showRecallModal}
                disabled={pendingSessions.length === 0 || weightInMode || activeSession}
                title="Press F2 to open"
              >
                Recall Lorry ({pendingSessions.length}) <kbd style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: '3px' }}>F2</kbd>
              </Button>
            </Space>
          </Col>
        </Row>

        <Alert
          type="info"
          message="Rapid Weighing Workflow"
          description="1. Click 'New Purchase' to start weigh-in → 2. Enter lorry registration → 3. Enter gross weight → 4. After unloading, press F2 or click 'Recall Lorry' → 5. Select lorry → 6. Enter tare weight and farmer → 7. Complete! View completed transactions in Purchase History."
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* Step 1: Lorry Registration Modal */}
      <Modal
        title="New Purchase - Enter Lorry"
        open={lorryModalOpen}
        onCancel={() => setLorryModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form
          form={lorryForm}
          layout="vertical"
          onFinish={handleLorrySubmit}
        >
          <Form.Item
            name="lorry_reg_no"
            label="Lorry Registration Number"
            rules={[{ required: true, message: 'Please enter lorry registration' }]}
          >
            <Input 
              placeholder="e.g., ABC 1234" 
              size="large"
              autoFocus
              style={{ fontSize: '20px' }}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setLorryModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
              >
                OK - Next: Weigh In
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Recall Lorry Modal (Grid of Buttons) */}
      <Modal
        title={
          <span>
            Recall Lorry for Weigh-Out 
            <kbd style={{ marginLeft: '12px', fontSize: '11px', padding: '3px 8px', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: '3px' }}>F2</kbd>
          </span>
        }
        open={recallModalOpen}
        onCancel={() => setRecallModalOpen(false)}
        footer={null}
        width={700}
      >
        <Alert
          message="Select Lorry to Complete Weighing"
          description="Click on a lorry to complete the weigh-out process. Press F2 anytime to open this modal."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {pendingSessions.map((session, index) => (
            <Button
              key={index}
              size="large"
              style={{
                height: '100px',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                padding: '16px',
                textAlign: 'left'
              }}
              onClick={() => recallLorry(session)}
            >
              <TruckOutlined style={{ fontSize: '32px', marginRight: '16px' }} />
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {session.lorry_reg_no}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Weigh-in: {session.weight_with_load} kg
                </div>
                <div style={{ fontSize: '10px', color: '#999' }}>
                  {dayjs(session.timestamp).format('HH:mm:ss')}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </Modal>

      {/* Farmer Search Modal */}
      <Modal
        title="Search Farmer"
        open={farmerSearchModal}
        onCancel={() => setFarmerSearchModal(false)}
        footer={null}
        width={900}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Input
            size="large"
            placeholder="Search by name, subsidy no., or IC number..."
            prefix={<SearchOutlined />}
            value={farmerSearchText}
            onChange={(e) => {
              setFarmerSearchText(e.target.value);
              searchFarmers(e.target.value);
            }}
            autoFocus
            allowClear
          />

          {farmerSearchText.length > 0 && farmerSearchText.length < 2 && (
            <Alert
              message="Type at least 2 characters to search"
              type="info"
              showIcon
            />
          )}

          {farmerSearchText.length >= 2 && farmerOptions.length === 0 && (
            <Alert
              message="No farmers found"
              description="Try different search terms"
              type="warning"
              showIcon
            />
          )}

          {farmerOptions.length > 0 && (
            <>
              <Alert
                message={`Found ${farmerOptions.length} farmer(s)`}
                type="success"
                showIcon
              />
              
              <Table
                dataSource={farmerOptions}
                rowKey="farmer_id"
                pagination={false}
                size="small"
                scroll={{ y: 400 }}
                onRow={(record) => ({
                  onClick: () => selectFarmer(record),
                  style: { cursor: 'pointer' }
                })}
                columns={[
                  {
                    title: 'Subsidy No.',
                    dataIndex: 'farmer_code',
                    key: 'farmer_code',
                    width: 150,
                    render: (text) => <Tag color="blue">{text}</Tag>
                  },
                  {
                    title: 'Name',
                    dataIndex: 'full_name',
                    key: 'full_name',
                    render: (text) => <strong>{text}</strong>
                  },
                  {
                    title: 'IC Number',
                    dataIndex: 'ic_number',
                    key: 'ic_number',
                    width: 150
                  },
                  {
                    title: 'Phone',
                    dataIndex: 'phone_number',
                    key: 'phone_number',
                    width: 130
                  },
                  {
                    title: 'Action',
                    key: 'action',
                    width: 100,
                    render: (_, record) => (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => selectFarmer(record)}
                      >
                        Select
                      </Button>
                    )
                  }
                ]}
              />
            </>
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default Purchases;
