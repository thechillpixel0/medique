import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerConfig } from 'html5-qrcode';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { QRPayload, parseQRCode } from '../lib/qr';
import { AlertCircle, Camera, Type } from 'lucide-react';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (payload: QRPayload) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  useEffect(() => {
    if (!isOpen) return;
    
    // Check camera permission
    navigator.permissions?.query({ name: 'camera' as PermissionName })
      .then(result => {
        setCameraPermission(result.state as any);
      })
      .catch(() => {
        setCameraPermission('prompt');
      });

    setIsScanning(true);
    setError('');

    const config: Html5QrcodeScannerConfig = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
      defaultZoomValueIfSupported: 2,
    };

    const scanner = new Html5QrcodeScanner('qr-reader', config, false);
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        console.log('QR Code scanned:', decodedText);
        setIsScanning(false);
        
        const payload = parseQRCode(decodedText);
        if (payload) {
          onScan(payload);
          handleClose();
        } else {
          setError('Invalid QR code format. Please try scanning again or enter the code manually.');
          setIsScanning(true);
        }
      },
      (error) => {
        // Only log actual errors, not scanning attempts
        if (!error.includes('No MultiFormat Readers') && 
            !error.includes('NotFoundException') &&
            !error.includes('No QR code found')) {
          console.warn('QR scan error:', error);
        }
      }
    );

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {
          console.warn('Error clearing scanner:', e);
        }
      }
    };
  }, [isOpen, onScan]);

  const handleClose = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Error clearing scanner:', e);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setError('');
    setShowManualEntry(false);
    setManualCode('');
    onClose();
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      setError('Please enter a QR code');
      return;
    }

    const payload = parseQRCode(manualCode.trim());
    if (payload) {
      onScan(payload);
      handleClose();
    } else {
      setError('Invalid QR code format. Please check the code and try again.');
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      window.location.reload(); // Reload to reinitialize scanner
    } catch (error) {
      setCameraPermission('denied');
      setError('Camera access denied. Please enable camera permissions and refresh the page.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Scan QR Code" size="md">
      <div className="space-y-4">
        {/* Camera Permission Check */}
        {cameraPermission === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <p className="text-red-800 font-medium">Camera Access Required</p>
                <p className="text-red-700 text-sm mt-1">
                  Please enable camera permissions to scan QR codes.
                </p>
              </div>
            </div>
            <Button
              onClick={requestCameraPermission}
              className="mt-3"
              size="sm"
            >
              <Camera className="h-4 w-4 mr-2" />
              Enable Camera
            </Button>
          </div>
        )}

        {/* Scanner Status */}
        {isScanning && cameraPermission !== 'denied' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Camera className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-blue-800 text-center">
                📱 Point your camera at the QR code to scan
              </p>
            </div>
          </div>
        )}
        
        {/* Manual Entry Toggle */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setShowManualEntry(!showManualEntry)} 
            size="sm"
          >
            <Type className="h-4 w-4 mr-2" />
            {showManualEntry ? 'Use Camera' : 'Enter Code Manually'}
          </Button>
          <p className="text-xs text-gray-500 mt-1">
            {showManualEntry ? 'Switch back to camera scanning' : 'Use this if camera scanning fails'}
          </p>
        </div>

        {/* Manual Entry Form */}
        {showManualEntry && (
          <div className="space-y-3">
            <Input
              label="QR Code Data"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Paste or type the QR code data here..."
              className="font-mono text-sm"
            />
            <Button
              onClick={handleManualSubmit}
              disabled={!manualCode.trim()}
              className="w-full"
            >
              Process Code
            </Button>
          </div>
        )}
        
        {/* Scanner Container */}
        {!showManualEntry && (
          <div id="qr-reader" className="w-full"></div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
            <div className="mt-3 space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setError('');
                  setIsScanning(true);
                }}
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowManualEntry(true)}
              >
                Enter Manually
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h5 className="text-sm font-medium text-gray-800 mb-1">Scanning Tips:</h5>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Hold your device steady</li>
            <li>• Ensure good lighting</li>
            <li>• Keep the QR code within the frame</li>
            <li>• Try adjusting the distance if scanning fails</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};