import React from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Row, Col, message, Tabs } from 'antd';
import dayjs from 'dayjs';
import SubsidyCardUpload from './SubsidyCardUpload';

const { TextArea } = Input;
const { Option } = Select;

const AddFarmerModal = ({ open, onClose, onSuccess, editingFarmer = null }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const isEditMode = !!editingFarmer;

  // Load farmer data when editing
  React.useEffect(() => {
    if (open && editingFarmer) {
      // Convert date_of_birth to dayjs object if it exists
      const formData = {
        ...editingFarmer,
        date_of_birth: editingFarmer.date_of_birth ? dayjs(editingFarmer.date_of_birth) : null,
      };
      form.setFieldsValue(formData);
    } else if (open && !editingFarmer) {
      // Reset to default values for add mode
      form.setFieldsValue({
        status: 'active',
        farm_size_acres: 0
      });
    }
  }, [open, editingFarmer, form]);

  // Auto-format IC number
  const formatIcNumber = (value) => {
    if (!value) return value;
    
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    
    // Apply format: 000000-00-0000
    if (digitsOnly.length <= 6) {
      return digitsOnly;
    } else if (digitsOnly.length <= 8) {
      return `${digitsOnly.slice(0, 6)}-${digitsOnly.slice(6)}`;
    } else {
      return `${digitsOnly.slice(0, 6)}-${digitsOnly.slice(6, 8)}-${digitsOnly.slice(8, 12)}`;
    }
  };

  const handleIcNumberChange = (e) => {
    const formatted = formatIcNumber(e.target.value);
    form.setFieldValue('ic_number', formatted);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Convert date to string format
      const data = {
        ...values,
        date_of_birth: values.date_of_birth ? dayjs(values.date_of_birth).format('YYYY-MM-DD') : null,
      };

      let result;
      if (isEditMode) {
        result = await window.electronAPI.farmers.update(editingFarmer.farmer_id, data);
      } else {
        result = await window.electronAPI.farmers.create(data);
      }
      
      if (result.success) {
        message.success(isEditMode ? 'Farmer updated successfully!' : 'Farmer added successfully!');
        form.resetFields();
        onSuccess();
        onClose();
      } else {
        message.error(result.error || (isEditMode ? 'Failed to update farmer' : 'Failed to add farmer'));
      }
    } catch (error) {
      message.error((isEditMode ? 'Error updating farmer: ' : 'Error adding farmer: ') + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const tabItems = [
    {
      key: 'details',
      label: 'Farmer Details',
      children: (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'active',
            farm_size_acres: 0
          }}
        >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="farmer_code"
              label="Subsidy No."
              rules={[
                { required: true, message: 'Please enter subsidy number' },
                { pattern: /^[A-Z0-9-/]+$/, message: 'Only uppercase letters, numbers, dashes, and forward slashes allowed' }
              ]}
            >
              <Input placeholder="e.g., B001/11711" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="ic_number"
              label="IC Number"
              rules={[
                { required: true, message: 'Please enter IC number' },
                { 
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const digitsOnly = value.replace(/\D/g, '');
                    if (digitsOnly.length === 12) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('IC must be 12 digits'));
                  }
                }
              ]}
            >
              <Input 
                placeholder="e.g., 850101015678 or 850101-01-5678" 
                maxLength={14} 
                onChange={handleIcNumberChange}
              />
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
              name="bank_name"
              label="Bank Name"
            >
              <Input placeholder="e.g., Maybank" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="bank_account_number"
              label="Bank Account Number"
            >
              <Input placeholder="e.g., 1234567890" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="bank2_name"
              label="Bank Name 2 (Optional)"
            >
              <Input placeholder="e.g., CIMB" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="bank2_account_number"
              label="Bank Account Number 2"
            >
              <Input placeholder="e.g., 9876543210" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="farm_size_acres"
              label="Farm Size (Acres)"
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
      )
    },
    {
      key: 'subsidy_card',
      label: 'Subsidy Card',
      children: (
        <SubsidyCardUpload 
          farmerId={editingFarmer?.farmer_id} 
          onUploadSuccess={() => {}}
        />
      )
    }
  ];

  return (
    <Modal
      title={isEditMode ? "Edit Farmer" : "Add New Farmer"}
      open={open}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={900}
      okText={isEditMode ? "Update Farmer" : "Add Farmer"}
      cancelText="Cancel"
    >
      <Tabs items={tabItems} />
    </Modal>
  );
};

export default AddFarmerModal;
