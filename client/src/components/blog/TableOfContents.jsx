import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, List } from 'lucide-react';

const TableOfContents = ({ items = [] }) => {
  const [activeId, setActiveId] = useState(items[0]?.id || null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const headingIds = useMemo(() => items.map((item) => item.id), [items]);

  useEffect(() => {
    if (!headingIds.length) return;

    const handleScroll = () => {
      const topOffset = 140;
      let current = headingIds[0];

      headingIds.forEach((id) => {
        const element = document.getElementById(id);
        if (!element) return;
        if (element.getBoundingClientRect().top <= topOffset) current = id;
      });

      setActiveId(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headingIds]);

  if (!items.length) return null;

  const handleSelect = (id) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveId(id);
    setMobileOpen(false);
  };

  return (
    <>
      <div className="mb-6 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left font-semibold text-slate-800 shadow-sm"
          aria-expanded={mobileOpen}
        >
          <span className="inline-flex items-center gap-2">
            <List className="h-4 w-4" />
            Table of Contents
          </span>
          <ChevronDown className={`h-4 w-4 transition ${mobileOpen ? 'rotate-180' : ''}`} />
        </button>

        {mobileOpen ? (
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                      activeId === item.id
                        ? 'bg-blue-50 font-semibold text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    } ${item.level === 3 ? 'pl-6' : ''}`}
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <aside className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block lg:self-start">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">On this page</p>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                  activeId === item.id
                    ? 'bg-blue-50 font-semibold text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                } ${item.level === 3 ? 'pl-6' : ''}`}
              >
                {item.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
};

export default TableOfContents;
