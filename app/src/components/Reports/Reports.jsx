import React, { useState, useEffect } from 'react';
import { Card, Spin, Alert } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { Routes, Route } from 'react-router-dom';
import PurchaseReport from './PurchaseReport';
import SalesReport from './SalesReport';
import LorryReport from './LorryReport';
import { useI18n } from '../../i18n/I18nProvider';

const Reports = () => {
  const { t } = useI18n();
  const [activeSeason, setActiveSeason] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveSeason();
  }, []);

  const loadActiveSeason = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.seasons.getActive();
      if (result.success && result.data) {
        setActiveSeason(result.data);
      }
    } catch (error) {
      console.error('Error loading active season:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card title={<><FileTextOutlined /> {t('reports.title')}</>}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!activeSeason) {
    return (
      <Card title={<><FileTextOutlined /> {t('reports.title')}</>}>
        <Alert
          message={t('reports.noActiveSeasonTitle')}
          description={t('reports.noActiveSeasonDesc')}
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Routes>
      <Route path="purchases" element={<PurchaseReport activeSeason={activeSeason} />} />
      <Route path="sales" element={<SalesReport activeSeason={activeSeason} />} />
      <Route path="lorry" element={<LorryReport activeSeason={activeSeason} />} />
      <Route path="*" element={
        <Card>
          <Alert
            message={t('reports.selectReportTitle')}
            description={t('reports.selectReportDesc')}
            type="info"
            showIcon
          />
        </Card>
      } />
    </Routes>
  );
};

export default Reports;
