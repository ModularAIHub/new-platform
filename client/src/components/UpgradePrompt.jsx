import { useNavigate } from 'react-router-dom';
import { X, Crown, Check, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UpgradePrompt = ({ 
  isOpen, 
  onClose, 
  feature, 
  title = "Upgrade to Pro", 
  description = "Unlock powerful features to grow your social media presence",
  benefits = null,
  onUpgrade = null,
  isUpgrading = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const proFeatures = [
    "Unlimited automated posts",
    "Advanced AI content generation", 
    "Smart scheduling optimization",
    "Detailed analytics & insights",
    "Multi-account management (up to 8)",
    "Bulk content generation",
    "Priority email support",
    "100 platform credits (180 with BYOK)"
  ];
  const displayFeatures = Array.isArray(benefits) && benefits.length > 0 ? benefits : proFeatures;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-fadeIn shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{description}</p>
          {feature && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div className="flex items-center text-blue-700">
                <Sparkles className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">You tried to access: {feature}</span>
              </div>
            </div>
          )}
        </div>

        {/* Features list */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Pro features include:</h3>
          {displayFeatures.slice(0, 6).map((feature, index) => (
            <div key={index} className="flex items-start">
              <Check className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        {/* <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="flex items-baseline justify-center mb-2">
              <span className="text-3xl font-bold text-gray-900">Rs 399</span>
              <span className="text-gray-500 ml-1">/month</span>
            </div>
            <p className="text-sm text-gray-600">
              After 14-day trial
            </p>
          </div>
        {/* </div> */}

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={async () => {
              // If not logged in, redirect to register page with plan parameter
              if (!user) {
                navigate('/register?plan=pro');
                onClose();
                return;
              }

              if (typeof onUpgrade === 'function') {
                await onUpgrade();
                return;
              }

              // If logged in, go to plans page
              navigate('/plans?intent=pro');
              onClose();
            }}
            disabled={isUpgrading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center"
          >
            {isUpgrading ? 'Opening Checkout...' : user ? 'Upgrade to Pro' : 'Sign Up & Upgrade to Pro'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
          
          <button
            onClick={onClose}
            className="w-full text-gray-600 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Maybe Later
          </button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Instant access after upgrade
        </p>
      </div>
    </div>
  );
};

export default UpgradePrompt;


