import React from 'react';
import { Card, Typography, Row, Col, Divider, Tag, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';

const { Title, Paragraph, Text } = Typography;

const HomeSetupGuide = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Card style={{
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(4px)',
      }}>
        <Title level={2} style={{ marginTop: 0 }}>{t('homeSetupGuide.title')}</Title>
        <Paragraph style={{ marginBottom: 0 }}>
          {t('homeSetupGuide.description')}
        </Paragraph>
      </Card>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={t('homeSetupGuide.cards.companyDetails.title')} style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              {t('homeSetupGuide.cards.companyDetails.description')}
            </Paragraph>
            <Space size={8} wrap>
              <Text type="secondary">{t('homeSetupGuide.cards.companyDetails.hint')}</Text>
              <Button type="link" onClick={() => navigate('/settings')}>{t('homeSetupGuide.cards.openButton')}</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={t('homeSetupGuide.cards.hardwarePrinter.title')} style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              {t('homeSetupGuide.cards.hardwarePrinter.description')}
            </Paragraph>
            <Space size={8} wrap>
              <Text type="secondary">{t('homeSetupGuide.cards.hardwarePrinter.hint')}</Text>
              <Button type="link" onClick={() => navigate('/settings')}>{t('homeSetupGuide.cards.openButton')}</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t('homeSetupGuide.cards.seasonsPrices.title')} style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              {t('homeSetupGuide.cards.seasonsPrices.description')}
            </Paragraph>
            <Space size={8} wrap>
              <Text type="secondary">{t('homeSetupGuide.cards.seasonsPrices.hint')}</Text>
              <Button type="link" onClick={() => navigate('/settings/seasons')}>{t('homeSetupGuide.cards.openButton')}</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={t('homeSetupGuide.cards.products.title')} style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              {t('homeSetupGuide.cards.products.description')}
            </Paragraph>
            <Space size={8} wrap>
              <Text type="secondary">{t('homeSetupGuide.cards.products.hint')}</Text>
              <Button type="link" onClick={() => navigate('/settings/products')}>{t('homeSetupGuide.cards.openButton')}</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t('homeSetupGuide.cards.masterData.title')} style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              {t('homeSetupGuide.cards.masterData.description')}
            </Paragraph>
            <div>
              <Tag>{t('homeSetupGuide.cards.masterData.tags.farmers')}</Tag>
              <Tag>{t('homeSetupGuide.cards.masterData.tags.manufacturers')}</Tag>
            </div>
            <Space size={8} wrap style={{ marginTop: 8 }}>
              <Button type="link" onClick={() => navigate('/farmers')}>{t('homeSetupGuide.cards.masterData.openFarmers')}</Button>
              <Button type="link" onClick={() => navigate('/manufacturers')}>{t('homeSetupGuide.cards.masterData.openManufacturers')}</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={t('homeSetupGuide.cards.backup.title')} style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              {t('homeSetupGuide.cards.backup.description')}
            </Paragraph>
            <Space size={8} wrap>
              <Text type="secondary">{t('homeSetupGuide.cards.backup.hint')}</Text>
              <Button type="link" onClick={() => navigate('/settings/backup')}>{t('homeSetupGuide.cards.openButton')}</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomeSetupGuide;
