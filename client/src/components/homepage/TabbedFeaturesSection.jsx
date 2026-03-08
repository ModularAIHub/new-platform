import { useState } from 'react'

const TabbedFeaturesSection = () => {
  const [activeTab, setActiveTab] = useState('strategy')

  const tabs = [
    {
      id: 'strategy',
      label: 'Strategy Builder',
      desc: 'Turn signals into a clear plan.',
      content: {
        title: 'Strategy Builder That Removes Guesswork',
        body: 'Run setup -> review -> prompt pack -> content plan -> context vault in one guided flow. You get execution-ready output, not vague strategy notes.',
        bullets: [
          'Niche, audience, tone, and goals synced before generation',
          'Clear next-best-step guidance for first-time users',
          'Quality-first flow designed for repeatable weekly output'
        ]
      }
    },
    {
      id: 'competitor',
      label: 'Prompt Pack',
      desc: 'High-signal prompts, not filler.',
      content: {
        title: 'Prompt Packs Built for Quality Over Quantity',
        body: 'LinkedIn prompt packs now target a tighter 11-14 range with better specificity so users can actually execute instead of sorting through generic prompts.',
        bullets: [
          'Prompt usage tracking with used-state persistence',
          'Regeneration signals based on stale/used prompts',
          'Prompt-to-compose handoff with cleaner context payloads'
        ]
      }
    },
    {
      id: 'content',
      label: 'Content Plan',
      desc: 'Publish-ready posts generated for you.',
      content: {
        title: 'Generate a Publish-Ready Queue Automatically',
        body: 'After prompt generation, SuiteGenie can auto-generate a strategy-scoped Content Plan with ready-to-edit posts, schedule suggestions, and approval controls.',
        bullets: [
          'Fixed queue target for quality control',
          'Approve, reject, schedule, and compose handoff in one place',
          'Fallback hardening to avoid identity-like low-quality outputs'
        ]
      }
    },
    {
      id: 'queue',
      label: 'Context Vault',
      desc: 'Memory that improves each cycle.',
      content: {
        title: 'Context Vault Learns from Real Outcomes',
        body: 'Context Vault stores strategy, profile, usage, review, and analytics signals. It refreshes after key actions so the next generation cycle gets smarter.',
        bullets: [
          'Learns from approve/reject/schedule actions',
          'Learns from analytics sync and post outcomes',
          'Feeds recommendations back into strategy and prompts'
        ],
      }
    },
    {
      id: 'pro',
      label: 'Pro Team Mode',
      desc: 'Operate cleanly across clients and brands.',
      content: {
        title: 'Team Workspaces + Account Model',
        body: 'Power users and agencies can run structured operations with shared account pools, role-based execution, and account-aware publishing controls.',
        bullets: [
          'Shared account pool in team context',
          'Cross-post to authorized connected accounts',
          'Team-ready workflows for multiple handles and clients'
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
            This Is More Than Execution
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Strategy, prompt quality, publish-ready execution, and learning loops in one workflow.
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
