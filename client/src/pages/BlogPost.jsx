import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { CalendarDays, ChevronRight, Clock3 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Footer from '../components/Footer';
import BlogPostContent from '../components/blog/BlogPost';
import TableOfContents from '../components/blog/TableOfContents';
import ShareButtons from '../components/blog/ShareButtons';
import AuthorBio from '../components/blog/AuthorBio';
import RelatedPosts from '../components/blog/RelatedPosts';
import { BLOG_CATEGORY_META, getPublishedBlogPosts } from '../data/blogIndex.generated';
import {
  calculateReadTime,
  formatDate,
  generateTableOfContents,
  markdownToHTML,
} from '../utils/blogHelpers';
import { generateSchema } from '../utils/schemaGenerator';

const ALL_POSTS = getPublishedBlogPosts();

const BlogPostPage = () => {
  const { category, slug } = useParams();

  const postMeta = useMemo(
    () => ALL_POSTS.find((entry) => entry.category === category && entry.slug === slug),
    [category, slug]
  );

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadPost = async () => {
      if (!postMeta?.contentPath) {
        setPost(null);
        setLoadError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(postMeta.contentPath, { cache: 'force-cache' });
        if (!response.ok) {
          throw new Error(`Failed to fetch blog post (${response.status})`);
        }

        const payload = await response.json();
        if (!ignore) {
          setPost(payload);
        }
      } catch (error) {
        console.error('Failed to load blog post payload:', error);
        if (!ignore) {
          setPost(null);
          setLoadError(error);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadPost();

    return () => {
      ignore = true;
    };
  }, [postMeta?.contentPath]);

  const postHtml = useMemo(() => (post ? markdownToHTML(post.content) : ''), [post]);
  const tocItems = useMemo(() => (post ? generateTableOfContents(post.content) : []), [post]);
  const schemas = useMemo(() => (post ? generateSchema(post) : []), [post]);

  const relatedPosts = useMemo(() => {
    if (!postMeta) return [];

    return ALL_POSTS.filter((entry) => entry.id !== postMeta.id)
      .sort((a, b) => {
        const aBoost = a.category === postMeta.category ? 1 : 0;
        const bBoost = b.category === postMeta.category ? 1 : 0;
        if (aBoost !== bBoost) return bBoost - aBoost;
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      })
      .slice(0, 3);
  }, [postMeta]);

  if (!postMeta) {
    return (
      <>
        <main className="min-h-screen bg-slate-50 px-4 py-20">
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-3xl font-extrabold text-slate-900">Post not found</h1>
            <p className="mt-3 text-slate-600">This blog post might have moved or is not published yet.</p>
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

  if (loading && !post) {
    return (
      <>
        <main className="min-h-screen bg-slate-50 px-4 py-20">
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-3xl font-extrabold text-slate-900">Loading post...</h1>
            <p className="mt-3 text-slate-600">Preparing article content.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (loadError || !post) {
    return (
      <>
        <main className="min-h-screen bg-slate-50 px-4 py-20">
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-3xl font-extrabold text-slate-900">Unable to load post</h1>
            <p className="mt-3 text-slate-600">Please refresh and try again.</p>
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

  const categoryMeta = BLOG_CATEGORY_META[post.category] || BLOG_CATEGORY_META.all;
  const canonicalUrl = post.seo?.canonicalUrl || `https://suitegenie.in/blogs/${post.category}/${post.slug}`;
  const hasFaq = Boolean(post.schema?.faq?.length);
  const readTime = post.readTime || calculateReadTime(post.content);

  return (
    <>
      <Helmet>
        <title>{post.seo?.metaTitle || post.title}</title>
        <meta name="description" content={post.seo?.metaDescription || post.excerpt} />
        <meta name="keywords" content={(post.seo?.keywords || post.tags || []).join(', ')} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.seo?.metaTitle || post.title} />
        <meta property="og:description" content={post.seo?.metaDescription || post.excerpt} />
        <meta property="og:image" content={`https://suitegenie.in${post.featuredImage?.url}`} />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.seo?.metaTitle || post.title} />
        <meta name="twitter:description" content={post.seo?.metaDescription || post.excerpt} />
        <meta name="twitter:image" content={`https://suitegenie.in${post.featuredImage?.url}`} />

        <meta property="article:published_time" content={new Date(post.publishDate).toISOString()} />
        <meta property="article:modified_time" content={new Date(post.lastModified || post.publishDate).toISOString()} />
        <meta property="article:author" content={post.author?.name || 'SuiteGenie Team'} />
        <meta property="article:section" content={categoryMeta?.label || post.category} />

        {schemas.map((schema, index) => (
          <script key={`${post.id}-schema-${index}`} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>

      <main className="min-h-screen bg-slate-50 pb-20">
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <li>
                <Link to="/" className="hover:text-blue-700 hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <ChevronRight className="h-4 w-4" />
              </li>
              <li>
                <Link to="/blogs" className="hover:text-blue-700 hover:underline">
                  Blog
                </Link>
              </li>
              <li>
                <ChevronRight className="h-4 w-4" />
              </li>
              <li>
                <Link to={`/blogs/category/${post.category}`} className="hover:text-blue-700 hover:underline">
                  {categoryMeta.label}
                </Link>
              </li>
              <li>
                <ChevronRight className="h-4 w-4" />
              </li>
              <li className="font-medium text-slate-700">{post.title}</li>
            </ol>
          </nav>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${categoryMeta.badgeClass}`}>
              {categoryMeta.label}
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">{post.title}</h1>

            <div className="mt-6 flex flex-col gap-6 border-y border-slate-100 py-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={post.author.avatar}
                    alt={`${post.author.name} avatar`}
                    className="h-11 w-11 rounded-full border border-slate-200 object-cover"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">{post.author.name}</p>
                    <p className="text-sm text-slate-500">{post.author.bio}</p>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-200" />

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <p className="inline-flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    Published {formatDate(post.publishDate)}
                  </p>
                  <p>Updated {formatDate(post.lastModified || post.publishDate)}</p>
                  <p className="inline-flex items-center gap-1">
                    <Clock3 className="h-4 w-4" />
                    {readTime} min read
                  </p>
                </div>
              </div>

              <ShareButtons title={post.title} url={canonicalUrl} />
            </div>

            <figure className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
              <img
                src={post.featuredImage.url}
                alt={post.featuredImage.alt}
                className="h-full w-full object-cover"
                loading="eager"
              />
            </figure>
          </section>

          <section className="mt-8 lg:grid lg:grid-cols-[280px_minmax(0,_1fr)] lg:gap-8">
            <TableOfContents items={tocItems} />
            <div className="space-y-8">
              <BlogPostContent html={postHtml} />

              {hasFaq ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
                  <div className="mt-5 space-y-4">
                    {post.schema.faq.map((item) => (
                      <article key={item.question} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-lg font-semibold text-slate-900">{item.question}</h3>
                        <p className="mt-2 leading-7 text-slate-700">{item.answer}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm">
                <h2 className="text-2xl font-extrabold text-slate-900">Try SuiteGenie Free</h2>
                <p className="mt-2 max-w-2xl text-slate-600">
                  Generate and schedule social content faster with AI workflows built for agencies and creators.
                </p>
                <div className="mt-5">
                  <Link
                    to="/register"
                    className="inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Try SuiteGenie Free
                  </Link>
                </div>
              </section>

              <AuthorBio author={post.author} />
            </div>
          </section>

          <section className="mt-12">
            <RelatedPosts posts={relatedPosts} />
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default BlogPostPage;
