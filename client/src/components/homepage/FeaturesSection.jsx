import { Card, CardContent } from '../ui'
import { Twitter, Linkedin, FileText, AtSign, Zap } from 'lucide-react'

const FeaturesSection = () => {
  const platforms = [
    {
      icon: <Twitter className="w-8 h-8" />,
      title: 'Tweet Genie',
      description:
        'Platform-native X content engine with strategy-aware generation, automation workflows, and cross-post controls for connected destinations.',
      color: 'from-blue-500 to-blue-600',
      stats: 'Strategy plus automation plus X execution',
      features: ['Thread and single-post workflows', 'Content flow operations', 'Performance analytics'],
      url: 'https://tweet.suitegenie.in'
    },
    {
      icon: <Linkedin className="w-8 h-8" />,
      title: 'LinkedIn Genie',
      description:
        'Strategy Builder powered LinkedIn workflow with prompt packs, content plans, and Context Vault learning from real approvals and analytics.',
      color: 'from-blue-600 to-blue-700',
      stats: 'Publish-ready LinkedIn ops for creators and teams',
      features: ['11-14 high-signal prompts', '4-post content plan queue', 'Context Vault learning loop'],
      url: 'https://linkedin.suitegenie.in',
      ctaLabel: 'Access LinkedIn Genie',
      ctaClass: 'bg-blue-700 hover:bg-blue-800 focus:ring-blue-500'
    },
    {
      icon: <AtSign className="w-8 h-8" />,
      title: 'Social Genie',
      description:
        'Meta-oriented workflow for Threads and expanding channels with centralized flow, cross-post controls, and history visibility.',
      color: 'from-slate-700 to-slate-900',
      stats: 'Threads live now; Instagram plus YouTube rollout',
      features: ['Threads publishing (live)', 'Automation flow and history', 'Cross-post controls', 'Post analytics'],
      url: 'https://meta.suitegenie.in',
      ctaLabel: 'Access Social Genie',
      ctaClass: 'bg-slate-700 hover:bg-slate-800 focus:ring-slate-500'
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'WordPress Automator',
      description:
        'Transform your blog pipeline with SEO-aligned drafting, planned publishing, and reusable long-form workflows.',
      color: 'from-neutral-600 to-neutral-700',
      stats: 'Long-form content operations',
      features: ['SEO-oriented drafting', 'Publishing workflow', 'Content planning']
    }
  ]

  return (
    <section className="pt-8 pb-24 bg-gradient-to-br from-neutral-50 via-primary-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
              <Zap className="w-4 h-4" />
              Product Modules
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 tracking-tight">
            Product Modules for Full Content Ops
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            Each module handles channel-native creation and publishing while staying connected to strategy, automation, and cross-post workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {platforms.map((platform, index) => (
            <Card
              key={platform.title}
              variant="interactive"
              className="text-center hover-lift animate-fade-in h-full"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-8 h-full flex flex-col">
                <div className={`w-16 h-16 bg-gradient-to-br ${platform.color} rounded-xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg`}>
                  {platform.icon}
                </div>

                <h3 className="text-2xl font-bold text-neutral-900 mb-4">{platform.title}</h3>

                <p className="text-neutral-600 leading-relaxed mb-6">{platform.description}</p>

                <div className="bg-primary-50 rounded-lg p-3 mb-4">
                  <p className="text-sm font-semibold text-primary-700">{platform.stats}</p>
                </div>

                <div className="space-y-2 mt-auto">
                  {platform.features.map((feature) => (
                    <div key={feature} className="flex items-center justify-center gap-2 text-sm text-neutral-600">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                  {platform.url && (
                    <div className="mt-6 flex justify-center">
                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-block px-5 py-2 text-white font-semibold rounded-lg shadow focus:outline-none focus:ring-2 transition ${platform.ctaClass || 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'}`}
                        title={`Open ${platform.title}`}
                      >
                        {platform.ctaLabel || `Access ${platform.title}`}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
