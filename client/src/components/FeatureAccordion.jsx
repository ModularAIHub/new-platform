export default function FeatureAccordion({ features, openIndex, setOpenIndex }) {
  return (
    <div className="w-full">
      {features.map((f, i) => (
        <div
          key={f.title}
          className="border-b border-white/10"
        >
          <button
            className="w-full flex justify-between items-center py-5 text-left focus:outline-none"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span className="font-semibold text-lg text-white">{f.title}</span>
            <span className="ml-4 text-cyan-400 text-xl transition-transform duration-200"
              style={{ transform: openIndex === i ? "rotate(90deg)" : "rotate(0deg)" }}>
              ▶
            </span>
          </button>
          {openIndex === i && (
            <div className="pb-2 pl-2 text-gray-300 transition-all duration-300">
              {f.desc}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
