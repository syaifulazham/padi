import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Alert, Space, Divider, Typography, Spin } from 'antd';
import { DatabaseOutlined, CheckCircleOutlined, CloseCircleOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const DatabaseSetup = ({ onConnectionSuccess }) => {
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [configDetails, setConfigDetails] = useState(null);

  useEffect(() => {
    // Load current configuration
    window.electron.getDbConfig().then((config) => {
      setConfigDetails(config);
      form.setFieldsValue({
        host: config.dbHost || 'localhost',
        port: config.dbPort || '3306',
        user: config.dbUser || 'root',
        password: '',
        database: config.dbName || 'paddy_collection_db'
      });
    });
  }, [form]);

  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields();
      setTesting(true);
      setTestResult(null);

      const result = await window.electron.testDbConnection({
        host: values.host,
        port: values.port,
        user: values.user,
        password: values.password,
        database: values.database
      });

      setTestResult(result);
      setTesting(false);
    } catch (error) {
      setTesting(false);
      console.error('Validation failed:', error);
    }
  };

  const handleSaveAndReconnect = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const result = await window.electron.saveDbConfig({
        host: values.host,
        port: values.port,
        user: values.user,
        password: values.password,
        database: values.database
      });

      if (result.success) {
        setTestResult({ success: true, message: 'Configuration saved! Reconnecting...' });
        
        // Wait a moment then check connection
        setTimeout(async () => {
          const status = await window.electron.getDbConnectionStatus();
          if (status.connected) {
            if (onConnectionSuccess) {
              onConnectionSuccess();
            }
          } else {
            setTestResult({ 
              success: false, 
              message: 'Configuration saved but connection failed: ' + status.error 
            });
          }
          setSaving(false);
        }, 2000);
      } else {
        setTestResult({ success: false, message: result.error });
        setSaving(false);
      }
    } catch (error) {
      setSaving(false);
      console.error('Validation failed:', error);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          maxWidth: 600, 
          width: '100%',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <DatabaseOutlined style={{ fontSize: 48, color: '#667eea', marginBottom: 10 }} />
          <Title level={2} style={{ margin: 0 }}>Database Configuration</Title>
          <Text type="secondary">Configure your MySQL database connection</Text>
        </div>

        {configDetails && (
          <Alert
            message="Current Configuration Issue"
            description={
              <div>
                <Paragraph style={{ marginBottom: 8 }}>
                  <strong>.env file loaded from:</strong><br />
                  <code style={{ fontSize: 11 }}>{configDetails.loadedPath}</code>
                </Paragraph>
                <Paragraph style={{ marginBottom: 0 }}>
                  <strong>Current User:</strong> {configDetails.dbUser || 'NOT SET'}<br />
                  <strong>Password:</strong> {configDetails.hasPassword ? 'SET' : 'NOT SET'}<br />
                  <strong>Error:</strong> {configDetails.error || 'Connection failed'}
                </Paragraph>
              </div>
            }
            type="warning"
            style={{ marginBottom: 20 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            host: 'localhost',
            port: '3306',
            database: 'paddy_collection_db'
          }}
        >
          <Form.Item
            label="Host"
            name="host"
            rules={[{ required: true, message: 'Please enter database host' }]}
          >
            <Input placeholder="localhost" />
          </Form.Item>

          <Form.Item
            label="Port"
            name="port"
            rules={[{ required: true, message: 'Please enter database port' }]}
          >
            <Input placeholder="3306" />
          </Form.Item>

          <Form.Item
            label="Username"
            name="user"
            rules={[{ required: true, message: 'Please enter database username' }]}
          >
            <Input placeholder="root" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter database password' }]}
          >
            <Input.Password placeholder="Enter your MySQL password" />
          </Form.Item>

          <Form.Item
            label="Database Name"
            name="database"
            rules={[{ required: true, message: 'Please enter database name' }]}
          >
            <Input placeholder="paddy_collection_db" />
          </Form.Item>

          {testResult && (
            <Alert
              message={testResult.success ? "Connection Successful!" : "Connection Failed"}
              description={testResult.message}
              type={testResult.success ? "success" : "error"}
              icon={testResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleTestConnection}
              loading={testing}
              size="large"
            >
              Test Connection
            </Button>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveAndReconnect}
              loading={saving}
              disabled={!testResult?.success}
              size="large"
            >
              Save & Reconnect
            </Button>
          </Space>
        </Form>

        <Divider />

        <div style={{ fontSize: 12, color: '#666' }}>
          <Paragraph style={{ marginBottom: 8 }}>
            <strong>Troubleshooting:</strong>
          </Paragraph>
          <ul style={{ marginLeft: 20, marginBottom: 0 }}>
            <li>Verify MySQL service is running (Windows Services)</li>
            <li>Check username and password are correct</li>
            <li>Ensure database exists: <code>paddy_collection_db</code></li>
            <li>Run <code>database-setup\setup_database.bat</code> if needed</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default DatabaseSetup;
