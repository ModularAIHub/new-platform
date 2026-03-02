const fs = require('fs');
const path = require('path');

const postsDir = 'f:/suitegenie/new-platform/client/content/blog/posts';

const getAllFiles = (dir, filesList = []) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, filesList);
        } else if (fullPath.endsWith('.json')) {
            filesList.push(fullPath);
        }
    }
    return filesList;
};

const files = getAllFiles(postsDir);
const posts = files.map(f => ({ path: f, data: JSON.parse(fs.readFileSync(f, 'utf8')) }));

// 1. Build dictionary for internal linking
const linkDict = [];
const ignoreWords = new Set(['the', 'and', 'for', 'with', 'suitegenie', 'twitter', 'linkedin', 'facebook', 'social media', 'post', 'posts', 'tweet', 'tweets', 'growth', 'marketing', 'agency', 'agencies', 'founder', 'founders', 'automation', 'tool', 'tools', 'software', 'platform', 'app', 'apps', 'how to', 'guide', 'tutorial']);

posts.forEach(p => {
    const d = p.data;
    const url = `/blogs/${d.category}/${d.slug}`;
    const keywords = new Set();

    if (d.title) keywords.add(d.title.toLowerCase().trim());
    if (d.tags) d.tags.forEach(t => keywords.add(t.toLowerCase().trim()));
    if (d.seo && d.seo.keywords) d.seo.keywords.forEach(k => keywords.add(k.toLowerCase().trim()));

    // Specific cross-post terminology that is huge for SuiteGenie
    if (d.slug.includes('linkedin-cross-posting')) {
        keywords.add('linkedin cross-posting');
        keywords.add('cross-posting to linkedin');
    }
    if (d.slug.includes('hootsuite')) {
        keywords.add('hootsuite alternative');
    }
    if (d.slug.includes('buffer')) {
        keywords.add('buffer alternative');
    }

    const validKw = Array.from(keywords).filter(k => k.length > 3 && !ignoreWords.has(k))
        .sort((a, b) => b.length - a.length);

    if (validKw.length > 0) {
        linkDict.push({ url, id: d.id, keywords: validKw });
    }
});

let updatedCount = 0;

posts.forEach(p => {
    let d = p.data;
    let content = d.content || '';
    let modified = false;

    // AEO/GEO: Add Quick Answer blockquote at the top
    if (!content.match(/Quick Answer:/i) && !content.match(/TL;DR:/i)) {
        let qaText = d.excerpt;
        if (d.seo && d.seo.metaDescription && d.seo.metaDescription.length > qaText.length) {
            qaText = d.seo.metaDescription;
        }

        let qaBlock = `> **Quick Answer:** ${qaText}\n\n`;

        if (content.trim().startsWith('#')) {
            const firstNewline = content.indexOf('\n');
            if (firstNewline !== -1) {
                content = content.slice(0, firstNewline + 1) + '\n' + qaBlock + content.slice(firstNewline + 1);
            } else {
                content = content + '\n\n' + qaBlock;
            }
        } else {
            content = qaBlock + content;
        }
        modified = true;
    }

    // AEO/GEO: Add FAQ Schema if empty
    if (!d.schema) d.schema = { type: 'Article', faq: [] };
    if (!d.schema.faq) d.schema.faq = [];

    if (d.schema.faq.length === 0) {
        d.schema.faq.push({
            question: `What is the main topic of ${d.title}?`,
            answer: d.excerpt || d.seo?.metaDescription || "This article details insights surrounding social media automation and growth."
        });

        const mainTag = (d.tags && d.tags.length > 0) ? d.tags[0] : 'cross-platform strategy';
        d.schema.faq.push({
            question: `How does SuiteGenie help with ${mainTag}?`,
            answer: `It provides integrated workflows designed for optimizing and automating ${mainTag}, enabling creators and agencies to save time and scale effectively.`
        });
        modified = true;
    }

    // Internal Linking
    const alreadyLinked = new Set();

    linkDict.forEach(target => {
        if (target.id === d.id) return;
        if (alreadyLinked.has(target.url)) return;

        for (const kw of target.keywords) {
            const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
            const kwRegex = new RegExp(`\\b(${escaped})\\b`, 'i');

            // Exclude markdown links [text](url), raw html <a>, images ![], headers #, and existing bold/italic etc.
            const chunks = content.split(/(```[\s\S]*?```|`[^`]+`|^#+.*|\s#+.*|\[[^\]]*\]\([^)]*\)|<a[^>]*>.*?<\/a>|!\[.*?\]\(.*?\)|>[^\n]*|\*\*.*?\*\*)/g);

            let replaced = false;
            for (let i = 0; i < chunks.length; i++) {
                if (i % 2 === 0 && !replaced && kwRegex.test(chunks[i])) {
                    chunks[i] = chunks[i].replace(kwRegex, `[$1](${target.url})`);
                    replaced = true;
                }
            }

            if (replaced) {
                content = chunks.join('');
                alreadyLinked.add(target.url);
                modified = true;
                break;
            }
        }
    });

    if (modified) {
        d.content = content;
        fs.writeFileSync(p.path, JSON.stringify(d, null, 4) + '\n');
        updatedCount++;
    }
});

console.log(`Successfully processed and optimized ${updatedCount} blog posts with internal links and AEO schemas.`);
