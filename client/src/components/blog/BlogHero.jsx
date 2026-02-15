const BlogHero = ({ title = 'SuiteGenie Blog', subtitle, children }) => (
  <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-indigo-100 px-6 py-7 shadow-sm sm:px-8 sm:py-8">
    <div className="pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full bg-blue-300/20 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />
    <div className="relative z-10">
      <p className="mb-3 inline-flex rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
        Insights Hub
      </p>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
      {subtitle ? <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">{subtitle}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  </section>
);

export default BlogHero;
