const WorkflowSection = () => {
  const steps = [
    {
      step: '01',
      title: 'Set up the workspace',
      description:
        'Capture client identity, connect the right channels, and let SuiteGenie pull in audience and brand context before the first draft is generated.',
      tone: 'border-blue-200 bg-blue-50 text-blue-900'
    },
    {
      step: '02',
      title: 'Generate or refine drafts with context',
      description:
        'Use channel-specific generation, prompt guidance, and BYOK options without losing the workspace context that keeps content on-brand.',
      tone: 'border-purple-200 bg-purple-50 text-purple-900'
    },
    {
      step: '03',
      title: 'Send clients a clean approval flow',
      description:
        'Share a no-login approval link so feedback, comments, approve, and reject actions happen inside the draft flow instead of email threads.',
      tone: 'border-green-200 bg-green-50 text-green-900'
    },
    {
      step: '04',
      title: 'Queue, publish, and learn',
      description:
        'Move approved work into the calendar, publish from connected channels, and use the next cycle of analytics and comments to sharpen what comes next.',
      tone: 'border-orange-200 bg-orange-50 text-orange-900'
    }
  ]

  return (
    <section className="py-24 bg-gradient-to-br from-white via-neutral-50 to-primary-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-extrabold text-neutral-900 mb-4 tracking-tight">
            From client setup to approval to publishing
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            A practical loop for creators, teams, and agencies that want less operational mess around social media execution.
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
