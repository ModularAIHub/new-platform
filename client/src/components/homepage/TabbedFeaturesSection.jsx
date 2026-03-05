import { useState } from 'react'

const TabbedFeaturesSection = () => {
  const [activeTab, setActiveTab] = useState('strategy')

  const tabs = [
    {
      id: 'strategy',
      label: 'Strategy Builder',
      desc: 'Turn data into practical content direction.',
      content: {
        title: 'Strategy Builder That Moves You Past Guesswork',
        body: 'SuiteGenie analyzes account-level performance and outputs practical direction: content angles, timing signals, and prompt-ready ideas tied to your goals.',
        bullets: [
          'Audience and performance-aware recommendations',
          'Actionable prompts instead of generic suggestions',
          'Built for continuous iteration'
        ]
      }
    },
    {
      id: 'competitor',
      label: 'Competitor Analysis',
      desc: 'Find where competitors are weak and you can win.',
      content: {
        title: 'Analyze Yourself and Competitors, Then Outpublish Them',
        body: 'The competitor workflow identifies gaps in format, positioning, and cadence. You then publish exactly where they are weak and your brand can excel.',
        bullets: [
          'Track competitor patterns and blind spots',
          'Extract content opportunities by theme',
          'Convert insights into posting ideas quickly'
        ]
      }
    },
    {
      id: 'content',
      label: 'Platform-Native Generation',
      desc: 'Create natively, then adapt for cross-post.',
      content: {
        title: 'Deep AI Generation For Each Platform First',
        body: 'SuiteGenie writes for platform context first, not generic filler. After native generation, cross-post adaptation keeps structure and intent aligned to each destination.',
        bullets: [
          'Native-first writing workflow',
          'Tone and structure tuned to channel behavior',
          'Cross-post adaptation with context retention'
        ]
      }
    },
    {
      id: 'queue',
      label: 'Content Queue + Cross-Post',
      desc: 'Control publishing from one queue.',
      content: {
        title: 'Queue Once, Route Everywhere You Are Connected',
        body: 'Move approved drafts into a queue, set scheduling, and route cross-posts through connected accounts without rebuilding each post from scratch.',
        bullets: [
          'Central queue for planned execution',
          'Cross-post routing across connected channels',
          'Scheduling with operational control'
        ]
      }
    },
    {
      id: 'pro',
      label: 'Pro Team Mode',
      desc: 'Built for power users and small agencies.',
      content: {
        title: 'Pro Mode For Multi-Handle Teams',
        body: 'Power users and small agencies can operate from team space: shared connected accounts, coordinated queue management, and cross-post to authorized team-linked destinations.',
        bullets: [
          'Shared account pool in team context',
          'Cross-post to authorized connected accounts',
          'Team-ready operations for multiple handles'
        ]
      }
    }
  ]

  const current = tabs.find((tab) => tab.id === activeTab) || tabs[0]

  return (
    <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-blue-500/30">
            Core Differentiators
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            This Is More Than Scheduling
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Strategy, competitor intelligence, platform-native generation, queue orchestration, and pro team routing in one workflow.
          </p>
        </div>

        <div className="bg-gray-900/75 border border-gray-700/70 rounded-2xl p-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-3 text-left transition-all duration-200 border ${
                  activeTab === tab.id
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
