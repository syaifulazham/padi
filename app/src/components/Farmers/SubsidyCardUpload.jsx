import React, { useState, useEffect, useRef } from 'react';
import { Upload, Button, Input, Image, Space, message, Card, Alert } from 'antd';
import { UploadOutlined, DeleteOutlined, CameraOutlined, QrcodeOutlined, ScanOutlined } from '@ant-design/icons';
import jsQR from 'jsqr';

const SubsidyCardUpload = ({ farmerId, onUploadSuccess }) => {
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
      message.error('Please save the farmer first before uploading subsidy card');
      return false;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      message.error('Image file is too large. Maximum size is 10MB.');
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
              message.success('Subsidy card uploaded successfully!');
              setImagePreview(base64Image);
              await loadSubsidyCard();
              if (onUploadSuccess) onUploadSuccess();
            } else {
              message.error('Failed to save document record: ' + createResult.error);
            }
          } else {
            message.error('Failed to upload image: ' + uploadResult.error);
          }
        } catch (error) {
          console.error('Upload error:', error);
          message.error('Error processing image: ' + error.message);
        } finally {
          setLoading(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        message.error('Failed to read image file');
        setLoading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Error uploading subsidy card: ' + error.message);
      setLoading(false);
    }
    
    return false; // Prevent auto upload
  };

  const handleUpdateHashcode = async () => {
    if (!subsidyCard) {
      message.error('No subsidy card found');
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
        message.success('QR hashcode updated successfully!');
        loadSubsidyCard();
      } else {
        message.error('Failed to update: ' + result.error);
      }
    } catch (error) {
      message.error('Error updating hashcode: ' + error.message);
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
        message.success('Subsidy card deleted successfully!');
        setSubsidyCard(null);
        setImagePreview(null);
        setQrHashcode('');
      } else {
        message.error('Failed to delete: ' + result.error);
      }
    } catch (error) {
      message.error('Error deleting subsidy card: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectQRCode = async () => {
    if (!imagePreview) {
      message.error('No image to scan');
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
            message.success(`QR code detected! ${code.data.length} characters`);
          } else {
            console.log('No QR code found in image');
            message.warning('No QR code detected. Ensure the image contains a clear, visible QR code.');
          }
        } catch (error) {
          console.error('Error processing image:', error);
          message.error('Error processing image: ' + error.message);
        } finally {
          setDetecting(false);
        }
      };
      
      img.onerror = (error) => {
        console.error('Failed to load image:', error);
        message.error('Failed to load image');
        setDetecting(false);
      };
    } catch (error) {
      console.error('Error detecting QR code:', error);
      message.error('Error detecting QR code: ' + error.message);
      setDetecting(false);
    }
  };

  return (
    <Card 
      title={
        <Space>
          <QrcodeOutlined />
          Subsidy Card
        </Space>
      }
      size="small"
    >
      {!farmerId && (
        <Alert
          message="⚠️ Save Farmer First"
          description="You must save the farmer information before you can upload a subsidy card. Click 'Add Farmer' or 'Update Farmer' button, then reopen this dialog to upload the card."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {loading && (
        <Alert
          message="Uploading..."
          description="Please wait while the subsidy card is being uploaded. This may take a few moments for larger images."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {imagePreview ? (
        <div>
          <Image
            src={imagePreview}
            alt="Subsidy Card"
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
                placeholder="Enter QR hashcode from subsidy card (200+ chars)"
                value={qrHashcode}
                onChange={(e) => setQrHashcode(e.target.value)}
                maxLength={500}
              />
              <Button 
                icon={<ScanOutlined />}
                onClick={handleDetectQRCode}
                loading={detecting}
                title="Automatically detect QR code from image"
              >
                Detect
              </Button>
            </Space.Compact>
            
            <Space>
              <Button 
                type="primary"
                onClick={handleUpdateHashcode}
                loading={loading}
                disabled={!qrHashcode}
              >
                Update QR Hashcode
              </Button>
              
              <Button 
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
                loading={loading}
              >
                Delete Card
              </Button>
            </Space>
          </Space>
        </div>
      ) : (
        <div>
          <Input
            addonBefore={<QrcodeOutlined />}
            placeholder="Enter QR hashcode (optional, can add later)"
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
              Upload Subsidy Card Image
            </Button>
          </Upload>
        </div>
      )}

      {subsidyCard && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
          Uploaded: {new Date(subsidyCard.upload_date).toLocaleString()}
          {subsidyCard.qr_hashcode && (
            <div style={{ marginTop: 4 }}>
              QR Code: {subsidyCard.qr_hashcode.substring(0, 50)}...
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default SubsidyCardUpload;
