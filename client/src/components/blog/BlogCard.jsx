import { Link } from 'react-router-dom';
import { Clock3 } from 'lucide-react';
import {
  calculateReadTime,
  formatDate,
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
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
      >
        <div className="relative">
          <div className="aspect-video w-full overflow-hidden bg-slate-100">
            <img
              src={post.featuredImage?.url}
              alt={post.featuredImage?.alt || post.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
          <span
            className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold ${categoryMeta.badgeClass}`}
          >
            {categoryMeta.label}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3
            className={`${compact ? 'text-lg' : 'text-xl'} font-bold leading-snug text-slate-900`}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {post.title}
          </h3>

          <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{description}</p>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3">
              <img
                src={post.author?.avatar}
                alt={post.author?.name || 'Author avatar'}
                loading="lazy"
                className="h-9 w-9 rounded-full border border-slate-200 object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">{post.author?.name}</p>
                <p className="text-xs text-slate-500">{formatDate(post.publishDate)}</p>
              </div>
            </div>
            <p className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
              <Clock3 className="h-3.5 w-3.5" />
              {readTime} min read
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default BlogCard;
