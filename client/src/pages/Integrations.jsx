import React from "react";
import { Helmet } from "react-helmet";

const IntegrationsPage = () => (
  <>
    <Helmet>
      <title>Integrations - SuiteGenie</title>
      <meta
        name="description"
        content="See the current SuiteGenie integration lineup across X, LinkedIn, Threads, AI providers, and expanding social workflows."
      />
      <link rel="canonical" href="https://suitegenie.in/integrations" />
      <meta property="og:title" content="Integrations - SuiteGenie" />
      <meta
        property="og:description"
        content="Learn which integrations are live in SuiteGenie today and which platform workflows are expanding next."
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://suitegenie.in/integrations" />
      <meta property="og:image" content="https://suitegenie.in/og-default.svg" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Integrations - SuiteGenie" />
      <meta
        name="twitter:description"
        content="Learn which integrations are live in SuiteGenie today and which platform workflows are expanding next."
      />
      <meta name="twitter:image" content="https://suitegenie.in/og-default.svg" />
      <script type="application/ld+json">{`
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "SuiteGenie Integrations",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "X" },
            { "@type": "ListItem", "position": 2, "name": "LinkedIn" },
            { "@type": "ListItem", "position": 3, "name": "Threads" },
            { "@type": "ListItem", "position": 4, "name": "OpenAI" },
            { "@type": "ListItem", "position": 5, "name": "Gemini" },
            { "@type": "ListItem", "position": 6, "name": "Perplexity" }
          ]
        }
      `}</script>
    </Helmet>

    <div className="max-w-3xl mx-auto p-6 sm:p-10 text-base text-gray-800" role="main">
      <h1 className="text-3xl font-bold mb-4">SuiteGenie Integrations</h1>
      <p className="mb-6">
        SuiteGenie connects the apps and providers needed for practical social publishing workflows. Here is the current public integration picture.
      </p>

      <hr className="my-8" />

      <h2 className="text-2xl font-bold mt-8 mb-3">Live Social Integrations</h2>

      <h3 className="text-lg font-semibold mb-2">X via Tweet Genie</h3>
      <ul className="list-disc pl-6 mb-4">
        <li>Personal and team account flows</li>
        <li>Single posts, threads, and supported media posting</li>
        <li>Scheduling, history, analytics, and cross-posting support</li>
      </ul>

      <h3 className="text-lg font-semibold mb-2">LinkedIn via LinkedIn Genie</h3>
      <ul className="list-disc pl-6 mb-4">
        <li>Personal and supported team or page workflows</li>
        <li>Text, image, and PDF or document publishing</li>
        <li>Scheduling, history, analytics, and cross-posting support</li>
      </ul>

      <h3 className="text-lg font-semibold mb-2">Threads via Social Genie</h3>
      <ul className="list-disc pl-6 mb-4">
        <li>Threads-focused publishing where enabled</li>
        <li>Schedule, history, analytics, and cross-post-aware workflows</li>
        <li>Part of the broader Social Genie expansion path</li>
      </ul>

      <hr className="my-8" />

      <h2 className="text-2xl font-bold mt-8 mb-3">Live AI Provider Integrations</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>OpenAI</li>
        <li>Gemini</li>
        <li>Perplexity</li>
      </ul>
      <p className="mb-6">
        These providers can be used through SuiteGenie credits or through BYOK workflows where supported by your plan and setup.
      </p>

      <hr className="my-8" />

      <h2 className="text-2xl font-bold mt-8 mb-3">Expanding Coverage</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Instagram workflows are expanding</li>
        <li>YouTube workflows are expanding</li>
        <li>Broader Social Genie coverage is continuing</li>
        <li>Additional publishing surfaces such as WordPress Genie are part of the broader roadmap</li>
      </ul>

      <hr className="my-8" />

      <h2 className="text-2xl font-bold mt-8 mb-3">How Connections Work</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Social accounts use secure connection flows</li>
        <li>Team mode keeps team-owned workflows separate from personal publishing</li>
        <li>Connected accounts are surfaced across SuiteGenie where needed for scheduling and cross-post target selection</li>
      </ul>

      <p className="mb-6">
        If you need a specific integration or rollout priority, contact the SuiteGenie team with your use case.
      </p>
    </div>
  </>
);

export default IntegrationsPage;
