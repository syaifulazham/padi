import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, InputNumber, 
  Select, DatePicker, Space, message, Tag, Tooltip, Row, Col, 
  Divider, Alert, Radio, List 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, EyeOutlined, 
  PlayCircleOutlined, StopOutlined, SettingOutlined,
  MinusCircleOutlined, CheckCircleOutlined, DollarOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import SeasonProductPriceModal from './SeasonProductPriceModal';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const SeasonConfig = () => {
  const [seasons, setSeasons] = useState([]);
  const [seasonTypes, setSeasonTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [form] = Form.useForm();
  
  // Passcode confirmation for activation
  const [activationModalVisible, setActivationModalVisible] = useState(false);
  const [generatedPasscode, setGeneratedPasscode] = useState('');
  const [seasonToActivate, setSeasonToActivate] = useState(null);
  const [passcodeForm] = Form.useForm();
  
  // Product price modal
  const [productPriceModalVisible, setProductPriceModalVisible] = useState(false);
  const [priceModalMode, setPriceModalMode] = useState('view'); // 'view' or 'edit'
  const [selectedSeasonForPrice, setSelectedSeasonForPrice] = useState(null);
  
  // Generate random 6-character passcode
  const generatePasscode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars like I,1,O,0
    let passcode = '';
    for (let i = 0; i < 6; i++) {
      passcode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return passcode;
  };

  // Default deduction types (values in percentage 1-100)
  const defaultDeductions = [
    { deduction: 'Wap Basah', value: 5 },
    { deduction: 'Hampa', value: 5 },
    { deduction: 'Kotoran', value: 5 },
    { deduction: 'Lain-lain', value: 5 }
  ];

  useEffect(() => {
    loadSeasons();
    loadSeasonTypes();
  }, []);

  const loadSeasons = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.seasons?.getAll();
      if (result?.success) {
        setSeasons(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load seasons:', error);
      message.error('Failed to load seasons');
    } finally {
      setLoading(false);
    }
  };

  const loadSeasonTypes = async () => {
    try {
      const result = await window.electronAPI.seasons?.getSeasonTypes();
      if (result?.success) {
        setSeasonTypes(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load season types:', error);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setSelectedSeason(null);
    form.resetFields();
    form.setFieldsValue({
      mode: 'LIVE',
      status: 'planned',
      deduction_config: defaultDeductions,
      opening_price_per_ton: 1800.00
    });
    setModalVisible(true);
  };

  const handleEdit = (season) => {
    setModalMode('edit');
    setSelectedSeason(season);
    form.setFieldsValue({
      ...season,
      date_range: [dayjs(season.start_date), dayjs(season.end_date)],
      deduction_config: season.deduction_config || defaultDeductions
    });
    setModalVisible(true);
  };

  const handleView = (season) => {
    setModalMode('view');
    setSelectedSeason(season);
    form.setFieldsValue({
      ...season,
      date_range: [dayjs(season.start_date), dayjs(season.end_date)],
      deduction_config: season.deduction_config || defaultDeductions
    });
    setModalVisible(true);
  };

  const handleActivate = (season) => {
    // Generate passcode and show confirmation modal
    const passcode = generatePasscode();
    setGeneratedPasscode(passcode);
    setSeasonToActivate(season);
    passcodeForm.resetFields();
    setActivationModalVisible(true);
  };
  
  const proceedWithActivation = async () => {
    try {
      const values = await passcodeForm.validateFields();
      
      // Verify passcode
      if (values.passcode !== generatedPasscode) {
        message.error('Incorrect passcode. Please try again.');
        return;
      }
      
      const season = seasonToActivate;
      setActivationModalVisible(false);
      
      // Proceed with activation
      try {
        // Format dates properly (handle both Date objects and strings)
        const formatDate = (date) => {
          if (!date) return null;
          if (typeof date === 'string') {
            // If it's already a string, ensure it's in YYYY-MM-DD format
            return dayjs(date).format('YYYY-MM-DD');
          }
          return dayjs(date).format('YYYY-MM-DD');
        };
        
        // Properly format season data for update
        const seasonData = {
          season_name: season.season_name,
          year: parseInt(season.year),
          season_number: parseInt(season.season_number),
          opening_price_per_ton: parseFloat(season.opening_price_per_ton),
          deduction_config: season.deduction_config,
          mode: season.mode,
          season_type_id: parseInt(season.season_type_id),
          start_date: formatDate(season.start_date),
          end_date: formatDate(season.end_date),
          status: 'active', // ← Change to active
          target_quantity_kg: season.target_quantity_kg ? parseFloat(season.target_quantity_kg) : null,
          notes: season.notes || null
        };
        
        console.log('Activating season with data:', seasonData);
        
        const result = await window.electronAPI.seasons?.update(season.season_id, seasonData);
        
        console.log('Activation result:', result);
        
        if (result?.success) {
          message.success(`${season.season_name} is now active!`);
          await loadSeasons();
          // Trigger navbar refresh by dispatching custom event
          console.log('✅ Season activated, dispatching season-changed event');
          window.dispatchEvent(new Event('season-changed'));
        } else {
          console.error('Activation failed:', result?.error);
          message.error(result?.error || 'Failed to activate season');
        }
      } catch (error) {
        console.error('Error activating season:', error);
        message.error(`Failed to activate season: ${error.message}`);
      }
    } catch (error) {
      console.error('Passcode validation error:', error);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const [startDate, endDate] = values.date_range;
      const seasonData = {
        season_code: values.season_code,
        season_name: values.season_name,
        year: values.year,
        season_number: values.season_number,
        opening_price_per_ton: values.opening_price_per_ton,
        deduction_config: values.deduction_config,
        mode: values.mode,
        season_type_id: values.season_type_id,
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
        status: values.status,
        target_quantity_kg: values.target_quantity_kg,
        notes: values.notes
      };

      let result;
      if (modalMode === 'create') {
        result = await window.electronAPI.seasons?.create(seasonData);
      } else {
        result = await window.electronAPI.seasons?.update(selectedSeason.season_id, seasonData);
      }

      if (result?.success) {
        message.success(`Season ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
        setModalVisible(false);
        loadSeasons();
        
        // If creating new season, prompt to set product prices
        if (modalMode === 'create' && result.data?.season_id) {
          setTimeout(() => {
            const newSeason = {
              season_id: result.data.season_id,
              season_name: seasonData.season_name,
              ...seasonData
            };
            
            message.info('Please set prices for each product', 3);
            setSelectedSeasonForPrice(newSeason);
            setPriceModalMode('edit');
            setProductPriceModalVisible(true);
          }, 500);
        }
      } else {
        message.error(result?.error || 'Failed to save season');
      }
    } catch (error) {
      console.error('Error saving season:', error);
      message.error('Failed to save season');
    } finally {
      setLoading(false);
    }
  };

  const handleProductPriceModalClose = (shouldRefresh) => {
    setProductPriceModalVisible(false);
    setSelectedSeasonForPrice(null);
    if (shouldRefresh) {
      loadSeasons();
    }
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'season_code',
      key: 'season_code',
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Season',
      dataIndex: 'season_name',
      key: 'season_name',
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            Year: {record.year} | Season #{record.season_number}
          </div>
        </div>
      )
    },
    {
      title: 'Mode',
      dataIndex: 'mode',
      key: 'mode',
      width: 100,
      render: (mode) => (
        <Tag color={mode === 'LIVE' ? 'green' : 'orange'} icon={mode === 'LIVE' ? <PlayCircleOutlined /> : <StopOutlined />}>
          {mode}
        </Tag>
      )
    },
    {
      title: 'Product Prices',
      key: 'prices',
      width: 180,
      align: 'center',
      render: (_, record) => (
        <Button
          type="link"
          icon={<DollarOutlined />}
          onClick={() => {
            setSelectedSeasonForPrice(record);
            setPriceModalMode('view');
            setProductPriceModalVisible(true);
          }}
        >
          View Prices
        </Button>
      )
    },
    {
      title: 'Period',
      key: 'period',
      width: 200,
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          {dayjs(record.start_date).format('DD/MM/YYYY')} - {dayjs(record.end_date).format('DD/MM/YYYY')}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colors = {
          planned: 'default',
          active: 'green',
          closed: 'red',
          cancelled: 'volcano'
        };
        return <Tag color={colors[status]}>{status?.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Actual / Target',
      key: 'quantities',
      width: 150,
      align: 'right',
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          <div>{parseFloat(record.actual_quantity_kg || 0).toFixed(2)} kg</div>
          <div style={{ color: '#999' }}>Target: {parseFloat(record.target_quantity_kg || 0).toFixed(2)} kg</div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              onClick={() => handleView(record)}
            />
          </Tooltip>
          {record.status !== 'closed' && (
            <>
              <Tooltip title="Edit">
                <Button 
                  type="link" 
                  icon={<EditOutlined />} 
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
              <Tooltip title="Update Product Prices">
                <Button 
                  type="link" 
                  icon={<DollarOutlined />} 
                  style={{ color: '#52c41a' }}
                  onClick={() => {
                    setSelectedSeasonForPrice(record);
                    setPriceModalMode('edit');
                    setProductPriceModalVisible(true);
                  }}
                />
              </Tooltip>
            </>
          )}
          {record.status !== 'active' && record.status !== 'cancelled' && (
            <Tooltip title={record.status === 'closed' ? 'Reactivate Season' : 'Activate Season'}>
              <Button 
                type="link" 
                icon={<CheckCircleOutlined />} 
                style={{ color: '#52c41a' }}
                onClick={() => handleActivate(record)}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <>
      <style>{`
        .active-season-row {
          background-color: #f6ffed !important;
        }
        .active-season-row:hover > td {
          background-color: #e7f7df !important;
        }
        .ant-table-tbody > .active-season-row > td {
          background-color: #f6ffed !important;
        }
        .ant-table-tbody > .active-season-row:hover > td {
          background-color: #e7f7df !important;
        }
      `}</style>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Row justify="space-between" align="middle">
          <Col>
            <h2 style={{ margin: 0 }}>
              <SettingOutlined /> Season Configuration
            </h2>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Create New Season
            </Button>
          </Col>
        </Row>

        {/* Info Alert */}
        <Alert
          message="Season Configuration"
          description="Configure season details including opening price, deduction rates, and operating mode (LIVE for production, DEMO for training)."
          type="info"
          showIcon
        />

        {/* Seasons Table */}
        <Table
          columns={columns}
          dataSource={seasons}
          rowKey="season_id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Total ${total} seasons`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50']
          }}
          scroll={{ x: 1200 }}
          rowClassName={(record) => 
            record.status === 'active' ? 'active-season-row' : ''
          }
        />
      </Space>

      {/* Create/Edit Modal */}
      <Modal
        title={
          modalMode === 'create' ? 'Create New Season' :
          modalMode === 'edit' ? 'Edit Season' :
          'View Season'
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={900}
        footer={modalMode === 'view' ? [
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>
        ] : [
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={() => form.submit()}
          >
            {modalMode === 'create' ? 'Create' : 'Update'}
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={modalMode === 'view'}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="season_code"
                label="Season Code"
                rules={[{ required: true, message: 'Please enter season code' }]}
              >
                <Input placeholder="e.g., 2024-S1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="season_name"
                label="Season Name"
                rules={[{ required: true, message: 'Please enter season name' }]}
              >
                <Input placeholder="e.g., Musim 1/2024" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="year"
                label="Year"
                rules={[{ required: true, message: 'Please enter year' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={2020} 
                  max={2100}
                  placeholder="2024"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="season_number"
                label="Season Number"
                rules={[{ required: true, message: 'Please enter season number' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={1} 
                  max={10}
                  placeholder="1"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="opening_price_per_ton"
                label="Opening Price (RM/Metric Ton)"
                rules={[{ required: true, message: 'Please enter opening price' }]}
                tooltip={modalMode === 'edit' && selectedSeason?.current_price_per_ton ? "Cannot change opening price after current price is set. Use 'Update Price' instead." : "Price per 1000 KG (Metric Ton)"}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={10}
                  precision={2}
                  placeholder="1800.00"
                  addonBefore="RM"
                  disabled={modalMode === 'edit' && selectedSeason?.current_price_per_ton}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="season_type_id"
                label="Season Type"
                rules={[{ required: true, message: 'Please select season type' }]}
              >
                <Select placeholder="Select season type">
                  {seasonTypes.map(type => (
                    <Option key={type.type_id} value={type.type_id}>
                      {type.type_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="mode"
                label="Operating Mode"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  <Radio.Button value="LIVE">
                    <PlayCircleOutlined /> LIVE (Production)
                  </Radio.Button>
                  <Radio.Button value="DEMO">
                    <StopOutlined /> DEMO (Training)
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="date_range"
            label="Season Period"
            rules={[{ required: true, message: 'Please select date range' }]}
          >
            <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="planned">Planned</Option>
                  <Option value="active">Active</Option>
                  <Option value="closed">Closed</Option>
                  <Option value="cancelled">Cancelled</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="target_quantity_kg"
                label="Target Quantity (kg)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={100}
                  placeholder="10000"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Deduction Configuration</Divider>

          <Alert
            message="Deduction Rates"
            description="Configure deduction rates for different quality issues. Add or remove deduction items as needed. These rates will be automatically applied during purchase transactions."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.List name="deduction_config">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'deduction']}
                      label={name === 0 ? 'Deduction Type' : ''}
                      rules={[{ required: true, message: 'Please enter deduction type' }]}
                      style={{ marginBottom: 0, width: 300 }}
                    >
                      <Input placeholder="e.g., Wap Basah, Hampa, Kotoran" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'value']}
                      label={name === 0 ? 'Deduction Rate (%)' : ''}
                      rules={[{ required: true, message: 'Please enter value' }]}
                      style={{ marginBottom: 0, width: 200 }}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        max={100}
                        step={0.1}
                        precision={2}
                        placeholder="5.00"
                        addonAfter="%"
                        formatter={value => `${value}`}
                        parser={value => value.replace(/[^0-9.]/g, '')}
                      />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                        style={{ marginTop: name === 0 ? 30 : 0 }}
                      >
                        Remove
                      </Button>
                    )}
                  </Space>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add Deduction Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={3} placeholder="Additional notes about this season..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Passcode Confirmation Modal */}
      <Modal
        title="Confirm Season Activation"
        open={activationModalVisible}
        onCancel={() => {
          setActivationModalVisible(false);
          setGeneratedPasscode('');
          setSeasonToActivate(null);
          passcodeForm.resetFields();
        }}
        onOk={proceedWithActivation}
        okText="Activate Season"
        okButtonProps={{ type: 'primary', style: { background: '#52c41a' } }}
        cancelText="Cancel"
        width={500}
      >
        {seasonToActivate && (
          <div>
            <Alert
              message="Security Confirmation Required"
              description={
                <div>
                  <p>You are about to activate <strong>{seasonToActivate.season_name}</strong>.</p>
                  {seasonToActivate.status === 'closed' && (
                    <p style={{ marginTop: 8 }}>
                      <strong>Note:</strong> This will reopen a previously closed season. All previous transactions will remain intact.
                    </p>
                  )}
                  <p style={{ marginTop: 8 }}>
                    <strong>Important:</strong> Activating this season will automatically close any other active season.
                  </p>
                </div>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <div style={{ 
              background: '#f6ffed', 
              border: '2px solid #52c41a', 
              borderRadius: '8px', 
              padding: '20px', 
              textAlign: 'center',
              marginBottom: 24
            }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
                Enter this passcode to confirm:
              </div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                letterSpacing: '8px',
                color: '#52c41a',
                fontFamily: 'monospace'
              }}>
                {generatedPasscode}
              </div>
            </div>
            
            <Form form={passcodeForm} layout="vertical">
              <Form.Item
                name="passcode"
                label="Enter the passcode above"
                rules={[
                  { required: true, message: 'Please enter the passcode' },
                  { len: 6, message: 'Passcode must be exactly 6 characters' }
                ]}
              >
                <Input
                  size="large"
                  placeholder="Enter 6-character passcode"
                  maxLength={6}
                  style={{ 
                    textAlign: 'center', 
                    fontSize: '24px', 
                    letterSpacing: '8px',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase'
                  }}
                  autoFocus
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    passcodeForm.setFieldsValue({ passcode: value });
                  }}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Product Price Modal */}
      <SeasonProductPriceModal
        visible={productPriceModalVisible}
        onCancel={handleProductPriceModalClose}
        season={selectedSeasonForPrice}
        mode={priceModalMode}
      />
    </Card>
    </>
  );
};

export default SeasonConfig;
