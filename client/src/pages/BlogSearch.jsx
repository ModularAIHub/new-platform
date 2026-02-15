import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';
import BlogHero from '../components/blog/BlogHero';
import SearchBar from '../components/blog/SearchBar';
import BlogGrid from '../components/blog/BlogGrid';
import { getPublishedBlogPosts } from '../data/blogPosts';
import { paginatePosts, searchPosts } from '../utils/blogHelpers';

const ALL_POSTS = getPublishedBlogPosts();

const BlogSearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const pageParam = Number(searchParams.get('page') || 1);
  const [searchInput, setSearchInput] = useState(urlQuery);

  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed === urlQuery) return;

      const next = new URLSearchParams(searchParams);
      if (trimmed) {
        next.set('q', trimmed);
      } else {
        next.delete('q');
      }
      next.delete('page');
      setSearchParams(next, { replace: true });
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput, searchParams, setSearchParams, urlQuery]);

  const results = useMemo(() => searchPosts(urlQuery, ALL_POSTS), [urlQuery]);
  const paginated = useMemo(() => paginatePosts(results, pageParam), [results, pageParam]);

  const updatePage = (page) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next);
  };

  return (
    <>
      <Helmet>
        <title>
          {urlQuery ? `Search "${urlQuery}" | SuiteGenie Blog` : 'Search Blog | SuiteGenie Blog'}
        </title>
        <meta
          name="description"
          content="Search SuiteGenie blog posts by title, excerpt, content, and tags."
        />
        <link
          rel="canonical"
          href={`https://suitegenie.in/blogs/search${urlQuery ? `?q=${encodeURIComponent(urlQuery)}` : ''}`}
        />
      </Helmet>

      <main className="min-h-screen bg-slate-50 pb-20">
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <BlogHero title="Search SuiteGenie Blog" subtitle="Find guides, updates, and trend breakdowns fast.">
            <SearchBar value={searchInput} onChange={setSearchInput} />
          </BlogHero>

          <section className="mt-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900">
                  {urlQuery ? `Results for "${urlQuery}"` : 'Start typing to search'}
                </h2>
                <p className="mt-1 text-slate-600">
                  Search title, excerpt, tags, and full content across all posts.
                </p>
              </div>
              <p className="text-sm text-slate-500">{results.length} results</p>
            </div>

            <BlogGrid
              posts={urlQuery ? paginated.posts : []}
              emptyMessage={
                urlQuery
                  ? 'Try broader keywords like "twitter automation", "pricing", or "agency workflow".'
                  : 'Search for a topic to view matching posts.'
              }
            />
          </section>

          {urlQuery && paginated.totalPages > 1 ? (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: paginated.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => updatePage(pageNumber)}
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

          <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">Looking for a specific workflow?</h3>
            <p className="mt-2 text-slate-600">
              Check category archives for focused content on guides, updates, and comparisons.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/blogs/category/guides"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Guides
              </Link>
              <Link
                to="/blogs/category/updates"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Updates
              </Link>
              <Link
                to="/blogs/category/comparisons"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Comparisons
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default BlogSearchPage;
