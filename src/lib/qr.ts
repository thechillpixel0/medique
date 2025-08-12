import QRCode from 'qrcode';

export interface QRPayload {
  clinic: string;
  uid: string;
  stn: number;
  visit_date: string;
  issued_at: number;
}

export const generateQRCode = async (payload: QRPayload): Promise<string> => {
  try {
    // Simple encoding - in production, you'd encrypt this
    const data = JSON.stringify(payload);
    const base64Data = btoa(data);
    const qrData = `CLINIC_TOKEN:${base64Data}`;
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#1f2937',
        light: '#ffffff',
      },
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

export const parseQRCode = (qrData: string): QRPayload | null => {
  try {
    // Handle different QR code formats
    let dataToProcess = qrData;
    
    // If it's a URL or contains our prefix, extract the data
    if (qrData.includes('CLINIC_TOKEN:')) {
      dataToProcess = qrData;
    } else if (qrData.startsWith('http')) {
      // Handle URL-based QR codes
      const url = new URL(qrData);
      const tokenData = url.searchParams.get('token');
      if (tokenData) {
        dataToProcess = `CLINIC_TOKEN:${tokenData}`;
      } else {
        return null;
      }
    }
    
    if (!qrData.startsWith('CLINIC_TOKEN:')) {
      return null;
    }
    
    const base64Data = dataToProcess.replace('CLINIC_TOKEN:', '');
    const data = atob(base64Data);
    const payload = JSON.parse(data) as QRPayload;
    
    // Validate payload structure
    if (!payload.clinic || !payload.uid || !payload.stn || !payload.visit_date) {
      console.error('Invalid QR payload structure:', payload);
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Error parsing QR code:', error);
    return null;
  }
};

export const downloadQRCode = (dataURL: string, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  link.click();
};