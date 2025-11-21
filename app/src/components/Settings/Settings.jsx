import React, { useState, useEffect } from 'react';
import { Tabs, Card, Form, Input, InputNumber, Select, Button, Switch, message, Space, Divider, Descriptions, Tag } from 'antd';
import { SaveOutlined, ReloadOutlined, DatabaseOutlined, PrinterOutlined, HddOutlined, SettingOutlined, ShopOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const Settings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});
  const [systemInfo, setSystemInfo] = useState({});

  useEffect(() => {
    loadSettings();
    loadSystemInfo();
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
    } catch (error) {
      message.warning('Settings updated locally');
      setSettings(values);
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
        message.success('Database connection successful!');
      } else {
        message.error('Database connection failed: ' + result.message);
      }
    } catch (error) {
      message.error('Connection test failed');
    } finally {
      setLoading(false);
    }
  };

  const testWeighbridge = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.weighbridge?.connect();
      if (result?.success) {
        message.success('Weighbridge connected successfully!');
      } else {
        message.warning('Weighbridge connection not implemented yet');
      }
    } catch (error) {
      message.warning('Weighbridge test not available');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Tabs defaultActiveKey="company" type="card">
        {/* Company Details */}
        <TabPane 
          tab={<span><ShopOutlined /> Company</span>} 
          key="company"
        >
          <Card title="Company Details">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Form.Item
                name="company_name"
                label="Company Name"
                rules={[{ required: true, message: 'Please enter company name' }]}
                extra="This will appear on receipts and permits"
              >
                <Input placeholder="e.g., Kilang Beras Sdn Bhd" />
              </Form.Item>

              <Form.Item
                name="company_address"
                label="Company Address"
                rules={[{ required: true, message: 'Please enter company address' }]}
                extra="Full address for receipts and official documents"
              >
                <TextArea 
                  rows={3} 
                  placeholder="e.g., No. 123, Jalan Paddy,&#10;Taman Industri,&#10;12345 Sungai Besar, Selangor"
                />
              </Form.Item>

              <Form.Item
                name="company_registration_no"
                label="Company Registration No."
                rules={[{ required: true, message: 'Please enter company registration number' }]}
                extra="SSM registration number (e.g., ROC123456-A)"
              >
                <Input placeholder="e.g., ROC123456-A" />
              </Form.Item>

              <Form.Item
                name="paddy_purchasing_licence_no"
                label="Paddy Purchasing Licence No."
                rules={[{ required: true, message: 'Please enter paddy purchasing licence number' }]}
                extra="Government-issued licence for paddy purchasing"
              >
                <Input placeholder="e.g., LKP-01-2024-001" />
              </Form.Item>

              <Space style={{ marginTop: 16 }}>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  Save Settings
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  Reset
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>

        {/* General Settings */}
        <TabPane 
          tab={<span><SettingOutlined /> General</span>} 
          key="general"
        >
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Divider orientation="left">Application</Divider>
              <Form.Item
                name="app_name"
                label="Application Name"
              >
                <Input placeholder="Paddy Collection Center" />
              </Form.Item>

              <Form.Item
                name="language"
                label="Language"
              >
                <Select>
                  <Option value="en">English</Option>
                  <Option value="ms">Bahasa Malaysia</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="currency"
                label="Currency"
              >
                <Select>
                  <Option value="MYR">Malaysian Ringgit (MYR)</Option>
                  <Option value="USD">US Dollar (USD)</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="date_format"
                label="Date Format"
              >
                <Select>
                  <Option value="YYYY-MM-DD">YYYY-MM-DD (2024-11-07)</Option>
                  <Option value="DD/MM/YYYY">DD/MM/YYYY (07/11/2024)</Option>
                  <Option value="MM/DD/YYYY">MM/DD/YYYY (11/07/2024)</Option>
                </Select>
              </Form.Item>

              <Space style={{ marginTop: 16 }}>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  Save Settings
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  Reset
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>

        {/* Database Settings */}
        <TabPane 
          tab={<span><DatabaseOutlined /> Database</span>} 
          key="database"
        >
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Divider orientation="left">Connection</Divider>
              
              <Form.Item
                name="db_host"
                label="Database Host"
              >
                <Input placeholder="localhost" />
              </Form.Item>

              <Form.Item
                name="db_port"
                label="Database Port"
              >
                <InputNumber min={1} max={65535} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="db_name"
                label="Database Name"
              >
                <Input placeholder="paddy_collection_db" />
              </Form.Item>

              <Divider orientation="left">Connection Pool</Divider>

              <Form.Item
                name="db_connection_limit"
                label="Connection Limit"
                extra="Maximum number of connections in the pool"
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>

              <Space style={{ marginTop: 16 }}>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  Save Settings
                </Button>
                <Button onClick={testConnection} loading={loading}>
                  Test Connection
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>

        {/* Hardware Settings */}
        <TabPane 
          tab={<span><HddOutlined /> Hardware</span>} 
          key="hardware"
        >
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Divider orientation="left">Weighbridge</Divider>
              
              <Form.Item
                name="weighbridge_port"
                label="Serial Port"
                extra="COM port for weighbridge (Windows: COM3, Linux: /dev/ttyUSB0)"
              >
                <Input placeholder="COM3" />
              </Form.Item>

              <Form.Item
                name="weighbridge_baud_rate"
                label="Baud Rate"
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
                label="Auto Connect"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Space style={{ marginTop: 16 }}>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  Save Settings
                </Button>
                <Button onClick={testWeighbridge} loading={loading}>
                  Test Weighbridge
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>

        {/* Printer Settings */}
        <TabPane 
          tab={<span><PrinterOutlined /> Printer</span>} 
          key="printer"
        >
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Divider orientation="left">Receipt Printing</Divider>
              
              <Form.Item
                name="default_printer"
                label="Default Printer"
              >
                <Input placeholder="Epson LQ-310" />
              </Form.Item>

              <Form.Item
                name="print_copies"
                label="Number of Copies"
              >
                <InputNumber min={1} max={5} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="paper_size"
                label="Paper Size"
                extra="Select paper size for receipts"
              >
                <Select>
                  <Option value="80mm">80mm Thermal (Default)</Option>
                  <Option value="a4_portrait">A4 Portrait</Option>
                  <Option value="a5_landscape">A5 Landscape</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="auto_print"
                label="Auto Print After Transaction"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Divider orientation="left">PDF Options</Divider>
              
              <Form.Item
                name="print_to_pdf"
                label="Save Receipts as PDF"
                valuePropName="checked"
                extra="Automatically save receipts as PDF files instead of printing"
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
                      label="PDF Save Location"
                      extra="Folder where PDF receipts will be saved"
                      rules={[{ required: getFieldValue('print_to_pdf'), message: 'Please specify PDF save location' }]}
                    >
                      <Input 
                        placeholder="e.g., C:\Documents\Receipts or ~/Documents/Receipts" 
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
                                message.error('Failed to select folder');
                              }
                            }}
                          >
                            Browse
                          </Button>
                        }
                      />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>

              <Form.Item
                name="pdf_auto_open"
                label="Auto Open PDF After Save"
                valuePropName="checked"
                extra="Automatically open PDF file after saving"
              >
                <Switch />
              </Form.Item>

              <Divider orientation="left">Receipt Template</Divider>
              
              <Form.Item
                name="receipt_header"
                label="Receipt Header"
              >
                <TextArea rows={3} placeholder="Company name and address" />
              </Form.Item>

              <Form.Item
                name="receipt_footer"
                label="Receipt Footer"
              >
                <TextArea rows={2} placeholder="Thank you message" />
              </Form.Item>

              <Space style={{ marginTop: 16 }}>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  Save Settings
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>

        {/* Backup Settings */}
        <TabPane 
          tab={<span><HddOutlined /> Backup</span>} 
          key="backup"
        >
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Divider orientation="left">Automatic Backup</Divider>
              
              <Form.Item
                name="auto_backup"
                label="Enable Auto Backup"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="backup_frequency"
                label="Backup Frequency"
              >
                <Select>
                  <Option value="hourly">Every Hour</Option>
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                  <Option value="monthly">Monthly</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="backup_retention_days"
                label="Retention Period (Days)"
                extra="Number of days to keep backup files"
              >
                <InputNumber min={1} max={365} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="backup_path"
                label="Backup Directory"
              >
                <Input placeholder="./backups" />
              </Form.Item>

              <Space style={{ marginTop: 16 }}>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                  Save Settings
                </Button>
                <Button type="default" onClick={() => message.info('Backup now feature coming soon')}>
                  Backup Now
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>

        {/* System Info */}
        <TabPane 
          tab={<span><SettingOutlined /> System Info</span>} 
          key="system"
        >
          <Card title="System Information">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Application Version">
                <Tag color="blue">{systemInfo.version || '1.0.0'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Electron Version">
                {systemInfo.electron_version || '27.1.3'}
              </Descriptions.Item>
              <Descriptions.Item label="Node.js Version">
                {systemInfo.node_version || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Platform">
                {systemInfo.platform || 'darwin'}
              </Descriptions.Item>
              <Descriptions.Item label="Database Status">
                <Tag color="green">{systemInfo.database_status || 'Connected'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Database Version">
                {systemInfo.database_version || '8.0'}
              </Descriptions.Item>
              <Descriptions.Item label="Database Name">
                {settings.db_name || 'paddy_collection_db'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Space>
              <Button onClick={loadSystemInfo} icon={<ReloadOutlined />}>
                Refresh
              </Button>
              <Button type="primary" onClick={() => message.info('Export logs feature coming soon')}>
                Export Logs
              </Button>
            </Space>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Settings;
