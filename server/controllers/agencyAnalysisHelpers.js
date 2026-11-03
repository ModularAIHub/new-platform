const ANALYSIS_THEME_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'being', 'but', 'by', 'for', 'from', 'had',
  'has', 'have', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'more', 'not', 'of',
  'on', 'or', 'our', 'out', 'so', 'that', 'the', 'their', 'there', 'this', 'to', 'up', 'was',
  'we', 'what', 'when', 'why', 'with', 'you', 'your', 'will', 'about', 'after', 'before',
  'during', 'over', 'under', 'than', 'then', 'them', 'they', 'those', 'these', 'also',
  'post', 'posts', 'draft', 'drafts', 'thread', 'threads', 'linkedin', 'twitter', 'suitegenie',
  'agency', 'workspace', 'client', 'content', 'calendar', 'queue', 'approval', 'approved',
  'pending', 'scheduled', 'published', 'failed', 'social', 'instagram', 'youtube',
]);

const ANALYSIS_THEME_ALLOWLIST = new Set(['ai', 'ux', 'ui', 'api', 'b2b', 'b2c', 'seo', 'saas']);

function normalizeAnalysisToken(token) {
  return String(token || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#@-]/g, '')
    .trim();
}

function extractHashtags(text = '', limit = 10) {
  const matches = String(text || '').match(/#[a-z0-9_]+/gi) || [];
  return [...new Set(matches.map((item) => item.toLowerCase()))].slice(0, limit);
}

function buildAnalysisExcludedTerms({ workspace, settings, normalizeWorkspacePostingPreferences }) {
  const postingPreferences = normalizeWorkspacePostingPreferences(settings?.posting_preferences);
  return new Set(
    [
      workspace?.name,
      workspace?.brand_name,
      postingPreferences.industry,
      postingPreferences.target_audience,
      ...(Array.isArray(settings?.competitor_targets) ? settings.competitor_targets : []),
      ...(Array.isArray(postingPreferences.brand_colors) ? postingPreferences.brand_colors : []),
      ...(Array.isArray(postingPreferences.tone_presets)
        ? postingPreferences.tone_presets.map((preset) => preset?.name)
        : []),
    ]
      .flatMap((value) => String(value || '').split(/[\s,/]+/))
      .map((value) => normalizeAnalysisToken(value))
      .filter(Boolean)
  );
}

export function extractTopThemesFromContents(contents = [], options = {}) {
  const {
    workspace,
    settings,
    limit = 8,
    normalizeWorkspacePostingPreferences,
  } = options;
  const scores = new Map();
  const excludedTerms = buildAnalysisExcludedTerms({
    workspace,
    settings,
    normalizeWorkspacePostingPreferences,
  });

  const addScore = (rawToken, score = 1) => {
    const token = normalizeAnalysisToken(rawToken);
    if (!token) return;
    if (excludedTerms.has(token)) return;
    if (ANALYSIS_THEME_STOP_WORDS.has(token)) return;
    if (!ANALYSIS_THEME_ALLOWLIST.has(token) && token.length < 4) return;
    scores.set(token, (scores.get(token) || 0) + score);
  };

  for (const content of Array.isArray(contents) ? contents : []) {
    const normalizedContent = String(content || '').trim();
    if (!normalizedContent) continue;

    extractHashtags(normalizedContent, limit).forEach((tag) => addScore(tag.replace(/^#/, ''), 3));
    normalizedContent
      .replace(/https?:\/\/\S+/gi, ' ')
      .split(/[^a-zA-Z0-9+#@-]+/)
      .forEach((token) => addScore(token, 1));
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token]) => token.replace(/^#/, ''));
}

export function buildAnalysisContentCorpus(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => [item?.title, item?.content].filter(Boolean).join('. '))
    .map((value) => String(value || '').trim())
    .filter((value) => value.length >= 16);
}

export function buildAnalysisHealthStatus({ connectedAccounts = 0, queueItems = 0, errors = [] }) {
  if (connectedAccounts <= 0) return 'missing';
  if (Array.isArray(errors) && errors.length > 0) return 'warning';
  if (queueItems >= 8) return 'busy';
  return 'ready';
}

export function buildPlatformAnalysisCard(args = {}) {
  const {
    platformKey,
    label,
    connectedAccounts = 0,
    postedCount = 0,
    engagementCount = 0,
    queueItems = 0,
    scheduledItems = 0,
    pendingApprovals = 0,
    sourceErrors = [],
    contentItems = [],
    workspace,
    settings,
    normalizeWorkspacePostingPreferences,
  } = args;
  const themes = extractTopThemesFromContents(buildAnalysisContentCorpus(contentItems), {
    workspace,
    settings,
    limit: 6,
    normalizeWorkspacePostingPreferences,
  });

  const strengths = [];
  const gaps = [];
  const nextMoves = [];

  if (connectedAccounts > 0) {
    strengths.push(`${connectedAccounts} connected ${label.toLowerCase()} account${connectedAccounts === 1 ? '' : 's'} ready inside this workspace.`);
  } else {
    gaps.push(`No ${label.toLowerCase()} account is connected yet.`);
  }

  if (postedCount > 0) {
    strengths.push(`${postedCount} recent post${postedCount === 1 ? '' : 's'} provide real performance signal.`);
  } else if (connectedAccounts > 0) {
    gaps.push(`No recent posted volume detected for ${label.toLowerCase()}, so strategy confidence is still light.`);
  }

  if (engagementCount > 0) {
    strengths.push(`${engagementCount} engagement events give us useful feedback for follow-up ideas.`);
  }

  if (themes.length > 0) {
    strengths.push(`Recurring themes: ${themes.slice(0, 3).join(', ')}.`);
  } else if (connectedAccounts > 0) {
    gaps.push(`We do not have enough recent ${label.toLowerCase()} copy to detect stable themes yet.`);
  }

  if (pendingApprovals > 0) {
    nextMoves.push(`${pendingApprovals} item${pendingApprovals === 1 ? '' : 's'} need review before this channel can move faster.`);
  }
  if (queueItems > 0) {
    nextMoves.push(`${queueItems} queue item${queueItems === 1 ? '' : 's'} can be mined for topic patterns and sharper hooks.`);
  }
  if (scheduledItems > 0) {
    nextMoves.push(`${scheduledItems} scheduled post${scheduledItems === 1 ? '' : 's'} already give this channel forward momentum.`);
  }
  if (Array.isArray(sourceErrors) && sourceErrors.length > 0) {
    gaps.push(sourceErrors[0]);
  }
  if (nextMoves.length === 0 && connectedAccounts > 0) {
    nextMoves.push(`Use this channel's strongest theme to generate a tighter batch of client-specific ideas.`);
  }

  return {
    key: platformKey,
    label,
    status: buildAnalysisHealthStatus({ connectedAccounts, queueItems, errors: sourceErrors }),
    connectedAccounts,
    postedCount,
    engagementCount,
    queueItems,
    scheduledItems,
    pendingApprovals,
    themes,
    strengths: strengths.slice(0, 3),
    gaps: gaps.slice(0, 3),
    nextMoves: nextMoves.slice(0, 3),
  };
}

export function dedupeIdeasByTitle(items = [], limit = 8, { cleanText }) {
  const deduped = [];
  const seen = new Set();

  for (const item of Array.isArray(items) ? items : []) {
    const title = cleanText(item?.title, null);
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push({
      ...item,
      id: cleanText(item?.id, null) || `idea-${seen.size}`,
      title,
    });
    if (deduped.length >= limit) break;
  }

  return deduped;
}

export function buildWorkspaceIdeaBank(args = {}) {
  const {
    workspace,
    settings,
    topThemes = [],
    competitorTargets = [],
    platformCards = [],
    operationsSnapshot,
    cleanText,
    normalizeWorkspacePostingPreferences,
  } = args;
  const postingPreferences = normalizeWorkspacePostingPreferences(settings?.posting_preferences);
  const audience = cleanText(postingPreferences.target_audience, 'the client audience');
  const brandLabel = cleanText(workspace?.brand_name, null) || cleanText(workspace?.name, 'this client');
  const profileNotes = cleanText(settings?.profile_notes, null);
  const recommendedPlatforms = platformCards
    .filter((card) => Number(card.connectedAccounts || 0) > 0)
    .map((card) => card.key);

  const ideas = [];
  const primaryTheme = topThemes[0] || cleanText(postingPreferences.industry, 'industry insight');
  const secondaryTheme = topThemes[1] || topThemes[0] || cleanText(postingPreferences.industry, 'customer pain point');

  ideas.push({
    id: 'theme-deep-dive',
    sourceType: 'theme',
    title: `Own the conversation around ${primaryTheme}`,
    whyItFits: `This theme is already visible in the workspace queue and fits ${audience}.`,
    prompt: `Create a strong post for ${brandLabel} about ${primaryTheme}. Audience: ${audience}. Make it specific, practical, and brand-aligned.`,
    recommendedPlatforms,
  });

  ideas.push({
    id: 'audience-pain-point',
    sourceType: 'audience',
    title: `Solve one sharp pain point for ${audience}`,
    whyItFits: 'Audience-driven ideas usually outperform generic promotional copy.',
    prompt: `Write a post for ${brandLabel} that addresses one painful problem faced by ${audience}. Use a clear hook, one concrete takeaway, and a soft CTA.`,
    recommendedPlatforms,
  });

  if (profileNotes) {
    ideas.push({
      id: 'proof-point-story',
      sourceType: 'brand',
      title: 'Turn brand context into a proof-backed story',
      whyItFits: 'The saved brand notes are currently underused and should inform stronger, less generic posts.',
      prompt: `Use this brand context for ${brandLabel}: ${profileNotes}. Turn it into a proof-backed social post for ${audience} with one clear takeaway.`,
      recommendedPlatforms,
    });
  }

  if (competitorTargets.length > 0) {
    ideas.push({
      id: 'competitor-gap',
      sourceType: 'competitor',
      title: `Differentiate from ${competitorTargets[0]}`,
      whyItFits: 'The workspace already has competitor targets configured, so the next useful move is sharper positioning.',
      prompt: `Create a post for ${brandLabel} that clearly differentiates us from ${competitorTargets[0]} without naming them directly. Focus on ${secondaryTheme} and speak to ${audience}.`,
      recommendedPlatforms,
    });
  }

  const pendingQueueCount = Number(operationsSnapshot?.summary?.queueCount || 0);
  if (pendingQueueCount > 0) {
    ideas.push({
      id: 'queue-cleanup-angle',
      sourceType: 'queue',
      title: 'Generate a cleaner approval-friendly angle',
      whyItFits: `${pendingQueueCount} queue item${pendingQueueCount === 1 ? '' : 's'} means the team likely needs clearer hooks and proof.`,
      prompt: `Write a clean, low-fluff post for ${brandLabel} about ${primaryTheme}. Make it approval-friendly: clear hook, direct value, no hype, audience ${audience}.`,
      recommendedPlatforms,
    });
  }

  ideas.push({
    id: 'myth-vs-reality',
    sourceType: 'theme',
    title: `Myth vs reality on ${secondaryTheme}`,
    whyItFits: 'This is a reliable format for authority-building across Twitter and LinkedIn.',
    prompt: `Create a myth-vs-reality post for ${brandLabel} around ${secondaryTheme}. Audience: ${audience}. Keep it confident and useful, not salesy.`,
    recommendedPlatforms,
  });

  ideas.push({
    id: 'series-seed',
    sourceType: 'series',
    title: `Start a short series on ${primaryTheme}`,
    whyItFits: 'A repeatable series gives the workspace a more consistent content spine.',
    prompt: `Draft the first post in a short recurring series for ${brandLabel} on ${primaryTheme}. Make it repeatable across upcoming weeks for ${audience}.`,
    recommendedPlatforms,
  });

  return dedupeIdeasByTitle(ideas, 8, { cleanText });
}
