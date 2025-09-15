import React from 'react';

const WorkflowSection = () => {
  const workflows = [
    {
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      title: "Content & Image Generation",
      description: "Generate engaging posts and stunning images for all your channels. SuiteGenie helps you create scroll-stopping content and visuals in seconds—no design or writing skills needed.",
      bgColor: "bg-blue-100",
      reverse: false
    },
    {
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m4 4h1a2 2 0 002-2v-2a2 2 0 00-2-2h-1m-4 0H7a2 2 0 00-2 2v2a2 2 0 002 2h1" />
        </svg>
      ),
      title: "Engagement Analytics",
      description: "Track likes, comments, and engagement for every post. See what works, when your audience is most active, and optimize your strategy with real data—no guesswork. Discover the best times to post based on real engagement, so you always publish at the perfect moment.",
      bgColor: "bg-green-100",
      reverse: true
    },
    {
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
      title: "Bulk Generation & Scheduling",
      description: "Create and schedule dozens of posts in one go. SuiteGenie makes it easy to plan campaigns, fill your calendar, and stay consistent—no more manual posting.",
      bgColor: "bg-purple-100",
      reverse: true
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-white via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">How SuiteGenie Works</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Automate your content creation, scheduling, and publishing across all your favorite platforms—without losing your creative touch.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {workflows.map((workflow, index) => (
            <div key={index} className={`bg-white/80 border border-blue-100 p-10 rounded-3xl text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center`}> 
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mb-6 shadow-md">
                {workflow.icon}
              </div>
              <h3 className="text-2xl font-bold text-blue-900 mb-4">{workflow.title}</h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                {workflow.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
