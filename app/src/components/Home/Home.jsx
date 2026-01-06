import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Descriptions, Divider, Row, Col, Spin, Statistic, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SettingOutlined, BarChartOutlined, ShoppingCartOutlined, ShopOutlined, DatabaseOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useI18n } from '../../i18n/I18nProvider';

const { Title, Paragraph, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [seasonLoading, setSeasonLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState(null);

  useEffect(() => {
    const loadActiveSeason = async () => {
      try {
        setSeasonLoading(true);
        const result = await window.electronAPI.seasons?.getActive();
        if (result?.success && result.data) {
          setActiveSeason(result.data);
        } else {
          setActiveSeason(null);
        }
      } catch (error) {
        console.error('Error loading active season:', error);
        setActiveSeason(null);
      } finally {
        setSeasonLoading(false);
      }
    };

    loadActiveSeason();

    const handleSeasonChange = () => {
      loadActiveSeason();
    };

    window.addEventListener('season-changed', handleSeasonChange);
    return () => {
      window.removeEventListener('season-changed', handleSeasonChange);
    };
  }, []);

  const sectionTitleStyle = {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.35)',
    padding: '8px 12px',
    borderRadius: 8,
    backdropFilter: 'blur(4px)',
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card style={{
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(4px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img 
            src="/sparrow.png" 
            alt="Sparrow Icon" 
            style={{ width: 80, height: 80, objectFit: 'contain' }}
          />
          <div style={{ flex: 1 }}>
            <Title level={2} style={{ marginTop: 0, marginBottom: 8 }}>{t('home.title')}</Title>
            <Paragraph style={{ marginBottom: 0 }}>
              {t('home.description')}
            </Paragraph>
          </div>
        </div>
      </Card>

      <Divider />

      <Card
        title={t('home.currentSeason.title')}
        style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}
        extra={<Button type="link" onClick={() => navigate('/settings/seasons')}>{t('home.currentSeason.manageButton')}</Button>}
      >
        {seasonLoading ? (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Spin />
          </div>
        ) : !activeSeason ? (
          <Alert
            type="warning"
            showIcon
            message={t('home.currentSeason.noActiveSeason')}
            description={t('home.currentSeason.noActiveSeasonDesc')}
            action={<Button onClick={() => navigate('/settings/seasons')}>{t('home.currentSeason.goToSeasons')}</Button>}
          />
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label={t('home.currentSeason.fields.season')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text strong>{activeSeason.season_name || '-'}</Text>
                    {activeSeason.season_code ? <Tag color="blue">{activeSeason.season_code}</Tag> : null}
                    {activeSeason.status ? <Tag color="green">{String(activeSeason.status).toUpperCase()}</Tag> : null}
                    {activeSeason.mode ? <Tag color={activeSeason.mode === 'LIVE' ? 'green' : 'orange'}>{activeSeason.mode}</Tag> : null}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label={t('home.currentSeason.fields.yearSeasonNum')}>
                  {activeSeason.year || '-'} / {activeSeason.season_number || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('home.currentSeason.fields.period')}>
                  {activeSeason.start_date ? dayjs(activeSeason.start_date).format('DD/MM/YYYY') : '-'}
                  {' '}–{' '}
                  {activeSeason.end_date ? dayjs(activeSeason.end_date).format('DD/MM/YYYY') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('home.currentSeason.fields.openingPrice')}>
                  {activeSeason.opening_price_per_ton != null ? Number(activeSeason.opening_price_per_ton).toFixed(2) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('home.currentSeason.fields.targetQuantity')}>
                  {activeSeason.target_quantity_kg != null ? Number(activeSeason.target_quantity_kg).toFixed(2) : '-'}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col xs={24} md={8}>
              <Row gutter={[16, 16]}>
                <Col span={12} md={24}>
                  <Statistic
                    title={t('home.currentSeason.stats.openingPrice')}
                    value={activeSeason.opening_price_per_ton != null ? Number(activeSeason.opening_price_per_ton) : 0}
                    precision={2}
                    suffix={t('home.currentSeason.stats.perTon')}
                  />
                </Col>
                <Col span={12} md={24}>
                  <Statistic
                    title={t('home.currentSeason.stats.target')}
                    value={activeSeason.target_quantity_kg != null ? Number(activeSeason.target_quantity_kg) : 0}
                    precision={2}
                    suffix={t('home.currentSeason.stats.kg')}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        )}
      </Card>

      <Divider />

      <div style={{ ...sectionTitleStyle, marginBottom: 12 }}>
        <Title level={4} style={{ margin: 0 }}>{t('home.sections.beforeYouStart')}</Title>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card
            title={<span><SettingOutlined /> {t('home.cards.mainConfig.title')}</span>}
            style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}
            actions={[
              <Button type="link" onClick={() => navigate('/home/setup')} key="more">{t('home.cards.showMore')}</Button>
            ]}
          >
            <Paragraph>
              {t('home.cards.mainConfig.description')}
            </Paragraph>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Tag>{t('home.cards.mainConfig.tags.company')}</Tag>
              <Tag>{t('home.cards.mainConfig.tags.hardware')}</Tag>
              <Tag>{t('home.cards.mainConfig.tags.printer')}</Tag>
              <Tag>{t('home.cards.mainConfig.tags.language')}</Tag>
            </div>
            <Text type="secondary">{t('home.cards.mainConfig.hint')}</Text>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            title={<span><DatabaseOutlined /> {t('home.cards.seasonPrices.title')}</span>}
            style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}
            actions={[
              <Button type="link" onClick={() => navigate('/settings/seasons')} key="goto">{t('home.cards.seasonPrices.goToSeasons')}</Button>
            ]}
          >
            <Paragraph>
              {t('home.cards.seasonPrices.description')}
            </Paragraph>
            <Text type="secondary">{t('home.cards.seasonPrices.hint')}</Text>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            title={<span><SafetyCertificateOutlined /> {t('home.cards.masterData.title')}</span>}
            style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}
            actions={[
              <Button type="link" onClick={() => navigate('/home/setup')} key="more">{t('home.cards.showMore')}</Button>
            ]}
          >
            <Paragraph>
              {t('home.cards.masterData.description')}
            </Paragraph>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Tag>{t('home.cards.masterData.tags.farmers')}</Tag>
              <Tag>{t('home.cards.masterData.tags.manufacturers')}</Tag>
              <Tag>{t('home.cards.masterData.tags.products')}</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <Divider />

      <div style={{ ...sectionTitleStyle, marginBottom: 12 }}>
        <Title level={4} style={{ margin: 0 }}>{t('home.sections.menuIntroduction')}</Title>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card
            title={<span><ShoppingCartOutlined /> {t('home.cards.purchases.title')}</span>}
            style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}
            actions={[
              <Button type="link" onClick={() => navigate('/home/menus')} key="more">{t('home.cards.showMore')}</Button>
            ]}
          >
            <Paragraph>
              {t('home.cards.purchases.description')}
            </Paragraph>
            <Text type="secondary">{t('home.cards.purchases.hint')}</Text>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            title={<span><ShopOutlined /> {t('home.cards.sales.title')}</span>}
            style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}
            actions={[
              <Button type="link" onClick={() => navigate('/home/menus')} key="more">{t('home.cards.showMore')}</Button>
            ]}
          >
            <Paragraph>
              {t('home.cards.sales.description')}
            </Paragraph>
            <Text type="secondary">{t('home.cards.sales.hint')}</Text>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            title={<span><BarChartOutlined /> {t('home.cards.reports.title')}</span>}
            style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(4px)' }}
            actions={[
              <Button type="link" onClick={() => navigate('/home/menus')} key="more">{t('home.cards.showMore')}</Button>
            ]}
          >
            <Paragraph>
              {t('home.cards.reports.description')}
            </Paragraph>
            <Text type="secondary">{t('home.cards.reports.hint')}</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
