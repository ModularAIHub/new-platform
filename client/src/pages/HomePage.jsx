
import { Helmet } from 'react-helmet';
import Footer from '../components/Footer';

// Import homepage components
import FadeInSection from '../components/homepage/FadeInSection';
import HeroSection from '../components/homepage/HeroSection';
import FeaturesSection from '../components/homepage/FeaturesSection';
import TabbedFeaturesSection from '../components/homepage/TabbedFeaturesSection';
import WorkflowSection from '../components/homepage/WorkflowSection';
// import PricingSection from '../components/homepage/PricingSection';
import ComparisonSection from '../components/homepage/ComparisonSection';
import CTASection from '../components/homepage/CTASection';

const HomePage = () => {

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>SuiteGenie | AI Social Media Operating System for Indian Creators and Agencies</title>
        <meta name="title" content="SuiteGenie | AI Social Media Operating System for Indian Creators and Agencies" />
        <meta name="description" content="Run strategy, generation, client approvals, publishing, and workspace-aware social media operations with INR-friendly pricing and BYOK multi-LLM support." />
        <meta name="keywords" content="AI social media software India, agency approval portal, BYOK social media AI, Indian social media automation, LinkedIn automation, Twitter automation, Threads automation" />
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://suitegenie.in/" />
        <meta property="og:title" content="SuiteGenie | AI Social Media Operating System for Indian Creators and Agencies" />
        <meta property="og:description" content="Run client approvals, brand-aware generation, publishing, and BYOK workflows inside one calmer social media operating system." />
        <meta property="og:image" content="https://suitegenie.in/og-default.svg" />
        <meta property="og:site_name" content="SuiteGenie" />
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://suitegenie.in/" />
        <meta property="twitter:title" content="SuiteGenie | AI Social Media Operating System for Indian Creators and Agencies" />
        <meta property="twitter:description" content="Run AI generation, no-login approvals, publishing, and workspace-aware social ops with INR-friendly pricing." />
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
            "applicationSubCategory": "AI Social Media Operations",
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
              "Client Approval Portal",
              "Agency Workspaces",
              "BYOK Multi-LLM",
              "Brand Context Automation",
              "Multi-platform Publishing",
              "Twitter Automation",
              "LinkedIn Automation",
              "Threads Workflow",
              "Client Onboarding Links"
            ],
            "screenshot": "https://suitegenie.in/og-default.svg",
            "author": {
              "@type": "Organization",
              "name": "SuiteGenie",
              "url": "https://suitegenie.in",
              "logo": "https://suitegenie.in/suitegenie-logo.png",
              "sameAs": [
                "https://x.com/Suitegenie",
                "https://linkedin.com/company/suitegenie"
              ]
            },
            "description": "SuiteGenie, also searched as Suite Genie, is an AI social media operating system for creators, power users, and agencies. Manage workspaces, approvals, brand-aware generation, and multi-platform publishing in one place."
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
            "logo": "https://suitegenie.in/suitegenie-logo.png",
            "description": "AI social media operating system with agency workspaces, client approvals, BYOK multi-LLM, platform-specific generation, and publishing workflows",
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
