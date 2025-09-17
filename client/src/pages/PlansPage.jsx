import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import Footer from '../components/Footer';

const PlansPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      monthlyPrice: '$0',
      description: 'Perfect for getting started with automation',
      features: [
        '5 automated posts per month',
        '1 social platform connection',
        'Basic analytics',
        'Email support',
        'Template library access',
        'AI content suggestions'
      ],
      notIncluded: [
        'Multi-platform posting',
        'Advanced analytics',
        'Custom scheduling',
        'Priority support',
        'Team collaboration',
        'API access'
      ],
      buttonText: 'Start Free',
      popular: false
    },
    {
      name: 'Professional',
      price: '$1500',
      monthlyPrice: '$29',
      description: 'Everything you need to scale your social presence',
      features: [
        'Unlimited automated posts',
        'All social platforms (Twitter, LinkedIn, WordPress)',
        'Advanced AI content generation',
        'Smart scheduling optimization',
        'Detailed analytics & insights',
        'Custom content templates',
        'Bulk content generation',
        'Multi-account management',
        'Priority email support',
        'Content calendar',
        'Hashtag optimization',
        'Engagement tracking'
      ],
      notIncluded: [
        'White-label solution',
        'Dedicated account manager',
        'Custom integrations',
        'Phone support'
      ],
      buttonText: 'Start 14-Day Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      monthlyPrice: 'Contact Us',
      description: 'Advanced features for large teams and agencies',
      features: [
        'Everything in Professional',
        'Unlimited team members',
        'White-label solution',
        'Custom integrations',
        'Dedicated account manager',
        '24/7 phone support',
        'Custom reporting',
        'API access',
        'Single sign-on (SSO)',
        'Advanced security features',
        'Custom training sessions',
        'Priority feature requests'
      ],
      notIncluded: [],
      buttonText: 'Contact Sales',
      popular: false
    }
  ];

  const comparisonFeatures = [
    { name: 'Monthly Posts', starter: '5', professional: 'Unlimited', enterprise: 'Unlimited' },
    { name: 'Social Platforms', starter: '1', professional: 'All (3+)', enterprise: 'All (3+)' },
    { name: 'AI Content Generation', starter: 'Basic', professional: 'Advanced', enterprise: 'Advanced' },
    { name: 'Analytics', starter: 'Basic', professional: 'Advanced', enterprise: 'Custom' },
    { name: 'Team Members', starter: '1', professional: '5', enterprise: 'Unlimited' },
    { name: 'Support', starter: 'Email', professional: 'Priority Email', enterprise: '24/7 Phone' },
    { name: 'Custom Templates', starter: false, professional: true, enterprise: true },
    { name: 'Bulk Generation', starter: false, professional: true, enterprise: true },
    { name: 'White-label', starter: false, professional: false, enterprise: true },
    { name: 'API Access', starter: false, professional: false, enterprise: true },
    { name: 'SSO', starter: false, professional: false, enterprise: true },
    { name: 'Dedicated Manager', starter: false, professional: false, enterprise: true }
  ];

  const faqs = [
    {
      question: 'What happens after my 14-day trial ends?',
      answer: 'After your 14-day trial, you can choose to continue with a paid plan or downgrade to our free Starter plan. No credit card required for the trial.'
    },
    {
      question: 'Can I change plans at any time?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated accordingly.'
    },
    {
      question: 'What social platforms do you support?',
      answer: 'We currently support Twitter, LinkedIn, and WordPress with more platforms coming soon. Our Professional and Enterprise plans include access to all supported platforms.'
    },
    {
      question: 'Is there a setup fee or contract?',
      answer: 'No setup fees and no long-term contracts required. You can cancel anytime with just a few clicks from your account settings.'
    },
    {
      question: 'How does the AI content generation work?',
      answer: 'Our AI analyzes your brand voice, industry trends, and engagement patterns to create personalized content that resonates with your audience across all platforms.'
    },
    {
      question: 'Can I get a refund if I\'m not satisfied?',
      answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not completely satisfied, contact our support team for a full refund.'
    },
    {
      question: 'Do you offer custom integrations for Enterprise customers?',
      answer: 'Yes! Enterprise customers can request custom integrations with their existing tools and workflows. Our development team will work with you to create tailored solutions.'
    },
    {
      question: 'What kind of support do you provide?',
      answer: 'Starter users get email support, Professional users get priority email support, and Enterprise customers receive dedicated 24/7 phone support with a dedicated account manager.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* LOCKED PAGE OVERLAY */}
      {/* Overlay: less opaque, navbar visible */}
      <div className="fixed inset-0 z-40 flex items-center justify-center" style={{pointerEvents: 'none'}}>
        <div className="absolute inset-0 bg-blue-100" style={{opacity: 0.55, backdropFilter: 'blur(2px)'}} />
      </div>
      {/* Modal: above overlay, below navbar */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-blue-500">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">Plans & Pricing Locked</h2>
          <p className="text-gray-700 mb-4">Only the <b>Free</b> plan is available right now.<br/>Pro and Enterprise plans will be available soon.</p>
          <div className="mb-4">
            <span className="inline-block bg-blue-50 text-blue-700 rounded-full px-4 py-2 text-sm font-medium">Paid plans coming soon</span>
          </div>
          <button onClick={() => window.location.href = '/register'} className="mt-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">Start Using Free Plan</button>
        </div>
      </div>
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Start Your Free 14-Day Trial Now
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Choose the perfect plan for your social media automation needs. 
            Scale your content creation with AI-powered tools across Twitter, LinkedIn, and WordPress.
          </p>
          <div className="inline-flex items-center bg-blue-50 rounded-full px-4 py-2 text-blue-700">
            <span className="text-sm font-medium">✨ No credit card required for trial</span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl shadow-lg p-8 relative ${
                plan.popular ? 'border-2 border-blue-500 scale-105' : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">{plan.monthlyPrice}</span>
                  {plan.price !== 'Free' && plan.price !== 'Custom' && (
                    <span className="text-gray-500 ml-1">/month</span>
                  )}
                </div>
                {plan.price !== 'Free' && plan.price !== 'Custom' && (
                  <p className="text-sm text-gray-500 mt-1">Billed annually: {plan.price}</p>
                )}
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
                {plan.notIncluded.map((feature, idx) => (
                  <div key={idx} className="flex items-start opacity-50">
                    <X className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-500">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/register')}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Compare Features Across Plans</h2>
            <p className="text-xl text-gray-600">See exactly what's included in each plan</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Features</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900">Starter</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900 bg-blue-50">Professional</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-900">{feature.name}</td>
                    <td className="py-4 px-6 text-center">
                      {typeof feature.starter === 'boolean' ? (
                        feature.starter ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700">{feature.starter}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center bg-blue-50">
                      {typeof feature.professional === 'boolean' ? (
                        feature.professional ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700 font-medium">{feature.professional}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {typeof feature.enterprise === 'boolean' ? (
                        feature.enterprise ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700">{feature.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about our pricing and features</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <button
              onClick={() => navigate('/contact')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Our Support Team
            </button>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Automate Your Social Media?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of content creators and businesses already using our platform
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
          >
            Start Your Free Trial Today
          </button>
          <p className="text-blue-200 mt-4 text-sm">No credit card required • 14-day free trial</p>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PlansPage;
