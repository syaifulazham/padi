import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Table, message, Alert, Tabs, Timeline, Button, Transfer, Tag } from 'antd';
import { DollarOutlined, HistoryOutlined, AppstoreAddOutlined } from '@ant-design/icons';

const SeasonProductPriceModal = ({ visible, onCancel, season, mode = 'view' }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [allProducts, setAllProducts] = useState([]); // All available products
  const [selectedProductIds, setSelectedProductIds] = useState([]); // Selected product IDs for this season
  const [productPrices, setProductPrices] = useState([]);
  const [priceHistory, setPriceHistory] = useState({});
  const [activeTab, setActiveTab] = useState(mode === 'edit' ? 'selection' : 'prices');

  useEffect(() => {
    if (visible) {
      loadProducts();
      if (season) {
        loadProductPrices();
      }
    }
  }, [visible, season]);

  const loadProducts = async () => {
    try {
      const result = await window.electronAPI.products.getActive();
      if (result?.success) {
        setAllProducts(result.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadProductPrices = async () => {
    try {
      const result = await window.electronAPI.seasonProductPrices.getSeasonProductPrices(season.season_id);
      if (result?.success) {
        setProductPrices(result.data);
        
        // Set selected products based on existing prices
        const existingProductIds = result.data.map(pp => pp.product_id);
        setSelectedProductIds(existingProductIds);
        
        // Set form values
        const formValues = {};
        result.data.forEach(pp => {
          formValues[`product_${pp.product_id}`] = pp.current_price_per_ton;
        });
        form.setFieldsValue(formValues);
      }
    } catch (error) {
      console.error('Error loading product prices:', error);
    }
  };

  const loadPriceHistory = async (productId) => {
    if (!season) return;
    
    try {
      const result = await window.electronAPI.seasonProductPrices.getPriceHistory(season.season_id, productId);
      if (result?.success) {
        setPriceHistory(prev => ({
          ...prev,
          [productId]: result.data
        }));
      }
    } catch (error) {
      console.error('Error loading price history:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Update each product price
      const updates = [];
      console.log('📝 Updating product prices for season:', season.season_id);
      console.log('Form values:', values);
      
      // Get selected products
      const selectedProducts = allProducts.filter(p => selectedProductIds.includes(p.product_id));
      
      for (const product of selectedProducts) {
        const fieldName = `product_${product.product_id}`;
        const priceValue = typeof values[fieldName] === 'string' 
          ? parseFloat(values[fieldName]) 
          : values[fieldName];

        console.log(`Product ${product.product_name} (ID: ${product.product_id}):`, priceValue);

        if (priceValue && priceValue > 0) {
          console.log(`✅ Adding update for ${product.product_name}: RM ${priceValue}/ton`);
          updates.push(
            window.electronAPI.seasonProductPrices.updateProductPrice(
              season.season_id,
              product.product_id,
              priceValue,
              'Price update',
              1 // TODO: Get from auth
            )
          );
        } else {
          console.log(`⚠️ Skipping ${product.product_name}: invalid price ${priceValue}`);
        }
      }
      
      console.log(`📊 Total updates to perform: ${updates.length}`);

      const results = await Promise.all(updates);
      const allSuccess = results.every(r => r?.success);

      // Log any failures
      const failures = results.filter(r => !r?.success);
      if (failures.length > 0) {
        console.error('Failed price updates:', failures);
        failures.forEach((result, index) => {
          console.error(`Update ${index} failed:`, result);
        });
      }

      if (allSuccess) {
        message.success('Product prices updated successfully!');
        
        // Dispatch event to refresh active season
        window.dispatchEvent(new Event('season-changed'));
        
        onCancel(true);
      } else {
        const errorMsg = failures[0]?.error || 'Unknown error';
        message.error(`Some prices failed to update: ${errorMsg}`);
        console.error('Update failures:', failures);
      }
    } catch (error) {
      console.error('Error updating prices:', error);
      message.error('Failed to update prices');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 250,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.product_type === 'BERAS' ? '🌾 Beras' : '🌱 Benih'} - 
            {record.variety === 'WANGI' ? ' ✨ Wangi' : ' Biasa'}
          </div>
        </div>
      )
    },
    {
      title: mode === 'edit' ? 'Current Price (RM/ton)' : 'Price (RM/ton)',
      key: 'price',
      width: 200,
      render: (_, record) => {
        if (mode === 'view') {
          const price = productPrices.find(pp => pp.product_id === record.product_id);
          return (
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>
                RM {price ? parseFloat(price.current_price_per_ton).toFixed(2) : '0.00'}
              </span>
              <div style={{ fontSize: 12, color: '#999' }}>
                per ton
              </div>
            </div>
          );
        }

        return (
          <Form.Item
            name={`product_${record.product_id}`}
            rules={[
              { required: true, message: 'Required' },
              {
                validator: (_, value) => {
                  const numValue = typeof value === 'string' ? parseFloat(value) : value;
                  if (!numValue || numValue <= 0) {
                    return Promise.reject(new Error('Must be > 0'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
            style={{ marginBottom: 0 }}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              step={10}
              precision={2}
              placeholder="1800.00"
              prefix="RM"
              addonAfter="/ ton"
            />
          </Form.Item>
        );
      }
    },
    {
      title: 'Per KG',
      key: 'per_kg',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const price = productPrices.find(pp => pp.product_id === record.product_id);
        const pricePerTon = price ? parseFloat(price.current_price_per_ton) : 0;
        const pricePerKg = pricePerTon / 1000;
        
        return (
          <span style={{ color: '#1890ff', fontWeight: 500 }}>
            RM {pricePerKg.toFixed(2)}
          </span>
        );
      }
    }
  ];

  // Get only selected products for display
  const displayProducts = mode === 'view' 
    ? allProducts.filter(p => productPrices.some(pp => pp.product_id === p.product_id))
    : allProducts.filter(p => selectedProductIds.includes(p.product_id));

  const tabItems = mode === 'edit' ? [
    {
      key: 'selection',
      label: (
        <span>
          <AppstoreAddOutlined /> Select Products ({selectedProductIds.length})
        </span>
      ),
      children: (
        <div>
          <Alert
            message="Select Products for This Season"
            description="Choose which products should be available for pricing in this season. You can select multiple products from the list."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Transfer
            dataSource={allProducts.map(p => ({
              key: p.product_id,
              title: p.product_name,
              description: `${p.product_type === 'BERAS' ? '🌾 Beras' : '🌱 Benih'} - ${p.variety === 'WANGI' ? '✨ Wangi' : 'Biasa'}`,
              disabled: false
            }))}
            titles={['Available Products', 'Selected Products']}
            targetKeys={selectedProductIds}
            onChange={(newTargetKeys) => setSelectedProductIds(newTargetKeys)}
            render={item => (
              <div>
                <div style={{ fontWeight: 500 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{item.description}</div>
              </div>
            )}
            listStyle={{
              width: 350,
              height: 400,
            }}
            showSearch
            filterOption={(inputValue, item) =>
              item.title.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
            }
          />
          
          {selectedProductIds.length > 0 && (
            <Alert
              message={`${selectedProductIds.length} product(s) selected`}
              description="Click 'Next' or switch to 'Set Prices' tab to configure prices for selected products."
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
          
          {selectedProductIds.length === 0 && (
            <Alert
              message="No products selected"
              description="Please select at least one product to continue."
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      )
    },
    {
      key: 'prices',
      label: (
        <span>
          <DollarOutlined /> Current Prices
        </span>
      ),
      children: (
        <div>
          {mode === 'edit' && selectedProductIds.length === 0 ? (
            <Alert
              message="No Products Selected"
              description="Please go to 'Select Products' tab and choose at least one product before setting prices."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          ) : (
            <Alert
              message={`Product Prices for ${season?.season_name || 'Season'}`}
              description={mode === 'edit' 
                ? `Set prices for ${selectedProductIds.length} selected product(s). Changes will be recorded in price history.`
                : 'View current prices for all products in this season.'
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {displayProducts.length > 0 ? (
            <Form form={form} layout="vertical">
              <Table
                columns={columns}
                dataSource={displayProducts}
                rowKey="product_id"
                pagination={false}
                size="middle"
              />
            </Form>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              No products to display. {mode === 'edit' ? 'Please select products first.' : 'No products configured for this season.'}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined /> Price History
        </span>
      ),
      children: (
        <div>
          <Alert
            message="Price Change History"
            description="View the history of price changes for each product."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {displayProducts.map(product => {
            const history = priceHistory[product.product_id] || [];
            
            return (
              <div key={product.product_id} style={{ marginBottom: 24 }}>
                <h4>{product.product_name}</h4>
                {history.length === 0 ? (
                  <div 
                    style={{ 
                      padding: 16, 
                      background: '#f5f5f5', 
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                    onClick={() => loadPriceHistory(product.product_id)}
                  >
                    Click to load price history
                  </div>
                ) : (
                  <Timeline
                    items={history.map(h => ({
                      children: (
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            RM {parseFloat(h.price_per_ton).toFixed(2)} per ton
                          </div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            {new Date(h.effective_date).toLocaleString()}
                          </div>
                          {h.notes && (
                            <div style={{ fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
                              {h.notes}
                            </div>
                          )}
                        </div>
                      )
                    }))}
                  />
                )}
              </div>
            );
          })}
        </div>
      )
    }
  ] : [
    {
      key: 'prices',
      label: (
        <span>
          <DollarOutlined /> Current Prices
        </span>
      ),
      children: (
        <div>
          <Alert
            message={`Product Prices for ${season?.season_name || 'Season'}`}
            description='View current prices for all products in this season.'
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {displayProducts.length > 0 ? (
            <Form form={form} layout="vertical">
              <Table
                columns={columns}
                dataSource={displayProducts}
                rowKey="product_id"
                pagination={false}
                size="middle"
              />
            </Form>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              No products configured for this season.
            </div>
          )}
        </div>
      )
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined /> Price History
        </span>
      ),
      children: (
        <div>
          <Alert
            message="Price Change History"
            description="View the history of price changes for each product."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {displayProducts.map(product => {
            const history = priceHistory[product.product_id] || [];
            
            return (
              <div key={product.product_id} style={{ marginBottom: 24 }}>
                <h4>{product.product_name}</h4>
                {history.length === 0 ? (
                  <div 
                    style={{ 
                      padding: 16, 
                      background: '#f5f5f5', 
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                    onClick={() => loadPriceHistory(product.product_id)}
                  >
                    Click to load price history
                  </div>
                ) : (
                  <Timeline
                    items={history.map(h => ({
                      children: (
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            RM {parseFloat(h.price_per_ton).toFixed(2)} per ton
                          </div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            {new Date(h.effective_date).toLocaleString()}
                          </div>
                          {h.notes && (
                            <div style={{ fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
                              {h.notes}
                            </div>
                          )}
                        </div>
                      )
                    }))}
                  />
                )}
              </div>
            );
          })}
        </div>
      )
    }
  ];

  return (
    <Modal
      title={mode === 'edit' ? 'Update Product Prices' : 'Product Prices'}
      open={visible}
      onOk={mode === 'edit' ? handleSubmit : null}
      onCancel={() => onCancel()}
      width={900}
      okText={mode === 'edit' ? 'Save Prices' : undefined}
      okButtonProps={{ disabled: mode === 'edit' && selectedProductIds.length === 0 }}
      cancelText={mode === 'edit' ? 'Cancel' : 'Close'}
      confirmLoading={loading}
      footer={mode === 'view' ? [
        <Button key="close" onClick={() => onCancel()}>
          Close
        </Button>
      ] : undefined}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </Modal>
  );
};

export default SeasonProductPriceModal;
