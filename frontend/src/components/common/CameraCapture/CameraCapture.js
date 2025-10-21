import React, { useRef, useState, useEffect } from 'react';
import { FiCamera, FiX, FiRotateCw } from 'react-icons/fi';
import styles from './CameraCapture.module.css';

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Request camera access
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraReady(true);
        setError(null);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions and try again.');
      setIsCameraReady(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        // Create a File object from the blob
        const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
        
        // Stop camera and call onCapture
        stopCamera();
        onCapture(file);
      }
    }, 'image/jpeg', 0.95);
  };

  const switchCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className={styles.cameraCapture}>
      <div className={styles.cameraOverlay}>
        <div className={styles.cameraContainer}>
          {/* Header */}
          <div className={styles.cameraHeader}>
            <h2 className={styles.cameraTitle}>Take Photo</h2>
            <button onClick={handleClose} className={styles.closeButton}>
              <FiX />
            </button>
          </div>

          {/* Camera View */}
          <div className={styles.cameraView}>
            {error ? (
              <div className={styles.cameraError}>
                <FiCamera className={styles.errorIcon} />
                <p>{error}</p>
                <button onClick={startCamera} className={styles.retryButton}>
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={styles.videoElement}
                />
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />

                {/* Camera Guide Overlay */}
                <div className={styles.cameraGuide}>
                  <div className={styles.guideFrame}></div>
                  <p className={styles.guideText}>Position your food within the frame</p>
                </div>
              </>
            )}
          </div>

          {/* Controls */}
          <div className={styles.cameraControls}>
            <button
              onClick={switchCamera}
              className={styles.controlButton}
              disabled={!isCameraReady}
            >
              <FiRotateCw />
              <span>Flip</span>
            </button>

            <button
              onClick={capturePhoto}
              className={styles.captureButton}
              disabled={!isCameraReady || error}
            >
              <div className={styles.captureButtonInner}>
                <FiCamera />
              </div>
            </button>

            <button
              onClick={handleClose}
              className={styles.controlButton}
            >
              <FiX />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
