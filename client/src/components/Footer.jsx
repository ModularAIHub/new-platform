export default function Footer() {
  return (
    <footer className="w-full bg-gray-50 border-t border-gray-200 pt-10 pb-4 mt-12 text-gray-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand & Mission */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <img src="/vite.svg" alt="Logo" className="w-8 h-8" />
            <span className="text-xl font-bold text-blue-600">Autoverse</span>
          </div>
          <p className="mb-3 text-gray-500">Empowering creators from Kota to the world. <span className="text-blue-600 font-semibold">AI for everyone.</span></p>
          <div className="flex gap-3 mt-2">
            <a href="#" aria-label="Twitter" className="hover:text-blue-600 transition-colors">Twitter</a>
            <a href="#" aria-label="LinkedIn" className="hover:text-blue-600 transition-colors">LinkedIn</a>
            <a href="#" aria-label="GitHub" className="hover:text-blue-600 transition-colors">GitHub</a>
          </div>
        </div>
        {/* Platform */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Platform</h4>
          <ul className="space-y-1">
            <li><a href="/features" className="hover:text-blue-600 transition-colors">Features</a></li>
            <li><a href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</a></li>
            <li><a href="/integrations" className="hover:text-blue-600 transition-colors">Integrations</a></li>
            <li><a href="/roadmap" className="hover:text-blue-600 transition-colors">Roadmap</a></li>
          </ul>
        </div>
        {/* Resources */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Resources</h4>
          <ul className="space-y-1">
            <li><a href="/docs" className="hover:text-blue-600 transition-colors">Docs</a></li>
            <li><a href="/blog" className="hover:text-blue-600 transition-colors">Blog</a></li>
            <li><a href="/community" className="hover:text-blue-600 transition-colors">Community</a></li>
            <li><a href="/support" className="hover:text-blue-600 transition-colors">Support</a></li>
          </ul>
        </div>
        {/* Company */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Company</h4>
          <ul className="space-y-1">
            <li><a href="/about" className="hover:text-blue-600 transition-colors">About Us</a></li>
            <li><a href="/careers" className="hover:text-blue-600 transition-colors">Careers</a></li>
            <li><a href="/contact" className="hover:text-blue-600 transition-colors">Contact</a></li>
            <li><a href="/press" className="hover:text-blue-600 transition-colors">Press</a></li>
          </ul>
        </div>
      </div>
      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 mt-8 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 text-center sm:text-left">
        <span>&copy; {new Date().getFullYear()} Autoverse. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="/terms" className="hover:text-blue-600 transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
