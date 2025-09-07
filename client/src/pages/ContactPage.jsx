import React from 'react';

// --- Helper Components & Hooks for Animation ---

const useOnScreen = (options) => {
  const ref = React.useRef(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref, options]);

  return [ref, isVisible];
};

const AnimatedSection = ({ children, className = '' }) => {
  const [ref, isVisible] = useOnScreen({ threshold: 0.1, triggerOnce: true });
  return (
    <section
      ref={ref}
      className={`transition-all duration-1000 ease-in-out ${className} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {children}
    </section>
  );
};

// --- Main Contact Page Component ---

const App = () => {

  return (
    <div className="min-h-screen w-full bg-[#0f0f0f] text-white font-sans antialiased">
      <main className="overflow-hidden">
        
        {/* 🟣 1. Hero Section */}
        <AnimatedSection className="text-center px-6 py-16 md:py-24">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-400">
                💬 Get in Touch
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-3xl mx-auto">
                Whether you're a creator, startup, agency, or partner — we’re here to help. Drop us a line and we’ll respond within 24 hours.
            </p>
        </AnimatedSection>

        {/* 2. Contact Form & Info Section */}
        <AnimatedSection className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-start">
            {/* Form */}
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                <h2 className="text-3xl font-bold text-white mb-6">Send Us a Message</h2>
                <form className="space-y-6" onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  setError(null);
                  try {
                    // Simulate async action
                    await new Promise(res => setTimeout(res, 1200));
                    setLoading(false);
                    setSuccess(true);
                  } catch (err) {
                    setLoading(false);
                    setError('Something went wrong. Please try again.');
                  }
                }} aria-label="Contact form">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300">Full Name</label>
                    <input required type="text" id="name" name="name" className="mt-1 block w-full bg-black/30 border border-white/20 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 transition" aria-required="true" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
                    <input required type="email" id="email" name="email" className="mt-1 block w-full bg-black/30 border border-white/20 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 transition" aria-required="true" />
                  </div>
                  <div>
                    <label htmlFor="inquiry-type" className="block text-sm font-medium text-gray-300">How can we help?</label>
                    <select id="inquiry-type" name="inquiry-type" className="mt-1 block w-full bg-black/30 border border-white/20 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 transition" aria-required="true">
                      <option>General Inquiry</option>
                            <option>Need Custom Module</option>
                            <option>SEO / Dev Services</option>
                            <option>Report a Bug</option>
                            <option>Feedback</option>
                            <option>Partnership</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-300">Message</label>
                        <textarea required id="message" name="message" rows="4" className="mt-1 block w-full bg-black/30 border border-white/20 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 transition"></textarea>
                    </div>
                    <div>
                        <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg">
                            Send Message
                        </button>
                    </div>
                </form>
            </div>
            {/* Info */}
            <div className="space-y-8">
                <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
                    <div className="space-y-3 text-gray-300">
                        <p><strong className="text-cyan-400">Email:</strong> support@modularaihub.com</p>
                        <p><strong className="text-cyan-400">Twitter:</strong> @ModularAIHub</p>
                        <p><strong className="text-cyan-400">LinkedIn:</strong> Modular AI Hub</p>
                    </div>
                </div>
                
            </div>
        </AnimatedSection>

        {/* ❓ FAQ Section */}
        <AnimatedSection className="max-w-4xl mx-auto px-6 py-24">
            <h2 className="text-4xl text-white font-bold text-center mb-12">Common Questions</h2>
            <div className="space-y-4">
                <details className="bg-gray-800/30 p-4 rounded-lg border border-white/10 cursor-pointer group">
                    <summary className="font-semibold text-white flex justify-between items-center">
                        <span>How fast do you respond?</span>
                        <span className="text-cyan-400 transform transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="text-gray-400 mt-2 pt-2 border-t border-white/10">
                        Most messages are answered within 24 hours on business days. Pro plan users receive priority support.
                    </p>
                </details>
                <details className="bg-gray-800/30 p-4 rounded-lg border border-white/10 cursor-pointer group">
                    <summary className="font-semibold text-white flex justify-between items-center">
                        <span>Can I request a custom plan or credit model?</span>
                        <span className="text-cyan-400 transform transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="text-gray-400 mt-2 pt-2 border-t border-white/10">
                        Yes! We are happy to discuss custom plans for agencies or high-volume users. Please select "SEO / Dev Services" or "Partnership" in the form above and provide some details about your needs.
                    </p>
                </details>
            </div>
        </AnimatedSection>
      </main>
    </div>
  );
};

export default App;
