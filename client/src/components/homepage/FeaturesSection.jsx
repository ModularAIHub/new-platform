import { ArrowUpRight, AtSign, FileText, Linkedin, Twitter } from 'lucide-react'

const modules = [
  {
    icon: Twitter,
    title: 'Tweet Genie',
    accentClass: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white',
    description: 'Platform-native X workflow with drafting, threads, approvals, scheduling, and stronger automation paths when you need them.',
    highlights: ['X-native writing', 'Threads, queue, approvals', 'Publishing and analytics'],
    href: 'https://tweet.suitegenie.in',
    ctaLabel: 'Open module',
  },
  {
    icon: Linkedin,
    title: 'LinkedIn Genie',
    accentClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
    description: 'Professional publishing workflow for strategy, thought leadership, account analysis, and execution tied back to real context.',
    highlights: ['Strategy Builder', 'Prompt packs and plans', 'Analytics loops'],
    href: 'https://linkedin.suitegenie.in',
    ctaLabel: 'Open module',
  },
  {
    icon: AtSign,
    title: 'Social Genie',
    accentClass: 'bg-slate-900 text-white',
    description: 'Shared social workflow for Threads plus staged Instagram and YouTube rollout, with agency-aware launch context.',
    highlights: ['Threads live now', 'Instagram rollout path', 'YouTube rollout path'],
    href: 'https://meta.suitegenie.in',
    ctaLabel: 'Open module',
  },
  {
    icon: FileText,
    title: 'Agency Mode',
    accentClass: 'bg-neutral-900 text-white',
    description: 'Client workspaces, approvals, onboarding links, pooled credits, and calendar-level execution across the rest of SuiteGenie.',
    highlights: ['Workspaces and approvals', 'Pooled credits', 'Cross-product handoff'],
    href: '/agency',
    ctaLabel: 'Open module',
  },
]

const FeaturesSection = () => {
  return (
    <section className="bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.16),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#f8fafc_52%,#eef4ff_100%)] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-8 shadow-[0_24px_80px_rgba(37,99,235,0.12)] backdrop-blur md:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_420px] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-blue-600">
                Core Modules
              </p>
              <h2 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 md:text-5xl">
                Three connected products, one operating system
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                Each Genie is optimized for the channel it serves, but Agency mode keeps planning,
                approvals, connections, and cross-product handoff grounded in the same workspace context.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 p-7 shadow-[0_16px_40px_rgba(37,99,235,0.08)]">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-700">
                How Teams Use It
              </p>
              <p className="mt-5 text-2xl font-bold leading-tight text-slate-950">
                Write inside the right Genie, then move drafts, approvals, comments, and publishing decisions through the same client workspace.
              </p>
              <div className="mt-6 space-y-3 text-sm text-slate-600">
                <p>Channel-native creation stays fast because each module is purpose-built.</p>
                <p>Operational calm comes from keeping review, ownership, and launch context connected.</p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {modules.map((module) => {
              const Icon = module.icon

              return (
                <article
                  key={module.title}
                  className="flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_60px_rgba(37,99,235,0.12)]"
                >
                  <div className={`inline-flex self-start rounded-full px-4 py-2 text-sm font-semibold ${module.accentClass}`}>
                    {module.title}
                  </div>

                  <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/10">
                    <Icon className="h-5 w-5" />
                  </div>

                  <p className="mt-5 text-base leading-8 text-slate-600">
                    {module.description}
                  </p>

                  <div className="mt-6 space-y-2">
                    {module.highlights.map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm text-slate-700">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-8">
                    <a
                      href={module.href}
                      className="inline-flex items-center gap-2 text-lg font-semibold text-slate-950 transition hover:text-blue-700"
                    >
                      {module.ctaLabel}
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
