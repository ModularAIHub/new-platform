import React from "react";
import {Helmet} from "react-helmet";

const PricingPage = () => (
    <>
    
    <Helmet>
       <title>Pricing – SuiteGenie Social Media Automation</title>
       <meta name="description" content="Choose between Free BYOK plan or Pro plan with credits and advanced features. Affordable social media automation for creators and teams."/>
       <meta name="keywords" content="SuiteGenie pricing, BYOK pricing, social media automation cost, Twitter automation pricing, LinkedIn automation pricing"/>
       <link rel="canonical" href="https://suitegenie.in/pricing" />
       <meta property="og:title" content="Pricing – SuiteGenie Social Media Automation" />
       <meta property="og:description" content="Choose between Free BYOK plan or Pro plan with credits and advanced features. Affordable social media automation for creators and teams." />
       <meta property="og:type" content="website" />
       <meta property="og:url" content="https://suitegenie.in/pricing" />
       <meta property="og:image" content="https://suitegenie.in/og-pricing.png" />
       <meta name="twitter:card" content="summary_large_image" />
       <meta name="twitter:title" content="Pricing – SuiteGenie Social Media Automation" />
       <meta name="twitter:description" content="Choose between Free BYOK plan or Pro plan with credits and advanced features. Affordable social media automation for creators and teams." />
       <meta name="twitter:image" content="https://suitegenie.in/og-pricing.png" />
       <script type="application/ld+json">{`
         {
           "@context": "https://schema.org",
           "@type": "Offer",
           "url": "https://suitegenie.in/pricing",
           "price": "0",
           "priceCurrency": "INR",
           "availability": "https://schema.org/InStock",
           "itemOffered": {
             "@type": "Product",
             "name": "SuiteGenie Social Media Automation Platform"
           }
         }
       `}</script>
    </Helmet>

    <div className="max-w-4xl mx-auto p-8" role="main">
      <h1 className="text-3xl font-bold mb-4">SuiteGenie Pricing – Choose Your Plan</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <a href="/features" className="text-blue-600 underline font-medium">Not sure what's included? Explore the full feature list.</a>
        <span className="text-gray-400">|</span>
        <a href="/docs" className="text-blue-600 underline font-medium">See how to get started in minutes.</a>
      </div>
      <p className="mb-6 text-gray-700">
        Choose the plan that fits your needs. Start free with BYOK or upgrade to Pro for credits, strategy tools, and team collaboration.
      </p>
      <hr className="my-8" />
      
      {/* Free Plan */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">🌱 Free Plan - $0</h2>
        <h3 className="text-lg font-semibold mb-2">All core SuiteGenie features</h3>
        <p className="mb-4 text-gray-700">Perfect for solo creators who want full-featured social media automation.</p>
        <div className="mb-2 font-semibold">What's Included:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>All core SuiteGenie features</li>
          <li>Content generation with AI (text only, no image generation)</li>
          <li>Tweet Genie for Twitter/X content posting</li>
          <li>LinkedIn posting (personal profiles)</li>
          <li>Cross-platform posting</li>
          <li>Smart scheduling with calendar view</li>
          <li>Bulk scheduling for already generated content</li>
          <li>Basic analytics and history</li>
          <li>Connect up to 3 social accounts</li>
          <li>Encrypted BYOK (OpenAI, Perplexity, Gemini)</li>
          <li>Priority support</li>
        </ul>
        <div className="mb-2 font-semibold">Credits:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li><strong>0 credits in platform mode</strong> (must use BYOK)</li>
          <li><strong>75 credits per month in BYOK mode</strong> (use your own API key)</li>
        </ul>
        <div className="mb-2 font-semibold">What you pay:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>SuiteGenie platform: <strong>₹0 / $0 per month</strong></li>
          <li>OpenAI/Perplexity/Gemini API: billed directly by provider (typically ₹300-₹1,500/month)</li>
        </ul>
        <a href="/auth" className="inline-block mt-2 text-blue-600 font-semibold underline">Start Free with BYOK →</a>
      </section>
      
      <hr className="my-8" />
      
      {/* Pro Plan */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">⚡ Pro Plan – Live Now</h2>
        <h3 className="text-lg font-semibold mb-2">Best for individual creators and small teams with multiple accounts</h3>
        <p className="mb-4 text-gray-700">Get more credits, strategy tools, team collaboration, and manage multiple accounts from one place.</p>
        <div className="mb-2 font-semibold">Everything in Free Plan, plus:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li><strong>Image generation with AI</strong></li>
          <li><strong>Bulk Content Generation</strong> (AI-powered batch content creation)</li>
          <li><strong>Content Strategy Builder</strong> for planning your content strategy</li>
          <li>Invite up to 5 team members</li>
          <li>Connect up to 8 social accounts (any mix: 2 Twitter + 3 LinkedIn, or all different platforms)</li>
          <li>Role-based access control (Owner, Admin, Editor, Viewer)</li>
          <li>Complete analytics with advanced insights</li>
          <li>Team workspace with centralized management</li>
          <li>Priority support</li>
        </ul>
        <div className="mb-2 font-semibold">Credits:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li><strong>100 credits in platform mode</strong> (no API key needed)</li>
          <li><strong>200 credits in BYOK mode</strong> (use your own API key for more credits)</li>
        </ul>
        <div className="mb-2 font-semibold">Pricing:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li><strong>₹399/month</strong> (introductory pricing)</li>
          <li>Choose between platform mode or BYOK mode</li>
          <li>All team members can use connected accounts</li>
        </ul>
        <a href="/team" className="inline-block mt-2 text-blue-600 font-semibold underline">Upgrade to Pro Plan →</a>
      </section>
      
      <hr className="my-8" />
      
      {/* Why BYOK Is Cheaper */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">💸 Why BYOK Is Cheaper Than Traditional Tools</h2>
        <p className="mb-4 text-gray-700">Most social media platforms charge a flat subscription that bundles AI, scheduling and analytics together.</p>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>With BYOK, you <strong>don't</strong> pay us for tokens or AI calls</li>
          <li>You pay OpenAI/Perplexity/Gemini directly at raw cost</li>
          <li>We focus on building the best automation and analytics layer on top</li>
        </ul>
        <div className="mb-2 font-semibold">Rough comparison:</div>
        <table className="w-full text-left border mt-4 mb-4">
          <thead>
            <tr>
              <th className="border px-2 py-1">Platform</th>
              <th className="border px-2 py-1">Monthly Platform Fee</th>
              <th className="border px-2 py-1">AI Billing Model</th>
              <th className="border px-2 py-1">Estimated Solo Cost*</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-1">Hootsuite/Buffer/Zoho Social</td>
              <td className="border px-2 py-1">₹5,000–₹20,000</td>
              <td className="border px-2 py-1">Bundled, hidden AI fees</td>
              <td className="border px-2 py-1">₹5,000+</td>
            </tr>
            <tr>
              <td className="border px-2 py-1">Other AI Social SaaS</td>
              <td className="border px-2 py-1">₹2,000–₹6,000</td>
              <td className="border px-2 py-1">Tokens + subscription</td>
              <td className="border px-2 py-1">₹2,000–₹6,000</td>
            </tr>
            <tr>
              <td className="border px-2 py-1 font-bold">SuiteGenie (Free BYOK)</td>
              <td className="border px-2 py-1 font-bold">₹0</td>
              <td className="border px-2 py-1 font-bold">Direct API billing</td>
              <td className="border px-2 py-1 font-bold">₹300–₹1,500</td>
            </tr>
            <tr>
              <td className="border px-2 py-1 font-bold">SuiteGenie (Pro)</td>
              <td className="border px-2 py-1 font-bold">₹399</td>
              <td className="border px-2 py-1 font-bold">Platform credits or BYOK</td>
              <td className="border px-2 py-1 font-bold">₹399–₹1,899</td>
            </tr>
          </tbody>
        </table>
      </section>
      
      <hr className="my-8" />
      
      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">🙋 Frequently Asked Questions</h2>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">What are credits?</h3>
          <p className="mb-4 text-gray-700">Credits are used to generate content with AI. Each post generation uses credits. In BYOK mode, you use your own API key and get more credits. In platform mode, we handle the AI for you.</p>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Is the Free plan really free?</h3>
          <p className="mb-4 text-gray-700">Yes! The platform is free. You only pay your AI provider (OpenAI/Perplexity/Gemini) directly for content generation. No hidden fees or subscriptions.</p>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">How do I get an OpenAI API key?</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-600">
            <li>Sign up at OpenAI.com</li>
            <li>Add a payment method</li>
            <li>Generate an API key and paste it into SuiteGenie settings</li>
          </ul>
          <p className="mb-4 text-gray-700">Setup takes just a few minutes. Your key is encrypted and never shared.</p>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">What's the difference between platform mode and BYOK mode?</h3>
          <p className="mb-4 text-gray-700">Platform mode: We handle the AI for you (100 credits/month in Pro). BYOK mode: You use your own API key and get more credits (75 in Free, 200 in Pro).</p>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Can I switch between Free and Pro?</h3>
          <p className="mb-4 text-gray-700">Yes! Upgrade to Pro anytime to unlock Strategy Builder, team collaboration, and more credits. Downgrade anytime without losing your data.</p>
        </div>
      </section>
      
      <hr className="my-8" />
      
      {/* Call to Action */}
      <section className="mb-10 text-center">
        <h2 className="text-2xl font-bold mb-2">🚀 Ready to Get Started?</h2>
        <ol className="list-decimal pl-6 mb-4 text-gray-600 text-left inline-block">
          <li>Create your SuiteGenie account</li>
          <li>Choose your plan (Free or Pro)</li>
          <li>Start generating and scheduling content in minutes</li>
        </ol>
        <a href="/auth" className="inline-block mt-2 text-blue-600 font-semibold underline">Create Free Account →</a>
      </section>
    </div>
  </>
);

export default PricingPage;
