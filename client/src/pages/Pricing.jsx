import React from "react";
import {Helmet} from "react-helmet";

const PricingPage = () => (
    <>
    
    <Helmet>
       <title>Pricing – SuiteGenie Social Media Automation</title>
       <meta name="description" content="SuiteGenie is free to use with your own OpenAI API key (BYOK). Pay only for API usage instead of ₹5,000+ per month for legacy social media tools."/>
       <meta name="keywords" content="SuiteGenie pricing, BYOK pricing, social media automation cost, Twitter automation pricing, LinkedIn automation pricing"/>
       <link rel="canonical" href="https://suitegenie.in/pricing" />
       {/* Open Graph & Twitter */}
       <meta property="og:title" content="Pricing – SuiteGenie Social Media Automation" />
       <meta property="og:description" content="SuiteGenie is free to use with your own OpenAI API key (BYOK). Pay only for API usage instead of ₹5,000+ per month for legacy social media tools." />
       <meta property="og:type" content="website" />
       <meta property="og:url" content="https://suitegenie.in/pricing" />
       <meta property="og:image" content="https://suitegenie.in/og-pricing.png" />
       <meta name="twitter:card" content="summary_large_image" />
       <meta name="twitter:title" content="Pricing – SuiteGenie Social Media Automation" />
       <meta name="twitter:description" content="SuiteGenie is free to use with your own OpenAI API key (BYOK). Pay only for API usage instead of ₹5,000+ per month for legacy social media tools." />
       <meta name="twitter:image" content="https://suitegenie.in/og-pricing.png" />
       {/* Structured Data: Offer */}
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

    <div className="max-w-3xl mx-auto p-8" role="main">
      <h1 className="text-3xl font-bold mb-4">SuiteGenie Pricing – Affordable AI Social Media Automation with BYOK</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <a href="/features" className="text-blue-600 underline font-medium">Not sure what’s included? Explore the full feature list.</a>
        <span className="text-gray-400">|</span>
        <a href="/docs" className="text-blue-600 underline font-medium">See how to get started in minutes.</a>
      </div>
      <p className="mb-6 text-gray-700">
        SuiteGenie is built so solo founders, creators and small teams can automate Twitter and LinkedIn without paying enterprise tool prices. Use the platform free and bring your own OpenAI API key (BYOK), or join the upcoming Pro Plan for teams.
      </p>
      <hr className="my-8" />
      {/* BYOK Solo Plan */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">🌱 BYOK Solo Plan – Live Today</h2>
        <h3 className="text-lg font-semibold mb-2">Free platform + your OpenAI API usage</h3>
        <p className="mb-4 text-gray-700">If you’re a solo founder, indie hacker or creator, this is all you need right now.</p>
        <div className="mb-2 font-semibold">You get the full SuiteGenie product:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Tweet Genie for Twitter/X content and scheduling</li>
          <li>LinkedIn posting and scheduling</li>
          <li>Content and image generation with AI</li>
          <li>Engagement analytics and history</li>
          <li>Bulk scheduling and content calendar</li>
          <li>Access to new features as we ship them</li>
        </ul>
        <div className="mb-2 font-semibold">What you pay for:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>SuiteGenie platform: <strong>₹0 / $0 per month</strong></li>
          <li>OpenAI usage: billed directly by OpenAI based on how much you generate</li>
        </ul>
        <div className="mb-2 font-semibold">Typical usage costs:</div>
        <p className="mb-4 text-gray-700">SuiteGenie is dramatically more affordable than traditional social tools, which often charge ₹5,000–₹20,000 per month for AI + scheduling bundles.</p>
        <a href="/auth" className="inline-block mt-2 text-blue-600 font-semibold underline">Start Free with BYOK →</a>
      </section>
      <hr className="my-8" />
      {/* Pro Plan */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">👥 SuiteGenie Pro Plan – Coming Soon</h2>
        <h3 className="text-lg font-semibold mb-2">Built for teams and agencies</h3>
        <p className="mb-4 text-gray-700">We’re actively building SuiteGenie Pro, designed for teams who need collaboration, multiple social accounts and shared analytics.</p>
        <div className="mb-2 font-semibold">Planned highlights:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Team collaboration and shared workspace</li>
          <li>Role-based access control (Admin, Editor, Viewer)</li>
          <li>Connect and manage multiple social profiles</li>
          <li>Shared content calendar across all clients</li>
          <li>Centralized analytics dashboard for all accounts</li>
        </ul>
        <div className="mb-2 font-semibold">Planned pricing (subject to final launch):</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li><strong>₹499/month per team</strong> (introductory pricing)</li>
          <li>Flexible user and account management</li>
          <li>BYOK or “platform keys” option for teams that don’t want to manage OpenAI billing themselves</li>
        </ul>
        <a href="/pro-waitlist" className="inline-block mt-2 text-blue-600 font-semibold underline">Join Pro Plan Waitlist →</a>
      </section>
      <hr className="my-8" />
      {/* Why BYOK Is Cheaper */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">💸 Why BYOK Is Cheaper Than Traditional Tools</h2>
        <p className="mb-4 text-gray-700">Most social media platforms charge a flat subscription that bundles AI, scheduling and analytics together.</p>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>You <strong>don’t</strong> pay us for tokens or AI calls.</li>
          <li>You pay OpenAI directly at raw cost.</li>
          <li>We focus on building the best automation and analytics layer on top.</li>
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
              <td className="border px-2 py-1 font-bold">SuiteGenie (BYOK)</td>
              <td className="border px-2 py-1 font-bold">₹0</td>
              <td className="border px-2 py-1 font-bold">Direct OpenAI billing (your key)</td>
              <td className="border px-2 py-1 font-bold">₹300–₹2,500 approx.</td>
            </tr>
          </tbody>
        </table>
        {/* OpenAI usage is billed directly by OpenAI. */}
      </section>
      <hr className="my-8" />
      {/* Example: What You’d Actually Pay */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">🧮 Example: What You’d Actually Pay</h2>
        <p className="mb-4 text-gray-700">Your OpenAI usage cost depends on how much content you generate, but SuiteGenie itself remains free. If you pause your content, your OpenAI cost drops close to zero. There is no fixed platform subscription to “waste.”</p>
      </section>
      <hr className="my-8" />
      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">🙋 Frequently Asked Questions</h2>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Is SuiteGenie really free?</h3>
          <p className="mb-4 text-gray-700">Yes! The platform is free for solo users. You only pay OpenAI for the content you generate, billed directly to your own API key. No hidden fees or subscriptions.</p>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">How do I get an OpenAI API key?</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-600">
            <li>Sign up at OpenAI.com</li>
            <li>Add a payment method</li>
            <li>Generate an API key and paste it into SuiteGenie settings</li>
          </ul>
          <p className="mb-4 text-gray-700">Setup takes just a few minutes. We never see or store your key.</p>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Is there a free trial?</h3>
          <p className="mb-4 text-gray-700">You don’t need one. SuiteGenie is free to use; you only pay OpenAI for what you generate. Start small and scale as you see results.</p>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Will pricing change later?</h3>
          <p className="mb-4 text-gray-700">We may add optional paid plans for teams or managed keys in the future, but solo BYOK will remain free and affordable for indie builders and small teams.</p>
          <p className="mb-4 text-gray-700">Early users keep access to our most generous terms as we evolve.</p>
        </div>
      </section>
      <hr className="my-8" />
      {/* Call to Action */}
      <section className="mb-10 text-center">
        <h2 className="text-2xl font-bold mb-2">🚀 Ready to Try SuiteGenie?</h2>
        <ol className="list-decimal pl-6 mb-4 text-gray-600 text-left inline-block">
          <li>Create your SuiteGenie account</li>
          <li>Add your OpenAI API key</li>
          <li>Generate and schedule your first week of posts in under 30 minutes</li>
        </ol>
        <a href="/auth" className="inline-block mt-2 text-blue-600 font-semibold underline">Create Free Account →</a>
      </section>
    </div>
  </>
);

export default PricingPage;
