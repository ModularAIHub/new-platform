import React from 'react';

const rows = [
  {
    capability: 'Public client approval links',
    suitegenie: 'Built in',
    scheduler: 'Usually missing',
    enterprise: 'Often add-on or account-gated',
  },
  {
    capability: 'Draft comments attached to approval flow',
    suitegenie: 'Built in',
    scheduler: 'Usually external',
    enterprise: 'Partial',
  },
  {
    capability: 'BYOK multi-LLM support',
    suitegenie: 'OpenAI / Gemini / Perplexity',
    scheduler: 'Rare',
    enterprise: 'Usually platform-managed only',
  },
  {
    capability: 'Workspace-aware client onboarding links',
    suitegenie: 'Built in',
    scheduler: 'Usually manual',
    enterprise: 'Often admin-heavy',
  },
  {
    capability: 'AI generation with brand context carried into drafts',
    suitegenie: 'Native',
    scheduler: 'Often generic',
    enterprise: 'Partial',
  },
  {
    capability: 'India-friendly pricing model',
    suitegenie: 'INR-first',
    scheduler: 'Usually dollar-first',
    enterprise: 'Usually dollar-first',
  },
];

const pillars = [
  {
    title: 'SuiteGenie',
    tone: 'border-blue-200 bg-blue-50 text-blue-900',
    subtitle: 'AI-native workflows for creators, teams, and agencies',
  },
  {
    title: 'Typical scheduler',
    tone: 'border-slate-200 bg-white text-slate-800',
    subtitle: 'Great for queueing posts, thinner on approvals and context',
  },
  {
    title: 'Legacy enterprise suite',
    tone: 'border-slate-200 bg-white text-slate-800',
    subtitle: 'Broader controls, but heavier setup and slower daily use',
  },
];

const ComparisonSection = () => (
  <section className="bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
          Positioning that matches the product
        </div>
        <h2 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Not another basic scheduler pretending to be strategy software
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          The win is not just posting faster. The win is removing the messy parts around content operations:
          context capture, client review, handoff, comments, and publishing visibility.
        </p>
      </div>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {pillars.map((pillar) => (
          <div key={pillar.title} className={`rounded-[26px] border p-5 shadow-sm ${pillar.tone}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-70">{pillar.title}</p>
            <p className="mt-3 text-lg font-semibold tracking-tight">{pillar.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="px-5 py-4 text-left text-sm font-semibold">Capability</th>
                <th className="px-5 py-4 text-left text-sm font-semibold">SuiteGenie</th>
                <th className="px-5 py-4 text-left text-sm font-semibold">Typical scheduler</th>
                <th className="px-5 py-4 text-left text-sm font-semibold">Legacy enterprise suite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.capability} className="align-top">
                  <td className="px-5 py-4 text-sm font-semibold text-slate-900">{row.capability}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{row.suitegenie}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.scheduler}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 rounded-[28px] border border-emerald-200 bg-emerald-50 px-6 py-5 text-center shadow-sm">
        <p className="text-lg font-semibold tracking-tight text-emerald-900">
          The pitch is simple: tighter workflows, lower software spend, and less client friction.
        </p>
      </div>
    </div>
  </section>
);

export default ComparisonSection;
