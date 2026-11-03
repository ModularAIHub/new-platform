import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const outputPath = resolve(process.cwd(), 'public', 'sitemap-blog.xml');
const postsRoot = resolve(process.cwd(), 'content', 'blog', 'posts');

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

const generateBlogSitemapXml = (posts = [], baseUrl = 'https://suitegenie.in') => {
  const publishedPosts = posts.filter((post) => post.status === 'published');
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const post of publishedPosts) {
    const canonical = post.seo?.canonicalUrl || `${baseUrl}/blogs/${post.category}/${post.slug}`;
    const lastmod = new Date(post.lastModified || post.publishDate).toISOString().slice(0, 10);

    lines.push('  <url>');
    lines.push(`    <loc>${canonical}</loc>`);
    lines.push(`    <lastmod>${lastmod}</lastmod>`);
    lines.push('    <changefreq>weekly</changefreq>');
    lines.push('    <priority>0.9</priority>');
    lines.push('  </url>');
  }

  lines.push('</urlset>');
  return lines.join('\n');
};

const posts = collectJsonFiles(postsRoot).map((filePath) => JSON.parse(readFileSync(filePath, 'utf8')));
const sitemapXml = generateBlogSitemapXml(posts);

writeFileSync(outputPath, `${sitemapXml}\n`, 'utf8');
console.log(`Generated ${outputPath}`);
