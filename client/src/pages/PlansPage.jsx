import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import usePlanAccess from '../hooks/usePlanAccess';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { loadRazorpayScript } from '../utils/payment';
import PublicSeo from '../components/PublicSeo';

const PlansPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const { userPlan, refreshPlanInfo } = usePlanAccess();
  const [openFaq, setOpenFaq] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const pendingIntent = searchParams.get('intent');
  const currentIndividualPlanType = String(
    userPlan?.individualPlan ||
    user?.planType ||
    user?.plan_type ||
    'free'
  ).toLowerCase();

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const plans = [
    {
      name: 'Free',
      price: 'Free',
      monthlyPrice: '$0',
      description: 'Perfect for solo creators',
      features: [
        'All core SuiteGenie features',
        'Content generation with AI (text only, no image generation)',
        'Basic AI mode (good for everyday drafts)',
        'Basic analytics & scheduling',
        'Cross-platform posting',
        'Bulk scheduling for already generated content',
        'Connection of Tweet Genie and LinkedIn Genie',
        'Encrypted BYOK (OpenAI, Perplexity, Gemini)',
        'Community support',
        '50 credits per month (BYOK mode)',
        '15 credits per month (platform mode)',
      ],
      notIncluded: [],
      buttonText: 'Start Free',
      popular: false
    },
    {
      name: 'Pro',
      price: 'Rs 399',
      monthlyPrice: 'Rs 399',
      description: 'Best for individual creators and small teams with multiple accounts',
      features: [
        'Everything in Free',
        'Upgraded AI',
        'Image generation with AI',
        'Bulk Content Generation (AI-powered)',
        'Content Strategy Builder',
        'Teams mode: collaborate with up to 5 members',
        'Connect up to 8 social accounts (any mix: Twitter, LinkedIn, etc.)',
        'Role-based access control (Owner, Admin, Editor, Viewer)',
        'Complete analytics with advanced insights',
        '100 credits in platform mode',
        '180 credits in BYOK mode',
        'Priority support',
      ],
      notIncluded: [],
      buttonText: 'Upgrade to Pro',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      monthlyPrice: 'Contact Us',
      description: 'For large teams and agencies',
      features: [
        'Everything in Pro',
        'Unlimited team members',
        'Custom credit limits',
        'Dedicated account manager',
        'Priority support & onboarding',
        'Custom integrations',
        'Advanced security features',
      ],
      notIncluded: [],
      buttonText: 'Contact Sales',
      popular: false
    }
  ];

  const comparisonFeatures = [
    { name: 'AI Quality Mode', free: 'Basic AI', pro: 'Upgraded AI' },
    { name: 'Monthly Credits (Platform)', free: '15', pro: '100' },
    { name: 'Monthly Credits (BYOK)', free: '50', pro: '180' },
    { name: 'Social Accounts', free: '2 (Tweet + LinkedIn)', pro: '8 (any mix)' },
    { name: 'Analytics', free: 'Basic', pro: 'Complete' },
    { name: 'Image Generation', free: false, pro: true },
    { name: 'Bulk Content Generation (AI)', free: false, pro: true },
    { name: 'Bulk Scheduling', free: 'Already generated', pro: 'Already generated' },
    { name: 'Content Strategy Builder', free: false, pro: true },
    { name: 'Teams Mode (Collaboration)', free: false, pro: true },
    { name: 'Team Members', free: '0', pro: '5' },
    { name: 'Priority Support', free: false, pro: true },
    { name: 'All Core Features', free: true, pro: true },
  ];

  const faqs = [
    {
      question: 'How do I upgrade to Pro?',
      answer: 'Click \'Upgrade to Pro\', complete the secure Razorpay checkout, and your account will be upgraded for Rs 399/month.'
    },
    {
      question: 'Can I change plans at any time?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
    },
    {
      question: 'What social platforms do you support?',
      answer: 'We currently support Twitter, LinkedIn, and WordPress with more platforms coming soon. Both Free and Pro plans include access to all supported platforms.'
    },
    {
      question: 'Is there a setup fee or contract?',
      answer: 'No setup fees and no long-term contracts required. You can cancel anytime with just a few clicks from your account settings.'
    },
    {
      question: 'How does the AI content generation work?',
      answer: 'Our AI analyzes your brand voice, industry trends, and engagement patterns to create personalized content that resonates with your audience across all platforms.'
    },
    /* {
      question: 'Can I get a refund if I\'m not satisfied?',
      answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not completely satisfied, contact our support team for a full refund.'
    }, */

    {
      question: 'What kind of support do you provide?',
      answer: 'Free users get community support. Pro users get priority email support to help you move faster.'
    },
    {
      question: 'Where do I manage my team after upgrading to Pro?',
      answer: 'After upgrading to Pro, you can visit the /team page on your dashboard to create or manage your team. You\'ll be able to invite members, manage social accounts, and collaborate with your team on content creation.'
    }
  ];

  const handleProUpgrade = async () => {
    const latestPlan = await refreshPlanInfo();
    const authoritativePlanType = String(
      latestPlan?.individualPlan ||
      latestPlan?.type ||
      userPlan?.individualPlan ||
      userPlan?.type ||
      user?.planType ||
      user?.plan_type ||
      'free'
    ).toLowerCase();

    if (authoritativePlanType === 'pro') {
      toast.success('You are already a Pro user!');
      return;
    }

    if (authoritativePlanType === 'enterprise') {
      toast.success('You are already on Enterprise.');
      return;
    }

    setUpgrading(true);

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error('Failed to load payment gateway. Please try again.');
        return;
      }

      const orderResponse = await api.post('/payments/create-order', {
        type: 'plan',
        package: 'pro',
      });

      const { orderId, amount, currency, description, demo } = orderResponse.data;

      if (demo) {
        const confirmDemo = window.confirm(
          'DEMO MODE: This is a simulated Pro upgrade payment. Continue?'
        );

        if (!confirmDemo) {
          return;
        }

        const verifyResponse = await api.post('/payments/verify', {
          razorpayOrderId: orderId,
          razorpayPaymentId: 'demo_payment_id',
          razorpaySignature: 'demo_signature',
        });

        await refreshUser();
        toast.success(verifyResponse.data?.message || 'Pro plan activated successfully.');
        navigate('/team');
        return;
      }

      const razorpayKey = orderResponse.data.razorpayKey || import.meta.env.VITE_RAZORPAY_KEY_ID || '';
      if (!razorpayKey) {
        toast.error('Payment configuration is incomplete. Please contact support.');
        return;
      }

      if (!window.Razorpay) {
        toast.error('Payment gateway failed to initialize. Please refresh and try again.');
        return;
      }

      await new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: razorpayKey,
          amount,
          currency,
          name: 'SuiteGenie',
          description,
          order_id: orderId,
          handler: async (response) => {
            try {
              const verifyResponse = await api.post('/payments/verify', {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              await refreshUser();
              toast.success(verifyResponse.data?.message || 'Pro plan activated successfully.');
              resolve(verifyResponse.data);
            } catch (verificationError) {
              reject(verificationError);
            }
          },
          prefill: {
            name: user?.name || 'SuiteGenie User',
            email: user?.email || undefined,
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: () => {
              reject(new Error('CHECKOUT_DISMISSED'));
            },
          },
        });

        razorpay.on('payment.failed', (failure) => {
          const reason = failure?.error?.description || 'Payment failed. Please try again.';
          reject(new Error(reason));
        });

        razorpay.open();
      });

      navigate('/team');
    } catch (error) {
      if (error?.message === 'CHECKOUT_DISMISSED') {
        toast.error('Payment was cancelled.');
      } else {
        toast.error(error?.response?.data?.error || error?.message || 'Failed to upgrade to Pro.');
      }
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <PublicSeo
        title="SuiteGenie Plans and Pricing | Free, Pro, and Enterprise"
        description="Compare SuiteGenie Free, Pro, and Enterprise plans for AI social media automation, BYOK, team collaboration, analytics, bulk generation, and scheduling."
        canonicalPath="/plans"
        keywords="SuiteGenie pricing, SuiteGenie plans, social media automation pricing, BYOK pricing, AI content scheduling plans"
        schema={[
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'SuiteGenie',
            description:
              'AI social media automation platform for creators, founders, and teams.',
            brand: {
              '@type': 'Brand',
              name: 'SuiteGenie',
            },
            offers: [
              {
                '@type': 'Offer',
                name: 'SuiteGenie Free',
                price: '0',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                url: 'https://suitegenie.in/plans',
              },
              {
                '@type': 'Offer',
                name: 'SuiteGenie Pro',
                price: '399',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                url: 'https://suitegenie.in/plans',
              },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          },
        ]}
      />

      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Choose the perfect plan for your social media automation needs. 
            Scale your content creation with AI-powered tools across Twitter, LinkedIn, and WordPress.
          </p>
          {/* <div className="inline-flex items-center bg-blue-50 rounded-full px-4 py-2 text-blue-700">
            <span className="text-sm font-medium">No credit card required for trial</span>
          </div> */}
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
                onClick={async () => {
                  // If not logged in, redirect to register with plan parameter
                  if (!user) {
                    if (plan.name === 'Pro') {
                      navigate('/register?plan=pro');
                    } else if (plan.name === 'Enterprise') {
                      navigate('/contact');
                    } else {
                      navigate('/register');
                    }
                    return;
                  }
                  
                  // If Enterprise, redirect to contact
                  if (plan.name === 'Enterprise') {
                    navigate('/contact');
                    return;
                  }
                  
                  // If user is logged in and clicking Pro plan, upgrade
                  if (plan.name === 'Pro') {
                    await handleProUpgrade();
                    return;
                  }
                }}
                disabled={upgrading}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } ${upgrading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {upgrading
                  ? 'Processing...'
                  : (plan.name === 'Pro' && currentIndividualPlanType === 'pro'
                      ? 'Current Plan - Active'
                      : (plan.name === 'Pro' && currentIndividualPlanType === 'enterprise'
                          ? 'Already on Enterprise'
                          : (plan.name === 'Pro' && pendingIntent === 'pro'
                              ? 'Upgrade to Pro (Recommended)'
                              : plan.buttonText)))}
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
                  <th className="text-center py-4 px-6 font-medium text-gray-900">Free</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900 bg-blue-50">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-900">{feature.name}</td>
                    <td className="py-4 px-6 text-center">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700">{feature.free}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center bg-blue-50">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-700 font-medium">{feature.pro}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Team Collaboration Feature Section */}
      <div className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Team Collaboration</h2>
            <p className="text-xl text-gray-600">Bring your team together and collaborate on content</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">01</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Invite Members</h3>
              <p className="text-gray-600">Invite up to 5 team members to collaborate on your social media strategy. Assign roles based on permissions.</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">02</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Shared Accounts</h3>
              <p className="text-gray-600">Connect and share up to 8 social media accounts with your team. Everyone can create content together.</p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">03</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Analytics</h3>
              <p className="text-gray-600">View performance metrics across all team accounts. Track engagement and optimize together.</p>
            </div>
          </div>

          <div className="mt-12 bg-white rounded-lg p-8 border-2 border-blue-500">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Get Started with Your Team</h3>
            <p className="text-gray-600 text-center mb-6">
              After upgrading to Pro, you'll be able to visit the <span className="font-semibold text-blue-600">/team</span> dashboard where you can create a team, invite members, and start collaborating.
            </p>
            <div className="text-center">
              <button
                onClick={() => navigate('/plans')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Upgrade to Pro
              </button>
            </div>
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
            Get Started Today
          </button>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PlansPage;
