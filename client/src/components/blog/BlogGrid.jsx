import BlogCard from './BlogCard';

const BlogGrid = ({ posts = [], emptyMessage = 'No posts found.' }) => {
  if (!posts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
        <h3 className="text-2xl font-bold text-slate-800">No results found</h3>
        <p className="mt-3 text-slate-600">{emptyMessage}</p>
        <p className="mt-2 text-sm text-slate-500">
          Try broader keywords, remove filters, or browse another category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default BlogGrid;
