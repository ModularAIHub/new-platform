import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { ArrowRight, Clock3, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import BlogHero from '../components/blog/BlogHero';
import SearchBar from '../components/blog/SearchBar';
import CategoryFilter from '../components/blog/CategoryFilter';
import BlogGrid from '../components/blog/BlogGrid';
import { BLOG_CATEGORY_META, getPublishedBlogPosts } from '../data/blogIndex.generated';
import { formatDate, getPostUrl, paginatePosts, searchPosts } from '../utils/blogHelpers';

const ALL_POSTS = getPublishedBlogPosts();

const BlogPage = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
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
  }, [category, debouncedQuery]);

  const categoryLabel = BLOG_CATEGORY_META[category]?.label || 'All';

  const filteredPosts = useMemo(() => {
    const categoryPosts = category === 'all' ? ALL_POSTS : ALL_POSTS.filter((post) => post.category === category);
    return searchPosts(debouncedQuery, categoryPosts);
  }, [category, debouncedQuery]);

  const featuredPost = useMemo(() => {
    if (!filteredPosts.length) return null;
    return filteredPosts.find((post) => post.featured) || filteredPosts[0];
  }, [filteredPosts]);

  const gridSource = useMemo(() => {
    if (!featuredPost) return filteredPosts;
    return filteredPosts.filter((post) => post.id !== featuredPost.id);
  }, [featuredPost, filteredPosts]);

  const paginated = useMemo(() => paginatePosts(gridSource, page), [gridSource, page]);

  useEffect(() => {
    if (page > paginated.totalPages) setPage(1);
  }, [page, paginated.totalPages]);

  return (
    <>
      <Helmet>
        <title>SuiteGenie Blog | Social media automation insights, guides, and updates</title>
        <meta
          name="description"
          content="Read SuiteGenie blog for social media automation guides, product updates, comparisons, and actionable growth insights."
        />
        <meta
          name="keywords"
          content="social media automation blog, twitter automation guides, linkedin scheduling tips, suitegenie updates"
        />
        <link rel="canonical" href="https://suitegenie.in/blogs" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="SuiteGenie Blog" />
        <meta
          property="og:description"
          content="Social media automation insights, guides, and product updates from SuiteGenie."
        />
        <meta property="og:url" content="https://suitegenie.in/blogs" />
        <meta property="og:image" content="https://suitegenie.in/images/blog/suitegenie-launch-hero.svg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SuiteGenie Blog" />
        <meta
          name="twitter:description"
          content="Social media automation insights, guides, and product updates from SuiteGenie."
        />
        <meta name="twitter:image" content="https://suitegenie.in/images/blog/suitegenie-launch-hero.svg" />
      </Helmet>

      <main className="min-h-screen bg-slate-50 pb-20">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <BlogHero subtitle="Social media automation insights, guides, and product updates">
            <div className="grid gap-4 md:grid-cols-[minmax(0,_1fr)_auto] md:items-center">
              <SearchBar
                value={searchInput}
                onChange={setSearchInput}
                onSubmit={(value) => navigate(`/blogs/search?q=${encodeURIComponent(value || '')}`)}
              />
              <button
                type="button"
                onClick={() => navigate(`/blogs/search?q=${encodeURIComponent(searchInput || '')}`)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
              >
                Search Page
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </BlogHero>

          <section className="mt-6">
            <CategoryFilter activeCategory={category} onChange={setCategory} />
          </section>

          {featuredPost ? (
            <section className="mt-6">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                <Sparkles className="h-3.5 w-3.5" />
                Featured
              </p>
              <Link
                to={getPostUrl(featuredPost)}
                className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-lg"
              >
                <div className="grid gap-0 lg:grid-cols-[420px_minmax(0,_1fr)]">
                  <div className="h-56 overflow-hidden sm:h-64 lg:h-full">
                    <img
                      src={featuredPost.featuredImage.url}
                      alt={featuredPost.featuredImage.alt}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 sm:p-7">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${BLOG_CATEGORY_META[featuredPost.category].badgeClass}`}
                    >
                      {BLOG_CATEGORY_META[featuredPost.category].label}
                    </span>
                    <h2 className="mt-3 text-2xl font-extrabold leading-tight text-slate-900">{featuredPost.title}</h2>
                    <p className="mt-3 text-base leading-7 text-slate-600">{featuredPost.excerpt}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span>{formatDate(featuredPost.publishDate)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-4 w-4" />
                        {featuredPost.readTime} min read
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          ) : null}

          <section className="mt-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900">{categoryLabel} Articles</h2>
                <p className="mt-1 text-slate-600">{BLOG_CATEGORY_META[category]?.description}</p>
              </div>
              <p className="text-sm text-slate-500">{filteredPosts.length} results</p>
            </div>

            <BlogGrid
              posts={paginated.posts}
              emptyMessage="No articles match this filter yet. Try another category or keyword."
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

          <section className="mt-14 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 px-6 py-10 text-white sm:px-10">
            <h2 className="text-3xl font-extrabold">Get weekly social automation insights</h2>
            <p className="mt-3 max-w-2xl text-blue-100">
              Receive practical playbooks, product updates, and trend breakdowns for agencies and creators.
            </p>
            <form className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="you@company.com"
                className="h-12 flex-1 rounded-xl border border-white/30 bg-white/10 px-4 text-white outline-none placeholder:text-blue-100/80 focus:border-white/60 focus:ring-2 focus:ring-white/40"
                aria-label="Email address"
              />
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Subscribe
              </button>
            </form>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default BlogPage;
