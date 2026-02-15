import { Search, X } from 'lucide-react';

const SearchBar = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search articles, tags, and topics...',
  className = '',
}) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSubmit) onSubmit(value);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`.trim()}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-12 text-base text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        aria-label="Search blog posts"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </form>
  );
};

export default SearchBar;
