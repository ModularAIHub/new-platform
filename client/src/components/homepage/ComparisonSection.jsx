import React from 'react'

const ComparisonSection = () => {
  const features = [
    {
      name: 'Platform-native content generation',
      ourPlatform: true,
      hootsuite: false,
      buffer: false,
      later: false,
      sproutSocial: 'partial'
    },
    {
      name: 'Strategy builder',
      ourPlatform: true,
      hootsuite: false,
      buffer: false,
      later: false,
      sproutSocial: 'partial'
    },
    {
      name: 'Competitor analysis workflow',
      ourPlatform: true,
      hootsuite: false,
      buffer: false,
      later: false,
      sproutSocial: 'partial'
    },
    {
      name: 'Content queue orchestration',
      ourPlatform: true,
      hootsuite: true,
      buffer: true,
      later: true,
      sproutSocial: true
    },
    {
      name: 'Cross-post routing in team context',
      ourPlatform: true,
      hootsuite: 'partial',
      buffer: false,
      later: false,
      sproutSocial: 'partial'
    },
    {
      name: 'BYOK + platform mode',
      ourPlatform: true,
      hootsuite: false,
      buffer: false,
      later: false,
      sproutSocial: false
    },
    {
      name: 'Starting price',
      ourPlatform: 'Free',
      hootsuite: '$99/mo',
      buffer: '$5/mo',
      later: '$7.50/mo',
      sproutSocial: '$249/mo'
    }
  ]

  const renderFeatureCell = (value) => {
    if (value === true) {
      return (
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )
    }
    if (value === false) {
      return (
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      )
    }
    if (value === 'partial') {
      return (
        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mx-auto">
          <span className="text-white text-sm font-bold">~</span>
        </div>
      )
    }
    return <span className="text-center block">{value}</span>
  }

  return (
    <section className="py-24 bg-gradient-to-br from-gray-950 via-slate-900 to-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-6 py-3 bg-blue-500/20 rounded-full text-sm font-semibold text-blue-300 mb-6 border border-blue-400/20">
            Not Scheduler-Only
          </div>
          <h2 className="text-5xl font-light text-white mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              SuiteGenie vs Scheduler-Only Tools
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Scheduling is table stakes. Strategy, competitor analysis, platform-native generation, and routing are where teams actually win.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10">
                  <th className="text-left p-6 text-white font-semibold text-lg">Capability</th>
                  <th className="text-center p-6 text-white font-semibold text-lg">
                    <div className="flex flex-col items-center">
                      <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-bold">SuiteGenie</span>
                      <div className="w-8 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mt-1"></div>
                    </div>
                  </th>
                  <th className="text-center p-6 text-slate-300 font-semibold">Hootsuite</th>
                  <th className="text-center p-6 text-slate-300 font-semibold">Buffer</th>
                  <th className="text-center p-6 text-slate-300 font-semibold">Later</th>
                  <th className="text-center p-6 text-slate-300 font-semibold">Sprout Social</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature) => (
                  <tr key={feature.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-6 text-white font-medium">{feature.name}</td>
                    <td className="p-6 text-center">
                      {feature.name === 'Starting price' ? (
                        <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                          {feature.ourPlatform}
                        </span>
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="p-6 text-center">
                      {feature.name === 'Starting price' ? <span className="text-slate-300">{feature.hootsuite}</span> : renderFeatureCell(feature.hootsuite)}
                    </td>
                    <td className="p-6 text-center">
                      {feature.name === 'Starting price' ? <span className="text-slate-300">{feature.buffer}</span> : renderFeatureCell(feature.buffer)}
                    </td>
                    <td className="p-6 text-center">
                      {feature.name === 'Starting price' ? <span className="text-slate-300">{feature.later}</span> : renderFeatureCell(feature.later)}
                    </td>
                    <td className="p-6 text-center">
                      {feature.name === 'Starting price' ? <span className="text-slate-300">{feature.sproutSocial}</span> : renderFeatureCell(feature.sproutSocial)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-400/30">
            <span className="text-green-300 font-semibold text-lg">
              Build strategy, find competitor gaps, then publish where you can excel.
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ComparisonSection
