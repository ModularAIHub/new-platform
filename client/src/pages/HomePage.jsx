import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FadeInSection from '../components/FadeInSection';
import FeatureAccordion from '../components/FeatureAccordion';
import Footer from '../components/Footer';

const modules = [
  {
    name: 'Twitter Genie',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="h-10 w-10 mx-auto mb-2"><circle cx="16" cy="16" r="16" fill="#1DA1F2"/><path d="M22.46 12.46c.01.15.01.31.01.46 0 4.66-3.55 10.04-10.04 10.04-2 0-3.86-.59-5.43-1.61.28.03.56.05.85.05 1.66 0 3.19-.57 4.41-1.53-1.55-.03-2.86-1.05-3.31-2.45.22.04.44.07.67.07.32 0 .63-.04.93-.12-1.62-.33-2.84-1.76-2.84-3.48v-.04c.48.27 1.03.44 1.62.46-.96-.64-1.59-1.73-1.59-2.97 0-.65.17-1.26.47-1.78 1.71 2.1 4.27 3.48 7.16 3.63-.06-.26-.09-.53-.09-.81 0-1.95 1.58-3.53 3.53-3.53 1.02 0 1.94.43 2.59 1.13.81-.16 1.57-.46 2.25-.87-.27.85-.85 1.56-1.6 2.01.72-.09 1.41-.28 2.05-.57-.48.72-1.08 1.35-1.77 1.85z" fill="#fff"/></svg>
    ),
    desc: 'Generate, schedule, and analyze tweets & threads.'
  },
  {
    name: 'LinkedIn Genie',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="h-10 w-10 mx-auto mb-2"><circle cx="16" cy="16" r="16" fill="#0077B5"/><rect x="10" y="13" width="2" height="7" fill="#fff"/><rect x="15" y="13" width="2" height="7" fill="#fff"/><rect x="20" y="13" width="2" height="7" fill="#fff"/><circle cx="11" cy="11" r="1" fill="#fff"/></svg>
    ),
    desc: 'Bulk post, edit, and schedule LinkedIn content.'
  },
  {
    name: 'WordPress Genie',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="h-10 w-10 mx-auto mb-2"><circle cx="16" cy="16" r="16" fill="#21759B"/><path d="M16 8a8 8 0 100 16 8 8 0 000-16zm0 1.5a6.5 6.5 0 016.5 6.5c0 2.13-1.04 4.02-2.65 5.19l-2.85-7.8c-.13-.36-.47-.59-.85-.59-.38 0-.72.23-.85.59l-2.85 7.8A6.5 6.5 0 0116 9.5zm-1.5 1.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm3 0c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5z" fill="#fff"/></svg>
    ),
    desc: 'Automate WordPress publishing and scheduling.'
  }
];

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <>
    <section className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
      <h1 className="text-5xl font-extrabold mb-4 text-blue-700 drop-shadow">Welcome to Autoverse</h1>
      <p className="text-xl text-gray-700 mb-8">Automate your content, not your creativity.</p>
      <div className="flex flex-wrap justify-center gap-8 mb-10">
        {modules.map((mod) => (
          <div key={mod.name} className="bg-white rounded-2xl shadow-lg p-8 w-72 flex flex-col items-center hover:scale-[1.04] hover:shadow-2xl transition-all duration-200">
            {mod.icon}
            <h2 className="font-bold text-lg mb-2 text-gray-800">{mod.name}</h2>
            <p className="text-gray-500 text-sm mb-2">{mod.desc}</p>
          </div>
        ))}
      </div>
      <button
        onClick={handleCTA}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-xl transition disabled:opacity-50"
      >
        Get Started
      </button>
        
        {/* Section Divider */}
        <div className="w-full flex justify-center my-12">
          <div className="w-32 h-1 rounded-full bg-gradient-to-r from-cyan-400 via-white to-cyan-400 opacity-60"></div>
        </div>

        {/* Features Card Section */}
        <FadeInSection>
          <section className="w-full px-4 py-12">
            <h2 className="text-4xl font-bold text-white text-center mb-12 tracking-tight">Why Creators Love Our Platform</h2>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 bg-white/5 backdrop-blur-md rounded-3xl p-10 border border-cyan-400/30 shadow-2xl">
              <div className="flex flex-col items-start p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg min-h-[220px] animate-fadein-up delay-100">
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">One Dashboard, Every Channel</h3>
                <p className="text-gray-200 text-base leading-relaxed">
                  Access a growing library of purpose-built modules for your favorite social media platforms, blogs, and content channels. <span className="font-semibold text-cyan-300">Replace at least 4 separate tool subscriptions</span> and consolidate your entire workflow.
                </p>
              </div>
              <div className="flex flex-col items-start p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg min-h-[220px] animate-fadein-up delay-200">
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Always On, Never Offline</h3>
                <p className="text-gray-200 text-base leading-relaxed">
                  Our intelligent multi-AI fallback engine automatically routes your request to the fastest, most reliable model—ensuring <span className="font-semibold text-cyan-300">99.9% uptime</span> for your content generation so you never hit a dead end.
                </p>
              </div>
              <div className="flex flex-col items-start p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg min-h-[220px] animate-fadein-up delay-300">
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Your Voice, Amplified</h3>
                <p className="text-gray-200 text-base leading-relaxed">
                  Launch the right module for the job. We understand the unique nuances of every content format, from snappy social updates to in-depth, SEO-optimized articles. <span className="font-semibold text-cyan-300">Your unique brand will always shine through.</span>
                </p>
              </div>
              <div className="flex flex-col items-start p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg min-h-[220px] animate-fadein-up delay-400">
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Built for Growth</h3>
                <p className="text-gray-200 text-base leading-relaxed">
                  Each module is designed to streamline your workflow, from bulk scheduling and analytics to encrypted API-key management. <span className="font-semibold text-cyan-300">Scale from solo creator to full agency</span> with tools built for efficiency.
                </p>
              </div>
            </div>
          </section>
        </FadeInSection>

        {/* Section Divider */}
        <div className="w-full flex justify-center my-16">
          <div className="w-24 h-1 rounded-full bg-gradient-to-r from-cyan-400 via-white to-cyan-400 opacity-60"></div>
        </div>

        {/* Deep Dive Section: Problem, Solution, Comparison, Features */}
        <FadeInSection>
          <section className="w-full max-w-5xl mx-auto mb-16 p-12 bg-white/10 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-2xl text-white">
            <h2 className="text-4xl font-extrabold mb-8 text-center tracking-tight">Tired of the Content Treadmill?</h2>
            <p className="text-xl mb-8 text-center leading-relaxed">
              We get it. The <span className="font-semibold text-cyan-300">average creator spends over 10 hours a week just managing the logistics of content</span>. Today's tools promise to help, but they often create more work by forcing you into a fragmented and inefficient workflow.
            </p>
            <p className="text-xl mb-12 text-center font-bold text-cyan-200">
              We built this platform to fix that.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-14">
              <div className="bg-white/10 rounded-2xl p-8 flex flex-col items-center min-h-[200px] shadow-lg">
                <span className="text-4xl mb-3">😩</span>
                <h3 className="font-bold mb-3 text-2xl text-cyan-300 tracking-tight">The Old Way</h3>
                <p className="text-gray-200 text-base text-center leading-relaxed">
                  Juggling separate apps for ideas (ChatGPT), images (Canva), and scheduling (Hootsuite). It's slow, expensive, and error-prone.
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl p-8 flex flex-col items-center min-h-[200px] shadow-lg">
                <span className="text-4xl mb-3">✅</span>
                <h3 className="font-bold mb-3 text-2xl text-cyan-300 tracking-tight">The New Way</h3>
                <p className="text-gray-200 text-base text-center leading-relaxed">
                  One platform, powerful modules. Choose your channel, generate optimized content, and schedule your posts, saving <span className="font-semibold text-cyan-300">₹8,000–₹25,000/month</span> on tool subscriptions.
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl p-8 flex flex-col items-center min-h-[200px] shadow-lg">
                <span className="text-4xl mb-3">✨</span>
                <h3 className="font-bold mb-3 text-2xl text-cyan-300 tracking-tight">The Result</h3>
                <p className="text-gray-200 text-base text-center leading-relaxed">
                  Save hours every week, publish higher-quality content that engages your audience, and get back to focusing on your core business.
                </p>
              </div>
            </div>

            <h3 className="text-3xl font-extrabold mb-6 mt-14 text-center tracking-tight text-white">
              The Core Problem: A Workflow Stuck in the Past
            </h3>
            <ul className="list-disc pl-8 text-gray-200 mb-12 space-y-3 text-lg">
              <li>
                <b>Tool Sprawl:</b> You're forced to switch between separate apps, costing you 5-10 hours of productive time every single week.
              </li>
              <li>
                <b>Provider Lock-In:</b> You're dependent on a single, costly AI provider whose retail prices can be 2-5x higher than direct API costs.
              </li>
              <li>
                <b>Clunky Automation:</b> Most tools offer basic scheduling but lack
                true end-to-end automation, leaving you to handle the most
                time-consuming steps manually.
              </li>
              <li>
                <b>Manual Errors:</b> Every time you copy, paste, and reformat content
                between platforms, you introduce the risk of errors, slowing down
                delivery and damaging your brand's consistency.
              </li>
            </ul>

            {/* Features Accordion + Visual Preview Section (interactive, single instance) */}
            {(() => {
              const features = [
                {
                  title: "Unmatched Reliability via Multi-LLM Fallback",
                  desc: "Our system automatically routes requests between AI providers (like Perplexity, OpenAI, and Gemini) to ensure you are never offline.",
                  img: "/fallback mechanism.png",
                },
                {
                  title: "Beyond Scheduling: Real Automation",
                  desc: "Go beyond simple scheduling. Our platform offers dedicated modules for bulk content generation, integrated AI image creation, post history tracking, and more.",
                  img: "/automation.png",
                },
                {
                  title: "Total Control & Cost Savings",
                  desc: "We are the only platform that allows you to bring your own API key, allowing you to reduce your AI generation costs by up to 80%. You get full control and maximum savings.",
                  img: "/total cost saving.png",
                },
                {
                  title: "Secure by Design",
                  desc: "Your keys are your own. We use state-of-the-art encryption to ensure your data and content remain private and secure.",
                  img: "/secure.png",
                },
                {
                  title: "Personalized LLM (Coming Soon)",
                  desc: (
                    <>
                      <strong>Coming Soon: Our Own AI Model</strong><br />
                      We’re excited to announce that soon we’ll be rolling out our own Large Language Model (LLM) purpose-built for content creators.<br /><br />
                      Our LLM will be optimized for:
                      <ul className="list-disc pl-6 mb-2">
                        <li>Twitter content & viral captions</li>
                        <li>LinkedIn posts & articles</li>
                        <li>WordPress & normal blogs</li>
                        <li>SEO-optimized writing</li>
                        <li>Real-time data integration</li>
                      </ul>
                      Stay tuned for a new era of AI-powered content generation—faster, smarter, and tailored for your needs.
                    </>
                  ),
                  img: "/own llm updated.png",
                },
              ];
              const [openIndex, setOpenIndex] = React.useState(null);
              return (
                <section className="flex flex-col md:flex-row gap-8 items-start justify-center w-full max-w-6xl mx-auto py-12">
                  {/* Left: Accordion */}
                  <div className="flex-1 min-w-[300px]">
                    <h3 className="text-2xl font-bold mb-6 text:white">The Features You've Been Missing</h3>
                    <FeatureAccordion
                      features={features}
                      openIndex={openIndex}
                      setOpenIndex={setOpenIndex}
                    />
                  </div>
                  {/* Right: Visual Preview */}
                  <div className="flex-1 flex items:center justify-center min-w-[300px]">
                    <img
                      src={
                        openIndex === null
                          ? "/summarized.png"
                          : features[openIndex]?.img || "/dashboard-preview.png"
                      }
                      alt="Feature Preview"
                      className="rounded-xl shadow-lg w-full max-w-md border border-white/10 transition-all duration-500"
                    />
                  </div>
                </section>
              );
            })()}

            <div className="text-center mt-16 mb-8">
              <span className="text-2xl font-bold text-white">
                Stop Juggling Tabs. Start Building Your Brand.
              </span>
              <p className="text-xl text-white mt-4">
                Creating content shouldn’t feel like assembling a puzzle.
              </p>
              <p className="text-lg text-gray-200 mt-2">
                Launch the right module for the job. Let us handle the busywork. You stay focused on growth, creativity, and strategy.
              </p>
            </div>

          </section>
        </FadeInSection>

        {/* Section Divider */}
        <div className="w-full flex justify-center my-20">
          <div className="w-24 h-1 rounded-full bg-gradient-to-r from-cyan-400 via-white to-cyan-400 opacity-60"></div>
        </div>

        {/* Final CTA Section */}
        <FadeInSection>
          <div className="w-full flex flex-col items-center justify-center ">
            <div className="backdrop-blur-md rounded-3xl px-12 py-14 border-2 border-cyan-400/40 shadow-2xl max-w-2xl text-center">
              <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight">Ready to Get Started?</h2>
              <p className="text-2xl text-white mb-8 leading-relaxed">
                Elevate your content game with our free tier <span className="font-bold text-cyan-400">25 tokens</span> with built-in AI calls, plus <span className="font-bold text-cyan-400">75 tokens</span> with your own API keys.
              </p>
              <a
                href="/signup"
                className="inline-block bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-12 py-5 rounded-2xl text-2xl transition-all shadow-xl"
              >
                Get Started &rarr;
              </a>
            </div>
          </div>
        </FadeInSection>
    </section>
        <Footer />
        </>
  );
};

export default HomePage;
