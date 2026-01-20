import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const PrivacyPage = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: January 21, 2026</p>

          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                SuiteGenie ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
                how we collect, use, disclose, and safeguard your information when you use our Service.
              </p>
              <p className="text-gray-700 mb-4">
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, 
                please do not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Personal Information</h3>
              <p className="text-gray-700 mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Name and email address (required for account creation)</li>
                <li>Password (stored securely using industry-standard encryption)</li>
                <li>Payment information (processed securely through Razorpay; we do not store payment details)</li>
                <li>Profile information you choose to provide</li>
                <li>API keys if you use the BYOK option (encrypted and stored securely)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Usage Information</h3>
              <p className="text-gray-700 mb-4">
                We automatically collect certain information about your device and how you interact with the Service:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Log data (IP address, browser type, operating system, referring URLs)</li>
                <li>Usage patterns (features used, content created, time spent on the Service)</li>
                <li>Device information (device type, unique device identifiers)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Content Information</h3>
              <p className="text-gray-700 mb-4">
                We store the content you create, schedule, and publish through the Service, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Social media posts and drafts</li>
                <li>AI-generated content</li>
                <li>Images and media files you upload</li>
                <li>Analytics and performance data for your published content</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Provide, maintain, and improve the Service</li>
                <li>Process transactions and send related information</li>
                <li>Send administrative information, updates, and security alerts</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, prevent, and address technical issues and security vulnerabilities</li>
                <li>Personalize and improve your experience</li>
                <li>Send marketing communications (with your consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How We Share Your Information</h2>
              <p className="text-gray-700 mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>Service Providers:</strong> We share information with third-party vendors who perform services 
                on our behalf (e.g., payment processing, hosting, analytics)</li>
                <li><strong>Third-Party Platforms:</strong> When you connect social media accounts, we share necessary 
                information with those platforms to publish content on your behalf</li>
                <li><strong>AI Service Providers:</strong> When using Platform Keys, your content prompts are sent to 
                AI providers (OpenAI, Anthropic, etc.) to generate content</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response 
                to valid legal requests</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Industry-standard encryption for data in transit (HTTPS/TLS)</li>
                <li>Secure password hashing using bcrypt</li>
                <li>Encrypted storage of API keys using AES-256 encryption</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure data centers with physical and network security</li>
              </ul>
              <p className="text-gray-700 mb-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot 
                guarantee absolute security of your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your personal information for as long as necessary to provide the Service and fulfill the 
                purposes outlined in this Privacy Policy. When you delete your account, we will delete or anonymize 
                your personal information, except where we are required to retain it for legal or regulatory purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Privacy Rights</h2>
              <p className="text-gray-700 mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Data Portability:</strong> Request a copy of your data in a machine-readable format</li>
                <li><strong>Objection:</strong> Object to our processing of your personal information</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for marketing communications</li>
              </ul>
              <p className="text-gray-700 mb-4">
                To exercise these rights, please contact us at privacy@suitegenie.in.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Maintain your session and keep you logged in</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze usage patterns and improve the Service</li>
                <li>Provide personalized content and features</li>
              </ul>
              <p className="text-gray-700 mb-4">
                You can control cookies through your browser settings. However, disabling cookies may affect the 
                functionality of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Third-Party Services</h2>
              <p className="text-gray-700 mb-4">
                The Service integrates with third-party platforms and services:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Social media platforms (Twitter, LinkedIn, WordPress)</li>
                <li>AI service providers (OpenAI, Anthropic, Google AI)</li>
                <li>Payment processor (Razorpay)</li>
                <li>Analytics providers</li>
              </ul>
              <p className="text-gray-700 mb-4">
                These third parties have their own privacy policies. We encourage you to review them.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                The Service is not intended for children under 13 years of age. We do not knowingly collect personal 
                information from children under 13. If you believe we have collected information from a child under 13, 
                please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your information may be transferred to and processed in countries other than your country of residence. 
                These countries may have data protection laws different from your jurisdiction. We ensure appropriate 
                safeguards are in place to protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you 
                to review this Privacy Policy periodically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions or concerns about this Privacy Policy, please contact us:
              </p>
              <p className="text-gray-700 mb-2">
                Email: <a href="mailto:privacy@suitegenie.in" className="text-blue-600 hover:text-blue-700 underline">privacy@suitegenie.in</a>
              </p>
              <p className="text-gray-700">
                Support: <a href="mailto:support@suitegenie.in" className="text-blue-600 hover:text-blue-700 underline">support@suitegenie.in</a>
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

export default PrivacyPage;
