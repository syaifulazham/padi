import React, { useEffect } from 'react';
import { Modal, Form, InputNumber, message, Alert } from 'antd';
import { DollarOutlined, WarningOutlined } from '@ant-design/icons';

const SetCurrentPriceModal = ({ visible, onCancel, onConfirm, season }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && season) {
      // Set opening price as default if available
      if (season.opening_price_per_ton) {
        form.setFieldsValue({
          price_per_ton: season.opening_price_per_ton
        });
      }
    }
  }, [visible, season, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      console.log('Setting price for season:', season?.season_id);
      console.log('Price value (raw):', values.price_per_ton, 'Type:', typeof values.price_per_ton);
      
      // Validate season exists
      if (!season || !season.season_id) {
        message.error('Season information is missing');
        return;
      }
      
      // Convert price to number and validate
      const priceValue = typeof values.price_per_ton === 'string' 
        ? parseFloat(values.price_per_ton) 
        : values.price_per_ton;
      
      console.log('Price value (converted):', priceValue, 'Type:', typeof priceValue);
      
      if (!priceValue || priceValue <= 0) {
        message.error('Please enter a valid price');
        return;
      }
      
      // Update current price
      const result = await window.electronAPI.seasonPrice?.update(
        season.season_id,
        priceValue,
        'Initial current price setting',
        1 // TODO: Get from auth
      );

      console.log('Update result:', result);

      if (result?.success) {
        message.success('Current price set successfully!');
        form.resetFields();
        
        // Dispatch event to refresh active season in layout
        window.dispatchEvent(new Event('season-changed'));
        
        onConfirm(values.price_per_ton);
      } else {
        console.error('Failed to set price:', result);
        message.error(`Failed to set price: ${result?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error setting current price:', error);
      message.error(`Failed to set current price: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <div>
          <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
          Set Current Price for {season?.season_name}
        </div>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      width={500}
      okText="Set Price & Continue"
      cancelText="Cancel"
      okButtonProps={{ size: 'large', type: 'primary', icon: <DollarOutlined /> }}
      cancelButtonProps={{ size: 'large' }}
      closable={false}
      maskClosable={false}
    >
      <Alert
        message="Current Price Not Set"
        description="You need to set the current price for this season before making purchases. The opening price is suggested as the default."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="price_per_ton"
          label="Current Price (RM per ton)"
          rules={[
            { required: true, message: 'Please enter current price' },
            { 
              validator: (_, value) => {
                const numValue = typeof value === 'string' ? parseFloat(value) : value;
                if (!numValue || numValue <= 0) {
                  return Promise.reject(new Error('Price must be greater than 0'));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0.01}
            step={10}
            precision={2}
            placeholder="e.g., 1800.00"
            prefix="RM"
            addonAfter="per ton"
            size="large"
          />
        </Form.Item>

        {season?.opening_price_per_ton && (
          <Alert
            message={`Opening Price: RM ${parseFloat(season.opening_price_per_ton).toFixed(2)} per ton`}
            type="info"
            showIcon
            style={{ marginTop: -8 }}
          />
        )}
      </Form>
    </Modal>
  );
};

export default SetCurrentPriceModal;
