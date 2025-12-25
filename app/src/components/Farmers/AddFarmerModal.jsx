import React from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Row, Col, message, Tabs } from 'antd';
import dayjs from 'dayjs';
import SubsidyCardUpload from './SubsidyCardUpload';
import { useI18n } from '../../i18n/I18nProvider';

const { TextArea } = Input;
const { Option } = Select;

const AddFarmerModal = ({ open, onClose, onSuccess, editingFarmer = null }) => {
  const { t } = useI18n();
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
        message.success(isEditMode ? t('farmers.modal.messages.updated') : t('farmers.modal.messages.added'));
        form.resetFields();
        onSuccess();
        onClose();
      } else {
        message.error(
          result.error || (isEditMode ? t('farmers.modal.messages.updateFailed') : t('farmers.modal.messages.addFailed'))
        );
      }
    } catch (error) {
      message.error(
        (isEditMode ? t('farmers.modal.messages.updateErrorPrefix') : t('farmers.modal.messages.addErrorPrefix')) +
          error.message
      );
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
      label: t('farmers.modal.tabs.details'),
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
              label={t('farmers.modal.fields.farmerCode')}
              rules={[
                { required: true, message: t('farmers.modal.validations.enterSubsidyNumber') },
                { pattern: /^[A-Z0-9-/]+$/, message: t('farmers.modal.validations.subsidyPattern') }
              ]}
            >
              <Input placeholder={t('farmers.modal.placeholders.farmerCode')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="ic_number"
              label={t('farmers.modal.fields.icNumber')}
              rules={[
                { required: true, message: t('farmers.modal.validations.enterIc') },
                { 
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const digitsOnly = value.replace(/\D/g, '');
                    if (digitsOnly.length === 12) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('farmers.modal.validations.ic12Digits')));
                  }
                }
              ]}
            >
              <Input 
                placeholder={t('farmers.modal.placeholders.icNumber')}
                maxLength={14} 
                onChange={handleIcNumberChange}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="full_name"
          label={t('farmers.modal.fields.fullName')}
          rules={[{ required: true, message: t('farmers.modal.validations.enterFullName') }]}
        >
          <Input placeholder={t('farmers.modal.placeholders.fullName')} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="phone"
              label={t('farmers.modal.fields.phoneNumber')}
              rules={[
                { pattern: /^[0-9-+()]*$/, message: t('farmers.modal.validations.invalidPhone') }
              ]}
            >
              <Input placeholder={t('farmers.modal.placeholders.phone')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="date_of_birth"
              label={t('farmers.modal.fields.dateOfBirth')}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="address"
          label={t('farmers.modal.fields.address')}
        >
          <TextArea rows={2} placeholder={t('farmers.modal.placeholders.address')} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="postcode"
              label={t('farmers.modal.fields.postcode')}
              rules={[
                { pattern: /^\d{5}$/, message: t('farmers.modal.validations.postcode5Digits') }
              ]}
            >
              <Input placeholder={t('farmers.modal.placeholders.postcode')} maxLength={5} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="city"
              label={t('farmers.modal.fields.city')}
            >
              <Input placeholder={t('farmers.modal.placeholders.city')} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="state"
              label={t('farmers.modal.fields.state')}
            >
              <Select placeholder={t('farmers.modal.placeholders.selectState')}>
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
              label={t('farmers.modal.fields.bankName')}
            >
              <Input placeholder={t('farmers.modal.placeholders.bankName')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="bank_account_number"
              label={t('farmers.modal.fields.bankAccountNumber')}
            >
              <Input placeholder={t('farmers.modal.placeholders.bankAccountNumber')} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="bank2_name"
              label={t('farmers.modal.fields.bankName2Optional')}
            >
              <Input placeholder={t('farmers.modal.placeholders.bankName2')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="bank2_account_number"
              label={t('farmers.modal.fields.bankAccountNumber2')}
            >
              <Input placeholder={t('farmers.modal.placeholders.bankAccountNumber2')} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="farm_size_acres"
              label={t('farmers.modal.fields.farmSizeAcres')}
              rules={[
                { required: true, message: t('farmers.modal.validations.enterFarmSize') }
              ]}
            >
              <InputNumber
                min={0}
                step={0.1}
                style={{ width: '100%' }}
                placeholder={t('farmers.modal.placeholders.farmSize')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label={t('farmers.modal.fields.status')}
              rules={[{ required: true, message: t('farmers.modal.validations.selectStatus') }]}
            >
              <Select>
                <Option value="active">{t('farmers.modal.statusOptions.active')}</Option>
                <Option value="inactive">{t('farmers.modal.statusOptions.inactive')}</Option>
                <Option value="suspended">{t('farmers.modal.statusOptions.suspended')}</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="notes"
          label={t('farmers.modal.fields.notes')}
        >
          <TextArea rows={3} placeholder={t('farmers.modal.placeholders.notes')} />
        </Form.Item>
      </Form>
      )
    },
    {
      key: 'subsidy_card',
      label: t('farmers.modal.tabs.subsidyCard'),
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
      title={isEditMode ? t('farmers.modal.editTitle') : t('farmers.modal.addTitle')}
      open={open}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={900}
      okText={isEditMode ? t('farmers.modal.updateOk') : t('farmers.modal.addOk')}
      cancelText={t('farmers.modal.cancel')}
    >
      <Tabs items={tabItems} />
    </Modal>
  );
};

export default AddFarmerModal;
