import React from "react";
import { Helmet } from "react-helmet";

const DocsPage = () => (
  <>
    <Helmet>
      <title>Help and Documentation - SuiteGenie</title>
      <meta
        name="description"
        content="Learn how to set up SuiteGenie, connect X, LinkedIn, and supported social accounts, use BYOK, generate content, schedule posts, work in team mode, and understand analytics."
      />
      <link rel="canonical" href="https://suitegenie.in/docs" />
      <meta property="og:title" content="Help and Documentation - SuiteGenie" />
      <meta
        property="og:description"
        content="Step-by-step SuiteGenie setup docs for accounts, BYOK, scheduling, team mode, strategy builder, cross-posting, and analytics."
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://suitegenie.in/docs" />
      <meta property="og:image" content="https://suitegenie.in/og-default.svg" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Help and Documentation - SuiteGenie" />
      <meta
        name="twitter:description"
        content="Step-by-step SuiteGenie setup docs for accounts, BYOK, scheduling, team mode, strategy builder, cross-posting, and analytics."
      />
      <meta name="twitter:image" content="https://suitegenie.in/og-default.svg" />
      <script type="application/ld+json">{`
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How do I get started with SuiteGenie?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Create an account, choose your AI mode, connect your social accounts, then start in Tweet Genie, LinkedIn Genie, or Social Genie."
              }
            },
            {
              "@type": "Question",
              "name": "Can I use SuiteGenie with teams?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. SuiteGenie supports team creation, invites, roles, and team-owned account workflows."
              }
            }
          ]
        }
      `}</script>
    </Helmet>

    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 text-base text-gray-800" role="main">
      <h1 className="text-4xl font-extrabold mb-4 text-primary-700">SuiteGenie Help and Documentation</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <a href="/features" className="text-blue-600 underline font-medium">Explore features</a>
        <span className="text-gray-400">|</span>
        <a href="/pricing" className="text-blue-600 underline font-medium">See plans</a>
        <span className="text-gray-400">|</span>
        <a href="/blogs" className="text-blue-600 underline font-medium">Read updates</a>
      </div>

      <p className="mb-8 text-lg text-gray-700 leading-relaxed">
        This guide covers the complete SuiteGenie workflow: setup, account connections, content creation, scheduling,
        team mode, cross-posting, and analytics.
      </p>

      <div className="bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-100 rounded-xl p-4 mb-10 shadow-sm">
        <span className="block text-primary-700 font-semibold text-lg">
          Use this page as the single public guide for getting started and understanding how the main product pieces fit together.
        </span>
      </div>

      <h2 id="1-getting-started" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">1. Getting Started</h2>
      <ol className="list-decimal pl-6 mb-4">
        <li>Create your SuiteGenie account from the main website.</li>
        <li>Log in and open the dashboard.</li>
        <li>Choose whether you want to use platform credits, BYOK, or both where supported.</li>
        <li>Decide whether you are setting up for personal publishing, team publishing, or both.</li>
      </ol>

      <h3 id="1-2-get-your-ai-api-key-byok" className="text-lg font-semibold mb-2 scroll-mt-24 text-primary-600">1.2 Add Your AI Provider Key (BYOK)</h3>
      <p className="mb-4">
        SuiteGenie supports BYOK for users and teams who want more control over AI cost and provider choice.
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>OpenAI</li>
        <li>Gemini</li>
        <li>Perplexity</li>
      </ul>
      <ol className="list-decimal pl-6 mb-6">
        <li>Open the API Keys area in the SuiteGenie dashboard.</li>
        <li>Add the provider key you want to use.</li>
        <li>Save it and confirm validation.</li>
      </ol>

      <h2 id="2-connecting-social-accounts" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">2. Connecting Social Accounts</h2>
      <h3 className="text-lg font-semibold mb-2">2.1 Connect X in Tweet Genie</h3>
      <ol className="list-decimal pl-6 mb-4">
        <li>Open Tweet Genie.</li>
        <li>Connect your X account.</li>
        <li>If you want media posting, complete the full X permission flow for image-capable posting.</li>
      </ol>

      <h3 className="text-lg font-semibold mb-2">2.2 Connect LinkedIn in LinkedIn Genie</h3>
      <ol className="list-decimal pl-6 mb-4">
        <li>Open LinkedIn Genie.</li>
        <li>Connect your LinkedIn account.</li>
        <li>Choose the supported personal or page workflow available to your account.</li>
      </ol>

      <h3 className="text-lg font-semibold mb-2">2.3 Connect Threads or Other Social Accounts</h3>
      <p className="mb-6">
        Social Genie handles Threads and expanding social workflows. Availability can vary by environment and rollout stage.
      </p>

      <h2 id="3-team-mode" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">3. Team Mode</h2>
      <p className="mb-4">
        Team mode is for shared publishing, shared account ownership, and role-based collaboration.
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Create or join a team</li>
        <li>Invite owners, admins, editors, or viewers</li>
        <li>Connect team-owned accounts only when the team should publish from them</li>
        <li>Use team mode for shared scheduling and shared review workflows</li>
      </ul>
      <p className="mb-6">
        Best practice: keep personal accounts for solo workflows and connect team-owned accounts in team mode only when the team should own that publishing context.
      </p>

      <h2 id="4-creating-content" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">4. Creating Content</h2>
      <ul className="list-disc pl-6 mb-6">
        <li>Use Tweet Genie for X posts, threads, and media workflows</li>
        <li>Use LinkedIn Genie for text, image, and PDF or document posts</li>
        <li>Use Strategy Builder to create reusable prompt banks and content plans</li>
        <li>Use Social Genie for supported Threads and expanding social workflows</li>
      </ul>

      <h2 id="5-bulk-generation-and-scheduling" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">5. Bulk Generation and Scheduling</h2>
      <ol className="list-decimal pl-6 mb-4">
        <li>Generate multiple drafts in a focused session.</li>
        <li>Edit and approve the best ones.</li>
        <li>Schedule them into a one- to two-week window.</li>
        <li>Use team mode if the schedule should belong to a shared team workflow.</li>
      </ol>
      <p className="mb-6">
        Bulk generation is best used as a planning accelerator, not a replacement for review.
      </p>

      <h2 id="6-cross-posting" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">6. Cross-Posting</h2>
      <p className="mb-4">SuiteGenie supports cross-app workflows such as:</p>
      <ul className="list-disc pl-6 mb-4">
        <li>X to LinkedIn</li>
        <li>LinkedIn to X</li>
        <li>X to X</li>
        <li>Threads-origin cross-posting where enabled</li>
      </ul>
      <p className="mb-6">
        Always verify the source account and destination target account before posting or scheduling.
      </p>

      <h2 id="7-history-and-analytics" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">7. History and Analytics</h2>
      <ul className="list-disc pl-6 mb-6">
        <li>Use history views to confirm what was published</li>
        <li>Use scheduled views to confirm what is still upcoming</li>
        <li>Use analytics to learn which topics, formats, and accounts perform best</li>
        <li>Keep the selected account context in mind when reviewing performance</li>
      </ul>

      <h2 id="8-troubleshooting" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">8. Troubleshooting</h2>
      <ul className="list-disc pl-6 mb-6">
        <li>AI key validation problems</li>
        <li>Account connection warnings</li>
        <li>Cross-post target confusion in multi-account workflows</li>
        <li>Analytics or history visibility delays</li>
      </ul>
      <p className="mb-6">
        If something looks wrong, first check the selected account, the active team context, and whether the account was connected in the intended scope.
      </p>

      <h2 id="9-coming-soon" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">9. Expanding Areas</h2>
      <ul className="list-disc pl-6 mb-6">
        <li>Broader Social Genie coverage</li>
        <li>Expanded Instagram and YouTube workflows</li>
        <li>More publishing and reporting depth across apps</li>
        <li>Additional product surfaces such as WordPress Genie over time</li>
      </ul>

      <h2 id="10-need-help" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">10. Need Help?</h2>
      <p className="mb-2">If you are stuck or want help with setup:</p>
      <ul className="list-disc pl-6 mb-2">
        <li>Email <strong>suitegenie1@gmail.com</strong></li>
        <li>Use the public support channels listed on the site</li>
      </ul>
      <p className="mb-2">Include your app, account context, and a screenshot if possible.</p>
    </div>
  </>
);

export default DocsPage;
