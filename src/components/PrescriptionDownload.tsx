import React, { useState } from 'react';
import { Download, FileText, Search, Calendar, User, Stethoscope, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Modal } from './ui/Modal';
import { supabase } from '../lib/supabase';
import { formatDate, formatTime } from '../lib/utils';
import { MedicalHistory, Patient, Doctor } from '../types';

interface PrescriptionDownloadProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrescriptionDownload: React.FC<PrescriptionDownloadProps> = ({ isOpen, onClose }) => {
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<MedicalHistory[]>([]);

  const searchPrescriptions = async () => {
    if (!uid.trim()) {
      setError('Please enter a valid Patient UID');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Find patient by UID
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('uid', uid.trim().toUpperCase())
        .single();

      if (patientError || !patientData) {
        setError('Patient not found. Please check your UID and try again.');
        return;
      }

      setPatient(patientData);

      // Get all medical history/prescriptions for this patient
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('medical_history')
        .select(`
          *,
          doctor:doctors(*),
          visit:visits(*)
        `)
        .eq('patient_uid', uid.trim().toUpperCase())
        .order('created_at', { ascending: false });

      if (prescriptionError) {
        console.error('Error fetching prescriptions:', prescriptionError);
        setError('Error fetching prescriptions. Please try again.');
        return;
      }

      setPrescriptions(prescriptionData || []);

      if (!prescriptionData || prescriptionData.length === 0) {
        setError('No prescriptions found for this patient.');
      }

    } catch (error) {
      console.error('Search error:', error);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPrescription = (prescription: MedicalHistory) => {
    const prescriptionContent = `
DIGITAL PRESCRIPTION
====================

CLINIC: MediQueue Clinic
DATE: ${formatDate(prescription.created_at)}
TIME: ${formatTime(prescription.created_at)}

PATIENT INFORMATION:
-------------------
Name: ${patient?.name}
UID: ${patient?.uid}
Age: ${patient?.age}
Phone: ${patient?.phone}
${patient?.email ? `Email: ${patient.email}` : ''}
${patient?.blood_group ? `Blood Group: ${patient.blood_group}` : ''}

${patient?.allergies && patient.allergies.length > 0 ? `
ALLERGIES:
---------
${patient.allergies.map(allergy => `• ${allergy}`).join('\n')}
` : ''}

${patient?.medical_conditions && patient.medical_conditions.length > 0 ? `
MEDICAL CONDITIONS:
------------------
${patient.medical_conditions.map(condition => `• ${condition}`).join('\n')}
` : ''}

DOCTOR INFORMATION:
------------------
Dr. ${prescription.doctor?.name || 'Unknown'}
${prescription.doctor?.qualification || ''}
Specialization: ${prescription.doctor?.specialization || 'General'}

${prescription.diagnosis ? `
DIAGNOSIS:
---------
${prescription.diagnosis}
` : ''}

${prescription.prescription ? `
PRESCRIPTION:
------------
${prescription.prescription}
` : ''}

${prescription.notes ? `
ADDITIONAL NOTES:
----------------
${prescription.notes}
` : ''}

VISIT INFORMATION:
-----------------
${prescription.visit ? `Token Number: #${prescription.visit.stn}` : ''}
${prescription.visit ? `Department: ${prescription.visit.department}` : ''}
${prescription.visit ? `Visit Date: ${formatDate(prescription.visit.visit_date)}` : ''}

---
This is a digitally generated prescription.
For any queries, please contact the clinic.

Generated on: ${formatDate(new Date().toISOString())} at ${formatTime(new Date().toISOString())}
    `.trim();

    // Create and download file
    const blob = new Blob([prescriptionContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prescription-${patient?.uid}-${formatDate(prescription.created_at).replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadAllPrescriptions = () => {
    if (!patient || prescriptions.length === 0) return;

    const allPrescriptions = `
COMPLETE MEDICAL HISTORY
========================

PATIENT: ${patient.name}
UID: ${patient.uid}
GENERATED: ${formatDate(new Date().toISOString())} at ${formatTime(new Date().toISOString())}

${prescriptions.map((prescription, index) => `
PRESCRIPTION ${index + 1}
${'='.repeat(20)}

Date: ${formatDate(prescription.created_at)}
Doctor: Dr. ${prescription.doctor?.name || 'Unknown'}
${prescription.doctor?.specialization ? `Specialization: ${prescription.doctor.specialization}` : ''}

${prescription.diagnosis ? `Diagnosis: ${prescription.diagnosis}` : ''}

${prescription.prescription ? `
Prescription:
${prescription.prescription}
` : ''}

${prescription.notes ? `
Notes:
${prescription.notes}
` : ''}

${prescription.visit ? `Visit Details: Token #${prescription.visit.stn}, ${prescription.visit.department}` : ''}

${'='.repeat(50)}
`).join('\n')}

---
Complete medical history for ${patient.name}
This document contains ${prescriptions.length} prescription(s)
Generated from MediQueue Clinic System
    `.trim();

    const blob = new Blob([allPrescriptions], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `complete-medical-history-${patient.uid}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setUid('');
    setPatient(null);
    setPrescriptions([]);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Download Prescriptions" size="xl">
      <div className="space-y-6">
        {/* Search Section */}
        <div className="flex space-x-3">
          <Input
            placeholder="Enter Patient UID (e.g., CLN1-ABC123)"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchPrescriptions()}
            className="flex-1"
          />
          <Button onClick={searchPrescriptions} loading={loading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {patient && (
          <div className="space-y-6">
            {/* Patient Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Patient Information
                  </h3>
                  {prescriptions.length > 0 && (
                    <Button onClick={downloadAllPrescriptions} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download All ({prescriptions.length})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{patient.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">UID:</span>
                      <span className="font-medium">{patient.uid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium">{patient.age}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{patient.phone}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {patient.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{patient.email}</span>
                      </div>
                    )}
                    {patient.blood_group && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Blood Group:</span>
                        <span className="font-medium">{patient.blood_group}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Registered:</span>
                      <span className="font-medium">{formatDate(patient.created_at)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prescriptions List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Prescriptions ({prescriptions.length})</h3>
              
              {prescriptions.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No prescriptions found for this patient.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {prescriptions.map((prescription) => (
                    <Card key={prescription.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                              <span className="font-medium">{formatDate(prescription.created_at)}</span>
                              <span className="text-gray-500 ml-2">{formatTime(prescription.created_at)}</span>
                            </div>
                            
                            {prescription.doctor && (
                              <div className="flex items-center mb-2">
                                <Stethoscope className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-sm text-gray-600">
                                  Dr. {prescription.doctor.name}
                                  {prescription.doctor.specialization && ` - ${prescription.doctor.specialization}`}
                                </span>
                              </div>
                            )}

                            {prescription.visit && (
                              <div className="text-sm text-gray-600 mb-2">
                                Token #{prescription.visit.stn} - {prescription.visit.department}
                              </div>
                            )}
                          </div>
                          
                          <Button
                            onClick={() => downloadPrescription(prescription)}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>

                        {prescription.diagnosis && (
                          <div className="mb-3">
                            <h5 className="font-medium text-gray-900 mb-1">Diagnosis:</h5>
                            <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">{prescription.diagnosis}</p>
                          </div>
                        )}

                        {prescription.prescription && (
                          <div className="mb-3">
                            <h5 className="font-medium text-gray-900 mb-1">Prescription:</h5>
                            <div className="text-sm text-gray-700 bg-green-50 p-2 rounded max-h-32 overflow-y-auto">
                              <pre className="whitespace-pre-wrap font-sans">{prescription.prescription}</pre>
                            </div>
                          </div>
                        )}

                        {prescription.notes && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-1">Notes:</h5>
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{prescription.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};