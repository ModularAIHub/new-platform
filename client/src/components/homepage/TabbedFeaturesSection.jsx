import { useState } from 'react'

const TabbedFeaturesSection = () => {
  const [activeTab, setActiveTab] = useState('strategy')

  const tabs = [
    {
      id: 'strategy',
      label: 'Agency Workspaces',
      desc: 'Client operations, not just drafts.',
      content: {
        title: 'A client workspace is the unit of work, not an afterthought',
        body: 'Each client gets brand context, connections, drafts, queue, calendar, analytics, approvals, and team access in one place so agencies can stop stitching together separate tools.',
        bullets: [
          'Workspace setup, comments, review, and publishing stay attached to the same client',
          'Team assignment and launch context keep the right accounts visible to the right people',
          'Mobile and desktop flows now reflect actual day-to-day agency operations'
        ]
      }
    },
    {
      id: 'competitor',
      label: 'BYOK AI',
      desc: 'Use your own model stack when needed.',
      content: {
        title: 'Bring your own models without losing workflow control',
        body: 'SuiteGenie supports platform credits and BYOK mode together, which matters when creators want flexibility and agencies need tighter AI cost control.',
        bullets: [
          'OpenAI, Gemini, and Perplexity keys can sit inside the same product flow',
          'BYOK credits run higher so heavier users are not boxed into one provider choice',
          'Generation still uses workspace context instead of dropping to a blank prompt box'
        ]
      }
    },
    {
      id: 'content',
      label: 'Approval Portal',
      desc: 'Client review without account creation.',
      content: {
        title: 'Client approval should not require another login',
        body: 'Public approval links let clients review pending drafts, approve them, reject them, and leave comments in-context instead of emailing screenshots and feedback chains.',
        bullets: [
          'One secure link can unlock a clean approval surface for the client',
          'Comments stay attached to the draft so agency and client context stays together',
          'Approvals feed directly back into the queue and publishing workflow'
        ]
      }
    },
    {
      id: 'queue',
      label: 'Client Onboarding',
      desc: 'Safer account connection flow.',
      content: {
        title: 'Clients can connect their own accounts through guided links',
        body: 'Instead of asking for raw credentials, agencies can send expiring onboarding links so clients connect accounts to the right workspace with clearer trust and less friction.',
        bullets: [
          'Workspace-aware onboarding keeps accounts routed to the correct client',
          'OAuth-first flows reduce password sharing and manual cleanup',
          'Setup feels more premium when the client sees a purpose-built handoff'
        ],
      }
    },
    {
      id: 'pro',
      label: 'Idea Bank',
      desc: 'Signal-driven ideas with next actions.',
      content: {
        title: 'Idea generation is stronger when it reads the workspace first',
        body: 'SuiteGenie can propose ideas from connected account signals, competitor references, themes, queue pressure, and the brand context already saved in the workspace.',
        bullets: [
          'Ideas are more useful when they already know the audience and platform mix',
          'Draft handoff into Compose keeps planning and writing close together',
          'The system can suggest next moves instead of just dumping prompts'
        ]
      }
    }
  ]

  const current = tabs.find((tab) => tab.id === activeTab) || tabs[0]

  return (
    <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-sm font-bold tracking-widest text-primary-400 uppercase mb-3">
            Product Depth
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            The product story is stronger when the workflow reads like real client operations.
          </p>
        </div>

        <div className="bg-gray-900/75 border border-gray-700/70 rounded-2xl p-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-3 text-left transition-all duration-200 border ${activeTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-gray-800/70 text-gray-200 border-gray-700 hover:border-gray-500'
                  }`}
              >
                <div className="text-sm font-semibold">{tab.label}</div>
                <div className="text-xs mt-1 opacity-85">{tab.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/95 border border-gray-700 rounded-2xl p-8 lg:p-10">
          <h3 className="text-3xl font-bold text-white mb-4">{current.content.title}</h3>
          <p className="text-lg text-gray-200 mb-8 max-w-4xl">{current.content.body}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {current.content.bullets.map((bullet) => (
              <div
                key={bullet}
                className="rounded-xl border border-gray-600 bg-gray-800/70 px-4 py-3 text-sm text-gray-200"
              >
                {bullet}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TabbedFeaturesSection
