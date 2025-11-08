import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout, theme } from 'antd';
import Dashboard from './components/Dashboard/Dashboard';
import Farmers from './components/Farmers/Farmers';
import Manufacturers from './components/Manufacturers/Manufacturers';
import Purchases from './components/Purchases/Purchases';
import PurchaseHistory from './components/Purchases/PurchaseHistory';
import Sales from './components/Sales/Sales';
import Inventory from './components/Inventory/Inventory';
import Reports from './components/Reports/Reports';
import Settings from './components/Settings/Settings';
import AppLayout from './components/Layout/AppLayout';

const { Content } = Layout;

function App() {
  const [dbConnected, setDbConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Test database connection on startup
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const result = await window.electronAPI.testConnection();
      setDbConnected(result.success);
      if (result.success) {
        console.log('✅ Database connected');
      } else {
        console.error('❌ Database connection failed:', result.message);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setDbConnected(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!dbConnected) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        padding: '20px'
      }}>
        <h2 style={{ color: '#ff4d4f' }}>❌ Database Connection Failed</h2>
        <p>Please check your database configuration and ensure MySQL is running.</p>
        <button 
          onClick={testConnection}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#52c41a',
          borderRadius: 4,
        },
      }}
    >
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/farmers" element={<Farmers />} />
          <Route path="/manufacturers" element={<Manufacturers />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/purchases/history" element={<PurchaseHistory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </ConfigProvider>
  );
}

export default App;
