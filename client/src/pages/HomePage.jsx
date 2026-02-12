
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
        <title>SuiteGenie - AI Social Media Automation Tool | Free BYOK Platform for Creators</title>
        <meta name="title" content="SuiteGenie - AI Social Media Automation Tool | Free BYOK Platform for Creators" />
        <meta name="description" content="Automate Twitter, LinkedIn & WordPress content with AI. Generate, schedule & manage posts across platforms. $0 free plan with BYOK. Built in India for creators worldwide." />
        <meta name="keywords" content="AI social media automation, BYOK social media tool, Twitter automation, LinkedIn automation, WordPress automation, content scheduling, social media management, Buffer alternative, Hootsuite alternative" />
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://suitegenie.in/" />
        <meta property="og:title" content="SuiteGenie - AI Social Media Automation for Creators" />
        <meta property="og:description" content="Automate Twitter, LinkedIn & WordPress content with AI. $0 free plan with BYOK support." />
        <meta property="og:image" content="https://suitegenie.in/og-image.jpg" />
        <meta property="og:site_name" content="SuiteGenie" />
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://suitegenie.in/" />
        <meta property="twitter:title" content="SuiteGenie - AI Social Media Automation" />
        <meta property="twitter:description" content="Automate Twitter, LinkedIn & WordPress content with AI. $0 free plan with BYOK support." />
        <meta property="twitter:image" content="https://suitegenie.in/twitter-card.jpg" />
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
            "applicationCategory": "BusinessApplication",
            "applicationSubCategory": "Social Media Management",
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
              "Multi-platform Scheduling",
              "Twitter Automation",
              "LinkedIn Automation",
              "WordPress Integration",
              "Analytics Dashboard",
              "BYOK Support",
              "Multi-AI Fallback"
            ],
            "screenshot": "https://suitegenie.in/dashboard-screenshot.jpg",
            "author": {
              "@type": "Organization",
              "name": "SuiteGenie",
              "url": "https://suitegenie.in",
              "logo": "https://suitegenie.in/logo.png",
              "sameAs": [
                "https://x.com/Suitegenie",
                "https://linkedin.com/company/suitegenie"
              ]
            },
            "description": "AI-powered social media automation platform for creators. Generate, schedule, and manage content across Twitter, LinkedIn, and WordPress with BYOK support."
          }
        `}</script>
        {/* Organization Schema */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "SuiteGenie",
            "url": "https://suitegenie.in",
            "logo": "https://suitegenie.in/logo.png",
            "description": "AI social media automation platform for creators",
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
