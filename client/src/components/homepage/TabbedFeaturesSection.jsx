import { useState } from 'react';

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
          <p className="text-lg text-gray-200 mb-2">Generate engaging posts and stunning images for all your channels. SuiteGenie helps you create scroll-stopping content and visuals in seconds. No design or writing skills needed.</p>
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
          <p className="text-lg text-gray-200 mb-2">Track likes, comments, and engagement for every post. See what works, when your audience is most active, and optimize your strategy with real data. No guesswork. Discover the best times to post based on real engagement, so you always publish at the perfect moment.</p>
        </>
      )
    },
    {
      id: 'strategy',
      label: 'Strategy Builder',
      desc: 'AI-powered content strategies based on your analytics.',
      icon: (
        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
      ),
      content: (
        <>
          <h3 className="text-3xl font-extrabold mb-4 text-purple-400">Strategy Builder</h3>
          <p className="text-lg text-gray-200 mb-2">AI analyzes your performance data and generates personalized content strategies. Get custom prompts, optimal posting times, and content recommendations based on what actually works for your audience.</p>
        </>
      )
    },
    {
      id: 'byok',
      label: 'BYOK (Bring Your Own Keys)',
      desc: 'Use your own AI API keys for maximum control.',
      icon: (
        <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
      ),
      content: (
        <>
          <h3 className="text-3xl font-extrabold mb-4 text-orange-400">BYOK (Bring Your Own Keys)</h3>
          <p className="text-lg text-gray-200 mb-2">Take full control with your own AI API keys. Use OpenAI, Gemini, or Perplexity for content generation. Image generation is supported via OpenAI and Gemini. Keep your data private, control your costs, and maintain complete ownership of your AI interactions.</p>
        </>
      )
    },
    {
      id: 'bulk',
      label: 'Bulk Scheduling',
      desc: 'Plan and schedule dozens of posts in one go.',
      icon: (
        <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
      ),
      content: (
        <>
          <h3 className="text-3xl font-extrabold mb-4 text-pink-400">Bulk Scheduling</h3>
          <p className="text-lg text-gray-200 mb-2">Create and schedule dozens of posts in one go. SuiteGenie makes it easy to plan campaigns, fill your calendar, and stay consistent. No more manual posting.</p>
        </>
      )
    }
  ];

  return (
  <section className="py-24 bg-gradient-to-br from-gray-800 via-gray-900 to-blue-900 min-h-[70vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-blue-500/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Powerful Features
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            Explore What SuiteGenie Can Do
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Everything you need to create, analyze, and schedule content faster and smarter than ever before.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-800/80 backdrop-blur-sm p-3 rounded-2xl border border-gray-600/50 shadow-2xl w-full max-w-6xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl font-medium transition-all duration-200 text-left group focus:outline-none focus:ring-2 focus:ring-blue-400 relative
                    ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-[1.02]'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50 hover:transform hover:scale-[1.01]'}
                  `}
                >
                  {tab.badge && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-yellow-500 text-yellow-900 text-[10px] font-bold rounded-full">
                      {tab.badge}
                    </span>
                  )}
                  <div className={`p-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-700/50 group-hover:bg-gray-600/50'}`}>
                    {tab.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{tab.label}</div>
                    <div className="text-xs opacity-75 mt-0.5 line-clamp-2">{tab.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex justify-center mb-10">
          <div className="h-1 w-32 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-400 rounded-full opacity-60"></div>
        </div>

        {/* Tab Content */}
        <div className="flex justify-center">
          <div className="w-full max-w-4xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-600/30 rounded-2xl shadow-2xl p-8 sm:p-12 text-center backdrop-blur-sm">
            <div key={activeTab} className="transition-all duration-300 ease-in-out">
              {tabs.find(tab => tab.id === activeTab)?.content}
              
              {/* Feature Benefits */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                {activeTab === 'generation' && (
                  <>
                    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                      <div className="text-2xl mb-2">⚡</div>
                      <div className="text-sm font-medium text-blue-300">Lightning Fast</div>
                      <div className="text-xs text-gray-400 mt-1">Generate content in seconds</div>
                    </div>
                    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                      <div className="text-2xl mb-2">🎨</div>
                      <div className="text-sm font-medium text-blue-300">AI-Powered</div>
                      <div className="text-xs text-gray-400 mt-1">Smart content & image creation</div>
                    </div>
                    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                      <div className="text-2xl mb-2">📱</div>
                      <div className="text-sm font-medium text-blue-300">Multi-Platform</div>
                      <div className="text-xs text-gray-400 mt-1">Works across all channels</div>
                    </div>
                  </>
                )}
                
                {activeTab === 'analytics' && (
                  <>
                    <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                      <div className="text-2xl mb-2">📊</div>
                      <div className="text-sm font-medium text-green-300">Real-Time Data</div>
                      <div className="text-xs text-gray-400 mt-1">Live engagement tracking</div>
                    </div>
                    <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                      <div className="text-2xl mb-2">🎯</div>
                      <div className="text-sm font-medium text-green-300">Smart Insights</div>
                      <div className="text-xs text-gray-400 mt-1">Actionable recommendations</div>
                    </div>
                    <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                      <div className="text-2xl mb-2">📈</div>
                      <div className="text-sm font-medium text-green-300">Growth Focused</div>
                      <div className="text-xs text-gray-400 mt-1">Optimize for better results</div>
                    </div>
                  </>
                )}
                
                {activeTab === 'strategy' && (
                  <>
                    <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                      <div className="text-2xl mb-2">🧠</div>
                      <div className="text-sm font-medium text-purple-300">Analytics-Based Insights</div>
                      <div className="text-xs text-gray-400 mt-1">AI learns from your data</div>
                    </div>
                    <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                      <div className="text-2xl mb-2">✍️</div>
                      <div className="text-sm font-medium text-purple-300">Custom Content Prompts</div>
                      <div className="text-xs text-gray-400 mt-1">Tailored to your audience</div>
                    </div>
                    <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                      <div className="text-2xl mb-2">🚀</div>
                      <div className="text-sm font-medium text-purple-300">Performance Optimization</div>
                      <div className="text-xs text-gray-400 mt-1">Data-driven recommendations</div>
                    </div>
                  </>
                )}
                
                {activeTab === 'byok' && (
                  <>
                    <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                      <div className="text-2xl mb-2">🔐</div>
                      <div className="text-sm font-medium text-orange-300">Full Control</div>
                      <div className="text-xs text-gray-400 mt-1">Your keys, your rules</div>
                    </div>
                    <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                      <div className="text-2xl mb-2">💰</div>
                      <div className="text-sm font-medium text-orange-300">Cost Control</div>
                      <div className="text-xs text-gray-400 mt-1">Pay only for what you use</div>
                    </div>
                    <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                      <div className="text-2xl mb-2">🛡️</div>
                      <div className="text-sm font-medium text-orange-300">Privacy First</div>
                      <div className="text-xs text-gray-400 mt-1">Your data stays with you</div>
                    </div>
                  </>
                )}
                
                {activeTab === 'bulk' && (
                  <>
                    <div className="bg-pink-500/10 rounded-xl p-4 border border-pink-500/20">
                      <div className="text-2xl mb-2">🚀</div>
                      <div className="text-sm font-medium text-pink-300">Bulk Power</div>
                      <div className="text-xs text-gray-400 mt-1">Create dozens at once</div>
                    </div>
                    <div className="bg-pink-500/10 rounded-xl p-4 border border-pink-500/20">
                      <div className="text-2xl mb-2">📋</div>
                      <div className="text-sm font-medium text-pink-300">Campaign Ready</div>
                      <div className="text-xs text-gray-400 mt-1">Plan entire campaigns</div>
                    </div>
                    <div className="bg-pink-500/10 rounded-xl p-4 border border-pink-500/20">
                      <div className="text-2xl mb-2">⏰</div>
                      <div className="text-sm font-medium text-pink-300">Time Saver</div>
                      <div className="text-xs text-gray-400 mt-1">Hours of work in minutes</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default TabbedFeaturesSection;
