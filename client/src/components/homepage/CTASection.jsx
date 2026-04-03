import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, Sparkles } from 'lucide-react';

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,_#0f172a_0%,_#1d4ed8_52%,_#14b8a6_100%)] px-6 py-10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:px-10 sm:py-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90">
                <Sparkles className="h-4 w-4" />
                Ready to make the site match the product?
              </div>
              <h2 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
                Start with the workflow that hurts most and fix it properly.
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-50">
                Use SuiteGenie when you want fewer approval bottlenecks, cleaner drafts, tighter client handoff,
                and a pricing model that makes sense for Indian teams.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/plans')}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/15"
                >
                  View plans
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Agency quick start</p>
                  <p className="text-sm text-blue-50/80">The fastest way to feel the difference</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm leading-6 text-blue-50/90">
                <p>1. Create a client workspace</p>
                <p>2. Attach or onboard real social accounts</p>
                <p>3. Generate drafts with context already in place</p>
                <p>4. Share a no-login approval link with the client</p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/features')}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white"
              >
                Explore product capabilities
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
