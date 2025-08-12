import React from 'react';

// Multi-language support for Hindi and English
export interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const translations: Translations = {
  // Header and Navigation
  'clinic_name': { en: 'MediQueue', hi: 'मेडीक्यू' },
  'admin_dashboard': { en: 'Admin Dashboard', hi: 'एडमिन डैशबोर्ड' },
  'track_by_uid': { en: 'Track by UID', hi: 'UID से ट्रैक करें' },
  
  // Home Page
  'skip_wait_book_token': { en: 'Skip the Wait, Book Your Token', hi: 'प्रतीक्षा छोड़ें, अपना टोकन बुक करें' },
  'get_appointment_instantly': { en: 'Get your appointment token instantly, track the queue in real-time, and arrive exactly when it\'s your turn.', hi: 'तुरंत अपना अपॉइंटमेंट टोकन प्राप्त करें, रियल-टाइम में कतार को ट्रैक करें, और बिल्कुल अपनी बारी पर पहुंचें।' },
  'book_token_now': { en: 'Book Your Token Now', hi: 'अभी अपना टोकन बुक करें' },
  
  // Features
  'real_time_updates': { en: 'Real-Time Updates', hi: 'रियल-टाइम अपडेट' },
  'real_time_desc': { en: 'Get live updates on queue status and your estimated wait time.', hi: 'कतार की स्थिति और अनुमानित प्रतीक्षा समय पर लाइव अपडेट प्राप्त करें।' },
  'qr_check_in': { en: 'QR Code Check-in', hi: 'QR कोड चेक-इन' },
  'qr_check_in_desc': { en: 'Quick and contactless check-in with your personal QR code.', hi: 'अपने व्यक्तिगत QR कोड के साथ त्वरित और संपर्क रहित चेक-इन।' },
  'multiple_departments': { en: 'Multiple Departments', hi: 'कई विभाग' },
  'multiple_departments_desc': { en: 'Book tokens for different departments with specialized queues.', hi: 'विशेष कतारों के साथ विभिन्न विभागों के लिए टोकन बुक करें।' },
  
  // Booking Form
  'book_your_token': { en: 'Book Your Token', hi: 'अपना टोकन बुक करें' },
  'full_name': { en: 'Full Name', hi: 'पूरा नाम' },
  'age': { en: 'Age', hi: 'आयु' },
  'phone_number': { en: 'Phone Number', hi: 'फोन नंबर' },
  'department': { en: 'Department', hi: 'विभाग' },
  'email_optional': { en: 'Email (Optional)', hi: 'ईमेल (वैकल्पिक)' },
  'emergency_contact': { en: 'Emergency Contact (Optional)', hi: 'आपातकालीन संपर्क (वैकल्पिक)' },
  'blood_group': { en: 'Blood Group (Optional)', hi: 'रक्त समूह (वैकल्पिक)' },
  'address': { en: 'Address (Optional)', hi: 'पता (वैकल्पिक)' },
  'allergies': { en: 'Allergies (Optional)', hi: 'एलर्जी (वैकल्पिक)' },
  'medical_conditions': { en: 'Medical Conditions (Optional)', hi: 'चिकित्सा स्थितियां (वैकल्पिक)' },
  'payment_mode': { en: 'Payment Mode', hi: 'भुगतान मोड' },
  'pay_at_clinic': { en: 'Pay at Clinic', hi: 'क्लिनिक में भुगतान करें' },
  'pay_now': { en: 'Pay Now', hi: 'अभी भुगतान करें' },
  
  // Queue Status
  'now_serving': { en: 'Now Serving', hi: 'अब सेवा कर रहे हैं' },
  'waiting': { en: 'Waiting', hi: 'प्रतीक्षा में' },
  'your_token': { en: 'Your Token', hi: 'आपका टोकन' },
  'est_wait': { en: 'Est. Wait', hi: 'अनुमानित प्रतीक्षा' },
  'position_in_queue': { en: 'Your position in queue:', hi: 'कतार में आपकी स्थिति:' },
  
  // Status Labels
  'checked_in': { en: 'Checked In', hi: 'चेक इन किया गया' },
  'in_service': { en: 'In Service', hi: 'सेवा में' },
  'completed': { en: 'Completed', hi: 'पूर्ण' },
  'held': { en: 'On Hold', hi: 'होल्ड पर' },
  'expired': { en: 'Expired', hi: 'समाप्त' },
  'paid': { en: 'Paid', hi: 'भुगतान किया गया' },
  'pending': { en: 'Pending', hi: 'लंबित' },
  'pay_at_clinic_status': { en: 'Pay at Clinic', hi: 'क्लिनिक में भुगतान' },
  
  // Admin Panel
  'scan_qr': { en: 'Scan QR', hi: 'QR स्कैन करें' },
  'patient_lookup': { en: 'Patient Lookup', hi: 'रोगी खोज' },
  'settings': { en: 'Settings', hi: 'सेटिंग्स' },
  'sign_out': { en: 'Sign Out', hi: 'साइन आउट' },
  'total_waiting': { en: 'Total Waiting', hi: 'कुल प्रतीक्षा' },
  'completed_today': { en: 'Completed Today', hi: 'आज पूर्ण' },
  'total_visits': { en: 'Total Visits', hi: 'कुल विज़िट' },
  'today_revenue': { en: 'Today Revenue', hi: 'आज की आय' },
  'avg_wait': { en: 'Avg Wait', hi: 'औसत प्रतीक्षा' },
  
  // Common Actions
  'check_in': { en: 'Check In', hi: 'चेक इन' },
  'start_service': { en: 'Start Service', hi: 'सेवा शुरू करें' },
  'complete': { en: 'Complete', hi: 'पूर्ण करें' },
  'mark_paid': { en: 'Mark Paid', hi: 'भुगतान चिह्नित करें' },
  'process_payment': { en: 'Process Payment', hi: 'भुगतान प्रक्रिया' },
  'cancel': { en: 'Cancel', hi: 'रद्द करें' },
  'save': { en: 'Save', hi: 'सेव करें' },
  'close': { en: 'Close', hi: 'बंद करें' },
  'search': { en: 'Search', hi: 'खोजें' },
  'refresh': { en: 'Refresh', hi: 'रीफ्रेश' },
  
  // Error Messages
  'patient_not_found': { en: 'Patient not found. Please check the search criteria.', hi: 'रोगी नहीं मिला। कृपया खोज मानदंड जांचें।' },
  'invalid_qr_code': { en: 'Invalid QR code format', hi: 'अमान्य QR कोड प्रारूप' },
  'payment_failed': { en: 'Payment processing failed. Please try again.', hi: 'भुगतान प्रक्रिया विफल। कृपया पुनः प्रयास करें।' },
  'booking_failed': { en: 'Failed to book token. Please try again.', hi: 'टोकन बुक करने में विफल। कृपया पुनः प्रयास करें।' },
  
  // Success Messages
  'booking_confirmed': { en: 'Booking Confirmed!', hi: 'बुकिंग की पुष्टि!' },
  'payment_successful': { en: 'Payment processed successfully', hi: 'भुगतान सफलतापूर्वक प्रक्रिया' },
  'check_in_successful': { en: 'Patient checked in successfully', hi: 'रोगी सफलतापूर्वक चेक इन हुआ' },
  
  // Instructions
  'important_instructions': { en: 'Important Instructions:', hi: 'महत्वपूर्ण निर्देश:' },
  'save_qr_code': { en: 'Save or download your QR code for check-in', hi: 'चेक-इन के लिए अपना QR कोड सेव या डाउनलोड करें' },
  'arrive_on_time': { en: 'Arrive at the clinic when your token is close to being served', hi: 'जब आपका टोकन सेवा के करीब हो तो क्लिनिक पहुंचें' },
  'show_qr_reception': { en: 'Show your QR code to the reception for quick check-in', hi: 'त्वरित चेक-इन के लिए रिसेप्शन पर अपना QR कोड दिखाएं' },
  'track_live_queue': { en: 'Track the live queue status on this page', hi: 'इस पेज पर लाइव कतार स्थिति को ट्रैक करें' }
};

export const useTranslation = () => {
  const [language, setLanguage] = React.useState<'en' | 'hi'>('en');

  React.useEffect(() => {
    const savedLang = localStorage.getItem('preferred_language') as 'en' | 'hi';
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  const changeLanguage = (lang: 'en' | 'hi') => {
    setLanguage(lang);
    localStorage.setItem('preferred_language', lang);
  };

  return { t, language, changeLanguage };
};