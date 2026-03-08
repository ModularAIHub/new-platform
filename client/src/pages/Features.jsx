import React from 'react';
import { Helmet } from 'react-helmet';

const SectionHeading = ({ title }) => (
  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 text-gray-900">{title}</h1>
);

const SectionTitle = ({ children }) => (
  <h2 className="text-2xl font-bold mb-2 text-gray-900">{children}</h2>
);

const Features = () => (
  <>
    <Helmet>
      <title>Features - Strategy Builder, Content Plan, and AI Automation | SuiteGenie</title>
      <meta
        name="description"
        content="Explore SuiteGenie features across LinkedIn Genie, Tweet Genie, and Social Genie. Build high-signal prompts, generate publish-ready content plans, and improve output with Context Vault learning."
      />
      <meta
        name="keywords"
        content="suitegenie features, strategy builder, content plan, context vault, linkedin automation, tweet automation, social media ai workflow"
      />
      <link rel="canonical" href="https://suitegenie.in/features" />
      <meta property="og:title" content="Features - Strategy Builder, Content Plan, and AI Automation | SuiteGenie" />
      <meta
        property="og:description"
        content="SuiteGenie combines strategy builder, prompt packs, content plans, context memory, analytics learning, automation, and team routing."
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://suitegenie.in/features" />
      <meta property="og:image" content="https://suitegenie.in/og-default.svg" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Features - Strategy Builder, Content Plan, and AI Automation | SuiteGenie" />
      <meta
        name="twitter:description"
        content="See how SuiteGenie helps you generate better prompts, publish-ready content, and learning-driven growth across X, LinkedIn, and Threads."
      />
      <meta name="twitter:image" content="https://suitegenie.in/og-default.svg" />
      <script type="application/ld+json">{`
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "SuiteGenie",
          "image": "https://suitegenie.in/og-default.svg",
          "description": "SuiteGenie is an AI social media operations platform for strategy, high-signal prompts, content planning, publishing automation, and analytics feedback.",
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
      <SectionHeading title="SuiteGenie Features: Built for Teams That Want Better Content Outcomes" />
      <p className="text-gray-600 mb-8 max-w-3xl">
        SuiteGenie is designed for one thing: helping you publish content that performs better over time. Instead of
        isolated AI drafting, you get a full system: strategy, prompts, publish-ready plans, approvals, posting, and
        learning loops.
      </p>

      <div className="bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-100 rounded-xl p-4 mb-8 shadow-sm">
        <span className="block text-primary-700 font-semibold text-lg">
          How users win: stronger prompts -&gt; better posts -&gt; review + analytics feedback -&gt; better next cycle.
        </span>
      </div>

      <hr className="my-10" />

      <section className="mb-10">
        <SectionTitle>1. LinkedIn Strategy Builder (Guided 5-Step Flow)</SectionTitle>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Setup and strategy capture for niche, audience, goals, and tone</li>
          <li>Review stage to validate analysis and avoid bad assumptions</li>
          <li>Prompt Pack generation tuned to your confirmed strategy</li>
          <li>Content Plan tab for publish-ready queue and approvals</li>
          <li>Context Vault tab for persistent memory and signal health</li>
        </ul>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <SectionTitle>2. Prompt Packs Focused on Quality</SectionTitle>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Quality-first ranges (typically 11-14 prompts) instead of spammy volume</li>
          <li>Prompt usage tracking so you know what has already been used</li>
          <li>Prompt refresh recommendations based on stale and usage signals</li>
          <li>Prompt-to-compose handoff with cleaner context payloads</li>
        </ul>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <SectionTitle>3. Auto Content Plan With Publish-Ready Queue</SectionTitle>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Auto-generated queue after prompt generation</li>
          <li>Publish-ready drafts with reason, schedule hints, and hashtags</li>
          <li>Approve, reject, schedule, or send directly to Compose</li>
          <li>Strategy-scoped queue data (not mixed with unrelated runs)</li>
        </ul>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <SectionTitle>4. Context Vault Learning Loop</SectionTitle>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Stores compact strategy memory and source quality signals</li>
          <li>Learns from queue reviews: approve, reject, schedule, posted outcomes</li>
          <li>Learns from analytics sync: engagement, themes, best and weak topics</li>
          <li>Feeds recommendations back into strategy and future generation</li>
        </ul>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <SectionTitle>5. AI + Compose Improvements for Real Publishing</SectionTitle>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Direct compose prefill from Content Plan without prompt loss</li>
          <li>Editor-safe HTML normalization to prevent text cut-off issues</li>
          <li>Works with BYOK and platform credit models</li>
          <li>Supports iterative editing before post or schedule actions</li>
        </ul>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <SectionTitle>6. Cross-Platform Execution</SectionTitle>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Tweet Genie for X-native generation and execution</li>
          <li>LinkedIn Genie for profile-first strategy and publishing</li>
          <li>Social Genie for Threads and expanding workflow coverage</li>
          <li>Cross-post destination controls where enabled</li>
        </ul>
      </section>

      <hr className="my-8" />

      <section className="mb-10">
        <SectionTitle>7. Team Operations and Reliability</SectionTitle>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Team workspaces, invites, and role-based collaboration</li>
          <li>Safer account-aware routing and publishing context</li>
          <li>History and analytics views for operational trust</li>
          <li>OAuth-based connections and encrypted key/token handling</li>
        </ul>
      </section>

      <hr className="my-8" />

      <section className="mb-10 text-center">
        <SectionTitle>Start with One Outcome: Better Posts Every Week</SectionTitle>
        <ol className="list-decimal pl-6 mb-4 text-gray-600 text-left inline-block">
          <li>Run Strategy Builder</li>
          <li>Generate Prompt Pack and Content Plan</li>
          <li>Approve, publish, and let Context Vault learn</li>
        </ol>
        <a href="/register" className="inline-block mt-2 text-blue-600 font-semibold underline">
          Start with SuiteGenie
        </a>
      </section>
    </div>
  </>
);

export default Features;
