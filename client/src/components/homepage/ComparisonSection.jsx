import React from 'react'

const ComparisonSection = () => {
  const features = [
    {
      name: 'Public client approval links',
      ourPlatform: true,
      hootsuite: 'partial',
      buffer: false,
      later: false,
      sproutSocial: 'partial'
    },
    {
      name: 'Draft comments attached to approval flow',
      ourPlatform: true,
      hootsuite: 'partial',
      buffer: false,
      later: false,
      sproutSocial: 'partial'
    },
    {
      name: 'BYOK multi-LLM support',
      ourPlatform: true,
      hootsuite: false,
      buffer: false,
      later: false,
      sproutSocial: false
    },
    {
      name: 'Workspace-aware client onboarding links',
      ourPlatform: true,
      hootsuite: false,
      buffer: false,
      later: false,
      sproutSocial: false
    },
    {
      name: 'AI generation with brand context carried into drafts',
      ourPlatform: true,
      hootsuite: 'partial',
      buffer: false,
      later: false,
      sproutSocial: 'partial'
    },
    {
      name: 'India-friendly pricing model',
      ourPlatform: 'INR-first',
      hootsuite: '$99+/mo',
      buffer: '$5+/channel',
      later: '$16.67+/mo',
      sproutSocial: '$249+/mo'
    }
  ]

  const renderFeatureCell = (value) => {
    if (value === true) {
      return (
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )
    }

    if (value === false) {
      return (
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      )
    }

    if (value === 'partial') {
      return (
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500">
          <span className="text-sm font-bold text-white">~</span>
        </div>
      )
    }

    return <span className="block text-center">{value}</span>
  }

  return (
    <section className="bg-gradient-to-br from-gray-950 via-slate-900 to-blue-950 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-blue-400/20 bg-blue-500/20 px-6 py-3 text-sm font-semibold text-blue-300">
            Not Basic Automation
          </div>
          <h2 className="mb-6 text-5xl font-light text-white">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              SuiteGenie vs Basic Social Suites
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-slate-300">
            The difference is not just posting. It is approvals, onboarding, brand context, BYOK flexibility,
            and agency workflows that do not feel bolted on.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-cyan-500/20">
                  <th className="p-6 text-left text-lg font-semibold text-white">Capability</th>
                  <th className="p-6 text-center text-lg font-semibold text-white">
                    <div className="flex flex-col items-center">
                      <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text font-bold text-transparent">SuiteGenie</span>
                      <div className="mt-1 h-1 w-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-300"></div>
                    </div>
                  </th>
                  <th className="p-6 text-center font-semibold text-slate-300">Hootsuite</th>
                  <th className="p-6 text-center font-semibold text-slate-300">Buffer</th>
                  <th className="p-6 text-center font-semibold text-slate-300">Later</th>
                  <th className="p-6 text-center font-semibold text-slate-300">Sprout Social</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature) => (
                  <tr key={feature.name} className="border-b border-white/5 transition-colors hover:bg-white/5">
                    <td className="p-6 font-medium text-white">{feature.name}</td>
                    <td className="p-6 text-center">
                      {feature.name === 'India-friendly pricing model' ? (
                        <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-2xl font-bold text-transparent">
                          {feature.ourPlatform}
                        </span>
                      ) : (
                        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-500">
                          <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="p-6 text-center text-slate-300">
                      {feature.name === 'India-friendly pricing model' ? feature.hootsuite : renderFeatureCell(feature.hootsuite)}
                    </td>
                    <td className="p-6 text-center text-slate-300">
                      {feature.name === 'India-friendly pricing model' ? feature.buffer : renderFeatureCell(feature.buffer)}
                    </td>
                    <td className="p-6 text-center text-slate-300">
                      {feature.name === 'India-friendly pricing model' ? feature.later : renderFeatureCell(feature.later)}
                    </td>
                    <td className="p-6 text-center text-slate-300">
                      {feature.name === 'India-friendly pricing model' ? feature.sproutSocial : renderFeatureCell(feature.sproutSocial)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-8 py-4">
            <span className="text-lg font-semibold text-green-300">
              Tighter workflows, lower software spend, and less client friction.
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ComparisonSection
