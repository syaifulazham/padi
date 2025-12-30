import React from 'react';
import { Card, Typography, Row, Col, Divider, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';

const { Title, Paragraph, Text } = Typography;

const HomeMenuGuide = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Card style={{
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(4px)',
      }}>
        <Title level={2} style={{ marginTop: 0 }}>{t('homeMenuGuide.title')}</Title>
        <Paragraph style={{ marginBottom: 0 }}>
          {t('homeMenuGuide.description')}
        </Paragraph>
      </Card>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={t('homeMenuGuide.cards.dashboard.title')} style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              {t('homeMenuGuide.cards.dashboard.description')}
            </Paragraph>
            <Space size={8} wrap>
              <Button type="link" onClick={() => navigate('/dashboard')}>{t('homeMenuGuide.cards.dashboard.actions.open')}</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={t('homeMenuGuide.cards.purchases.title')} style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              {t('homeMenuGuide.cards.purchases.description')}
            </Paragraph>
            <Space size={8} wrap>
              <Button type="link" onClick={() => navigate('/purchases')}>{t('homeMenuGuide.cards.purchases.actions.weighIn')}</Button>
              <Button type="link" onClick={() => navigate('/purchases/history')}>{t('homeMenuGuide.cards.purchases.actions.history')}</Button>
              <Button type="link" onClick={() => navigate('/purchases/payment')}>{t('homeMenuGuide.cards.purchases.actions.payment')}</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t('homeMenuGuide.cards.sales.title')} style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              {t('homeMenuGuide.cards.sales.description')}
            </Paragraph>
            <Space size={8} wrap>
              <Button type="link" onClick={() => navigate('/sales')}>{t('homeMenuGuide.cards.sales.actions.weighIn')}</Button>
              <Button type="link" onClick={() => navigate('/sales/history')}>{t('homeMenuGuide.cards.sales.actions.history')}</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={t('homeMenuGuide.cards.reports.title')} style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              {t('homeMenuGuide.cards.reports.description')}
            </Paragraph>
            <Space size={8} wrap>
              <Button type="link" onClick={() => navigate('/reports/purchases')}>{t('homeMenuGuide.cards.reports.actions.purchase')}</Button>
              <Button type="link" onClick={() => navigate('/reports/sales')}>{t('homeMenuGuide.cards.reports.actions.sales')}</Button>
              <Button type="link" onClick={() => navigate('/reports/lorry')}>{t('homeMenuGuide.cards.reports.actions.lorry')}</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={t('homeMenuGuide.cards.stockpiles.title')} style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              {t('homeMenuGuide.cards.stockpiles.description')}
            </Paragraph>
            <Space size={8} wrap>
              <Button type="link" onClick={() => navigate('/stockpiles')}>{t('homeMenuGuide.cards.stockpiles.actions.open')}</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={t('homeMenuGuide.cards.settings.title')} style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}>
            <Paragraph>
              {t('homeMenuGuide.cards.settings.description')}
            </Paragraph>
            <Text type="secondary">{t('homeMenuGuide.cards.settings.tip')}</Text>
            <div style={{ marginTop: 8 }}>
              <Space size={8} wrap>
                <Button type="link" onClick={() => navigate('/settings')}>{t('homeMenuGuide.cards.settings.actions.general')}</Button>
                <Button type="link" onClick={() => navigate('/settings/seasons')}>{t('homeMenuGuide.cards.settings.actions.seasons')}</Button>
                <Button type="link" onClick={() => navigate('/settings/products')}>{t('homeMenuGuide.cards.settings.actions.products')}</Button>
                <Button type="link" onClick={() => navigate('/settings/backup')}>{t('homeMenuGuide.cards.settings.actions.backup')}</Button>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomeMenuGuide;
