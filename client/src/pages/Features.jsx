import React from "react";
import { Helmet } from "react-helmet";

const Features = () => (
  <>
    <Helmet>
      <title>Features – AI Social Media Automation | SuiteGenie</title>
      <meta name="description" content="Automate Twitter & LinkedIn with AI. Bulk scheduling, engagement analytics, image generation, and BYOK. Save up to 80% using your own OpenAI, Perplexity, or Gemini API key. All keys and tokens are fully encrypted for your safety. SuiteGenie is the modern, affordable social media automation platform for founders and teams." />
      <meta name="keywords" content="social media automation, AI tweet generator, LinkedIn automation, BYOK, bulk scheduling, engagement analytics, SuiteGenie features" />
      <link rel="canonical" href="https://suitegenie.in/features" />
      {/* Open Graph / Facebook */}
      <meta property="og:title" content="Features – AI Social Media Automation | SuiteGenie" />
      <meta property="og:description" content="Automate Twitter & LinkedIn with AI. Bulk scheduling, engagement analytics, image generation, and BYOK. Save up to 80% using your own OpenAI, Perplexity, or Gemini API key. All keys and tokens are fully encrypted for your safety." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://suitegenie.in/features" />
      <meta property="og:image" content="https://suitegenie.in/og-features.png" />
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Features – AI Social Media Automation | SuiteGenie" />
      <meta name="twitter:description" content="Automate Twitter & LinkedIn with AI. Bulk scheduling, engagement analytics, image generation, and BYOK. Save up to 80% using your own OpenAI, Perplexity, or Gemini API key. All keys and tokens are fully encrypted for your safety." />
      <meta name="twitter:image" content="https://suitegenie.in/og-features.png" />
      {/* Structured Data: Product */}
      <script type="application/ld+json">{`
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "SuiteGenie Features",
          "image": "https://suitegenie.in/og-features.png",
          "description": "AI-powered social media automation features for Twitter and LinkedIn. Bulk scheduling, analytics, BYOK, and more.",
          "brand": {
            "@type": "Brand",
            "name": "SuiteGenie"
          },
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR",
            "availability": "https://schema.org/InStock"
          }
        }
      `}</script>
    </Helmet>
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 text-base text-gray-800" role="main">
      <h1 className="text-4xl font-extrabold mb-4 text-primary-700">AI-Powered Social Media Automation Features for Twitter and LinkedIn</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <a href="/pricing" className="text-blue-600 underline font-medium">Ready to start? Check our pricing.</a>
        <span className="text-gray-400">|</span>
        <a href="/docs" className="text-blue-600 underline font-medium">Need help setting things up? Read the docs.</a>
      </div>
      <p className="mb-8 text-lg text-gray-700 leading-relaxed">
        SuiteGenie is the AI-first social media management platform built for founders, creators, and marketers who care about performance and pricing. <span className="font-semibold text-primary-600">Bring your own OpenAI, Perplexity, or Gemini API key (BYOK)</span>, all keys and tokens are fully encrypted and never shared. Generate content in seconds, and schedule posts for Twitter and LinkedIn from one clean dashboard.
      </p>
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-100 rounded-xl p-4 mb-8 shadow-sm">
        <span className="block text-primary-700 font-semibold text-lg">Save up to 80% on social media automation costs with SuiteGenie’s BYOK model.</span>
      </div>
      <hr className="my-10" />

      {/* Content & Image Generation */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">⚡ Content & Image Generation</h2>
        <h3 className="text-lg font-semibold mb-2">Create Scroll-Stopping Content in Seconds</h3>
        <p className="mb-4 text-gray-700">Generate engaging posts and stunning visuals for Twitter and LinkedIn without staring at a blank screen.</p>
        <div className="mb-2 font-semibold">What You Can Create:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Viral tweets and threads tailored to your niche</li>
          <li>Professional LinkedIn posts for personal brands and company pages</li>
          <li>Hooks, carousels and list-style posts that drive saves and comments</li>
          <li>Simple image concepts to support your copy (cover images, quote tiles, etc.)</li>
        </ul>
        <div className="mb-2 font-semibold">AI-Powered Controls:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Choose tone: professional, casual, humorous or educational</li>
          <li>Ask for multiple variations in one click</li>
          <li>Auto-respect platform limits (tweet character limits, LinkedIn length sweet spot)</li>
          <li>Smart hashtag and emoji suggestions for more reach</li>
        </ul>
        <a href="/signup" className="inline-block mt-2 text-blue-600 font-semibold underline">Start Creating Content Free →</a>
      </section>

      <hr className="my-8" />

      {/* Engagement Analytics */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">📊 Engagement Analytics</h2>
        <h3 className="text-lg font-semibold mb-2">Track What Works, Do More of It</h3>
        <p className="mb-4 text-gray-700">See how every tweet and LinkedIn post performs so you can double down on what actually grows your accounts.</p>
        <div className="mb-2 font-semibold">Metrics You Can Monitor:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Impressions and reach</li>
          <li>Likes, comments, reposts/shares</li>
          <li>Click-throughs to your site or landing page</li>
          <li>Engagement rate across time periods</li>
        </ul>
        <div className="mb-2 font-semibold">Insightful Dashboards:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Filter by platform, date range or campaign</li>
          <li>Identify your top-performing formats and topics</li>
          <li>Spot the days and times that consistently perform best</li>
          <li>Export data to share results with co-founders or clients</li>
        </ul>
        <a href="/signup" className="inline-block mt-2 text-blue-600 font-semibold underline">See Your Best-Performing Posts →</a>
      </section>

      <hr className="my-8" />

      {/* BYOK */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">🔑 BYOK (Bring Your Own Keys)</h2>
        <h3 className="text-lg font-semibold mb-2">Keep Control, Cut Tool Costs</h3>
        <p className="mb-4 text-gray-700">Traditional social media tools bundle in AI and charge steep monthly fees. With SuiteGenie’s BYOK model, you can plug in your own <strong>OpenAI, Perplexity, or Gemini API key</strong>—all keys and tokens are fully encrypted and only used for your content generation. You pay the provider directly at raw cost, often 70–80% cheaper than “AI included” plans.</p>
          <p className="mb-4 text-gray-700">Traditional social media tools bundle in AI and charge steep monthly fees. With SuiteGenie’s BYOK model, you can plug in your own <strong>OpenAI, Perplexity, or Gemini API key</strong>, all keys and tokens are fully encrypted and only used for your content generation. You pay the provider directly at raw cost, often 70–80% cheaper than “AI included” plans.</p>
        <div className="mb-2 font-semibold">Why BYOK Is a Game-Changer:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>No hidden AI markups or usage padding</li>
          <li>Full transparency on how much content really costs</li>
          <li>Access to the latest OpenAI models as soon as they’re released</li>
          <li>Your key, your limits, your billing – we just provide the layer on top</li>
        </ul>
        <div className="mb-2 font-semibold">How It Works (In Minutes):</div>
        <ol className="list-decimal pl-6 mb-4 text-gray-600">
          <li>Create an OpenAI, Perplexity, or Gemini account and generate an API key.</li>
          <li>Paste it once into SuiteGenie settings. Your key is fully encrypted and never shared.</li>
          <li>Start generating and scheduling content instantly.</li>
        </ol>
        <p className="mb-4 text-gray-700">Typical founders and creators stay around <strong>5–15 USD/month in API usage</strong>, instead of 99–249 USD/month with traditional suites.</p>
        <a href="#" className="inline-block mt-2 text-blue-600 font-semibold underline">Learn How BYOK Saves You Money →</a>
      </section>

      <hr className="my-8" />

      {/* Bulk Scheduling */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">📅 Bulk Scheduling</h2>
        <h3 className="text-lg font-semibold mb-2">Turn One Work Session Into a Full Week of Content</h3>
        <p className="mb-4 text-gray-700">Plan and schedule dozens of posts at once so you can get off the hamster wheel of daily posting.</p>
        <div className="mb-2 font-semibold">Bulk Scheduling Superpowers:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Generate batches of tweets and LinkedIn posts in one go</li>
          <li>Schedule everything across days or weeks in a single flow</li>
          <li>Drag-and-drop posts on a visual calendar to adjust timing</li>
          <li>Avoid overlap and accidental spamming with spacing rules</li>
        </ul>
        <div className="mb-2 font-semibold">Smart Timing:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Suggests posting windows when engagement tends to be highest</li>
          <li>Handles time zones so global audiences still see you at the right time</li>
          <li>Supports both “fill my calendar” mode and precise, manual scheduling</li>
        </ul>
        <a href="/signup" className="inline-block mt-2 text-blue-600 font-semibold underline">Plan Your Week in Minutes →</a>
      </section>

      <hr className="my-8" />

      {/* AI-Powered, Built for Social */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">🎨 AI-Powered, Built for Social</h2>
        <p className="mb-4 text-gray-700">Suite Genie is designed specifically around social media workflows, not generic text editing. Prompts, templates and outputs are optimized for how people actually consume feeds on Twitter and LinkedIn.</p>
        <div className="mb-2 font-semibold">You Get:</div>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Templates tuned for hooks, stories, list posts and threads</li>
          <li>Suggestions based on what’s currently performing in your niche</li>
          <li>Guardrails to keep posts concise, clear and on-brand</li>
        </ul>
      </section>

      <hr className="my-8" />

      {/* One Dashboard for Twitter & LinkedIn */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">🌐 One Dashboard for Twitter & LinkedIn</h2>
        <p className="mb-4 text-gray-700">Manage your core growth channels from a single place instead of juggling multiple tools.</p>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Connect Twitter/X via OAuth in a few clicks</li>
          <li>Connect LinkedIn for personal profiles and business pages</li>
          <li>See all scheduled posts together in one calendar view</li>
        </ul>
        <p className="mb-4 text-gray-700">Future channels (like WordPress, Instagram, etc.) can plug into the same layout later without changing how you work.</p>
      </section>

      <hr className="my-8" />

      {/* Secure & Reliable by Design */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">🔐 Secure & Reliable by Design</h2>
        <p className="mb-4 text-gray-700">Your social accounts and API keys are handled with care.</p>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>OAuth-based connections for Twitter and LinkedIn</li>
          <li>Encrypted storage for all your API keys and tokens (OpenAI, Perplexity, Gemini, etc.)</li>
          <li>All tokens and keys are encrypted at rest and in transit—your data is never exposed</li>
            <li>All tokens and keys are encrypted at rest and in transit, your data is never exposed</li>
          <li>HTTPS everywhere and modern infrastructure practices</li>
        </ul>
        <p className="mb-4 text-gray-700">You can revoke access or rotate keys any time from your own dashboards.</p>
      </section>

      <hr className="my-8" />

      {/* Call to Action */}
      <section className="mb-10 text-center">
        <h2 className="text-2xl font-bold mb-2">🚀 Ready to See Suite Genie in Action?</h2>
        <ol className="list-decimal pl-6 mb-4 text-gray-600 text-left inline-block">
          <li>Sign up in under a minute.</li>
          <li>Add your OpenAI key once.</li>
          <li>Generate, schedule and analyze your content from one place.</li>
        </ol>
        <a href="/signup" className="inline-block mt-2 text-blue-600 font-semibold underline">Start Free – No Credit Card Needed →</a>
      </section>
    </div>
  </>
);

export default Features;