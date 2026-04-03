import React from 'react';
import { ArrowUpRight, Bot, Briefcase, KeyRound, Link2, MessageSquare, Sparkles, Wand2 } from 'lucide-react';

const differentiators = [
  {
    icon: Briefcase,
    title: 'Agency workspaces that behave like client ops software',
    description: 'Run setup, drafts, queue reviews, comments, publishing, and analytics per client instead of mixing everything inside one posting tab.',
  },
  {
    icon: MessageSquare,
    title: 'No-login approval links for clients',
    description: 'Clients can approve, reject, and comment on drafts from a secure public portal without creating a SuiteGenie account.',
  },
  {
    icon: KeyRound,
    title: 'BYOK multi-LLM without workflow breakage',
    description: 'Use SuiteGenie-managed credits or switch to your own OpenAI, Gemini, and Perplexity keys when cost control matters.',
  },
  {
    icon: Sparkles,
    title: 'Auto brand context instead of blank AI fields',
    description: 'Connected account signals, audience hints, notes, and competitor context are used to shape generation before the first draft is created.',
  },
  {
    icon: Link2,
    title: 'Safer client onboarding links',
    description: 'Let clients connect their own accounts through expiring onboarding links instead of sharing passwords with the agency team.',
  },
  {
    icon: Wand2,
    title: 'Idea bank and approval-aware planning',
    description: 'Generate ideas from workspace signals, then move them into drafts, queue, calendar, and approval flow without starting over.',
  },
];

const modules = [
  {
    name: 'Tweet Genie',
    summary: 'X-native writing, threads, approvals, and publishing.',
    href: 'https://tweet.suitegenie.in',
    accent: 'from-sky-500 to-blue-600',
  },
  {
    name: 'LinkedIn Genie',
    summary: 'Strategy Builder, prompt packs, content plans, and analytics loops.',
    href: 'https://linkedin.suitegenie.in',
    accent: 'from-blue-700 to-indigo-700',
  },
  {
    name: 'Social Genie',
    summary: 'Threads live now, with Instagram and YouTube rollout paths in the same system.',
    href: 'https://meta.suitegenie.in',
    accent: 'from-slate-700 to-slate-950',
  },
];

const FeaturesSection = () => (
  <section className="bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
          <Bot className="h-4 w-4 text-blue-600" />
          Where SuiteGenie actually feels different
        </div>
        <h2 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Built for teams that need more than a posting scheduler
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          The public site should not talk like a generic AI tool, because the product is already more specific than that.
          SuiteGenie is strongest where agencies and serious operators usually lose time: approvals, context, workflows, and cost control.
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {differentiators.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <div className="inline-flex rounded-2xl bg-slate-950 p-3 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-16 overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] px-6 py-7 text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">Core modules</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">Three connected products, one operating system</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Each Genie is optimized for the channel it serves, but Agency mode keeps planning, approvals, connections, and cross-product handoff grounded in the same workspace context.
            </p>
          </div>
          <div className="rounded-[24px] border border-blue-100 bg-blue-50 px-5 py-4 lg:max-w-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">How teams use it</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Write inside the right Genie, then move drafts, approvals, comments, and publishing decisions through the same client workspace.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {modules.map((module) => (
            <a
              key={module.name}
              href={module.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-[24px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)]"
            >
              <div className={`inline-flex rounded-2xl bg-gradient-to-br ${module.accent} px-3 py-2 text-sm font-semibold text-white`}>
                {module.name}
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{module.summary}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                Open module
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default FeaturesSection;
