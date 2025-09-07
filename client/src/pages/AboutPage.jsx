import React from "react";

// --- Helper Components & Hooks ---

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
    <section className="mb-16">
      <AnimatedSection className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">What's Next on the Roadmap</h2>
        <div className="relative max-w-2xl mx-auto">
          {/* The vertical timeline line */}
          <div className="absolute left-1/2 top-0 h-full w-0.5 bg-gray-700"></div>
          <div className="space-y-16">
            {roadmapItems.map((item, index) => (
              <div key={index} className="relative flex items-center">
                {/* Text content for the roadmap item */}
                <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left ml-auto'}`}>
                  <p className="font-bold text-white">{item.title}</p>
                </div>
                {/* The dot on the timeline */}
                <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gray-800 border-2 border-gray-700">
                  <div className={`w-full h-full rounded-full ${item.status === 'Done' ? 'bg-green-500' : 'bg-cyan-500'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
};


export default function About() {
  const teamMembers = [
    { 
      name: "Kanishk", 
      role: "Developer ", 
      bio: "Built this from personal frustration as a creator. Now shaping the vision of AI-native content tooling.", 
      imageUrl: "karma.jpg",
      linkedinUrl: "https://www.linkedin.com/in/kanishk-saraswat"
    },
    { 
      name: "Ashutosh", 
      role: "AI & Engineering", 
      bio: "Focuses on building and fine-tuning the AI systems that power the platform’s intelligence and reliability.", 
      imageUrl: "https://placehold.co/200x200/111827/7dd3fc?text=A",
      linkedinUrl: "#"
    },
    { 
      name: "Abhay", 
      role: "Developer", 
      bio: "Builds the core platform features and ensures a seamless user experience across all modules.", 
      imageUrl: "https://placehold.co/200x200/111827/7dd3fc?text=P",
      linkedinUrl: "#"
    },
     { 
      name: "Yash ", 
      role: "Developer", 
      bio: "Backend Developer", 
      imageUrl: "https://placehold.co/200x200/111827/7dd3fc?text=P",
      linkedinUrl: "#"
    },
  ];

  return (
    <div className="min-h-screen w-full bg-black flex flex-col">
\      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-12">
        {/* 1. Hero Section */}
        <AnimatedSection className="flex flex-col md:flex-row items-center justify-between gap-10 mb-16 bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] rounded-3xl p-8 border border-cyan-400/20 shadow-2xl">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Giving Creators Their Time Back</h1>
            <p className="text-lg text-gray-300 mb-6 opacity-80">In a world overwhelmed by digital noise, consistent and intelligent content is your edge. We believe great ideas deserve to be shared—without friction.</p>
            <div className="flex gap-4 flex-wrap">
              <button className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold px-8 py-3 rounded-xl text-lg shadow hover:scale-105 transition">Get Started Free</button>
              <button
                className="border border-cyan-400 text-cyan-400 px-8 py-3 rounded-xl text-lg font-bold hover:bg-cyan-900/20 transition"
                onClick={() => {
                  const el = document.getElementById('roadmap-section');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    // Remove hash from URL if present
                    if (window.location.hash === '#roadmap-section') {
                      history.replaceState(null, '', window.location.pathname + window.location.search);
                    }
                  }
                }}
              >
                View the Roadmap
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <img src="about-us.png" alt="AI Illustration" className="w-full h-auto max-w-full rounded-2xl shadow-lg border border-cyan-400/10" loading="lazy" />
          </div>
        </AnimatedSection>

        {/* 2. Origin Story */}
        <AnimatedSection className="flex flex-col md:flex-row gap-10 mb-16 bg-[#1b1b1b] rounded-3xl p-8 border border-cyan-400/10">
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-white mb-4">How It Started</h2>
            <p className="text-gray-200 mb-3">
              This platform wasn’t built in a boardroom—it came from solving a real-world problem.<br /><br />
              It began with a personal passion project: an anime website for streaming, downloading, and blogging. As the site grew, I was juggling updates, writing blog posts, and trying to keep social media channels active. The passion was there, but the process was fragmented and overwhelming.<br /><br />
              Even at a startup, publishing content consistently was still a struggle. I tried tools like Hootsuite and Buffer, but found a market of compromises—powerful platforms were expensive, and affordable ones felt clunky and incomplete.
            </p>
            <div className="my-4 border-l-4 border-cyan-400 pl-4 py-2 bg-cyan-400/5 text-cyan-200 font-semibold">
              That's when it clicked: the problem wasn't just the manual work—it was that no one had built a truly unified and affordable platform for the modern creator.
            </div>
            <p className="text-gray-400">So I decided to stop waiting for a solution and build the one I always wished I had—empowering creators to focus on what matters: sharing their ideas, not fighting their tools.</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full flex items-center justify-center">
              <img src="image.png" alt="Early Platform Screenshot" className="w-full h-auto max-w-full rounded-xl border border-cyan-400/10 shadow" loading="lazy" />
            </div>
          </div>
        </AnimatedSection>

        {/* 3. What Makes Us Different – Feature Cards */}
        <AnimatedSection className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">What Makes Us Different</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[
              { icon: "🧩", title: "Modular by Design", desc: "Pick and use only the modules you need for your workflow." },
              { icon: "🔄", title: "Multi-AI Fallback", desc: "Never get stuck—our system automatically switches between AI providers." },
              { icon: "🔑", title: "Bring Your Own API Key", desc: "Full control and cost savings by using your own API keys." },
              { icon: "⚡", title: "End-to-End Automation", desc: "From content generation to scheduling, automate it all." },
              { icon: "🔒", title: "Encrypted & Secure", desc: "Your data and keys are protected with state-of-the-art encryption." },
              { icon: "🤖", title: "Proprietary LLM (Coming Soon)", desc: "Our own AI model, purpose-built for creators." },
            ].map((f, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 flex flex-col items-center border border-cyan-400/10 shadow hover:shadow-cyan-400/20 hover:-translate-y-1 transition-all text-center">
                <span className="text-4xl mb-3">{f.icon}</span>
                <h3 className="font-bold text-lg text-white mb-2">{f.title}</h3>
                <p className="text-gray-300">{f.desc}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* 4. Meet the Team - UPDATED LAYOUT */}
        <div className="py-12 bg-[#1b1b1b] rounded-3xl mb-16 border border-cyan-400/10">
          <AnimatedSection className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-16">Meet the Team</h2>
            <div className="flex flex-wrap justify-center gap-x-16 gap-y-16 md:gap-x-24 md:gap-y-20">
              {teamMembers.map((member) => (
                <div key={member.name} className="flex flex-col items-center max-w-xs">
                  <div className="relative flex items-center justify-center mb-6">
                    <span className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-cyan-400/30 via-violet-400/20 to-transparent blur-2xl"></span>
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-40 h-40 object-cover rounded-full border-2 border-cyan-400/50 shadow-lg relative z-10 bg-black"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                  <p className="text-cyan-400 font-semibold mb-2">{member.role}</p>
                  <p className="text-gray-400 text-sm mb-2">{member.bio}</p>
                  {member.linkedinUrl && member.linkedinUrl !== "#" && (
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                      aria-label={`LinkedIn profile of ${member.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.841-1.563 3.039 0 3.6 2.001 3.6 4.601v5.595z"/>
                      </svg>
                      <span>LinkedIn</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>

        {/* 5. Mission, Vision, Values */}
        <AnimatedSection className="mb-16">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 bg-white/10 rounded-2xl p-6 border border-cyan-400/10">
              <h3 className="text-2xl font-bold mb-2 text-white ">🎯 Mission</h3>
              <p className="italic text-gray-200">Empower creators with AI-powered modules that simplify and amplify content creation—on your terms.</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-2xl p-6 border border-cyan-400/10">
              <h3 className="text-2xl font-bold mb-2 text-white" >👁️ Vision</h3>
              <p className="italic text-gray-200">A world where content flows frictionlessly, freeing creators to focus on creativity, not logistics.</p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-2xl p-4 border border-cyan-400/10 flex flex-col items-center text-center">
              <span className="text-2xl mb-1">🔒</span>
              <span className="font-bold text-white">Privacy & Control</span>
              <span className="text-gray-300 text-sm">You own your data</span>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 border border-cyan-400/10 flex flex-col items-center text-center">
              <span className="text-2xl mb-1">⚡</span>
              <span className="font-bold text-white">Innovation & Reliability</span>
              <span className="text-gray-300 text-sm">Multi-AI fallback keeps you creating</span>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 border border-cyan-400/10 flex flex-col items-center text-center">
              <span className="text-2xl mb-1">🧑‍💻</span>
              <span className="font-bold text-white">Creator-First</span>
              <span className="text-gray-300 text-sm">Real feedback, real needs, real tools</span>
            </div>
          </div>
        </AnimatedSection>

        {/* 6. Made in India Section */}
        <AnimatedSection className="mb-16 bg-gradient-to-br from-[#232323] to-[#181a20] rounded-3xl p-8 border border-cyan-400/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-10 blur-lg" style={{ backgroundImage: 'url(/india-bg.jpg)' }}></div>
          <div className="relative z-10 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Made in India</h2>
            <blockquote className="italic text-lg text-white">“Built with pride, passion, and innovation in India — for creators everywhere.”</blockquote>
          </div>
        </AnimatedSection>

        {/* 7. Roadmap & What’s Next (Vertical Timeline) - INTEGRATED CODE */}
        <div id="roadmap-section">
          <RoadmapSection />
        </div>

        {/* 8. Call to Action Footer */}
        <AnimatedSection className="w-full bg-black rounded-3xl py-12 px-6 text-center mb-8 border border-cyan-400/20">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Let AI do the heavy lifting—You focus on strategy, creativity, and growth.</h2>
          <div className="flex flex-col md:flex-row gap-6 justify-center mt-6">
            <a href="/signup" className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold px-8 py-4 rounded-xl text-xl shadow hover:scale-105 transition">Try the Platform</a>
          </div>
        </AnimatedSection>
      </main>
    </div>
  );
}
