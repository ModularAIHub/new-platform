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
import Agency from './Agency';
// import AgencyPreviewSection from './AgencyPreviewSection';

const HomePage = () => {

  return (
    <>
      <main className="min-h-screen bg-white">
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

            {/* <FadeInSection>
              <AgencyPreviewSection />
            </FadeInSection> */}

      </main>
      <Footer />
    </>
  );
};

export default HomePage;
