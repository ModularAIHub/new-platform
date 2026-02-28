import React from "react";
import { Helmet } from "react-helmet";

const IntegrationsPage = () => (
  <>
    <Helmet>
      <title>Integrations – SuiteGenie</title>
      <meta name="description" content="Connect SuiteGenie with Twitter, LinkedIn and upcoming platforms. See current and planned integrations for your social media workflow." />
      <link rel="canonical" href="https://suitegenie.in/integrations" />
      <meta property="og:title" content="Integrations – SuiteGenie" />
      <meta property="og:description" content="Connect SuiteGenie with Twitter, LinkedIn and upcoming platforms. See current and planned integrations for your social media workflow." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://suitegenie.in/integrations" />
      <meta property="og:image" content="https://suitegenie.in/og-default.svg" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Integrations – SuiteGenie" />
      <meta name="twitter:description" content="Connect SuiteGenie with Twitter, LinkedIn and upcoming platforms. See current and planned integrations for your social media workflow." />
      <meta name="twitter:image" content="https://suitegenie.in/og-default.svg" />
      {/* Structured Data: ItemList */}
      <script type="application/ld+json">{`
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "SuiteGenie Integrations",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Twitter / X"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "LinkedIn"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "WordPress (Coming Soon)"
            },
            {
              "@type": "ListItem",
              "position": 4,
              "name": "Instagram (Planned)"
            },
            {
              "@type": "ListItem",
              "position": 5,
              "name": "Facebook Pages (Planned)"
            }
          ]
        }
      `}</script>
    </Helmet>
    <div className="max-w-3xl mx-auto p-6 sm:p-10 text-base text-gray-800" role="main">
      <h1 className="text-3xl font-bold mb-4">Integrations</h1>
      <p className="mb-6">SuiteGenie connects directly to the platforms you use to create and schedule content. Here’s what works today and what’s coming next.</p>
      <hr className="my-8" />
      <h2 className="text-2xl font-bold mt-8 mb-3">Live Integrations</h2>
      <h3 className="text-lg font-semibold mb-2">Twitter / X</h3>
      <ul className="list-disc pl-6 mb-4">
        <li>Connect via OAuth in a few clicks</li>
        <li>Generate tweets and threads with AI</li>
        <li>Schedule posts and manage your calendar</li>
        <li>Track engagement over time</li>
      </ul>
      <h3 className="text-lg font-semibold mb-2">LinkedIn</h3>
      <ul className="list-disc pl-6 mb-4">
        <li>Post to your personal profile or company page</li>
        <li>Create thought‑leadership posts with AI</li>
        <li>Schedule for business‑hour slots when engagement is highest</li>
      </ul>
      <hr className="my-8" />
      <h2 className="text-2xl font-bold mt-8 mb-3">Coming Soon</h2>
      <h3 className="text-lg font-semibold mb-2">WordPress</h3>
      <ul className="list-disc pl-6 mb-4">
        <li>Generate long‑form blog posts with AI</li>
        <li>Publish or schedule directly to your site</li>
        <li>Keep your content and social posts in sync</li>
      </ul>
      <h3 className="text-lg font-semibold mb-2">More Social Platforms</h3>
      <ul className="list-disc pl-6 mb-4">
        <li>Instagram</li>
        <li>Facebook pages</li>
        <li>Additional blogging and newsletter tools</li>
      </ul>
      <p className="mb-6">If you have a specific integration you need, email <strong>hello@suitegenie.in</strong> and tell us your use case.</p>
      <hr className="my-8" />
      <h2 className="text-2xl font-bold mt-8 mb-3">How Connections Work</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>All social accounts use secure OAuth flows.</li>
        <li>Your OpenAI key is stored encrypted and only used to generate content.</li>
        <li>You can disconnect any integration anytime from <strong>Settings → Connected Accounts</strong> in the dashboard.</li>
      </ul>
    </div>
  </>
);

export default IntegrationsPage;
