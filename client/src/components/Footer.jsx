import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[linear-gradient(135deg,_#020617_0%,_#0f172a_48%,_#0f3b63_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <img src="/suitegenie-logo-icon.png" alt="SuiteGenie logo" className="h-12 w-auto object-contain" />
              <div>
                <span className="block text-2xl font-semibold tracking-tight">SuiteGenie</span>
                <span className="block text-sm text-slate-300">AI social media operating system</span>
              </div>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
              Built for Indian creators, operators, and agencies who want better workflows around content, approvals,
              publishing, and AI cost control.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">BYOK multi-LLM</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">Client approval portal</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">Workspace onboarding</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Product</h4>
            <ul className="mt-4 space-y-3">
              <li><Link to="/features" className="text-sm text-slate-300 transition hover:text-white">Features</Link></li>
              <li><Link to="/plans" className="text-sm text-slate-300 transition hover:text-white">Plans</Link></li>
              <li><Link to="/docs" className="text-sm text-slate-300 transition hover:text-white">Docs</Link></li>
              <li><Link to="/integrations" className="text-sm text-slate-300 transition hover:text-white">Integrations</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Use Cases</h4>
            <ul className="mt-4 space-y-3">
              <li><Link to="/plans?intent=agency" className="text-sm text-slate-300 transition hover:text-white">Agency mode</Link></li>
              <li><Link to="/features" className="text-sm text-slate-300 transition hover:text-white">Creator workflows</Link></li>
              <li><Link to="/plans" className="text-sm text-slate-300 transition hover:text-white">BYOK pricing</Link></li>
              <li><Link to="/contact" className="text-sm text-slate-300 transition hover:text-white">Book a walkthrough</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">Resources</h4>
            <ul className="mt-4 space-y-3">
              <li><Link to="/blogs" className="text-sm text-slate-300 transition hover:text-white">Blog</Link></li>
              <li><Link to="/help" className="text-sm text-slate-300 transition hover:text-white">Help center</Link></li>
              <li><Link to="/contact" className="text-sm text-slate-300 transition hover:text-white">Contact support</Link></li>
              <li><Link to="/about" className="text-sm text-slate-300 transition hover:text-white">About</Link></li>
            </ul>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://x.com/Suitegenie"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SuiteGenie on X"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/20 hover:text-white"
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/20 hover:text-white"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.11 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7.5 0h3.83v2.16h.05c.53-1 1.84-2.16 3.79-2.16 4.05 0 4.8 2.67 4.8 6.14V24h-4v-8.26c0-1.97-.04-4.5-2.74-4.5-2.74 0-3.16 2.14-3.16 4.35V24h-4V8z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} SuiteGenie. Built in India for modern content teams.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/terms" className="transition hover:text-white">Terms</Link>
            <Link to="/privacy" className="transition hover:text-white">Privacy</Link>
            <span className="inline-flex items-center gap-2 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Product actively shipping
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
