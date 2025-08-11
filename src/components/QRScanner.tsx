import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerConfig } from 'html5-qrcode';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { QRPayload, parseQRCode } from '../lib/qr';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (payload: QRPayload) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    setIsScanning(true);
    setError('');

    const config: Html5QrcodeScannerConfig = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    const scanner = new Html5QrcodeScanner('qr-reader', config, false);
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        setIsScanning(false);
        const payload = parseQRCode(decodedText);
        if (payload) {
          onScan(payload);
          onClose();
        } else {
          setError('Invalid QR code format');
          setIsScanning(true);
        }
      },
      (error) => {
        // Only log actual errors, not scanning attempts
        if (!error.includes('No MultiFormat Readers')) {
          console.warn('QR scan error:', error);
        }
      }
    );

    return () => {
      scanner.clear();
    };
  }, [isOpen, onScan, onClose]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    setIsScanning(false);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Scan QR Code" size="md">
      <div className="space-y-4">
        {isScanning && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-center">
              📱 Point your camera at the QR code to scan
            </p>
          </div>
        )}
        
        <div id="qr-reader" className="w-full"></div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setError('');
                setIsScanning(true);
              }}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};