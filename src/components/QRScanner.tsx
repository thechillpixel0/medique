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

  useEffect(() => {
    if (!isOpen) return;

    const config: Html5QrcodeScannerConfig = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    const scanner = new Html5QrcodeScanner('qr-reader', config, false);
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        const payload = parseQRCode(decodedText);
        if (payload) {
          onScan(payload);
          onClose();
        } else {
          setError('Invalid QR code format');
        }
      },
      (error) => {
        console.warn('QR scan error:', error);
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
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Scan QR Code" size="md">
      <div className="space-y-4">
        <div id="qr-reader" className="w-full"></div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
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