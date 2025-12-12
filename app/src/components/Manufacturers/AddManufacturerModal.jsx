import React from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, Row, Col, message } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const AddManufacturerModal = ({ open, onClose, onSuccess, editingManufacturer = null }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const isEditMode = !!editingManufacturer;

  // Load manufacturer data when editing
  React.useEffect(() => {
    if (open && editingManufacturer) {
      const formData = {
        ...editingManufacturer,
        contract_start_date: editingManufacturer.contract_start_date ? dayjs(editingManufacturer.contract_start_date) : null,
        contract_end_date: editingManufacturer.contract_end_date ? dayjs(editingManufacturer.contract_end_date) : null,
      };
      form.setFieldsValue(formData);
    } else if (open && !editingManufacturer) {
      // Reset to default values for add mode
      form.setFieldsValue({
        status: 'active',
        credit_limit: 0,
        payment_terms: 30
      });
    }
  }, [open, editingManufacturer, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Convert dates to string format
      const data = {
        ...values,
        contract_start_date: values.contract_start_date ? dayjs(values.contract_start_date).format('YYYY-MM-DD') : null,
        contract_end_date: values.contract_end_date ? dayjs(values.contract_end_date).format('YYYY-MM-DD') : null,
      };

      let result;
      if (isEditMode) {
        result = await window.electronAPI.manufacturers.update(editingManufacturer.manufacturer_id, data);
      } else {
        result = await window.electronAPI.manufacturers.create(data);
      }
      
      if (result.success) {
        message.success(isEditMode ? 'Manufacturer updated successfully!' : 'Manufacturer added successfully!');
        form.resetFields();
        onSuccess();
        onClose();
      } else {
        message.error(result.error || (isEditMode ? 'Failed to update manufacturer' : 'Failed to add manufacturer'));
      }
    } catch (error) {
      message.error((isEditMode ? 'Error updating manufacturer: ' : 'Error adding manufacturer: ') + error.message);
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
      title={isEditMode ? "Edit Manufacturer" : "Add New Manufacturer"}
      open={open}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={900}
      okText={isEditMode ? "Update Manufacturer" : "Add Manufacturer"}
      cancelText="Cancel"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'active',
          credit_limit: 0,
          payment_terms: 30
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="manufacturer_code"
              label="Manufacturer Code"
              rules={[
                { required: true, message: 'Please enter manufacturer code' },
                { pattern: /^[A-Z0-9-]+$/, message: 'Only uppercase letters, numbers, and dashes' }
              ]}
            >
              <Input placeholder="e.g., MFR-001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="registration_number"
              label="Registration Number"
              rules={[{ required: true, message: 'Please enter registration number' }]}
            >
              <Input placeholder="e.g., ROC123456-A" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="company_name"
          label="Company Name"
          rules={[{ required: true, message: 'Please enter company name' }]}
        >
          <Input placeholder="e.g., Kilang Beras Sdn Bhd" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="contact_person"
              label="Contact Person"
            >
              <Input placeholder="e.g., Ahmad bin Abdullah" />
            </Form.Item>
          </Col>
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
        </Row>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { type: 'email', message: 'Invalid email format' }
          ]}
        >
          <Input placeholder="e.g., contact@company.com" />
        </Form.Item>

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
          <Col span={8}>
            <Form.Item
              name="credit_limit"
              label="Credit Limit (RM)"
            >
              <InputNumber
                min={0}
                step={1000}
                style={{ width: '100%' }}
                placeholder="e.g., 50000"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="payment_terms"
              label="Payment Terms (Days)"
            >
              <InputNumber
                min={0}
                max={365}
                style={{ width: '100%' }}
                placeholder="e.g., 30"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="contract_start_date"
              label="Contract Start Date"
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contract_end_date"
              label="Contract End Date"
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="notes"
          label="Notes"
        >
          <TextArea rows={3} placeholder="Additional notes about the manufacturer" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddManufacturerModal;
