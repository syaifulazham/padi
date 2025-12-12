import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, Space, Alert, Divider, Select, Radio, Tag } from 'antd';
import { PlusOutlined, MinusCircleOutlined, CheckCircleOutlined, SettingOutlined } from '@ant-design/icons';

const DeductionConfirmModal = ({ visible, onConfirm, onCancel, seasonDeductions, netWeight }) => {
  const [form] = Form.useForm();
  const [previewAmount, setPreviewAmount] = useState(null);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [deductionPresets, setDeductionPresets] = useState([]);
  const [isOldFormat, setIsOldFormat] = useState(false);

  useEffect(() => {
    if (visible && seasonDeductions) {
      // Check if it's new format (array of presets) or old format (array of deductions)
      const isNewFormat = Array.isArray(seasonDeductions) && 
                         seasonDeductions.length > 0 && 
                         seasonDeductions[0].preset_name !== undefined;
      
      if (isNewFormat) {
        // New format with multiple presets
        setIsOldFormat(false);
        setDeductionPresets(seasonDeductions);
        setSelectedPresetIndex(0);
        form.setFieldsValue({
          deductions: seasonDeductions[0]?.deductions || []
        });
        calculatePreview(seasonDeductions[0]?.deductions || []);
      } else {
        // Old format - single deduction array
        setIsOldFormat(true);
        setDeductionPresets([]);
        form.setFieldsValue({
          deductions: seasonDeductions || []
        });
        calculatePreview(seasonDeductions || []);
      }
    }
  }, [visible, seasonDeductions, form]);

  const calculatePreview = (deductions) => {
    if (!deductions || !netWeight) return;
    
    const totalDeduction = deductions.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
    const effectiveWeight = netWeight * (1 - totalDeduction / 100);
    
    setPreviewAmount({
      totalDeduction: totalDeduction.toFixed(2),
      effectiveWeight: effectiveWeight.toFixed(2),
      deductedWeight: (netWeight - effectiveWeight).toFixed(2)
    });
  };

  const handleValuesChange = (_, allValues) => {
    if (allValues.deductions) {
      calculatePreview(allValues.deductions);
    }
  };

  const handlePresetChange = (index) => {
    setSelectedPresetIndex(index);
    const selectedDeductions = deductionPresets[index]?.deductions || [];
    form.setFieldsValue({
      deductions: selectedDeductions
    });
    calculatePreview(selectedDeductions);
  };

  const handleConfirm = () => {
    form.validateFields()
      .then((values) => {
        const deductions = values.deductions || [];
        onConfirm(deductions);
        form.resetFields();
        setSelectedPresetIndex(0);
      })
      .catch((error) => {
        console.error('Validation failed:', error);
      });
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedPresetIndex(0);
    onCancel();
  };

  return (
    <Modal
      title={
        <div>
          <CheckCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          Confirm Deduction Rates
        </div>
      }
      open={visible}
      onOk={handleConfirm}
      onCancel={handleCancel}
      width={700}
      okText="Confirm & Complete Purchase"
      cancelText="Cancel"
      okButtonProps={{ size: 'large', type: 'primary' }}
      cancelButtonProps={{ size: 'large' }}
    >
      <Alert
        message="Review & Adjust Deduction Rates"
        description={isOldFormat 
          ? "The deduction rates below are from the active season configuration. You can modify them for this specific transaction if needed."
          : "Select a deduction preset based on paddy quality, then review and adjust rates if needed."
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {!isOldFormat && deductionPresets.length > 1 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>
            <SettingOutlined /> Select Deduction Preset:
          </div>
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
                      padding: '8px 12px',
                      border: selectedPresetIndex === index ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      borderRadius: 6,
                      backgroundColor: selectedPresetIndex === index ? '#e6f7ff' : 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ fontWeight: 500 }}>{preset.preset_name}</span>
                      <Tag color={totalRate < 15 ? 'green' : totalRate < 25 ? 'orange' : 'red'}>
                        Total: {totalRate.toFixed(1)}%
                      </Tag>
                    </div>
                  </Radio>
                );
              })}
            </Space>
          </Radio.Group>
          <Divider />
        </div>
      )}

      {!isOldFormat && deductionPresets.length === 1 && (
        <Alert
          message={`Using preset: ${deductionPresets[0]?.preset_name}`}
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        <Form.List name="deductions">
          {(fields, { add, remove }) => (
            <>
              <div style={{ marginBottom: 16 }}>
                <strong>Deduction Items:</strong>
              </div>
              {fields.map((field, index) => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...field}
                    label={index === 0 ? "Type" : ""}
                    name={[field.name, 'deduction']}
                    rules={[{ required: true, message: 'Enter deduction type' }]}
                    style={{ width: 250 }}
                  >
                    <Input placeholder="e.g., Moisture, Foreign Matter" />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    label={index === 0 ? "Rate (%)" : ""}
                    name={[field.name, 'value']}
                    rules={[
                      { required: true, message: 'Enter rate' },
                      { type: 'number', min: 0, max: 100, message: 'Rate must be 0-100%' }
                    ]}
                    style={{ width: 150 }}
                  >
                    <InputNumber
                      placeholder="0.00"
                      precision={2}
                      min={0}
                      max={100}
                      step={0.1}
                      style={{ width: '100%' }}
                      addonAfter="%"
                    />
                  </Form.Item>
                  <MinusCircleOutlined
                    style={{ fontSize: 20, color: '#ff4d4f', cursor: 'pointer' }}
                    onClick={() => remove(field.name)}
                  />
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
      </Form>

      {previewAmount && (
        <>
          <Divider />
          <div style={{
            background: '#f0f2f5',
            padding: 16,
            borderRadius: 8,
            marginTop: 16
          }}>
            <h4 style={{ marginBottom: 12 }}>Deduction Preview:</h4>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Gross Weight (Net):</span>
                <strong>{netWeight} kg</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4d4f' }}>
                <span>Total Deduction Rate:</span>
                <strong>{previewAmount.totalDeduction}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff7875' }}>
                <span>Deducted Weight:</span>
                <strong>-{previewAmount.deductedWeight} kg</strong>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
                <span><strong>Effective Weight:</strong></span>
                <strong style={{ color: '#52c41a' }}>{previewAmount.effectiveWeight} kg</strong>
              </div>
            </Space>
          </div>
        </>
      )}
    </Modal>
  );
};

export default DeductionConfirmModal;
