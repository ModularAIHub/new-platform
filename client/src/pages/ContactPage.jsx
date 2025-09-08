import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from 'lucide-react';
import Footer from '../components/Footer';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    subject: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    // Reset form or show success message
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
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Contact with us
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Creating a pricing plan for a social media analytics website requires careful consideration of 
              various features, target audience, and competitive landscape.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Send us a message</h2>
              <p className="text-gray-600">Fill up the form and our team will get back to you within 24 hours.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Your first name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Your Last name"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Your subject"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Your phone number"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to discuss?
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Write your message"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-500/50 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Submit
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Info & Map */}
          <div className="space-y-8">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Get in touch</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">+1 432 1234 254</h4>
                    <p className="text-gray-600">Call us for immediate support</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">shahin364@edu.bd</h4>
                    <p className="text-gray-600">Email us for general inquiries</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">105 Street, Seattle-US</h4>
                    <p className="text-gray-600">Visit our office headquarters</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">Mon-Fri: 9AM-6PM</h4>
                    <p className="text-gray-600">We're available during business hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* World Map */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <MessageCircle className="h-6 w-6 text-blue-600 mr-2" />
                Send us a message
              </h3>
              <p className="text-gray-600 mb-6">
                Fill up the form and our team will get back to you within 24 hours.
              </p>
              
              {/* World Map SVG */}
              <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-purple-100/50"></div>
                <div className="relative">
                  <svg className="w-full h-48" viewBox="0 0 800 400" fill="none">
                    {/* World Map Silhouette */}
                    <path
                      d="M158 206c0-3 2-5 5-5h25c3 0 5 2 5 5v18c0 3-2 5-5 5h-25c-3 0-5-2-5-5v-18z"
                      fill="#3B82F6"
                      opacity="0.6"
                    />
                    {/* North America */}
                    <path
                      d="M100 120c30-10 60-5 80 10 15 10 25 25 20 40-5 20-25 30-45 25-25-5-45-25-50-50-2-8-3-16-5-25z"
                      fill="#6366F1"
                      opacity="0.7"
                    />
                    {/* Europe */}
                    <path
                      d="M380 140c20-5 35 5 45 20 8 12 10 26 5 38-8 15-25 20-40 15-18-6-28-22-25-40 2-12 8-23 15-33z"
                      fill="#8B5CF6"
                      opacity="0.6"
                    />
                    {/* Asia */}
                    <path
                      d="M520 160c40-8 75 10 90 35 12 20 8 45-10 60-20 18-50 15-70-5-25-25-30-60-10-90z"
                      fill="#3B82F6"
                      opacity="0.8"
                    />
                    {/* Australia */}
                    <path
                      d="M580 280c15-3 28 3 35 15 5 8 4 18-2 25-8 10-22 10-30 2-10-10-8-25-3-42z"
                      fill="#6366F1"
                      opacity="0.6"
                    />
                    {/* South America */}
                    <path
                      d="M220 250c18-8 35-2 45 15 8 15 5 32-8 42-15 12-35 8-45-8-12-18-8-40 8-49z"
                      fill="#8B5CF6"
                      opacity="0.7"
                    />
                    {/* Africa */}
                    <path
                      d="M400 200c25-5 45 8 50 25 5 20-5 40-20 50-18 12-40 5-50-15-12-22-5-45 20-60z"
                      fill="#3B82F6"
                      opacity="0.6"
                    />
                    
                    {/* Location Pins */}
                    <circle cx="200" cy="150" r="4" fill="#EF4444" className="animate-pulse" />
                    <circle cx="420" cy="160" r="4" fill="#EF4444" className="animate-pulse" />
                    <circle cx="560" cy="180" r="4" fill="#EF4444" className="animate-pulse" />
                    
                    {/* Connection Lines */}
                    <line x1="200" y1="150" x2="420" y2="160" stroke="#3B82F6" strokeWidth="2" opacity="0.4" strokeDasharray="5,5" className="animate-pulse" />
                    <line x1="420" y1="160" x2="560" y2="180" stroke="#3B82F6" strokeWidth="2" opacity="0.4" strokeDasharray="5,5" className="animate-pulse" />
                  </svg>
                  
                  {/* Statistics */}
                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">50+</div>
                      <div className="text-sm text-gray-600">Countries</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3">
                      <div className="text-2xl font-bold text-purple-600">10k+</div>
                      <div className="text-sm text-gray-600">Users</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">24/7</div>
                      <div className="text-sm text-gray-600">Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ContactPage;
