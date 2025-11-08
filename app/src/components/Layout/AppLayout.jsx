import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  InboxOutlined,
  BarChartOutlined,
  SettingOutlined,
  BuildOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const AppLayout = ({ children }) => {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Left sidebar - Management & Configuration
  const leftMenuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/farmers',
      icon: <TeamOutlined />,
      label: 'Farmers',
    },
    {
      key: '/manufacturers',
      icon: <BuildOutlined />,
      label: 'Manufacturers',
    },
    {
      key: '/inventory',
      icon: <InboxOutlined />,
      label: 'Inventory',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  // Right sidebar - Transactions
  const rightMenuItems = [
    {
      key: 'purchases-group',
      icon: <ShoppingCartOutlined />,
      label: 'Purchases',
      children: [
        {
          key: '/purchases',
          icon: <PlusCircleOutlined />,
          label: 'Weigh-In',
        },
        {
          key: '/purchases/history',
          icon: <UnorderedListOutlined />,
          label: 'History',
        },
      ],
    },
    {
      key: '/sales',
      icon: <ShopOutlined />,
      label: 'Sales',
    },
  ];

  // Flatten menu items for header title lookup
  const flattenMenuItems = (items) => {
    return items.reduce((acc, item) => {
      if (item.children) {
        return [...acc, item, ...flattenMenuItems(item.children)];
      }
      return [...acc, item];
    }, []);
  };

  const allMenuItems = [...flattenMenuItems(leftMenuItems), ...flattenMenuItems(rightMenuItems)];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Left Sidebar - Management */}
      <Sider 
        collapsible 
        collapsed={leftCollapsed} 
        onCollapse={setLeftCollapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 999,
        }}
      >
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: leftCollapsed ? '16px' : '20px',
          fontWeight: 'bold',
          padding: '0 20px'
        }}>
          {leftCollapsed ? '🌾' : '🌾 Paddy Center'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={leftMenuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      {/* Main Content Area */}
      <Layout style={{ 
        marginLeft: leftCollapsed ? 80 : 200,
        marginRight: rightCollapsed ? 80 : 200,
        transition: 'margin 0.2s'
      }}>
        <Header style={{
          padding: '0 20px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: 0 }}>
            {allMenuItems.find(item => item.key === location.pathname)?.label || 'Dashboard'}
          </h2>
          <div>
            <span>Welcome, Admin</span>
          </div>
        </Header>
        <Content style={{
          margin: '24px 16px',
          padding: 24,
          minHeight: 280,
          background: '#fff',
        }}>
          {children}
        </Content>
      </Layout>

      {/* Right Sidebar - Transactions */}
      <Sider 
        collapsible 
        collapsed={rightCollapsed} 
        onCollapse={setRightCollapsed}
        reverseArrow
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 999,
        }}
      >
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: rightCollapsed ? '16px' : '18px',
          fontWeight: 'bold',
          padding: '0 10px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {rightCollapsed ? '💼' : '💼 Transactions'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={rightMenuItems}
          onClick={handleMenuClick}
        />
      </Sider>
    </Layout>
  );
};

export default AppLayout;
