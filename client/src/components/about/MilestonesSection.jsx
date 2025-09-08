import React from 'react';

const MilestonesSection = () => {
  const milestones = [
    {
      number: "5.0",
      label: "Rating",
      description: "Average user rating across all platforms, reflecting excellence in user experience."
    },
    {
      number: "88%",
      label: "Success Rate",
      description: "Content engagement improvement rate for our users compared to manual posting."
    },
    {
      number: "1M",
      label: "Posts Generated",
      description: "Total number of AI-generated posts created through our platform worldwide."
    },
    {
      number: "12K",
      label: "Active Users",
      description: "Growing community of content creators, businesses, and social media managers."
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-gray-900 mb-6">
            Key Milestones We've Achieved
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {milestones.map((milestone, index) => (
            <div key={index} className="text-center">
              <div className="mb-4">
                <span className="text-5xl font-light text-gray-900 block mb-2">
                  {milestone.number}
                </span>
                <span className="text-lg font-semibold text-gray-700 block mb-3">
                  {milestone.label}
                </span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {milestone.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MilestonesSection;
