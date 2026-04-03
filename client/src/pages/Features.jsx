import React from 'react';
import { Helmet } from 'react-helmet';
import { ArrowRight, Briefcase, CalendarDays, KeyRound, Layers3, Link2, MessageSquare, Sparkles, Wand2 } from 'lucide-react';
import Footer from '../components/Footer';

const featureGroups = [
  {
    title: 'Agency operations',
    description: 'Everything that makes client delivery calmer instead of heavier.',
    cards: [
      {
        icon: Briefcase,
        title: 'Client workspaces',
        body: 'Separate setup, connections, drafts, queue, calendar, comments, and analytics per client so the agency dashboard reflects real work.',
      },
      {
        icon: MessageSquare,
        title: 'Public approval portal',
        body: 'Share a no-login review link so clients can approve, reject, and comment on drafts without creating a SuiteGenie account.',
      },
      {
        icon: Link2,
        title: 'Client onboarding links',
        body: 'Let clients connect accounts through expiring onboarding links instead of sharing passwords or getting lost in back-and-forth setup.',
      },
    ],
  },
  {
    title: 'AI workflow',
    description: 'The useful layer sits between your context and the final draft.',
    cards: [
      {
        icon: Sparkles,
        title: 'Brand-aware generation',
        body: 'Brand name, audience, industry, notes, and workspace signals shape generation automatically before the first draft is produced.',
      },
      {
        icon: KeyRound,
        title: 'BYOK multi-LLM',
        body: 'Use OpenAI, Gemini, or Perplexity keys when you want model control, or stay on SuiteGenie-managed credits when speed matters more.',
      },
      {
        icon: Wand2,
        title: 'Idea bank and guided refinement',
        body: 'Turn workspace signals into ideas, then move them into drafts and refine them without losing the thread of what the client actually needs.',
      },
    ],
  },
  {
    title: 'Publishing and visibility',
    description: 'Content ops should stay visible after generation too.',
    cards: [
      {
        icon: CalendarDays,
        title: 'Queue and calendar workflow',
        body: 'Review what is pending, what is approved, what is scheduled, and where channel health could block publishing before it becomes a surprise.',
      },
      {
        icon: Layers3,
        title: 'Connected channel modules',
        body: 'Tweet Genie, LinkedIn Genie, and Social Genie stay channel-specific while still cooperating through shared workspace context.',
      },
      {
        icon: ArrowRight,
        title: 'Faster handoff',
        body: 'Move from idea to draft to approval to scheduled content in a tighter loop instead of duplicating work across docs, schedulers, and chat.',
      },
    ],
  },
];

const moduleRows = [
  {
    name: 'Tweet Genie',
    summary: 'X-native writing, threads, approvals, and publishing flow.',
  },
  {
    name: 'LinkedIn Genie',
    summary: 'Strategy Builder, prompt packs, content plans, and analytics feedback.',
  },
  {
    name: 'Social Genie',
    summary: 'Threads live now, with Instagram and YouTube rollout paths connected to the same workspace model.',
  },
];

const FeatureCard = ({ icon: Icon, title, body }) => (
  <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
    <div className="inline-flex rounded-2xl bg-slate-950 p-3 text-white">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
    <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
  </div>
);

const Features = () => (
  <>
    <Helmet>
      <title>Features | Agency Workspaces, Client Approvals, and BYOK AI | SuiteGenie</title>
      <meta
        name="description"
        content="Explore SuiteGenie features across agency workspaces, public approval links, BYOK multi-LLM, brand-aware generation, and connected publishing workflows."
      />
      <meta
        name="keywords"
        content="SuiteGenie features, agency approval portal, BYOK AI workflow, social media workspace software, client approval link, social media software India"
      />
      <link rel="canonical" href="https://suitegenie.in/features" />
      <meta property="og:title" content="Features | Agency Workspaces, Client Approvals, and BYOK AI | SuiteGenie" />
      <meta
        property="og:description"
        content="See how SuiteGenie handles client workspaces, approvals, comments, AI generation, BYOK, and connected publishing workflows."
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://suitegenie.in/features" />
      <meta property="og:image" content="https://suitegenie.in/og-default.svg" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Features | Agency Workspaces, Client Approvals, and BYOK AI | SuiteGenie" />
      <meta
        name="twitter:description"
        content="Client workspaces, no-login approvals, BYOK multi-LLM, and workspace-aware publishing in one operating system."
      />
      <meta name="twitter:image" content="https://suitegenie.in/og-default.svg" />
    </Helmet>

    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_28%,_#f8fafc_100%)]" role="main">
      <section className="border-b border-slate-200/80 bg-white/90">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              <Sparkles className="h-4 w-4 text-blue-600" />
              A stronger public story for what the product already does
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Features that feel like real content operations, not AI decoration
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              SuiteGenie is strongest where teams usually lose time: client context, client approvals, platform-aware drafts,
              AI cost control, and handoff between planning and publishing.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-14">
          {featureGroups.map((group) => (
            <div key={group.title}>
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{group.title}</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{group.title}</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">{group.description}</p>
              </div>
              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                {group.cards.map((card) => (
                  <FeatureCard key={card.title} {...card} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Connected modules</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Three channel-specific products, one system underneath</h2>
            <p className="mt-4 text-base leading-7 text-slate-300">
              The point is not to flatten every network into the same UI. The point is to let each channel stay native
              while Agency mode keeps setup, approvals, and publishing grounded in the same client workspace.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {moduleRows.map((row) => (
              <div key={row.name} className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <p className="text-xl font-semibold tracking-tight">{row.name}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{row.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Start with the workflow that is slowing you down today
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          If approvals are messy, start there. If drafts feel generic, start with context and BYOK.
          If publishing feels fragmented, start with the workspace and queue.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="/register" className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800">
            Start Free
          </a>
          <a href="/plans" className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 transition hover:bg-slate-50">
            View plans
          </a>
        </div>
      </section>
      <Footer />
    </main>
  </>
);

export default Features;
