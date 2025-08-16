import React, { useState } from 'react';
import { Search, FileText, Download, Calendar, User, Stethoscope, AlertTriangle, Heart, Activity, Printer } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Modal } from './ui/Modal';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Patient, MedicalHistory } from '../types';
import { formatDate, formatTime } from '../lib/utils';

interface MedicalHistoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MedicalHistoryViewer: React.FC<MedicalHistoryViewerProps> = ({ isOpen, onClose }) => {
  const [searchUID, setSearchUID] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const searchPatient = async () => {
    if (!searchUID.trim()) {
      setError('Please enter a Patient UID');
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Database not configured. Please check your environment settings.');
      return;
    }

    setLoading(true);
    setError('');
    setPatient(null);
    setMedicalHistory([]);
    
    try {
      // Search patient by UID
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('uid', searchUID.trim().toUpperCase())
        .single();

      if (patientError) {
        if (patientError.code === 'PGRST116') {
          setError('Patient not found. Please check the UID and try again.');
        } else {
          setError('Error searching patient. Please try again.');
        }
        return;
      }

      setPatient(patientData);

      // Fetch medical history
      const { data: historyData, error: historyError } = await supabase
        .from('medical_history')
        .select(`
          *,
          doctor:doctors(*),
          visit:visits(*)
        `)
        .eq('patient_uid', patientData.uid)
        .order('created_at', { ascending: false });

      if (historyError) {
        console.error('Medical history error:', historyError);
        setError('Error loading medical history. Please try again.');
        return;
      }

      setMedicalHistory(historyData || []);

    } catch (error) {
      console.error('Error searching patient:', error);
      setError('Unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPrescription = (record: MedicalHistory) => {
    const prescriptionHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Medical Prescription - ${patient?.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background: #fff;
              padding: 20px;
            }
            .prescription-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 2px solid #2563eb;
              border-radius: 12px;
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              color: white;
              padding: 20px;
              text-align: center;
              position: relative;
            }
            .header::before {
              content: '🏥';
              position: absolute;
              top: 10px;
              left: 20px;
              font-size: 24px;
            }
            .header h1 {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .header p {
              font-size: 14px;
              opacity: 0.9;
            }
            .content {
              padding: 30px;
            }
            .patient-info {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 25px;
            }
            .patient-info h3 {
              color: #1e40af;
              font-size: 18px;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
            }
            .patient-info h3::before {
              content: '👤';
              margin-right: 8px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 10px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              border-bottom: 1px dotted #cbd5e1;
            }
            .info-label {
              font-weight: 600;
              color: #475569;
            }
            .info-value {
              color: #1e293b;
            }
            .section {
              margin-bottom: 25px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
            }
            .section-header {
              padding: 12px 20px;
              font-weight: bold;
              font-size: 16px;
              display: flex;
              align-items: center;
            }
            .section-content {
              padding: 20px;
              background: #fefefe;
            }
            .diagnosis-section .section-header {
              background: #dbeafe;
              color: #1e40af;
            }
            .diagnosis-section .section-header::before {
              content: '🔍';
              margin-right: 8px;
            }
            .prescription-section .section-header {
              background: #dcfce7;
              color: #166534;
            }
            .prescription-section .section-header::before {
              content: '💊';
              margin-right: 8px;
            }
            .notes-section .section-header {
              background: #fef3c7;
              color: #92400e;
            }
            .notes-section .section-header::before {
              content: '📝';
              margin-right: 8px;
            }
            .allergies-warning {
              background: #fef2f2;
              border: 2px solid #fca5a5;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 20px;
            }
            .allergies-warning h4 {
              color: #dc2626;
              font-weight: bold;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
            }
            .allergies-warning h4::before {
              content: '⚠️';
              margin-right: 8px;
            }
            .allergy-tag {
              display: inline-block;
              background: #fee2e2;
              color: #dc2626;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
              margin: 2px;
            }
            .footer {
              background: #f8fafc;
              padding: 20px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .doctor-signature {
              margin-top: 30px;
              text-align: right;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              color: rgba(37, 99, 235, 0.05);
              z-index: -1;
              pointer-events: none;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
              .prescription-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="watermark">MediQueue</div>
          <div class="prescription-container">
            <div class="header">
              <h1>MediQueue Clinic</h1>
              <p>Digital Medical Prescription</p>
              <p>Date: ${formatDate(record.created_at)}</p>
            </div>
            
            <div class="content">
              <div class="patient-info">
                <h3>Patient Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Patient ID:</span>
                    <span class="info-value">${patient?.uid}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${patient?.name}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Age:</span>
                    <span class="info-value">${patient?.age} years</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${patient?.phone}</span>
                  </div>
                  ${patient?.blood_group ? `
                    <div class="info-item">
                      <span class="info-label">Blood Group:</span>
                      <span class="info-value">${patient.blood_group}</span>
                    </div>
                  ` : ''}
                  ${patient?.email ? `
                    <div class="info-item">
                      <span class="info-label">Email:</span>
                      <span class="info-value">${patient.email}</span>
                    </div>
                  ` : ''}
                </div>
              </div>

              ${patient?.allergies && patient.allergies.length > 0 ? `
                <div class="allergies-warning">
                  <h4>ALLERGIES - IMPORTANT</h4>
                  <div>
                    ${patient.allergies.map(allergy => `<span class="allergy-tag">${allergy}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              ${patient?.medical_conditions && patient.medical_conditions.length > 0 ? `
                <div class="section">
                  <div class="section-header" style="background: #fef3c7; color: #92400e;">
                    🏥 Medical Conditions
                  </div>
                  <div class="section-content">
                    ${patient.medical_conditions.map(condition => `<span class="allergy-tag" style="background: #fef3c7; color: #92400e;">${condition}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              ${record.diagnosis ? `
                <div class="section diagnosis-section">
                  <div class="section-header">Diagnosis</div>
                  <div class="section-content">
                    <p>${record.diagnosis}</p>
                  </div>
                </div>
              ` : ''}

              ${record.prescription ? `
                <div class="section prescription-section">
                  <div class="section-header">Prescription</div>
                  <div class="section-content">
                    <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${record.prescription}</pre>
                  </div>
                </div>
              ` : ''}

              ${record.notes ? `
                <div class="section notes-section">
                  <div class="section-header">Additional Notes</div>
                  <div class="section-content">
                    <p>${record.notes}</p>
                  </div>
                </div>
              ` : ''}

              <div class="doctor-signature">
                <p><strong>Dr. ${record.doctor?.name || 'Unknown'}</strong></p>
                <p>${record.doctor?.qualification || ''}</p>
                <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">
                  This is a digitally generated prescription from MediQueue Clinic
                </p>
              </div>
            </div>

            <div class="footer">
              <p style="font-size: 12px; color: #6b7280;">
                Generated on ${formatDate(new Date().toISOString())} | MediQueue Digital Health Platform
              </p>
            </div>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; margin-right: 10px; font-weight: 600;">
              🖨️ Print Prescription
            </button>
            <button onclick="window.close()" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
              ✖️ Close
            </button>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(prescriptionHTML);
      printWindow.document.close();
    }
  };

  const downloadCompleteHistory = () => {
    if (!patient || medicalHistory.length === 0) return;

    const historyHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Complete Medical History - ${patient.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background: #fff;
              padding: 20px;
            }
            .history-container {
              max-width: 900px;
              margin: 0 auto;
              background: white;
              border: 2px solid #2563eb;
              border-radius: 12px;
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              color: white;
              padding: 25px;
              text-align: center;
            }
            .header h1 {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .header p {
              font-size: 16px;
              opacity: 0.9;
            }
            .content {
              padding: 30px;
            }
            .patient-summary {
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border: 1px solid #cbd5e1;
              border-radius: 12px;
              padding: 25px;
              margin-bottom: 30px;
            }
            .patient-summary h2 {
              color: #1e40af;
              font-size: 22px;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
            }
            .patient-summary h2::before {
              content: '👤';
              margin-right: 10px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 15px;
            }
            .summary-item {
              background: white;
              padding: 12px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .summary-label {
              font-weight: 600;
              color: #475569;
              font-size: 14px;
            }
            .summary-value {
              color: #1e293b;
              font-size: 16px;
              margin-top: 2px;
            }
            .record {
              background: #fefefe;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              margin-bottom: 25px;
              overflow: hidden;
            }
            .record-header {
              background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
              padding: 15px 20px;
              border-bottom: 1px solid #e2e8f0;
            }
            .record-date {
              font-size: 18px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 5px;
            }
            .record-doctor {
              color: #64748b;
              font-size: 14px;
            }
            .record-content {
              padding: 20px;
            }
            .diagnosis {
              background: #dbeafe;
              border-left: 4px solid #2563eb;
              padding: 15px;
              margin-bottom: 15px;
              border-radius: 0 8px 8px 0;
            }
            .diagnosis h4 {
              color: #1e40af;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
            }
            .diagnosis h4::before {
              content: '🔍';
              margin-right: 8px;
            }
            .prescription {
              background: #dcfce7;
              border-left: 4px solid #16a34a;
              padding: 15px;
              margin-bottom: 15px;
              border-radius: 0 8px 8px 0;
            }
            .prescription h4 {
              color: #166534;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
            }
            .prescription h4::before {
              content: '💊';
              margin-right: 8px;
            }
            .prescription pre {
              white-space: pre-wrap;
              font-family: Arial, sans-serif;
              font-size: 14px;
              line-height: 1.5;
            }
            .notes {
              background: #fef3c7;
              border-left: 4px solid #d97706;
              padding: 15px;
              border-radius: 0 8px 8px 0;
            }
            .notes h4 {
              color: #92400e;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
            }
            .notes h4::before {
              content: '📝';
              margin-right: 8px;
            }
            .allergies-warning {
              background: #fef2f2;
              border: 2px solid #fca5a5;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 20px;
            }
            .allergies-warning h4 {
              color: #dc2626;
              font-weight: bold;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
            }
            .allergies-warning h4::before {
              content: '⚠️';
              margin-right: 8px;
            }
            .allergy-tag {
              display: inline-block;
              background: #fee2e2;
              color: #dc2626;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
              margin: 2px;
            }
            .footer {
              background: #f8fafc;
              padding: 20px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
              font-size: 12px;
              color: #6b7280;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 150px;
              color: rgba(37, 99, 235, 0.03);
              z-index: -1;
              pointer-events: none;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
              .history-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="watermark">MediQueue</div>
          <div class="history-container">
            <div class="header">
              <h1>🏥 Complete Medical History</h1>
              <p>Comprehensive Medical Records Report</p>
              <p>Generated on ${formatDate(new Date().toISOString())}</p>
            </div>
            
            <div class="content">
              <div class="patient-summary">
                <h2>Patient Summary</h2>
                <div class="summary-grid">
                  <div class="summary-item">
                    <div class="summary-label">Patient ID</div>
                    <div class="summary-value">${patient.uid}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Full Name</div>
                    <div class="summary-value">${patient.name}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Age</div>
                    <div class="summary-value">${patient.age} years</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Phone</div>
                    <div class="summary-value">${patient.phone}</div>
                  </div>
                  ${patient.blood_group ? `
                    <div class="summary-item">
                      <div class="summary-label">Blood Group</div>
                      <div class="summary-value">${patient.blood_group}</div>
                    </div>
                  ` : ''}
                  <div class="summary-item">
                    <div class="summary-label">Total Records</div>
                    <div class="summary-value">${medicalHistory.length}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">First Visit</div>
                    <div class="summary-value">${formatDate(patient.created_at)}</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-label">Last Updated</div>
                    <div class="summary-value">${formatDate(patient.updated_at)}</div>
                  </div>
                </div>
              </div>

              ${patient.allergies && patient.allergies.length > 0 ? `
                <div class="allergies-warning">
                  <h4>KNOWN ALLERGIES</h4>
                  <div>
                    ${patient.allergies.map(allergy => `<span class="allergy-tag">${allergy}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              ${patient.medical_conditions && patient.medical_conditions.length > 0 ? `
                <div class="section">
                  <div class="section-header" style="background: #fef3c7; color: #92400e;">
                    🏥 Chronic Medical Conditions
                  </div>
                  <div class="section-content">
                    ${patient.medical_conditions.map(condition => `<span class="allergy-tag" style="background: #fef3c7; color: #92400e;">${condition}</span>`).join('')}
                  </div>
                </div>
              ` : ''}

              <h2 style="color: #1e40af; font-size: 24px; margin: 30px 0 20px 0; text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                📋 Medical Records History
              </h2>

              ${medicalHistory.map((record, index) => `
                <div class="record">
                  <div class="record-header">
                    <div class="record-date">
                      📅 ${formatDate(record.created_at)} - Record #${medicalHistory.length - index}
                    </div>
                    <div class="record-doctor">
                      👨‍⚕️ Dr. ${record.doctor?.name || 'Unknown'} ${record.doctor?.qualification ? `(${record.doctor.qualification})` : ''}
                    </div>
                  </div>
                  <div class="record-content">
                    ${record.diagnosis ? `
                      <div class="diagnosis">
                        <h4>Diagnosis</h4>
                        <p>${record.diagnosis}</p>
                      </div>
                    ` : ''}
                    
                    ${record.prescription ? `
                      <div class="prescription">
                        <h4>Prescription</h4>
                        <pre>${record.prescription}</pre>
                      </div>
                    ` : ''}
                    
                    ${record.notes ? `
                      <div class="notes">
                        <h4>Additional Notes</h4>
                        <p>${record.notes}</p>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="footer">
              <p><strong>MediQueue Digital Health Platform</strong></p>
              <p>This is a comprehensive medical history report generated digitally</p>
              <p>For any queries, please contact the clinic administration</p>
            </div>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; margin-right: 10px; font-weight: 600;">
              🖨️ Print Complete History
            </button>
            <button onclick="window.close()" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
              ✖️ Close
            </button>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(historyHTML);
      printWindow.document.close();
    }
  };

  const handleClose = () => {
    setSearchUID('');
    setPatient(null);
    setMedicalHistory([]);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🏥 Medical History & Prescriptions" size="xl">
      <div className="space-y-6">
        {/* Search Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search Your Medical Records
          </h3>
          <div className="flex space-x-3">
            <Input
              placeholder="Enter your Patient UID (e.g., CLN1-ABC123)"
              value={searchUID}
              onChange={(e) => setSearchUID(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchPatient()}
              className="flex-1"
              error={error}
            />
            <Button onClick={searchPatient} loading={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          <p className="text-sm text-blue-700 mt-2">
            💡 Your Patient UID was provided when you first booked a token. Check your QR code or booking confirmation.
          </p>
        </div>

        {/* Database Configuration Warning */}
        {!isSupabaseConfigured && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <h4 className="text-red-800 font-medium">Database Not Configured</h4>
                <p className="text-red-700 text-sm mt-1">
                  Please configure your Supabase credentials to access medical records.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Patient Information */}
        {patient && (
          <Card className="border-l-4 border-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Patient Information
                </h3>
                {medicalHistory.length > 0 && (
                  <Button
                    onClick={downloadCompleteHistory}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Complete History
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient ID:</span>
                    <span className="font-medium">{patient.uid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{patient.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-medium">{patient.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{patient.phone}</span>
                  </div>
                  {patient.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{patient.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {patient.blood_group && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-sm font-medium text-red-800">
                          Blood Group: {patient.blood_group}
                        </span>
                      </div>
                    </div>
                  )}

                  {patient.allergies && patient.allergies.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-sm font-medium text-yellow-800">Allergies:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {patient.allergies.map((allergy, index) => (
                          <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {patient.medical_conditions && patient.medical_conditions.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <Activity className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">Medical Conditions:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {patient.medical_conditions.map((condition, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-sm text-gray-600">
                      <div>Registered: {formatDate(patient.created_at)}</div>
                      <div>Total Records: {medicalHistory.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medical History Records */}
        {patient && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Medical Records ({medicalHistory.length})
            </h3>

            {medicalHistory.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Medical Records Found</h4>
                  <p className="text-gray-600">
                    No medical records are available for this patient yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-4">
                {medicalHistory.map((record, index) => (
                  <Card key={record.id} className="border-l-4 border-green-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {formatDate(record.created_at)} - Record #{medicalHistory.length - index}
                          </h4>
                          {record.doctor && (
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <Stethoscope className="h-4 w-4 mr-2" />
                              Dr. {record.doctor.name}
                              {record.doctor.qualification && ` (${record.doctor.qualification})`}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => downloadPrescription(record)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {record.diagnosis && (
                        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h5 className="font-medium text-blue-900 mb-2 flex items-center">
                            🔍 Diagnosis:
                          </h5>
                          <p className="text-sm text-blue-800">{record.diagnosis}</p>
                        </div>
                      )}

                      {record.prescription && (
                        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                          <h5 className="font-medium text-green-900 mb-2 flex items-center">
                            💊 Prescription:
                          </h5>
                          <pre className="text-sm text-green-800 whitespace-pre-wrap font-sans">
                            {record.prescription}
                          </pre>
                        </div>
                      )}

                      {record.notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <h5 className="font-medium text-yellow-900 mb-2 flex items-center">
                            📝 Additional Notes:
                          </h5>
                          <p className="text-sm text-yellow-800">{record.notes}</p>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                        <div className="flex justify-between">
                          <span>Record ID: {record.id}</span>
                          <span>Created: {formatTime(record.created_at)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📋 How to Use:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Enter your Patient UID to search for your medical records</li>
            <li>• View all your past prescriptions and medical history</li>
            <li>• Download individual prescriptions or complete medical history</li>
            <li>• All downloads are formatted professionally for pharmacy/insurance use</li>
            <li>• Your data is secure and only accessible with your unique UID</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};