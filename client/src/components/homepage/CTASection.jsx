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
        <h2 className="text-4xl md:text-5xl text-blue-700 font-extrabold mb-6">
          Ready to Grow with SuiteGenie?
        </h2>
        <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
          Start your free trial and see how effortless content creation and automation can be. Join thousands of creators and teams building their brand with SuiteGenie.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={handleBookDemo}
            className="bg-blue-600 text-white hover:bg-blue-700 font-semibold px-8 py-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Book a Demo
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
