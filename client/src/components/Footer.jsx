import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-r from-primary-600 to-indigo-500 p-0.5">
                <img src="/logo.svg" alt="SuiteGenie logo" className="h-full w-full rounded-md bg-white p-1" />
              </div>
              <span className="text-2xl font-bold text-white">SuiteGenie</span>
            </Link>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
              SuiteGenie, also searched as Suite Genie, provides AI-powered automation for X, LinkedIn, and your full content workflow.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a
                href="https://x.com/Suitegenie"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SuiteGenie on X"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-white/5 text-slate-300 transition hover:border-primary-400/50 hover:text-white"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.901 1.153h3.68l-8.03 9.175 9.447 12.519h-7.396l-5.79-7.57-6.623 7.57H.51l8.59-9.817L0 1.154h7.584l5.233 6.917zm-1.29 19.496h2.04L6.477 3.24H4.29z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com/company/suitegenie"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SuiteGenie on LinkedIn"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-white/5 text-slate-300 transition hover:border-primary-400/50 hover:text-white"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.11 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7.5 0h3.83v2.16h.05c.53-1 1.84-2.16 3.79-2.16 4.05 0 4.8 2.67 4.8 6.14V24h-4v-8.26c0-1.97-.04-4.5-2.74-4.5-2.74 0-3.16 2.14-3.16 4.35V24h-4V8z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-200">Product</h4>
            <ul className="mt-3 space-y-2">
              <li><Link to="/features" className="text-sm text-slate-300 hover:text-white">Features</Link></li>
              <li><Link to="/pricing" className="text-sm text-slate-300 hover:text-white">Pricing</Link></li>
              <li><Link to="/blogs" className="text-sm text-slate-300 hover:text-white">Blog</Link></li>
              <li><Link to="/integrations" className="text-sm text-slate-300 hover:text-white">Integrations</Link></li>
              <li><Link to="/docs" className="text-sm text-slate-300 hover:text-white">Docs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-200">Support</h4>
            <ul className="mt-3 space-y-2">
              <li><Link to="/docs" className="text-sm text-slate-300 hover:text-white">Documentation</Link></li>
              <li><Link to="/help" className="text-sm text-slate-300 hover:text-white">Help Center</Link></li>
              <li><Link to="/contact" className="text-sm text-slate-300 hover:text-white">Contact Support</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-4 text-sm text-slate-400 sm:flex-row sm:items-center">
          <p>&copy; {new Date().getFullYear()} SuiteGenie. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <span className="inline-flex items-center gap-2 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
