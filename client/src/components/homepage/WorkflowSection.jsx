const WorkflowSection = () => {
  const steps = [
    {
      step: '01',
      title: 'Run Strategy Analysis',
      description:
        'Analyze your recent content, profile context, and positioning so the system starts from your real baseline instead of generic assumptions.',
      tone: 'border-blue-200 bg-blue-50 text-blue-900'
    },
    {
      step: '02',
      title: 'Generate High-Signal Prompt Pack',
      description:
        'Create a quality-first prompt pack (11-14 prompts) tuned to your niche, audience, and goals so every generation starts with strong direction.',
      tone: 'border-purple-200 bg-purple-50 text-purple-900'
    },
    {
      step: '03',
      title: 'Create Publish-Ready Content Plan',
      description:
        'Auto-generate 4 publish-ready posts with schedule suggestions, approve or reject quickly, and push selected posts to Compose in one click.',
      tone: 'border-green-200 bg-green-50 text-green-900'
    },
    {
      step: '04',
      title: 'Learn and Improve Automatically',
      description:
        'Context Vault ingests queue reviews and analytics performance so the next strategy cycle learns what worked and avoids what failed.',
      tone: 'border-orange-200 bg-orange-50 text-orange-900'
    }
  ]

  return (
    <section className="py-24 bg-gradient-to-br from-white via-neutral-50 to-primary-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-extrabold text-neutral-900 mb-4 tracking-tight">
            From Strategy to Reliable Publishing
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            A practical loop for creators and teams: analyze, generate quality prompts, publish ready-to-use content, and learn from real outcomes.
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
