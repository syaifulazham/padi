import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Input, Table, Tag, message, Alert, Divider } from 'antd';
import { DollarOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;

const SeasonPriceUpdateModal = ({ visible, onCancel, season }) => {
  const [form] = Form.useForm();
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && season) {
      // Load price history
      loadPriceHistory();
      
      // Set current price
      if (season.current_price_per_ton) {
        form.setFieldsValue({
          price_per_ton: season.current_price_per_ton
        });
      }
    }
  }, [visible, season]);

  const loadPriceHistory = async () => {
    if (!season?.season_id) return;
    
    try {
      const result = await window.electronAPI.seasonPrice?.getHistory(season.season_id);
      if (result?.success) {
        setPriceHistory(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load price history:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Convert price to number
      const priceValue = typeof values.price_per_ton === 'string' 
        ? parseFloat(values.price_per_ton) 
        : values.price_per_ton;

      const result = await window.electronAPI.seasonPrice?.update(
        season.season_id,
        priceValue,
        values.notes || null,
        1 // TODO: Get from auth
      );

      if (result?.success) {
        message.success('Price updated successfully!');
        form.resetFields();
        
        // Dispatch event to refresh active season in layout
        window.dispatchEvent(new Event('season-changed'));
        
        onCancel(true); // Pass true to indicate refresh needed
      } else {
        message.error(`Failed to update price: ${result?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating price:', error);
      message.error('Failed to update price');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Price (RM/ton)',
      dataIndex: 'price_per_ton',
      key: 'price_per_ton',
      render: (price) => <Tag color="green">RM {parseFloat(price).toFixed(2)}</Tag>
    },
    {
      title: 'Effective Date',
      dataIndex: 'effective_date',
      key: 'effective_date',
      render: (date) => dayjs(date).format('DD MMM YYYY HH:mm:ss')
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes) => notes || '-'
    }
  ];

  return (
    <Modal
      title={
        <div>
          <DollarOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          Update Season Price: {season?.season_name}
        </div>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={() => onCancel(false)}
      width={800}
      okText="Update Price"
      confirmLoading={loading}
      okButtonProps={{ size: 'large', type: 'primary' }}
      cancelButtonProps={{ size: 'large' }}
    >
      <Alert
        message="Current Season Price"
        description={
          season?.current_price_per_ton 
            ? `Current price: RM ${parseFloat(season.current_price_per_ton).toFixed(2)} per ton`
            : 'No price set for this season'
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="price_per_ton"
          label="New Price (RM per ton)"
          rules={[
            { required: true, message: 'Please enter price' },
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
          />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Notes (Optional)"
        >
          <TextArea
            rows={3}
            placeholder="e.g., Price adjustment due to market conditions"
            maxLength={500}
          />
        </Form.Item>
      </Form>

      {priceHistory.length > 0 && (
        <>
          <Divider />
          <div style={{ marginTop: 16 }}>
            <h4>
              <HistoryOutlined style={{ marginRight: 8 }} />
              Price History
            </h4>
            <Table
              dataSource={priceHistory}
              columns={columns}
              rowKey="price_history_id"
              pagination={false}
              size="small"
              scroll={{ y: 200 }}
              style={{ marginTop: 8 }}
            />
          </div>
        </>
      )}
    </Modal>
  );
};

export default SeasonPriceUpdateModal;
