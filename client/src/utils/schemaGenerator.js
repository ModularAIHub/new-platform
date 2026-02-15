const SITE_URL = 'https://suitegenie.in';
const DEFAULT_LOGO = `${SITE_URL}/logo[1].png`;

const toIsoDate = (value) => new Date(value).toISOString();

const toAbsoluteUrl = (url = '') => {
  if (!url) return SITE_URL;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const createAuthorSchema = (author = {}) => {
  const sameAs = [];
  if (author.social?.linkedin) {
    sameAs.push(`https://linkedin.com/in/${author.social.linkedin}`);
  }
  if (author.social?.twitter) {
    sameAs.push(`https://x.com/${author.social.twitter}`);
  }

  return {
    '@type': 'Person',
    name: author.name || 'SuiteGenie Team',
    image: toAbsoluteUrl(author.avatar || '/logo[1].png'),
    description: author.bio || 'SuiteGenie content team',
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
};

export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'SuiteGenie',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: DEFAULT_LOGO,
  },
  sameAs: ['https://x.com/Suitegenie1', 'https://linkedin.com/company/suitegenie'],
});

export const generateBreadcrumbSchema = (post) => {
  const categoryName = post.category
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${SITE_URL}/blogs`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryName,
        item: `${SITE_URL}/blogs/category/${post.category}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: post.title,
        item: post.seo?.canonicalUrl || `${SITE_URL}/blogs/${post.category}/${post.slug}`,
      },
    ],
  };
};

const generateHowToSchema = (post) => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: post.title,
  description: post.seo?.metaDescription || post.excerpt,
  image: toAbsoluteUrl(post.featuredImage?.url),
  datePublished: toIsoDate(post.publishDate),
  dateModified: toIsoDate(post.lastModified || post.publishDate),
  totalTime: `PT${post.readTime || 5}M`,
  estimatedCost: {
    '@type': 'MonetaryAmount',
    currency: 'USD',
    value: '0',
  },
  tool: [
    {
      '@type': 'HowToTool',
      name: 'SuiteGenie',
    },
  ],
  step: (post.schema?.steps || []).map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.name,
    text: step.text,
  })),
  author: createAuthorSchema(post.author),
});

const generateReviewSchema = (post) => ({
  '@context': 'https://schema.org',
  '@type': 'Review',
  name: post.title,
  datePublished: toIsoDate(post.publishDate),
  dateModified: toIsoDate(post.lastModified || post.publishDate),
  reviewBody: post.excerpt,
  author: createAuthorSchema(post.author),
  itemReviewed: {
    '@type': 'SoftwareApplication',
    name: 'SuiteGenie',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
  },
});

const generateBlogPostingSchema = (post) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.seo?.metaDescription || post.excerpt,
  image: [toAbsoluteUrl(post.featuredImage?.url)],
  author: createAuthorSchema(post.author),
  publisher: {
    '@type': 'Organization',
    name: 'SuiteGenie',
    logo: {
      '@type': 'ImageObject',
      url: DEFAULT_LOGO,
    },
  },
  mainEntityOfPage: post.seo?.canonicalUrl || `${SITE_URL}/blogs/${post.category}/${post.slug}`,
  datePublished: toIsoDate(post.publishDate),
  dateModified: toIsoDate(post.lastModified || post.publishDate),
  articleSection: post.category,
  keywords: (post.seo?.keywords || []).join(', '),
});

export const generateFaqSchema = (post) => {
  const faqItems = post.schema?.faq || [];
  if (!faqItems.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};

export const generateSchema = (post) => {
  const schemas = [];
  schemas.push(generateOrganizationSchema());
  schemas.push(generateBreadcrumbSchema(post));

  switch (post.schema?.type) {
    case 'HowTo':
      schemas.push(generateHowToSchema(post));
      break;
    case 'Review':
      schemas.push(generateReviewSchema(post));
      break;
    default:
      schemas.push(generateBlogPostingSchema(post));
      break;
  }

  const faqSchema = generateFaqSchema(post);
  if (faqSchema) schemas.push(faqSchema);

  return schemas;
};
