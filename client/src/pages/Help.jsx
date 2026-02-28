import React from "react";
import { Helmet } from "react-helmet";

const HelpPage = () => (
  <>
    <Helmet>
      <title>Help Center - SuiteGenie</title>
      <meta
        name="description"
        content="Get fast help with SuiteGenie setup, BYOK, team mode, scheduling, cross-posting, and analytics."
      />
      <link rel="canonical" href="https://suitegenie.in/help" />
      <meta property="og:title" content="Help Center - SuiteGenie" />
      <meta
        property="og:description"
        content="Find quick links for setup, team mode, BYOK, cross-posting, analytics, and public product updates."
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://suitegenie.in/help" />
      <meta property="og:image" content="https://suitegenie.in/og-default.svg" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Help Center - SuiteGenie" />
      <meta
        name="twitter:description"
        content="Find quick links for setup, team mode, BYOK, cross-posting, analytics, and public product updates."
      />
      <meta name="twitter:image" content="https://suitegenie.in/og-default.svg" />
      <script type="application/ld+json">{`
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Where should I start with SuiteGenie help?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Start with the getting started and account connection sections in the main docs page."
              }
            },
            {
              "@type": "Question",
              "name": "Does SuiteGenie support team workflows?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. SuiteGenie includes team creation, invites, account sharing, and team-aware publishing workflows."
              }
            }
          ]
        }
      `}</script>
    </Helmet>

    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 text-base text-gray-800" role="main">
      <h1 className="text-4xl font-extrabold mb-4 text-primary-700">SuiteGenie Help Center</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <a href="/docs" className="text-blue-600 underline font-medium">Open full docs</a>
        <span className="text-gray-400">|</span>
        <a href="/features" className="text-blue-600 underline font-medium">Review features</a>
        <span className="text-gray-400">|</span>
        <a href="/blogs" className="text-blue-600 underline font-medium">Read product updates</a>
      </div>

      <p className="mb-8 text-lg text-gray-700 leading-relaxed">
        Need help with SuiteGenie? Start with the quick links below, then move into the full docs if you need the complete workflow.
      </p>

      <div className="grid gap-6 md:grid-cols-2 mb-10">
        <div className="bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-3 text-primary-700">Quick Start</h2>
          <ul className="space-y-2">
            <li><a href="/docs#1-getting-started" className="text-blue-600 underline font-medium">Create your account and get started</a></li>
            <li><a href="/docs#1-2-get-your-ai-api-key-byok" className="text-blue-600 underline font-medium">Add BYOK provider keys</a></li>
            <li><a href="/docs#2-connecting-social-accounts" className="text-blue-600 underline font-medium">Connect X, LinkedIn, and social accounts</a></li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-3 text-primary-700">Popular Workflows</h2>
          <ul className="space-y-2">
            <li><a href="/docs#3-team-mode" className="text-blue-600 underline font-medium">Set up team mode</a></li>
            <li><a href="/docs#5-bulk-generation-and-scheduling" className="text-blue-600 underline font-medium">Use bulk generation and scheduling</a></li>
            <li><a href="/docs#6-cross-posting" className="text-blue-600 underline font-medium">Understand cross-posting</a></li>
          </ul>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm mb-10">
        <h2 className="text-xl font-bold mb-3 text-primary-700">Common Topics</h2>
        <ul className="space-y-2">
          <li>Account connection warnings and reconnect flows</li>
          <li>Team mode and shared account setup</li>
          <li>Cross-post target selection</li>
          <li>Why a post appears in history or scheduled views</li>
          <li>How analytics relates to the selected account context</li>
        </ul>
        <p className="mt-4 text-sm">
          For the full explanation, go to <a href="/docs#8-troubleshooting" className="text-blue-600 underline font-medium">Troubleshooting in Docs</a>.
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm mb-10">
        <h2 className="text-xl font-bold mb-3 text-primary-700">Latest Reading</h2>
        <ul className="space-y-2">
          <li><a href="/blogs/updates/team-mode-cross-posting-and-visibility-update-mar-2026" className="text-blue-600 underline font-medium">Team mode, cross-posting, and visibility update</a></li>
          <li><a href="/blogs/guides/how-to-set-up-personal-and-team-accounts-in-suitegenie" className="text-blue-600 underline font-medium">How to set up personal and team accounts cleanly</a></li>
          <li><a href="/blogs/insights/what-reliable-social-automation-actually-needs" className="text-blue-600 underline font-medium">What reliable social automation actually needs</a></li>
        </ul>
      </div>

      <div className="bg-gradient-to-br from-primary-100 to-purple-100 border border-primary-200 rounded-xl p-6 shadow-md text-center">
        <h2 className="text-xl font-bold mb-3 text-primary-700">Need direct help?</h2>
        <ul className="space-y-2">
          <li>Email: <strong>suitegenie1@gmail.com</strong></li>
          <li>Include your app, screen, and a short description of what happened</li>
        </ul>
      </div>
    </div>
  </>
);

export default HelpPage;
