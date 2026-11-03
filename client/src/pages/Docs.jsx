import React from 'react';
import { Helmet } from 'react-helmet';

const DocsPage = () => (
  <>
    <Helmet>
      <title>Help and Documentation - SuiteGenie</title>
      <meta
        name="description"
        content="Learn how to run SuiteGenie end-to-end: setup, BYOK, social connections, strategy builder, prompt packs, content plans, context vault, and analytics learning."
      />
      <meta
        name="keywords"
        content="suitegenie documentation, strategy builder guide, content plan guide, context vault, linkedin automation docs, byok setup"
      />
      <link rel="canonical" href="https://suitegenie.in/docs" />
      <meta property="og:title" content="Help and Documentation - SuiteGenie" />
      <meta
        property="og:description"
        content="Step-by-step SuiteGenie docs for setup, strategy builder, prompt packs, content plans, context vault learning, and analytics-driven iteration."
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://suitegenie.in/docs" />
      <meta property="og:image" content="https://suitegenie.in/og-default.svg" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Help and Documentation - SuiteGenie" />
      <meta
        name="twitter:description"
        content="Step-by-step setup docs for strategy builder, prompt packs, content plans, team workflows, cross-posting, and analytics loops."
      />
      <meta name="twitter:image" content="https://suitegenie.in/og-default.svg" />
      <script type="application/ld+json">{`
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How do I get better content quality in SuiteGenie?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Run Strategy Builder, generate the prompt pack, create the content plan, review outcomes, then refresh Context Vault from analytics to improve the next cycle."
              }
            },
            {
              "@type": "Question",
              "name": "Can I use SuiteGenie with teams?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. SuiteGenie supports team creation, invites, role-aware workflows, and team-owned account operations."
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

      <p className="text-gray-700 mb-6">
        This page is the public operating guide for SuiteGenie. If your goal is better performance, follow the sequence:
        strategy setup -&gt; high-signal prompts -&gt; publish-ready content plan -&gt; approvals -&gt; analytics refresh -&gt; next cycle.
      </p>

      <div className="bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-100 rounded-xl p-4 mb-10 shadow-sm">
        <span className="block text-primary-700 font-semibold text-lg">
          Best results come from consistency: review each queue, sync analytics, then regenerate with updated Context Vault signals.
        </span>
      </div>

      <h2 id="1-getting-started" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">
        1. Getting Started
      </h2>
      <ol className="list-decimal pl-6 mb-4">
        <li>Create your SuiteGenie account and open dashboard.</li>
        <li>Pick your initial module (LinkedIn Genie, Tweet Genie, or Social Genie).</li>
        <li>Decide whether you use platform credits, BYOK, or both.</li>
        <li>Choose personal-only or team workflow before connecting accounts.</li>
      </ol>

      <h3 id="1-2-get-your-ai-api-key-byok" className="text-lg font-semibold mb-2 scroll-mt-24 text-primary-600">
        1.2 Add Your AI Provider Key (BYOK)
      </h3>
      <p className="mb-4">
        BYOK gives cost and provider control for teams that run frequent generation cycles.
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>OpenAI</li>
        <li>Gemini</li>
        <li>Perplexity</li>
      </ul>
      <ol className="list-decimal pl-6 mb-6">
        <li>Open API Keys from dashboard settings.</li>
        <li>Add and validate your provider key.</li>
        <li>Save and run a test generation.</li>
      </ol>

      <h2 id="2-connecting-social-accounts" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">
        2. Connecting Social Accounts
      </h2>
      <h3 className="text-lg font-semibold mb-2">2.1 Connect X in Tweet Genie</h3>
      <ol className="list-decimal pl-6 mb-4">
        <li>Open Tweet Genie and connect your X account.</li>
        <li>Complete full permission flow if you need media posting.</li>
      </ol>

      <h3 className="text-lg font-semibold mb-2">2.2 Connect LinkedIn in LinkedIn Genie</h3>
      <ol className="list-decimal pl-6 mb-4">
        <li>Open LinkedIn Genie and connect your LinkedIn account.</li>
        <li>Use personal/profile or page scope based on your workflow.</li>
        <li>If API fields are restricted, upload a text-selectable LinkedIn PDF for profile enrichment.</li>
      </ol>

      <h3 className="text-lg font-semibold mb-2">2.3 Connect Threads and Other Social Workflows</h3>
      <p className="mb-6">
        Social Genie handles Threads and expanding channels. Availability can vary by rollout stage.
      </p>

      <h2 id="3-team-mode" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">
        3. Team Mode
      </h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Create teams and invite members with role-aware access.</li>
        <li>Keep personal and team account scopes clean to avoid routing confusion.</li>
        <li>Use team mode only for accounts the team should actually publish from.</li>
      </ul>
      <p className="mb-6">
        Best practice: connect personal accounts for solo workflows, and team-owned accounts only inside team context.
      </p>

      <h2 id="4-strategy-builder-content-plan-context-vault" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">
        4. Strategy Builder: Prompt Pack, Content Plan, and Context Vault
      </h2>
      <ol className="list-decimal pl-6 mb-4">
        <li>Setup: confirm niche, audience, goals, and tone.</li>
        <li>Review: validate analysis before generation.</li>
        <li>Prompt Pack: generate high-signal prompts (quality-first range).</li>
        <li>Content Plan: auto-generate publish-ready queue and approve/reject/schedule.</li>
        <li>Context Vault: refresh memory from queue decisions and analytics.</li>
      </ol>
      <ul className="list-disc pl-6 mb-6">
        <li>Use “Use in Compose” for direct draft handoff.</li>
        <li>Prompt usage and content plan usage are persisted across refresh.</li>
        <li>Queue actions trigger vault refresh for better next-cycle recommendations.</li>
      </ul>

      <h2 id="5-bulk-generation-and-automation" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">
        5. Bulk Generation and Automation
      </h2>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
        <li>Use prompt packs and content plans to generate faster with context.</li>
        <li>Prioritize a 7-14 day execution window for cleaner quality control.</li>
        <li>Treat automation as execution acceleration, not review replacement.</li>
      </ul>

      <h2 id="6-cross-posting" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">
        6. Cross-Posting
      </h2>
      <p className="mb-4">SuiteGenie supports cross-workflow routing such as:</p>
      <ul className="list-disc pl-6 mb-4">
        <li>X to LinkedIn</li>
        <li>LinkedIn to X</li>
        <li>X to X</li>
        <li>Threads-origin cross-posting where enabled</li>
      </ul>
      <p className="mb-6">
        Always verify source account and destination targets before publishing or scheduling.
      </p>

      <h2 id="7-history-and-analytics" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">
        7. History and Analytics
      </h2>
      <ul className="list-disc pl-6 mb-6">
        <li>Track what was published and what is pending.</li>
        <li>Use analytics to identify high-performing topics and weak angles.</li>
        <li>Refresh Context Vault after analytics sync to feed stronger recommendations.</li>
      </ul>

      <h2 id="8-troubleshooting" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">
        8. Troubleshooting
      </h2>
      <ul className="list-disc pl-6 mb-6">
        <li>AI output looks generic: regenerate after syncing Strategy + Context Vault.</li>
        <li>Missing LinkedIn profile fields: use text-selectable PDF fallback.</li>
        <li>Cross-post mismatch: verify active account scope and destination labels.</li>
        <li>Prompt usage ticks missing: refresh after mark-used API call completes.</li>
      </ul>

      <h2 id="9-coming-soon" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">
        9. Expanding Areas
      </h2>
      <ul className="list-disc pl-6 mb-6">
        <li>Deeper Context Vault recommendations and trend-aware prompt tuning.</li>
        <li>Expanded Social Genie channel support.</li>
        <li>More account-aware reporting depth and quality health signals.</li>
      </ul>

      <h2 id="10-need-help" className="text-2xl font-bold mt-16 mb-3 scroll-mt-24 text-primary-700 border-b-2 border-primary-100 pb-1">
        10. Need Help?
      </h2>
      <p className="mb-2">If you need direct support:</p>
      <ul className="list-disc pl-6 mb-2">
        <li>Email <strong>suitegenie1@gmail.com</strong></li>
        <li>Include app name, account context, and screenshot for faster triage</li>
      </ul>
    </div>
  </>
);

export default DocsPage;
