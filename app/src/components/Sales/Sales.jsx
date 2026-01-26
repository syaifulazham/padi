import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Input, InputNumber, Button, Space, Row, Col, message, Modal, Statistic, Alert, Tag, Table, Divider } from 'antd';
import { PlusOutlined, ClockCircleOutlined, TruckOutlined, SearchOutlined, SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import SalesWeighOutWizard from './SalesWeighOutWizard';
import { useI18n } from '../../i18n/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';

const STORAGE_KEY = 'paddy_sales_weight_in_sessions';

const Sales = () => {
  const { t } = useI18n();
  const { user } = useAuth();
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
  const [selectedContainerIndex, setSelectedContainerIndex] = useState(0);
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
      message.error(t('salesWeighIn.messages.saveToStorageFailed'));
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

  // Keyboard navigation for recall modal
  useEffect(() => {
    if (!recallModalOpen) return;

    const handleRecallKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedContainerIndex((prev) => 
          prev > 0 ? prev - 1 : seasonPendingSessions.length - 1
        );
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedContainerIndex((prev) => 
          prev < seasonPendingSessions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (seasonPendingSessions[selectedContainerIndex]) {
          recallContainer(seasonPendingSessions[selectedContainerIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleRecallKeyDown);
    return () => document.removeEventListener('keydown', handleRecallKeyDown);
  }, [recallModalOpen, selectedContainerIndex, seasonPendingSessions]);

  const loadActiveSeason = async () => {
    try {
      const result = await window.electronAPI.seasons?.getActive();
      if (result?.success && result.data) {
        setActiveSeason(result.data);
        console.log('✅ Active season loaded for sales:', result.data);
      } else {
        message.warning(t('salesWeighIn.messages.noActiveSeasonFound'));
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
    message.success(`${t('salesWeighIn.messages.selectedPrefix')} ${manufacturer.company_name}`);
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
      message.error(t('salesWeighIn.messages.noActiveSeasonActivateInSettings'));
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
        {t('salesWeighIn.messages.weighInRecordedPrefix')} <strong>{currentContainer}</strong>: {values.tare_weight} {t('salesWeighIn.misc.kg')}
        <br />
        <small>{t('salesWeighIn.messages.dataSavedSafeFromRefresh')}</small>
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
      message.warning(t('salesWeighIn.messages.noPendingContainersForSeason'));
      return;
    }
    setSelectedContainerIndex(0);
    setRecallModalOpen(true);
  };

  const recallContainer = async (session) => {
    setRecallModalOpen(false);
    setSelectedManufacturer(null);
    setSelectedReceipts([]);
    finalForm.resetFields();
    finalForm.setFieldsValue({ price_per_kg: 3.00 });
    
    // Load available receipts before showing wizard
    message.loading(t('salesWeighIn.messages.loadingAvailableReceipts'), 0);
    await loadAvailableReceipts();
    message.destroy();
    
    setActiveSession(session);
  };

  const loadAvailableReceipts = async () => {
    if (!activeSeason) {
      console.error('❌ No active season found');
      message.warning(t('salesWeighIn.messages.noActiveSeasonFoundSimple'));
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 Loading receipts for season:', activeSeason.season_id);
      console.log('🔍 Active Season:', activeSeason);
      const result = await window.electronAPI.purchases?.getUnsold(activeSeason.season_id);
      console.log('📦 Backend Response:', result);
      if (result?.success) {
        setAvailableReceipts(result.data || []);
        console.log('✅ Loaded receipts:', result.data?.length || 0);
        console.log('📋 Receipt details:', result.data);
      } else {
        console.error('❌ Failed to load receipts:', result?.error);
        message.error(`${t('salesWeighIn.messages.failedToLoadAvailableReceiptsPrefix')}${result?.error || t('salesWeighIn.messages.unknownError')}`);
      }
    } catch (error) {
      console.error('❌ Exception loading receipts:', error);
      message.error(t('salesWeighIn.messages.failedToLoadAvailableReceipts'));
    } finally {
      setLoading(false);
    }
  };

  const openReceiptSelectionModal = async () => {
    const grossWeight = finalForm.getFieldValue('gross_weight');
    if (!grossWeight || grossWeight <= 0) {
      message.warning(t('salesWeighIn.messages.pleaseEnterGrossWeightFirst'));
      return;
    }
    if (!activeSession) {
      message.warning(t('salesWeighIn.messages.noActiveSession'));
      return;
    }
    
    // Load fresh receipts from active season
    await loadAvailableReceipts();
    setReceiptSelectionModal(true);
  };

  const handleReceiptSelection = (selectedRowKeys, selectedRows) => {
    // Auto-split logic when selecting receipts
    const grossWeight = finalForm.getFieldValue('gross_weight');
    const tareWeight = activeSession?.tare_weight || 0;
    const containerNetWeight = grossWeight && tareWeight ? grossWeight - tareWeight : 0;
    
    if (!containerNetWeight || containerNetWeight <= 0) {
      setSelectedReceipts(selectedRows);
      return;
    }
    
    // Calculate current total of already selected receipts (before adding new ones)
    const currentSelectedIds = selectedReceipts.map(r => r.transaction_id);
    const newlySelectedRows = selectedRows.filter(r => !currentSelectedIds.includes(r.transaction_id));
    const deselectedRows = selectedReceipts.filter(r => !selectedRowKeys.includes(r.transaction_id));
    
    // If nothing new was selected, just update the selection
    if (newlySelectedRows.length === 0) {
      setSelectedReceipts(selectedRows.filter(r => !deselectedRows.some(d => d.transaction_id === r.transaction_id)));
      return;
    }
    
    // Calculate running total as we add receipts
    let runningTotal = selectedReceipts.reduce((sum, r) => sum + parseFloat(r.net_weight_kg || 0), 0);
    const processedReceipts = [...selectedReceipts];
    
    for (const newReceipt of newlySelectedRows) {
      const receiptWeight = parseFloat(newReceipt.net_weight_kg || 0);
      const remainingCapacity = containerNetWeight - runningTotal;
      
      if (remainingCapacity <= 0) {
        // Container is already full, don't add more
        message.warning(
          t('salesWeighIn.messages.containerFullCannotAddMoreReceipts', `Container is full (${containerNetWeight.toFixed(2)} kg). Cannot add more receipts.`)
            .replace('{weight}', containerNetWeight.toFixed(2))
        );
        break;
      }
      
      if (receiptWeight <= remainingCapacity) {
        // Receipt fits completely
        processedReceipts.push(newReceipt);
        runningTotal += receiptWeight;
      } else {
        // Receipt exceeds remaining capacity - AUTO SPLIT
        const splitWeight = Math.round(remainingCapacity * 100) / 100;
        const remainingWeight = Math.round((receiptWeight - remainingCapacity) * 100) / 100;
        
        // Create split portion (goes to buyer)
        const splitReceipt = {
          ...newReceipt,
          receipt_number: `${newReceipt.receipt_number}-SPLIT`,
          net_weight_kg: splitWeight,
          is_split: true,
          original_receipt: newReceipt.receipt_number,
          split_remaining_weight: remainingWeight
        };
        
        processedReceipts.push(splitReceipt);
        runningTotal += splitWeight;
        
        message.info(
          <span>
            {t('salesWeighIn.messages.autoSplitPrefix')} <strong>{newReceipt.receipt_number}</strong><br/>
            {t('salesWeighIn.messages.autoSplitToBuyerLabel')} <strong>{splitWeight} {t('salesWeighIn.misc.kg')}</strong><br/>
            {t('salesWeighIn.messages.autoSplitRemainingLabel')} <strong>{remainingWeight} {t('salesWeighIn.misc.kg')}</strong> {t('salesWeighIn.messages.autoSplitRemainingSuffix')}
          </span>,
          5
        );
        
        // Container is now full, stop processing more receipts
        break;
      }
    }
    
    setSelectedReceipts(processedReceipts);
  };

  const confirmReceiptSelection = () => {
    if (selectedReceipts.length === 0) {
      message.warning(t('salesWeighIn.messages.pleaseSelectAtLeastOneReceipt'));
      return;
    }
    
    const totalWeight = selectedReceipts.reduce((sum, r) => sum + parseFloat(r.net_weight_kg || 0), 0);
    const grossWeight = finalForm.getFieldValue('gross_weight');
    const tareWeight = activeSession?.tare_weight || 0;
    const containerNetWeight = grossWeight && tareWeight ? grossWeight - tareWeight : 0;
    
    // Validate that total weight meets or exceeds container weight
    if (totalWeight < containerNetWeight) {
      const shortage = containerNetWeight - totalWeight;
      message.error(
        t(
          'salesWeighIn.messages.insufficientReceiptWeight',
          `Insufficient weight! Selected receipts total ${totalWeight.toFixed(2)} kg, but container load is ${containerNetWeight.toFixed(2)} kg. Please select ${shortage.toFixed(2)} kg more.`
        )
          .replace('{selected}', totalWeight.toFixed(2))
          .replace('{required}', containerNetWeight.toFixed(2))
          .replace('{shortage}', shortage.toFixed(2))
      );
      return;
    }
    
    setReceiptSelectionModal(false);
    
    if (Math.abs(totalWeight - containerNetWeight) < 0.01) {
      message.success(
        t(
          'salesWeighIn.messages.perfectMatchSelectedReceipts',
          `✅ Perfect match! Selected ${selectedReceipts.length} receipt(s) totaling ${totalWeight.toFixed(2)} kg`
        )
          .replace('{count}', selectedReceipts.length)
          .replace('{weight}', totalWeight.toFixed(2))
      );
    } else {
      message.success(
        t(
          'salesWeighIn.messages.selectedReceiptsTotaling',
          `Selected ${selectedReceipts.length} receipt(s) totaling ${totalWeight.toFixed(2)} kg`
        )
          .replace('{count}', selectedReceipts.length)
          .replace('{weight}', totalWeight.toFixed(2))
      );
    }
  };

  const removeSelectedReceipt = (receipt) => {
    setSelectedReceipts(selectedReceipts.filter(r => r !== receipt));
    message.info(t('salesWeighIn.messages.receiptRemovedFromSelection'));
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
      message.error(t('salesWeighIn.messages.splitWeightInvalid'));
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
          {t('salesWeighIn.messages.receiptSplitKeepingInSalePrefix')} <strong>{values.split_weight} {t('salesWeighIn.misc.kg')}</strong> {t('salesWeighIn.messages.receiptSplitKeepingInSaleMiddle')}
          <strong>{values.remaining_weight} {t('salesWeighIn.misc.kg')}</strong> {t('salesWeighIn.messages.receiptSplitRemovedExcessSuffix')}
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
          {t('salesWeighIn.messages.receiptSplitAddedToSalePrefix')} <strong>{values.split_weight} {t('salesWeighIn.misc.kg')}</strong> {t('salesWeighIn.messages.receiptSplitAddedToSaleMiddle')}
          <strong>{values.remaining_weight} {t('salesWeighIn.misc.kg')}</strong> {t('salesWeighIn.messages.receiptSplitStaysInOriginalSuffix')}
        </span>
      );
    }

    setSelectedReceipts(updatedSelected);
    setSplitReceiptModal(false);
  };

  const selectedTotalWeight = selectedReceipts.reduce((sum, r) => sum + parseFloat(r.net_weight_kg || 0), 0);

  // Handler for wizard completion
  const handleWizardComplete = async (wizardData) => {
    if (!activeSession || !activeSeason) {
      message.error(t('salesWeighIn.messages.invalidSessionOrSeason'));
      return;
    }

    try {
      setLoading(true);

      // Calculate net weight
      const netWeight = parseFloat(wizardData.gross_weight) - parseFloat(activeSession.tare_weight);
      
      console.log('🔢 Sales Wizard Data:');
      console.log('  - Gross Weight:', wizardData.gross_weight);
      console.log('  - Tare Weight:', activeSession.tare_weight);
      console.log('  - Net Weight:', netWeight);
      console.log('  - Product ID:', wizardData.product_id);
      console.log('  - Product Name:', wizardData.product_name);
      console.log('  - Price per kg:', wizardData.price_per_kg);
      console.log('  - Selected Receipts:', wizardData.selected_receipts.length);
      
      // Prepare sale data
      const saleData = {
        season_id: activeSeason.season_id,
        product_id: wizardData.product_id,
        manufacturer_id: wizardData.manufacturer_id,
        gross_weight_kg: parseFloat(wizardData.gross_weight),
        tare_weight_kg: parseFloat(activeSession.tare_weight),
        net_weight_kg: parseFloat(netWeight),
        base_price_per_kg: parseFloat(wizardData.price_per_kg),
        vehicle_number: activeSession.vehicle_number,
        driver_name: wizardData.driver_name || null,
        purchase_receipts: wizardData.selected_receipts.map(r => ({
          transaction_id: r.transaction_id,
          receipt_number: r.receipt_number,
          net_weight_kg: r.net_weight_kg
        })),
        created_by: user?.user_id
      };

      console.log('📤 Sending to Backend:', saleData);

      // Save sale
      const result = await window.electronAPI.sales?.create(saleData);
      
      if (result?.success) {
        message.success(
          <span>
            {t('salesWeighIn.messages.saleCompletedReceiptPrefix')} <strong>{result.data.receipt_number}</strong>
            <br />
            <small>{t('salesWeighIn.messages.weightInRecordRemovedFromStorage')}</small>
          </span>, 5
        );
        
        // Print sales receipt
        console.log('🖨️  Printing sales receipt for sales ID:', result.data.sales_id);
        try {
          const printResult = await window.electronAPI.printer?.salesReceipt(result.data.sales_id);
          if (printResult?.success) {
            if (printResult.mode === 'pdf') {
              message.success(
                <span>
                  {t('salesWeighIn.messages.salesReceiptSavedAsPdfPrefix')} <strong>{printResult.filename}</strong>
                  <br />
                  <small>{t('salesWeighIn.messages.locationPrefix')} {printResult.path}</small>
                </span>,
                6
              );
              console.log('✅ Sales receipt saved as PDF:', printResult.path);
            } else {
              console.log('✅ Sales receipt printed successfully');
            }
          } else {
            console.error('Print failed:', printResult?.error);
            message.warning(t('salesWeighIn.messages.saleCompletedButPrintingFailed'));
          }
        } catch (printError) {
          console.error('Print error:', printError);
          message.warning(t('salesWeighIn.messages.saleCompletedButPrintingFailed'));
        }
        
        setPendingSessions(pendingSessions.filter(s => s.vehicle_number !== activeSession.vehicle_number));
        setActiveSession(null);
        setSelectedManufacturer(null);
        setSelectedReceipts([]);
        finalForm.resetFields();
        
        // Trigger navbar stats refresh
        console.log('✅ Sale completed, dispatching transaction-completed event');
        window.dispatchEvent(new Event('transaction-completed'));
      } else {
        message.error(`${t('salesWeighIn.messages.failedToSaveSalePrefix')}${result?.error || t('salesWeighIn.messages.unknownError')}`);
      }
    } catch (error) {
      message.error(t('salesWeighIn.messages.failedToCompleteSale'));
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
      title: t('salesWeighIn.receiptsTable.receipt'),
      dataIndex: 'receipt_number',
      key: 'receipt_number',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: t('salesWeighIn.receiptsTable.date'),
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-'
    },
    {
      title: t('salesWeighIn.receiptsTable.farmer'),
      dataIndex: 'farmer_name',
      key: 'farmer_name',
    },
    {
      title: t('salesWeighIn.receiptsTable.netWeightKg'),
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
                  {t('salesWeighIn.quickStats.pendingContainersTitle')}
                  <Tag color="green" style={{ marginLeft: 8, fontSize: '10px' }}>{t('salesWeighIn.quickStats.autoSaveTag')}</Tag>
                </span>
              }
              value={seasonPendingSessions.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
              {t('salesWeighIn.quickStats.recordsSafeHint')}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title={t('salesWeighIn.quickStats.activeSessionTitle')}
              value={activeSession ? `${activeSession.vehicle_number}` : t('salesWeighIn.quickStats.noneValue')}
              valueStyle={{ color: activeSession ? '#52c41a' : '#d9d9d9' }}
            />
          </Card>
        </Col>
      </Row>

      {weightInMode && (
        <Card style={{ marginBottom: 16, background: '#fffbe6', borderColor: '#faad14' }}>
          <Alert
            message={`${t('salesWeighIn.weightInPanel.titlePrefix')} ${currentContainer}`}
            description={t('salesWeighIn.weightInPanel.description')}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form form={weightForm} layout="vertical" onFinish={handleWeightIn}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="tare_weight"
                  label={t('salesWeighIn.weightInPanel.fields.tareWeightLabel')}
                  rules={[{ required: true, message: t('salesWeighIn.weightInPanel.validations.tareWeightRequired') }]}
                >
                  <InputNumber
                    min={0}
                    step={0.01}
                    style={{ width: '100%', fontSize: '24px' }}
                    placeholder={t('salesWeighIn.weightInPanel.placeholders.tareWeight')}
                    size="large"
                    autoFocus
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Space>
                <Button size="large" onClick={cancelWeightIn}>{t('salesWeighIn.actions.cancel')}</Button>
                <Button type="primary" size="large" htmlType="submit" icon={<SaveOutlined />}>{t('salesWeighIn.actions.saveTareWeight')}</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      {activeSession && (
        <SalesWeighOutWizard
          session={activeSession}
          manufacturers={manufacturers}
          availableReceipts={availableReceipts}
          activeSeason={activeSeason}
          onComplete={handleWizardComplete}
          onCancel={cancelWeighOut}
          onReloadReceipts={loadAvailableReceipts}
        />
      )}

      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={startNewSale}
                disabled={weightInMode || activeSession}
                title={t('salesWeighIn.actions.pressF3ToStartTitle')}
              >
                {t('salesWeighIn.actions.newSaleWeighInTare')}
                <kbd style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: '3px' }}>F3</kbd>
              </Button>
              <Button
                size="large"
                icon={<ClockCircleOutlined />}
                onClick={showRecallModal}
                disabled={seasonPendingSessions.length === 0 || weightInMode || activeSession}
                title={t('salesWeighIn.actions.pressF2ToOpenTitle')}
              >
                {t('salesWeighIn.actions.recallContainer', `Recall Container (${seasonPendingSessions.length})`).replace('{count}', seasonPendingSessions.length)}
                <kbd style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: '3px' }}>F2</kbd>
              </Button>
            </Space>
          </Col>
        </Row>
        <Alert
          type="info"
          message={t('salesWeighIn.workflow.title')}
          description={t('salesWeighIn.workflow.description')}
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      <Modal 
        title={t('salesWeighIn.containerModal.title')}
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
          <Form.Item
            name="vehicle_number"
            label={t('salesWeighIn.containerModal.fields.vehicleRegistrationNumber')}
            rules={[{ required: true, message: t('salesWeighIn.containerModal.validations.vehicleRegistrationRequired') }]}
            normalize={(value) => value?.toUpperCase()}
          >
            <Input 
              ref={containerInputRef}
              placeholder={t('salesWeighIn.containerModal.placeholders.vehicleRegistrationExample')} 
              size="large" 
              autoFocus 
              style={{ fontSize: '20px', textTransform: 'uppercase' }} 
            />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setContainerModalOpen(false)}>{t('salesWeighIn.actions.cancel')}</Button>
              <Button type="primary" htmlType="submit" size="large">{t('salesWeighIn.containerModal.actions.okNextWeighInTare')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <span>
            {t('salesWeighIn.recallModal.title')}
            <kbd style={{ marginLeft: '12px', fontSize: '11px', padding: '3px 8px', background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: '3px' }}>F2</kbd>
          </span>
        }
        open={recallModalOpen}
        onCancel={() => setRecallModalOpen(false)}
        footer={null}
        width={700}
      >
        <Alert
          message={t('salesWeighIn.recallModal.alert.message')}
          description={t('salesWeighIn.recallModal.alert.description')}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {seasonPendingSessions.map((session, index) => (
            <Button 
              key={index} 
              size="large" 
              type={selectedContainerIndex === index ? 'primary' : 'default'}
              style={{ 
                height: '100px', 
                display: 'flex', 
                flexDirection: 'row', 
                justifyContent: 'flex-start', 
                alignItems: 'center', 
                padding: '16px', 
                textAlign: 'left',
                border: selectedContainerIndex === index ? '2px solid #1890ff' : undefined,
                boxShadow: selectedContainerIndex === index ? '0 0 8px rgba(24, 144, 255, 0.5)' : undefined
              }} 
              onClick={() => recallContainer(session)}
            >
              <TruckOutlined style={{ fontSize: '32px', marginRight: '16px' }} />
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{session.vehicle_number}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{t('salesWeighIn.recallModal.containerCard.tareLabel')} {session.tare_weight} {t('salesWeighIn.misc.kg')}</div>
                <div style={{ fontSize: '10px', color: '#999' }}>{dayjs(session.timestamp).format('HH:mm:ss')}</div>
              </div>
            </Button>
          ))}
        </div>
      </Modal>

    </div>
  );
};

export default Sales;
