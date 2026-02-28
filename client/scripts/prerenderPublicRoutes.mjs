import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';

const SITE_URL = 'https://suitegenie.in';

const rootDir = process.cwd();
const distDir = resolve(rootDir, 'dist');
const distIndexPath = resolve(distDir, 'index.html');
const categoriesPath = resolve(rootDir, 'content', 'blog', 'categories.json');
const postsRoot = resolve(rootDir, 'content', 'blog', 'posts');

const PUBLIC_ROUTES = {
  '/': {
    title: 'SuiteGenie (Suite Genie) | AI Social Media Management for Creators & Agencies',
    description:
      'SuiteGenie, also searched as Suite Genie, helps creators, agencies, and teams generate, schedule, and analyze social content across X, LinkedIn, Threads, Instagram, and YouTube.',
    keywords:
      'AI social media management, social media automation, X automation, LinkedIn scheduling, social media analytics, team collaboration',
    image: `${SITE_URL}/og-default.svg`,
    body: `
      <section>
        <h1>SuiteGenie for creators, agencies, and growing teams</h1>
        <p>SuiteGenie, also searched as Suite Genie, combines AI content generation, scheduling, analytics, team workflows, and cross-posting in one platform.</p>
        <p>Use Tweet Genie for X, LinkedIn Genie for professional content, and Social Genie for Threads, Instagram, and YouTube workflows.</p>
        <ul>
          <li><a href="/features">Explore platform features</a></li>
          <li><a href="/pricing">Compare pricing</a></li>
          <li><a href="/blogs">Read the blog</a></li>
          <li><a href="/docs">Open documentation</a></li>
        </ul>
      </section>
    `,
  },
  '/about': {
    title: 'About SuiteGenie (Suite Genie) | AI social media automation platform',
    description:
      'Learn what SuiteGenie, also searched as Suite Genie, is building for creators, agencies, and operator-led teams that need reliable AI social media workflows.',
    keywords: 'about suitegenie, social media automation company, AI content operations',
    image: `${SITE_URL}/og-default.svg`,
    body: `
      <section>
        <h1>About SuiteGenie</h1>
        <p>SuiteGenie, also searched as Suite Genie, is an AI-powered social media automation platform focused on practical publishing workflows, team collaboration, and measurable output.</p>
        <p>The product is designed for creators, founder-led brands, agencies, and lean teams that need faster publishing without losing control over quality.</p>
      </section>
    `,
  },
  '/contact': {
    title: 'Contact SuiteGenie | Support, product help, and partnerships',
    description:
      'Contact the SuiteGenie team for support, partnerships, onboarding, or questions about social media automation.',
    keywords: 'contact suitegenie, suitegenie support, social media automation support',
    image: `${SITE_URL}/og-default.svg`,
    body: `
      <section>
        <h1>Contact SuiteGenie</h1>
        <p>Reach the team for product questions, onboarding help, support, partnerships, and feedback.</p>
        <p>SuiteGenie supports creators, agencies, and teams using AI to generate, schedule, and optimize social content.</p>
      </section>
    `,
  },
  '/features': {
    title: 'Features - AI Social Media Automation | SuiteGenie',
    description:
      'See how SuiteGenie handles AI content generation, bulk workflows, scheduling, BYOK, team collaboration, analytics, and cross-posting.',
    keywords: 'suitegenie features, AI social media automation features, BYOK social media tool',
    image: `${SITE_URL}/og-default.svg`,
    body: `
      <section>
        <h1>SuiteGenie features</h1>
        <p>SuiteGenie includes AI content generation, platform-aware scheduling, analytics, team mode, bulk generation, BYOK, and account-specific cross-posting.</p>
        <ul>
          <li>Tweet Genie for X content, media posting, history, and analytics</li>
          <li>LinkedIn Genie for personal and team publishing workflows</li>
          <li>Social Genie for Threads, Instagram, and YouTube planning</li>
          <li>Cross-posting, scheduling, and team-aware account routing</li>
        </ul>
      </section>
    `,
  },
  '/plans': {
    title: 'SuiteGenie Plans | Choose a social media automation workflow',
    description:
      'Compare SuiteGenie plans for creators, agencies, and teams using AI-powered social media generation and scheduling.',
    keywords: 'suitegenie plans, social media automation plans, creator plan, team plan',
    image: `${SITE_URL}/og-default.svg`,
    body: `
      <section>
        <h1>SuiteGenie plans</h1>
        <p>Compare plans for individuals, creators, agencies, and multi-member teams.</p>
        <p>Choose the workflow that fits your posting volume, AI usage, collaboration needs, and platform mix.</p>
      </section>
    `,
  },
  '/pricing': {
    title: 'SuiteGenie Pricing | AI social media automation for teams and creators',
    description:
      'Review pricing for SuiteGenie and compare the cost of AI social media automation, scheduling, and BYOK workflows.',
    keywords: 'suitegenie pricing, social media automation pricing, BYOK pricing',
    image: `${SITE_URL}/og-default.svg`,
    body: `
      <section>
        <h1>SuiteGenie pricing</h1>
        <p>Understand SuiteGenie pricing for AI content generation, bulk scheduling, analytics, team mode, and bring-your-own-key workflows.</p>
        <p>Use pricing details to choose the right setup for creators, agencies, and internal marketing teams.</p>
      </section>
    `,
  },
  '/docs': {
    title: 'SuiteGenie Docs | Setup guides and product documentation',
    description:
      'Read setup guides, integration instructions, and product documentation for SuiteGenie, Tweet Genie, LinkedIn Genie, and Social Genie.',
    keywords: 'suitegenie docs, suitegenie documentation, social media automation docs',
    image: `${SITE_URL}/og-default.svg`,
    body: `
      <section>
        <h1>SuiteGenie documentation</h1>
        <p>Use the docs to set up accounts, team mode, AI keys, posting workflows, analytics, and cross-product connections.</p>
        <p>The documentation covers Tweet Genie, LinkedIn Genie, Social Genie, billing, BYOK, and operational troubleshooting.</p>
      </section>
    `,
  },
  '/help': {
    title: 'SuiteGenie Help Center | Product support and troubleshooting',
    description:
      'Find help articles and answers for account setup, posting, scheduling, analytics, billing, and team mode in SuiteGenie.',
    keywords: 'suitegenie help, suitegenie support, social media automation troubleshooting',
    image: `${SITE_URL}/og-default.svg`,
    body: `
      <section>
        <h1>SuiteGenie help center</h1>
        <p>Find answers for account connection, cross-posting, scheduling, analytics, team mode, billing, and AI generation.</p>
        <p>Use the help center when you need practical fixes without digging through app internals.</p>
      </section>
    `,
  },
  '/integrations': {
    title: 'SuiteGenie Integrations | X, LinkedIn, Threads, Instagram, YouTube, and AI providers',
    description:
      'Learn how SuiteGenie connects X, LinkedIn, Threads, Instagram, YouTube, and AI providers in one automation workflow.',
    keywords: 'suitegenie integrations, X integration, LinkedIn integration, Threads integration',
    image: `${SITE_URL}/og-default.svg`,
    body: `
      <section>
        <h1>SuiteGenie integrations</h1>
        <p>SuiteGenie connects publishing platforms, analytics workflows, and AI providers so teams can create, schedule, and optimize content from one place.</p>
        <ul>
          <li>X and LinkedIn workflow support</li>
          <li>Threads, Instagram, and YouTube support in Social Genie</li>
          <li>BYOK with OpenAI, Gemini, and Perplexity</li>
        </ul>
      </section>
    `,
  },
  '/privacy': {
    title: 'SuiteGenie Privacy Policy',
    description: 'Read the SuiteGenie privacy policy and understand how account, analytics, and billing data is handled.',
    keywords: 'suitegenie privacy policy',
    image: `${SITE_URL}/og-default.svg`,
    body: `
      <section>
        <h1>SuiteGenie privacy policy</h1>
        <p>This page explains how SuiteGenie handles user data, analytics data, authentication data, payment data, and account connection details.</p>
      </section>
    `,
  },
  '/terms': {
    title: 'SuiteGenie Terms of Service',
    description: 'Read the SuiteGenie terms of service for access, billing, acceptable use, and account responsibilities.',
    keywords: 'suitegenie terms of service',
    image: `${SITE_URL}/og-default.svg`,
    body: `
      <section>
        <h1>SuiteGenie terms of service</h1>
        <p>This page outlines the terms for using SuiteGenie, including billing, platform usage, account ownership, and service expectations.</p>
      </section>
    `,
  },
};

const readJson = (filePath) => JSON.parse(readFileSync(filePath, 'utf8'));

const collectJsonFiles = (dirPath) => {
  const entries = readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = resolve(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectJsonFiles(fullPath));
      continue;
    }

    if (entry.isFile() && extname(entry.name).toLowerCase() === '.json') {
      files.push(fullPath);
    }
  }

  return files;
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const stripMarkdown = (value = '') =>
  String(value)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, ' ')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[#>*_]/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const markdownToStaticHtml = (markdown = '') => {
  const lines = String(markdown).split('\n');
  const html = [];
  let listBuffer = [];
  let paragraphBuffer = [];

  const flushList = () => {
    if (!listBuffer.length) return;
    html.push('<ul>');
    for (const item of listBuffer) {
      html.push(`<li>${escapeHtml(item)}</li>`);
    }
    html.push('</ul>');
    listBuffer = [];
  };

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    html.push(`<p>${escapeHtml(paragraphBuffer.join(' '))}</p>`);
    paragraphBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      flushParagraph();
      continue;
    }

    if (line.startsWith('## ')) {
      flushList();
      flushParagraph();
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith('### ')) {
      flushList();
      flushParagraph();
      html.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith('- ')) {
      flushParagraph();
      listBuffer.push(stripMarkdown(line.slice(2)));
      continue;
    }

    flushList();
    paragraphBuffer.push(stripMarkdown(line));
  }

  flushList();
  flushParagraph();

  return html.join('\n');
};

const buildStaticLayout = ({ title, eyebrow, description, body, links = [] }) => {
  const linksHtml = links.length
    ? `
      <nav class="sg-links" aria-label="Helpful links">
        ${links
          .map(
            (link) =>
              `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`
          )
          .join('')}
      </nav>
    `
    : '';

  return `
    <main class="sg-static-shell">
      <section class="sg-static-hero">
        ${eyebrow ? `<p class="sg-eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
        <h1>${escapeHtml(title)}</h1>
        <p class="sg-lead">${escapeHtml(description)}</p>
        ${linksHtml}
      </section>
      <section class="sg-static-body">
        ${body}
      </section>
    </main>
  `;
};

const injectStaticStyles = `
  <style id="suitegenie-prerender-style">
    .sg-static-shell{max-width:1100px;margin:0 auto;padding:56px 20px 96px;color:#0f172a;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .sg-static-hero{padding:32px 0 24px;border-bottom:1px solid #e2e8f0}
    .sg-eyebrow{font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#2563eb;margin:0 0 12px}
    .sg-static-shell h1{font-size:40px;line-height:1.1;margin:0 0 16px;font-weight:800}
    .sg-static-shell h2{font-size:28px;line-height:1.2;margin:32px 0 12px;font-weight:800}
    .sg-static-shell h3{font-size:20px;line-height:1.3;margin:24px 0 10px;font-weight:700}
    .sg-lead,.sg-static-shell p,.sg-static-shell li{font-size:18px;line-height:1.75;color:#334155}
    .sg-static-body{padding-top:28px}
    .sg-static-shell ul{padding-left:24px;margin:12px 0}
    .sg-links{display:flex;flex-wrap:wrap;gap:16px;margin-top:20px}
    .sg-links a,.sg-post-list a,.sg-breadcrumbs a{color:#2563eb;text-decoration:none;font-weight:600}
    .sg-post-list{display:grid;gap:20px;margin-top:28px}
    .sg-post-card,.sg-category-card{padding:20px;border:1px solid #e2e8f0;border-radius:18px;background:#fff}
    .sg-post-meta,.sg-breadcrumbs{font-size:14px;line-height:1.6;color:#64748b}
    .sg-featured-image{width:100%;max-width:960px;border-radius:20px;margin:24px 0;border:1px solid #e2e8f0}
    .sg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}
    .sg-inline-note{padding:16px 18px;border-radius:16px;background:#eff6ff;border:1px solid #bfdbfe;margin-top:24px}
  </style>
`;

const categoriesPayload = readJson(categoriesPath);
const categoryMeta = categoriesPayload.meta || {};
const categoryOrder = categoriesPayload.order || [];
const posts = collectJsonFiles(postsRoot)
  .map((filePath) => readJson(filePath))
  .filter((post) => post.status === 'published')
  .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

const buildBlogIndexBody = () => {
  const featured = posts.slice(0, 8);
  return `
    <div class="sg-inline-note">
      SuiteGenie publishes practical guides, product updates, comparisons, use cases, and operational resources for AI-powered social media execution.
    </div>
    <div class="sg-grid" style="margin-top:28px">
      ${categoryOrder
        .filter((category) => category !== 'all' && categoryMeta[category])
        .map(
          (category) => `
            <article class="sg-category-card">
              <h2><a href="/blogs/category/${escapeHtml(category)}">${escapeHtml(categoryMeta[category].label)}</a></h2>
              <p>${escapeHtml(categoryMeta[category].description)}</p>
            </article>
          `
        )
        .join('')}
    </div>
    <div class="sg-post-list">
      ${featured
        .map(
          (post) => `
            <article class="sg-post-card">
              <p class="sg-post-meta">${escapeHtml(categoryMeta[post.category]?.label || post.category)} · ${escapeHtml(
                new Date(post.publishDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              )}</p>
              <h2><a href="/blogs/${escapeHtml(post.category)}/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a></h2>
              <p>${escapeHtml(post.excerpt)}</p>
            </article>
          `
        )
        .join('')}
    </div>
  `;
};

const buildCategoryBody = (category) => {
  const postsInCategory = posts.filter((post) => post.category === category);
  return `
    <p>${escapeHtml(categoryMeta[category].description)}</p>
    <div class="sg-post-list">
      ${postsInCategory
        .map(
          (post) => `
            <article class="sg-post-card">
              <p class="sg-post-meta">${escapeHtml(
                new Date(post.publishDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              )}</p>
              <h2><a href="/blogs/${escapeHtml(post.category)}/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a></h2>
              <p>${escapeHtml(post.excerpt)}</p>
            </article>
          `
        )
        .join('')}
    </div>
  `;
};

const buildPostBody = (post) => {
  const faqHtml = Array.isArray(post.schema?.faq) && post.schema.faq.length
    ? `
      <section>
        <h2>Frequently Asked Questions</h2>
        ${post.schema.faq
          .map(
            (faq) => `
              <article class="sg-post-card">
                <h3>${escapeHtml(faq.question)}</h3>
                <p>${escapeHtml(faq.answer)}</p>
              </article>
            `
          )
          .join('')}
      </section>
    `
    : '';

  return `
    <nav class="sg-breadcrumbs" aria-label="Breadcrumbs">
      <a href="/">Home</a> / <a href="/blogs">Blog</a> / <a href="/blogs/category/${escapeHtml(post.category)}">${escapeHtml(
        categoryMeta[post.category]?.label || post.category
      )}</a>
    </nav>
    <p class="sg-post-meta">${escapeHtml(post.author?.name || 'SuiteGenie Team')} - ${escapeHtml(
      new Date(post.publishDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    )} - ${escapeHtml(String(post.readTime || '5'))} min read</p>
    ${
      post.featuredImage?.url
        ? `<img class="sg-featured-image" src="${escapeHtml(post.featuredImage.url)}" alt="${escapeHtml(
            post.featuredImage.alt || post.title
          )}" />`
        : ''
    }
    ${markdownToStaticHtml(post.content)}
    ${faqHtml}
  `;
};

const routeDefinitions = [
  ...Object.entries(PUBLIC_ROUTES).map(([path, data]) => ({
    path,
    title: data.title,
    description: data.description,
    keywords: data.keywords,
    image: data.image,
    canonical: `${SITE_URL}${path === '/' ? '/' : path}`,
    body: buildStaticLayout({
      title: data.title.replace(/\s+\|\s+SuiteGenie$/, '').replace(/\s+-\s+SuiteGenie$/, ''),
      eyebrow: path === '/' ? 'SuiteGenie' : 'SuiteGenie Page',
      description: data.description,
      body: data.body,
      links:
        path === '/'
          ? [
              { href: '/features', label: 'Explore features' },
              { href: '/pricing', label: 'View pricing' },
              { href: '/blogs', label: 'Read the blog' },
            ]
          : [{ href: '/', label: 'Back to SuiteGenie home' }],
    }),
  })),
  {
    path: '/blogs',
    title: 'SuiteGenie Blog | Social media automation guides, comparisons, and updates',
    description:
      'Read practical guides, comparisons, product updates, and operational resources for AI social media automation.',
    keywords: 'suitegenie blog, social media automation blog, X automation guides, LinkedIn automation guides',
    image: `${SITE_URL}/images/blog/suitegenie-launch-hero.svg`,
    canonical: `${SITE_URL}/blogs`,
    body: buildStaticLayout({
      title: 'SuiteGenie Blog',
      eyebrow: 'Blog',
      description:
        'Actionable guides, comparisons, resources, and updates for teams using AI to generate and schedule social content.',
      body: buildBlogIndexBody(),
      links: [
        { href: '/', label: 'Home' },
        { href: '/features', label: 'Features' },
        { href: '/pricing', label: 'Pricing' },
      ],
    }),
  },
  ...categoryOrder
    .filter((category) => category !== 'all' && categoryMeta[category])
    .map((category) => ({
      path: `/blogs/category/${category}`,
      title: `${categoryMeta[category].label} Articles | SuiteGenie Blog`,
      description: categoryMeta[category].description,
      keywords: `suitegenie ${category} articles, ${categoryMeta[category].label.toLowerCase()} social media content`,
      image: `${SITE_URL}/og-default.svg`,
      canonical: `${SITE_URL}/blogs/category/${category}`,
      body: buildStaticLayout({
        title: `${categoryMeta[category].label} Articles`,
        eyebrow: 'Blog Category',
        description: categoryMeta[category].description,
        body: buildCategoryBody(category),
        links: [{ href: '/blogs', label: 'Back to blog index' }],
      }),
    })),
  ...posts.map((post) => ({
    path: `/blogs/${post.category}/${post.slug}`,
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt,
    keywords: (post.seo?.keywords || post.tags || []).join(', '),
    image: `${SITE_URL}${post.featuredImage?.url || '/og-default.svg'}`,
    canonical: post.seo?.canonicalUrl || `${SITE_URL}/blogs/${post.category}/${post.slug}`,
    body: buildStaticLayout({
      title: post.title,
      eyebrow: categoryMeta[post.category]?.label || 'Blog Post',
      description: post.excerpt,
      body: buildPostBody(post),
      links: [
        { href: '/blogs', label: 'Blog index' },
        { href: `/blogs/category/${post.category}`, label: `${categoryMeta[post.category]?.label || post.category} articles` },
      ],
    }),
  })),
];

const updateTag = (html, pattern, replacement) => (pattern.test(html) ? html.replace(pattern, replacement) : html);

const removeJsonLdScripts = (html) =>
  html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');

const injectRouteHtml = (template, route) => {
  let html = template;
  html = updateTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(route.title)}</title>`);
  html = updateTag(
    html,
    /<meta name="title" content="[^"]*"\s*\/?>/i,
    `<meta name="title" content="${escapeHtml(route.title)}" />`
  );
  html = updateTag(
    html,
    /<meta name="description" content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(route.description)}" />`
  );
  html = updateTag(
    html,
    /<meta name="keywords" content="[^"]*"\s*\/?>/i,
    `<meta name="keywords" content="${escapeHtml(route.keywords)}" />`
  );
  html = updateTag(html, /<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(route.canonical)}" />`);
  html = updateTag(html, /<meta property="og:url" content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${escapeHtml(route.canonical)}" />`);
  html = updateTag(html, /<meta property="og:title" content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(route.title)}" />`);
  html = updateTag(
    html,
    /<meta property="og:description" content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`
  );
  html = updateTag(html, /<meta property="og:image" content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${escapeHtml(route.image)}" />`);
  html = updateTag(html, /<meta property="twitter:url" content="[^"]*"\s*\/?>/i, `<meta property="twitter:url" content="${escapeHtml(route.canonical)}" />`);
  html = updateTag(html, /<meta property="twitter:title" content="[^"]*"\s*\/?>/i, `<meta property="twitter:title" content="${escapeHtml(route.title)}" />`);
  html = updateTag(
    html,
    /<meta property="twitter:description" content="[^"]*"\s*\/?>/i,
    `<meta property="twitter:description" content="${escapeHtml(route.description)}" />`
  );
  html = updateTag(html, /<meta property="twitter:image" content="[^"]*"\s*\/?>/i, `<meta property="twitter:image" content="${escapeHtml(route.image)}" />`);
  html = removeJsonLdScripts(html);
  html = html.replace('</head>', `${injectStaticStyles}\n</head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${route.body}</div>`);
  return html;
};

const writeRouteHtml = (template, route) => {
  const routeHtml = injectRouteHtml(template, route);
  const trimmedPath = route.path === '/' ? '' : route.path.replace(/^\/+/, '');
  const outputPath = route.path === '/' ? distIndexPath : resolve(distDir, trimmedPath, 'index.html');
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, routeHtml, 'utf8');
};

const template = readFileSync(distIndexPath, 'utf8');

for (const route of routeDefinitions) {
  writeRouteHtml(template, route);
}

console.log(`Prerendered ${routeDefinitions.length} public routes into ${distDir}`);
