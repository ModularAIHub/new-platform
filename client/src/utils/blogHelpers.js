import { BLOG_CATEGORY_META } from '../data/blogIndex.generated.js';

export const BLOG_POSTS_PER_PAGE = 10;

const SUITEGENIE_DOMAIN = 'suitegenie.in';

const headingPattern = /^(#{1,6})\s+(.+)$/;
const unorderedListPattern = /^[-*]\s+(.+)$/;
const orderedListPattern = /^\d+\.\s+(.+)$/;

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const decodeMarkdownEscapes = (value = '') => String(value).replace(/\\([\\`*_[\]()#+\-.!])/g, '$1');

export const generateSlug = (value = '') =>
  decodeMarkdownEscapes(String(value))
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const stripMarkdown = (value = '') =>
  String(value)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!\[.*?\]\(.*?\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_>#-]/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const calculateReadTime = (content = '') => {
  const words = stripMarkdown(content)
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

export const formatDate = (isoDate) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(isoDate));

export const truncateText = (value = '', limit = 100) => {
  const normalized = String(value).trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 1)).trim()}...`;
};

export const getCategoryMeta = (category = 'all') => BLOG_CATEGORY_META[category] || BLOG_CATEGORY_META.all;

export const getPostUrl = (post) => `/blogs/${post.category}/${post.slug}`;

export const isExternalUrl = (url = '') => {
  if (!url) return false;
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return !host.includes(SUITEGENIE_DOMAIN);
  } catch {
    return true;
  }
};

const applyInlineMarkdown = (value = '') => {
  let html = escapeHtml(value);

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const safeAlt = escapeHtml(alt);
    const safeSrc = escapeHtml(src);
    return `<img src="${safeSrc}" alt="${safeAlt}" loading="lazy" class="blog-inline-image" />`;
  });

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const safeText = escapeHtml(text);
    const safeUrl = escapeHtml(url);
    const external = isExternalUrl(url);
    const attrs = external
      ? 'target="_blank" rel="noopener noreferrer" class="blog-link blog-link-external"'
      : 'class="blog-link blog-link-internal"';
    return `<a href="${safeUrl}" ${attrs}>${safeText}</a>`;
  });

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="blog-inline-code">$1</code>');
  return html;
};

const highlightCode = (code = '', language = '') => {
  const safeCode = escapeHtml(code);
  const languageClass = `language-${String(language || 'text').toLowerCase()}`;

  const jsLikeLanguages = ['js', 'jsx', 'ts', 'tsx', 'javascript', 'typescript'];
  if (!jsLikeLanguages.includes(String(language).toLowerCase())) {
    return `<code class="blog-code ${languageClass}">${safeCode}</code>`;
  }

  let highlighted = safeCode;
  highlighted = highlighted.replace(
    /\b(const|let|var|function|return|if|else|for|while|async|await|import|export|from|class|new|try|catch|throw)\b/g,
    '<span class="blog-token-keyword">$1</span>'
  );
  highlighted = highlighted.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)/g, '<span class="blog-token-string">$1</span>');
  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="blog-token-number">$1</span>');
  highlighted = highlighted.replace(/(\/\/.*?$)/gm, '<span class="blog-token-comment">$1</span>');

  return `<code class="blog-code ${languageClass}">${highlighted}</code>`;
};

const closeOpenList = (state, output) => {
  if (state.inUnorderedList) {
    output.push('</ul>');
    state.inUnorderedList = false;
  }
  if (state.inOrderedList) {
    output.push('</ol>');
    state.inOrderedList = false;
  }
};

const closeOpenCodeBlock = (state, output) => {
  if (!state.inCodeBlock) return;
  const codeContent = state.codeBuffer.join('\n');
  output.push(
    `<pre class="blog-code-block">${highlightCode(codeContent, state.codeLanguage)}</pre>`
  );
  state.inCodeBlock = false;
  state.codeLanguage = 'text';
  state.codeBuffer = [];
};

const parseTable = (lines, startIndex) => {
  const headerLine = lines[startIndex];
  const separatorLine = lines[startIndex + 1];
  const separatorPattern = /^\s*\|?[\s:-]+\|[\s|:-]*$/;

  if (!headerLine || !separatorLine || !headerLine.includes('|') || !separatorPattern.test(separatorLine)) {
    return null;
  }

  const parseCells = (line) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => applyInlineMarkdown(cell.trim()));

  const headers = parseCells(headerLine);
  const rows = [];
  let cursor = startIndex + 2;

  while (cursor < lines.length) {
    const rowLine = lines[cursor];
    if (!rowLine || !rowLine.includes('|') || rowLine.trim().startsWith('```')) break;
    rows.push(parseCells(rowLine));
    cursor += 1;
  }

  return {
    nextIndex: cursor - 1,
    html: `
      <div class="blog-table-wrap">
        <table class="blog-table">
          <thead>
            <tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows
              .map((cells) => `<tr>${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
              .join('')}
          </tbody>
        </table>
      </div>
    `,
  };
};

export const markdownToHTML = (markdown = '') => {
  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
  const output = [];
  const state = {
    inUnorderedList: false,
    inOrderedList: false,
    inCodeBlock: false,
    codeLanguage: 'text',
    codeBuffer: [],
  };

  const closeParagraph = () => {
    if (output.length > 0 && output[output.length - 1] === '<p>') {
      output.pop();
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine || '';
    const trimmed = line.trim();

    if (state.inCodeBlock) {
      if (trimmed.startsWith('```')) {
        closeOpenCodeBlock(state, output);
      } else {
        state.codeBuffer.push(rawLine);
      }
      continue;
    }

    if (trimmed.startsWith('```')) {
      closeOpenList(state, output);
      state.inCodeBlock = true;
      state.codeLanguage = trimmed.replace(/```/, '').trim() || 'text';
      continue;
    }

    if (!trimmed) {
      closeOpenList(state, output);
      continue;
    }

    const table = parseTable(lines, index);
    if (table) {
      closeOpenList(state, output);
      output.push(table.html);
      index = table.nextIndex;
      continue;
    }

    const headingMatch = trimmed.match(headingPattern);
    if (headingMatch) {
      closeOpenList(state, output);
      const level = headingMatch[1].length;
      const headingText = decodeMarkdownEscapes(headingMatch[2].trim());
      const headingId = generateSlug(headingText);
      output.push(`<h${level} id="${headingId}" class="blog-h${level}">${applyInlineMarkdown(headingText)}</h${level}>`);
      continue;
    }

    if (/^>\s+/.test(trimmed)) {
      closeOpenList(state, output);
      const quoteText = trimmed.replace(/^>\s+/, '');
      output.push(`<blockquote class="blog-blockquote">${applyInlineMarkdown(quoteText)}</blockquote>`);
      continue;
    }

    const unorderedMatch = trimmed.match(unorderedListPattern);
    if (unorderedMatch) {
      if (!state.inUnorderedList) {
        closeOpenList(state, output);
        state.inUnorderedList = true;
        output.push('<ul class="blog-list">');
      }
      output.push(`<li>${applyInlineMarkdown(unorderedMatch[1])}</li>`);
      continue;
    }

    const orderedMatch = trimmed.match(orderedListPattern);
    if (orderedMatch) {
      if (!state.inOrderedList) {
        closeOpenList(state, output);
        state.inOrderedList = true;
        output.push('<ol class="blog-ordered-list">');
      }
      output.push(`<li>${applyInlineMarkdown(orderedMatch[1])}</li>`);
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      closeOpenList(state, output);
      output.push('<hr class="blog-divider" />');
      continue;
    }

    closeOpenList(state, output);
    closeParagraph();
    output.push(`<p class="blog-paragraph">${applyInlineMarkdown(trimmed)}</p>`);
  }

  closeOpenCodeBlock(state, output);
  closeOpenList(state, output);
  return output.join('\n');
};

export const generateTableOfContents = (content = '') => {
  const toc = [];
  String(content)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      const heading = trimmed.match(/^(##|###)\s+(.+)$/);
      if (!heading) return;
      const title = decodeMarkdownEscapes(heading[2].trim());
      toc.push({
        id: generateSlug(title),
        title,
        level: heading[1] === '##' ? 2 : 3,
      });
    });

  return toc;
};

export const searchPosts = (query = '', posts = [], searchIndex = []) => {
  const normalizedQuery = String(query).trim().toLowerCase();
  if (!normalizedQuery) return posts;

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const searchIndexMap =
    Array.isArray(searchIndex) && searchIndex.length
      ? new Map(
          searchIndex
            .filter((entry) => entry?.category && entry?.slug)
            .map((entry) => [`${entry.category}/${entry.slug}`, String(entry.content || '').toLowerCase()])
        )
      : null;

  return posts
    .map((post) => {
      const routeKey = `${post.category}/${post.slug}`;
      const indexedContent = searchIndexMap?.get(routeKey);
      const haystack = {
        title: String(post.title || '').toLowerCase(),
        excerpt: String(post.excerpt || '').toLowerCase(),
        tags: (post.tags || []).join(' ').toLowerCase(),
        content: indexedContent ?? stripMarkdown(post.content || '').toLowerCase(),
      };

      const score = terms.reduce((total, term) => {
        let points = 0;
        if (haystack.title.includes(term)) points += 6;
        if (haystack.excerpt.includes(term)) points += 4;
        if (haystack.tags.includes(term)) points += 3;
        if (haystack.content.includes(term)) points += 1;
        return total + points;
      }, 0);

      return {
        post,
        score,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.post.publishDate).getTime() - new Date(a.post.publishDate).getTime();
    })
    .map((entry) => entry.post);
};

export const paginatePosts = (posts = [], page = 1, perPage = BLOG_POSTS_PER_PAGE) => {
  const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const total = posts.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const clampedPage = Math.min(safePage, totalPages);
  const startIndex = (clampedPage - 1) * perPage;
  const endIndex = startIndex + perPage;

  return {
    page: clampedPage,
    total,
    totalPages,
    posts: posts.slice(startIndex, endIndex),
  };
};

export const generateBlogSitemapXml = (posts = [], baseUrl = 'https://suitegenie.in') => {
  const publishedPosts = posts.filter((post) => post.status === 'published');
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  publishedPosts.forEach((post) => {
    const canonical = post.seo?.canonicalUrl || `${baseUrl}/blogs/${post.category}/${post.slug}`;
    const lastmod = new Date(post.lastModified || post.publishDate).toISOString().slice(0, 10);

    lines.push('  <url>');
    lines.push(`    <loc>${canonical}</loc>`);
    lines.push(`    <lastmod>${lastmod}</lastmod>`);
    lines.push('    <changefreq>weekly</changefreq>');
    lines.push('    <priority>0.9</priority>');
    lines.push('  </url>');
  });

  lines.push('</urlset>');
  return lines.join('\n');
};
