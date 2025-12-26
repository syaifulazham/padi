import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Alert, message, Divider, List, Typography, Modal, Input, Row, Col } from 'antd';
import { CloudDownloadOutlined, CloudUploadOutlined, FolderOpenOutlined, HistoryOutlined, DeleteOutlined, ExclamationCircleOutlined, DatabaseOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useI18n } from '../../i18n/I18nProvider';

const { Text, Title, Paragraph } = Typography;

const BackupRestore = () => {
  const { t } = useI18n();
  const [backupPath, setBackupPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [backupHistory, setBackupHistory] = useState([]);

  useEffect(() => {
    loadSettings();
    loadBackupHistory();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await window.electronAPI.settings?.getAll();
      if (result?.success && result.data?.backup_path) {
        setBackupPath(result.data.backup_path);
      }
    } catch (error) {
      console.error('Error loading backup path:', error);
    }
  };

  const loadBackupHistory = async () => {
    // TODO: Implement backup history listing
    // This would require an electron API to list backup files in the backup directory
    setBackupHistory([]);
  };

  const handleBackup = async () => {
    if (!backupPath) {
      message.warning(t('backupRestore.messages.setBackupPathFirst'));
      return;
    }

    setLoading(true);
    try {
      const result = await window.electronAPI.backup.create(backupPath);
      if (result.success) {
        message.success(`${t('backupRestore.messages.backupCreatedSuccess')}: ${result.filename}`);
        loadBackupHistory();
      } else {
        message.error(`${t('backupRestore.messages.backupFailed')}: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      message.error(t('backupRestore.messages.failedToCreateBackup'));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!backupPath) {
      message.warning(t('backupRestore.messages.setBackupPathFirst'));
      return;
    }

    try {
      const result = await window.electronAPI.backup.selectFile();
      if (result.success && result.filePath) {
        // Show confirmation modal before restore
        Modal.confirm({
          title: t('backupRestore.restoreModal.title'),
          icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
          content: (
            <div>
              <p style={{ marginBottom: 8 }}>
                {t('backupRestore.restoreModal.selectedFile')}: <strong>{result.filePath.split('/').pop()}</strong>
              </p>
              <p style={{ marginBottom: 8, color: '#ff4d4f' }}>
                {t('backupRestore.restoreModal.warning')}
              </p>
              <p style={{ fontWeight: 600 }}>
                {t('backupRestore.restoreModal.makeBackupFirst')}
              </p>
            </div>
          ),
          okText: t('backupRestore.restoreModal.restoreButton'),
          okType: 'primary',
          cancelText: t('backupRestore.restoreModal.cancelButton'),
          onOk: async () => {
            const hideLoading = message.loading(t('backupRestore.messages.restoringDatabase'), 0);
            setLoading(true);
            
            try {
              console.log('Starting restore from:', result.filePath);
              const restoreResult = await window.electronAPI.backup.restore(result.filePath);
              
              hideLoading();
              
              if (restoreResult.success) {
                Modal.success({
                  title: t('backupRestore.messages.restoreSuccessTitle'),
                  content: (
                    <div>
                      <p>{t('backupRestore.messages.restoreSuccessDesc')}</p>
                      <p style={{ fontWeight: 600, marginTop: 8 }}>
                        {t('backupRestore.messages.restartRequired')}
                      </p>
                    </div>
                  )
                });
              } else {
                message.error(`${t('backupRestore.messages.restoreFailed')}: ${restoreResult.error}`);
              }
            } catch (error) {
              hideLoading();
              console.error('Error during restore:', error);
              message.error(`${t('backupRestore.messages.failedToRestoreBackup')}: ${error.message}`);
            } finally {
              setLoading(false);
            }
          }
        });
      } else if (result.canceled) {
        // User cancelled file selection
        console.log('File selection cancelled');
      }
    } catch (error) {
      console.error('Error selecting backup file:', error);
      message.error(t('backupRestore.messages.failedToSelectFile'));
    }
  };

  const handleOpenBackupFolder = async () => {
    if (!backupPath) {
      message.warning(t('backupRestore.messages.setBackupPathFirst'));
      return;
    }

    try {
      const result = await window.electronAPI.backup.openFolder(backupPath);
      if (!result.success) {
        message.error(`${t('backupRestore.messages.failedToOpenFolder')}: ${result.error}`);
      }
    } catch (error) {
      console.error('Error opening backup folder:', error);
      message.error(t('backupRestore.messages.failedToOpenBackupFolder'));
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCleanupDatabase = () => {
    const verificationCode1 = generateRandomCode();
    const verificationCode2 = generateRandomCode();
    let inputCode1 = '';
    let inputCode2 = '';

    Modal.confirm({
      title: t('backupRestore.cleanupModal.title'),
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      width: 600,
      content: (
        <div>
          <p style={{ marginBottom: 8, fontWeight: 600, color: '#ff4d4f' }}>
            {t('backupRestore.cleanupModal.warningCannotUndo')}
          </p>
          <p style={{ marginBottom: 8 }}>
            {t('backupRestore.cleanupModal.willDeleteLabel')}:
          </p>
          <ul style={{ marginLeft: 20, marginBottom: 8 }}>
            <li>{t('backupRestore.cleanupModal.deleteItems.purchases')}</li>
            <li>{t('backupRestore.cleanupModal.deleteItems.sales')}</li>
            <li>{t('backupRestore.cleanupModal.deleteItems.farmers')}</li>
            <li>{t('backupRestore.cleanupModal.deleteItems.manufacturers')}</li>
            <li>{t('backupRestore.cleanupModal.deleteItems.seasons')}</li>
            <li>{t('backupRestore.cleanupModal.deleteItems.products')}</li>
            <li>{t('backupRestore.cleanupModal.deleteItems.documents')}</li>
          </ul>
          <p style={{ fontWeight: 600 }}>
            {t('backupRestore.cleanupModal.accountsPreserved')}
          </p>
          <p style={{ marginTop: 12, color: '#faad14' }}>
            {t('backupRestore.cleanupModal.tipCreateBackup')}
          </p>

          <Divider style={{ margin: '16px 0' }} />

          <div style={{ backgroundColor: '#fff7e6', padding: 16, borderRadius: 4, marginBottom: 16 }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>
              {t('backupRestore.cleanupModal.enterVerificationCodes')}:
            </p>
            
            <div style={{ marginBottom: 12 }}>
              <Text strong>{t('backupRestore.cleanupModal.verificationCode1')}:</Text>
              <div style={{ 
                backgroundColor: '#fff', 
                padding: '8px 12px', 
                border: '2px solid #ff4d4f', 
                borderRadius: 4, 
                fontSize: 18, 
                fontWeight: 'bold', 
                letterSpacing: 4, 
                textAlign: 'center',
                marginTop: 4,
                fontFamily: 'monospace'
              }}>
                {verificationCode1}
              </div>
              <Input
                placeholder={t('backupRestore.cleanupModal.enterCode1')}
                style={{ marginTop: 8 }}
                maxLength={6}
                onChange={(e) => {
                  inputCode1 = e.target.value.toUpperCase();
                }}
              />
            </div>

            <div>
              <Text strong>{t('backupRestore.cleanupModal.verificationCode2')}:</Text>
              <div style={{ 
                backgroundColor: '#fff', 
                padding: '8px 12px', 
                border: '2px solid #ff4d4f', 
                borderRadius: 4, 
                fontSize: 18, 
                fontWeight: 'bold', 
                letterSpacing: 4, 
                textAlign: 'center',
                marginTop: 4,
                fontFamily: 'monospace'
              }}>
                {verificationCode2}
              </div>
              <Input
                placeholder={t('backupRestore.cleanupModal.enterCode2')}
                style={{ marginTop: 8 }}
                maxLength={6}
                onChange={(e) => {
                  inputCode2 = e.target.value.toUpperCase();
                }}
              />
            </div>
          </div>
        </div>
      ),
      okText: t('backupRestore.cleanupModal.confirmDeleteButton'),
      okType: 'danger',
      cancelText: t('backupRestore.cleanupModal.cancelButton'),
      onOk: async () => {
        // Verify both codes match
        if (inputCode1 !== verificationCode1 || inputCode2 !== verificationCode2) {
          message.error(t('backupRestore.messages.verificationFailed'));
          return Promise.reject();
        }

        setLoading(true);
        try {
          const result = await window.electronAPI.database.cleanup();
          if (result.success) {
            message.success(t('backupRestore.messages.cleanupSuccess'));
          } else {
            message.error(`${t('backupRestore.messages.cleanupFailed')}: ${result.error}`);
          }
        } catch (error) {
          console.error('Error cleaning database:', error);
          message.error(t('backupRestore.messages.failedToCleanDatabase'));
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div style={{ padding: '0 24px' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <DatabaseOutlined /> {t('backupRestore.pageTitle')}
      </Title>

      <Row gutter={[24, 24]}>
        {/* Backup & Restore Card */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <SaveOutlined />
                <span>{t('backupRestore.backupCard.title')}</span>
              </Space>
            }
            bordered={true}
            style={{ height: '100%' }}
          >
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              {t('backupRestore.backupCard.description')}
            </Paragraph>

            {backupPath ? (
              <Alert
                message={t('backupRestore.backupCard.backupLocationLabel')}
                description={<Text style={{ fontSize: 12 }}>{backupPath}</Text>}
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
            ) : (
              <Alert
                message={t('backupRestore.backupCard.noBackupPathLabel')}
                description={t('backupRestore.backupCard.configureBackupPath')}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Divider style={{ margin: '16px 0' }} />

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button
                type="primary"
                size="large"
                icon={<CloudDownloadOutlined />}
                onClick={handleBackup}
                loading={loading}
                disabled={!backupPath}
                block
              >
                {t('backupRestore.backupCard.createBackupButton')}
              </Button>

              <Button
                size="large"
                icon={<CloudUploadOutlined />}
                onClick={handleRestore}
                loading={loading}
                disabled={!backupPath}
                danger
                block
              >
                {t('backupRestore.backupCard.restoreButton')}
              </Button>

              <Button
                size="large"
                icon={<FolderOpenOutlined />}
                onClick={handleOpenBackupFolder}
                disabled={!backupPath}
                block
              >
                {t('backupRestore.backupCard.openFolderButton')}
              </Button>
            </Space>

            <Divider style={{ margin: '16px 0' }} />

            <Text type="secondary" style={{ fontSize: 12 }}>
              <strong>{t('backupRestore.backupCard.backupFormatLabel')}:</strong> {t('backupRestore.backupCard.backupFormatValue')}<br />
              <strong>{t('backupRestore.backupCard.namingLabel')}:</strong> {t('backupRestore.backupCard.namingValue')}<br />
              <strong>{t('backupRestore.backupCard.contentsLabel')}:</strong> {t('backupRestore.backupCard.contentsValue')}
            </Text>
          </Card>
        </Col>

        {/* Database Cleanup Card */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <DeleteOutlined style={{ color: '#ff4d4f' }} />
                <span>{t('backupRestore.cleanupCard.title')}</span>
              </Space>
            }
            bordered={true}
            style={{ height: '100%', borderColor: '#ffccc7' }}
          >
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              {t('backupRestore.cleanupCard.description')}
            </Paragraph>

            <Alert
              message={t('backupRestore.cleanupCard.dangerZoneLabel')}
              description={t('backupRestore.cleanupCard.dangerZoneDesc')}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>{t('backupRestore.cleanupCard.willDeleteLabel')}:</Text>
              <ul style={{ marginLeft: 20, color: '#8c8c8c' }}>
                <li>{t('backupRestore.cleanupCard.deleteItems.purchases')}</li>
                <li>{t('backupRestore.cleanupCard.deleteItems.sales')}</li>
                <li>{t('backupRestore.cleanupCard.deleteItems.farmersAndDocs')}</li>
                <li>{t('backupRestore.cleanupCard.deleteItems.manufacturers')}</li>
                <li>{t('backupRestore.cleanupCard.deleteItems.seasonsAndPrices')}</li>
                <li>{t('backupRestore.cleanupCard.deleteItems.productsAndGrades')}</li>
              </ul>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#52c41a' }}>{t('backupRestore.cleanupCard.willKeepLabel')}:</Text>
              <ul style={{ marginLeft: 20, color: '#8c8c8c' }}>
                <li>{t('backupRestore.cleanupCard.keepItems.userAccounts')}</li>
                <li>{t('backupRestore.cleanupCard.keepItems.appSettings')}</li>
              </ul>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <Alert
              message={t('backupRestore.cleanupCard.recommendedStepsLabel')}
              description={
                <ol style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>{t('backupRestore.cleanupCard.steps.createBackup')}</li>
                  <li>{t('backupRestore.cleanupCard.steps.verifyBackup')}</li>
                  <li>{t('backupRestore.cleanupCard.steps.proceedCleanup')}</li>
                </ol>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Button
              size="large"
              icon={<DeleteOutlined />}
              onClick={handleCleanupDatabase}
              loading={loading}
              danger
              type="primary"
              block
            >
              {t('backupRestore.cleanupCard.cleanButton')}
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BackupRestore;
