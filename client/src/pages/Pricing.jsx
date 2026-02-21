import React from "react";
import { Helmet } from "react-helmet";

const PricingPage = () => (
  <>
    <Helmet>
      <title>Pricing - SuiteGenie Social Media Automation</title>
      <meta
        name="description"
        content="Choose Free or Pro for SuiteGenie. Free includes 15 platform credits and 75 BYOK credits monthly. Pro includes 100 platform credits, 200 BYOK credits, and advanced features for creators and teams."
      />
      <meta
        name="keywords"
        content="SuiteGenie pricing, BYOK pricing, social media automation cost, Twitter automation pricing, LinkedIn automation pricing"
      />
      <link rel="canonical" href="https://suitegenie.in/pricing" />
      <meta property="og:title" content="Pricing - SuiteGenie Social Media Automation" />
      <meta
        property="og:description"
        content="Choose Free or Pro for SuiteGenie with transparent credits and feature limits."
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://suitegenie.in/pricing" />
      <meta property="og:image" content="https://suitegenie.in/og-pricing.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Pricing - SuiteGenie Social Media Automation" />
      <meta
        name="twitter:description"
        content="Choose Free or Pro for SuiteGenie with transparent credits and feature limits."
      />
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
      <h1 className="text-3xl font-bold mb-4">SuiteGenie Pricing - Choose Your Plan</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <a href="/features" className="text-blue-600 underline font-medium">
          Not sure what is included? Explore the full feature list.
        </a>
        <span className="text-gray-400">|</span>
        <a href="/docs" className="text-blue-600 underline font-medium">
          See how to get started in minutes.
        </a>
      </div>
      <p className="mb-6 text-gray-700">
        Choose the plan that fits your workflow. Start free, then upgrade when you need advanced analytics,
        strategy, bulk generation, and team collaboration.
      </p>

      <hr className="my-8" />

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">Free Plan - $0</h2>
        <h3 className="text-lg font-semibold mb-2">Great for solo creators getting started</h3>
        <p className="mb-4 text-gray-700">Use core SuiteGenie features with clear limits and no subscription fee.</p>

        <div className="mb-2 font-semibold">What is included:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>All core SuiteGenie features</li>
          <li>Text-only AI generation (no image generation)</li>
          <li>Basic AI mode for everyday drafts</li>
          <li>Cross-platform posting and basic analytics</li>
          <li>Bulk scheduling for already generated content</li>
          <li>Connect up to 2 social accounts</li>
          <li>Encrypted BYOK (OpenAI, Perplexity, Gemini)</li>
          <li>Community support</li>
        </ul>

        <div className="mb-2 font-semibold">Credits per month:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>
            <strong>15 credits in platform mode</strong>
          </li>
          <li>
            <strong>75 credits in BYOK mode</strong>
          </li>
        </ul>

        <div className="mb-2 font-semibold">What you pay:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>
            SuiteGenie platform: <strong>&#8377;0 / $0 per month</strong>
          </li>
          <li>BYOK usage: billed directly by your AI provider</li>
        </ul>

        <a href="/auth" className="inline-block mt-2 text-blue-600 font-semibold underline">
          Start Free
        </a>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">Pro Plan - Live Now</h2>
        <h3 className="text-lg font-semibold mb-2">Best for creators and small teams</h3>
        <p className="mb-4 text-gray-700">
          Unlock premium capabilities for stronger content quality, collaboration, and execution speed.
        </p>

        <div className="mb-2 font-semibold">Everything in Free, plus:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Upgraded AI</li>
          <li>Image generation with AI</li>
          <li>Bulk Content Generation (AI-powered)</li>
          <li>Content Strategy Builder</li>
          <li>Team collaboration with up to 5 members</li>
          <li>Connect up to 8 social accounts</li>
          <li>Role-based access control</li>
          <li>Advanced analytics and insights</li>
          <li>Priority email support</li>
        </ul>

        <div className="mb-2 font-semibold">Credits per month:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>
            <strong>100 credits in platform mode</strong>
          </li>
          <li>
            <strong>200 credits in BYOK mode</strong>
          </li>
        </ul>

        <div className="mb-2 font-semibold">Pricing:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>
            <strong>&#8377;399/month</strong>
          </li>
          <li>Secure checkout via Razorpay</li>
          <li>Upgrade instantly from your account</li>
        </ul>

        <a href="/plans?intent=pro" className="inline-block mt-2 text-blue-600 font-semibold underline">
          Upgrade to Pro
        </a>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">Why BYOK can reduce cost</h2>
        <p className="mb-4 text-gray-700">
          With BYOK, you pay your AI provider directly and keep control of model usage and spend.
        </p>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>No bundled token markup from SuiteGenie</li>
          <li>Direct provider billing (OpenAI, Gemini, Perplexity)</li>
          <li>Useful if you already manage AI spend centrally</li>
        </ul>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">Frequently Asked Questions</h2>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">What are credits?</h3>
          <p className="mb-4 text-gray-700">
            Credits are consumed when generating AI content. BYOK mode uses your own API keys but still follows
            plan-specific monthly credit limits.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Is the Free plan really free?</h3>
          <p className="mb-4 text-gray-700">
            Yes. Free has no subscription fee. If you use BYOK, your provider bills your token usage directly.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">What is the difference between platform mode and BYOK?</h3>
          <p className="mb-4 text-gray-700">
            Platform mode uses SuiteGenie-managed providers. BYOK mode uses your own provider keys. Monthly limits are:
            Free (15 platform, 75 BYOK) and Pro (100 platform, 200 BYOK).
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Can I switch between Free and Pro?</h3>
          <p className="mb-4 text-gray-700">
            Yes. You can upgrade anytime to unlock advanced features and downgrade later if needed.
          </p>
        </div>
      </section>

      <hr className="my-8" />

      <section className="mb-10 text-center">
        <h2 className="text-2xl font-bold mb-2">Ready to get started?</h2>
        <ol className="list-decimal pl-6 mb-4 text-gray-600 text-left inline-block">
          <li>Create your SuiteGenie account</li>
          <li>Choose Free or Pro</li>
          <li>Start generating and scheduling content</li>
        </ol>
        <a href="/auth" className="inline-block mt-2 text-blue-600 font-semibold underline">
          Create Free Account
        </a>
      </section>
    </div>
  </>
);

export default PricingPage;
