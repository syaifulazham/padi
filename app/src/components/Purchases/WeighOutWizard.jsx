import React, { useState, useEffect, useRef } from 'react';
import { Modal, Steps, Button, Form, Input, InputNumber, message, Divider, Space, Tag, Tooltip, Radio, Card, Alert } from 'antd';
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
  SettingOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useI18n } from '../../i18n/I18nProvider';

const WeighOutWizard = ({ 
  session, 
  products, 
  onComplete, 
  onCancel,
  onCancelLorry,
  activeSeason 
}) => {
  const { t } = useI18n();

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
  const [cancelPasscodeModalOpen, setCancelPasscodeModalOpen] = useState(false);
  const [generatedPasscode, setGeneratedPasscode] = useState('');
  const [passcodeForm] = Form.useForm();
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  
  // Refs for auto-focus
  const productRefs = useRef([]);
  const tareWeightRef = useRef(null);
  const notesRef = useRef(null);

  // Auto-focus on stage change and initialize deduction form
  useEffect(() => {
    if (currentStep === 0 && tareWeightRef.current) {
      setTimeout(() => tareWeightRef.current?.focus(), 100);
    } else if (currentStep === 2) {
      // Reset product selection to first item when entering product stage
      setSelectedProductIndex(0);
      if (productRefs.current[0]) {
        setTimeout(() => productRefs.current[0]?.focus(), 100);
      }
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
      // Product selection navigation (Step 2)
      if (currentStep === 2 && products.length > 0) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          setSelectedProductIndex(prev => 
            prev < products.length - 1 ? prev + 1 : prev
          );
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          setSelectedProductIndex(prev => prev > 0 ? prev - 1 : prev);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (products[selectedProductIndex]) {
            handleProductSelect(products[selectedProductIndex]);
          }
        }
        return;
      }

      // Deductions stage (Step 3) - Enter to continue to review
      if (currentStep === 3 && e.key === 'Enter') {
        e.preventDefault();
        moveToStep(4);
        return;
      }

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
  }, [currentStep, products, selectedProductIndex, onCancel]);

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
              <strong>{t('purchasesWeighIn.weighOutWizard.messages.noPriceSetForProductTitle')}</strong>
              <br />
              <small>{t('purchasesWeighIn.weighOutWizard.messages.noPriceSetForProductHint')}</small>
            </div>
          ),
          duration: 5
        });
      }
    } catch (error) {
      console.error('❌ Error fetching price:', error);
      message.error(`${t('purchasesWeighIn.weighOutWizard.messages.failedToLoadProductPricePrefix')}${error.message}`);
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
    
    message.success(t('purchasesWeighIn.weighOutWizard.messages.switchedToPreset').replace('{preset}', selectedPreset.preset_name));
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
      message.error(t('purchasesWeighIn.weighOutWizard.messages.pleaseEnterValidTareWeight'));
      return;
    }
    if (value >= session.weight_with_load) {
      message.error(t('purchasesWeighIn.weighOutWizard.messages.tareWeightCannotExceedGross'));
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
      message.error(t('purchasesWeighIn.weighOutWizard.messages.failedToCompletePurchase'));
    } finally {
      setLoading(false);
    }
  };

  // Generate random 6-character passcode
  const generatePasscode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars like I,1,O,0
    let passcode = '';
    for (let i = 0; i < 6; i++) {
      passcode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return passcode;
  };

  const handleCancelLorry = () => {
    const passcode = generatePasscode();
    setGeneratedPasscode(passcode);
    passcodeForm.resetFields();
    setCancelPasscodeModalOpen(true);
  };

  const proceedWithCancellation = async () => {
    try {
      const values = await passcodeForm.validateFields();
      
      // Verify passcode
      if (values.passcode !== generatedPasscode) {
        message.error(t('purchasesWeighIn.weighOutWizard.cancelLorry.incorrectPasscode'));
        return;
      }
      
      setCancelPasscodeModalOpen(false);
      
      // Proceed with cancellation
      if (onCancelLorry) {
        await onCancelLorry(session);
      }
    } catch (error) {
      console.error('Passcode validation error:', error);
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
  
  // Calculate effective weight after deductions with rounding
  const effectiveWeightRaw = netWeight * (1 - totalDeductionRate / 100);
  const effectiveWeight = Math.round(effectiveWeightRaw);
  
  // Calculate total amount using rounded effective weight (after deductions)
  const totalAmount = wizardData.price_per_kg && effectiveWeight
    ? (effectiveWeight * wizardData.price_per_kg).toFixed(2)
    : 0;

  const steps = [
    { title: t('purchasesWeighIn.weighOutWizard.steps.weight'), icon: <span style={{ fontSize: 18 }}>⚖️</span> },
    { title: t('purchasesWeighIn.weighOutWizard.steps.farmer'), icon: <UserOutlined /> },
    { title: t('purchasesWeighIn.weighOutWizard.steps.product'), icon: <ProductOutlined /> },
    { title: t('purchasesWeighIn.weighOutWizard.steps.deductions'), icon: <PercentageOutlined /> },
    { title: t('purchasesWeighIn.weighOutWizard.steps.review'), icon: <FileTextOutlined /> }
  ];

  const stageTitles = [
    t('purchasesWeighIn.weighOutWizard.stageTitles.enterTareWeight'),
    t('purchasesWeighIn.weighOutWizard.stageTitles.selectFarmer'),
    t('purchasesWeighIn.weighOutWizard.stageTitles.selectPaddyProductType'),
    t('purchasesWeighIn.weighOutWizard.stageTitles.adjustDeductions'),
    t('purchasesWeighIn.weighOutWizard.stageTitles.reviewAndConfirmPurchase')
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
              🚛 {t('purchasesWeighIn.weighOutWizard.header.weighingOutLabel')} <Tag color="blue">{session.lorry_reg_no}</Tag>
            </h2>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              {t('purchasesWeighIn.weighOutWizard.header.hintPress')} <Tag>ESC</Tag> {t('purchasesWeighIn.weighOutWizard.header.hintToGoBack')} • <Tag>TAB</Tag> {t('purchasesWeighIn.weighOutWizard.header.hintToNavigate')}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            {currentStageTitle && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#999' }}>{t('purchasesWeighIn.weighOutWizard.header.currentStageLabel')}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{currentStageTitle}</div>
              </div>
            )}
            <Space>
              <Button onClick={onCancel} size="large">
                {t('purchasesWeighIn.weighOutWizard.actions.cancelEsc')}
              </Button>
              <Button 
                onClick={handleCancelLorry} 
                size="large"
                danger
                icon={<CloseCircleOutlined />}
              >
                {t('purchasesWeighIn.weighOutWizard.actions.cancelLorry')}
              </Button>
            </Space>
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
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{t('purchasesWeighIn.weighOutWizard.infoBar.weighIn')}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#52c41a' }}>
              {session.weight_with_load} {t('purchasesWeighIn.misc.kg')}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{t('purchasesWeighIn.weighOutWizard.infoBar.product')}</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: wizardData.product ? '#1890ff' : '#bfbfbf' }}>
              {wizardData.product ? (
                <>
                  {wizardData.product.product_type === 'BERAS' ? '🌾' : '🌱'} {wizardData.product.product_name}
                </>
              ) : t('purchasesWeighIn.weighOutWizard.misc.dash')}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{t('purchasesWeighIn.weighOutWizard.infoBar.farmer')}</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: wizardData.farmer_name ? '#1890ff' : '#bfbfbf' }}>
              {wizardData.farmer_name || t('purchasesWeighIn.weighOutWizard.misc.dash')}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{t('purchasesWeighIn.weighOutWizard.infoBar.netWeight')}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: netWeight > 0 ? '#1890ff' : '#bfbfbf' }}>
              {netWeight > 0 ? `${netWeight} ${t('purchasesWeighIn.misc.kg')}` : t('purchasesWeighIn.weighOutWizard.misc.dash')}
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{t('purchasesWeighIn.weighOutWizard.infoBar.totalAmount')}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: totalAmount > 0 ? '#f5222d' : '#bfbfbf' }}>
              {totalAmount > 0 ? `${t('purchasesWeighIn.weighOutWizard.misc.rm')} ${parseFloat(totalAmount).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : t('purchasesWeighIn.weighOutWizard.misc.dash')}
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
                    {t('purchasesWeighIn.weighOutWizard.weightStage.grossWeight')}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
                    {session.weight_with_load} {t('purchasesWeighIn.misc.kg')}
                  </div>
                </div>
                
                <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '2px solid #1890ff' }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
                    {t('purchasesWeighIn.weighOutWizard.weightStage.tareWeight')}
                  </div>
                  <InputNumber
                    ref={tareWeightRef}
                    min={0}
                    max={session.weight_with_load - 1}
                    step={10}
                    style={{ width: '100%', fontSize: 24 }}
                    placeholder={t('purchasesWeighIn.weighOutWizard.weightStage.tareWeightPlaceholder')}
                    suffix={t('purchasesWeighIn.misc.kg')}
                    size="large"
                    value={wizardData.weight_without_load}
                    onChange={(value) => setWizardData({ ...wizardData, weight_without_load: value })}
                    onPressEnter={(e) => handleTareWeightSubmit(e.target.value)}
                    autoFocus
                  />
                </div>

                <div style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                    {t('purchasesWeighIn.weighOutWizard.weightStage.netWeight')}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff' }}>
                    {netWeight} {t('purchasesWeighIn.misc.kg')}
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
                {t('purchasesWeighIn.weighOutWizard.actions.continue')} <ArrowRightOutlined />
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
                      <ArrowLeftOutlined /> {t('purchasesWeighIn.weighOutWizard.actions.backToWeight')}
                    </Button>
                    <Button onClick={openFarmerSearch}>
                      {t('purchasesWeighIn.weighOutWizard.actions.changeFarmer')}
                    </Button>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={() => moveToStep(2)}
                    >
                      {t('purchasesWeighIn.weighOutWizard.actions.continue')} <ArrowRightOutlined />
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
                  {t('purchasesWeighIn.weighOutWizard.actions.searchFarmer')}
                </Button>
                <div style={{ marginTop: 24 }}>
                  <Button onClick={() => setCurrentStep(0)}>
                    <ArrowLeftOutlined /> {t('purchasesWeighIn.weighOutWizard.actions.backToWeight')}
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
                    border: selectedProductIndex === index ? '2px solid #1890ff' : '2px solid #d9d9d9',
                    backgroundColor: selectedProductIndex === index ? '#e6f7ff' : undefined,
                    boxShadow: selectedProductIndex === index ? '0 0 8px rgba(24, 144, 255, 0.5)' : undefined,
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
                <ArrowLeftOutlined /> {t('purchasesWeighIn.weighOutWizard.actions.backToFarmer')}
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
                <SettingOutlined /> {deductionPresets[selectedPresetIndex]?.preset_name || t('purchasesWeighIn.weighOutWizard.misc.standard')}
              </Tag>
              {deductionPresets.length > 1 && (
                <Tooltip title={t('purchasesWeighIn.weighOutWizard.actions.changePresetTooltip')}>
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
                              {deductionItem?.deduction || t('purchasesWeighIn.weighOutWizard.misc.deduction')}
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
                                { required: true, message: t('purchasesWeighIn.weighOutWizard.validations.required') },
                                { type: 'number', min: 0, max: 100, message: t('purchasesWeighIn.weighOutWizard.validations.zeroToHundredPercent') }
                              ]}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber
                                placeholder={t('purchasesWeighIn.weighOutWizard.placeholders.zero')}
                                precision={2}
                                min={0}
                                max={100}
                                step={0.5}
                                size="middle"
                                style={{ width: 80 }}
                                addonAfter={t('purchasesWeighIn.weighOutWizard.misc.percent')}
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
              const effectiveWeightRaw = netWeight * (1 - totalDeduction / 100);
              const effectiveWeight = Math.round(effectiveWeightRaw);
              
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
                    {netWeight} {t('purchasesWeighIn.misc.kg')}
                  </span>
                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                    -{totalDeduction.toFixed(2)}%
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>→</span>
                  <span style={{ color: '#52c41a', fontWeight: 600, fontSize: 15 }}>
                    {effectiveWeight.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t('purchasesWeighIn.misc.kg')}
                  </span>
                </div>
              ) : null;
            })()}

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Space size="large">
                <Button size="large" onClick={() => setCurrentStep(2)}>
                  <ArrowLeftOutlined /> {t('purchasesWeighIn.weighOutWizard.actions.backToProduct')}
                </Button>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => moveToStep(4)}
                >
                  {t('purchasesWeighIn.weighOutWizard.actions.continueToReview')} <ArrowRightOutlined />
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
                    <div style={{ color: '#999', fontSize: 12 }}>{t('purchasesWeighIn.weighOutWizard.review.labels.lorry')}</div>
                    <div style={{ fontWeight: 600 }}>{session.lorry_reg_no}</div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#999', fontSize: 12 }}>{t('purchasesWeighIn.weighOutWizard.review.labels.product')}</div>
                    <div style={{ fontWeight: 600 }}>
                      {wizardData.product?.product_name}
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        {wizardData.product?.product_type}
                      </Tag>
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>{t('purchasesWeighIn.weighOutWizard.review.labels.farmer')}</div>
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
                    <div style={{ color: '#999', fontSize: 12 }}>{t('purchasesWeighIn.weighOutWizard.review.labels.grossWeight')}</div>
                    <div>{session.weight_with_load} {t('purchasesWeighIn.misc.kg')}</div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ color: '#999', fontSize: 12 }}>{t('purchasesWeighIn.weighOutWizard.review.labels.tareWeight')}</div>
                    <div>{wizardData.weight_without_load} {t('purchasesWeighIn.misc.kg')}</div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ color: '#999', fontSize: 12 }}>{t('purchasesWeighIn.weighOutWizard.review.labels.netWeight')}</div>
                    <div style={{ color: '#1890ff', fontSize: 14 }}>{netWeight} {t('purchasesWeighIn.misc.kg')}</div>
                  </div>

                  <div style={{ marginBottom: 4 }}>
                    <div style={{ color: '#999', fontSize: 12, fontWeight: 600 }}>
                      {t('purchasesWeighIn.weighOutWizard.review.labels.effectiveWeightAfterDeduction')}
                    </div>
                    <div style={{ fontWeight: 700, color: '#52c41a', fontSize: 20 }}>
                      {effectiveWeight.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t('purchasesWeighIn.misc.kg')}
                    </div>
                  </div>

                  <div style={{ color: '#999', fontSize: 12 }}>
                    {deductionSummary && `(${deductionSummary})`}
                  </div>
                </div>

                {/* Column 3: Pricing */}
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#999', fontSize: 12 }}>{t('purchasesWeighIn.weighOutWizard.review.labels.pricePerKg')}</div>
                    <div>{t('purchasesWeighIn.weighOutWizard.misc.rm')} {wizardData.price_per_kg?.toFixed(2)}</div>
                  </div>

                  {totalDeductionRate > 0 && (
                    <div>
                      <div style={{ color: '#999', fontSize: 12, fontWeight: 600 }}>{t('purchasesWeighIn.weighOutWizard.review.labels.totalAmount')}</div>
                      <div style={{ fontWeight: 600, color: '#52c41a', fontSize: 24 }}>
                        {t('purchasesWeighIn.weighOutWizard.misc.rm')} {totalAmount}
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
                  <ArrowLeftOutlined /> {t('purchasesWeighIn.weighOutWizard.actions.editDeductions')}
                </Button>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<CheckOutlined />}
                  onClick={handleComplete}
                  loading={loading}
                  autoFocus
                >
                  {t('purchasesWeighIn.weighOutWizard.actions.completePurchaseEnter')}
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
            {t('purchasesWeighIn.weighOutWizard.presetModal.title')}
          </Space>
        }
        open={presetModalOpen}
        onCancel={() => setPresetModalOpen(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#666', marginBottom: 16 }}>
            {t('purchasesWeighIn.weighOutWizard.presetModal.description')}
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

      {/* Cancel Lorry Passcode Confirmation Modal */}
      <Modal
        title={t('purchasesWeighIn.weighOutWizard.cancelLorry.passcodeTitle')}
        open={cancelPasscodeModalOpen}
        onCancel={() => {
          setCancelPasscodeModalOpen(false);
          setGeneratedPasscode('');
          passcodeForm.resetFields();
        }}
        onOk={proceedWithCancellation}
        okText={t('purchasesWeighIn.weighOutWizard.cancelLorry.confirmOk')}
        okButtonProps={{ danger: true }}
        cancelText={t('purchasesWeighIn.weighOutWizard.cancelLorry.confirmCancel')}
        width={500}
        closable={false}
        maskClosable={false}
      >
        <Alert
          message={t('purchasesWeighIn.weighOutWizard.cancelLorry.securityWarning')}
          description={
            <div>
              <p>{t('purchasesWeighIn.weighOutWizard.cancelLorry.cancellingLorry')} <strong>{session.lorry_reg_no}</strong></p>
              <p style={{ marginTop: 8 }}>
                {t('purchasesWeighIn.weighOutWizard.cancelLorry.transactionWillBeMarked')}
              </p>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <div style={{ 
          background: '#fff7e6', 
          border: '2px solid #fa8c16', 
          borderRadius: '8px', 
          padding: '20px', 
          textAlign: 'center',
          marginBottom: 24
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
            {t('purchasesWeighIn.weighOutWizard.cancelLorry.enterPasscode')}
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            letterSpacing: '8px',
            color: '#fa8c16',
            fontFamily: 'monospace'
          }}>
            {generatedPasscode}
          </div>
        </div>

        <Form form={passcodeForm} layout="vertical">
          <Form.Item
            name="passcode"
            label={t('purchasesWeighIn.weighOutWizard.cancelLorry.passcodeLabel')}
            rules={[
              { required: true, message: t('purchasesWeighIn.weighOutWizard.cancelLorry.passcodeRequired') },
              { len: 6, message: t('purchasesWeighIn.weighOutWizard.cancelLorry.passcodeMustBe6') }
            ]}
          >
            <Input
              size="large"
              placeholder={t('purchasesWeighIn.weighOutWizard.cancelLorry.passcodePlaceholder')}
              maxLength={6}
              style={{ 
                textTransform: 'uppercase', 
                letterSpacing: '4px',
                fontSize: '18px',
                fontFamily: 'monospace'
              }}
              autoFocus
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default WeighOutWizard;
