import { Link } from 'react-router-dom';
import { Clock3 } from 'lucide-react';
import {
  calculateReadTime,
  getPostDisplayDate,
  getCategoryMeta,
  getPostUrl,
  truncateText,
} from '../../utils/blogHelpers';

const BlogCard = ({ post, compact = false }) => {
  const categoryMeta = getCategoryMeta(post.category);
  const description = truncateText(post.excerpt, 100);
  const readTime = post.readTime || calculateReadTime(post.content);

  return (
    <article className="group h-full">
      <Link
        to={getPostUrl(post)}
        className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-xl"
      >
        <div className="relative">
          <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100">
            <img
              src={post.featuredImage?.url}
              alt={post.featuredImage?.alt || post.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
          <span
            className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-[0.7rem] font-bold tracking-widest uppercase shadow-sm ${categoryMeta.badgeClass}`}
          >
            {categoryMeta.label}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <h3
            className={`${compact ? 'text-lg' : 'text-xl sm:text-2xl'} font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-700`}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {post.title}
          </h3>

          <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 line-clamp-3">{description}</p>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
            <div className="flex items-center gap-3">
              <img
                src={post.author?.avatar}
                alt={post.author?.name || 'Author avatar'}
                loading="lazy"
                className="h-9 w-9 rounded-full border border-slate-200 object-cover shadow-sm"
              />
              <div className="flex flex-col">
                <p className="text-sm font-bold text-slate-900">{post.author?.name}</p>
                <p className="text-xs font-medium text-slate-500">{getPostDisplayDate(post)}</p>
              </div>
            </div>
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <Clock3 className="h-4 w-4" />
              {readTime}m
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default BlogCard;
