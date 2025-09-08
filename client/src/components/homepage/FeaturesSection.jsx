import React from 'react';
import { useNavigate } from 'react-router-dom';

const FeaturesSection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };

  const platforms = [
    {
      icon: (
        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      ),
      title: "Twitter Automator",
      description: "🚀 Turn your thoughts into viral tweets! Our AI crafts engaging content, schedules posts at peak times, and manages threads like a social media ninja. Say goodbye to tweet anxiety!",
      bgColor: "bg-blue-100",
      accent: "border-l-4 border-blue-500"
    },
    {
      icon: (
        <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      title: "LinkedIn Automator",
      description: "💼 Professional networking made effortless! Generate thought-leadership content, schedule industry insights, and build your professional brand while you sleep. Your career growth autopilot!",
      bgColor: "bg-indigo-100",
      accent: "border-l-4 border-blue-700"
    },
    {
      icon: (
        <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l-3.295-5.704c.863-.496 1.435-1.412 1.435-2.496 0-.312-.06-.614-.172-.883l2.077-5.417zm-6.359 3.678c0-1.83-.731-3.51-1.912-4.69-.28-.28-.649-.421-1.018-.421-.372 0-.741.141-1.021.421C10.38 6.593 9.648 8.273 9.648 10.103c0 1.83.731 3.51 1.911 4.69.28.28.649.421 1.021.421.369 0 .738-.141 1.018-.421 1.181-1.18 1.912-2.86 1.912-4.69zm-1.634 11.374c2.019-.983 3.418-3.032 3.418-5.407 0-1.32-.425-2.549-1.154-3.561l-2.078 5.418c.062.208.095.426.095.65 0 1.084-.572 2-1.435 2.496l1.154 .404zM2.926 5.892c3.511-5.098 10.427-6.403 15.464-2.926 5.05 3.486 6.426 10.344 3.056 15.372L2.926 5.892z"/>
        </svg>
      ),
      title: "WordPress Automator",
      description: "📝 Transform your blog into a content powerhouse! Auto-generate SEO-optimized posts, schedule publications, and keep your audience engaged with fresh content. Your 24/7 content creator!",
      bgColor: "bg-gray-100",
      accent: "border-l-4 border-gray-700"
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-gray-900 mb-6">Powerful Platforms We Automate</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Dominate every major platform with AI-powered automation. From viral tweets to professional posts, we've got your entire content strategy covered.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300"
          >
            Get Started
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {platforms.map((platform, index) => (
            <div key={index} className={`${platform.bgColor} ${platform.accent} p-8 rounded-2xl text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-6 shadow-sm">
                {platform.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{platform.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {platform.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
