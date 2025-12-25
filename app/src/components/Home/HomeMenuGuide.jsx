import React from 'react';
import { Card, Typography, Row, Col, Divider, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

const HomeMenuGuide = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Card style={{
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(4px)',
      }}>
        <Title level={2} style={{ marginTop: 0 }}>Menu Guide</Title>
        <Paragraph style={{ marginBottom: 0 }}>
          A quick overview of the main menus and what each one is used for.
        </Paragraph>
      </Card>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Dashboard" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              High-level overview of the current season and key metrics.
            </Paragraph>
            <Space size={8} wrap>
              <Button type="link" onClick={() => navigate('/')}>Open Dashboard</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Purchases" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              Record incoming paddy purchases: weigh-in, weigh-out, history and payment.
            </Paragraph>
            <Space size={8} wrap>
              <Button type="link" onClick={() => navigate('/purchases')}>Weigh-In</Button>
              <Button type="link" onClick={() => navigate('/purchases/history')}>History</Button>
              <Button type="link" onClick={() => navigate('/purchases/payment')}>Payment</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Sales" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              Sell to manufacturers: container weigh-in (tare) and weigh-out completion.
            </Paragraph>
            <Space size={8} wrap>
              <Button type="link" onClick={() => navigate('/sales')}>Weigh-In</Button>
              <Button type="link" onClick={() => navigate('/sales/history')}>History</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Reports" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              Generate season and transaction reports (Purchase, Sales, Lorry).
            </Paragraph>
            <Space size={8} wrap>
              <Button type="link" onClick={() => navigate('/reports/purchases')}>Purchase Report</Button>
              <Button type="link" onClick={() => navigate('/reports/sales')}>Sales Report</Button>
              <Button type="link" onClick={() => navigate('/reports/lorry')}>Lorry Report</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Stockpiles" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              Track paddy/rice stockpiles and movement.
            </Paragraph>
            <Space size={8} wrap>
              <Button type="link" onClick={() => navigate('/stockpiles')}>Open Stockpiles</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Settings" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              Configure system settings, seasons, products, backups and system info.
            </Paragraph>
            <Text type="secondary">Tip: Set up Settings first before operations.</Text>
            <div style={{ marginTop: 8 }}>
              <Space size={8} wrap>
                <Button type="link" onClick={() => navigate('/settings')}>General</Button>
                <Button type="link" onClick={() => navigate('/settings/seasons')}>Seasons</Button>
                <Button type="link" onClick={() => navigate('/settings/products')}>Products</Button>
                <Button type="link" onClick={() => navigate('/settings/backup')}>Backup</Button>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomeMenuGuide;
