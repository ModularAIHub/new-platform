import React, { useState } from 'react';

const TabbedFeaturesSection = () => {
  const [activeTab, setActiveTab] = useState('todo');

  const tabs = [
    { id: 'todo', label: 'To Do' },
    { id: 'insights', label: 'Insights' },
    { id: 'investments', label: 'Investments' }
  ];

  const tabImages = {
    todo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    insights: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    investments: 'https://images.unsplash.com/photo-1590479773265-7464e5d48118?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
  };

  return (
    <section className="py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-light text-gray-300 mb-6">
            Discover the Features That<br />
            Matter Most to You
          </h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-xl border border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-yellow-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content - Image Only */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-4xl">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <div className="aspect-video bg-gray-800">
                <img
                  key={activeTab}
                  src={tabImages[activeTab]}
                  alt={`${activeTab} dashboard interface`}
                  className="w-full h-full object-cover transition-all duration-700 ease-in-out transform animate-fadeInScale"
                />
              </div>
              
              {/* Overlay gradient for better contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent pointer-events-none"></div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-500/20 rounded-full blur-sm animate-pulse"></div>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-blue-500/20 rounded-full blur-sm animate-pulse delay-700"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TabbedFeaturesSection;
