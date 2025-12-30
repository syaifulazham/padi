import React, { useState, useEffect } from 'react';
import { Tabs, Card, Form, Input, InputNumber, Select, Button, Switch, message, Space, Divider, Descriptions, Tag } from 'antd';
import { SaveOutlined, ReloadOutlined, DatabaseOutlined, PrinterOutlined, HddOutlined, SettingOutlined, ShopOutlined } from '@ant-design/icons';
import { useI18n } from '../../i18n/I18nProvider';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const Settings = () => {
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});
  const [systemInfo, setSystemInfo] = useState({});
  const [printers, setPrinters] = useState([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);

  useEffect(() => {
    loadSettings();
    loadSystemInfo();
    loadPrinters();
  }, []);

  const loadSettings = async () => {
    try {
      // Load settings from backend
      const result = await window.electronAPI.settings?.getAll();
      if (result?.success) {
        setSettings(result.data);
        form.setFieldsValue(result.data);
      }
    } catch (error) {
      console.log('Settings not yet implemented in backend');
      // Set default values
      const defaults = {
        // Company
        company_name: '',
        company_address: '',
        company_registration_no: '',
        paddy_purchasing_licence_no: '',
        company_location: '',
        
        // Database
        db_host: 'localhost',
        db_port: 3306,
        db_name: 'paddy_collection_db',
        db_connection_limit: 10,
        
        // Weighbridge
        weighbridge_port: 'COM3',
        weighbridge_baud_rate: 9600,
        weighbridge_auto_connect: true,
        
        // Printer
        default_printer: 'Epson LQ-310',
        auto_print: true,
        print_copies: 1,
        paper_size: '80mm',
        print_to_pdf: false,
        pdf_save_path: '',
        pdf_auto_open: false,
        
        // Application
        app_name: 'Paddy Collection Center',
        language: 'en',
        currency: 'MYR',
        date_format: 'YYYY-MM-DD',
        
        // Backup
        auto_backup: true,
        backup_frequency: 'daily',
        backup_retention_days: 30,
      };
      setSettings(defaults);
      form.setFieldsValue(defaults);
    }
  };

  const loadSystemInfo = async () => {
    try {
      const result = await window.electronAPI.system?.getInfo();
      if (result?.success) {
        setSystemInfo(result.data);
      } else {
        // Default system info
        setSystemInfo({
          version: '1.0.0',
          electron_version: '27.1.3',
          node_version: process.versions?.node || 'N/A',
          platform: 'darwin',
          database_status: 'Connected',
          database_version: '8.0',
        });
      }
    } catch (error) {
      console.log('System info not available');
    }
  };

  const loadPrinters = async () => {
    setLoadingPrinters(true);
    try {
      const result = await window.electronAPI.printer?.getPrinters();
      if (result?.success && result.data) {
        setPrinters(result.data);
        if (result.data.length > 0) {
          message.success(`Found ${result.data.length} printer(s)`);
        } else {
          message.warning('No printers found on this system');
        }
      } else {
        message.warning('Unable to load printers');
        setPrinters([]);
      }
    } catch (error) {
      console.error('Error loading printers:', error);
      message.error('Failed to load printers');
      setPrinters([]);
    } finally {
      setLoadingPrinters(false);
    }
  };

  const handleSave = async (values) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.settings?.save(values);
      if (result?.success) {
        message.success('Settings saved successfully! Some changes may require app restart.');
        setSettings(values);
      } else {
        message.warning('Settings saved locally (backend not implemented yet)');
        setSettings(values);
      }

      window.dispatchEvent(new Event('language-changed'));
    } catch (error) {
      message.warning('Settings updated locally');
      setSettings(values);

      window.dispatchEvent(new Event('language-changed'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    message.info('Form reset to last saved values');
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.testConnection();
      if (result.success) {
        message.success(t('settings.database.messages.connectionSuccess'));
      } else {
        message.error(`${t('settings.database.messages.connectionFailed')}: ${result.message}`);
      }
    } catch (error) {
      message.error(t('settings.database.messages.connectionTestFailed'));
    } finally {
      setLoading(false);
    }
  };

  const testWeighbridge = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.weighbridge?.connect();
      if (result?.success) {
        message.success(t('settings.hardware.messages.weighbridgeConnected'));
      } else {
        message.warning(t('settings.hardware.messages.weighbridgeNotImplemented'));
      }
    } catch (error) {
      message.warning(t('settings.hardware.messages.weighbridgeTestNotAvailable'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Tabs defaultActiveKey="company" type="card">
        {/* Company Details */}
        <TabPane 
          tab={<span><ShopOutlined /> {t('settings.company.tab')}</span>} 
          key="company"
        >
          <Card title={t('settings.company.cardTitle')}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Form.Item
                name="company_name"
                label={t('settings.company.fields.companyName')}
                rules={[{ required: true, message: t('settings.company.validations.companyNameRequired') }]}
                extra={t('settings.company.extras.companyName')}
              >
                <Input placeholder={t('settings.company.placeholders.companyName')} />
              </Form.Item>

              <Form.Item
                name="company_address"
                label={t('settings.company.fields.companyAddress')}
                rules={[{ required: true, message: t('settings.company.validations.companyAddressRequired') }]}
                extra={t('settings.company.extras.companyAddress')}
              >
                <TextArea 
                  rows={3} 
                  placeholder={t('settings.company.placeholders.companyAddress')}
                />
              </Form.Item>

              <Form.Item
                name="company_registration_no"
                label={t('settings.company.fields.companyRegistrationNo')}
                rules={[{ required: true, message: t('settings.company.validations.companyRegistrationNoRequired') }]}
                extra={t('settings.company.extras.companyRegistrationNo')}
              >
                <Input placeholder={t('settings.company.placeholders.companyRegistrationNo')} />
              </Form.Item>

              <Form.Item
                name="paddy_purchasing_licence_no"
                label={t('settings.company.fields.paddyPurchasingLicenceNo')}
                rules={[{ required: true, message: t('settings.company.validations.paddyPurchasingLicenceNoRequired') }]}
                extra={t('settings.company.extras.paddyPurchasingLicenceNo')}
              >
                <Input placeholder={t('settings.company.placeholders.paddyPurchasingLicenceNo')} />
              </Form.Item>

              <Form.Item
                name="company_location"
                label={t('settings.company.fields.location')}
                extra={t('settings.company.extras.location')}
              >
                <Input placeholder={t('settings.company.placeholders.location')} />
              </Form.Item>

              <Space style={{ marginTop: 16 }}>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  {t('settings.company.actions.save')}
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  {t('settings.company.actions.reset')}
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>

        {/* General Settings */}
        <TabPane 
          tab={<span><SettingOutlined /> {t('settings.general.tab')}</span>} 
          key="general"
        >
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Divider orientation="left">{t('settings.general.sections.application')}</Divider>
              <Form.Item
                name="app_name"
                label={t('settings.general.fields.applicationName')}
              >
                <Input placeholder={t('settings.general.placeholders.applicationName')} />
              </Form.Item>

              <Form.Item
                name="language"
                label={t('settings.general.fields.language')}
              >
                <Select>
                  <Option value="en">{t('settings.general.languageOptions.en')}</Option>
                  <Option value="ms">{t('settings.general.languageOptions.ms')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="currency"
                label={t('settings.general.fields.currency')}
              >
                <Select>
                  <Option value="MYR">{t('settings.general.currencyOptions.myr')}</Option>
                  <Option value="USD">{t('settings.general.currencyOptions.usd')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="date_format"
                label={t('settings.general.fields.dateFormat')}
              >
                <Select>
                  <Option value="YYYY-MM-DD">{t('settings.general.dateFormatOptions.yyyyMmDd')}</Option>
                  <Option value="DD/MM/YYYY">{t('settings.general.dateFormatOptions.ddMmYyyy')}</Option>
                  <Option value="MM/DD/YYYY">{t('settings.general.dateFormatOptions.mmDdYyyy')}</Option>
                </Select>
              </Form.Item>

              <Divider orientation="left">{t('settings.general.sections.printer')}</Divider>
              
              <Form.Item
                name="default_printer"
                label={t('settings.general.fields.defaultPrinter')}
                extra={t('settings.general.extras.defaultPrinter')}
              >
                <Select
                  placeholder={t('settings.general.placeholders.selectPrinter')}
                  loading={loadingPrinters}
                  showSearch
                  optionFilterProp="children"
                  notFoundContent={loadingPrinters ? t('settings.general.printerDropdown.loading') : t('settings.general.printerDropdown.noPrintersFound')}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: '8px 0' }} />
                      <Space style={{ padding: '0 8px 4px' }}>
                        <Button
                          type="text"
                          icon={<ReloadOutlined />}
                          onClick={() => loadPrinters()}
                          loading={loadingPrinters}
                        >
                          {t('settings.general.actions.refreshPrinters')}
                        </Button>
                      </Space>
                    </>
                  )}
                >
                  {printers.map((printer) => (
                    <Option key={printer.name} value={printer.name}>
                      {printer.name} {printer.isDefault ? t('settings.general.printerDropdown.defaultSuffix') : ''}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="auto_print"
                label={t('settings.general.fields.autoPrintAfterTransaction')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="print_copies"
                label={t('settings.general.fields.numberOfCopies')}
              >
                <InputNumber min={1} max={5} style={{ width: '100%' }} />
              </Form.Item>

              <Space style={{ marginTop: 16 }}>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  {t('settings.general.actions.save')}
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  {t('settings.general.actions.reset')}
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>

        {/* Database Settings */}
        <TabPane 
          tab={<span><DatabaseOutlined /> {t('settings.database.tab')}</span>} 
          key="database"
        >
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Divider orientation="left">{t('settings.database.sections.connection')}</Divider>
              
              <Form.Item
                name="db_host"
                label={t('settings.database.fields.host')}
              >
                <Input placeholder={t('settings.database.placeholders.host')} />
              </Form.Item>

              <Form.Item
                name="db_port"
                label={t('settings.database.fields.port')}
              >
                <InputNumber min={1} max={65535} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="db_name"
                label={t('settings.database.fields.name')}
              >
                <Input placeholder={t('settings.database.placeholders.name')} />
              </Form.Item>

              <Divider orientation="left">{t('settings.database.sections.connectionPool')}</Divider>

              <Form.Item
                name="db_connection_limit"
                label={t('settings.database.fields.connectionLimit')}
                extra={t('settings.database.extras.connectionLimit')}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>

              <Space style={{ marginTop: 16 }}>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  {t('settings.database.actions.save')}
                </Button>
                <Button onClick={testConnection} loading={loading}>
                  {t('settings.database.actions.testConnection')}
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>

        {/* Hardware Settings */}
        <TabPane 
          tab={<span><HddOutlined /> {t('settings.hardware.tab')}</span>} 
          key="hardware"
        >
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Divider orientation="left">{t('settings.hardware.sections.weighbridge')}</Divider>
              
              <Form.Item
                name="weighbridge_port"
                label={t('settings.hardware.fields.serialPort')}
                extra={t('settings.hardware.extras.serialPort')}
              >
                <Input placeholder={t('settings.hardware.placeholders.serialPort')} />
              </Form.Item>

              <Form.Item
                name="weighbridge_baud_rate"
                label={t('settings.hardware.fields.baudRate')}
              >
                <Select>
                  <Option value={1200}>1200</Option>
                  <Option value={2400}>2400</Option>
                  <Option value={4800}>4800</Option>
                  <Option value={9600}>9600</Option>
                  <Option value={19200}>19200</Option>
                  <Option value={38400}>38400</Option>
                  <Option value={57600}>57600</Option>
                  <Option value={115200}>115200</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="weighbridge_auto_connect"
                label={t('settings.hardware.fields.autoConnect')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Space style={{ marginTop: 16 }}>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  {t('settings.hardware.actions.save')}
                </Button>
                <Button onClick={testWeighbridge} loading={loading}>
                  {t('settings.hardware.actions.testWeighbridge')}
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>

        {/* Printer Settings */}
        <TabPane 
          tab={<span><PrinterOutlined /> {t('settings.printer.tab')}</span>} 
          key="printer"
        >
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Divider orientation="left">{t('settings.printer.sections.receiptPrinting')}</Divider>
              
              <Form.Item
                name="default_printer"
                label={t('settings.printer.fields.defaultPrinter')}
              >
                <Input placeholder={t('settings.printer.placeholders.defaultPrinter')} />
              </Form.Item>

              <Form.Item
                name="print_copies"
                label={t('settings.printer.fields.numberOfCopies')}
              >
                <InputNumber min={1} max={5} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="paper_size"
                label={t('settings.printer.fields.paperSize')}
                extra={t('settings.printer.extras.paperSize')}
              >
                <Select>
                  <Option value="80mm">{t('settings.printer.paperSizeOptions.thermal80mm')}</Option>
                  <Option value="a4_portrait">{t('settings.printer.paperSizeOptions.a4Portrait')}</Option>
                  <Option value="a5_landscape">{t('settings.printer.paperSizeOptions.a5Landscape')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="auto_print"
                label={t('settings.printer.fields.autoPrintAfterTransaction')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Divider orientation="left">{t('settings.printer.sections.pdfOptions')}</Divider>
              
              <Form.Item
                name="print_to_pdf"
                label={t('settings.printer.fields.saveReceiptsAsPdf')}
                valuePropName="checked"
                extra={t('settings.printer.extras.saveReceiptsAsPdf')}
              >
                <Switch />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.print_to_pdf !== currentValues.print_to_pdf}
              >
                {({ getFieldValue }) =>
                  getFieldValue('print_to_pdf') ? (
                    <Form.Item
                      name="pdf_save_path"
                      label={t('settings.printer.fields.pdfSaveLocation')}
                      extra={t('settings.printer.extras.pdfSaveLocation')}
                      rules={[{ required: getFieldValue('print_to_pdf'), message: t('settings.printer.validations.pdfSaveLocationRequired') }]}
                    >
                      <Input 
                        placeholder={t('settings.printer.placeholders.pdfSaveLocation')} 
                        addonAfter={
                          <Button 
                            size="small" 
                            onClick={async () => {
                              try {
                                const result = await window.electronAPI.settings?.selectFolder();
                                if (result?.success && result.path) {
                                  form.setFieldsValue({ pdf_save_path: result.path });
                                }
                              } catch (error) {
                                message.error(t('settings.printer.messages.failedToSelectFolder'));
                              }
                            }}
                          >
                            {t('settings.printer.actions.browse')}
                          </Button>
                        }
                      />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>

              <Form.Item
                name="pdf_auto_open"
                label={t('settings.printer.fields.autoOpenPdfAfterSave')}
                valuePropName="checked"
                extra={t('settings.printer.extras.autoOpenPdfAfterSave')}
              >
                <Switch />
              </Form.Item>

              <Divider orientation="left">{t('settings.printer.sections.receiptTemplate')}</Divider>
              
              <Form.Item
                name="receipt_header"
                label={t('settings.printer.fields.receiptHeader')}
              >
                <TextArea rows={3} placeholder={t('settings.printer.placeholders.receiptHeader')} />
              </Form.Item>

              <Form.Item
                name="receipt_footer"
                label={t('settings.printer.fields.receiptFooter')}
              >
                <TextArea rows={2} placeholder={t('settings.printer.placeholders.receiptFooter')} />
              </Form.Item>

              <Space style={{ marginTop: 16 }}>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  {t('settings.printer.actions.save')}
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>

        {/* Backup Settings */}
        <TabPane 
          tab={<span><HddOutlined /> {t('settings.backup.tab')}</span>} 
          key="backup"
        >
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Divider orientation="left">{t('settings.backup.sections.automaticBackup')}</Divider>
              
              <Form.Item
                name="auto_backup"
                label={t('settings.backup.fields.enableAutoBackup')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="backup_frequency"
                label={t('settings.backup.fields.backupFrequency')}
              >
                <Select>
                  <Option value="hourly">{t('settings.backup.frequencyOptions.hourly')}</Option>
                  <Option value="daily">{t('settings.backup.frequencyOptions.daily')}</Option>
                  <Option value="weekly">{t('settings.backup.frequencyOptions.weekly')}</Option>
                  <Option value="monthly">{t('settings.backup.frequencyOptions.monthly')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="backup_retention_days"
                label={t('settings.backup.fields.retentionPeriodDays')}
                extra={t('settings.backup.extras.retentionPeriodDays')}
              >
                <InputNumber min={1} max={365} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="backup_path"
                label={t('settings.backup.fields.backupDirectory')}
                extra={t('settings.backup.extras.backupDirectory')}
              >
                <Input 
                  placeholder={t('settings.backup.placeholders.backupDirectory')} 
                  addonAfter={
                    <Button 
                      size="small" 
                      onClick={async () => {
                        try {
                          const result = await window.electronAPI.settings?.selectFolder();
                          if (result?.success && result.path) {
                            form.setFieldsValue({ backup_path: result.path });
                          }
                        } catch (error) {
                          message.error(t('settings.backup.messages.failedToSelectFolder'));
                        }
                      }}
                    >
                      {t('settings.backup.actions.browse')}
                    </Button>
                  }
                />
              </Form.Item>

              <Space style={{ marginTop: 16 }}>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  {t('settings.backup.actions.save')}
                </Button>
                <Button type="default" onClick={() => message.info(t('settings.backup.messages.backupNowComingSoon'))}>
                  {t('settings.backup.actions.backupNow')}
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>

        {/* System Info */}
        <TabPane 
          tab={<span><SettingOutlined /> {t('settings.systemInfo.tab')}</span>} 
          key="system"
        >
          <Card title={t('settings.systemInfo.cardTitle')}>
            <Descriptions bordered column={1}>
              <Descriptions.Item label={t('settings.systemInfo.fields.applicationVersion')}>
                <Tag color="blue">{systemInfo.version || t('settings.systemInfo.fallbacks.appVersion')}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('settings.systemInfo.fields.electronVersion')}>
                {systemInfo.electron_version || t('settings.systemInfo.fallbacks.electronVersion')}
              </Descriptions.Item>
              <Descriptions.Item label={t('settings.systemInfo.fields.nodeVersion')}>
                {systemInfo.node_version || t('settings.systemInfo.fallbacks.nodeVersion')}
              </Descriptions.Item>
              <Descriptions.Item label={t('settings.systemInfo.fields.platform')}>
                {systemInfo.platform || t('settings.systemInfo.fallbacks.platform')}
              </Descriptions.Item>
              <Descriptions.Item label={t('settings.systemInfo.fields.databaseStatus')}>
                <Tag color="green">{systemInfo.database_status || t('settings.systemInfo.fallbacks.databaseStatus')}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('settings.systemInfo.fields.databaseVersion')}>
                {systemInfo.database_version || t('settings.systemInfo.fallbacks.databaseVersion')}
              </Descriptions.Item>
              <Descriptions.Item label={t('settings.systemInfo.fields.databaseName')}>
                {settings.db_name || t('settings.systemInfo.fallbacks.databaseName')}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Space>
              <Button onClick={loadSystemInfo} icon={<ReloadOutlined />}>
                {t('settings.systemInfo.actions.refresh')}
              </Button>
              <Button type="primary" onClick={() => message.info(t('settings.systemInfo.messages.exportLogsComingSoon'))}>
                {t('settings.systemInfo.actions.exportLogs')}
              </Button>
            </Space>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Settings;
