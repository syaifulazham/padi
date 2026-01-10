import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import sparrowLogo from '../../img/sparrow.png';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password);
      
      if (result.success) {
        message.success('Login successful!');
      } else {
        message.error(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('An error occurred during login');
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
          maxWidth: 400,
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
            Paddy Collection
          </h1>
          <p style={{ color: '#666', margin: 0 }}>Sign in to your account</p>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[
              {
                required: true,
                message: 'Please enter your username'
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
                message: 'Please enter your password'
              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder="Password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={<LoginOutlined />}
              style={{ height: 45 }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#999' }}>
          Default credentials: admin / admin123
        </div>
      </Card>
    </div>
  );
};

export default Login;
