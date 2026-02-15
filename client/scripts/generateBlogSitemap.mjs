import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BLOG_POSTS } from '../src/data/blogPosts.js';
import { generateBlogSitemapXml } from '../src/utils/blogHelpers.js';

const outputPath = resolve(process.cwd(), 'public/sitemap-blog.xml');
const sitemapXml = generateBlogSitemapXml(BLOG_POSTS);

writeFileSync(outputPath, `${sitemapXml}\n`, 'utf8');
console.log(`Generated ${outputPath}`);
