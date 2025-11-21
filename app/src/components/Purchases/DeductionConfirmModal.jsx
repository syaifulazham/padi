import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, Space, Alert, Divider } from 'antd';
import { PlusOutlined, MinusCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

const DeductionConfirmModal = ({ visible, onConfirm, onCancel, seasonDeductions, netWeight }) => {
  const [form] = Form.useForm();
  const [previewAmount, setPreviewAmount] = useState(null);

  useEffect(() => {
    if (visible && seasonDeductions) {
      // Set initial values from season deductions
      form.setFieldsValue({
        deductions: seasonDeductions || []
      });
      calculatePreview(seasonDeductions);
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

  const handleConfirm = () => {
    form.validateFields()
      .then((values) => {
        const deductions = values.deductions || [];
        onConfirm(deductions);
        form.resetFields();
      })
      .catch((error) => {
        console.error('Validation failed:', error);
      });
  };

  const handleCancel = () => {
    form.resetFields();
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
        description="The deduction rates below are from the active season configuration. You can modify them for this specific transaction if needed."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

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
