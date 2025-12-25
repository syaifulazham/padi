import React, { useState, useEffect, useRef } from 'react';
import { Upload, Button, Input, Image, Space, message, Card, Alert } from 'antd';
import { UploadOutlined, DeleteOutlined, CameraOutlined, QrcodeOutlined, ScanOutlined } from '@ant-design/icons';
import jsQR from 'jsqr';
import { useI18n } from '../../i18n/I18nProvider';

const SubsidyCardUpload = ({ farmerId, onUploadSuccess }) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [subsidyCard, setSubsidyCard] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [qrHashcode, setQrHashcode] = useState('');
  const [detecting, setDetecting] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (farmerId) {
      loadSubsidyCard();
    }
  }, [farmerId]);

  const loadSubsidyCard = async () => {
    if (!farmerId) return;

    try {
      const result = await window.electronAPI.farmerDocuments.getSubsidyCard(farmerId);
      if (result.success) {
        setSubsidyCard(result.data);
        setQrHashcode(result.data.qr_hashcode || '');
        
        // Load image
        const imageResult = await window.electronAPI.farmerDocuments.getImage(result.data.file_path);
        if (imageResult.success) {
          setImagePreview(imageResult.data);
        }
      }
    } catch (error) {
      console.error('Error loading subsidy card:', error);
    }
  };

  const handleImageUpload = async (file) => {
    if (!farmerId) {
      message.error(t('farmers.subsidy.needSaveBeforeUpload'));
      return false;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      message.error(t('farmers.subsidy.imageTooLarge'));
      return false;
    }

    console.log('Starting image upload. File size:', (file.size / 1024).toFixed(2), 'KB');
    setLoading(true);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          console.log('File read complete, starting upload...');
          const base64Image = e.target.result;
          console.log('Base64 image size:', (base64Image.length / 1024).toFixed(2), 'KB');
          
          // Upload image to electron with timeout
          console.log('Uploading image for farmer:', farmerId);
          
          const uploadPromise = window.electronAPI.farmerDocuments.uploadImage(farmerId, base64Image);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout - file may be too large')), 30000)
          );
          
          const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
          console.log('Upload result:', uploadResult);
          
          if (uploadResult.success) {
            console.log('Creating document record...');
            // Create document record
            const docData = {
              farmer_id: farmerId,
              document_type: 'subsidy_card',
              document_name: file.name,
              file_path: uploadResult.data.filePath,
              file_size: uploadResult.data.fileSize,
              qr_hashcode: qrHashcode || null
            };
            
            const createResult = await window.electronAPI.farmerDocuments.create(docData);
            console.log('Create result:', createResult);
            
            if (createResult.success) {
              message.success(t('farmers.subsidy.uploadSuccess'));
              setImagePreview(base64Image);
              await loadSubsidyCard();
              if (onUploadSuccess) onUploadSuccess();
            } else {
              message.error(t('farmers.subsidy.saveDocFailed').replace('{error}', createResult.error));
            }
          } else {
            message.error(t('farmers.subsidy.uploadFailed').replace('{error}', uploadResult.error));
          }
        } catch (error) {
          console.error('Upload error:', error);
          message.error(t('farmers.subsidy.processImageError').replace('{error}', error.message));
        } finally {
          setLoading(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        message.error(t('farmers.subsidy.readFileFailed'));
        setLoading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      message.error(t('farmers.subsidy.uploadError').replace('{error}', error.message));
      setLoading(false);
    }
    
    return false; // Prevent auto upload
  };

  const handleUpdateHashcode = async () => {
    if (!subsidyCard) {
      message.error(t('farmers.subsidy.noCardFound'));
      return;
    }

    setLoading(true);
    try {
      const result = await window.electronAPI.farmerDocuments.update(
        subsidyCard.document_id,
        {
          document_name: subsidyCard.document_name,
          qr_hashcode: qrHashcode,
          notes: subsidyCard.notes
        }
      );

      if (result.success) {
        message.success(t('farmers.subsidy.qrUpdated'));
        loadSubsidyCard();
      } else {
        message.error(t('farmers.subsidy.updateFailed').replace('{error}', result.error));
      }
    } catch (error) {
      message.error(t('farmers.subsidy.updateError').replace('{error}', error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!subsidyCard) return;

    setLoading(true);
    try {
      const result = await window.electronAPI.farmerDocuments.delete(subsidyCard.document_id);
      
      if (result.success) {
        message.success(t('farmers.subsidy.deleted'));
        setSubsidyCard(null);
        setImagePreview(null);
        setQrHashcode('');
      } else {
        message.error(t('farmers.subsidy.deleteFailed').replace('{error}', result.error));
      }
    } catch (error) {
      message.error(t('farmers.subsidy.deleteError').replace('{error}', error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDetectQRCode = async () => {
    if (!imagePreview) {
      message.error(t('farmers.subsidy.noImageToScan'));
      return;
    }

    setDetecting(true);
    try {
      console.log('Starting QR code detection...');
      
      // Create an image element using createElement
      const img = document.createElement('img');
      img.src = imagePreview;
      
      img.onload = () => {
        try {
          // Create canvas and draw image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          console.log('Image loaded, scanning for QR code...');
          console.log('Image dimensions:', canvas.width, 'x', canvas.height);
          
          // Detect QR code with multiple attempts
          let code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          
          // Try with inversion if not found
          if (!code) {
            console.log('Trying with inversion...');
            code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "attemptBoth",
            });
          }
          
          if (code) {
            console.log('QR code detected:', code.data);
            setQrHashcode(code.data);
            message.success(t('farmers.subsidy.qrDetected').replace('{count}', code.data.length));
          } else {
            console.log('No QR code found in image');
            message.warning(t('farmers.subsidy.qrNotDetected'));
          }
        } catch (error) {
          console.error('Error processing image:', error);
          message.error(t('farmers.subsidy.processImageError').replace('{error}', error.message));
        } finally {
          setDetecting(false);
        }
      };
      
      img.onerror = (error) => {
        console.error('Failed to load image:', error);
        message.error(t('farmers.subsidy.failedToLoadImage'));
        setDetecting(false);
      };
    } catch (error) {
      console.error('Error detecting QR code:', error);
      message.error(t('farmers.subsidy.detectError').replace('{error}', error.message));
      setDetecting(false);
    }
  };

  return (
    <Card 
      title={
        <Space>
          <QrcodeOutlined />
          {t('farmers.subsidy.title')}
        </Space>
      }
      size="small"
    >
      {!farmerId && (
        <Alert
          message={t('farmers.subsidy.saveFirstTitle')}
          description={t('farmers.subsidy.saveFirstDesc')}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {loading && (
        <Alert
          message={t('farmers.subsidy.uploadingTitle')}
          description={t('farmers.subsidy.uploadingDesc')}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {imagePreview ? (
        <div>
          <Image
            src={imagePreview}
            alt={t('farmers.subsidy.alt')}
            style={{ 
              maxWidth: '100%', 
              maxHeight: 300, 
              border: '1px solid #d9d9d9',
              borderRadius: 8,
              marginBottom: 16,
              filter: 'grayscale(100%)'
            }}
          />
          
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                addonBefore={<QrcodeOutlined />}
                placeholder={t('farmers.subsidy.qrPlaceholderLong')}
                value={qrHashcode}
                onChange={(e) => setQrHashcode(e.target.value)}
                maxLength={500}
              />
              <Button 
                icon={<ScanOutlined />}
                onClick={handleDetectQRCode}
                loading={detecting}
                title={t('farmers.subsidy.detectTitle')}
              >
                {t('farmers.subsidy.detect')}
              </Button>
            </Space.Compact>
            
            <Space>
              <Button 
                type="primary"
                onClick={handleUpdateHashcode}
                loading={loading}
                disabled={!qrHashcode}
              >
                {t('farmers.subsidy.updateQr')}
              </Button>
              
              <Button 
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
                loading={loading}
              >
                {t('farmers.subsidy.deleteCard')}
              </Button>
            </Space>
          </Space>
        </div>
      ) : (
        <div>
          <Input
            addonBefore={<QrcodeOutlined />}
            placeholder={t('farmers.subsidy.qrPlaceholderOptional')}
            value={qrHashcode}
            onChange={(e) => setQrHashcode(e.target.value)}
            maxLength={500}
            style={{ marginBottom: 16 }}
          />
          
          <Upload
            accept="image/*"
            beforeUpload={handleImageUpload}
            maxCount={1}
            showUploadList={false}
            disabled={!farmerId}
          >
            <Button 
              icon={<CameraOutlined />}
              loading={loading}
              disabled={!farmerId}
              block
            >
              {t('farmers.subsidy.uploadImage')}
            </Button>
          </Upload>
        </div>
      )}

      {subsidyCard && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
          {t('farmers.subsidy.uploadedAt').replace('{date}', new Date(subsidyCard.upload_date).toLocaleString())}
          {subsidyCard.qr_hashcode && (
            <div style={{ marginTop: 4 }}>
              {t('farmers.subsidy.qrCodePrefix')} {subsidyCard.qr_hashcode.substring(0, 50)}...
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default SubsidyCardUpload;
