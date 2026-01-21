import React from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, Row, Col, message } from 'antd';
import dayjs from 'dayjs';
import { useI18n } from '../../i18n/I18nProvider';
import { useAuth } from '../../contexts/AuthContext';

const { TextArea } = Input;
const { Option } = Select;

const AddManufacturerModal = ({ open, onClose, onSuccess, editingManufacturer = null }) => {
  const { t } = useI18n();
  const { user } = useAuth();
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
        created_by: user?.user_id
      };

      let result;
      if (isEditMode) {
        result = await window.electronAPI.manufacturers.update(editingManufacturer.manufacturer_id, data);
      } else {
        result = await window.electronAPI.manufacturers.create(data);
      }
      
      if (result.success) {
        message.success(isEditMode ? t('manufacturers.modal.messages.updated') : t('manufacturers.modal.messages.added'));
        form.resetFields();
        onSuccess();
        onClose();
      } else {
        message.error(
          result.error ||
            (isEditMode ? t('manufacturers.modal.messages.updateFailed') : t('manufacturers.modal.messages.addFailed'))
        );
      }
    } catch (error) {
      message.error(
        (isEditMode ? t('manufacturers.modal.messages.updateErrorPrefix') : t('manufacturers.modal.messages.addErrorPrefix')) +
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

  return (
    <Modal
      title={isEditMode ? t('manufacturers.modal.editTitle') : t('manufacturers.modal.addTitle')}
      open={open}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={900}
      okText={isEditMode ? t('manufacturers.modal.updateOk') : t('manufacturers.modal.addOk')}
      cancelText={t('manufacturers.modal.cancel')}
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
              label={t('manufacturers.modal.fields.manufacturerCode')}
              rules={[
                { required: true, message: t('manufacturers.modal.validations.enterManufacturerCode') },
                { pattern: /^[A-Z0-9-]+$/, message: t('manufacturers.modal.validations.manufacturerCodePattern') }
              ]}
            >
              <Input placeholder={t('manufacturers.modal.placeholders.manufacturerCode')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="registration_number"
              label={t('manufacturers.modal.fields.registrationNumber')}
              rules={[{ required: true, message: t('manufacturers.modal.validations.enterRegistrationNumber') }]}
            >
              <Input placeholder={t('manufacturers.modal.placeholders.registrationNumber')} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="company_name"
          label={t('manufacturers.modal.fields.companyName')}
          rules={[{ required: true, message: t('manufacturers.modal.validations.enterCompanyName') }]}
        >
          <Input placeholder={t('manufacturers.modal.placeholders.companyName')} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="contact_person"
              label={t('manufacturers.modal.fields.contactPerson')}
            >
              <Input placeholder={t('manufacturers.modal.placeholders.contactPerson')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label={t('manufacturers.modal.fields.phoneNumber')}
              rules={[
                { pattern: /^[0-9-+()]*$/, message: t('manufacturers.modal.validations.invalidPhone') }
              ]}
            >
              <Input placeholder={t('manufacturers.modal.placeholders.phone')} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="email"
          label={t('manufacturers.modal.fields.email')}
          rules={[
            { type: 'email', message: t('manufacturers.modal.validations.invalidEmail') }
          ]}
        >
          <Input placeholder={t('manufacturers.modal.placeholders.email')} />
        </Form.Item>

        <Form.Item
          name="address"
          label={t('manufacturers.modal.fields.address')}
        >
          <TextArea rows={2} placeholder={t('manufacturers.modal.placeholders.address')} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="postcode"
              label={t('manufacturers.modal.fields.postcode')}
              rules={[
                { pattern: /^\d{5}$/, message: t('manufacturers.modal.validations.postcode5Digits') }
              ]}
            >
              <Input placeholder={t('manufacturers.modal.placeholders.postcode')} maxLength={5} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="city"
              label={t('manufacturers.modal.fields.city')}
            >
              <Input placeholder={t('manufacturers.modal.placeholders.city')} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="state"
              label={t('manufacturers.modal.fields.state')}
            >
              <Select placeholder={t('manufacturers.modal.placeholders.selectState')}>
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
              label={t('manufacturers.modal.fields.creditLimitRm')}
            >
              <InputNumber
                min={0}
                step={1000}
                style={{ width: '100%' }}
                placeholder={t('manufacturers.modal.placeholders.creditLimit')}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="payment_terms"
              label={t('manufacturers.modal.fields.paymentTermsDays')}
            >
              <InputNumber
                min={0}
                max={365}
                style={{ width: '100%' }}
                placeholder={t('manufacturers.modal.placeholders.paymentTerms')}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="status"
              label={t('manufacturers.modal.fields.status')}
              rules={[{ required: true, message: t('manufacturers.modal.validations.selectStatus') }]}
            >
              <Select>
                <Option value="active">{t('manufacturers.modal.statusOptions.active')}</Option>
                <Option value="inactive">{t('manufacturers.modal.statusOptions.inactive')}</Option>
                <Option value="suspended">{t('manufacturers.modal.statusOptions.suspended')}</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="contract_start_date"
              label={t('manufacturers.modal.fields.contractStartDate')}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contract_end_date"
              label={t('manufacturers.modal.fields.contractEndDate')}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="notes"
          label={t('manufacturers.modal.fields.notes')}
        >
          <TextArea rows={3} placeholder={t('manufacturers.modal.placeholders.notes')} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddManufacturerModal;
