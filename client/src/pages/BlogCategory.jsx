import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Footer from '../components/Footer';
import BlogHero from '../components/blog/BlogHero';
import SearchBar from '../components/blog/SearchBar';
import BlogGrid from '../components/blog/BlogGrid';
import CategoryFilter from '../components/blog/CategoryFilter';
import { BLOG_CATEGORY_META, getPublishedBlogPosts } from '../data/blogIndex.generated';
import { paginatePosts, searchPosts } from '../utils/blogHelpers';

const ALL_POSTS = getPublishedBlogPosts();

const BlogCategoryPage = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const category = BLOG_CATEGORY_META[name] ? name : null;
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, category]);

  const posts = useMemo(() => {
    if (!category) return [];
    const categoryPosts = ALL_POSTS.filter((post) => post.category === category);
    return searchPosts(debouncedQuery, categoryPosts);
  }, [category, debouncedQuery]);

  const paginated = useMemo(() => paginatePosts(posts, page), [posts, page]);

  if (!category) {
    return (
      <>
        <main className="min-h-screen bg-slate-50 px-4 py-20">
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-3xl font-extrabold text-slate-900">Category not found</h1>
            <p className="mt-3 text-slate-600">This blog category does not exist.</p>
            <Link
              to="/blogs"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Back to Blog
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const categoryMeta = BLOG_CATEGORY_META[category];
  const pageTitle = `${categoryMeta.label} Articles | SuiteGenie Blog`;
  const pageDescription = categoryMeta.description;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`https://suitegenie.in/blogs/category/${category}`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`https://suitegenie.in/blogs/category/${category}`} />
      </Helmet>

      <main className="min-h-screen bg-slate-50 pb-20">
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <BlogHero title={`${categoryMeta.label} Articles`} subtitle={categoryMeta.description}>
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={(value) => navigate(`/blogs/search?q=${encodeURIComponent(value || '')}`)}
            />
          </BlogHero>

          <section className="mt-8">
            <CategoryFilter
              activeCategory={category}
              onChange={(value) => navigate(value === 'all' ? '/blogs' : `/blogs/category/${value}`)}
            />
          </section>

          <section className="mt-10">
            <div className="mb-5 flex items-end justify-between">
              <h2 className="text-3xl font-extrabold text-slate-900">{categoryMeta.label}</h2>
              <p className="text-sm text-slate-500">{posts.length} results</p>
            </div>
            <BlogGrid
              posts={paginated.posts}
              emptyMessage="No articles in this category yet. Try another topic."
            />
          </section>

          {paginated.totalPages > 1 ? (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: paginated.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`h-10 w-10 rounded-lg text-sm font-semibold transition ${
                    pageNumber === paginated.page
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
            </nav>
          ) : null}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default BlogCategoryPage;
