import BlogCard from './BlogCard';

const RelatedPosts = ({ posts = [] }) => {
  if (!posts.length) return null;

  return (
    <section>
      <h2 className="text-3xl font-extrabold text-slate-900">Related Posts</h2>
      <p className="mt-2 text-slate-600">Read next based on this topic.</p>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} compact />
        ))}
      </div>
    </section>
  );
};

export default RelatedPosts;
