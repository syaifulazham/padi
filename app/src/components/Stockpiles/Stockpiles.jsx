import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Table, Tag, Space, Button, message, Alert, Progress } from 'antd';
import { ReloadOutlined, EyeOutlined, WarningOutlined, InboxOutlined, ShoppingCartOutlined, ShopOutlined, TableOutlined, BarChartOutlined, PrinterOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const Stockpiles = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stockpiles, setStockpiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeSeason, setActiveSeason] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'chart'

  useEffect(() => {
    loadActiveSeason();
  }, []);

  useEffect(() => {
    if (activeSeason) {
      loadStockpiles();
      loadStats();
      loadLowStockAlerts();
    }
  }, [activeSeason]);

  const loadActiveSeason = async () => {
    try {
      const result = await window.electronAPI.seasons?.getActive();
      if (result?.success && result.data) {
        setActiveSeason(result.data);
      } else {
        message.warning('No active season found');
      }
    } catch (error) {
      console.error('Failed to load active season:', error);
      message.error('Failed to load active season');
    }
  };

  const loadStockpiles = async () => {
    if (!activeSeason) return;
    
    try {
      setLoading(true);
      const result = await window.electronAPI.stockpiles?.getSummary(activeSeason.season_id);
      if (result?.success) {
        setStockpiles(result.data || []);
      } else {
        message.error('Failed to load stockpiles');
      }
    } catch (error) {
      console.error('Failed to load stockpiles:', error);
      message.error('Failed to load stockpiles');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!activeSeason) return;
    
    try {
      const result = await window.electronAPI.stockpiles?.getStats(activeSeason.season_id);
      if (result?.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadLowStockAlerts = async () => {
    if (!activeSeason) return;
    
    try {
      const result = await window.electronAPI.stockpiles?.getLowStockAlerts(activeSeason.season_id, 1000);
      if (result?.success) {
        setLowStockAlerts(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load low stock alerts:', error);
    }
  };

  const viewMovements = (product) => {
    navigate(`/stockpiles/movements?productId=${product.product_id}&productName=${encodeURIComponent(product.product_name)}&productCode=${encodeURIComponent(product.product_code)}`);
  };

  const handleExport = () => {
    try {
      if (!stockpiles || stockpiles.length === 0) {
        message.warning('No data to export');
        return;
      }

      // Prepare data for Excel
      const data = stockpiles.map(item => ({
        'Product Code': item.product_code,
        'Product Name': item.product_name,
        'Type': item.product_type,
        'Variety': item.variety,
        'Purchased (kg)': parseFloat(item.total_purchased_kg).toFixed(2),
        'Purchased (ton)': parseFloat(item.total_purchased_ton).toFixed(3),
        'Purchase Count': item.purchase_count,
        'Sold (kg)': parseFloat(item.total_sold_kg).toFixed(2),
        'Sold (ton)': parseFloat(item.total_sold_ton).toFixed(3),
        'Sales Count': item.sales_count,
        'Current Stock (kg)': parseFloat(item.current_stock_kg).toFixed(2),
        'Current Stock (ton)': parseFloat(item.current_stock_ton).toFixed(3),
        'Stock Value (RM)': item.stock_value ? parseFloat(item.stock_value).toFixed(2) : '0.00'
      }));

      // Add summary row
      if (stats) {
        data.push({});
        data.push({
          'Product Code': 'TOTAL',
          'Product Name': '',
          'Type': '',
          'Variety': '',
          'Purchased (kg)': parseFloat(stats.total_purchased_kg).toFixed(2),
          'Purchased (ton)': parseFloat(stats.total_purchased_ton).toFixed(3),
          'Purchase Count': stats.total_purchase_transactions,
          'Sold (kg)': parseFloat(stats.total_sold_kg).toFixed(2),
          'Sold (ton)': parseFloat(stats.total_sold_ton).toFixed(3),
          'Sales Count': stats.total_sale_transactions,
          'Current Stock (kg)': parseFloat(stats.current_stock_kg).toFixed(2),
          'Current Stock (ton)': parseFloat(stats.current_stock_ton).toFixed(3),
          'Stock Value (RM)': ''
        });
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Stockpiles');

      const filename = `Stockpiles_${activeSeason?.season_name || 'Report'}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      XLSX.writeFile(wb, filename);
      message.success('Stockpiles exported successfully');
    } catch (error) {
      console.error('Error exporting stockpiles:', error);
      message.error('Failed to export stockpiles');
    }
  };

  const handlePrint = () => {
    try {
      if (!stockpiles || stockpiles.length === 0) {
        message.warning('No data to print');
        return;
      }

      // Create print content
      const printWindow = window.open('', '', 'width=800,height=600');
      
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Stockpiles Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 10px; }
            .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
            .stats { display: flex; justify-content: space-around; margin-bottom: 30px; }
            .stat-box { text-align: center; padding: 10px; }
            .stat-label { font-size: 12px; color: #666; }
            .stat-value { font-size: 24px; font-weight: bold; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            @media print {
              body { padding: 10px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>📦 Stockpiles Report</h1>
          <div class="subtitle">
            Season: ${activeSeason?.season_name || `${activeSeason?.season_number}/${activeSeason?.year}`} | 
            Generated: ${dayjs().format('DD/MM/YYYY HH:mm')}
          </div>
          
          ${stats ? `
          <div class="stats">
            <div class="stat-box">
              <div class="stat-label">Total Purchased</div>
              <div class="stat-value" style="color: #52c41a;">${stats.total_purchased_ton.toFixed(3)} ton</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Total Sold</div>
              <div class="stat-value" style="color: #ff4d4f;">${stats.total_sold_ton.toFixed(3)} ton</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Current Stock</div>
              <div class="stat-value" style="color: #1890ff;">${stats.current_stock_ton.toFixed(3)} ton</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Turnover Rate</div>
              <div class="stat-value">${stats.turnover_rate.toFixed(2)}%</div>
            </div>
          </div>
          ` : ''}
          
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Variety</th>
                <th class="text-right">Purchased (ton)</th>
                <th class="text-right">Sold (ton)</th>
                <th class="text-right">Current Stock (ton)</th>
              </tr>
            </thead>
            <tbody>
              ${stockpiles.map(item => `
                <tr>
                  <td>${item.product_code} - ${item.product_name}</td>
                  <td>${item.product_type}</td>
                  <td>${item.variety}</td>
                  <td class="text-right">${item.total_purchased_ton.toFixed(3)}</td>
                  <td class="text-right">${item.total_sold_ton.toFixed(3)}</td>
                  <td class="text-right">${item.current_stock_ton.toFixed(3)}</td>
                </tr>
              `).join('')}
              ${stats ? `
                <tr class="total-row">
                  <td colspan="3">TOTAL</td>
                  <td class="text-right">${stats.total_purchased_ton.toFixed(3)}</td>
                  <td class="text-right">${stats.total_sold_ton.toFixed(3)}</td>
                  <td class="text-right">${stats.current_stock_ton.toFixed(3)}</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (error) {
      console.error('Error printing stockpiles:', error);
      message.error('Failed to print stockpiles');
    }
  };

  const columns = [
    {
      title: 'Product',
      key: 'product',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.product_type === 'BERAS' ? '🌾' : '🌱'} {record.variety === 'WANGI' ? '✨' : ''} {record.product_name}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.product_code}</div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'product_type',
      key: 'product_type',
      width: 100,
      render: (type) => (
        <Tag color={type === 'BERAS' ? 'green' : 'orange'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Variety',
      dataIndex: 'variety',
      key: 'variety',
      width: 100,
      render: (variety) => (
        <Tag color={variety === 'WANGI' ? 'purple' : 'default'}>
          {variety}
        </Tag>
      ),
    },
    {
      title: 'Purchased',
      key: 'purchased',
      align: 'right',
      render: (_, record) => {
        if (record.total_purchased_ton === 0) return null;
        return (
          <div>
            <div style={{ fontWeight: 500, color: '#52c41a' }}>
              {record.total_purchased_ton.toFixed(3)} ton
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>
              {record.purchase_count} transactions
            </div>
          </div>
        );
      },
    },
    {
      title: 'Sold',
      key: 'sold',
      align: 'right',
      render: (_, record) => {
        if (record.total_sold_ton === 0) return null;
        return (
          <div>
            <div style={{ fontWeight: 500, color: '#ff4d4f' }}>
              {record.total_sold_ton.toFixed(3)} ton
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>
              {record.sales_count} transactions
            </div>
          </div>
        );
      },
    },
    {
      title: 'Current Stock',
      key: 'stock',
      align: 'right',
      render: (_, record) => {
        if (record.current_stock_ton === 0) return null;
        const isLow = record.current_stock_kg < 1000;
        return (
          <div>
            <div style={{ fontWeight: 600, color: isLow ? '#ff4d4f' : '#1890ff', fontSize: 16 }}>
              {isLow && <WarningOutlined style={{ marginRight: 4 }} />}
              {record.current_stock_ton.toFixed(3)} ton
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>
              {record.current_stock_kg.toFixed(2)} kg
            </div>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => viewMovements(record)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <h2 style={{ margin: 0 }}>
                    📦 Stockpiles Management
                  </h2>
                  {activeSeason && (
                    <Tag color="green">
                      🌾 {activeSeason.season_name || `Season ${activeSeason.season_number}/${activeSeason.year}`}
                    </Tag>
                  )}
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button
                    icon={<PrinterOutlined />}
                    onClick={handlePrint}
                    disabled={!stockpiles || stockpiles.length === 0}
                  >
                    Print
                  </Button>
                  <Button
                    icon={<FileExcelOutlined />}
                    onClick={handleExport}
                    disabled={!stockpiles || stockpiles.length === 0}
                  >
                    Export
                  </Button>
                  <Button
                    icon={viewMode === 'table' ? <BarChartOutlined /> : <TableOutlined />}
                    onClick={() => setViewMode(viewMode === 'table' ? 'chart' : 'table')}
                  >
                    {viewMode === 'table' ? 'Chart View' : 'Table View'}
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      loadStockpiles();
                      loadStats();
                      loadLowStockAlerts();
                    }}
                  >
                    Refresh
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Statistics Cards */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Purchased"
                value={stats.total_purchased_ton}
                precision={3}
                suffix="ton"
                prefix={<ShoppingCartOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                {stats.total_purchase_transactions} transactions
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Sold"
                value={stats.total_sold_ton}
                precision={3}
                suffix="ton"
                prefix={<ShopOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                {stats.total_sale_transactions} transactions
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Current Stock"
                value={stats.current_stock_ton}
                precision={3}
                suffix="ton"
                prefix={<InboxOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontWeight: 700 }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                {stats.current_stock_kg.toFixed(2)} kg
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Turnover Rate"
                value={stats.turnover_rate}
                precision={2}
                suffix="%"
                valueStyle={{ color: stats.turnover_rate > 50 ? '#52c41a' : '#faad14' }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                Sold / Purchased
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <Alert
          message={`Low Stock Alert: ${lowStockAlerts.length} product(s) below 1000 kg`}
          description={
            <Space wrap>
              {lowStockAlerts.map(item => (
                <Tag key={item.product_id} color="warning">
                  {item.product_name}: {item.current_stock_kg.toFixed(2)} kg
                </Tag>
              ))}
            </Space>
          }
          type="warning"
          icon={<WarningOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Stockpiles Table or Chart View */}
      <Card title="Stockpiles by Product">
        {viewMode === 'table' ? (
          <Table
            columns={columns}
            dataSource={stockpiles}
            rowKey="product_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} products`,
            }}
          />
        ) : (
          <div style={{ padding: '16px 0' }}>
            {(() => {
              // Filter out products with 0 purchased
              const filteredStockpiles = stockpiles.filter(p => p.total_purchased_ton > 0);
              
              // Calculate maximum total purchased across all products for scaling
              const maxTotalPurchased = Math.max(...filteredStockpiles.map(p => p.total_purchased_ton), 0);
              
              return filteredStockpiles.map((product) => {
                const totalPurchased = product.total_purchased_ton;
                const totalSold = product.total_sold_ton;
                const currentStock = product.current_stock_ton;
                
                // Calculate percentages relative to this product's total
                const soldPercentageOfProduct = totalPurchased > 0 ? (totalSold / totalPurchased) * 100 : 0;
                const stockPercentageOfProduct = totalPurchased > 0 ? (currentStock / totalPurchased) * 100 : 0;
                
                // Calculate bar width relative to max total purchased across all products
                const barScalePercentage = maxTotalPurchased > 0 ? (totalPurchased / maxTotalPurchased) * 100 : 0;
                
                // Calculate actual segment widths within the scaled bar
                const soldBarWidth = barScalePercentage * (soldPercentageOfProduct / 100);
                const stockBarWidth = barScalePercentage * (stockPercentageOfProduct / 100);

                return (
                  <div
                    key={product.product_id}
                    style={{
                      marginBottom: 32,
                      paddingBottom: 24,
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    {/* Product Name and Total */}
                    <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
                      <Col>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>
                          {product.product_code} - {product.product_type}
                        </div>
                      </Col>
                      <Col>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>
                          {totalPurchased.toFixed(3)} ton
                        </div>
                      </Col>
                    </Row>

                    {/* Bar Chart */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', height: 30, borderRadius: 4, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                        {/* Blue Bar (Sold) */}
                        {soldBarWidth > 0 && (
                          <div
                            style={{
                              width: `${soldBarWidth}%`,
                              backgroundColor: '#1890ff',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        )}
                        {/* Orange Bar (Current Stock) */}
                        {stockBarWidth > 0 && (
                          <div
                            style={{
                              width: `${stockBarWidth}%`,
                              backgroundColor: '#ff9800',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Sold and Stock Details */}
                    <div style={{ fontSize: 14, color: '#666' }}>
                      Sold: <span style={{ fontWeight: 600, color: '#1890ff' }}>{totalSold.toFixed(3)} ton</span>
                      {' '}({soldPercentageOfProduct.toFixed(1)}%)
                      {' '} Current Stock: <span style={{ fontWeight: 600, color: '#ff9800' }}>{currentStock.toFixed(3)} ton</span>
                      {' '}({stockPercentageOfProduct.toFixed(1)}%)
                    </div>

                    {/* View Details Button */}
                    <div style={{ marginTop: 8 }}>
                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => viewMovements(product)}
                        style={{ padding: 0 }}
                      >
                        View Movements
                      </Button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Stockpiles;
