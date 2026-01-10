import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import sparrowLogo from '../../img/sparrow.png';

const SetupAdmin = ({ onSetupComplete }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleCustomSetup = async (values) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.users.create({
        username: values.username,
        password: values.password,
        full_name: values.full_name,
        role: 'admin'
      });

      if (result.success) {
        message.success('Admin user created successfully!');
        onSetupComplete();
      } else {
        message.error(result.message || 'Failed to create admin user');
      }
    } catch (error) {
      console.error('Setup error:', error);
      message.error('An error occurred during setup');
    } finally {
      setLoading(false);
    }
  };

  const handleDefaultSetup = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.users.create({
        username: 'admin',
        password: 'admin123',
        full_name: 'Administrator',
        role: 'admin'
      });

      if (result.success) {
        message.success('Default admin user created successfully!');
        onSetupComplete();
      } else {
        message.error(result.message || 'Failed to create default admin user');
      }
    } catch (error) {
      console.error('Setup error:', error);
      message.error('An error occurred during setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 500,
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          borderRadius: 8
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ marginBottom: 20 }}>
            <img 
              src={sparrowLogo} 
              alt="Sparrow Logo" 
              style={{ width: 80, height: 80, objectFit: 'contain' }} 
            />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, marginBottom: 8 }}>
            First Time Setup
          </h1>
          <p style={{ color: '#666', margin: 0 }}>Create an administrator account</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Option 1: Create Custom Admin</h3>
          <Form
            form={form}
            name="setup"
            onFinish={handleCustomSetup}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="full_name"
              rules={[
                {
                  required: true,
                  message: 'Please enter full name'
                }
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#999' }} />}
                placeholder="Full Name"
              />
            </Form.Item>

            <Form.Item
              name="username"
              rules={[
                {
                  required: true,
                  message: 'Please enter username'
                },
                {
                  min: 3,
                  message: 'Username must be at least 3 characters'
                }
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#999' }} />}
                placeholder="Username"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: 'Please enter password'
                },
                {
                  min: 6,
                  message: 'Password must be at least 6 characters'
                }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#999' }} />}
                placeholder="Password"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirm"
              dependencies={['password']}
              rules={[
                {
                  required: true,
                  message: 'Please confirm password'
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#999' }} />}
                placeholder="Confirm Password"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                icon={<SafetyOutlined />}
                style={{ height: 45 }}
              >
                Create Custom Admin
              </Button>
            </Form.Item>
          </Form>
        </div>

        <Divider>OR</Divider>

        <div>
          <h3 style={{ marginBottom: 16 }}>Option 2: Use Default Admin</h3>
          <div style={{ 
            background: '#f5f5f5', 
            padding: 16, 
            borderRadius: 4, 
            marginBottom: 16 
          }}>
            <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
              <strong>Username:</strong> admin<br />
              <strong>Password:</strong> admin123
            </p>
          </div>
          <Button
            type="default"
            onClick={handleDefaultSetup}
            loading={loading}
            block
            icon={<SafetyOutlined />}
            style={{ height: 45 }}
          >
            Create Default Admin
          </Button>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#999' }}>
          You can change credentials later in User Management
        </div>
      </Card>
    </div>
  );
};

export default SetupAdmin;
