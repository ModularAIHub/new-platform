import React, { useState } from 'react';

const FAQAboutSection = () => {
  const [openFAQ, setOpenFAQ] = useState(0);

  const faqs = [
    {
      question: "How does SaaS differ from traditional software installations?",
      answer: "SaaS (Software as a Service) is cloud-based software that you access through a web browser, eliminating the need for installation, maintenance, or updates on your device. Unlike traditional software, SaaS is always up-to-date, accessible from anywhere, and typically offered on a subscription basis with lower upfront costs."
    },
    {
      question: "Can you explain the pricing models commonly?",
      answer: "We offer flexible pricing models including freemium (basic features free), subscription tiers (monthly/annual), usage-based pricing, and custom enterprise solutions. Our pricing scales with your needs, ensuring you only pay for what you use while providing transparent, predictable costs."
    },
    {
      question: "How does SaaS differ from traditional software installations?",
      answer: "Our platform offers superior scalability, automatic updates, enhanced security, and seamless integration capabilities. We provide 24/7 support, regular feature updates, and ensure your data is always backed up and accessible from any device, anywhere in the world."
    },
    {
      question: "What are the key benefits?",
      answer: "Key benefits include reduced IT costs, automatic updates and maintenance, enhanced collaboration, improved accessibility, robust security, scalable resources, and the ability to focus on your core business while we handle the technical infrastructure."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? -1 : index);
  };

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-gray-900 mb-6">
            Common Questions & Answers
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </h3>
                <div className={`flex-shrink-0 transform transition-transform duration-200 ${
                  openFAQ === index ? 'rotate-180' : ''
                }`}>
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openFAQ === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="px-8 pb-6">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQAboutSection;
