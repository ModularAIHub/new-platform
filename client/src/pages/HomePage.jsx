
import { Helmet } from 'react-helmet';
import Footer from '../components/Footer';

// Import homepage components
import FadeInSection from '../components/homepage/FadeInSection';
import HeroSection from '../components/homepage/HeroSection';
import FeaturesSection from '../components/homepage/FeaturesSection';
import TabbedFeaturesSection from '../components/homepage/TabbedFeaturesSection';
import WorkflowSection from '../components/homepage/WorkflowSection';
import TestimonialsSection from '../components/homepage/TestimonialsSection';
// import PricingSection from '../components/homepage/PricingSection';
import ComparisonSection from '../components/homepage/ComparisonSection';
import CTASection from '../components/homepage/CTASection';

const HomePage = () => {

  return (
    <>
      <Helmet>
        <title>SuiteGenie – AI Social Media Automation for Creators</title>
        <meta name="description" content="SuiteGenie helps solo founders and creators automate Twitter and LinkedIn with AI content generation, BYOK cost savings, analytics and bulk scheduling." />
        <link rel="canonical" href="https://suitegenie.in/" />
        {/* Open Graph & Twitter */}
        <meta property="og:title" content="SuiteGenie – AI Social Media Automation for Creators" />
        <meta property="og:description" content="Automate Twitter & LinkedIn with AI. Bulk scheduling, analytics, BYOK, and more. Save time and money with SuiteGenie." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://suitegenie.in/" />
        <meta property="og:image" content="https://suitegenie.in/og-home.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SuiteGenie – AI Social Media Automation for Creators" />
        <meta name="twitter:description" content="Automate Twitter & LinkedIn with AI. Bulk scheduling, analytics, BYOK, and more. Save time and money with SuiteGenie." />
        <meta name="twitter:image" content="https://suitegenie.in/og-home.png" />
        {/* Structured Data: Organization, Website, Product */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "SuiteGenie",
            "url": "https://suitegenie.in/",
            "logo": "https://suitegenie.in/logo.png",
            "sameAs": [
              "https://twitter.com/suitegenieai",
              "https://www.linkedin.com/company/suitegenie/"
            ]
          }
        `}</script>
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "url": "https://suitegenie.in/",
            "name": "SuiteGenie",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://suitegenie.in/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }
        `}</script>
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "SuiteGenie",
            "image": "https://suitegenie.in/og-home.png",
            "description": "AI-powered social media automation for Twitter and LinkedIn. BYOK, analytics, bulk scheduling, and more.",
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
      <main className="min-h-screen bg-white" role="main">

        {/* SEO H1 and Internal Links */}
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-4 text-center">
          <h1 className="text-4xl font-extrabold mb-4 text-primary-700">AI Social Media Automation for Creators and Founders</h1>
          <div className="flex flex-wrap justify-center gap-4 mb-2">
            <a href="/features" className="text-blue-600 underline font-medium">See all features</a>
            <span className="text-gray-400">|</span>
            <a href="/pricing" className="text-blue-600 underline font-medium">View pricing</a>
          </div>
        </div>

        {/* Hero Section */}
        <FadeInSection>
          <HeroSection />
        </FadeInSection>

        {/* Accessible Features Section */}
        <FadeInSection>
          <FeaturesSection />
        </FadeInSection>

        {/* Discover Features with Tabs */}
        <FadeInSection>
          <TabbedFeaturesSection />
        </FadeInSection>

        {/* Revolutionize Your Workflow section removed to avoid redundancy with TabbedFeaturesSection */}

        {/* Trusted by Families and Small Business */}
        {/* <FadeInSection>
          <TestimonialsSection />
        </FadeInSection> */}

        {/* Pricing Section removed: now only on dedicated page */}

        {/* Platform Comparison Section */}
        <FadeInSection>
          <ComparisonSection />
        </FadeInSection>

        {/* Supercharge your team's productivity today! */}
        <FadeInSection>
          <CTASection />
        </FadeInSection>

      </main>
      <Footer />
    </>
  );
};

export default HomePage;
