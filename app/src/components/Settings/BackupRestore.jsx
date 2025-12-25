import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Alert, message, Divider, List, Typography, Modal, Input, Row, Col } from 'antd';
import { CloudDownloadOutlined, CloudUploadOutlined, FolderOpenOutlined, HistoryOutlined, DeleteOutlined, ExclamationCircleOutlined, DatabaseOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title, Paragraph } = Typography;

const BackupRestore = () => {
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
      message.warning('Please set backup path in General Settings first');
      return;
    }

    setLoading(true);
    try {
      const result = await window.electronAPI.backup.create(backupPath);
      if (result.success) {
        message.success(`Backup created successfully: ${result.filename}`);
        loadBackupHistory();
      } else {
        message.error(`Backup failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      message.error('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!backupPath) {
      message.warning('Please set backup path in General Settings first');
      return;
    }

    try {
      const result = await window.electronAPI.backup.selectFile();
      if (result.success && result.filePath) {
        // Show confirmation modal before restore
        Modal.confirm({
          title: 'Restore Database from Backup?',
          icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
          content: (
            <div>
              <p style={{ marginBottom: 8 }}>
                Selected file: <strong>{result.filePath.split('/').pop()}</strong>
              </p>
              <p style={{ marginBottom: 8, color: '#ff4d4f' }}>
                ⚠️ This will replace all current data with the backup data.
              </p>
              <p style={{ fontWeight: 600 }}>
                Make sure to create a backup of current data first if needed.
              </p>
            </div>
          ),
          okText: 'Restore',
          okType: 'primary',
          cancelText: 'Cancel',
          onOk: async () => {
            const hideLoading = message.loading('Restoring database... please wait', 0);
            setLoading(true);
            
            try {
              console.log('Starting restore from:', result.filePath);
              const restoreResult = await window.electronAPI.backup.restore(result.filePath);
              
              hideLoading();
              
              if (restoreResult.success) {
                Modal.success({
                  title: 'Database Restored Successfully',
                  content: (
                    <div>
                      <p>Database has been restored from backup.</p>
                      <p style={{ fontWeight: 600, marginTop: 8 }}>
                        Please restart the application to see the restored data.
                      </p>
                    </div>
                  )
                });
              } else {
                message.error(`Restore failed: ${restoreResult.error}`);
              }
            } catch (error) {
              hideLoading();
              console.error('Error during restore:', error);
              message.error(`Failed to restore backup: ${error.message}`);
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
      message.error('Failed to select backup file');
    }
  };

  const handleOpenBackupFolder = async () => {
    if (!backupPath) {
      message.warning('Please set backup path in General Settings first');
      return;
    }

    try {
      const result = await window.electronAPI.backup.openFolder(backupPath);
      if (!result.success) {
        message.error(`Failed to open folder: ${result.error}`);
      }
    } catch (error) {
      console.error('Error opening backup folder:', error);
      message.error('Failed to open backup folder');
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
      title: 'Clean All Database Data?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      width: 600,
      content: (
        <div>
          <p style={{ marginBottom: 8, fontWeight: 600, color: '#ff4d4f' }}>
            ⚠️ WARNING: This action cannot be undone!
          </p>
          <p style={{ marginBottom: 8 }}>
            This will permanently delete:
          </p>
          <ul style={{ marginLeft: 20, marginBottom: 8 }}>
            <li>All purchase transactions</li>
            <li>All sales transactions</li>
            <li>All farmers</li>
            <li>All manufacturers</li>
            <li>All seasons</li>
            <li>All products and grades</li>
            <li>All documents</li>
          </ul>
          <p style={{ fontWeight: 600 }}>
            User accounts will be preserved.
          </p>
          <p style={{ marginTop: 12, color: '#faad14' }}>
            💡 Tip: Create a backup before cleaning the database.
          </p>

          <Divider style={{ margin: '16px 0' }} />

          <div style={{ backgroundColor: '#fff7e6', padding: 16, borderRadius: 4, marginBottom: 16 }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>
              To proceed, please enter the following verification codes:
            </p>
            
            <div style={{ marginBottom: 12 }}>
              <Text strong>Verification Code 1:</Text>
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
                placeholder="Enter code 1"
                style={{ marginTop: 8 }}
                maxLength={6}
                onChange={(e) => {
                  inputCode1 = e.target.value.toUpperCase();
                }}
              />
            </div>

            <div>
              <Text strong>Verification Code 2:</Text>
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
                placeholder="Enter code 2"
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
      okText: 'Confirm & Delete All Data',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        // Verify both codes match
        if (inputCode1 !== verificationCode1 || inputCode2 !== verificationCode2) {
          message.error('Verification codes do not match. Database cleanup cancelled.');
          return Promise.reject();
        }

        setLoading(true);
        try {
          const result = await window.electronAPI.database.cleanup();
          if (result.success) {
            message.success('Database cleaned successfully. All data removed except users.');
          } else {
            message.error(`Cleanup failed: ${result.error}`);
          }
        } catch (error) {
          console.error('Error cleaning database:', error);
          message.error('Failed to clean database');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div style={{ padding: '0 24px' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <DatabaseOutlined /> Backup & Database Management
      </Title>

      <Row gutter={[24, 24]}>
        {/* Backup & Restore Card */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <SaveOutlined />
                <span>Backup & Restore</span>
              </Space>
            }
            bordered={true}
            style={{ height: '100%' }}
          >
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Create backups of your database to protect against data loss. Backups include all transactions, 
              farmers, manufacturers, seasons, products, and settings.
            </Paragraph>

            {backupPath ? (
              <Alert
                message="Backup Location"
                description={<Text style={{ fontSize: 12 }}>{backupPath}</Text>}
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
            ) : (
              <Alert
                message="No Backup Path Set"
                description="Configure backup path in Settings → General → Backup first."
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
                Create Backup Now
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
                Restore from Backup
              </Button>

              <Button
                size="large"
                icon={<FolderOpenOutlined />}
                onClick={handleOpenBackupFolder}
                disabled={!backupPath}
                block
              >
                Open Backup Folder
              </Button>
            </Space>

            <Divider style={{ margin: '16px 0' }} />

            <Text type="secondary" style={{ fontSize: 12 }}>
              <strong>Backup Format:</strong> MySQL dump (.sql) with timestamp<br />
              <strong>Naming:</strong> padi_backup_YYYYMMDD_HHMMSS.sql<br />
              <strong>Contents:</strong> All transactions, farmers, manufacturers, seasons, and products
            </Text>
          </Card>
        </Col>

        {/* Database Cleanup Card */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <DeleteOutlined style={{ color: '#ff4d4f' }} />
                <span>Database Cleanup</span>
              </Space>
            }
            bordered={true}
            style={{ height: '100%', borderColor: '#ffccc7' }}
          >
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Remove all data from the database to start fresh. This is useful for testing or 
              resetting the system. User accounts will be preserved.
            </Paragraph>

            <Alert
              message="⚠️ Danger Zone"
              description="This action permanently deletes all data and cannot be undone. Always create a backup first!"
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>What will be deleted:</Text>
              <ul style={{ marginLeft: 20, color: '#8c8c8c' }}>
                <li>All purchase transactions</li>
                <li>All sales transactions</li>
                <li>All farmers and documents</li>
                <li>All manufacturers</li>
                <li>All seasons and price history</li>
                <li>All products and grades</li>
              </ul>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#52c41a' }}>What will be kept:</Text>
              <ul style={{ marginLeft: 20, color: '#8c8c8c' }}>
                <li>User accounts and credentials</li>
                <li>Application settings</li>
              </ul>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <Alert
              message="💡 Recommended Steps"
              description={
                <ol style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>Create a backup first</li>
                  <li>Verify backup file is created</li>
                  <li>Proceed with cleanup</li>
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
              Clean All Database Data
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BackupRestore;
