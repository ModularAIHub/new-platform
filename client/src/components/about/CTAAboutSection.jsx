import React from 'react';
import { useNavigate } from 'react-router-dom';

const CTAAboutSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-200 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-green-200 rounded-full blur-xl"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6 leading-tight">
              Supercharge your team's{' '}
              <span className="italic text-blue-600">productivity</span>{' '}
              today!
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-lg">
              Transform your social media strategy with AI-powered automation and join thousands of creators who've revolutionized their workflow.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Book a demo</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/plans')}
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-8 py-4 rounded-lg transition-all duration-300"
              >
                View Plans
              </button>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Free 14-day trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
            </div>
          </div>

          {/* Right Image/Visual */}
          <div className="relative">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              {/* Mock dashboard/chart */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">Analytics Dashboard</h3>
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                
                {/* Chart bars */}
                <div className="flex items-end space-x-2 h-32">
                  <div className="bg-blue-400 w-8 h-16 rounded-t"></div>
                  <div className="bg-purple-400 w-8 h-24 rounded-t"></div>
                  <div className="bg-green-400 w-8 h-20 rounded-t"></div>
                  <div className="bg-yellow-400 w-8 h-28 rounded-t"></div>
                  <div className="bg-pink-400 w-8 h-18 rounded-t"></div>
                  <div className="bg-indigo-400 w-8 h-32 rounded-t"></div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+245%</div>
                  <div className="text-sm text-gray-600">Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">12.5k</div>
                  <div className="text-sm text-gray-600">New Followers</div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Live Updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTAAboutSection;
