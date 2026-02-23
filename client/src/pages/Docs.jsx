import React from "react";
import { Helmet } from "react-helmet";

const DocsPage = () => (
  <>
    <Helmet>
      <title>Help & Documentation – SuiteGenie</title>
      <meta name="description" content="Learn how to set up SuiteGenie, connect Twitter and LinkedIn, add your AI API key (BYOK), and start generating and scheduling social content in minutes." />
      <link rel="canonical" href="https://suitegenie.in/docs" />
      <meta property="og:title" content="Help & Documentation – SuiteGenie" />
      <meta property="og:description" content="Learn how to set up SuiteGenie, connect Twitter and LinkedIn, add your AI API key (BYOK), and start generating and scheduling social content in minutes." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://suitegenie.in/docs" />
      <meta property="og:image" content="https://suitegenie.in/og-docs.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Help & Documentation – SuiteGenie" />
      <meta name="twitter:description" content="Learn how to set up SuiteGenie, connect Twitter and LinkedIn, add your AI API key (BYOK), and start generating and scheduling social content in minutes." />
      <meta name="twitter:image" content="https://suitegenie.in/og-docs.png" />
      {/* Structured Data: FAQPage */}
      <script type="application/ld+json">{`
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How do I set up SuiteGenie?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Sign up, connect your socials, and add your AI API key (BYOK) in Settings."
              }
            },
            {
              "@type": "Question",
              "name": "Is SuiteGenie free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, SuiteGenie is free to use with your own AI API key."
              }
            }
          ]
        }
      `}</script>
    </Helmet>
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 text-base text-gray-800" role="main">
      <h1 className="text-4xl font-extrabold mb-4 text-primary-700">SuiteGenie Help &amp; Documentation</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <a href="/features" className="text-blue-600 underline font-medium">Learn what SuiteGenie can do.</a>
        <span className="text-gray-400">|</span>
        <a href="/pricing" className="text-blue-600 underline font-medium">Choose a plan that fits you.</a>
      </div>
      <p className="mb-8 text-lg text-gray-700 leading-relaxed">This guide walks you through setting up SuiteGenie, connecting Twitter and LinkedIn, adding your AI API key (BYOK), and creating your first scheduled posts.</p>
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-100 rounded-xl p-4 mb-10 shadow-sm">
        <span className="block text-primary-700 font-semibold text-lg">Start here for step-by-step instructions, troubleshooting, and best practices.</span>
      </div>
      <hr className="my-10" />
      <h2 id="1-getting-started" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">1. Getting Started</h2>
      <h3 className="text-lg font-semibold mb-2">1.1 Create Your SuiteGenie Account</h3>
      <ol className="list-decimal pl-6 mb-4">
        <li>Go to <strong>suitegenie.in</strong> and click <strong>Get Started</strong> or <strong>Dashboard</strong>.</li>
        <li>Sign up with your email and password (or your preferred auth method).</li>
        <li>Confirm your email if we ask for verification.</li>
      </ol>
      <p className="mb-6">After signup you'll land in the dashboard, where you can connect socials and add your API key.</p>
      <h3 id="1-2-get-your-ai-api-key-byok" className="text-lg font-semibold mb-2 scroll-mt-24 text-primary-600">1.2 Get Your AI API Key (BYOK)</h3>
      <p className="mb-4">SuiteGenie supports multiple AI providers in BYOK (Bring Your Own Key) mode:</p>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>OpenAI</strong>: Visit <strong>platform.openai.com</strong>, go to API keys, create a new secret key (starts with <code>sk-…</code>)</li>
        <li><strong>Perplexity</strong>: Visit <strong>perplexity.ai</strong>, get your API key from the developer section</li>
        <li><strong>Gemini</strong>: Visit <strong>ai.google.dev</strong>, create an API key for Gemini</li>
      </ul>
      <p className="mb-4">Store your key somewhere safe – most providers only show it once. Optionally set a monthly usage limit in your provider's billing settings.</p>
      <h3 className="text-lg font-semibold mb-2">1.3 Add Your API Key to SuiteGenie</h3>
      <ol className="list-decimal pl-6 mb-4">
        <li>In SuiteGenie, open <strong>Settings → API Keys</strong>.</li>
        <li>Select your AI provider (OpenAI, Perplexity, or Gemini).</li>
        <li>Paste your API key into the field.</li>
        <li>Click <strong>Save</strong> or <strong>Connect</strong>.</li>
        <li>You should see a success state once the key validates.</li>
      </ol>
      <p className="mb-6">If validation fails, double‑check that there are no extra spaces and that the key is still active in your provider's dashboard.</p>
      <h2 id="2-connecting-social-accounts" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">2. Connecting Social Accounts</h2>
      <h3 className="text-lg font-semibold mb-2">2.1 Connect Twitter / X (Tweet Genie)</h3>
      <ol className="list-decimal pl-6 mb-4">
        <li>Go to the <strong>Tweet Genie</strong> or Twitter section in your dashboard.</li>
        <li>Click <strong>Connect Twitter/X</strong>.</li>
        <li>A Twitter window will open asking you to authorize access.</li>
        <li>Approve and you'll be redirected back to SuiteGenie.</li>
      </ol>
      <p className="mb-6">If the popup doesn't appear, allow pop‑ups for suitegenie.in and try again.</p>
      <h3 className="text-lg font-semibold mb-2">2.2 Connect LinkedIn</h3>
      <ol className="list-decimal pl-6 mb-4">
        <li>Open the <strong>LinkedIn</strong> section in SuiteGenie.</li>
        <li>Click <strong>Connect LinkedIn</strong>.</li>
        <li>Sign in to LinkedIn (if not already) and approve access.</li>
        <li>Choose whether you want to post from your personal profile, company page, or both.</li>
      </ol>
      <p className="mb-6">You can disconnect either platform any time from <strong>Settings → Connected Accounts</strong>.</p>
      <h2>3. Creating Content with AI</h2>
      <div className="mt-16 mb-10 p-6 bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-100 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold mb-6 text-primary-700">3. Creating Content with AI</h2>
        <h3 className="text-lg font-semibold mb-4 text-primary-600">3.1 Generate Tweets and Threads</h3>
        <ol className="list-decimal pl-6 mb-4">
          <li>Open <strong>Tweet Genie</strong>.</li>
          <li>Enter a topic or prompt such as "5 things I learned bootstrapping a SaaS".</li>
          <li>Choose tone: <strong>Professional, Casual, Bold, Educational</strong>, etc.</li>
          <li>Click <strong>Generate</strong> to get 1–3 options, or use bulk mode for more.</li>
          <li>Edit any text you want directly in the editor.</li>
        </ol>
        <p className="mb-8">For threads, create the first hook tweet, then add follow‑up tweets as separate steps inside the same thread editor before scheduling.</p>
        <h3 className="text-lg font-semibold mb-4 text-primary-600">3.2 Generate LinkedIn Posts</h3>
        <ol className="list-decimal pl-6 mb-4">
          <li>Go to the <strong>LinkedIn</strong> tab in your dashboard.</li>
          <li>Enter a topic or prompt (same as Tweet Genie).</li>
          <li>Choose tone: <strong>Professional, Casual, Bold, Educational</strong>, etc.</li>
          <li>Click <strong>Generate</strong> to get options.</li>
          <li>Edit the copy to match your voice.</li>
          <li>Add or remove hashtags at the end of the post.</li>
        </ol>
        <p className="mb-2">A good pattern is: <strong>hook → context → insight → takeaway → call to action</strong>.</p>
      </div>
      <h2>4. Scheduling and Calendar</h2>
      <div className="mt-16 mb-10 p-6 bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-100 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold mb-6 text-primary-700">4. Scheduling and Calendar</h2>
        <h3 className="text-lg font-semibold mb-4 text-primary-600">4.1 Schedule a Single Post</h3>
        <ol className="list-decimal pl-6 mb-4">
          <li>After generating a tweet or LinkedIn post, click <strong>Schedule</strong>.</li>
          <li>Pick date, time and platform.</li>
          <li>Confirm and you'll see it in the <strong>Scheduled</strong> tab.</li>
        </ol>
        <p className="mb-8">Use your audience's time zone where most followers are active.</p>
        <h3 className="text-lg font-semibold mb-4 text-primary-600">4.2 Bulk Scheduling</h3>
        <ol className="list-decimal pl-6 mb-4">
          <li>Use bulk generation to create multiple posts in one go.</li>
          <li>Select all posts you want to schedule.</li>
          <li>Click <strong>Bulk Schedule</strong>.</li>
          <li>Choose whether to:
            <ul className="list-disc pl-6">
              <li>Spread them evenly (e.g. 2 per day), or</li>
              <li>Set exact times for each platform.</li>
            </ul>
          </li>
          <li>Review and confirm.</li>
        </ol>
        <p className="mb-2">This is the fastest way to plan a full week or month of content in one session.</p>
      </div>
      <h2>5. Analytics & "Best Performing" Posts</h2>
      <div className="mt-16 mb-10 p-6 bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-100 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold mb-6 text-primary-700">5. Analytics & "Best Performing" Posts</h2>
        <h3 className="text-lg font-semibold mb-4 text-primary-600">5.1 Viewing Performance</h3>
        <ol className="list-decimal pl-6 mb-4">
          <li>Open the <strong>Analytics</strong> or <strong>Insights</strong> section in your dashboard.</li>
          <li>Choose a date range (last 7 days, 30 days, custom).</li>
          <li>Filter by platform: Twitter or LinkedIn.</li>
          <li>Look at metrics like impressions, likes, comments and clicks.</li>
        </ol>
        <h3 className="text-lg font-semibold mb-4 text-primary-600">5.2 Finding Your Best Posts</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>See which tweets or posts got the highest engagement.</li>
          <li>Note topics, formats and hooks that repeatedly perform well.</li>
          <li>Use those as prompts when generating your next batch of content.</li>
        </ul>
        <p className="mb-2">If today you only have basic metrics, you can still manually sort or scan for the highest‑engagement posts and treat those as your "best performing."</p>
      </div>
      <h2>6. Troubleshooting & FAQ</h2>
      <div className="mt-16 mb-10 p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold mb-6 text-primary-700">6. Troubleshooting & FAQ</h2>
        <h3 className="text-lg font-semibold mb-4 text-primary-600">6.1 AI API Key Errors</h3>
        <ul className="list-disc pl-6 mb-2">
          <li>Key pasted with extra spaces.</li>
          <li>Key revoked or expired in your AI provider.</li>
          <li>No billing method or quota exhausted.</li>
        </ul>
        <p className="mb-2"><strong>Fix:</strong></p>
        <ul className="list-disc pl-6 mb-4">
          <li>Copy the key again carefully.</li>
          <li>Check your provider's <strong>Billing → Usage</strong> and <strong>Limits</strong>.</li>
          <li>Generate a new key and update it in SuiteGenie if needed.</li>
        </ul>
        <h3 className="text-lg font-semibold mb-4 text-primary-600">6.2 Twitter / LinkedIn Not Posting</h3>
        <ul className="list-disc pl-6 mb-2">
          <li>Confirm the account is still connected in <strong>Settings → Connected Accounts</strong>.</li>
          <li>Check if the platform's API rate limit was hit recently.</li>
          <li>Make sure the post content follows each platform's guidelines (no banned words, length too long, etc.).</li>
        </ul>
        <p className="mb-2">If the issue persists, try disconnecting and reconnecting the account once.</p>
        <h3 className="text-lg font-semibold mb-4 text-primary-600">6.3 I Don't See Analytics Yet</h3>
        <p className="mb-2">Analytics may only show posts that were created or scheduled through SuiteGenie itself. For older posts or content published manually, data can be partial or missing depending on platform limitations.</p>
      </div>
      <h2>7. Coming Soon</h2>
      <div className="mt-16 mb-10 p-6 bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-100 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold mb-6 text-primary-700">7. Coming Soon</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>WordPress / blog automation.</li>
          <li>Instagram and YouTube in MetaGenie.</li>
          <li>Threads (under review).</li>
        </ul>
        <p className="mb-2">These will appear in your dashboard as they roll out, no extra installation needed.</p>
      </div>
      <h2>8. Need Help?</h2>
      <div className="mt-16 mb-10 p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold mb-6 text-primary-700">8. Need Help?</h2>
        <p className="mb-2">If you're stuck or something doesn't behave as expected:</p>
        <ul className="list-disc pl-6 mb-2">
          <li>Email <strong>suitegenie1@gmail.com</strong></li>
          <li>Or DM us on Twitter <strong>@suitegenie</strong></li>
        </ul>
        <p className="mb-2">Include a short description, screenshot and the time it happened so we can debug faster.</p>
      </div>
    </div>
  </>
);

export default DocsPage;
