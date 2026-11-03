import { Helmet } from 'react-helmet';

const SITE_NAME = 'SuiteGenie';
const SITE_URL = 'https://suitegenie.in';
const DEFAULT_IMAGE = `${SITE_URL}/og-default.svg`;
const TWITTER_HANDLE = '@Suitegenie1';

const toAbsoluteUrl = (value = '/') => {
  if (!value) return SITE_URL;
  if (/^https?:\/\//i.test(value)) return value;
  const normalized = value.startsWith('/') ? value : `/${value}`;
  return `${SITE_URL}${normalized}`;
};

const PublicSeo = ({
  title,
  description,
  canonicalPath = '/',
  keywords,
  image = DEFAULT_IMAGE,
  type = 'website',
  noIndex = false,
  schema,
}) => {
  const canonicalUrl = toAbsoluteUrl(canonicalPath);
  const imageUrl = toAbsoluteUrl(image);
  const robotsContent = noIndex
    ? 'noindex, nofollow, noarchive'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />

      {Array.isArray(schema)
        ? schema.map((item, index) => (
            <script key={`seo-schema-${index}`} type="application/ld+json">
              {JSON.stringify(item)}
            </script>
          ))
        : schema ? (
            <script type="application/ld+json">{JSON.stringify(schema)}</script>
          ) : null}
    </Helmet>
  );
};

export default PublicSeo;
