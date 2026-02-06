import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/" className="inline-flex items-center group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mr-3 group-hover:shadow-lg transition-shadow duration-200">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">SuiteGenie</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: January 21, 2026</p>

          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using SuiteGenie ("Service"), you accept and agree to be bound by the terms and 
                provisions of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use License</h2>
              <p className="text-gray-700 mb-4">
                Permission is granted to temporarily access and use the Service for personal, non-commercial transitory 
                viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on SuiteGenie's platform</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-700 mb-4">
                When you create an account with us, you must provide accurate, complete, and up-to-date information. 
                Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your 
                account on our Service.
              </p>
              <p className="text-gray-700 mb-4">
                You are responsible for safeguarding the password that you use to access the Service and for any 
                activities or actions under your password.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. API Keys and Third-Party Services</h2>
              <p className="text-gray-700 mb-4">
                If you choose to use the "Bring Your Own Keys" (BYOK) option, you are responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Obtaining and maintaining valid API keys from third-party services</li>
                <li>Complying with the terms of service of those third-party providers</li>
                <li>Any costs associated with API usage from third-party providers</li>
                <li>Securing your API keys and preventing unauthorized access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Credits and Payments</h2>
              <p className="text-gray-700 mb-4">
                Credits are used to access AI-powered features when using Platform Keys. Credits are non-refundable 
                once purchased. Unused credits do not expire but may be subject to account inactivity policies.
              </p>
              <p className="text-gray-700 mb-4">
                All payments are processed securely through our payment provider (Razorpay). We do not store your 
                payment information on our servers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Subscriptions and Plans</h2>
              <p className="text-gray-700 mb-4">
                {/* Teams plan is currently free. When paid plans are introduced, trial periods may apply. */}
                Teams plan provides full access to collaboration features. You may use the service according to the limits of your plan.
              </p>
              <p className="text-gray-700 mb-4">
                Subscriptions automatically renew unless canceled before the renewal date. Refunds are available 
                within 30 days of purchase if you are not satisfied with the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Content and Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                You retain all rights to the content you create using our Service. By using SuiteGenie, you grant us 
                a limited license to store, process, and display your content solely for the purpose of providing 
                the Service.
              </p>
              <p className="text-gray-700 mb-4">
                AI-generated content is provided as-is. You are responsible for reviewing and editing all AI-generated 
                content before publishing. We are not liable for the accuracy, appropriateness, or originality of 
                AI-generated content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Prohibited Uses</h2>
              <p className="text-gray-700 mb-4">
                You may not use the Service:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To submit false or misleading information</li>
                <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                In no event shall SuiteGenie or its suppliers be liable for any damages (including, without limitation, 
                damages for loss of data or profit, or due to business interruption) arising out of the use or inability 
                to use the Service, even if SuiteGenie or a SuiteGenie authorized representative has been notified 
                orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason 
                whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use 
                the Service will immediately cease.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will 
                try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a 
                material change will be determined at our sole discretion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="text-gray-700">
                Email: <a href="mailto:support@suitegenie.in" className="text-blue-600 hover:text-blue-700 underline">support@suitegenie.in</a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsPage;
