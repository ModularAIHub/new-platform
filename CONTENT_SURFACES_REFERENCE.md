# SuiteGenie Content Surfaces Reference

Last updated: 2026-03-08

## Purpose
This document maps where to update public content for SuiteGenie marketing, docs, and blogs.

## Core Public Pages
- Homepage shell: `client/src/pages/HomePage.jsx`
- Homepage hero: `client/src/components/homepage/HeroSection.jsx`
- Homepage workflow section: `client/src/components/homepage/WorkflowSection.jsx`
- Homepage module cards: `client/src/components/homepage/FeaturesSection.jsx`
- Homepage capability tabs: `client/src/components/homepage/TabbedFeaturesSection.jsx`
- Features page: `client/src/pages/Features.jsx`
- Docs page: `client/src/pages/Docs.jsx`
- Help page: `client/src/pages/Help.jsx`

## Blog Source of Truth
- Blog posts live in JSON under:
  - `client/content/blog/posts/updates`
  - `client/content/blog/posts/guides`
  - `client/content/blog/posts/insights`
  - other category folders under `client/content/blog/posts`
- Category config:
  - `client/content/blog/categories.json`

## Blog Build Outputs (Generated)
- Generated index module:
  - `client/src/data/blogIndex.generated.js`
- Public payloads:
  - `client/public/blog/posts/**`
- Public search index:
  - `client/public/blog/search-index.json`
- Blog sitemap:
  - `client/public/sitemap-blog.xml`

## Required Command After Blog Edits
Run from `client/`:

```bash
npm run blog:sync
```

This regenerates blog index/search/sitemap and public post payloads.

## Publishing Quality Checklist
1. Keep homepage and features copy outcome-first (what users win, not only features list).
2. Keep docs operational and sequence-based (setup -> strategy -> generation -> publish -> learn).
3. For blog updates, link related internal posts to strengthen navigation and SEO.
4. Ensure new blog slugs are unique.
5. Run `npm run blog:sync` and `npm run build` before shipping.

## Current Narrative (March 2026)
- Strategy Builder simplified into a guided flow.
- Prompt Pack tuned for quality-first generation.
- Content Plan added for publish-ready queue.
- Context Vault added to learn from reviews and analytics.
- Main promise: generate -> execute -> learn loop for better weekly content quality.
