import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Alert, Space, Spin } from 'antd';
import { CameraOutlined, CloseOutlined } from '@ant-design/icons';
import jsQR from 'jsqr';

const QRScannerModal = ({ open, onClose, onScanSuccess }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    try {
      setError(null);
      setScanning(true);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        videoRef.current.onloadedmetadata = () => {
          startScanning();
        };
      }

      setCameraAvailable(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraAvailable(false);
      setError(`Camera access denied or not available: ${err.message}`);
      setScanning(false);
    }
  };

  const startScanning = () => {
    scanIntervalRef.current = setInterval(() => {
      scanQRCode();
    }, 300);
  };

  const scanQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (code) {
      console.log('QR Code detected:', code.data);
      stopCamera();
      onScanSuccess(code.data);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <CameraOutlined />
          Scan QR Code to Search Farmer
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="close" onClick={handleClose}>
          Close
        </Button>
      ]}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {error && (
          <Alert
            message="Camera Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}

        {!error && cameraAvailable && (
          <Alert
            message="Position the QR code in front of the camera"
            description="The QR code will be scanned automatically when detected"
            type="info"
            showIcon
          />
        )}

        <div style={{ 
          position: 'relative',
          width: '100%',
          backgroundColor: '#000',
          borderRadius: 8,
          overflow: 'hidden',
          minHeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {scanning && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              textAlign: 'center',
              color: 'white'
            }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>Initializing camera...</div>
            </div>
          )}

          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: 'auto',
              display: scanning ? 'block' : 'none'
            }}
            playsInline
          />

          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />

          {!cameraAvailable && (
            <div style={{ 
              color: 'white', 
              padding: 20,
              textAlign: 'center'
            }}>
              <CameraOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <div>Camera not available or access denied</div>
              <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
                Please check camera permissions in your browser settings
              </div>
            </div>
          )}
        </div>

        {cameraAvailable && !error && (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#888' }}>
            📸 Camera active - Point at QR code on subsidy card
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default QRScannerModal;
