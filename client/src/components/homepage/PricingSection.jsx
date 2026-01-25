import React from 'react';
import { useNavigate } from 'react-router-dom';

const PricingSection = () => {
  const navigate = useNavigate();

  const handleExplorePricing = () => {
    navigate('/plans');
  };

  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "Forever",
      description: "Perfect for individuals getting started",
      features: [
        "5 social media accounts",
        "10 AI-generated posts/month", 
        "Basic analytics",
        "Email support"
      ],
      buttonText: "Get Started",
      buttonStyle: "border border-gray-300 text-gray-700 hover:bg-gray-50",
      popular: false
    },
    {
      name: "Professional", 
      price: "₹399",
      period: "per month",
      description: "Best for growing businesses and creators",
      features: [
        "25 social media accounts",
        "Unlimited AI posts",
        "Advanced analytics", 
        "Priority support",
        "Custom brand voice",
        "Team collaboration"
      ],
      buttonText: "Start Free Trial", 
      buttonStyle: "bg-blue-600 text-white hover:bg-blue-700",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom", 
      period: "Contact us",
      description: "For large teams and agencies",
      features: [
        "Unlimited accounts",
        "Unlimited everything", 
        "Advanced team features",
        "24/7 phone support",
        "Custom integrations",
        "Dedicated account manager"
      ],
      buttonText: "Contact Sales",
      buttonStyle: "border border-gray-300 text-gray-700 hover:bg-gray-50", 
      popular: false
    }
  ];

  return (
  <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-950 to-blue-900">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-white mb-6">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-gray-900/80 rounded-2xl border p-8 ${
                plan.popular 
                  ? 'border-blue-500 shadow-lg scale-105' 
                  : 'border-gray-800 shadow-sm'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-semibold text-white mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-light text-white">{plan.price}</span>
                  {plan.period !== "Forever" && (
                    <span className="text-gray-300 ml-2">{plan.period}</span>
                  )}
                </div>
                <p className="text-gray-300 mb-6">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>

              <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${plan.buttonStyle} bg-blue-600/90 text-white hover:bg-blue-700/90 border-none`}>
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button 
            onClick={handleExplorePricing}
            className="bg-blue-600/90 hover:bg-blue-700/90 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300"
          >
            Explore More Plans
          </button>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
