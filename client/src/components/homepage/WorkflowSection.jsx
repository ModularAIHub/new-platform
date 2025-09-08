import React from 'react';

const WorkflowSection = () => {
  const workflows = [
    {
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "AI-Driven Task",
      description: "Let our advanced AI algorithm take the guesswork out of your day. Our platform intelligently analyzes your work patterns, upcoming deadlines, and the importance of each project—helping you prioritize tasks, eliminate distractions, and maintain peak productivity throughout your workflow.",
      bgColor: "bg-pink-100",
      reverse: false
    },
    {
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Advanced Analytics",
      description: "Let our advanced AI algorithm take the guesswork out of your day. Our platform intelligently analyzes your work patterns, upcoming deadlines, and the importance of each project—helping you prioritize tasks, eliminate distractions, and maintain peak productivity throughout your workflow.",
      bgColor: "bg-green-100",
      reverse: true
    },
    {
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      title: "Cross-Platform Sync",
      description: "Let our advanced AI algorithm take the guesswork out of your day. Our platform intelligently analyzes your work patterns, upcoming deadlines, and the importance of each project—helping you prioritize tasks, eliminate distractions, and maintain peak productivity throughout your workflow.",
      bgColor: "bg-yellow-100",
      reverse: false
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-gray-900 mb-6">Revolutionize Your Workflow</h2>
        </div>

        <div className="space-y-24">
          {workflows.map((workflow, index) => (
            <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${workflow.reverse ? 'lg:flex-row-reverse' : ''}`}>
              {/* Content */}
              <div className={workflow.reverse ? 'lg:order-2' : ''}>
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  {workflow.icon}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{workflow.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {workflow.description}
                </p>
              </div>
              
              {/* Image/Visual */}
              <div className={workflow.reverse ? 'lg:order-1' : ''}>
                <div className={`${workflow.bgColor} rounded-2xl p-8 h-80 flex items-center justify-center`}>
                  <div className="text-center">
                    <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
                      {workflow.icon}
                    </div>
                    <p className="text-gray-600 font-medium">{workflow.title}</p>
                    <div className="mt-4 space-y-2">
                      <div className="h-2 bg-white/70 rounded w-3/4 mx-auto"></div>
                      <div className="h-2 bg-white/70 rounded w-1/2 mx-auto"></div>
                      <div className="h-2 bg-white/70 rounded w-2/3 mx-auto"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
