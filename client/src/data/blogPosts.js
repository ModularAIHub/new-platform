// DEPRECATED: Legacy compatibility shim.
// Source of truth now lives in client/content/blog/posts.
// Run `npm run blog:sync` after adding/updating posts.

export {
  BLOG_CATEGORY_META,
  BLOG_CATEGORY_ORDER,
  BLOG_POSTS_INDEX as BLOG_POSTS,
  getPublishedBlogPosts,
} from './blogIndex.generated.js';
