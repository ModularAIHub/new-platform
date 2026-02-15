const BlogPost = ({ html }) => (
  <article
    className="blog-content rounded-2xl border border-slate-200 bg-white px-5 py-8 shadow-sm sm:px-8"
    dangerouslySetInnerHTML={{ __html: html }}
  />
);

export default BlogPost;
