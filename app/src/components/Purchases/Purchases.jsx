import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Input, InputNumber, Button, Space, Row, Col, message, Modal, Statistic, Alert, Tag, Table, Select, Divider } from 'antd';
import { PlusOutlined, ClockCircleOutlined, TruckOutlined, SearchOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import DeductionConfirmModal from './DeductionConfirmModal';
import SetCurrentPriceModal from './SetCurrentPriceModal';
import WeighOutWizard from './WeighOutWizard';

const STORAGE_KEY = 'paddy_weight_in_sessions';

const Purchases = () => {
  // Load pending sessions from localStorage on mount
  const [pendingSessions, setPendingSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('✅ Loaded', parsed.length, 'pending sessions from storage');
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load pending sessions:', error);
    }
    return [];
  }); // Lorries waiting for weigh-out
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
  const [activeSeason, setActiveSeason] = useState(null);
  const [seasonLoading, setSeasonLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deductionModalOpen, setDeductionModalOpen] = useState(false);
  const [pendingPurchaseData, setPendingPurchaseData] = useState(null);
  const [setPriceModalOpen, setSetPriceModalOpen] = useState(false);
  const [lorryForm] = Form.useForm();
  const [weightForm] = Form.useForm();
  const [finalForm] = Form.useForm();
  const lorryInputRef = useRef(null);

  // Filter pending sessions by active season
  const seasonPendingSessions = pendingSessions.filter(
    session => !session.season_id || session.season_id === activeSeason?.season_id
  );

  useEffect(() => {
    loadActiveSeason();
    loadFarmers();
    loadProducts();

    // Listen for farmer search request from wizard
    const handleWizardFarmerSearch = (event) => {
      setFarmerSearchText('');
      setFarmerOptions([]);
      setFarmerSearchModal(true);
      
      // Store the callback for when farmer is selected
      window._wizardFarmerCallback = event.detail.onSelect;
    };

    window.addEventListener('open-farmer-search', handleWizardFarmerSearch);
    
    return () => {
      window.removeEventListener('open-farmer-search', handleWizardFarmerSearch);
      delete window._wizardFarmerCallback;
    };
  }, []);

  // Auto-save pending sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingSessions));
      console.log('💾 Saved', pendingSessions.length, 'pending sessions to storage');
    } catch (error) {
      console.error('Failed to save pending sessions:', error);
      message.error('Failed to save weight-in records to storage');
    }
  }, [pendingSessions]);

  // Add keyboard shortcuts (F2: Recall, F3: New Purchase)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        showRecallModal();
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (!weightInMode && !activeSession && !seasonLoading) {
          startNewPurchase();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pendingSessions, weightInMode, activeSession, seasonLoading]);

  const loadActiveSeason = async () => {
    try {
      setSeasonLoading(true);
      const result = await window.electronAPI.seasons?.getActive();
      if (result?.success && result.data) {
        setActiveSeason(result.data);
        console.log('✅ Active season loaded:', result.data);
      } else {
        setActiveSeason(null);
        console.warn('⚠️ No active season found');
      }
    } catch (error) {
      console.error('Failed to load active season:', error);
      setActiveSeason(null);
    } finally {
      setSeasonLoading(false);
    }
  };

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

  const loadProducts = async () => {
    try {
      const result = await window.electronAPI.products.getActive();
      if (result?.success) {
        setProducts(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleProductSelect = async (productId) => {
    if (!activeSeason || !productId) return;
    
    try {
      setSelectedProduct(productId);
      
      // Fetch product price for current season
      const priceResult = await window.electronAPI.seasonProductPrices.getProductPrice(
        activeSeason.season_id,
        productId
      );
      
      if (priceResult?.success && priceResult.data?.current_price_per_ton) {
        const pricePerKg = priceResult.data.current_price_per_ton / 1000;
        finalForm.setFieldsValue({
          price_per_kg: pricePerKg
        });
      } else {
        message.warning('No price set for this product in current season');
        finalForm.setFieldsValue({
          price_per_kg: 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch product price:', error);
      message.error('Failed to load product price');
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
    
    // Check if wizard callback exists
    if (window._wizardFarmerCallback) {
      window._wizardFarmerCallback({
        farmer_id: farmer.farmer_id,
        name: farmer.full_name
      });
      delete window._wizardFarmerCallback;
    } else {
      // Old form flow
      setSelectedFarmer(farmer);
      finalForm.setFieldsValue({ 
        farmer_id: farmer.farmer_id,
        farmer_display: `${farmer.full_name} (${farmer.farmer_code})`
      });
      console.log('Form values after setting:', finalForm.getFieldsValue());
    }
    
    setFarmerSearchModal(false);
    message.success(`Selected: ${farmer.full_name}`);
  };


  // Handle current price set confirmation
  const handlePriceSet = async (pricePerTon) => {
    setSetPriceModalOpen(false);
    
    // Reload active season to get updated price
    await loadActiveSeason();
    
    message.success('Current price set! You can now proceed with purchases.');
    
    // Continue to lorry registration
    lorryForm.resetFields();
    setLorryModalOpen(true);
  };

  const handlePriceSetCancel = () => {
    setSetPriceModalOpen(false);
  };

  // Step 1: Open modal to enter lorry registration
  const startNewPurchase = () => {
    // Check if season is still loading
    if (seasonLoading) {
      message.loading({ content: 'Loading active season...', key: 'season', duration: 1 });
      return;
    }
    
    // Check if active season exists
    if (!activeSeason) {
      message.error({
        content: 'No active season found. Please activate a season in Settings.',
        duration: 5
      });
      return;
    }

    // Check if current price is set for the season
    if (!activeSeason.current_price_per_ton) {
      message.warning('Current price not set for this season');
      setSetPriceModalOpen(true);
      return;
    }

    lorryForm.resetFields();
    setLorryModalOpen(true);
  };

  // Step 2: After lorry entered, show weight-in panel on main page
  const handleLorrySubmit = (values) => {
    setCurrentLorry(values.lorry_reg_no);
    setLorryModalOpen(false);
    weightForm.resetFields();
    setWeightInMode(true);
  };

  // Step 3: Save weight-in, add to pending sessions
  const handleWeightIn = (values) => {
    if (!activeSeason) {
      message.error('No active season! Please activate a season in Settings.');
      return;
    }
    
    const session = {
      lorry_reg_no: currentLorry,
      weight_with_load: values.weight_with_load,
      timestamp: new Date().toISOString(),
      season_id: activeSeason.season_id  // ✅ Tie to active season
    };
    
    setPendingSessions([...pendingSessions, session]);
    message.success(
      <span>
        ✅ Weigh-in recorded for <strong>{currentLorry}</strong>: {values.weight_with_load} kg
        <br />
        <small>💾 Data saved - safe from page refresh</small>
      </span>, 
      5
    );
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
    if (seasonPendingSessions.length === 0) {
      message.warning('No pending lorries to recall for this season');
      return;
    }
    setRecallModalOpen(true);
  };

  // Step 5: Select lorry from pending sessions
  const recallLorry = async (session) => {
    setActiveSession(session);
    setRecallModalOpen(false);
    setSelectedFarmer(null);
    finalForm.resetFields();
    
    // Fetch current price from active season (convert per ton to per kg)
    if (activeSeason?.season_id) {
      try {
        const priceResult = await window.electronAPI.seasonPrice?.getCurrent(activeSeason.season_id);
        if (priceResult?.success && priceResult.data?.price_per_ton) {
          const pricePerKg = priceResult.data.price_per_ton / 1000; // Convert per ton to per kg
          finalForm.setFieldsValue({
            price_per_kg: pricePerKg
          });
        } else {
          // Fallback to default price
          finalForm.setFieldsValue({
            price_per_kg: 2.50
          });
        }
      } catch (error) {
        console.error('Failed to fetch current price:', error);
        finalForm.setFieldsValue({
          price_per_kg: 2.50
        });
      }
    } else {
      finalForm.setFieldsValue({
        price_per_kg: 2.50
      });
    }
  };

  // Handler for wizard completion
  const handleWizardComplete = async (wizardData) => {
    if (!activeSession || !activeSeason) {
      message.error('Invalid session or season');
      return;
    }

    try {
      setLoading(true);

      // Calculate net weight and effective weight with deductions
      const netWeight = parseFloat(activeSession.weight_with_load) - parseFloat(wizardData.weight_without_load);
      
      // Calculate deductions
      const deductions = wizardData.deductions || [];
      const totalDeductionRate = deductions.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
      const effectiveWeight = netWeight * (1 - totalDeductionRate / 100);
      
      console.log('🔢 Frontend Calculation:');
      console.log('  - Gross Weight:', activeSession.weight_with_load);
      console.log('  - Tare Weight:', wizardData.weight_without_load);
      console.log('  - Net Weight:', netWeight);
      console.log('  - Deductions:', deductions);
      console.log('  - Total Deduction Rate:', totalDeductionRate, '%');
      console.log('  - Effective Weight:', effectiveWeight);
      console.log('  - Price per kg:', wizardData.price_per_kg);
      console.log('  - Expected Total:', effectiveWeight * wizardData.price_per_kg);
      
      // Prepare purchase data
      const purchaseData = {
        season_id: activeSeason.season_id,
        farmer_id: wizardData.farmer_id,
        product_id: wizardData.product_id,
        grade_id: 1,
        gross_weight_kg: parseFloat(activeSession.weight_with_load),
        tare_weight_kg: parseFloat(wizardData.weight_without_load),
        net_weight_kg: parseFloat(netWeight), // Actual net weight (gross - tare)
        moisture_content: 14.0,
        foreign_matter: 0.0,
        base_price_per_kg: parseFloat(wizardData.price_per_kg),
        vehicle_number: activeSession.lorry_reg_no,
        driver_name: null,
        weighbridge_id: null,
        weighing_log_id: null,
        created_by: 1,
        deduction_config: deductions,  // Changed from 'deductions' to 'deduction_config'
        total_deduction_rate: totalDeductionRate,
        effective_weight_kg: parseFloat(effectiveWeight)
      };

      console.log('📤 Sending to Backend:');
      console.log('  - purchaseData.net_weight_kg:', purchaseData.net_weight_kg);
      console.log('  - purchaseData.effective_weight_kg:', purchaseData.effective_weight_kg);
      console.log('  - purchaseData.deduction_config:', purchaseData.deduction_config);

      // Save purchase
      const result = await window.electronAPI.purchases.create(purchaseData);
      
      console.log('💾 Backend Response:', result);
      if (result.data) {
        console.log('  - Transaction ID:', result.data.transaction_id);
        console.log('  - Receipt Number:', result.data.receipt_number);
        console.log('  - Calculated Total:', result.data.calculated?.total_amount);
      }
      
      if (result.success) {
        message.success(
          <span>
            ✅ Purchase completed! Receipt: <strong>{result.data.receipt_number}</strong>
          </span>,
          5
        );
        
        // Print receipt
        console.log('🖨️  Printing receipt for transaction:', result.data.transaction_id);
        try {
          const printResult = await window.electronAPI.printer?.purchaseReceipt(result.data.transaction_id);
          if (printResult?.success) {
            if (printResult.mode === 'pdf') {
              message.success(
                <span>
                  📄 Receipt saved as PDF: <strong>{printResult.filename}</strong>
                  <br />
                  <small>Location: {printResult.path}</small>
                </span>,
                6
              );
              console.log('✅ Receipt saved as PDF:', printResult.path);
            } else {
              console.log('✅ Receipt printed successfully');
            }
          } else {
            console.error('Print failed:', printResult?.error);
            message.warning('Receipt created but printing failed. You can reprint from history.');
          }
        } catch (printError) {
          console.error('Print error:', printError);
          message.warning('Receipt created but printing failed. You can reprint from history.');
        }
        
        // Remove only the completed lorry from pending sessions
        // (match on lorry_reg_no and season_id, since pending sessions
        // are created without a session_id field)
        setPendingSessions(prev =>
          prev.filter(s => {
            const sameLorry = s.lorry_reg_no === activeSession.lorry_reg_no;
            const sameSeason = (!s.season_id && !activeSession.season_id) ||
              s.season_id === activeSession.season_id;
            return !(sameLorry && sameSeason);
          })
        );

        // Clear active session
        setActiveSession(null);
        finalForm.resetFields();
        
        // Reload purchase history
        // (could trigger a refresh event here)
      } else {
        message.error(result.error || 'Failed to complete purchase');
      }
    } catch (error) {
      console.error('Error completing purchase:', error);
      message.error('Failed to complete purchase');
    } finally {
      setLoading(false);
    }
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
    
    if (!values.product_id) {
      message.error('Please select a product');
      return;
    }
    
    if (!values.price_per_kg || values.price_per_kg <= 0) {
      message.error('Please enter valid price per kg');
      return;
    }

    if (!activeSession) {
      message.error('No active weighing session');
      return;
    }

    if (!activeSeason) {
      message.error('No active season found');
      return;
    }

    // Calculate net weight
    const netWeight = parseFloat(activeSession.weight_with_load) - parseFloat(values.weight_without_load);
    
    // Prepare purchase data
    const purchaseData = {
      season_id: activeSeason.season_id,
      farmer_id: values.farmer_id,
      product_id: values.product_id,
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

    // Store pending purchase data and open deduction confirmation modal
    setPendingPurchaseData(purchaseData);
    setDeductionModalOpen(true);
  };

  // Handle deduction confirmation and complete purchase
  const handleDeductionConfirm = async (confirmedDeductions) => {
    if (!pendingPurchaseData) return;

    setDeductionModalOpen(false);
    setLoading(true);
    
    try {
      // Add confirmed deductions to purchase data
      const purchaseData = {
        ...pendingPurchaseData,
        deduction_config: confirmedDeductions
      };

      console.log('Submitting purchase data with deductions:', purchaseData);
      const result = await window.electronAPI.purchases?.create(purchaseData);
      
      if (result?.success) {
        message.success(
          <span>
            ✅ Purchase completed! Receipt: <strong>{result.data.receipt_number}</strong>
            <br />
            <small>🗑️ Weight-in record removed from storage</small>
          </span>,
          5
        );
        
        // Print receipt
        console.log('🖨️  Printing receipt for transaction:', result.data.transaction_id);
        try {
          const printResult = await window.electronAPI.printer?.purchaseReceipt(result.data.transaction_id);
          if (printResult?.success) {
            if (printResult.mode === 'pdf') {
              message.success(
                <span>
                  📄 Receipt saved as PDF: <strong>{printResult.filename}</strong>
                  <br />
                  <small>Location: {printResult.path}</small>
                </span>,
                6
              );
              console.log('✅ Receipt saved as PDF:', printResult.path);
            } else {
              console.log('✅ Receipt printed successfully');
            }
          } else {
            console.error('Print failed:', printResult?.error);
            message.warning('Receipt created but printing failed. You can reprint from history.');
          }
        } catch (printError) {
          console.error('Print error:', printError);
          message.warning('Receipt created but printing failed. You can reprint from history.');
        }
        
        // Remove from pending sessions (will auto-save to localStorage)
        setPendingSessions(pendingSessions.filter(s => s.lorry_reg_no !== activeSession.lorry_reg_no));
        setActiveSession(null);
        setSelectedFarmer(null);
        finalForm.resetFields();
        
        // Trigger navbar stats refresh
        console.log('✅ Purchase completed, dispatching transaction-completed event');
        window.dispatchEvent(new Event('transaction-completed'));
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

  const handleDeductionCancel = () => {
    setDeductionModalOpen(false);
    setPendingPurchaseData(null);
  };

  const cancelWeighOut = () => {
    setActiveSession(null);
    setSelectedFarmer(null);
    finalForm.resetFields();
  };

  return (
    <div onContextMenu={(e) => { e.preventDefault(); showRecallModal(); }}>
      {/* Quick Stats - Compact */}
      <Card 
        size="small" 
        style={{ 
          marginBottom: 16,
          background: '#fafafa',
          border: '1px solid #e8e8e8'
        }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Row gutter={24} align="middle">
          <Col flex="auto">
            <Space size="large">
              <div>
                <ClockCircleOutlined style={{ color: '#faad14', marginRight: 6, fontSize: 16 }} />
                <span style={{ fontSize: 13, color: '#8c8c8c', marginRight: 8 }}>Pending:</span>
                <span style={{ fontSize: 18, fontWeight: 600, color: '#faad14' }}>
                  {seasonPendingSessions.length}
                </span>
                <Tag color="green" style={{ marginLeft: 8, fontSize: 10 }}>💾 Auto-Save</Tag>
              </div>
              
              <Divider type="vertical" style={{ height: 24, margin: '0 8px' }} />
              
              <div>
                <TruckOutlined style={{ color: activeSession ? '#1890ff' : '#d9d9d9', marginRight: 6, fontSize: 16 }} />
                <span style={{ fontSize: 13, color: '#8c8c8c', marginRight: 8 }}>Active:</span>
                <span style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  color: activeSession ? '#1890ff' : '#d9d9d9' 
                }}>
                  {activeSession ? activeSession.lorry_reg_no : 'None'}
                </span>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

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
        <WeighOutWizard
          session={activeSession}
          products={products}
          activeSeason={activeSeason}
          onComplete={handleWizardComplete}
          onCancel={cancelWeighOut}
        />
      )}

      {/* Main Content */}
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 0 }}>
          <Col>
            <Space>
              <Button
                size="large"
                type="primary"
                icon={<PlusOutlined />}
                onClick={startNewPurchase}
                disabled={weightInMode || activeSession || seasonLoading}
                loading={seasonLoading}
                title={seasonLoading ? "Loading season..." : "Press F3 to start"}
              >
                New Purchase (Weigh-In) <kbd style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: '3px' }}>F3</kbd>
              </Button>
              <Button
                size="large"
                icon={<ClockCircleOutlined />}
                onClick={showRecallModal}
                disabled={seasonPendingSessions.length === 0 || weightInMode || activeSession}
                title="Press F2 to open"
              >
                Recall Lorry ({seasonPendingSessions.length}) <kbd style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: '3px' }}>F2</kbd>
              </Button>
            </Space>
          </Col>
          <Col>
            {seasonLoading ? (
              <Tag icon={<ClockCircleOutlined spin />} color="processing">
                Loading season...
              </Tag>
            ) : activeSeason ? (
              <Tag color="green">
                🌾 {activeSeason.season_name || `Season ${activeSeason.season_number}/${activeSeason.year}`}
              </Tag>
            ) : (
              <Tag color="error">
                ⚠️ No active season
              </Tag>
            )}
          </Col>
        </Row>
      </Card>

      {/* Step 1: Lorry Registration Modal */}
      <Modal
        title="New Purchase - Enter Lorry"
        open={lorryModalOpen}
        onCancel={() => setLorryModalOpen(false)}
        footer={null}
        width={500}
        afterOpenChange={(open) => {
          if (open && lorryInputRef.current) {
            setTimeout(() => lorryInputRef.current?.focus(), 100);
          }
        }}
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
            normalize={(value) => value?.toUpperCase()}
          >
            <Input 
              ref={lorryInputRef}
              placeholder="e.g., ABC 1234" 
              size="large"
              autoFocus
              style={{ fontSize: '20px', textTransform: 'uppercase' }}
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
          {seasonPendingSessions.map((session, index) => (
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

      {/* Deduction Confirmation Modal */}
      <DeductionConfirmModal
        visible={deductionModalOpen}
        onConfirm={handleDeductionConfirm}
        onCancel={handleDeductionCancel}
        seasonDeductions={activeSeason?.deduction_config || []}
        netWeight={pendingPurchaseData?.net_weight_kg || 0}
      />

      {/* Set Current Price Modal */}
      <SetCurrentPriceModal
        visible={setPriceModalOpen}
        onConfirm={handlePriceSet}
        onCancel={handlePriceSetCancel}
        season={activeSeason}
      />
    </div>
  );
};

export default Purchases;
