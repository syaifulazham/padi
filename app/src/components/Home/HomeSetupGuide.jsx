import React from 'react';
import { Card, Typography, Row, Col, Divider, Tag, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

const HomeSetupGuide = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Card style={{
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(4px)',
      }}>
        <Title level={2} style={{ marginTop: 0 }}>Getting Started</Title>
        <Paragraph style={{ marginBottom: 0 }}>
          Before starting daily operations, make sure these configurations are completed.
        </Paragraph>
      </Card>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="1) Company Details" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              Ensure your company name, address and license numbers are correct.
            </Paragraph>
            <Space size={8} wrap>
              <Text type="secondary">Menu: Settings → Company</Text>
              <Button type="link" onClick={() => navigate('/settings')}>Open</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="2) Hardware & Printer" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              Configure weighbridge / device settings and ensure printing works.
            </Paragraph>
            <Space size={8} wrap>
              <Text type="secondary">Menu: Settings → Hardware / Printer</Text>
              <Button type="link" onClick={() => navigate('/settings')}>Open</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="3) Seasons & Prices" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              Activate the correct season and set product prices so weighing workflows can calculate totals.
            </Paragraph>
            <Space size={8} wrap>
              <Text type="secondary">Menu: Settings → Seasons</Text>
              <Button type="link" onClick={() => navigate('/settings/seasons')}>Open</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="4) Products" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              Confirm paddy/rice product types exist and match your receipts and reports.
            </Paragraph>
            <Space size={8} wrap>
              <Text type="secondary">Menu: Settings → Products</Text>
              <Button type="link" onClick={() => navigate('/settings/products')}>Open</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="5) Master Data" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              Ensure Farmers and Manufacturers lists are ready before transactions begin.
            </Paragraph>
            <div>
              <Tag>Farmers</Tag>
              <Tag>Manufacturers</Tag>
            </div>
            <Space size={8} wrap style={{ marginTop: 8 }}>
              <Button type="link" onClick={() => navigate('/farmers')}>Open Farmers</Button>
              <Button type="link" onClick={() => navigate('/manufacturers')}>Open Manufacturers</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="6) Backup" style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              Set up backups early. It’s easier to prevent data loss than recover it.
            </Paragraph>
            <Space size={8} wrap>
              <Text type="secondary">Menu: Settings → Backup</Text>
              <Button type="link" onClick={() => navigate('/settings/backup')}>Open</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomeSetupGuide;
