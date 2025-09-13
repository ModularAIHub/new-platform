import React, { useState } from 'react';

const TabbedFeaturesSection = () => {
  const [activeTab, setActiveTab] = useState('generation');

  const tabs = [
    {
      id: 'generation',
      label: 'Content & Image Generation',
      desc: 'Create posts and images for any channel in seconds.',
      icon: (
        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      ),
      content: (
        <>
          <h3 className="text-3xl font-extrabold mb-4 text-blue-400">Content & Image Generation</h3>
          <p className="text-lg text-gray-200 mb-2">Generate engaging posts and stunning images for all your channels. SuiteGenie helps you create scroll-stopping content and visuals in seconds—no design or writing skills needed.</p>
        </>
      )
    },
    {
      id: 'analytics',
      label: 'Engagement Analytics',
      desc: 'Track likes, comments, and see what works best.',
      icon: (
        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 4h1a2 2 0 002-2v-2a2 2 0 00-2-2h-1m-4 0H7a2 2 0 00-2 2v2a2 2 0 002 2h1" /></svg>
      ),
      content: (
        <>
          <h3 className="text-3xl font-extrabold mb-4 text-green-400">Engagement Analytics</h3>
          <p className="text-lg text-gray-200 mb-2">Track likes, comments, and engagement for every post. See what works, when your audience is most active, and optimize your strategy with real data—no guesswork. Discover the best times to post based on real engagement, so you always publish at the perfect moment.</p>
        </>
      )
    },
    {
      id: 'timing',
      label: 'Optimal Timing',
      desc: 'Discover the best time to post for maximum reach.',
      icon: (
        <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
      content: (
        <>
          <h3 className="text-3xl font-extrabold mb-4 text-yellow-400">Optimal Timing</h3>
          <p className="text-lg text-gray-200 mb-2">SuiteGenie analyzes when your audience interacts most, so you always publish at the perfect moment for maximum reach and engagement.</p>
        </>
      )
    },
    {
      id: 'bulk',
      label: 'Bulk Scheduling',
      desc: 'Plan and schedule dozens of posts in one go.',
      icon: (
        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
      ),
      content: (
        <>
          <h3 className="text-3xl font-extrabold mb-4 text-purple-400">Bulk Scheduling</h3>
          <p className="text-lg text-gray-200 mb-2">Create and schedule dozens of posts in one go. SuiteGenie makes it easy to plan campaigns, fill your calendar, and stay consistent—no more manual posting.</p>
        </>
      )
    }
  ];

  return (
  <section className="py-24 bg-gradient-to-br from-gray-800 via-gray-900 to-blue-900 min-h-[70vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-100 mb-6">
            Explore What SuiteGenie Can Do
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Everything you need to create, analyze, and schedule content—faster and smarter.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-800/60 backdrop-blur p-2 rounded-2xl border border-gray-700 flex flex-col sm:flex-row flex-wrap gap-2 shadow-xl w-full max-w-3xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 sm:px-7 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-300 w-full sm:w-auto min-w-[180px] sm:min-w-[200px] text-base focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${activeTab === tab.id
                    ? 'bg-blue-700/90 text-white shadow-2xl scale-105 ring-2 ring-blue-400'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/60'}
                `}
                title={tab.desc}
              >
                <span>{tab.icon}</span>
                <span className="flex flex-col items-start">
                  <span className="text-sm sm:text-base">{tab.label}</span>
                  <span className="text-xs opacity-70 mt-1 font-normal">{tab.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex justify-center mb-10">
          <div className="h-1 w-32 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-400 rounded-full opacity-60"></div>
        </div>

        {/* Tab Content - Text Only with Animation */}
        <div className="flex justify-center">
          <div
            key={activeTab}
            className="w-full max-w-2xl bg-gray-900/90 border border-blue-900 rounded-3xl shadow-2xl p-6 sm:p-10 md:p-12 text-center animate-tabFadeIn backdrop-blur-lg mx-2"
            style={{ boxShadow: '0 8px 40px 0 rgba(80,120,255,0.10), 0 1.5px 8px 0 rgba(80,120,255,0.10)' }}
          >
            {tabs.find(tab => tab.id === activeTab)?.content}
          </div>
        </div>

      </div>
    </section>
  );
};

export default TabbedFeaturesSection;
