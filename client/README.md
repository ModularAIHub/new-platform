# SuiteGenie Frontend (`new-platform/client`)

React + Vite frontend for SuiteGenie marketing pages and app experience.

## Quick Start
```bash
npm install
npm run dev
```

Default dev URL: `http://localhost:5173`

## Build Commands
- `npm run dev` - start local dev server
- `npm run blog:sync` - regenerate blog index, search index, and sitemap
- `npm run build` - production build (runs blog sync first)
- `npm run preview` - preview production build

## Environment
Create `.env` in `client/`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=SuiteGenie
```

## Public Content Surfaces
- Home page: `src/pages/HomePage.jsx`
- Features page: `src/pages/Features.jsx`
- Docs page: `src/pages/Docs.jsx`
- Help page: `src/pages/Help.jsx`
- Blog pages:
  - `src/pages/Blog.jsx`
  - `src/pages/BlogCategory.jsx`
  - `src/pages/BlogSearch.jsx`
  - `src/pages/BlogPost.jsx`

## Homepage Content Blocks
- Hero: `src/components/homepage/HeroSection.jsx`
- Module cards: `src/components/homepage/FeaturesSection.jsx`
- Capability tabs: `src/components/homepage/TabbedFeaturesSection.jsx`
- Workflow section: `src/components/homepage/WorkflowSection.jsx`

## Blog Authoring
Blog source of truth is under:
- `content/blog/posts/**` (JSON posts by category)
- `content/blog/categories.json`

After adding or editing posts:
1. Run `npm run blog:sync`
2. Commit both source JSON and generated outputs:
   - `src/data/blogIndex.generated.js`
   - `public/blog/**`
   - `public/sitemap-blog.xml`

## Related Project Docs
- Content map reference: `../CONTENT_SURFACES_REFERENCE.md`
- DB/setup docs: `../DATABASE_SETUP.md`
