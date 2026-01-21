import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, InputNumber, message, Steps, Space, Tag, Divider, Alert, Modal, Table, Input, Statistic, Row, Col, Form } from 'antd';
import { 
  ArrowLeftOutlined, 
  ArrowRightOutlined, 
  CheckOutlined,
  UserOutlined,
  SearchOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  DollarOutlined,
  ScissorOutlined
} from '@ant-design/icons';
import { useI18n } from '../../i18n/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';
import './SalesWeighOutWizard.css';

const SalesWeighOutWizard = ({ 
  session, 
  onComplete, 
  onCancel,
  activeSeason,
  manufacturers,
  availableReceipts,
  onReloadReceipts
}) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState([0]);
  const [wizardData, setWizardData] = useState({
    gross_weight: null,
    manufacturer_id: null,
    manufacturer_name: null,
    product_id: null,
    product_name: null,
    selected_receipts: [],
    price_per_kg: null,
    driver_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [manufacturerSearchModal, setManufacturerSearchModal] = useState(false);
  const [manufacturerSearchText, setManufacturerSearchText] = useState('');
  const [manufacturerOptions, setManufacturerOptions] = useState([]);
  const [products, setProducts] = useState([]);
  const [productSearchModal, setProductSearchModal] = useState(false);
  const [productSearchText, setProductSearchText] = useState('');
  const [receiptSelectionModal, setReceiptSelectionModal] = useState(false);
  const [splitReceiptModal, setSplitReceiptModal] = useState(false);
  const [receiptToSplit, setReceiptToSplit] = useState(null);
  const [splitForm] = Form.useForm();
  const grossWeightRef = useRef(null);
  const priceRef = useRef(null);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const result = await window.electronAPI.products?.getAll();
      if (result?.success) {
        setProducts(result.data || []);
        console.log('✅ Loaded products:', result.data?.length || 0);
      } else {
        message.error('Failed to load products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      message.error('Error loading products');
    }
  };

  // Log available receipts for debugging
  useEffect(() => {
    console.log('📋 SalesWeighOutWizard - Available Receipts:', availableReceipts.length);
    console.log('   Receipts:', availableReceipts);
  }, [availableReceipts]);

  // Auto-focus on stage change
  useEffect(() => {
    if (currentStep === 0 && grossWeightRef.current) {
      setTimeout(() => grossWeightRef.current?.focus(), 100);
    }
  }, [currentStep]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if user is typing in an input/textarea, or modal is open
      const isInputField = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      const isModalOpen = manufacturerSearchModal || productSearchModal || receiptSelectionModal || splitReceiptModal;
      
      if (isInputField || isModalOpen) {
        // Only handle Escape in modals
        if (e.key === 'Escape' && !isInputField) {
          if (manufacturerSearchModal) {
            setManufacturerSearchModal(false);
          } else if (productSearchModal) {
            setProductSearchModal(false);
          } else if (receiptSelectionModal) {
            setReceiptSelectionModal(false);
          } else if (splitReceiptModal) {
            setSplitReceiptModal(false);
          }
        }
        return;
      }

      if (e.key === 'Escape') {
        if (currentStep > 0) {
          e.preventDefault();
          setCurrentStep(currentStep - 1);
        } else {
          onCancel();
        }
      }

      // Enter key to progress to next stage (handled individually by input fields for stage 0)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        
        const netWeight = wizardData.gross_weight ? (wizardData.gross_weight - session.tare_weight) : 0;
        const selectedTotal = wizardData.selected_receipts.reduce((sum, r) => sum + parseFloat(r.net_weight_kg || 0), 0);
        const diff = Math.abs(netWeight - selectedTotal);
        
        // Stage 1: Manufacturer
        if (currentStep === 1 && wizardData.manufacturer_id) {
          moveToStep(2);
        }
        // Stage 2: Product
        else if (currentStep === 2 && wizardData.product_id) {
          moveToStep(3);
        }
        // Stage 3: Receipts
        else if (currentStep === 3 && wizardData.selected_receipts.length > 0 && diff <= 0.5) {
          moveToStep(4);
        }
        // Stage 4: Complete
        else if (currentStep === 4) {
          handleComplete();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentStep, wizardData, session, manufacturerSearchModal, productSearchModal, receiptSelectionModal, splitReceiptModal, onCancel]);

  const searchManufacturers = (searchText) => {
    if (!searchText || searchText.length < 2) {
      setManufacturerOptions([]);
      return;
    }

    const filtered = manufacturers
      .filter(m => {
        const searchLower = searchText.toLowerCase();
        return (
          m.company_name?.toLowerCase().includes(searchLower) ||
          m.contact_person?.toLowerCase().includes(searchLower)
        );
      })
      .slice(0, 50);

    setManufacturerOptions(filtered);
  };

  const openManufacturerSearch = () => {
    setManufacturerSearchText('');
    setManufacturerOptions([]);
    setManufacturerSearchModal(true);
  };

  const selectManufacturer = (manufacturer) => {
    setWizardData({
      ...wizardData,
      manufacturer_id: manufacturer.manufacturer_id,
      manufacturer_name: manufacturer.company_name
    });
    setManufacturerSearchModal(false);
    message.success(`Selected: ${manufacturer.company_name}`);
  };

  const searchProducts = (searchText) => {
    // Products list is small, just show all or filter by name
    return products.filter(p => 
      !searchText || 
      p.product_name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.product_code.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const openProductSearch = () => {
    setProductSearchModal(true);
  };

  const selectProduct = (product) => {
    setWizardData({
      ...wizardData,
      product_id: product.product_id,
      product_name: product.product_name,
      selected_receipts: [] // Clear receipts when product changes
    });
    setProductSearchModal(false);
    message.success(`Selected: ${product.product_name}`);
  };

  const openReceiptSelection = () => {
    setReceiptSelectionModal(true);
  };

  const handleReceiptSelection = (selectedRows) => {
    setWizardData({
      ...wizardData,
      selected_receipts: selectedRows
    });
    // Don't close modal - let user select multiple receipts
  };

  const removeReceipt = (receipt) => {
    setWizardData({
      ...wizardData,
      selected_receipts: wizardData.selected_receipts.filter(r => r.transaction_id !== receipt.transaction_id)
    });
  };

  const openSplitModal = (receipt) => {
    setReceiptToSplit(receipt);
    
    // Calculate container's net weight (convert to number if it's a string)
    const containerNetWeight = wizardData.gross_weight 
      ? parseFloat(wizardData.gross_weight) - parseFloat(session.tare_weight || 0)
      : 0;
    
    // Calculate total weight of selected receipts
    const selectedTotal = wizardData.selected_receipts.reduce(
      (sum, r) => sum + parseFloat(r.net_weight_kg || 0), 
      0
    );
    
    // Difference = Selected Receipts Total - Container Net Weight (per user's specification)
    // Positive = over-capacity (too much weight, need to remove excess)
    // Negative = under-capacity (need more weight)
    const difference = selectedTotal - containerNetWeight;
    
    // Auto-calculate split weights based on the difference
    let calculatedSplitWeight;  // Goes to buyer
    let calculatedRemainingWeight;  // Stays available
    
    const receiptNetWeight = parseFloat(receipt.net_weight_kg || 0);
    
    // Safety check
    if (receiptNetWeight <= 0 || isNaN(receiptNetWeight)) {
      console.error('❌ Invalid receipt weight:', {
        net_weight_kg: receipt.net_weight_kg,
        receipt_number: receipt.receipt_number
      });
      message.error(`Cannot split receipt ${receipt.receipt_number}: Invalid weight data`);
      return;
    }
    
    if (difference > 0) {
      // Over-capacity: Too much weight selected
      // Split 1 (remaining) = the difference (excess to remove)
      // Split 2 (to buyer) = selected receipt weight - the difference
      calculatedRemainingWeight = Math.min(difference, receiptNetWeight - 0.01);
      calculatedSplitWeight = receiptNetWeight - calculatedRemainingWeight;
    } else if (difference < 0) {
      // Under-capacity: Need more weight
      // Split 1 (to buyer) = abs(difference) (the amount we need)
      // Split 2 (remaining) = selected receipt weight - abs(difference)
      const needed = Math.abs(difference);
      calculatedSplitWeight = Math.min(needed, receiptNetWeight - 0.01);
      calculatedRemainingWeight = receiptNetWeight - calculatedSplitWeight;
    } else {
      // Exact match: Split in half as default
      calculatedSplitWeight = Math.round((receiptNetWeight / 2) * 100) / 100;
      calculatedRemainingWeight = receiptNetWeight - calculatedSplitWeight;
    }
    
    // Ensure values are valid numbers
    calculatedSplitWeight = parseFloat(calculatedSplitWeight.toFixed(2));
    calculatedRemainingWeight = parseFloat(calculatedRemainingWeight.toFixed(2));
    
    console.log('🔪 Opening Split Modal:', {
      containerNetWeight: `${containerNetWeight} kg (truck capacity)`,
      selectedTotal: `${selectedTotal} kg (already selected)`,
      receiptNetWeight: `${receiptNetWeight} kg (receipt to split)`,
      difference: `${difference} kg (Selected - Container)`,
      scenario: difference > 0 
        ? `OVER-CAPACITY: ${difference} kg excess` 
        : difference < 0 
        ? `UNDER-CAPACITY: need ${Math.abs(difference)} kg more` 
        : 'EXACT MATCH',
      splitToBuyer: `${calculatedSplitWeight} kg`,
      remaining: `${calculatedRemainingWeight} kg`,
      formula: difference > 0 
        ? `Remaining = ${difference} kg (excess), To Buyer = ${receiptNetWeight} - ${difference} = ${calculatedSplitWeight} kg`
        : difference < 0
        ? `To Buyer = ${Math.abs(difference)} kg (needed), Remaining = ${receiptNetWeight} - ${Math.abs(difference)} = ${calculatedRemainingWeight} kg`
        : 'Split in half'
    });
    
    // Split is based on NET weight (paddy weight only)
    // Set values first, then open modal
    splitForm.setFieldsValue({
      original_net_weight: receiptNetWeight,
      split_weight: calculatedSplitWeight,
      remaining_weight: calculatedRemainingWeight,
      weight_needed: difference
    });
    
    // Open modal after a brief delay to ensure form is ready
    setTimeout(() => {
      setSplitReceiptModal(true);
    }, 50);
  };

  // No longer needed since field is disabled, but keeping for reference
  const handleSplitWeightChange = (splitWeight) => {
    const originalGrossWeight = receiptToSplit?.gross_weight_kg || 0;
    const remaining = originalGrossWeight - (splitWeight || 0);
    splitForm.setFieldsValue({ remaining_weight: remaining });
  };

  const confirmSplitReceipt = async (values) => {
    if (values.split_weight <= 0 || values.split_weight >= receiptToSplit.net_weight_kg) {
      message.error('Split weight must be greater than 0 and less than original net weight');
      return;
    }

    // Check if the API is available
    if (!window.electronAPI?.purchases?.createSplit) {
      message.error(
        <div>
          <div><strong>Split API not available</strong></div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Please restart the application to enable split receipt functionality.
          </div>
        </div>,
        5
      );
      console.error('window.electronAPI.purchases.createSplit is not available. Please restart the Electron app.');
      return;
    }

    try {
      setLoading(true);
      
      // Call backend API to create split in database
      const result = await window.electronAPI.purchases.createSplit(
        receiptToSplit.transaction_id,
        values.split_weight,
        user?.user_id
      );

      if (!result.success) {
        message.error('Failed to create split receipt: ' + (result.error || 'Unknown error'));
        return;
      }

      // Use the 2 child receipts returned from backend
      const child1Receipt = result.data?.child1;  // Split portion (what user requested)
      const child2Receipt = result.data?.child2;  // Remaining portion (goes back to available)

      if (!child1Receipt || !child2Receipt) {
        console.error('❌ Invalid split response:', result);
        message.error('Split completed but failed to fetch child receipts. Please reload receipts manually.');
        return;
      }

      console.log('✅ Split response:', { 
        child1: { id: child1Receipt.transaction_id, receipt: child1Receipt.receipt_number, weight: child1Receipt.net_weight_kg },
        child2: { id: child2Receipt.transaction_id, receipt: child2Receipt.receipt_number, weight: child2Receipt.net_weight_kg }
      });

      // Update selected receipts: remove parent, add ONLY child1 (split portion)
      // Child2 (remaining) goes back to available receipts pool
      let updatedSelected = wizardData.selected_receipts.filter(
        r => r.transaction_id !== receiptToSplit.transaction_id
      );
      
      // Add only child1 (the split portion that user requested)
      updatedSelected.push(child1Receipt);

      setWizardData({
        ...wizardData,
        selected_receipts: updatedSelected
      });

      message.success(
        <span>
          Receipt split successfully! 
          Added <strong>{child1Receipt.receipt_number}</strong> ({child1Receipt.net_weight_kg} kg) to selection. 
          Remaining <strong>{child2Receipt.receipt_number}</strong> ({child2Receipt.net_weight_kg} kg) returned to available receipts.
        </span>
      );
      
      setSplitReceiptModal(false);
      
      // Reload available receipts to show updated weights
      console.log('🔄 Reloading receipts after split...');
      if (onReloadReceipts) {
        await onReloadReceipts();
        console.log('✅ Receipts reloaded successfully');
      } else {
        console.warn('⚠️ onReloadReceipts callback not provided');
      }
      
    } catch (error) {
      console.error('Error splitting receipt:', error);
      message.error('Failed to split receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleGrossWeightSubmit = (value) => {
    if (!value || value <= 0) {
      message.error('Please enter valid gross weight');
      return;
    }
    if (value <= session.tare_weight) {
      message.error('Gross weight must be greater than tare weight');
      return;
    }
    setWizardData({
      ...wizardData,
      gross_weight: value
    });
    moveToStep(1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete(wizardData);
    } catch (error) {
      console.error('Error completing sale:', error);
      message.error('Failed to complete sale');
    } finally {
      setLoading(false);
    }
  };

  const goToStep = (step) => {
    if (visitedSteps.includes(step)) {
      setCurrentStep(step);
    }
  };

  const moveToStep = (step) => {
    setCurrentStep(step);
    if (!visitedSteps.includes(step)) {
      setVisitedSteps([...visitedSteps, step]);
    }
  };

  const netWeight = wizardData.gross_weight 
    ? (wizardData.gross_weight - session.tare_weight).toFixed(2)
    : 0;
  
  const selectedTotalWeight = wizardData.selected_receipts.reduce((sum, r) => sum + parseFloat(r.net_weight_kg || 0), 0);
  
  const totalAmount = wizardData.price_per_kg && netWeight
    ? (netWeight * wizardData.price_per_kg).toFixed(2)
    : 0;

  const weightDifference = Math.abs(netWeight - selectedTotalWeight);

  const steps = [
    { title: 'Weight', icon: <span style={{ fontSize: 18 }}>⚖️</span> },
    { title: 'Manufacturer', icon: <UserOutlined /> },
    { title: 'Product', icon: <ShoppingOutlined /> },
    { title: 'Receipts', icon: <FileTextOutlined /> },
    { title: 'Review', icon: <CheckOutlined /> }
  ];

  const stageTitles = [
    'Enter Gross Weight',
    'Select Manufacturer (Buyer)',
    'Select Product Type',
    'Select Purchase Receipts',
    'Review & Confirm Sale'
  ];

  const currentStageTitle = stageTitles[currentStep] || '';

  const receiptColumns = [
    {
      title: t('salesWeighIn.receiptsTable.receipt'),
      dataIndex: 'receipt_number',
      key: 'receipt_number',
      width: 180,
      render: (text, record) => (
        <Space>
          <Tag color="blue">{text}</Tag>
          {record.parent_transaction_id && <Tag color="green">{t('salesWeighIn.wizard.splitChild')}</Tag>}
        </Space>
      )
    },
    {
      title: t('salesWeighIn.receiptsTable.date'),
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('en-GB')
    },
    {
      title: t('salesWeighIn.receiptsTable.farmer'),
      dataIndex: 'farmer_name',
      key: 'farmer_name'
    },
    {
      title: t('salesWeighIn.receiptsTable.netWeightKg'),
      dataIndex: 'net_weight_kg',
      key: 'net_weight_kg',
      width: 120,
      render: (weight) => `${parseFloat(weight).toFixed(2)} kg`
    }
  ];

  return (
    <Card 
      style={{ 
        background: '#fff7e6', 
        borderColor: '#faad14',
        minHeight: '500px'
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>
              🚛 Sales Weighing Out: <Tag color="orange">{session.vehicle_number}</Tag>
            </h2>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              Press <Tag>ENTER</Tag> to continue • <Tag>ESC</Tag> to go back • <Tag>TAB</Tag> to navigate
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
          gridTemplateColumns: '1fr 1.5fr 1fr 1.2fr',
          gap: 16,
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Tare (Empty)</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#faad14' }}>
              {session.tare_weight} kg
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Manufacturer</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: wizardData.manufacturer_name ? '#1890ff' : '#bfbfbf' }}>
              {wizardData.manufacturer_name || '—'}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Net Weight</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: netWeight > 0 ? '#1890ff' : '#bfbfbf' }}>
              {netWeight > 0 ? `${netWeight} kg` : '—'}
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{t('salesWeighIn.wizard.totalAmount')}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: totalAmount > 0 ? '#52c41a' : '#bfbfbf' }}>
              {totalAmount > 0 ? `RM ${parseFloat(totalAmount).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
            </div>
          </div>
        </div>
      </div>

      <Divider />

      {/* Stage Content */}
      <div style={{ minHeight: 300 }}>
        
        {/* Stage 0: Gross Weight Entry */}
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
                    Tare Weight (Empty)
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#faad14' }}>
                    {session.tare_weight} kg
                  </div>
                </div>
                
                <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '2px solid #faad14' }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
                    Gross Weight (Loaded)
                  </div>
                  <InputNumber
                    ref={grossWeightRef}
                    min={session.tare_weight + 0.01}
                    step={10}
                    style={{ width: '100%', fontSize: 24 }}
                    placeholder="0.00"
                    suffix="kg"
                    size="large"
                    value={wizardData.gross_weight}
                    onChange={(value) => setWizardData({ ...wizardData, gross_weight: value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && wizardData.gross_weight && wizardData.gross_weight > session.tare_weight) {
                        e.preventDefault();
                        handleGrossWeightSubmit(wizardData.gross_weight);
                      }
                    }}
                    autoFocus
                  />
                </div>

                <div style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                    Net Weight
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
                    {netWeight} kg
                  </div>
                </div>
              </div>
            </div>

            <Space size="large">
              <Button 
                type="primary" 
                size="large"
                onClick={() => handleGrossWeightSubmit(wizardData.gross_weight)}
                disabled={!wizardData.gross_weight || wizardData.gross_weight <= session.tare_weight}
              >
                Continue <ArrowRightOutlined /> <kbd style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: '3px' }}>ENTER</kbd>
              </Button>
            </Space>
          </div>
        )}

        {/* Stage 1: Manufacturer Selection */}
        {currentStep === 1 && (
          <div style={{ textAlign: 'center' }}>
            {wizardData.manufacturer_name ? (
              <div>
                <div style={{ 
                  background: '#fff', 
                  padding: 24, 
                  borderRadius: 8,
                  marginBottom: 16,
                  display: 'inline-block',
                  minWidth: 300
                }}>
                  <UserOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
                  <h2 style={{ margin: 0 }}>{wizardData.manufacturer_name}</h2>
                </div>
                <div>
                  <Space>
                    <Button onClick={() => setCurrentStep(0)}>
                      <ArrowLeftOutlined /> Back to Weight
                    </Button>
                    <Button onClick={openManufacturerSearch}>
                      Change Manufacturer
                    </Button>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={() => moveToStep(2)}
                    >
                      Continue <ArrowRightOutlined /> <kbd style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: '3px' }}>ENTER</kbd>
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
                  onClick={openManufacturerSearch}
                  autoFocus
                >
                  Search Manufacturer
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

        {/* Stage 2: Product Selection */}
        {currentStep === 2 && (
          <div style={{ textAlign: 'center' }}>
            {wizardData.product_name ? (
              <div>
                <div style={{ 
                  background: '#fff', 
                  padding: 24, 
                  borderRadius: 8,
                  marginBottom: 16,
                  display: 'inline-block',
                  minWidth: 300
                }}>
                  <ShoppingOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                  <h2 style={{ margin: 0 }}>{wizardData.product_name}</h2>
                </div>
                <div>
                  <Space>
                    <Button onClick={() => setCurrentStep(1)}>
                      <ArrowLeftOutlined /> Back to Manufacturer
                    </Button>
                    <Button onClick={openProductSearch}>
                      Change Product
                    </Button>
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={() => moveToStep(3)}
                    >
                      Continue <ArrowRightOutlined /> <kbd style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: '3px' }}>ENTER</kbd>
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
                  onClick={openProductSearch}
                  autoFocus
                >
                  Select Product
                </Button>
                <div style={{ marginTop: 24 }}>
                  <Button onClick={() => setCurrentStep(1)}>
                    <ArrowLeftOutlined /> Back to Manufacturer
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stage 3: Purchase Receipts Selection */}
        {currentStep === 3 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Alert
                message={t('salesWeighIn.wizard.selectPurchaseReceipts')}
                description={`${t('salesWeighIn.wizard.containerNetWeight')}: ${netWeight} kg | ${t('salesWeighIn.wizard.selectedReceiptsTotal')}: ${selectedTotalWeight.toFixed(2)} kg | ${t('salesWeighIn.wizard.difference')}: ${weightDifference.toFixed(2)} kg ${weightDifference > 0.5 ? '⚠️' : '✓'}`}
                type={weightDifference > 0.5 ? 'warning' : 'success'}
                showIcon
              />
            </div>

            {wizardData.selected_receipts.length > 0 ? (
              <div>
                <Table
                  dataSource={wizardData.selected_receipts}
                  columns={[
                    ...receiptColumns,
                    {
                      title: t('salesWeighIn.receiptsTable.action'),
                      key: 'action',
                      width: 150,
                      render: (_, record) => {
                        // Calculate if there's excess weight
                        const containerNetWeight = wizardData.gross_weight - session.tare_weight;
                        const selectedTotalWeight = wizardData.selected_receipts.reduce((sum, r) => sum + parseFloat(r.net_weight_kg || 0), 0);
                        const hasExcessWeight = selectedTotalWeight > containerNetWeight;
                        
                        return (
                          <Space size="small">
                            {hasExcessWeight && (
                              <Button 
                                size="small" 
                                icon={<ScissorOutlined />}
                                onClick={() => openSplitModal(record)}
                                title={t('salesWeighIn.wizard.splitThisReceipt')}
                              >
                                {t('salesWeighIn.wizard.split')}
                              </Button>
                            )}
                            <Button 
                              size="small" 
                              danger 
                              onClick={() => removeReceipt(record)}
                            >
                              {t('salesWeighIn.wizard.remove')}
                            </Button>
                          </Space>
                        );
                      }
                    }
                  ]}
                  pagination={false}
                  size="small"
                  rowKey="transaction_id"
                  rowClassName={(record) => {
                    // Only split children will have styling (split parents don't appear)
                    if (record.parent_transaction_id) {
                      return 'ant-table-row-split-child';
                    }
                    return '';
                  }}
                  summary={() => (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3}>
                          <strong>{t('salesWeighIn.receiptsTable.total')}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          <strong>{selectedTotalWeight.toFixed(2)} kg</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} />
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: '#999', marginBottom: 16 }}>No receipts selected</p>
                <p style={{ color: '#666', fontSize: 12 }}>
                  {availableReceipts.length === 0 
                    ? 'No purchase receipts available for this season. Complete purchase transactions first.'
                    : `${availableReceipts.length} receipts available. Click "Select Receipts" button below.`
                  }
                </p>
              </div>
            )}

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Space size="large">
                <Button size="large" onClick={() => setCurrentStep(2)}>
                  <ArrowLeftOutlined /> Back to Product
                </Button>
                <Button 
                  icon={<SearchOutlined />}
                  onClick={openReceiptSelection}
                  size="large"
                >
                  {wizardData.selected_receipts.length > 0 ? 'Modify Selection' : 'Select Receipts'}
                </Button>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => moveToStep(4)}
                  disabled={wizardData.selected_receipts.length === 0 || weightDifference > 0.5}
                >
                  Continue <ArrowRightOutlined /> <kbd style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: '3px' }}>ENTER</kbd>
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
                  gridTemplateColumns: '1.2fr 1fr 1fr',
                  gap: 24,
                }}
              >
                {/* Column 1: Vehicle / Manufacturer */}
                <div
                  style={{
                    borderRight: '1px solid #f0f0f0',
                    paddingRight: 16,
                  }}
                >
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#999', fontSize: 12 }}>Vehicle</div>
                    <div style={{ fontWeight: 600 }}>{session.vehicle_number}</div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#999', fontSize: 12 }}>Manufacturer</div>
                    <div style={{ fontWeight: 600 }}>{wizardData.manufacturer_name}</div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#999', fontSize: 12 }}>Product</div>
                    <div style={{ fontWeight: 600, color: '#52c41a' }}>{wizardData.product_name}</div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#999', fontSize: 12 }}>Driver</div>
                    <div>{wizardData.driver_name || '—'}</div>
                  </div>

                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>Purchase Receipts</div>
                    <div style={{ fontWeight: 600 }}>{wizardData.selected_receipts.length} receipts</div>
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
                    <div style={{ color: '#999', fontSize: 12 }}>Tare Weight</div>
                    <div>{session.tare_weight} kg</div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ color: '#999', fontSize: 12 }}>Gross Weight</div>
                    <div>{wizardData.gross_weight} kg</div>
                  </div>

                  <div>
                    <div style={{ color: '#999', fontSize: 12 }}>Net Weight</div>
                    <div style={{ color: '#52c41a', fontSize: 18, fontWeight: 600 }}>{netWeight} kg</div>
                  </div>
                </div>

                {/* Column 3: Pricing */}
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#999', fontSize: 12 }}>Price per KG</div>
                    <div>RM {wizardData.price_per_kg?.toFixed(2)}</div>
                  </div>

                  <div>
                    <div style={{ color: '#999', fontSize: 12, fontWeight: 600 }}>Total Amount</div>
                    <div style={{ fontWeight: 600, color: '#52c41a', fontSize: 24 }}>
                      RM {totalAmount}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Space size="large">
                <Button 
                  size="large"
                  onClick={() => setCurrentStep(3)}
                >
                  <ArrowLeftOutlined /> Edit Price
                </Button>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<CheckOutlined />}
                  onClick={handleComplete}
                  loading={loading}
                  autoFocus
                >
                  Complete Sale & Print Receipt <kbd style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: '3px' }}>ENTER</kbd>
                </Button>
              </Space>
            </div>
          </div>
        )}
      </div>

      {/* Manufacturer Search Modal */}
      <Modal
        title="Search Manufacturer"
        open={manufacturerSearchModal}
        onCancel={() => setManufacturerSearchModal(false)}
        footer={null}
        width={900}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Input
            size="large"
            placeholder="Search by company name or contact person..."
            prefix={<SearchOutlined />}
            value={manufacturerSearchText}
            onChange={(e) => {
              setManufacturerSearchText(e.target.value);
              searchManufacturers(e.target.value);
            }}
            autoFocus
            allowClear
          />

          {manufacturerSearchText.length > 0 && manufacturerSearchText.length < 2 && (
            <Alert
              message="Type at least 2 characters to search"
              type="info"
              showIcon
            />
          )}

          {manufacturerSearchText.length >= 2 && manufacturerOptions.length === 0 && (
            <Alert
              message="No manufacturers found"
              description="Try different search terms"
              type="warning"
              showIcon
            />
          )}

          {manufacturerOptions.length > 0 && (
            <>
              <Alert
                message={`Found ${manufacturerOptions.length} manufacturer(s)`}
                type="success"
                showIcon
              />
              
              <Table
                dataSource={manufacturerOptions}
                rowKey="manufacturer_id"
                pagination={false}
                size="small"
                scroll={{ y: 400 }}
                onRow={(record) => ({
                  onClick: () => selectManufacturer(record),
                  onDoubleClick: () => selectManufacturer(record),
                  onKeyDown: (e) => {
                    if (e.key === 'Enter') {
                      selectManufacturer(record);
                    }
                  },
                  style: { cursor: 'pointer' },
                  tabIndex: 0
                })}
                columns={[
                  {
                    title: 'Company Name',
                    dataIndex: 'company_name',
                    key: 'company_name',
                    render: (text) => <strong>{text}</strong>
                  },
                  {
                    title: 'Contact Person',
                    dataIndex: 'contact_person',
                    key: 'contact_person'
                  },
                  {
                    title: 'Phone',
                    dataIndex: 'phone',
                    key: 'phone',
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
                        onClick={() => selectManufacturer(record)}
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

      {/* Product Search Modal */}
      <Modal
        title="Select Product Type"
        open={productSearchModal}
        onCancel={() => setProductSearchModal(false)}
        footer={null}
        width={700}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Input
            size="large"
            placeholder="Search by product name or code..."
            prefix={<SearchOutlined />}
            value={productSearchText}
            onChange={(e) => setProductSearchText(e.target.value)}
            autoFocus
            allowClear
          />

          <Alert
            message={`Showing ${searchProducts(productSearchText).length} product(s)`}
            type="info"
            showIcon
          />
          
          <Table
            dataSource={searchProducts(productSearchText)}
            rowKey="product_id"
            pagination={false}
            size="small"
            scroll={{ y: 400 }}
            onRow={(record) => ({
              onClick: () => selectProduct(record),
              onDoubleClick: () => selectProduct(record),
              onKeyDown: (e) => {
                if (e.key === 'Enter') {
                  selectProduct(record);
                }
              },
              style: { cursor: 'pointer' },
              tabIndex: 0
            })}
            columns={[
              {
                title: 'Product Code',
                dataIndex: 'product_code',
                key: 'product_code',
                width: 150,
                render: (text) => <Tag color="blue">{text}</Tag>
              },
              {
                title: 'Product Name',
                dataIndex: 'product_name',
                key: 'product_name',
                render: (text) => <strong>{text}</strong>
              },
              {
                title: 'Type',
                dataIndex: 'product_type',
                key: 'product_type',
                width: 100,
                render: (text) => <Tag color="green">{text}</Tag>
              },
              {
                title: 'Action',
                key: 'action',
                width: 100,
                render: (_, record) => (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => selectProduct(record)}
                  >
                    Select
                  </Button>
                )
              }
            ]}
          />
        </Space>
      </Modal>

      {/* Receipt Selection Modal */}
      <Modal
        title={
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Select Purchase Receipts</div>
            <div style={{ fontSize: 12, color: '#999', fontWeight: 400, marginTop: 4 }}>
              ✓ Check multiple receipts • Click "Done" when finished
            </div>
          </div>
        }
        open={receiptSelectionModal}
        onCancel={() => setReceiptSelectionModal(false)}
        width={1000}
        footer={[
          <div key="footer-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <span style={{ fontSize: 13, color: '#666' }}>
                Selected: <strong>{wizardData.selected_receipts.length}</strong> receipts • 
                Total: <strong>{selectedTotalWeight.toFixed(2)} kg</strong>
              </span>
            </div>
            <div>
              <Button key="cancel" onClick={() => setReceiptSelectionModal(false)} style={{ marginRight: 8 }}>
                Cancel
              </Button>
              <Button 
                key="confirm" 
                type="primary" 
                onClick={() => setReceiptSelectionModal(false)}
                disabled={wizardData.selected_receipts.length === 0}
              >
                Done ({wizardData.selected_receipts.length} selected)
              </Button>
            </div>
          </div>
        ]}
      >
        <Alert
          message={
            <div>
              <strong>Target Net Weight:</strong> {netWeight} kg • 
              <strong style={{ marginLeft: 8 }}>Currently Selected:</strong> {selectedTotalWeight.toFixed(2)} kg • 
              <strong style={{ marginLeft: 8 }}>Difference:</strong> <span style={{ color: Math.abs(netWeight - selectedTotalWeight) > 0.5 ? '#ff4d4f' : '#52c41a' }}>
                {(netWeight - selectedTotalWeight).toFixed(2)} kg
              </span>
            </div>
          }
          type={Math.abs(netWeight - selectedTotalWeight) > 0.5 ? 'warning' : 'success'}
          showIcon
          style={{ marginBottom: 16 }}
        />

        {(() => {
          // Filter receipts by selected product_id
          const filteredReceipts = wizardData.product_id
            ? availableReceipts.filter(r => r.product_id === wizardData.product_id)
            : availableReceipts;
          
          return filteredReceipts.length > 0 && (
            <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button 
                size="small" 
                onClick={() => handleReceiptSelection(filteredReceipts)}
                disabled={wizardData.selected_receipts.length === filteredReceipts.length || selectedTotalWeight >= netWeight}
                title={selectedTotalWeight >= netWeight ? 'Target weight already met' : 'Select all available receipts'}
              >
                Select All ({filteredReceipts.length})
              </Button>
            <Button 
              size="small" 
              onClick={() => handleReceiptSelection([])}
              disabled={wizardData.selected_receipts.length === 0}
              danger
            >
              Clear All
            </Button>
            {selectedTotalWeight >= netWeight && wizardData.selected_receipts.length < filteredReceipts.length && (
              <span style={{ fontSize: 12, color: '#52c41a', marginLeft: 8 }}>
                ✓ Target weight reached
              </span>
            )}
          </div>
          );
        })()}

        {(() => {
          const filteredReceipts = wizardData.product_id
            ? availableReceipts.filter(r => r.product_id === wizardData.product_id)
            : availableReceipts;
          
          return filteredReceipts.some(r => r.parent_transaction_id) && (
          <Alert
            message={
              <div>
                <strong>💡 Priority Selection:</strong> Split child receipts appear first and are highlighted in 
                <span style={{ backgroundColor: '#f6ffed', padding: '2px 6px', marginLeft: 4, marginRight: 4, borderRadius: 2, borderLeft: '3px solid #52c41a' }}>
                  Green
                </span>
                - These are portions from split receipts. Select these first for optimal weight matching.
              </div>
            }
            type="info"
            showIcon
            closable
            style={{ marginBottom: 12 }}
          />
          );
        })()}
        
        {(() => {
          const filteredReceipts = wizardData.product_id
            ? availableReceipts.filter(r => r.product_id === wizardData.product_id)
            : availableReceipts;
          
          return filteredReceipts.length === 0 ? (
          <Alert
            message="No Purchase Receipts Available"
            description="There are no unsold purchase receipts available for this season. Please ensure you have completed purchase transactions first."
            type="warning"
            showIcon
          />
        ) : (
          <Table
            dataSource={[...filteredReceipts].sort((a, b) => {
              // Priority 1: Split children first (have parent_transaction_id)
              if (a.parent_transaction_id && !b.parent_transaction_id) return -1;
              if (!a.parent_transaction_id && b.parent_transaction_id) return 1;
              
              // Priority 2: Keep original order (by date DESC from backend)
              return 0;
            })}
            columns={receiptColumns}
            rowKey="transaction_id"
            pagination={{ pageSize: 10 }}
            size="small"
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: wizardData.selected_receipts.map(r => r.transaction_id),
              onChange: (selectedRowKeys, selectedRows) => {
                handleReceiptSelection(selectedRows);
              },
              getCheckboxProps: (record) => {
                const isSelected = wizardData.selected_receipts.some(r => r.transaction_id === record.transaction_id);
                const targetMet = selectedTotalWeight >= netWeight;
                
                return {
                  name: record.receipt_number,
                  // Disable checkbox if target is met and this row is not already selected
                  disabled: !isSelected && targetMet
                };
              }
            }}
            rowClassName={(record) => {
              const isSelected = wizardData.selected_receipts.some(r => r.transaction_id === record.transaction_id);
              const targetMet = selectedTotalWeight >= netWeight;
              
              let classes = [];
              
              // Split child styling (priority) - split parents don't appear in list
              if (record.parent_transaction_id) {
                classes.push('ant-table-row-split-child');
              }
              
              // Selection/disabled state
              if (isSelected) {
                classes.push('ant-table-row-selected');
              } else if (targetMet) {
                classes.push('ant-table-row-disabled');
              }
              
              return classes.join(' ');
            }}
            onRow={(record) => ({
              onClick: (event) => {
                // Don't toggle if clicking the checkbox itself
                if (event.target.closest('.ant-table-selection-column')) {
                  return;
                }
                
                const isSelected = wizardData.selected_receipts.some(r => r.transaction_id === record.transaction_id);
                const targetMet = selectedTotalWeight >= netWeight;
                
                if (isSelected) {
                  // Always allow deselection
                  handleReceiptSelection(wizardData.selected_receipts.filter(r => r.transaction_id !== record.transaction_id));
                } else if (!targetMet) {
                  // Only allow selection if target not yet met
                  handleReceiptSelection([...wizardData.selected_receipts, record]);
                } else {
                  // Target met, show message
                  message.warning('Target weight already met. Deselect receipts to make room for others.');
                }
              },
              style: { cursor: !wizardData.selected_receipts.some(r => r.transaction_id === record.transaction_id) && selectedTotalWeight >= netWeight ? 'not-allowed' : 'pointer' }
            })}
          />
        );
        })()}
      </Modal>

      {/* Split Receipt Modal */}
      <Modal
        title={
          <div>
            <ScissorOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Split Purchase Receipt
          </div>
        }
        open={splitReceiptModal}
        onCancel={() => setSplitReceiptModal(false)}
        footer={null}
        width={600}
      >
        {receiptToSplit && (
          <Form
            form={splitForm}
            layout="vertical"
            onFinish={confirmSplitReceipt}
          >
            <Alert
              message="Split Receipt Information"
              description={
                <div>
                  <div><strong>Receipt:</strong> {receiptToSplit.receipt_number}</div>
                  <div><strong>Farmer:</strong> {receiptToSplit.farmer_name}</div>
                  <div><strong>Available Net Weight:</strong> {parseFloat(receiptToSplit.net_weight_kg).toFixed(2)} kg (Paddy only)</div>
                  <div style={{ marginTop: 8, color: '#666' }}>
                    <strong>Note:</strong> Split is based on <strong>Net Weight</strong> (paddy weight only). 
                    Two new receipts will be created with gross_weight = net_weight and tare_weight = 0, 
                    since we're splitting already-weighed paddy quantities.
                  </div>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item name="weight_needed" hidden>
              <InputNumber />
            </Form.Item>
            
            <Form.Item name="original_net_weight" hidden>
              <InputNumber />
            </Form.Item>

            <Card 
              size="small" 
              style={{ 
                marginBottom: 16, 
                background: '#e6f7ff', 
                borderColor: '#1890ff' 
              }}
            >
              <div style={{ marginBottom: 8, fontWeight: 500, color: '#1890ff' }}>
                📊 Calculated Split Preview
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '4px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Split Portion (To Buyer)
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                      {(() => {
                        const val = splitForm.getFieldValue('split_weight');
                        const num = parseFloat(val);
                        return !isNaN(num) && num !== null && num !== undefined 
                          ? num.toFixed(2) 
                          : '0.00';
                      })()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>kg (Net)</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'white', borderRadius: '4px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Remaining (Future Sales)
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                      {(() => {
                        const val = splitForm.getFieldValue('remaining_weight');
                        const num = parseFloat(val);
                        return !isNaN(num) && num !== null && num !== undefined 
                          ? num.toFixed(2) 
                          : '0.00';
                      })()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>kg (Net)</div>
                  </div>
                </Col>
              </Row>
            </Card>

            <Form.Item
              label="Split Net Weight (Paddy weight to split)"
              name="split_weight"
              rules={[
                { required: true, message: 'Split net weight is required' }
              ]}
              extra={
                <span style={{ color: '#52c41a' }}>
                  ✓ Auto-calculated based on weight needed to match truck capacity
                </span>
              }
            >
              <InputNumber
                readOnly
                disabled
                style={{ 
                  width: '100%', 
                  fontWeight: 600, 
                  fontSize: '18px',
                  color: '#1890ff'
                }}
                addonAfter="kg (Net)"
                size="large"
                precision={2}
              />
            </Form.Item>

            <Form.Item
              label="Remaining Net Weight (Available for future sales)"
              name="remaining_weight"
            >
              <InputNumber
                readOnly
                disabled
                style={{ 
                  width: '100%',
                  fontWeight: 500,
                  fontSize: '16px'
                }}
                addonAfter="kg (Net)"
                size="large"
                precision={2}
              />
            </Form.Item>

            <Divider />

            <Alert
              message="📐 Auto-Calculated Split - No Manual Entry Required"
              description={
                <div>
                  <p style={{ marginBottom: 8 }}>
                    <strong>✓ Weights calculated automatically</strong> based on truck capacity to eliminate human error
                  </p>
                  <ul style={{ marginBottom: 8, paddingLeft: 20 }}>
                    <li><strong>Split portion:</strong> Goes to buyer (this sale)</li>
                    <li><strong>Remaining portion:</strong> Stays available for future sales</li>
                  </ul>
                  <p style={{ marginBottom: 0, fontSize: '12px', color: '#666' }}>
                    Both portions inherit proportional quality metrics (moisture, foreign matter, penalties, bonuses)
                  </p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setSplitReceiptModal(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={loading} icon={<ScissorOutlined />}>
                  Confirm Split
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Card>
  );
};

export default SalesWeighOutWizard;
