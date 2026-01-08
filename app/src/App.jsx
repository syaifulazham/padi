import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout, theme, App as AntApp } from 'antd';
import Dashboard from './components/Dashboard/Dashboard';
import Farmers from './components/Farmers/Farmers';
import Manufacturers from './components/Manufacturers/Manufacturers';
import Purchases from './components/Purchases/Purchases';
import PurchaseHistory from './components/Purchases/PurchaseHistory';
import Payment from './components/Purchases/Payment';
import Sales from './components/Sales/Sales';
import SalesHistory from './components/Sales/SalesHistory';
import Inventory from './components/Inventory/Inventory';
import Stockpiles from './components/Stockpiles/Stockpiles';
import StockMovements from './components/Stockpiles/StockMovements';
import Reports from './components/Reports/Reports';
import Settings from './components/Settings/Settings';
import SeasonConfig from './components/Settings/SeasonConfig';
import ProductConfig from './components/Settings/ProductConfig';
import BackupRestore from './components/Settings/BackupRestore';
import UserManagement from './components/Users/UserManagement';
import AppLayout from './components/Layout/AppLayout';
import Home from './components/Home/Home';
import HomeSetupGuide from './components/Home/HomeSetupGuide';
import HomeMenuGuide from './components/Home/HomeMenuGuide';
import Login from './components/Auth/Login';
import SetupAdmin from './components/Auth/SetupAdmin';
import DatabaseSetup from './components/Setup/DatabaseSetup';
import { useI18n } from './i18n/I18nProvider';
import { useAuth } from './contexts/AuthContext';

const { Content } = Layout;

function App() {
  const [dbConnected, setDbConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const { t } = useI18n();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // Test database connection on startup
    testConnection();
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const result = await window.electronAPI.auth.hasUsers();
      if (result.success) {
        setNeedsSetup(!result.hasUsers);
      }
    } catch (error) {
      console.error('Error checking setup:', error);
    } finally {
      setCheckingSetup(false);
    }
  };

  const handleSetupComplete = () => {
    setNeedsSetup(false);
    checkSetup();
  };

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

  if (loading || authLoading || checkingSetup) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        {t('app.loading')}
      </div>
    );
  }

  if (needsSetup) {
    return <SetupAdmin onSetupComplete={handleSetupComplete} />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (!dbConnected) {
    return (
      <DatabaseSetup 
        onConnectionSuccess={() => {
          setDbConnected(true);
          testConnection();
        }}
      />
    );
  }

  // Keep old error UI as fallback (shouldn't reach here)
  if (false && !dbConnected) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        padding: '20px'
      }}>
        <h2 style={{ color: '#ff4d4f' }}>{t('app.dbConnectionFailedTitle')}</h2>
        <p>{t('app.dbConnectionFailedBody')}</p>
        <button 
          onClick={testConnection}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          {t('app.retryConnection')}
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
      <AntApp message={{ bottom: 50, top: undefined, duration: 3, maxCount: 3 }}>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home/setup" element={<HomeSetupGuide />} />
            <Route path="/home/menus" element={<HomeMenuGuide />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/farmers" element={<Farmers />} />
            <Route path="/manufacturers" element={<Manufacturers />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/purchases/history" element={<PurchaseHistory />} />
            <Route path="/purchases/payment" element={<Payment />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/sales/history" element={<SalesHistory />} />
            <Route path="/stockpiles" element={<Stockpiles />} />
            <Route path="/stockpiles/movements" element={<StockMovements />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reports/*" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/seasons" element={<SeasonConfig />} />
            <Route path="/settings/products" element={<ProductConfig />} />
            <Route path="/settings/backup" element={<BackupRestore />} />
            <Route path="/settings/users" element={<UserManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
