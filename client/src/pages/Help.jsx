// import React from "react";
// import { Helmet } from "react-helmet";

// const HelpPage = () => (
//   <>
//     <Helmet>
//       <title>Help Center – SuiteGenie</title>
//       <meta name="description" content="Find answers, quick start guides, and support for SuiteGenie. Learn how to connect Twitter and LinkedIn, use BYOK, and fix common issues." />
//       <meta property="og:title" content="Help Center – SuiteGenie" />
//       <meta property="og:description" content="Find answers, quick start guides, and support for SuiteGenie. Learn how to connect Twitter and LinkedIn, use BYOK, and fix common issues." />
//       <meta property="og:type" content="website" />
//       <meta property="og:url" content="https://suitegenie.in/help" />
//       <meta property="og:image" content="https://suitegenie.in/og-help.png" />
//       <meta name="twitter:card" content="summary_large_image" />
//       <meta name="twitter:title" content="Help Center – SuiteGenie" />
//       <meta name="twitter:description" content="Find answers, quick start guides, and support for SuiteGenie. Learn how to connect Twitter and LinkedIn, use BYOK, and fix common issues." />
//       <meta name="twitter:image" content="https://suitegenie.in/og-help.png" />
//     </Helmet>
//     <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 text-base text-gray-800">
//       <h1 className="text-4xl font-extrabold mb-4 text-primary-700">Help Center</h1>
//       <p className="mb-8 text-lg text-gray-700 leading-relaxed">Need help with SuiteGenie? Start with the quick links below or reach out to support if you’re stuck.</p>

//       <div className="grid gap-6 md:grid-cols-2 mb-10">
//         <div className="bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-100 rounded-xl p-6 shadow-sm">
//           <h2 className="text-xl font-bold mb-3 text-primary-700">Quick Start</h2>
//           <ul className="space-y-2">
//             <li>👉 <a href="/docs#1-getting-started" className="text-blue-600 underline font-medium">Getting Started Guide</a></li>
//             <li>👉 <a href="/docs#2-connecting-social-accounts" className="text-blue-600 underline font-medium">Connect Twitter & LinkedIn</a></li>
//             <li>👉 <a href="/docs#1-2-get-your-openai-api-key-byok" className="text-blue-600 underline font-medium">Add Your OpenAI API Key (BYOK)</a></li>
//           </ul>
//         </div>
//         <div className="bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-100 rounded-xl p-6 shadow-sm">
//           <h2 className="text-xl font-bold mb-3 text-primary-700">Using SuiteGenie</h2>
//           <ul className="space-y-2">
//             <li>🐦 Tweet Genie basics – generating and scheduling tweets</li>
//             <li>💼 LinkedIn posts – formats that work best</li>
//             <li>📅 Bulk scheduling and calendar overview</li>
//           </ul>
//           <p className="mt-4 text-sm">All covered in <a href="/docs" className="text-blue-600 underline font-medium">full documentation</a>.</p>
//         </div>
//       </div>

//       <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm mb-10">
//         <h2 className="text-xl font-bold mb-3 text-primary-700">Common Issues</h2>
//         <ul className="space-y-2">
//           <li>OpenAI key errors (invalid / quota exceeded)</li>
//           <li>Posts not publishing on Twitter or LinkedIn</li>
//           <li>Analytics not showing expected data</li>
//         </ul>
//         <p className="mt-4 text-sm">Check the troubleshooting section in <a href="/docs#6-troubleshooting--faq" className="text-blue-600 underline font-medium">Docs</a>. If that doesn’t fix it, contact us.</p>
//       </div>

//       <div className="bg-gradient-to-br from-primary-100 to-purple-100 border border-primary-200 rounded-xl p-6 shadow-md text-center">
//         <h2 className="text-xl font-bold mb-3 text-primary-700">Contact Support</h2>
//         <ul className="space-y-2">
//           <li>Email: <strong>suitegenie1@gmail.com</strong></li>
//           <li>Twitter/X: <a href="https://x.com/Suitegenie" className="text-blue-600 underline font-medium" target="_blank" rel="noopener noreferrer">@Suitegenie</a></li>
//         </ul>
//         <p className="text-gray-600 mt-2">We usually reply within 24–48 hours on business days.</p>
//       </div>
//     </div>
//   </>
// );

// export default HelpPage;

import React from "react";
import { Helmet } from "react-helmet";

const HelpPage = () => (
  <>
    <Helmet>
      <title>Help Center – SuiteGenie</title>
      <meta name="description" content="Find answers, quick start guides, and support for SuiteGenie. Learn how to connect Twitter and LinkedIn, use BYOK, and fix common issues." />
      <link rel="canonical" href="https://suitegenie.in/help" />
      <meta property="og:title" content="Help Center – SuiteGenie" />
      <meta property="og:description" content="Find answers, quick start guides, and support for SuiteGenie. Learn how to connect Twitter and LinkedIn, use BYOK, and fix common issues." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://suitegenie.in/help" />
      <meta property="og:image" content="https://suitegenie.in/og-help.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Help Center – SuiteGenie" />
      <meta name="twitter:description" content="Find answers, quick start guides, and support for SuiteGenie. Learn how to connect Twitter and LinkedIn, use BYOK, and fix common issues." />
      <meta name="twitter:image" content="https://suitegenie.in/og-help.png" />
      {/* Structured Data: FAQPage */}
      <script type="application/ld+json">{`
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How do I get help with SuiteGenie?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Start with the quick links, docs, or contact support via email or Twitter."
              }
            },
            {
              "@type": "Question",
              "name": "How do I add my OpenAI API key?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Go to Settings → API Keys in your SuiteGenie dashboard and paste your key."
              }
            }
          ]
        }
      `}</script>
    </Helmet>
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 text-base text-gray-800" role="main">
      <h1 className="text-4xl font-extrabold mb-4 text-primary-700">SuiteGenie Help &amp; Documentation</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <a href="/features" className="text-blue-600 underline font-medium">Learn what SuiteGenie can do.</a>
        <span className="text-gray-400">|</span>
        <a href="/pricing" className="text-blue-600 underline font-medium">Choose a plan that fits you.</a>
      </div>
      <p className="mb-8 text-lg text-gray-700 leading-relaxed">Need help with SuiteGenie? Start with the quick links below or reach out to support if you’re stuck.</p>

      <div className="grid gap-6 md:grid-cols-2 mb-10">
        <div className="bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-3 text-primary-700">Quick Start</h2>
          <ul className="space-y-2">
            <li>👉 <a href="/docs#1-getting-started" className="text-blue-600 underline font-medium">Getting Started Guide</a></li>
            <li>👉 <a href="/docs#2-connecting-social-accounts" className="text-blue-600 underline font-medium">Connect Twitter & LinkedIn</a></li>
            <li>👉 <a href="/docs#1-2-get-your-openai-api-key-byok" className="text-blue-600 underline font-medium">Add Your OpenAI API Key (BYOK)</a></li>
          </ul>
        </div>
        <div className="bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-3 text-primary-700">Using SuiteGenie</h2>
          <ul className="space-y-2">
            <li>🐦 Tweet Genie basics – generating and scheduling tweets</li>
            <li>💼 LinkedIn posts – formats that work best</li>
            <li>📅 Bulk scheduling and calendar overview</li>
          </ul>
          <p className="mt-4 text-sm">All covered in <a href="/docs" className="text-blue-600 underline font-medium">full documentation</a>.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm mb-10">
        <h2 className="text-xl font-bold mb-3 text-primary-700">Common Issues</h2>
        <ul className="space-y-2">
          <li>OpenAI key errors (invalid / quota exceeded)</li>
          <li>Posts not publishing on Twitter or LinkedIn</li>
          <li>Analytics not showing expected data</li>
        </ul>
        <p className="mt-4 text-sm">Check the troubleshooting section in <a href="/docs#6-troubleshooting--faq" className="text-blue-600 underline font-medium">Docs</a>. If that doesn’t fix it, contact us.</p>
      </div>

      <div className="bg-gradient-to-br from-primary-100 to-purple-100 border border-primary-200 rounded-xl p-6 shadow-md text-center">
        <h2 className="text-xl font-bold mb-3 text-primary-700">Contact Support</h2>
        <ul className="space-y-2">
          <li>Email: <strong>suitegenie1@gmail.com</strong></li>
          <li>Twitter/X: <a href="https://x.com/Suitegenie" className="text-blue-600 underline font-medium" target="_blank" rel="noopener noreferrer">@Suitegenie</a></li>
        </ul>
        <p className="text-gray-600 mt-2">We usually reply within 24–48 hours on business days.</p>
      </div>
    </div>
  </>
);

export default HelpPage;
