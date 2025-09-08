import React from 'react';
import { useNavigate } from 'react-router-dom';

const HeroAboutSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative bg-white pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-8 leading-tight">
              <span className="block">Mastering Techniques</span>
              <span className="block italic text-gray-600">Through Experience</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-lg">
              Unlock your social media potential with AI-powered content creation and seamless automation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-300"
              >
                Get Started Today
              </button>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>Trusted by creators worldwide</span>
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-1">
                  <div className="w-6 h-6 bg-blue-100 rounded-full border-2 border-white"></div>
                  <div className="w-6 h-6 bg-green-100 rounded-full border-2 border-white"></div>
                  <div className="w-6 h-6 bg-purple-100 rounded-full border-2 border-white"></div>
                </div>
                <span>+1000 users</span>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative bg-gray-100 rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1926&q=80"
                alt="Professional businessman in modern office"
                className="w-full h-96 object-cover"
              />
              {/* Overlay elements */}
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Online</span>
                </div>
              </div>
              <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="text-sm font-medium text-gray-700">AI Powered</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroAboutSection;
