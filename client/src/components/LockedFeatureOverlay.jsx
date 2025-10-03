import { Crown, Lock } from 'lucide-react';

const LockedFeatureOverlay = ({ 
  feature, 
  onUpgradeClick, 
  title = "Pro Feature",
  description = "Upgrade to Pro to unlock this feature"
}) => {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm z-10">
      <div className="text-center p-6 max-w-sm">
        {/* Icon */}
        <div className="relative mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-gray-600 rounded-full w-6 h-6 flex items-center justify-center">
            <Lock className="h-3 w-3 text-white" />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        
        {/* Upgrade button */}
        <button
          onClick={onUpgradeClick}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm"
        >
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
};

export default LockedFeatureOverlay;