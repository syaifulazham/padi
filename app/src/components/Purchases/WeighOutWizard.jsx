import React, { useState, useEffect, useRef } from 'react';
import { Modal, Steps, Button, Form, Input, InputNumber, message, Divider, Space, Tag, Tooltip, Radio, Card } from 'antd';
import { 
  ArrowLeftOutlined, 
  ArrowRightOutlined, 
  CheckOutlined,
  ProductOutlined,
  UserOutlined,
  FileTextOutlined,
  SearchOutlined,
  PercentageOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  SettingOutlined
} from '@ant-design/icons';

const WeighOutWizard = ({ 
  session, 
  products, 
  onComplete, 
  onCancel,
  activeSeason 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState([0]); // Track visited steps
  const [wizardData, setWizardData] = useState({
    product_id: null,
    product: null,
    price_per_kg: null,
    farmer_id: null,
    farmer_name: null,
    weight_without_load: null,
    deductions: [],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [deductionForm] = Form.useForm();
  const [deductionPresets, setDeductionPresets] = useState([]);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  
  // Refs for auto-focus
  const productRefs = useRef([]);
  const tareWeightRef = useRef(null);
  const notesRef = useRef(null);

  // Auto-focus on stage change and initialize deduction form
  useEffect(() => {
    if (currentStep === 0 && tareWeightRef.current) {
      setTimeout(() => tareWeightRef.current?.focus(), 100);
    } else if (currentStep === 2 && productRefs.current[0]) {
      setTimeout(() => productRefs.current[0]?.focus(), 100);
    } else if (currentStep === 3) {
      // Deductions stage - ensure form is initialized
      console.log('Deductions stage - wizardData.deductions:', wizardData.deductions);
      if (wizardData.deductions && wizardData.deductions.length > 0) {
        deductionForm.setFieldsValue({ deductions: wizardData.deductions });
      }
    }
  }, [currentStep, wizardData.deductions]);
  
  // Log active season data on mount
  useEffect(() => {
    console.log('WeighOutWizard - activeSeason:', activeSeason);
    console.log('WeighOutWizard - deduction_config:', activeSeason?.deduction_config);
  }, [activeSeason]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Escape to go back
      if (e.key === 'Escape') {
        if (currentStep > 0) {
          e.preventDefault();
          setCurrentStep(currentStep - 1);
        } else {
          onCancel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentStep, onCancel]);

  const handleProductSelect = async (product) => {
    setLoading(true);
    try {
      console.log('🔍 Fetching price for product:', product.product_id, product.product_name);
      console.log('🔍 Active season:', activeSeason?.season_id);
      
      // Fetch product price
      const priceResult = await window.electronAPI.seasonProductPrices.getProductPrice(
        activeSeason.season_id,
        product.product_id
      );

      console.log('📊 Price result:', priceResult);

      if (priceResult?.success && priceResult.data?.current_price_per_ton) {
        const pricePerKg = priceResult.data.current_price_per_ton / 1000;
        
        // Get season deductions configuration (new preset format)
        const deductionConfig = activeSeason?.deduction_config || [];
        let presets = [];
        let defaultDeductions = [];
        
        // Check if new format (array of presets) or old format (array of deductions)
        const isNewFormat = Array.isArray(deductionConfig) && 
                           deductionConfig.length > 0 && 
                           deductionConfig[0].preset_name !== undefined;
        
        if (isNewFormat) {
          // New format with multiple presets
          presets = deductionConfig;
          defaultDeductions = presets[0]?.deductions || [];
          console.log('✅ Using new preset format. Presets:', presets.map(p => p.preset_name));
        } else {
          // Old format - convert to single preset
          presets = [{ preset_name: 'Standard', deductions: deductionConfig }];
          defaultDeductions = deductionConfig;
          console.log('✅ Using old format, converted to preset');
        }
        
        console.log('✅ Price found:', pricePerKg, 'RM/kg');
        console.log('Loading default deductions from first preset:', defaultDeductions);
        
        setDeductionPresets(presets);
        setSelectedPresetIndex(0);
        setWizardData({
          ...wizardData,
          product_id: product.product_id,
          product: product,
          price_per_kg: pricePerKg,
          deductions: defaultDeductions
        });
        
        // Initialize deduction form with first preset's deductions
        deductionForm.setFieldsValue({
          deductions: defaultDeductions
        });
        
        console.log('⏭️ Moving to step 3 (Deductions)');
        moveToStep(3); // Move to Deductions stage
      } else {
        console.warn('❌ No price found for product:', product.product_name);
        console.warn('   Price result data:', priceResult?.data);
        message.warning({
          content: (
            <div>
              <strong>No price set for this product</strong>
              <br />
              <small>Please set a price in Settings → Season & Prices</small>
            </div>
          ),
          duration: 5
        });
      }
    } catch (error) {
      console.error('❌ Error fetching price:', error);
      message.error('Failed to load product price: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (index) => {
    const selectedPreset = deductionPresets[index];
    const newDeductions = selectedPreset?.deductions || [];
    
    setSelectedPresetIndex(index);
    setWizardData({ ...wizardData, deductions: newDeductions });
    deductionForm.setFieldsValue({ deductions: newDeductions });
    setPresetModalOpen(false);
    
    message.success(`Switched to "${selectedPreset.preset_name}" preset`);
  };

  const openFarmerSearch = () => {
    // This will be handled by parent component
    window.dispatchEvent(new CustomEvent('open-farmer-search', {
      detail: {
        onSelect: (farmer) => {
          setWizardData({
            ...wizardData,
            farmer_id: farmer.farmer_id,
            farmer_name: farmer.name
          });
          moveToStep(2); // Move to Product stage
        }
      }
    }));
  };

  const handleTareWeightSubmit = (value) => {
    if (!value || value <= 0) {
      message.error('Please enter valid tare weight');
      return;
    }
    if (value >= session.weight_with_load) {
      message.error('Tare weight cannot be greater than or equal to gross weight');
      return;
    }
    setWizardData({
      ...wizardData,
      weight_without_load: value
    });
    moveToStep(1); // Move to Farmer stage
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete(wizardData);
    } catch (error) {
      console.error('Error completing purchase:', error);
      message.error('Failed to complete purchase');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to a specific step (only if visited)
  const goToStep = (step) => {
    if (visitedSteps.includes(step)) {
      setCurrentStep(step);
    }
  };

  // Mark a step as visited and move to it
  const moveToStep = (step) => {
    setCurrentStep(step);
    if (!visitedSteps.includes(step)) {
      setVisitedSteps([...visitedSteps, step]);
    }
  };

  const netWeight = wizardData.weight_without_load 
    ? (session.weight_with_load - wizardData.weight_without_load).toFixed(2)
    : 0;
  
  // Calculate total deduction percentage
  const totalDeductionRate = wizardData.deductions?.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0) || 0;
  
  const deductionSummary = wizardData.deductions && wizardData.deductions.length
    ? wizardData.deductions
        .map(d => `${d.deduction} ${parseFloat(d.value || 0)}%`)
        .join(', ')
    : '';
  
  // Calculate effective weight after deductions
  const effectiveWeight = netWeight * (1 - totalDeductionRate / 100);
  
  // Calculate total amount using effective weight (after deductions)
  const totalAmount = wizardData.price_per_kg && effectiveWeight
    ? (effectiveWeight * wizardData.price_per_kg).toFixed(2)
    : 0;

  const steps = [
    { title: 'Weight', icon: <span style={{ fontSize: 18 }}>⚖️</span> },
    { title: 'Farmer', icon: <UserOutlined /> },
    { title: 'Product', icon: <ProductOutlined /> },
    { title: 'Deductions', icon: <PercentageOutlined /> },
    { title: 'Review', icon: <FileTextOutlined /> }
  ];

  const stageTitles = [
    'Enter Tare Weight',
    'Select Farmer',
    'Select Paddy Product Type',
    'Adjust Deductions',
    'Review & Confirm Purchase'
  ];

  const currentStageTitle = stageTitles[currentStep] || '';

  return (
    <Card 
      style={{ 
        background: '#e6f7ff', 
        borderColor: '#1890ff',
        minHeight: '500px'
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>
              🚛 Weighing Out: <Tag color="blue">{session.lorry_reg_no}</Tag>
            </h2>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              Press <Tag>ESC</Tag> to go back • <Tag>TAB</Tag> to navigate
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            {currentStageTitle && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#999' }}>Current Stage</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{currentStageTitle}</div>
              </div>
            )}
            <Button onClick={onCancel} size="large">
              Cancel (ESC)
            </Button>
          </div>
        </div>

        <Steps 
          current={currentStep} 
          items={steps} 
          size="small" 
          onChange={goToStep}
          style={{ cursor: 'pointer' }}
        />
        
        {/* Static Info Bar */}
        <div style={{ 
          marginTop: 16,
          padding: '12px 16px',
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #d9d9d9',
          display: 'grid',
          gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr 1.2fr',
          gap: 16,
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Weigh-In</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#52c41a' }}>
              {session.weight_with_load} kg
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Product</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: wizardData.product ? '#1890ff' : '#bfbfbf' }}>
              {wizardData.product ? (
                <>
                  {wizardData.product.product_type === 'BERAS' ? '🌾' : '🌱'} {wizardData.product.product_name}
                </>
              ) : '—'}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Farmer</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: wizardData.farmer_name ? '#1890ff' : '#bfbfbf' }}>
              {wizardData.farmer_name || '—'}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Net Weight</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: netWeight > 0 ? '#1890ff' : '#bfbfbf' }}>
              {netWeight > 0 ? `${netWeight} kg` : '—'}
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Total Amount</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: totalAmount > 0 ? '#f5222d' : '#bfbfbf' }}>
              {totalAmount > 0 ? `RM ${parseFloat(totalAmount).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
            </div>
          </div>
        </div>
      </div>

      <Divider />

      {/* Stage Content */}
      <div style={{ minHeight: 300 }}>
        
        {/* Stage 0: Tare Weight Entry */}
        {currentStep === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ 
                display: 'inline-grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                gap: 24,
                textAlign: 'center'
              }}>
                <div style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                    Gross Weight
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
                    {session.weight_with_load} kg
                  </div>
                </div>
                
                <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '2px solid #1890ff' }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
                    Tare Weight
                  </div>
                  <InputNumber
                    ref={tareWeightRef}
                    min={0}
                    max={session.weight_with_load - 1}
                    step={10}
                    style={{ width: '100%', fontSize: 24 }}
                    placeholder="0.00"
                    suffix="kg"
                    size="large"
                    value={wizardData.weight_without_load}
                    onChange={(value) => setWizardData({ ...wizardData, weight_without_load: value })}
                    onPressEnter={(e) => handleTareWeightSubmit(e.target.value)}
                    autoFocus
                  />
                </div>

                <div style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                    Net Weight
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff' }}>
                    {netWeight} kg
                  </div>
                </div>
              </div>
            </div>

            <Space size="large">
              <Button 
                type="primary" 
                size="large"
                onClick={() => handleTareWeightSubmit(wizardData.weight_without_load)}
                disabled={!wizardData.weight_without_load || wizardData.weight_without_load <= 0}
              >
                Continue <ArrowRightOutlined />
              </Button>
            </Space>
          </div>
        )}

        {/* Stage 1: Farmer Selection */}
        {currentStep === 1 && (
          <div style={{ textAlign: 'center' }}>

            {wizardData.farmer_name ? (
              <div>
                <div style={{ 
                  background: '#fff', 
                  padding: 24, 
                  borderRadius: 8,
                  marginBottom: 16,
                  display: 'inline-block',
                  minWidth: 300
                }}>
                  <UserOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                  <h2 style={{ margin: 0 }}>{wizardData.farmer_name}</h2>
                </div>
                <div>
                  <Space>
                    <Button onClick={() => setCurrentStep(0)}>
                      <ArrowLeftOutlined /> Back to Weight
                    </Button>
                    <Button onClick={openFarmerSearch}>
                      Change Farmer
                    </Button>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={() => moveToStep(2)}
                    >
                      Continue <ArrowRightOutlined />
                    </Button>
                  </Space>
                </div>
              </div>
            ) : (
              <div>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<SearchOutlined />}
                  onClick={openFarmerSearch}
                  autoFocus
                >
                  Search Farmer
                </Button>
                <div style={{ marginTop: 24 }}>
                  <Button onClick={() => setCurrentStep(0)}>
                    <ArrowLeftOutlined /> Back to Weight
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stage 2: Product */}
        {currentStep === 2 && (
          <div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: 16
            }}>
              {products.map((product, index) => (
                <Card
                  key={product.product_id}
                  ref={el => productRefs.current[index] = el}
                  hoverable
                  tabIndex={0}
                  onClick={() => handleProductSelect(product)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleProductSelect(product);
                  }}
                  style={{
                    cursor: 'pointer',
                    border: '2px solid #d9d9d9',
                    transition: 'all 0.3s'
                  }}
                  bodyStyle={{ padding: 16 }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>
                      {product.product_type === 'BERAS' ? '🌾' : '🌱'}
                      {product.variety === 'WANGI' ? ' ✨' : ''}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                      {product.product_name}
                    </div>
                    <Tag color={product.product_type === 'BERAS' ? 'green' : 'orange'}>
                      {product.product_type}
                    </Tag>
                  </div>
                </Card>
              ))}
            </div>
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Button size="large" onClick={() => setCurrentStep(1)}>
                <ArrowLeftOutlined /> Back to Farmer
              </Button>
            </div>
          </div>
        )}

        {/* Stage 3: Deductions */}
        {currentStep === 3 && (
          <div style={{ textAlign: 'center' }}>
            {/* Compact preset selector */}
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
              <Tag color="blue" style={{ margin: 0, fontSize: 13 }}>
                <SettingOutlined /> {deductionPresets[selectedPresetIndex]?.preset_name || 'Standard'}
              </Tag>
              {deductionPresets.length > 1 && (
                <Tooltip title="Change preset">
                  <Button
                    size="small"
                    icon={<AppstoreOutlined />}
                    onClick={() => setPresetModalOpen(true)}
                    type="link"
                  />
                </Tooltip>
              )}
            </div>

            <Form
              form={deductionForm}
              layout="inline"
              onValuesChange={(_, allValues) => {
                if (allValues.deductions) {
                  setWizardData({ ...wizardData, deductions: allValues.deductions });
                }
              }}
            >
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                maxWidth: 800,
                margin: '0 auto',
                justifyContent: 'center'
              }}>
                <Form.List name="deductions">
                  {(fields) => (
                    <>
                      {fields.map((field, index) => {
                        const deductionItem = wizardData.deductions?.[index];
                        return (
                          <div 
                            key={`deduction-${field.key}-${index}`}
                            style={{
                              background: '#fafafa',
                              padding: '8px 12px',
                              borderRadius: 6,
                              border: '1px solid #d9d9d9',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8
                            }}
                          >
                            <span style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: '#595959',
                              minWidth: 80
                            }}>
                              {deductionItem?.deduction || 'Deduction'}
                            </span>
                            
                            <Form.Item
                              key={`${field.key}-deduction`}
                              name={[field.name, 'deduction']}
                              hidden
                            >
                              <Input />
                            </Form.Item>
                            
                            <Form.Item
                              key={`${field.key}-value`}
                              name={[field.name, 'value']}
                              fieldKey={[field.fieldKey, 'value']}
                              rules={[
                                { required: true, message: 'Required' },
                                { type: 'number', min: 0, max: 100, message: '0-100%' }
                              ]}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber
                                placeholder="0"
                                precision={2}
                                min={0}
                                max={100}
                                step={0.5}
                                size="middle"
                                style={{ width: 80 }}
                                addonAfter="%"
                                autoFocus={index === 0}
                              />
                            </Form.Item>
                          </div>
                        );
                      })}
                    </>
                  )}
                </Form.List>
              </div>
            </Form>

            {(() => {
              const deductions = wizardData.deductions || [];
              const totalDeduction = deductions.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
              const effectiveWeight = netWeight * (1 - totalDeduction / 100);
              
              return totalDeduction > 0 ? (
                <div style={{
                  background: '#f0f2f5',
                  padding: '8px 16px',
                  borderRadius: 6,
                  marginTop: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 16,
                  fontSize: 13
                }}>
                  <span style={{ color: '#8c8c8c' }}>
                    {netWeight} kg
                  </span>
                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                    -{totalDeduction.toFixed(2)}%
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>→</span>
                  <span style={{ color: '#52c41a', fontWeight: 600, fontSize: 15 }}>
                    {effectiveWeight.toFixed(2)} kg
                  </span>
                </div>
              ) : null;
            })()}

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Space size="large">
                <Button size="large" onClick={() => setCurrentStep(2)}>
                  <ArrowLeftOutlined /> Back to Product
                </Button>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => moveToStep(4)}
                >
                  Continue to Review <ArrowRightOutlined />
                </Button>
              </Space>
            </div>
          </div>
        )}

        {/* Stage 4: Review & Confirm */}
        {currentStep === 4 && (
          <div>
            <div
              style={{
                background: '#fff',
                padding: 24,
                borderRadius: 8,
                maxWidth: 900,
                margin: '0 auto 24px'
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.1fr 1.1fr 0.8fr',
                  gap: 24,
                }}
              >
                {/* Column 1: Lorry / Product / Farmer */}
                <div
                  style={{
                    borderRight: '1px solid #f0f0f0',
                    paddingRight: 16,
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#999', fontSize: 12 }}>Lorry</div>
                    <div style={{ fontWeight: 600 }}>{session.lorry_reg_no}</div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#999', fontSize: 12 }}>Product</div>
                    <div style={{ fontWeight: 600 }}>
                      {wizardData.product?.product_name}
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        {wizardData.product?.product_type}
                      </Tag>
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>Farmer</div>
                    <div style={{ fontWeight: 600 }}>{wizardData.farmer_name}</div>
                  </div>
                </div>

                {/* Column 2: Weights */}
                <div
                  style={{
                    borderRight: '1px solid #f0f0f0',
                    paddingRight: 16,
                  }}
                >
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ color: '#999', fontSize: 12 }}>Gross Weight</div>
                    <div>{session.weight_with_load} kg</div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ color: '#999', fontSize: 12 }}>Tare Weight</div>
                    <div>{wizardData.weight_without_load} kg</div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ color: '#999', fontSize: 12 }}>Net Weight</div>
                    <div style={{ color: '#1890ff', fontSize: 14 }}>{netWeight} kg</div>
                  </div>

                  <div style={{ marginBottom: 4 }}>
                    <div style={{ color: '#999', fontSize: 12, fontWeight: 600 }}>
                      Effective Weight (after deduction)
                    </div>
                    <div style={{ fontWeight: 700, color: '#52c41a', fontSize: 20 }}>
                      {effectiveWeight.toFixed(2)} kg
                    </div>
                  </div>

                  <div style={{ color: '#999', fontSize: 12 }}>
                    {deductionSummary && `(${deductionSummary})`}
                  </div>
                </div>

                {/* Column 3: Pricing */}
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#999', fontSize: 12 }}>Price per KG</div>
                    <div>RM {wizardData.price_per_kg?.toFixed(2)}</div>
                  </div>

                  {totalDeductionRate > 0 && (
                    <div>
                      <div style={{ color: '#999', fontSize: 12, fontWeight: 600 }}>Total Amount</div>
                      <div style={{ fontWeight: 600, color: '#52c41a', fontSize: 24 }}>
                        RM {totalAmount}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Space size="large">
                <Button 
                  size="large"
                  onClick={() => setCurrentStep(3)}
                >
                  <ArrowLeftOutlined /> Edit Deductions
                </Button>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<CheckOutlined />}
                  onClick={handleComplete}
                  loading={loading}
                  autoFocus
                >
                  Complete Purchase (Enter)
                </Button>
              </Space>
            </div>
          </div>
        )}
      </div>

      {/* Preset Selection Modal */}
      <Modal
        title={
          <Space>
            <AppstoreOutlined />
            Select Deduction Preset
          </Space>
        }
        open={presetModalOpen}
        onCancel={() => setPresetModalOpen(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#666', marginBottom: 16 }}>
            Choose the appropriate deduction preset based on paddy quality:
          </p>
          <Radio.Group 
            value={selectedPresetIndex} 
            onChange={(e) => handlePresetChange(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {deductionPresets.map((preset, index) => {
                const totalRate = preset.deductions.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
                return (
                  <Radio 
                    key={index} 
                    value={index}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: selectedPresetIndex === index ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      borderRadius: 8,
                      backgroundColor: selectedPresetIndex === index ? '#e6f7ff' : 'transparent',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{preset.preset_name}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                          {preset.deductions.map(d => d.deduction).join(', ')}
                        </div>
                      </div>
                      <Tag color={totalRate < 15 ? 'green' : totalRate < 25 ? 'orange' : 'red'} style={{ marginLeft: 8 }}>
                        {totalRate.toFixed(1)}%
                      </Tag>
                    </div>
                  </Radio>
                );
              })}
            </Space>
          </Radio.Group>
        </div>
      </Modal>
    </Card>
  );
};

export default WeighOutWizard;
