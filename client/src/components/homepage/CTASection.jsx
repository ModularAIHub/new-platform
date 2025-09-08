import React from 'react';
import { useNavigate } from 'react-router-dom';

const CTASection = () => {
  const navigate = useNavigate();

  const handleBookDemo = () => {
    navigate('/demo');
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xltext-blue-600 mb-6">
          Supercharge your team's productivity today!
        </h2>
        <p className="text-xl text-blue-700 mb-8 max-w-3xl mx-auto">
          Transform your social media strategy with AI-powered content creation and seamless automation. Join thousands of successful creators who've revolutionized their workflow.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={handleBookDemo}
            className="bg-blue-600 text-white hover:bg-blue-700 font-semibold px-8 py-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Book a demo
          </button>
        </div>

        {/* Newsletter signup */}
        {/* <div className="bg-blue-700/30 rounded-2xl p-8 max-w-md mx-auto backdrop-blur-sm border border-blue-500/20">
          <p className="text-blue-100 mb-4">Join our newsletter to stay up to date on features and releases.</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border-0 text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
            />
            <button className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-all duration-300 whitespace-nowrap">
              Subscribe
            </button>
          </div>
          <p className="text-xs text-blue-200 mt-3">
            By subscribing you agree to with our{' '}
            <a href="/privacy" className="underline hover:text-white transition-colors">Privacy Policy</a>{' '}
            and provide consent to receive updates from our company.
          </p>
        </div> */}
      </div>
    </section>
  );
};

export default CTASection;
