import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Space, Row, Col, message, Tag, Table, Input, Alert, Descriptions, Result, Typography } from 'antd';
import { ArrowLeftOutlined, SearchOutlined, SwapOutlined, CheckCircleOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';

const { Text, Title } = Typography;

const ChangeFarmer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const transactionId = searchParams.get('transactionId');

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState([]);
  const [farmerSearchText, setFarmerSearchText] = useState('');
  const [farmerOptions, setFarmerOptions] = useState([]);
  const [selectedNewFarmer, setSelectedNewFarmer] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resultData, setResultData] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!transactionId) {
      message.error('No transaction specified');
      navigate('/purchases/history');
      return;
    }
    loadTransaction();
    loadFarmers();
  }, [transactionId]);

  useEffect(() => {
    if (selectedNewFarmer) {
      generateCode();
    }
  }, [selectedNewFarmer]);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCode(code);
    setConfirmationCode('');
  };

  const loadTransaction = async () => {
    try {
      const result = await window.electronAPI.purchases?.getById(Number(transactionId));
      if (result?.success && result.data) {
        setTransaction(result.data);
      } else {
        message.error('Transaction not found');
        navigate('/purchases/history');
      }
    } catch (error) {
      console.error('Failed to load transaction:', error);
      message.error('Failed to load transaction');
      navigate('/purchases/history');
    } finally {
      setLoading(false);
    }
  };

  const loadFarmers = async () => {
    try {
      const result = await window.electronAPI.farmers.getAll();
      if (result.success) {
        setFarmers(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load farmers:', error);
    }
  };

  const searchFarmers = (searchText) => {
    if (!searchText || searchText.length < 2) {
      setFarmerOptions([]);
      return;
    }

    const filtered = farmers
      .filter(farmer => {
        if (transaction && farmer.farmer_id === transaction.farmer_id) return false;
        const searchLower = searchText.toLowerCase();
        return (
          farmer.full_name?.toLowerCase().includes(searchLower) ||
          farmer.farmer_code?.toLowerCase().includes(searchLower) ||
          farmer.ic_number?.includes(searchText)
        );
      })
      .slice(0, 50);

    setFarmerOptions(filtered);
  };

  const handleSelectFarmer = (farmer) => {
    setSelectedNewFarmer(farmer);
  };

  const handleConfirm = async () => {
    if (confirmationCode.toUpperCase() !== generatedCode) {
      message.error('Confirmation code does not match. Please try again.');
      return;
    }

    setSubmitting(true);
    try {
      console.log('🔄 changeFarmer call params:', {
        transactionId: Number(transactionId),
        newFarmerId: selectedNewFarmer.farmer_id,
        userId: user?.user_id || 1,
        fnExists: typeof window.electronAPI.purchases?.changeFarmer
      });

      const result = await window.electronAPI.purchases.changeFarmer(
        Number(transactionId),
        selectedNewFarmer.farmer_id,
        user?.user_id || 1,
        `Changed farmer from ${transaction.farmer_name} (${transaction.farmer_code}) to ${selectedNewFarmer.full_name} (${selectedNewFarmer.farmer_code})`
      );

      console.log('🔄 changeFarmer result:', result);

      if (result?.success) {
        setSuccess(true);
        setResultData(result.data);
        message.success('Farmer changed successfully');
      } else {
        message.error(result?.error || 'Failed to change farmer');
      }
    } catch (error) {
      console.error('Failed to change farmer:', error);
      message.error(`Failed to change farmer: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>Loading transaction...</div>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <Result
          status="success"
          icon={<CheckCircleOutlined />}
          title="Farmer Changed Successfully"
          subTitle={
            <div>
              <p>Receipt <Tag color="blue">{resultData?.receipt_number}</Tag> has been reassigned.</p>
              <p>
                New Farmer: <strong>{resultData?.new_farmer_name}</strong> ({resultData?.new_farmer_code})
              </p>
              {resultData?.affected_split_receipts?.length > 0 && (
                <p>
                  Also updated {resultData.affected_split_receipts.length} split receipt(s):{' '}
                  {resultData.affected_split_receipts.map((r, i) => (
                    <Tag color="blue" key={i} style={{ marginTop: 4 }}>{r}</Tag>
                  ))}
                </p>
              )}
            </div>
          }
          extra={[
            <Button
              key="back"
              type="primary"
              onClick={() => navigate('/purchases/history')}
            >
              Back to Purchase History
            </Button>
          ]}
        />
      </Card>
    );
  }

  const farmerColumns = [
    {
      title: 'Subsidy No',
      dataIndex: 'farmer_code',
      key: 'farmer_code',
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 250
    },
    {
      title: 'IC Number',
      dataIndex: 'ic_number',
      key: 'ic_number',
      width: 180
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<UserSwitchOutlined />}
          onClick={() => handleSelectFarmer(record)}
        >
          Select
        </Button>
      )
    }
  ];

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/purchases/history')}
              >
                Back
              </Button>
              <Title level={4} style={{ margin: 0 }}>
                <SwapOutlined /> Change Farmer for Receipt
              </Title>
            </Space>
          </Col>
        </Row>

        {/* Current Transaction Info */}
        <Card
          type="inner"
          title={
            <Space>
              <span>Current Receipt Details</span>
              <Tag color="blue">{transaction?.receipt_number}</Tag>
            </Space>
          }
        >
          <Descriptions column={3} size="small">
            <Descriptions.Item label="Receipt No">{transaction?.receipt_number}</Descriptions.Item>
            <Descriptions.Item label="Date">
              {transaction?.transaction_date ? dayjs(transaction.transaction_date).format('DD/MM/YYYY HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Vehicle">{transaction?.vehicle_number || '-'}</Descriptions.Item>
            <Descriptions.Item label="Current Farmer">
              <Tag color="orange">{transaction?.farmer_name}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Farmer Code">
              <Tag color="orange">{transaction?.farmer_code}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Net Weight">
              {transaction?.net_weight_kg ? `${parseFloat(transaction.net_weight_kg).toFixed(2)} kg` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Product">{transaction?.product_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="Price/kg">
              {transaction?.final_price_per_kg ? `RM ${parseFloat(transaction.final_price_per_kg).toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Total Amount">
              {transaction?.total_amount ? `RM ${parseFloat(transaction.total_amount).toFixed(2)}` : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Step indicator */}
        {!selectedNewFarmer ? (
          <>
            {/* Search for New Farmer */}
            <Card type="inner" title={<Space><SearchOutlined /> Step 1: Search & Select New Farmer</Space>}>
              <Input
                ref={searchInputRef}
                size="large"
                placeholder="Search by name, subsidy number, or IC number (min 2 characters)"
                prefix={<SearchOutlined />}
                value={farmerSearchText}
                onChange={(e) => {
                  setFarmerSearchText(e.target.value);
                  searchFarmers(e.target.value);
                }}
                allowClear
                autoFocus
              />

              {farmerSearchText.length > 0 && farmerSearchText.length < 2 && (
                <Alert
                  message="Type at least 2 characters to search"
                  type="info"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}

              {farmerSearchText.length >= 2 && farmerOptions.length === 0 && (
                <Alert
                  message="No farmers found"
                  description="Try different search terms"
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}

              {farmerOptions.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Alert
                    message={`Found ${farmerOptions.length} farmer(s)`}
                    type="success"
                    showIcon
                    style={{ marginBottom: 12 }}
                  />
                  <Table
                    dataSource={farmerOptions}
                    columns={farmerColumns}
                    rowKey="farmer_id"
                    size="small"
                    pagination={false}
                    scroll={{ y: 300 }}
                  />
                </div>
              )}
            </Card>
          </>
        ) : (
          <>
            {/* Confirmation Step */}
            <Card type="inner" title={<Space><UserSwitchOutlined /> Step 2: Confirm Farmer Change</Space>}>
              <Alert
                message="Farmer Reassignment Summary"
                description={
                  <div style={{ marginTop: 8 }}>
                    <Row gutter={24}>
                      <Col span={10}>
                        <Card size="small" style={{ background: '#fff2e8', borderColor: '#ffbb96' }}>
                          <div style={{ textAlign: 'center' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>CURRENT FARMER</Text>
                            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>
                              {transaction?.farmer_name}
                            </div>
                            <Tag color="orange" style={{ marginTop: 4 }}>{transaction?.farmer_code}</Tag>
                          </div>
                        </Card>
                      </Col>
                      <Col span={4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SwapOutlined style={{ fontSize: 28, color: '#1890ff' }} />
                      </Col>
                      <Col span={10}>
                        <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
                          <div style={{ textAlign: 'center' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>NEW FARMER</Text>
                            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>
                              {selectedNewFarmer.full_name}
                            </div>
                            <Tag color="green" style={{ marginTop: 4 }}>{selectedNewFarmer.farmer_code}</Tag>
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                }
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <div style={{
                background: '#fafafa',
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                padding: 24,
                textAlign: 'center'
              }}>
                <Text type="secondary">To confirm this change, type the following code:</Text>
                <div style={{
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: 8,
                  fontFamily: 'monospace',
                  color: '#1890ff',
                  margin: '16px 0',
                  userSelect: 'none'
                }}>
                  {generatedCode}
                </div>
                <Input
                  size="large"
                  placeholder="Enter confirmation code"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                  style={{
                    maxWidth: 300,
                    textAlign: 'center',
                    fontSize: 20,
                    fontFamily: 'monospace',
                    letterSpacing: 6
                  }}
                  maxLength={6}
                  autoFocus
                  onPressEnter={() => {
                    if (confirmationCode.length === 6) handleConfirm();
                  }}
                />
              </div>

              <Row justify="space-between" style={{ marginTop: 24 }}>
                <Col>
                  <Button
                    onClick={() => {
                      setSelectedNewFarmer(null);
                      setConfirmationCode('');
                      setGeneratedCode('');
                    }}
                  >
                    Back to Search
                  </Button>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckCircleOutlined />}
                    loading={submitting}
                    disabled={confirmationCode.length !== 6 || confirmationCode.toUpperCase() !== generatedCode}
                    onClick={handleConfirm}
                  >
                    Confirm Change
                  </Button>
                </Col>
              </Row>
            </Card>
          </>
        )}
      </Space>
    </Card>
  );
};

export default ChangeFarmer;
