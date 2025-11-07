import React from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Row, Col, message } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const AddFarmerModal = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Convert date to string format
      const data = {
        ...values,
        date_of_birth: values.date_of_birth ? dayjs(values.date_of_birth).format('YYYY-MM-DD') : null,
      };

      const result = await window.electronAPI.farmers.create(data);
      
      if (result.success) {
        message.success('Farmer added successfully!');
        form.resetFields();
        onSuccess();
        onClose();
      } else {
        message.error(result.error || 'Failed to add farmer');
      }
    } catch (error) {
      message.error('Error adding farmer: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Add New Farmer"
      open={open}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={800}
      okText="Add Farmer"
      cancelText="Cancel"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'active',
          farm_size_hectares: 0
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="farmer_code"
              label="Subsidy No."
              rules={[
                { required: true, message: 'Please enter subsidy number' },
                { pattern: /^[A-Z0-9-]+$/, message: 'Only uppercase letters, numbers, and dashes' }
              ]}
            >
              <Input placeholder="e.g., SUB-2024-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="ic_number"
              label="IC Number"
              rules={[
                { required: true, message: 'Please enter IC number' },
                { pattern: /^\d{12}$/, message: 'IC must be 12 digits' }
              ]}
            >
              <Input placeholder="e.g., 850101015678" maxLength={12} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="full_name"
          label="Full Name"
          rules={[{ required: true, message: 'Please enter full name' }]}
        >
          <Input placeholder="e.g., Ahmad bin Abdullah" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { pattern: /^[0-9-+()]*$/, message: 'Invalid phone format' }
              ]}
            >
              <Input placeholder="e.g., 0123456789" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="date_of_birth"
              label="Date of Birth"
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="address"
          label="Address"
        >
          <TextArea rows={2} placeholder="Street address" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="postcode"
              label="Postcode"
              rules={[
                { pattern: /^\d{5}$/, message: 'Postcode must be 5 digits' }
              ]}
            >
              <Input placeholder="e.g., 12345" maxLength={5} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="city"
              label="City"
            >
              <Input placeholder="e.g., Kuala Lumpur" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="state"
              label="State"
            >
              <Select placeholder="Select state">
                <Option value="Johor">Johor</Option>
                <Option value="Kedah">Kedah</Option>
                <Option value="Kelantan">Kelantan</Option>
                <Option value="Melaka">Melaka</Option>
                <Option value="Negeri Sembilan">Negeri Sembilan</Option>
                <Option value="Pahang">Pahang</Option>
                <Option value="Penang">Penang</Option>
                <Option value="Perak">Perak</Option>
                <Option value="Perlis">Perlis</Option>
                <Option value="Sabah">Sabah</Option>
                <Option value="Sarawak">Sarawak</Option>
                <Option value="Selangor">Selangor</Option>
                <Option value="Terengganu">Terengganu</Option>
                <Option value="WP Kuala Lumpur">WP Kuala Lumpur</Option>
                <Option value="WP Labuan">WP Labuan</Option>
                <Option value="WP Putrajaya">WP Putrajaya</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="farm_size_hectares"
              label="Farm Size (Hectares)"
              rules={[
                { required: true, message: 'Please enter farm size' }
              ]}
            >
              <InputNumber
                min={0}
                step={0.1}
                style={{ width: '100%' }}
                placeholder="e.g., 5.5"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="suspended">Suspended</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="notes"
          label="Notes"
        >
          <TextArea rows={3} placeholder="Additional notes about the farmer" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddFarmerModal;
