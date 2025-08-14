import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  X, 
  Calendar, 
  QrCode, 
  Clock, 
  CheckCircle,
  Smartphone,
  Users,
  ArrowRight,
  ArrowLeft,
  Info
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Modal } from './ui/Modal';

interface InteractiveGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  tips: string[];
}

export const InteractiveGuide: React.FC<InteractiveGuideProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  const steps: GuideStep[] = [
    {
      id: 1,
      title: "Welcome to MediQueue",
      description: "Your smart clinic token booking system",
      icon: <Users className="h-8 w-8 text-blue-600" />,
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🏥</div>
          <h3 className="text-xl font-bold text-gray-900">Welcome to the Future of Healthcare</h3>
          <p className="text-gray-600">
            Skip long waiting lines and book your appointment token instantly. 
            Track your queue position in real-time and arrive exactly when it's your turn.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">What you'll learn:</h4>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• How to book your token online</li>
              <li>• Understanding QR codes and check-in</li>
              <li>• Tracking your queue position</li>
              <li>• Payment options available</li>
              <li>• Tips for a smooth experience</li>
            </ul>
          </div>
        </div>
      ),
      tips: [
        "This guide takes about 3 minutes to complete",
        "You can pause and resume anytime",
        "All features are available 24/7"
      ]
    },
    {
      id: 2,
      title: "Step 1: Book Your Token",
      description: "Fill out the simple booking form",
      icon: <Calendar className="h-8 w-8 text-green-600" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Online Booking Form</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-3 border">
                <label className="text-sm font-medium text-gray-700">Full Name *</label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm">John Doe</div>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <label className="text-sm font-medium text-gray-700">Age *</label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm">30</div>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <label className="text-sm font-medium text-gray-700">Phone *</label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm">+91 9876543210</div>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <label className="text-sm font-medium text-gray-700">Department *</label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm">General Medicine</div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Pro Tip:</strong> Fill in optional fields like email and medical conditions 
                for better service and faster check-ins.
              </p>
            </div>
          </div>
        </div>
      ),
      tips: [
        "Required fields are marked with *",
        "Your phone number is used for identification",
        "Medical information helps doctors prepare better"
      ]
    },
    {
      id: 3,
      title: "Step 2: Choose Payment Method",
      description: "Select how you want to pay",
      icon: <CheckCircle className="h-8 w-8 text-purple-600" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 text-center">Payment Options</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border-2 border-blue-500 bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                <h4 className="font-semibold text-blue-900">Pay at Clinic</h4>
              </div>
              <p className="text-sm text-blue-800 mb-2">Pay when you arrive at the clinic</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Cash, Card, or UPI accepted</li>
                <li>• No online transaction fees</li>
                <li>• Flexible payment options</li>
              </ul>
            </div>
            
            <div className="border-2 border-green-500 bg-green-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <h4 className="font-semibold text-green-900">Pay Now (Online)</h4>
              </div>
              <p className="text-sm text-green-800 mb-2">Secure online payment with Stripe</p>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• Skip payment queue at clinic</li>
                <li>• Secure card processing</li>
                <li>• Instant confirmation</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">💳 Accepted Payment Methods</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-white border rounded text-xs">Visa</span>
              <span className="px-2 py-1 bg-white border rounded text-xs">Mastercard</span>
              <span className="px-2 py-1 bg-white border rounded text-xs">UPI</span>
              <span className="px-2 py-1 bg-white border rounded text-xs">Cash</span>
              <span className="px-2 py-1 bg-white border rounded text-xs">Insurance</span>
            </div>
          </div>
        </div>
      ),
      tips: [
        "Online payment saves time at the clinic",
        "All transactions are secure and encrypted",
        "You can change payment method before confirmation"
      ]
    },
    {
      id: 4,
      title: "Step 3: Get Your QR Code",
      description: "Receive your unique token and QR code",
      icon: <QrCode className="h-8 w-8 text-indigo-600" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Digital Token</h3>
            
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 mb-4">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <h4 className="font-bold text-2xl text-indigo-600 mb-2">Token #15</h4>
                    <p className="text-sm text-gray-600 mb-1">General Medicine</p>
                    <p className="text-sm text-gray-600">Patient ID: CLN1-ABC123</p>
                    <p className="text-sm text-gray-600">Date: Today</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-32 h-32 bg-white border-2 border-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-600">Your QR Code</p>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <Smartphone className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="font-medium text-blue-900">Save to Phone</p>
                <p className="text-blue-700 text-xs">Screenshot or download</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <QrCode className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="font-medium text-green-900">Show at Clinic</p>
                <p className="text-green-700 text-xs">Quick check-in</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <Clock className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                <p className="font-medium text-purple-900">Track Queue</p>
                <p className="text-purple-700 text-xs">Real-time updates</p>
              </div>
            </div>
          </div>
        </div>
      ),
      tips: [
        "Save your QR code to your phone's gallery",
        "Your Patient ID is permanent - save it for future visits",
        "QR codes work even without internet at the clinic"
      ]
    },
    {
      id: 5,
      title: "Step 4: Track Your Queue",
      description: "Monitor your position in real-time",
      icon: <Clock className="h-8 w-8 text-orange-600" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 text-center">Live Queue Tracking</h3>
          
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6">
            <div className="grid md:grid-cols-4 gap-4 text-center mb-4">
              <div className="bg-white rounded-lg p-3 border">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <div className="text-xl font-bold text-blue-900">12</div>
                <div className="text-xs text-blue-700">Now Serving</div>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <Users className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                <div className="text-xl font-bold text-yellow-900">8</div>
                <div className="text-xs text-yellow-700">Waiting</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-500">
                <div className="text-xl font-bold text-green-900">15</div>
                <div className="text-xs text-green-700">Your Token</div>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <div className="text-xl font-bold text-orange-900">30m</div>
                <div className="text-xs text-orange-700">Est. Wait</div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold text-gray-900 mb-2">Your Position: #3 in queue</h4>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="text-sm text-gray-600">You're almost there! Estimated wait: 30 minutes</p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">🔔 Smart Notifications</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Get notified when you're next in line</li>
              <li>• Receive updates if there are delays</li>
              <li>• Know exactly when to arrive at the clinic</li>
            </ul>
          </div>
        </div>
      ),
      tips: [
        "Arrive 10-15 minutes before your estimated time",
        "The page auto-refreshes every 30 seconds",
        "You can track multiple family members' tokens"
      ]
    },
    {
      id: 6,
      title: "Step 5: Check-in at Clinic",
      description: "Quick and contactless check-in process",
      icon: <CheckCircle className="h-8 w-8 text-green-600" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 text-center">Contactless Check-in</h3>
          
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">📱</span>
                </div>
                <h4 className="font-semibold text-green-900">1. Show QR Code</h4>
                <p className="text-sm text-green-700">Open your saved QR code</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">📷</span>
                </div>
                <h4 className="font-semibold text-blue-900">2. Scan at Reception</h4>
                <p className="text-sm text-blue-700">Staff will scan your code</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">✅</span>
                </div>
                <h4 className="font-semibold text-purple-900">3. You're Checked In!</h4>
                <p className="text-sm text-purple-700">Wait for your turn</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="font-semibold text-green-900">Check-in Successful!</h4>
              </div>
              <p className="text-sm text-green-700 mb-2">
                Welcome John Doe! You're now checked in for Token #15
              </p>
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                Status updated: Waiting → Checked In
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="font-semibold text-yellow-900 mb-1">⚡ Super Fast</h4>
              <p className="text-sm text-yellow-800">Check-in takes less than 5 seconds</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-semibold text-blue-900 mb-1">🔒 Secure</h4>
              <p className="text-sm text-blue-800">Encrypted QR codes prevent fraud</p>
            </div>
          </div>
        </div>
      ),
      tips: [
        "Keep your phone brightness high for easy scanning",
        "Arrive a few minutes before your estimated time",
        "If QR scanning fails, show your Patient ID to staff"
      ]
    },
    {
      id: 7,
      title: "Congratulations! 🎉",
      description: "You're now ready to use MediQueue",
      icon: <CheckCircle className="h-8 w-8 text-green-600" />,
      content: (
        <div className="text-center space-y-6">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-gray-900">You're All Set!</h3>
          <p className="text-gray-600 text-lg">
            You now know how to use MediQueue like a pro. Enjoy skip-the-line healthcare!
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">✅ What You Learned</h4>
              <ul className="text-sm text-green-800 space-y-1 text-left">
                <li>• Online token booking</li>
                <li>• QR code generation & usage</li>
                <li>• Real-time queue tracking</li>
                <li>• Payment options</li>
                <li>• Quick check-in process</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">🚀 Ready to Start?</h4>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>• Book your first token</li>
                <li>• Save your Patient ID</li>
                <li>• Download prescriptions anytime</li>
                <li>• Track family members too</li>
                <li>• Enjoy hassle-free healthcare</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">💡 Pro Tips for Best Experience</h4>
            <div className="grid md:grid-cols-2 gap-2 text-sm text-purple-800">
              <div>• Book tokens in advance</div>
              <div>• Keep your Patient ID handy</div>
              <div>• Enable notifications</div>
              <div>• Arrive on time</div>
              <div>• Download prescriptions</div>
              <div>• Share with family</div>
            </div>
          </div>
        </div>
      ),
      tips: [
        "Bookmark this page for easy access",
        "Share MediQueue with friends and family",
        "Contact support if you need help"
      ]
    }
  ];

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && autoPlay) {
      interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 8000); // 8 seconds per step
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, autoPlay, steps.length]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    setAutoPlay(!isPlaying);
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setIsPlaying(false);
    setAutoPlay(false);
  };

  const currentStepData = steps[currentStep];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Interactive Guide" size="xl">
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Navigation Dots */}
        <div className="flex justify-center space-x-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => goToStep(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentStep 
                  ? 'bg-blue-600 scale-125' 
                  : index < currentStep 
                    ? 'bg-green-500' 
                    : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Current Step Content */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                {currentStepData.icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-gray-600">
                {currentStepData.description}
              </p>
            </div>

            <div className="mb-6">
              {currentStepData.content}
            </div>

            {/* Tips Section */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Info className="h-4 w-4 text-yellow-600 mr-2" />
                <h4 className="font-semibold text-yellow-900">Quick Tips</h4>
              </div>
              <ul className="text-sm text-yellow-800 space-y-1">
                {currentStepData.tips.map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              onClick={togglePlay}
              variant="outline"
              size="sm"
              disabled={currentStep >= steps.length - 1}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <span className="text-sm text-gray-600">
              {isPlaying ? 'Auto-playing' : 'Paused'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={prevStep}
              disabled={currentStep === 0}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep} size="sm">
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={onClose} size="sm">
                Start Using MediQueue
                <CheckCircle className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Skip Guide Option */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Skip guide and start booking
          </button>
        </div>
      </div>
    </Modal>
  );
};