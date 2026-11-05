import { useEffect, useState } from 'react';

export default function DemoNotice() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="suitegenie-notice-title"
      aria-describedby="suitegenie-notice-description"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-950 text-slate-200 shadow-[0_24px_100px_rgba(15,23,42,0.5)]"
      >
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500" />

        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-5 top-6 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl leading-none text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          ×
        </button>

        <div className="p-7 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white" aria-hidden="true">
                <path d="M12 3 4.5 6v5.5c0 4.5 3.1 7.8 7.5 9.5 4.4-1.7 7.5-5 7.5-9.5V6L12 3Z" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 8v4.5M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
                Showcase mode
              </span>
              <h2 id="suitegenie-notice-title" className="mt-1 pr-10 text-xl font-bold tracking-tight text-white sm:text-2xl">
                A note from SuiteGenie
              </h2>
            </div>
          </div>

          <div id="suitegenie-notice-description" className="space-y-4 text-sm leading-7 text-slate-300 sm:text-[15px]">
            <p>
              SuiteGenie.in didn't work out the way we hoped. A big thank you to every client and
              user who shared feedback and helped us improve the platform. We learnt a lot along
              the way, and it wouldn't have been the same without you.
            </p>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-amber-100">
              <p className="font-semibold">Please note</p>
              <p className="mt-1 text-sm leading-6 text-amber-100/80">
                This site is kept online as a showcase project only. Some features may not work as
                expected, so please don't buy credits or make any payments. Anything you do here is
                at your own risk.
              </p>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Continue to showcase
          </button>
        </div>
      </div>
    </div>
  );
}
