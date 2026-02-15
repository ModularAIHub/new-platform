import { BLOG_CATEGORY_ORDER, BLOG_CATEGORY_META } from '../../data/blogPosts';

const CategoryFilter = ({ activeCategory = 'all', onChange }) => (
  <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
    {BLOG_CATEGORY_ORDER.map((key) => {
      const category = BLOG_CATEGORY_META[key];
      const active = activeCategory === key;
      return (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
            active
              ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
          }`}
          aria-pressed={active}
        >
          {category.label}
        </button>
      );
    })}
  </div>
);

export default CategoryFilter;
