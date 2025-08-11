import React, { useState } from 'react';
import { Heart, Clock, Users, Calendar, QrCode, CheckCircle, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { QueueWidget } from '../components/QueueWidget';
import { Queue2DVisualization } from '../components/Queue2DVisualization';
import { BookingForm } from '../components/BookingForm';
import { PatientLookup } from '../components/PatientLookup';
import { BookingRequest, BookingResponse, DepartmentStats } from '../types';
import { supabase } from '../lib/supabase';
import { generateUID } from '../lib/utils';
import { generateQRCode, QRPayload, downloadQRCode } from '../lib/qr';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';

export const HomePage: React.FC = () => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showPatientLookup, setShowPatientLookup] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [error, setError] = useState<string>('');
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>('');
  const [stripeEnabled, setStripeEnabled] = useState<boolean>(false);
  const [showStripePayment, setShowStripePayment] = useState<boolean>(false);

  // Real-time updates
  useRealTimeUpdates(() => {
    fetchDepartmentStats();
  });

  const fetchDepartmentStats = async () => {
    try {
      setError('');
      const today = new Date().toISOString().split('T')[0];
      
      const { data: departments } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true);

      if (!departments || departments.length === 0) {
        setError('No departments found. Please contact admin to set up departments.');
        return;
      }
      const { data: visits } = await supabase
        .from('visits')
        .select('department, status')
        .eq('visit_date', today);

      const { data: doctors } = await supabase
        .from('doctors')
        .select('specialization')
        .eq('status', 'active');

      const stats: DepartmentStats[] = (departments || []).map(dept => {
        const deptVisits = visits?.filter(v => v.department === dept.name) || [];
        const waitingVisits = deptVisits.filter(v => ['waiting', 'checked_in'].includes(v.status));
        const completedVisits = deptVisits.filter(v => v.status === 'completed');
        const inServiceVisits = deptVisits.filter(v => v.status === 'in_service');
        
        let nowServing = 0;
        if (inServiceVisits.length > 0) {
          const inServiceSTNs = inServiceVisits.map((v: any) => v.stn);
          nowServing = Math.min(...inServiceSTNs);
        } else if (completedVisits.length > 0) {
          const completedSTNs = completedVisits.map((v: any) => v.stn);
          nowServing = Math.max(...completedSTNs);
        } else if (deptVisits.length > 0) {
          nowServing = Math.min(...deptVisits.map((v: any) => v.stn)) - 1;
        }

        const doctorCount = doctors?.filter(d => d.specialization === dept.name).length || 0;

        return {
          department: dept.name,
          display_name: dept.display_name,
          color_code: dept.color_code,
          now_serving: nowServing,
          total_waiting: waitingVisits.length,
          total_completed: completedVisits.length,
          average_wait_time: dept.average_consultation_time,
          doctor_count: doctorCount
        };
      });

      setDepartmentStats(stats);
    } catch (error) {
      console.error('Error fetching department stats:', error);
      setError('Failed to load department information. Please refresh the page.');
    }
  };

  React.useEffect(() => {
    fetchDepartmentStats();
    checkMaintenanceMode();
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      const { data: maintenanceData } = await supabase
        .from('clinic_settings')
        .select('setting_value')
        .eq('setting_key', 'maintenance_mode')
        .single();

      const { data: messageData } = await supabase
        .from('clinic_settings')
        .select('setting_value')
        .eq('setting_key', 'maintenance_message')
        .single();

      const { data: stripeData } = await supabase
        .from('clinic_settings')
        .select('setting_value')
        .eq('setting_key', 'enable_online_payments')
        .single();

      if (maintenanceData) {
        setMaintenanceMode(maintenanceData.setting_value);
      }
      if (messageData) {
        setMaintenanceMessage(messageData.setting_value);
      }
      if (stripeData) {
        setStripeEnabled(stripeData.setting_value);
      }
    } catch (error) {
      console.log('Settings not found, using defaults');
    }
  };
  const handleBookToken = async (bookingData: BookingRequest) => {
    setBookingLoading(true);
    setError('');
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if patient exists by phone
      let { data: existingPatients, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('phone', bookingData.phone)
        .limit(1);

      if (patientError) throw patientError;

      let patient = existingPatients?.[0];
      
      // Create new patient if doesn't exist
      if (!patient) {
        const uid = generateUID();
        
        // Process allergies and medical conditions
        const allergies = bookingData.allergies ? 
          bookingData.allergies.split(',').map(item => item.trim()).filter(Boolean) : 
          [];
        const medicalConditions = bookingData.medical_conditions ? 
          bookingData.medical_conditions.split(',').map(item => item.trim()).filter(Boolean) : 
          [];
        
        const { data: newPatient, error: createPatientError } = await supabase
          .from('patients')
          .insert({
            uid,
            name: bookingData.name,
            age: bookingData.age,
            phone: bookingData.phone,
            email: bookingData.email,
            address: bookingData.address,
            emergency_contact: bookingData.emergency_contact,
            blood_group: bookingData.blood_group,
            allergies: allergies.length > 0 ? allergies : null,
            medical_conditions: medicalConditions.length > 0 ? medicalConditions : null,
          })
          .select()
          .single();

        if (createPatientError) throw createPatientError;
        patient = newPatient;
      } else {
        // Update existing patient with new information if provided
        const allergies = bookingData.allergies ? 
          bookingData.allergies.split(',').map(item => item.trim()).filter(Boolean) : 
          [];
        const medicalConditions = bookingData.medical_conditions ? 
          bookingData.medical_conditions.split(',').map(item => item.trim()).filter(Boolean) : 
          [];

        const updateData: any = {};
        if (bookingData.email && bookingData.email !== patient.email) updateData.email = bookingData.email;
        if (bookingData.address && bookingData.address !== patient.address) updateData.address = bookingData.address;
        if (bookingData.emergency_contact && bookingData.emergency_contact !== patient.emergency_contact) updateData.emergency_contact = bookingData.emergency_contact;
        if (bookingData.blood_group && bookingData.blood_group !== patient.blood_group) updateData.blood_group = bookingData.blood_group;
        if (allergies.length > 0) updateData.allergies = allergies;
        if (medicalConditions.length > 0) updateData.medical_conditions = medicalConditions;

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('patients')
            .update(updateData)
            .eq('id', patient.id);
          
          if (updateError) console.warn('Failed to update patient info:', updateError);
        }
      }

      // Get next STN for today and department
      const { data: existingVisits } = await supabase
        .from('visits')
        .select('stn')
        .eq('visit_date', today)
        .eq('department', bookingData.department)
        .order('stn', { ascending: false })
        .limit(1);

      const nextSTN = (existingVisits?.[0]?.stn || 0) + 1;

      // Create QR payload
      const qrPayload: QRPayload = {
        clinic: 'CLN1',
        uid: patient.uid,
        stn: nextSTN,
        visit_date: today,
        issued_at: Date.now(),
      };

      const qrCodeData = await generateQRCode(qrPayload);
      setQrCodeDataURL(qrCodeData);

      // Create visit record
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert({
          patient_id: patient.id,
          clinic_id: 'CLN1',
          stn: nextSTN,
          department: bookingData.department,
          visit_date: today,
          status: 'waiting',
          payment_status: bookingData.payment_mode === 'pay_now' ? 'pending' : 'pay_at_clinic',
          qr_payload: JSON.stringify(qrPayload),
          doctor_id: bookingData.doctor_id || null,
        })
        .select()
        .single();

      if (visitError) throw visitError;

      // Get current queue status
      const { data: queueData } = await supabase
        .from('visits')
        .select('stn, status')
        .eq('visit_date', today)
        .eq('department', bookingData.department);

      const inServiceVisits = queueData?.filter(v => v.status === 'in_service') || [];
      const completedVisits = queueData?.filter(v => v.status === 'completed') || [];
      
      let nowServing = 0;
      if (inServiceVisits.length > 0) {
        nowServing = Math.min(...inServiceVisits.map(v => v.stn));
      } else if (completedVisits.length > 0) {
        nowServing = Math.max(...completedVisits.map(v => v.stn));
      }

      const position = Math.max(0, nextSTN - nowServing);
      const estimatedWaitMinutes = position * 10; // Assume 10 minutes per patient

      const result: BookingResponse = {
        uid: patient.uid,
        visit_id: visit.id,
        stn: nextSTN,
        department: bookingData.department,
        visit_date: today,
        payment_status: visit.payment_status,
        qr_payload: visit.qr_payload,
        estimated_wait_minutes: estimatedWaitMinutes,
        now_serving: nowServing,
        position,
      };

      setBookingResult(result);
      setShowBookingModal(false);
      
      if (bookingData.payment_mode === 'pay_now' && stripeEnabled) {
        setShowStripePayment(true);
      } else {
        setShowConfirmationModal(true);
      }

    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to book token. Please try again.';
      alert(errorMessage);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeDataURL && bookingResult) {
      downloadQRCode(qrCodeDataURL, `clinic-token-${bookingResult.stn}.png`);
    }
  };

  const handleStripePayment = async (paymentIntentId: string) => {
    try {
      if (!bookingResult) return;

      // Create payment transaction
      const { error } = await supabase
        .from('payment_transactions')
        .insert({
          visit_id: bookingResult.visit_id,
          patient_id: bookingResult.visit_id, // This should be patient_id, will be fixed in the actual implementation
          amount: 500, // This should come from department fee
          payment_method: 'online',
          transaction_id: paymentIntentId,
          status: 'completed',
          processed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update visit payment status
      await supabase
        .from('visits')
        .update({ payment_status: 'paid' })
        .eq('id', bookingResult.visit_id);

      setShowStripePayment(false);
      setShowConfirmationModal(true);
    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Payment processing failed. Please try again.');
    }
  };

  // Show maintenance page if enabled
  if (maintenanceMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-6xl mb-4">🔧</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Under Maintenance</h1>
            <p className="text-gray-600 mb-6">
              {maintenanceMessage || 'System is under maintenance. Please try again later.'}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">MediQueue</h1>
            </div>
            <Button variant="outline" onClick={() => setShowPatientLookup(true)}>
              <Search className="h-4 w-4 mr-2" />
              Track by UID
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-500 mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-medium">System Notice</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Skip the Wait,
            <span className="text-blue-600"> Book Your Token</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get your appointment token instantly, track the queue in real-time, and arrive exactly when it's your turn.
          </p>
          
          <Button
            onClick={() => setShowBookingModal(true)}
            size="lg"
            className="mb-8 px-8 py-4 text-lg"
          >
            <Calendar className="mr-2 h-6 w-6" />
            Book Your Token Now
          </Button>
        </div>

        {/* Live Queue Widget */}
        <QueueWidget />

        {/* 2D Queue Visualization */}
        <Card className="mb-12">
          <CardHeader>
            <h3 className="text-2xl font-bold text-center text-gray-900">Live Queue Dashboard</h3>
            <p className="text-center text-gray-600">Real-time visualization of all department queues with patient emojis</p>
          </CardHeader>
          <CardContent>
            <Queue2DVisualization 
              departmentStats={departmentStats}
            />
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-Time Updates</h3>
              <p className="text-gray-600">
                Get live updates on queue status and your estimated wait time.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <QrCode className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">QR Code Check-in</h3>
              <p className="text-gray-600">
                Quick and contactless check-in with your personal QR code.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Multiple Departments</h3>
              <p className="text-gray-600">
                Book tokens for different departments with specialized queues.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <Card className="mb-12">
          <CardHeader>
            <h3 className="text-2xl font-bold text-center text-gray-900">How It Works</h3>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div className="space-y-4">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h4 className="font-semibold text-gray-900">Book Online</h4>
                <p className="text-sm text-gray-600">Fill out the simple form with your details and preferred department.</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h4 className="font-semibold text-gray-900">Get QR Code</h4>
                <p className="text-sm text-gray-600">Receive your unique QR code and token number instantly.</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h4 className="font-semibold text-gray-900">Track Queue</h4>
                <p className="text-sm text-gray-600">Monitor your position and estimated wait time in real-time.</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-orange-600">4</span>
                </div>
                <h4 className="font-semibold text-gray-900">Quick Check-in</h4>
                <p className="text-sm text-gray-600">Show your QR code at the clinic for instant check-in.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Book Your Token"
        size="lg"
      >
        <BookingForm onSubmit={handleBookToken} loading={bookingLoading} />
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        title="Booking Confirmed!"
        size="lg"
      >
        {bookingResult && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Token Booked Successfully!</h3>
              <p className="text-gray-600">Your appointment has been confirmed.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Booking Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Patient ID:</span>
                      <span className="font-medium">{bookingResult.uid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Token Number:</span>
                      <span className="font-bold text-blue-600 text-lg">{bookingResult.stn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium capitalize">{bookingResult.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{bookingResult.visit_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment:</span>
                      <span className={`font-medium px-2 py-1 rounded text-xs ${
                        bookingResult.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        bookingResult.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {bookingResult.payment_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">Queue Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Now Serving:</span>
                      <span className="font-bold text-blue-900">{bookingResult.now_serving}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Your Position:</span>
                      <span className="font-bold text-blue-900">#{bookingResult.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Est. Wait Time:</span>
                      <span className="font-bold text-blue-900">{bookingResult.estimated_wait_minutes} min</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-3">Your QR Code</h4>
                {qrCodeDataURL && (
                  <div className="space-y-4">
                    <img
                      src={qrCodeDataURL}
                      alt="QR Code"
                      className="w-48 h-48 mx-auto border border-gray-200 rounded-lg"
                    />
                    <Button onClick={handleDownloadQR} variant="outline" className="w-full">
                      <QrCode className="mr-2 h-4 w-4" />
                      Download QR Code
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-semibold text-yellow-800 mb-2">Important Instructions:</h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Save or download your QR code for check-in</li>
                <li>• Arrive at the clinic when your token is close to being served</li>
                <li>• Show your QR code to the reception for quick check-in</li>
                <li>• Track the live queue status on this page</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmationModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button onClick={() => window.location.reload()} className="flex-1">
                Track Queue
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Patient Lookup Modal */}
      <PatientLookup
        isOpen={showPatientLookup}
        onClose={() => setShowPatientLookup(false)}
      />

      {/* Stripe Payment Modal */}
      <Modal
        isOpen={showStripePayment}
        onClose={() => setShowStripePayment(false)}
        title="Complete Payment"
        size="md"
      >
        {bookingResult && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Payment</h3>
              <p className="text-gray-600">Complete your payment to confirm booking</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Payment Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Token Number:</span>
                  <span className="font-bold">#{bookingResult.stn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium capitalize">{bookingResult.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consultation Fee:</span>
                  <span className="font-bold text-green-600">₹500</span>
                </div>
              </div>
            </div>

            {/* Dummy Stripe Payment Form */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Card Details</h4>
              <div className="space-y-3">
                <Input
                  label="Card Number"
                  placeholder="4242 4242 4242 4242"
                  defaultValue="4242 4242 4242 4242"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Expiry Date"
                    placeholder="MM/YY"
                    defaultValue="12/25"
                  />
                  <Input
                    label="CVC"
                    placeholder="123"
                    defaultValue="123"
                  />
                </div>
                <Input
                  label="Cardholder Name"
                  placeholder="John Doe"
                  defaultValue="John Doe"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm">
                🔒 This is a demo payment. Using test card: 4242 4242 4242 4242
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStripePayment(false);
                  setShowConfirmationModal(true);
                }}
                className="flex-1"
              >
                Pay Later
              </Button>
              <Button
                onClick={() => handleStripePayment('pi_test_' + Date.now())}
                className="flex-1"
              >
                Pay ₹500
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};