
import React from "react";
import { Helmet } from "react-helmet";
import Footer from '../components/Footer';

// A simple hook for detecting when an element is in view to trigger animations
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

// Animated Section Wrapper Component for smooth fade-in-up animations
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

const RoadmapSection = () => {
  const roadmapItems = [
    { title: "Tweet Genie Live", status: "Done" },
    { title: "LinkedIn Module", status: "Done" },
    { title: "Wordpress Module", status: "Next" },
    { title: "Analytics Dashboard", status: "Done" },
    { title: "Proprietary LLM Launch", status: "Planned" }, 
  ];

  return (
  <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              What's Next on the <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Roadmap</span>
            </h2>
            <div className="h-1 w-32 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            {/* The vertical timeline line */}
            <div className="absolute left-1/2 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            
            <div className="space-y-16">
              {roadmapItems.map((item, index) => (
                <div key={index} className="relative flex items-center group">
                  {/* Text content for the roadmap item */}
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12 text-left ml-auto'}`}>
                    <div className={`inline-block p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 ${
                      item.status === 'Done' ? 'bg-green-50 border-2 border-green-200' : 
                      item.status === 'Next' ? 'bg-blue-50 border-2 border-blue-200' : 
                      'bg-purple-50 border-2 border-purple-200'
                    }`}>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        item.status === 'Done' ? 'bg-green-500 text-white' : 
                        item.status === 'Next' ? 'bg-blue-500 text-white' : 
                        'bg-purple-500 text-white'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* The dot on the timeline */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-4 border-gray-300 shadow-lg group-hover:scale-125 transition-transform">
                    <div className={`w-full h-full rounded-full ${
                      item.status === 'Done' ? 'bg-green-500' : 
                      item.status === 'Next' ? 'bg-blue-500' : 
                      'bg-purple-500'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default function About() {
  const teamMembers = [
    {
      name: "Kanishk",
      role: "One for all",
      bio: "SuiteGenie is a one-man show. I handles all development, marketing, product vision, and every aspect required for a startup. From building the platform, designing features, managing deployments, to outreach and growth, every task is done solo. If you use SuiteGenie, you’re supporting a true indie founder.",
      imageUrl: "/kanishk.png",
      linkedinUrl: "https://www.linkedin.com/in/kanishk-saraswat"
    }
  ];

  return (
    <>
      <Helmet>
        <title>About SuiteGenie - Indie Founder Building AI Tools | Kanishk Saraswat</title>
        <meta name="description" content="Meet Kanishk Saraswat, indie founder of SuiteGenie. Learn how this solo developer built an AI social media automation platform to help creators. Made in India with passion." />
        <meta name="keywords" content="Kanishk Saraswat, indie founder, solo developer, SuiteGenie founder, Indian startup founder, BYOK platform creator" />
        <link rel="canonical" href="https://suitegenie.in/about" />
        <meta property="og:title" content="About SuiteGenie - Indie Founder Building AI Tools | Kanishk Saraswat" />
        <meta property="og:description" content="Meet Kanishk Saraswat, indie founder of SuiteGenie. Learn how this solo developer built an AI social media automation platform to help creators. Made in India with passion." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://suitegenie.in/about" />
        <meta property="og:image" content="https://suitegenie.in/og-about.png" />
        <meta property="og:site_name" content="SuiteGenie" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About SuiteGenie - Indie Founder Building AI Tools | Kanishk Saraswat" />
        <meta name="twitter:description" content="Meet Kanishk Saraswat, indie founder of SuiteGenie. Learn how this solo developer built an AI social media automation platform to help creators. Made in India with passion." />
        <meta name="twitter:image" content="https://suitegenie.in/og-about.png" />
        <meta name="twitter:site" content="@Suitegenie1" />
        <meta name="twitter:creator" content="@Suitegenie1" />
        {/* Structured Data: Person/Organization */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Kanishk Saraswat",
            "jobTitle": "Founder",
            "url": "https://linkedin.com/in/kanishk-saraswat",
            "worksFor": {
              "@type": "Organization",
              "name": "SuiteGenie",
              "url": "https://suitegenie.in"
            },
            "sameAs": [
              "https://www.linkedin.com/in/kanishk-saraswat",
              "https://x.com/Suitegenie"
            ]
          }
        `}</script>
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
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "About",
                "item": "https://suitegenie.in/about"
              }
            ]
          }
        `}</script>
      </Helmet>
      <div className="min-h-screen w-full bg-white" role="main">
      {/* Modern Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl animate-bounce"></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
          <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-blue-300/40 rounded-full animate-ping delay-500"></div>
          <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-purple-300/50 rounded-full animate-ping delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div className="text-left space-y-8">
              <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium border border-white/20">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></span>
                Building the future of content creation
              </div>
              
              <h1 className="text-4xl font-extrabold mb-4 text-white">About SuiteGenie – Indie Founder Building AI Social Media Tools</h1>
              
              <p className="text-xl lg:text-2xl text-blue-100 leading-relaxed max-w-2xl">
                In a world overwhelmed by digital noise, consistent and intelligent content is your edge. 
                We believe great ideas deserve to be shared—without friction.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <button className="group relative px-8 py-4 bg-white text-blue-600 font-bold text-lg rounded-2xl hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                  <span className="relative z-10">Get Started Free</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-pink-300 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </button>
                
                <button
                  className="group px-8 py-4 border-2 border-white/30 text-white font-bold text-lg rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
                  onClick={() => {
                    const el = document.getElementById('roadmap-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <span className="flex items-center">
                    View the Roadmap
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
            
            {/* Right Visual */}
            <div className="relative lg:pl-12">
              <div className="relative">
                {/* Floating Image Container */}
                <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                    alt="AI technology concept with abstract background" 
                    className="relative w-full h-auto rounded-3xl shadow-2xl border-2 border-white/20 backdrop-blur-sm" 
                    loading="lazy" 
                    width="800" 
                    height="533" 
                  />
                </div>
                
                {/* Floating Stats */}
                <div className="absolute -top-8 -left-8 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-gray-100 animate-float z-20">
                  <div className="text-2xl font-bold text-blue-600">Growing Community</div>
                </div>
                
                <div className="absolute -bottom-6 -right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-gray-100 animate-float-delayed z-20">
                  <div className="text-2xl font-bold text-purple-600">24/7</div>
                  <div className="text-sm text-gray-600">AI Powered</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>
                  
        {/* Meet the Team */}
  <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-5xl font-bold text-gray-900 mb-4">
                  Meet the <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Team</span>
                </h2>
                <div className="h-1 w-32 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-1 place-items-center max-w-md mx-auto gap-10">
                {teamMembers.map((member, index) => (
                  <div
                    key={member.name}
                    className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-shadow duration-300 p-8 flex flex-col items-center border border-gray-100 hover:border-blue-300 relative overflow-hidden"
                  >
                    <div className="relative mb-6">
                      <span className="absolute -inset-1 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></span>
                      <img
                        src={member.imageUrl}
                        alt={member.name}
                        className="relative w-32 h-32 object-cover rounded-full border-4 border-blue-100 shadow-lg group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 right-2 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse"></span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight group-hover:text-blue-700 transition-colors">{member.name}</h3>
                    <p className="text-blue-600 font-semibold mb-2 text-base">{member.role}</p>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4 max-w-md">{member.bio}</p>
                    <div className="flex justify-center gap-3 mt-auto">
                      {member.linkedinUrl && member.linkedinUrl !== "#" && (
                        <a
                          href={member.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 shadow transition-all"
                          title="LinkedIn"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.841-1.563 3.039 0 3.6 2.001 3.6 4.601v5.595z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-30 group-hover:opacity-60 blur-2xl pointer-events-none"></div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* BYOK Setup Instructions Section (moved out of team card) */}
        <section className="max-w-md mx-auto mt-10 mb-16 bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-primary-700 mb-4">How to set up BYOK (Bring Your Own Key)</h2>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2 text-base">
            <li>Go to <span className="font-semibold">Settings &rarr; API Keys</span> in your SuiteGenie dashboard.</li>
            <li>Choose your provider: <span className="font-semibold">OpenAI, Perplexity, or Gemini</span>.</li>
            <li>Follow the link to your provider’s API dashboard and generate a new API key.</li>
            <li>Copy the API key (it will look like <code>sk-...</code> for OpenAI).</li>
            <li>Paste your API key into SuiteGenie. Your key is fully encrypted and never shared.</li>
            <li>Click <span className="font-semibold">Save</span>. You’re ready to use all features—no limits or restrictions.</li>
          </ol>
        </section>
      {/* Main Content */}
      <main className="relative">
        
        {/* Origin Story Section */}
  <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-10 blur-xl"></div>
                    <img 
                      src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                      alt="SuiteGenie early platform development and analytics dashboard" 
                      className="relative w-full h-auto rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-500" 
                      loading="lazy" 
                      width="800" 
                      height="533" 
                    />
                  </div>
                </div>
                
                <div className="order-1 lg:order-2 space-y-6">
                  <div className="inline-block">
                    <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                      How It <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Started</span>
                    </h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-purple-600 mt-4 rounded-full"></div>
                  </div>
                  
                  <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                    <p>
                      This platform wasn't built in a boardroom—it came from solving a real-world problem.
                    </p>
                    <p>
                      It began with a personal passion project: an anime website for streaming, downloading, and blogging. As the site grew, I was juggling updates, writing blog posts, and trying to keep social media channels active. The passion was there, but the process was fragmented and overwhelming—just like for many creators who want to do more, without limits.
                    </p>
                    <p>
                      Even at a startup, publishing content consistently was still a struggle. I tried tools like Hootsuite and Buffer, but found a market of compromises—powerful platforms were expensive, and affordable ones felt clunky and incomplete.
                    </p>
                    
                    <div className="relative pl-6 py-6 border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 rounded-r-2xl">
                      <p className="text-blue-800 font-semibold text-xl italic">
                        That's when it clicked: the problem wasn't just the manual work—it was that no one had built a truly unified and affordable platform for the modern creator.
                      </p>
                    </div>
                    
                    <p className="text-gray-600">
                      So I decided to stop waiting for a solution and build the one I always wished I had—empowering creators to focus on what matters: sharing their ideas, not fighting their tools.
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* What Makes Us Different */}
  <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-5xl font-bold text-gray-900 mb-4">
                  What Makes Us <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Different</span>
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Built by creators, for creators. Here's what sets our platform apart from the competition.
                </p>
                <div className="h-1 w-32 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mt-6 rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { 
                    icon: "🧩", 
                    title: "Modular by Design", 
                    desc: "Pick and use only the modules you need for your workflow.",
                    gradient: "from-blue-500 to-cyan-500"
                  },
                  { 
                    icon: "🔄", 
                    title: "Multi-AI Fallback", 
                    desc: "Never get stuck, our system automatically switches between AI providers.",
                    gradient: "from-purple-500 to-pink-500"
                  },
                  { 
                    icon: "🔑", 
                    title: "Bring Your Own API Key", 
                    desc: "Full control and cost savings by using your own API keys.",
                    gradient: "from-green-500 to-emerald-500"
                  },
                  { 
                    icon: "⚡", 
                    title: "End-to-End Automation", 
                    desc: "From content generation to scheduling, automate it all.",
                    gradient: "from-yellow-500 to-orange-500"
                  },
                  { 
                    icon: "🔒", 
                    title: "Encrypted & Secure", 
                    desc: "Your data and keys are protected with state-of-the-art encryption.",
                    gradient: "from-red-500 to-rose-500"
                  },
                  { 
                    icon: "🤖", 
                    title: "Proprietary LLM (Coming Soon)", 
                    desc: "Our own AI model, purpose-built for creators.",
                    gradient: "from-indigo-500 to-purple-500"
                  },
                ].map((feature, i) => (
                  <div 
                    key={i} 
                    className="group relative p-8 rounded-2xl border border-gray-100 hover:border-transparent bg-white hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10 text-center">
                      <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <span className="filter drop-shadow-sm">{feature.icon}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>


        {/* Mission, Vision, Values */}
  <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <AnimatedSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                <div className="relative p-8 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 opacity-5"></div>
                  <div className="relative z-10">
                    <div className="text-4xl mb-4">🎯</div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Mission</h3>
                    <p className="text-lg text-gray-700 italic leading-relaxed">
                      Empower creators with AI-powered modules that simplify and amplify content creation—on your terms.
                    </p>
                  </div>
                </div>
                
                <div className="relative p-8 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-5"></div>
                  <div className="relative z-10">
                    <div className="text-4xl mb-4">👁️</div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Vision</h3>
                    <p className="text-lg text-gray-700 italic leading-relaxed">
                      A world where content flows frictionlessly, freeing creators to focus on creativity, not logistics.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: "🔒", title: "Privacy & Control", desc: "You own your data" },
                  { icon: "⚡", title: "Innovation & Reliability", desc: "Multi-AI fallback keeps you creating" },
                  { icon: "🧑‍💻", title: "Creator-First", desc: "Real feedback, real needs, real tools" }
                ].map((value, index) => (
                  <div key={index} className="text-center p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="text-4xl mb-4">{value.icon}</div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h4>
                    <p className="text-gray-600">{value.desc}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Made in India Section */}
  <section className="py-12 bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-green-500/10"></div>
          <div className="absolute inset-0 opacity-20">
            <img
              src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
              alt="India heritage and technology"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <AnimatedSection>
              <div className="mb-8">
                <span className="text-6xl mb-6 block">🇮🇳</span>
                <h2 className="text-5xl font-bold text-white mb-6">Made in India</h2>
                <div className="h-1 w-32 bg-gradient-to-r from-orange-500 to-green-500 mx-auto rounded-full mb-8"></div>
              </div>
              <blockquote className="text-2xl text-gray-300 italic leading-relaxed">
                "Built with pride, passion, and innovation in India — for creators everywhere."
              </blockquote>
            </AnimatedSection>
          </div>
        </section>

        {/* Roadmap Section */}
        <div id="roadmap-section">
          <RoadmapSection />
        </div>

        {/* Call to Action */}
  <section className="py-12 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <img
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
              alt="Team collaboration and innovation"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <AnimatedSection>
              <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8 leading-tight">
                Let AI do the heavy lifting—You focus on strategy, creativity, and growth.
              </h2>
              <a 
                href="/register" 
                className="inline-block px-10 py-5 bg-white text-blue-600 font-bold text-xl rounded-2xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
              >
                Try the Platform
              </a>
            </AnimatedSection>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
    </>
  );
}
