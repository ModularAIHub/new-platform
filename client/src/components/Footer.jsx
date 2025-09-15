export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/5 to-purple-400/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            
            {/* Brand & Mission */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">SuiteGenie</span>
              </div>
              <p className="text-slate-300 mb-6 text-lg leading-relaxed max-w-lg">
                SuiteGenie empowers creators and teams to automate, optimize, and scale content across every channel with AI. 
                <span className="text-blue-400 font-semibold block mt-2">Your all-in-one content suite for growth.</span>
              </p>
              
              {/* Platforms We Support */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-4 text-lg">Platforms We Support</h4>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span className="text-sm font-medium">Twitter</span>
                  </div>
                  <div className="flex items-center px-4 py-2 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span className="text-sm font-medium">LinkedIn</span>
                  </div>
                  <div className="flex items-center px-4 py-2 bg-orange-500/20 border border-orange-400/30 rounded-full text-orange-300">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.15-2.85-.15-.585-.03-.661.855-.075.885 0 0 .54.061 1.125.105l1.68 4.605-2.37 7.08L5.354 6.9c.649-.03 1.234-.1 1.234-.1.585-.075.516-.93-.065-.896 0 0-1.746.138-2.874.138-.2 0-.438-.008-.69-.015C4.911 3.15 8.235 1.215 12 1.215c2.809 0 5.365 1.072 7.286 2.833-.046-.003-.091-.009-.141-.009-1.06 0-1.812.923-1.812 1.914 0 .89.513 1.643 1.06 2.531.411.72.89 1.643.89 2.977 0 .915-.354 1.994-.821 3.479l-1.075 3.585-3.9-11.61.001.014zM12 22.784c-1.059 0-2.081-.153-3.048-.437l3.237-9.406 3.315 9.087c.024.053.05.101.078.149-1.12.393-2.325.607-3.582.607M1.211 12c0-1.564.336-3.05.935-4.39L7.29 21.709C3.694 19.96 1.212 16.271 1.211 12M12 0C5.385 0 0 5.385 0 12s5.385 12 12 12 12-5.385 12-12S18.615 0 12 0"/>
                    </svg>
                    <span className="text-sm font-medium">WordPress (Soon)</span>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-4">
                <a href="#" aria-label="Twitter" className="w-10 h-10 bg-white/10 hover:bg-blue-500/20 rounded-full flex items-center justify-center text-slate-300 hover:text-blue-400 transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" aria-label="LinkedIn" className="w-10 h-10 bg-white/10 hover:bg-blue-500/20 rounded-full flex items-center justify-center text-slate-300 hover:text-blue-400 transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" aria-label="GitHub" className="w-10 h-10 bg-white/10 hover:bg-blue-500/20 rounded-full flex items-center justify-center text-slate-300 hover:text-blue-400 transition-all duration-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Platform Links */}
            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">Platform</h4>
              <ul className="space-y-3">
                <li><a href="/features" className="text-slate-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></span>Features
                </a></li>
                <li><a href="/plans" className="text-slate-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></span>Plans
                </a></li>
                <li><a href="/integrations" className="text-slate-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></span>Integrations
                </a></li>
                <li><a href="/roadmap" className="text-slate-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></span>Roadmap
                </a></li>
              </ul>
            </div>
            
            {/* Company Links */}
            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">Company</h4>
              <ul className="space-y-3">
                <li><a href="/about" className="text-slate-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></span>About Us
                </a></li>
                <li><a href="/careers" className="text-slate-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></span>Careers
                </a></li>
                <li><a href="/contact" className="text-slate-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></span>Contact
                </a></li>
                <li><a href="/blog" className="text-slate-300 hover:text-blue-400 transition-colors duration-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></span>Blog
                </a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="text-slate-400 text-sm">
                &copy; {new Date().getFullYear()} SuiteGenie. All rights reserved. Made with ❤️ in India.
              </div>
              <div className="flex items-center gap-6 text-sm">
                <a href="/terms" className="text-slate-400 hover:text-blue-400 transition-colors duration-300">Terms of Service</a>
                <a href="/privacy" className="text-slate-400 hover:text-blue-400 transition-colors duration-300">Privacy Policy</a>
                <div className="flex items-center text-slate-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  All systems operational
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
