import React from "react";
import { Helmet } from "react-helmet";

const Features = () => (
  <>
    <Helmet>
      <title>Features - AI Social Media Automation | SuiteGenie</title>
      <meta
        name="description"
        content="Explore SuiteGenie features across Tweet Genie, LinkedIn Genie, and Social Genie. Create content with AI, automate posts, cross-post between channels, manage team workflows, and analyze performance from one platform."
      />
      <meta
        name="keywords"
        content="suitegenie features, ai social media automation, tweet genie, linkedin genie, social genie, cross posting, bulk generation, team automation, byok"
      />
      <link rel="canonical" href="https://suitegenie.in/features" />
      <meta property="og:title" content="Features - AI Social Media Automation | SuiteGenie" />
      <meta
        property="og:description"
        content="SuiteGenie combines Tweet Genie, LinkedIn Genie, and Social Genie with AI generation, flow automation, analytics, cross-posting, and team workflows."
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://suitegenie.in/features" />
      <meta property="og:image" content="https://suitegenie.in/og-default.svg" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Features - AI Social Media Automation | SuiteGenie" />
      <meta
        name="twitter:description"
        content="See what SuiteGenie can do across X, LinkedIn, Threads, AI content generation, automation flows, analytics, and team workflows."
      />
      <meta name="twitter:image" content="https://suitegenie.in/og-default.svg" />
      <script type="application/ld+json">{`
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "SuiteGenie",
          "image": "https://suitegenie.in/og-default.svg",
          "description": "SuiteGenie is an AI-powered social media automation platform for X, LinkedIn, and expanding social workflows.",
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
      <SectionHeading title="A Comprehensive Feature Set for Modern Teams" />
      <p className="text-gray-600 mb-8 max-w-2xl">
        SuiteGenie is built so you can analyze competitors, generate highly-targeted AI content,
        automate it, cross-post it, review it with a team, and track results without jumping between disconnected tools.
      </p>

      <div className="bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-100 rounded-xl p-4 mb-8 shadow-sm">
        <span className="block text-primary-700 font-semibold text-lg">
          Built for founders, creators, and teams who want reliable execution, not just AI drafts.
        </span>
      </div>

      <hr className="my-10" />

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">1. AI Creation with BYOK or Platform Credits</h2>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Generate short-form and long-form social drafts quickly</li>
          <li>Use reusable prompts, strategy context, and tone guidance</li>
          <li>Support BYOK for lower-cost AI usage and more control</li>
          <li>Switch between providers based on your preference and budget</li>
        </ul>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">2. Tweet Genie for X</h2>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Create single posts and threads</li>
          <FeatureList items={[
            "Draft multi-post threads effortlessly",
            "Automate content routing and review later",
            "Cross-post individual tweets to LinkedIn automatically",
            "Optimize via deep post analytics (Likes, Reposts, Bookmarks, Views)"
          ]} />
          <li>Cross-post from X to LinkedIn, X to X, and X to Threads where configured</li>
        </ul>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">3. LinkedIn Genie for Profiles and Pages</h2>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Publish to LinkedIn personal profiles and supported company or page contexts</li>
          <li>Create text, image, and PDF or document posts</li>
          <li>Generate content in bulk and automate it over time</li>
          <li>Cross-post from LinkedIn to X and Threads where the destination is available</li>
          <li>Review history and analytics with account-aware filtering</li>
        </ul>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">4. Social Genie and Expanding Multi-Platform Workflows</h2>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Threads-focused publishing and automation workflows</li>
          <li>Multi-platform composer patterns</li>
          <li>Shared account discovery across the SuiteGenie ecosystem</li>
          <li>Expanding support for Instagram and YouTube workflows</li>
        </ul>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">5. Strategy Builder</h2>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Define audience, positioning, content goals, and core themes</li>
          <li>Generate prompt banks you can reuse across campaigns</li>
          <li>Move from strategy output into compose or bulk generation flows</li>
          <li>Keep planning and execution connected instead of scattered</li>
        </ul>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <FeatureBlock title="6. Bulk Generation and Automation Flow">
          <p className="mb-4">
            Need a month of content mapped out quickly? Build topic lists and automate the whole flow.
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-600">
            <li>Generate multiple drafts in a single session</li>
            <li>Edit, trim, and approve before publishing</li>
            <li>Automate for personal or team-owned accounts</li>
            <li>Use bulk flows to build a one- to two-week publishing window quickly</li>
          </ul>
        </FeatureBlock>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">7. Cross-Posting and Destination Account Selection</h2>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>X to LinkedIn</li>
          <li>LinkedIn to X</li>
          <li>X to X</li>
          <li>Threads-origin cross-posting where enabled</li>
          <li>Destination account selectors for safer multi-account routing</li>
        </ul>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <FeatureBlock title="8. History, Automated Views, and Analytics">
          <p className="mb-4">
            Keep a pulse on everything publishing from your workspace.
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-600">
            <FeatureList items={[
              "Check upcoming work in automated workflows",
              "Detailed post history per platform",
              "Track engagement to refine the AI prompts"
            ]} />
            <li>Use performance insights to improve future prompts and post formats</li>
          </ul>
        </FeatureBlock>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">9. Team Mode and Shared Account Workflows</h2>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Team creation, invites, and role-based access</li>
          <li>Shared social accounts for team-owned publishing</li>
          <li>Team-aware cross-posting and automation flows</li>
          <li>Shared content operations for agencies and internal teams</li>
        </ul>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">10. Security and Reliability</h2>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>OAuth-based account connections</li>
          <li>Encrypted storage for AI keys and platform tokens</li>
          <li>Separation between personal and team account scopes</li>
          <li>Ongoing product work focused on routing, visibility, and post-operation trust</li>
        </ul>
      </section>

      <hr className="my-8" />

      <section className="mb-10 text-center">
        <h2 className="text-2xl font-bold mb-2">Ready to explore the full SuiteGenie workflow?</h2>
        <ol className="list-decimal pl-6 mb-4 text-gray-600 text-left inline-block">
          <li>Create your account</li>
          <li>Connect your social accounts</li>
          <li>Generate, flow, cross-post, and learn from performance</li>
        </ol>
        <a href="/register" className="inline-block mt-2 text-blue-600 font-semibold underline">Start with SuiteGenie</a>
      </section>
    </div>
  </>
);

export default Features;
