
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
        {/* Primary Meta Tags */}
        <title>SuiteGenie (Suite Genie) | AI Content + Social Media Ops With Strategy and Cross-Posting</title>
        <meta name="title" content="SuiteGenie (Suite Genie) | AI Content + Social Media Ops With Strategy and Cross-Posting" />
        <meta name="description" content="SuiteGenie is not just a scheduler. Analyze your account and competitors, generate platform-specific content, manage your content queue, and cross-post across connected accounts." />
        <meta name="keywords" content="AI content ops, strategy builder, competitor analysis, content queue, cross-post automation, social media automation for creators, social media automation for agencies, Twitter automation, LinkedIn automation" />
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://suitegenie.in/" />
        <meta property="og:title" content="SuiteGenie (Suite Genie) | AI Content + Social Media Ops With Strategy and Cross-Posting" />
        <meta property="og:description" content="Analyze your account and competitors, generate platform-specific content, and run cross-posting workflows from one content queue." />
        <meta property="og:image" content="https://suitegenie.in/og-default.svg" />
        <meta property="og:site_name" content="SuiteGenie" />
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://suitegenie.in/" />
        <meta property="twitter:title" content="SuiteGenie (Suite Genie) | AI Content + Social Media Ops With Strategy and Cross-Posting" />
        <meta property="twitter:description" content="SuiteGenie helps power users and small agencies move from strategy and competitor analysis to queued cross-post publishing." />
        <meta property="twitter:image" content="https://suitegenie.in/og-default.svg" />
        <meta name="twitter:site" content="@Suitegenie1" />
        <meta name="twitter:creator" content="@Suitegenie1" />
        {/* Additional SEO Tags */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="language" content="English" />
        <meta name="author" content="Kanishk Saraswat" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        <link rel="canonical" href="https://suitegenie.in/" />
        {/* Structured Data / Schema Markup */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "SuiteGenie",
            "alternateName": ["Suite Genie", "SuiteGenie Platform"],
            "applicationCategory": "BusinessApplication",
            "applicationSubCategory": "AI Content and Social Media Operations",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "priceValidUntil": "2027-12-31"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "100"
            },
            "featureList": [
              "AI Content Generation",
              "Platform-Specific Content Engine",
              "Strategy Builder",
              "Competitor Analysis",
              "Content Queue",
              "Cross-Post Orchestration",
              "Multi-platform Scheduling",
              "Twitter Automation",
              "LinkedIn Automation",
              "WordPress Integration",
              "Analytics Dashboard",
              "BYOK Support",
              "Multi-AI Fallback"
            ],
            "screenshot": "https://suitegenie.in/og-default.svg",
            "author": {
              "@type": "Organization",
              "name": "SuiteGenie",
              "url": "https://suitegenie.in",
              "logo": "https://suitegenie.in/logo.svg",
              "sameAs": [
                "https://x.com/Suitegenie",
                "https://linkedin.com/company/suitegenie"
              ]
            },
            "description": "SuiteGenie, also searched as Suite Genie, is an AI content operations platform for creators, power users, and agencies. Analyze competitors, build strategy, generate platform-native content, queue, and cross-post."
          }
        `}</script>
        {/* Organization Schema */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "SuiteGenie",
            "alternateName": ["Suite Genie"],
            "url": "https://suitegenie.in",
            "logo": "https://suitegenie.in/logo.svg",
            "description": "AI content operations platform with strategy builder, competitor analysis, platform-specific generation, and cross-post workflows",
            "foundingDate": "2024",
            "founder": {
              "@type": "Person",
              "name": "Kanishk Saraswat",
              "url": "https://linkedin.com/in/kanishk-saraswat"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "suitegenie1@gmail.com",
              "contactType": "Customer Support"
            },
            "sameAs": [
              "https://x.com/Suitegenie",
              "https://linkedin.com/company/suitegenie"
            ],
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "IN"
            }
          }
        `}</script>
        {/* BreadcrumbList Schema */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://suitegenie.in"
              }
            ]
          }
        `}</script>
      </Helmet>
      <main className="min-h-screen bg-white" role="main">
        <p className="sr-only">
          SuiteGenie is also commonly searched as Suite Genie.
        </p>

        {/* ...existing code... */}

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

        {/* How It Works Flow */}
        <FadeInSection>
          <WorkflowSection />
        </FadeInSection>

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
