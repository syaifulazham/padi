import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Menu, Space, Statistic, Spin, Tag, Popover, Divider, Modal, Form, InputNumber, message, Button } from 'antd';
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
  DollarOutlined,
  EditOutlined,
  CarOutlined,
  SwapOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useI18n } from '../../i18n/I18nProvider';
import bluishPaddyField from '../../img/bluish-paddy-field.png';

const { Header, Sider, Content } = Layout;

const AppLayout = ({ children }) => {
  const MODE_STORAGE_KEY = 'app_mode';

  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [appMode, setAppMode] = useState('management');
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSales: 0,
    inventory: 0,
    loading: true
  });
  const [activeSeason, setActiveSeason] = useState(null);
  const [productPrices, setProductPrices] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [previewPricePerKg, setPreviewPricePerKg] = useState(0);
  const [priceForm] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    try {
      const saved = window.localStorage?.getItem(MODE_STORAGE_KEY);
      if (saved === 'operation' || saved === 'management') {
        setAppMode(saved);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleMode = () => {
    setAppMode((prev) => {
      const next = prev === 'operation' ? 'management' : 'operation';
      try {
        window.localStorage?.setItem(MODE_STORAGE_KEY, next);
      } catch (e) {
        // ignore
      }
      window.dispatchEvent(new Event('mode-changed'));
      return next;
    });
  };

  // Fetch product prices for active season
  const fetchProductPrices = useCallback(async (seasonId) => {
    if (!seasonId) {
      setProductPrices([]);
      return;
    }
    
    try {
      setLoadingPrices(true);
      const result = await window.electronAPI.seasonProductPrices?.getSeasonProductPrices(seasonId);
      if (result?.success) {
        setProductPrices(result.data || []);
      } else {
        setProductPrices([]);
      }
    } catch (error) {
      console.error('Error fetching product prices:', error);
      setProductPrices([]);
    } finally {
      setLoadingPrices(false);
    }
  }, []);

  // Handle price update
  const handlePriceUpdate = async () => {
    try {
      const values = await priceForm.validateFields();
      
      if (!activeSeason || !selectedProduct) {
        message.error('Missing season or product information');
        return;
      }

      const priceValue = parseFloat(values.price_per_ton);
      if (!priceValue || priceValue <= 0) {
        message.error('Please enter a valid price');
        return;
      }

      const result = await window.electronAPI.seasonProductPrices?.updateProductPrice(
        activeSeason.season_id,
        selectedProduct.product_id,
        priceValue,
        'Price updated from navbar',
        1 // TODO: Get from auth
      );

      if (result?.success) {
        message.success(`${selectedProduct.product_name} price updated successfully!`);
        setPriceModalOpen(false);
        priceForm.resetFields();
        setPreviewPricePerKg(0);
        
        // Refresh product prices
        fetchProductPrices(activeSeason.season_id);
        
        // Dispatch event to refresh other components
        window.dispatchEvent(new Event('season-changed'));
      } else {
        message.error(`Failed to update price: ${result?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating price:', error);
      message.error(`Failed to update price: ${error.message || 'Unknown error'}`);
    }
  };

  // Fetch active season
  useEffect(() => {
    const fetchActiveSeason = async () => {
      try {
        const result = await window.electronAPI.seasons?.getActive();
        if (result?.success) {
          setActiveSeason(result.data);
          // Fetch product prices for this season
          fetchProductPrices(result.data.season_id);
        } else {
          setActiveSeason(null);
          setProductPrices([]);
        }
      } catch (error) {
        console.error('Error fetching active season:', error);
      }
    };
    
    fetchActiveSeason();
    
    // Listen for season changes
    const handleSeasonChange = () => {
      fetchActiveSeason();
    };
    
    window.addEventListener('season-changed', handleSeasonChange);
    
    return () => {
      window.removeEventListener('season-changed', handleSeasonChange);
    };
  }, [fetchProductPrices]);

  // Create a stable fetchStats function using useCallback
  const fetchStats = useCallback(async () => {
    try {
      console.log('Fetching stats for season:', activeSeason?.season_id || 'all');
      
      // Get season ID if active season exists
      const seasonId = activeSeason?.season_id || null;
      
      const [purchaseResult, salesResult] = await Promise.all([
        window.electronAPI.purchases?.getTotalStats(seasonId),
        window.electronAPI.sales?.getTotalStats(seasonId)
      ]);

      console.log('Purchase result:', purchaseResult);
      console.log('Sales result:', salesResult);

      const purchaseWeight = purchaseResult?.success ? parseFloat(purchaseResult.data.total_net_weight_kg) : 0;
      const salesWeight = salesResult?.success ? parseFloat(salesResult.data.total_net_weight_kg) : 0;
      const inventoryWeight = purchaseWeight - salesWeight;

      console.log('Setting stats:', { purchaseWeight, salesWeight, inventoryWeight });

      setStats({
        totalPurchases: purchaseWeight,
        totalSales: salesWeight,
        inventory: inventoryWeight,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [activeSeason]);

  // Fetch statistics on mount and when active season changes
  useEffect(() => {
    console.log('Active season changed, fetching stats:', activeSeason);
    fetchStats();
  }, [activeSeason, fetchStats]);

  // Set up periodic refresh and event listeners
  useEffect(() => {
    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      console.log('Periodic refresh triggered');
      fetchStats();
    }, 30000);
    
    // Listen for transaction completion events
    const handleTransactionCompleted = () => {
      console.log('Transaction completed event received, refreshing stats');
      fetchStats();
    };
    
    window.addEventListener('transaction-completed', handleTransactionCompleted);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('transaction-completed', handleTransactionCompleted);
    };
  }, [fetchStats]);

  const leftMenuItems = (() => {
    const items = [
      {
        key: '/',
        icon: <HomeOutlined />,
        label: t('menu.home'),
      },
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: t('menu.dashboard'),
      },
      {
        key: '/farmers',
        icon: <TeamOutlined />,
        label: t('menu.farmers'),
      },
      {
        key: '/manufacturers',
        icon: <BuildOutlined />,
        label: t('menu.manufacturers'),
      },
      {
        key: 'reports-group',
        icon: <BarChartOutlined />,
        label: t('menu.reports'),
        children: [
          {
            key: '/reports/purchases',
            icon: <ShoppingCartOutlined />,
            label: t('menu.purchaseReport'),
          },
          {
            key: '/reports/sales',
            icon: <DollarOutlined />,
            label: t('menu.salesReport'),
          },
          {
            key: '/reports/lorry',
            icon: <CarOutlined />,
            label: t('menu.lorryReport'),
          },
        ],
      },
      {
        key: 'settings-group',
        icon: <SettingOutlined />,
        label: t('menu.settings'),
        children: [
          {
            key: '/settings',
            icon: <SettingOutlined />,
            label: t('menu.general'),
          },
          {
            key: '/settings/seasons',
            icon: <DashboardOutlined />,
            label: t('menu.seasonConfig'),
          },
          {
            key: '/settings/products',
            icon: <InboxOutlined />,
            label: t('menu.productConfig'),
          },
          {
            key: '/settings/backup',
            icon: <InboxOutlined />,
            label: t('menu.backupRestore'),
          },
        ],
      },
    ];

    if (appMode === 'operation') {
      return items.filter((item) => !['/farmers', '/manufacturers', 'settings-group'].includes(item.key));
    }

    return items;
  })();

  // Right sidebar - Transactions
  const rightMenuItems = [
    {
      key: 'purchases-group',
      icon: <ShoppingCartOutlined />,
      label: t('menu.purchases'),
      children: [
        {
          key: '/purchases',
          icon: <PlusCircleOutlined />,
          label: t('menu.weighIn'),
        },
        {
          key: '/purchases/history',
          icon: <UnorderedListOutlined />,
          label: t('menu.history'),
        },
        {
          key: '/purchases/payment',
          icon: <DollarOutlined />,
          label: t('menu.payment'),
        },
      ],
    },
    {
      key: 'sales-group',
      icon: <ShopOutlined />,
      label: t('menu.sales'),
      children: [
        {
          key: '/sales',
          icon: <PlusCircleOutlined />,
          label: t('menu.weighIn'),
        },
        {
          key: '/sales/history',
          icon: <UnorderedListOutlined />,
          label: t('menu.history'),
        },
      ],
    },
    {
      key: '/stockpiles',
      icon: <InboxOutlined />,
      label: t('menu.stockpiles'),
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
        {/* First Navigation Bar */}
        <Header style={{
          padding: '0 20px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          height: '80px',
          position: 'fixed',
          top: 0,
          left: leftCollapsed ? 80 : 200,
          right: rightCollapsed ? 80 : 200,
          zIndex: 998,
          transition: 'left 0.2s, right 0.2s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <h2 style={{ margin: 0 }}>
              {allMenuItems.find(item => item.key === location.pathname)?.label || t('menu.dashboard')}
            </h2>
            {activeSeason && (
              <>
                <div style={{ 
                  height: 40, 
                  width: 1, 
                  background: '#d9d9d9'
                }} />
                <div style={{ padding: '0 20px' }}>
                  <Statistic
                    title={<span style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>{t('topNav.season')}</span>}
                    value={`${activeSeason.season_number}/${activeSeason.year}`}
                    valueStyle={{ fontSize: 18, color: '#262626', fontWeight: 600 }}
                  />
                </div>
              </>
            )}
          </div>
          
          {/* Statistics Bar */}
          <div style={{ 
            marginRight: 'auto', 
            marginLeft: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 0
          }}>
            {stats.loading ? (
              <Spin size="small" />
            ) : (
              <>
                <div style={{ 
                  height: 40, 
                  width: 1, 
                  background: '#d9d9d9',
                  margin: '0 4px'
                }} />
                
                <div style={{ padding: '0 20px' }}>
                  <Statistic
                    title={<span style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>{t('topNav.totalPurchases')}</span>}
                    value={stats.totalPurchases}
                    suffix="kg"
                    precision={2}
                    valueStyle={{ fontSize: 18, color: '#262626', fontWeight: 600 }}
                  />
                </div>
                
                <div style={{ 
                  height: 40, 
                  width: 1, 
                  background: '#d9d9d9',
                  margin: '0 4px'
                }} />
                
                <div style={{ padding: '0 20px' }}>
                  <Statistic
                    title={<span style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>{t('topNav.inInventory')}</span>}
                    value={stats.inventory}
                    suffix="kg"
                    precision={2}
                    valueStyle={{ fontSize: 18, color: '#262626', fontWeight: 600 }}
                  />
                </div>
                
                <div style={{ 
                  height: 40, 
                  width: 1, 
                  background: '#d9d9d9',
                  margin: '0 4px'
                }} />
                
                <div style={{ padding: '0 20px' }}>
                  <Statistic
                    title={<span style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>{t('topNav.soldToManufacturers')}</span>}
                    value={stats.totalSales}
                    suffix="kg"
                    precision={2}
                    valueStyle={{ fontSize: 18, color: '#262626', fontWeight: 600 }}
                  />
                </div>
              </>
            )}
          </div>
          
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span>{t('topNav.welcome')}</span>
              <Popover
                placement="bottomRight"
                content={`${t('topNav.mode')} ${appMode === 'operation' ? t('topNav.modes.operation') : t('topNav.modes.management')}`}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<SwapOutlined />}
                  onClick={toggleMode}
                />
              </Popover>
            </div>
          </div>
        </Header>

        {/* Second Navigation Bar - Product Prices */}
        <Header style={{
          padding: '0 20px',
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e8e8e8',
          height: '50px',
          position: 'fixed',
          top: '80px',
          left: leftCollapsed ? 80 : 200,
          right: rightCollapsed ? 80 : 200,
          zIndex: 997,
          transition: 'left 0.2s, right 0.2s',
          overflow: 'hidden'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 15,
            flex: 1,
            overflow: 'hidden'
          }}>
            {activeSeason && (
              <>
                <span style={{ 
                  fontSize: 13, 
                  color: '#666', 
                  fontWeight: 500,
                  whiteSpace: 'nowrap'
                }}>
                  {t('topNav.currentPrices')}
                </span>
                
                {loadingPrices ? (
                  <Spin size="small" />
                ) : productPrices.length > 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12,
                    overflow: 'auto',
                    flex: 1,
                    scrollbarWidth: 'thin'
                  }}>
                    {productPrices.map((pp, index) => {
                      const pricePerTon = parseFloat(pp.current_price_per_ton);
                      const pricePerKg = pricePerTon / 1000;
                      
                      const priceContent = (
                        <div style={{ minWidth: 200 }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>
                            {pp.product_name}
                          </div>
                          <Divider style={{ margin: '8px 0' }} />
                          <div style={{ fontSize: 12 }}>
                            <div style={{ marginBottom: 4 }}>
                              <span style={{ color: '#999' }}>{t('topNav.perTon')}</span>{' '}
                              <span style={{ fontWeight: 600, color: '#52c41a' }}>
                                RM {pricePerTon.toFixed(2)}
                              </span>
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              <span style={{ color: '#999' }}>{t('topNav.perKg')}</span>{' '}
                              <span style={{ fontWeight: 600, color: '#1890ff' }}>
                                RM {pricePerKg.toFixed(2)}
                              </span>
                            </div>
                            <Divider style={{ margin: '8px 0' }} />
                            <div style={{ color: '#1890ff', fontSize: 11, textAlign: 'center' }}>
                              <EditOutlined /> {t('topNav.clickToUpdatePrice')}
                            </div>
                          </div>
                        </div>
                      );

                      return (
                        <Popover
                          key={pp.product_id}
                          content={priceContent}
                          title={null}
                          placement="bottom"
                        >
                          <Tag
                            color={pp.product_type === 'BERAS' ? 'green' : 'orange'}
                            style={{
                              fontSize: 13,
                              padding: '4px 10px',
                              margin: 0,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(pp);
                              const pricePerTon = parseFloat(pp.current_price_per_ton);
                              priceForm.setFieldsValue({ 
                                price_per_ton: pricePerTon
                              });
                              setPreviewPricePerKg(pricePerTon / 1000);
                              setPriceModalOpen(true);
                            }}
                          >
                            {pp.product_type === 'BERAS' ? '🌾' : '🌱'} {pp.variety === 'WANGI' ? '✨' : ''} 
                            {' '}RM {pricePerKg.toFixed(2)}/kg
                          </Tag>
                        </Popover>
                      );
                    })}
                  </div>
                ) : (
                  <Tag color="orange" style={{ margin: 0 }}>
                    {t('topNav.noPricesSet')}
                  </Tag>
                )}
              </>
            )}
            {!activeSeason && (
              <span style={{ fontSize: 13, color: '#999' }}>{t('topNav.noActiveSeason')}</span>
            )}
          </div>
          
          <div style={{ fontSize: 12, color: '#999', whiteSpace: 'nowrap', marginLeft: 16 }}>
            {activeSeason && (
              <span>
                {t('topNav.mode')}{' '}<Tag color={activeSeason.mode === 'LIVE' ? 'green' : 'orange'}>{activeSeason.mode}</Tag>
              </span>
            )}
          </div>
        </Header>

        <Content style={{
          marginTop: '130px',
          margin: '154px 16px 24px 16px',
          padding: 24,
          minHeight: 280,
          background: location.pathname === '/' ? 'transparent' : '#fff',
          backgroundImage: location.pathname === '/' ? `url(${bluishPaddyField})` : undefined,
          backgroundSize: location.pathname === '/' ? 'cover' : undefined,
          backgroundPosition: location.pathname === '/' ? 'center' : undefined,
          backgroundRepeat: location.pathname === '/' ? 'no-repeat' : undefined,
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

      {/* Price Update Modal */}
      <Modal
        title={
          <div>
            <DollarOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            {t('topNav.updatePriceTitle').replace('{productName}', selectedProduct?.product_name || '')}
          </div>
        }
        open={priceModalOpen}
        onOk={handlePriceUpdate}
        onCancel={() => {
          setPriceModalOpen(false);
          priceForm.resetFields();
          setPreviewPricePerKg(0);
        }}
        okText={t('topNav.updatePriceOk')}
        width={450}
      >
        <div style={{ marginBottom: 16 }}>
          <Tag color={selectedProduct?.product_type === 'BERAS' ? 'green' : 'orange'}>
            {selectedProduct?.product_type === 'BERAS' ? '🌾' : '🌱'} {selectedProduct?.variety === 'WANGI' ? '✨' : ''} {selectedProduct?.product_name}
          </Tag>
        </div>
        
        <Form 
          form={priceForm} 
          layout="vertical"
          onValuesChange={(changedValues) => {
            if (changedValues.price_per_ton) {
              setPreviewPricePerKg(changedValues.price_per_ton / 1000);
            }
          }}
        >
          <Form.Item
            label={t('topNav.pricePerTonLabel')}
            name="price_per_ton"
            rules={[
              { required: true, message: t('topNav.priceRequired') },
              { type: 'number', min: 0, message: t('topNav.pricePositive') }
            ]}
          >
            <InputNumber
              placeholder={t('topNav.pricePlaceholder')}
              precision={2}
              min={0}
              step={10}
              style={{ width: '100%' }}
              addonBefore="RM"
              addonAfter="/ton"
              size="large"
            />
          </Form.Item>
          
          {previewPricePerKg > 0 && (
            <div style={{
              background: '#f0f2f5',
              padding: 12,
              borderRadius: 4,
              fontSize: 13
            }}>
              <div style={{ color: '#666', marginBottom: 4 }}>{t('topNav.pricePerKgLabel')}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1890ff' }}>
                RM {previewPricePerKg.toFixed(2)}/kg
              </div>
            </div>
          )}
        </Form>
      </Modal>
    </Layout>
  );
};

export default AppLayout;
