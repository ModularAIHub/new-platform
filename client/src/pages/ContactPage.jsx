import { useState, useEffect } from 'react';
import { MapPin, Mail, Clock, Send, MessageCircle, Zap, Users, HeadphonesIcon } from 'lucide-react';
import Footer from '../components/Footer';
import { Button, Input, Card, CardContent } from '../components/ui';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [csrfToken, setCsrfToken] = useState(null);

  // Fetch CSRF token on component mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/csrf-token`, {
          credentials: 'include'
        });
        const data = await response.json();
        setCsrfToken(data.csrfToken);
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    };
    fetchCsrfToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/contact`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSubmitStatus('success');
        setFormData({ firstName: '', lastName: '', subject: '', phone: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (err) {
      setSubmitStatus('error');
    }
    setIsSubmitting(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-purple-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-purple-600/10"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
              <MessageCircle className="w-4 h-4" />
              Get in Touch
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Let's Build Something Amazing Together
            </h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed">
              Have questions about SuiteGenie? Need help getting started? Our team is here to help you automate your content creation journey.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Contact Form */}
          <Card variant="elevated" className="p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Send us a message</h2>
              <p className="text-neutral-600">Fill out the form below and our team will get back to you within 24 hours.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {submitStatus === 'success' && (
                <div className="bg-green-100 text-green-800 rounded-lg px-4 py-3 mb-2 text-center font-medium">Your message has been sent! We'll get back to you soon.</div>
              )}
              {submitStatus === 'error' && (
                <div className="bg-red-100 text-red-800 rounded-lg px-4 py-3 mb-2 text-center font-medium">Failed to send message. Please try again later.</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="First Name"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Your first name"
                  required
                />
                <Input
                  label="Last Name"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Your last name"
                  required
                />
              </div>
              
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />

              <Input
                label="Subject"
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="What's this about?"
                required
              />

              <Input
                label="Phone Number (Optional)"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
              />

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  placeholder="Tell us more about your project or question..."
                  required
                ></textarea>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                icon={<Send className="w-5 h-5" />}
                iconPosition="left"
              >
                {isSubmitting ? 'Sending Message...' : 'Send Message'}
              </Button>
            </form>
          </Card>

          {/* Contact Info & Map */}
          <div className="space-y-8">
            {/* Contact Information */}
            <Card variant="elevated" className="p-8">
              <h3 className="text-2xl font-bold text-neutral-900 mb-6">Get in touch</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-neutral-900">suitegenie1@gmail.com</h4>
                    <p className="text-neutral-600">Email us for general inquiries and support</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-neutral-900">India</h4>
                    <p className="text-neutral-600">Serving creators worldwide</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <HeadphonesIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-neutral-900">24/7 Support</h4>
                    <p className="text-neutral-600">We're here to help whenever you need us</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Contact Options */}
            <Card variant="elevated" className="p-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-4">Quick Help</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-primary-50 rounded-lg p-4 text-center">
                  <Zap className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-neutral-900 mb-1">Getting Started</h4>
                  <p className="text-sm text-neutral-600">New to SuiteGenie? We'll help you get set up</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-neutral-900 mb-1">Enterprise</h4>
                  <p className="text-sm text-neutral-600">Custom solutions for larger teams</p>
                </div>
              </div>
            </Card>

            {/* FAQ Section */}
            <Card variant="elevated" className="p-8">
              <h3 className="text-2xl font-bold text-neutral-900 mb-6">Frequently Asked Questions</h3>
              
              <div className="space-y-4">
                <div className="border-b border-neutral-200 pb-4">
                  <h4 className="font-semibold text-neutral-900 mb-2">How quickly can I get started?</h4>
                  <p className="text-neutral-600 text-sm">You can sign up and start creating content within minutes. Our onboarding process is designed to get you up and running fast.</p>
                </div>
                
                <div className="border-b border-neutral-200 pb-4">
                  <h4 className="font-semibold text-neutral-900 mb-2">Do you support BYOK (Bring Your Own Keys)?</h4>
                  <p className="text-neutral-600 text-sm">Yes! You can use your own OpenAI, Gemini, or Perplexity API keys for maximum control and cost efficiency.</p>
                </div>
                
                <div className="border-b border-neutral-200 pb-4">
                  <h4 className="font-semibold text-neutral-900 mb-2">What platforms do you support?</h4>
                  <p className="text-neutral-600 text-sm">Currently we support Twitter/X and LinkedIn, with more platforms coming soon including WordPress.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-2">Is there a free trial?</h4>
                  <p className="text-neutral-600 text-sm">Yes! You can start creating content for free and explore all our features before upgrading to a paid plan.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ContactPage;
