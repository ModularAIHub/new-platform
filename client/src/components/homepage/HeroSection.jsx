import React from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLearnMore = () => {
    navigate('/demo');
  };

  return (
    <section className="relative bg-white pt-24 pb-32 overflow-hidden min-h-[70vh] flex items-center">
      {/* Decorative blurred shapes (subtle, lighter for white bg) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl z-0"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
              Supercharge Your Content with <span className="text-blue-700">SuiteGenie</span>
            </h1>
            <div className="mb-6">
              <span className="inline-block bg-blue-50 text-blue-700 font-semibold px-4 py-2 rounded-lg shadow-sm text-lg tracking-tight">
                Automate your content, not your Creativity.
              </span>
            </div>
            <p className="text-lg sm:text-2xl text-gray-700 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
              The all-in-one AI suite for creators, marketers, and teams. Effortlessly generate, schedule, and manage content for every channel—so you can focus on what matters most: growing your brand.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center lg:justify-start">
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold px-10 py-4 rounded-xl shadow-xl text-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Try SuiteGenie Free
              </button>
              <button
                onClick={handleLearnMore}
                className="border-2 border-blue-400 text-blue-700 hover:bg-blue-50 font-bold px-10 py-4 rounded-xl text-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                See How It Works
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-6">Trusted by 21,000+ creators and businesses</p>

            {/* Customer logos */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 opacity-80">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-700">SG</span>
                </div>
                <span className="text-sm text-blue-700">SuiteGenie</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-700">AI</span>
                </div>
                <span className="text-sm text-blue-700">AI Tools</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-700">CM</span>
                </div>
                <span className="text-sm text-blue-700">ContentMark</span>
              </div>
            </div>
          </div>

          {/* Right Content - Illustration */}
          <div className="relative flex justify-center lg:justify-end mt-12 lg:mt-0">
            <div className="relative bg-gradient-to-br from-blue-200/60 to-purple-200/60 rounded-3xl p-8 h-96 w-full max-w-md flex items-center justify-center shadow-2xl border border-blue-100/30">
              <div className="text-center w-full">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-blue-100/40">
                  <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="bg-white/90 rounded-xl p-5 shadow-lg max-w-xs mx-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-900">Content Scheduled</span>
                    <span className="text-green-500 text-sm font-bold">+24%</span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '75%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
