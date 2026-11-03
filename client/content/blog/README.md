# Blog Content Workflow

This directory is the source of truth for blog posts.

## Structure

- `categories.json`: category metadata and display order.
- `posts/<category>/<slug>.json`: one file per post.

## Add a new blog post

1. Create a JSON file under `posts/<category>/<slug>.json`.
2. Keep `category` and `slug` aligned with the file path.
3. Run:
   - `npm run blog:sync`
4. Start dev/build as usual.

## Required post fields

- `id`
- `title`
- `slug`
- `category`
- `excerpt`
- `content`
- `author`
- `featuredImage`
- `publishDate`
- `status` (`published` or `draft`)

## Notes

- List/category/search pages use generated lightweight metadata.
- Full post content is loaded only on `/blogs/:category/:slug`.
- Generated files:
  - `src/data/blogIndex.generated.js`
  - `public/blog/index.json`
  - `public/blog/search-index.json`
  - `public/blog/posts/**`
  - `public/sitemap-blog.xml`
