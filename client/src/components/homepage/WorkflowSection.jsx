const WorkflowSection = () => {
  const steps = [
    {
      step: '01',
      title: 'Analyze Your Account',
      description:
        'Understand what your audience engages with, what formats perform, and where your current content pipeline breaks.',
      tone: 'border-blue-200 bg-blue-50 text-blue-900'
    },
    {
      step: '02',
      title: 'Analyze Competitors',
      description:
        'Map competitor patterns, detect gaps they are missing, then target those gaps where you can excel with better content angles.',
      tone: 'border-purple-200 bg-purple-50 text-purple-900'
    },
    {
      step: '03',
      title: 'Generate Platform-Specific Content',
      description:
        'Create content for each platform natively first. Then adapt and cross-post with context instead of generic copy-paste output.',
      tone: 'border-green-200 bg-green-50 text-green-900'
    },
    {
      step: '04',
      title: 'Automate, Route, and Publish',
      description:
        'Deploy approved content into automated flows, routing cross-posts to authorized connected accounts in Pro team workflows.',
      tone: 'border-orange-200 bg-orange-50 text-orange-900'
    }
  ]

  return (
    <section className="py-24 bg-gradient-to-br from-white via-neutral-50 to-primary-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-extrabold text-neutral-900 mb-4 tracking-tight">
            From Strategy to Posting Edge
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            This is the core workflow: analyze yourself and competitors, identify where they lack, then publish where you can win.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((item) => (
            <div
              key={item.step}
              className={`rounded-2xl border p-6 shadow-sm ${item.tone}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold tracking-wide opacity-80">Step {item.step}</span>
              </div>
              <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
              <p className="text-base leading-relaxed opacity-90">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WorkflowSection
