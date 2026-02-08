import {Link} from "react-router-dom";
export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-br from-neutral-900 via-primary-900 to-purple-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600/5 to-purple-600/5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary-400/5 to-purple-400/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            {/* Brand & Mission */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">SuiteGenie</span>
              </div>
              <p className="text-neutral-300 mb-6 leading-relaxed max-w-lg">
                Automate your content creation with AI-powered tools for Twitter, LinkedIn, and more. 
                <span className="text-primary-400 font-medium block mt-1">Scale your social presence effortlessly.</span>
              </p>
              
              {/* Key Features */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Key Features</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-primary-500/20 border border-primary-400/30 rounded-full text-primary-300 text-sm">
                    AI Content Generation
                  </span>
                  <span className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300 text-sm">
                    BYOK Support
                  </span>
                  <span className="px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-full text-green-300 text-sm">
                    Analytics
                  </span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-3">
                <a href="https://x.com/Suitegenie1" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="w-9 h-9 bg-white/10 hover:bg-primary-500/20 rounded-lg flex items-center justify-center text-neutral-300 hover:text-primary-400 transition-all duration-200">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="https://linkedin.com/company/suitegenie" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-9 h-9 bg-white/10 hover:bg-primary-500/20 rounded-lg flex items-center justify-center text-neutral-300 hover:text-primary-400 transition-all duration-200">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Product & Support Links - Side by side on mobile */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-8">
              {/* Product Links */}
              <div>
                <h4 className="text-white font-semibold mb-4">Product</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/features" className="text-neutral-300 hover:text-primary-400 transition-colors duration-200 text-sm">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link to="/pricing" className="text-neutral-300 hover:text-primary-400 transition-colors duration-200 text-sm">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link to="/integrations" className="text-neutral-300 hover:text-primary-400 transition-colors duration-200 text-sm">
                      Integrations
                    </Link>
                  </li>
                  <li>
                    {/* Help link removed */}
                  </li>
                  <li>
                    <Link to="/docs" className="text-neutral-300 hover:text-primary-400 transition-colors duration-200 text-sm">
                    Docs
                    </Link>
                  </li>
                  {/* Duplicate Integrations and Changelog links removed */}
                </ul>
              </div>
              
              {/* Support Links */}
              <div>
                <h4 className="text-white font-semibold mb-4">Support</h4>
                <ul className="space-y-2">
                  <li><a href="/docs" className="text-neutral-300 hover:text-primary-400 transition-colors duration-200 text-sm">
                    Documentation
                  </a></li>
                  <li><a href="/help" className="text-neutral-300 hover:text-primary-400 transition-colors duration-200 text-sm">
                    Help Center
                  </a></li>
                  <li><a href="/contact" className="text-neutral-300 hover:text-primary-400 transition-colors duration-200 text-sm">
                    Contact Support
                  </a></li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-6 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-neutral-400 text-sm">
                &copy; {new Date().getFullYear()} SuiteGenie. All rights reserved.
              </div>
              <div className="flex items-center gap-4 text-sm">
                <a href="/terms" className="text-neutral-400 hover:text-primary-400 transition-colors duration-200">Terms</a>
                <a href="/privacy" className="text-neutral-400 hover:text-primary-400 transition-colors duration-200">Privacy</a>
                <div className="flex items-center text-neutral-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
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
