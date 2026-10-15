// Builds site/data/repos.json with three views of GitHub repositories:
//   new  - repositories created in the last week / month / year, ranked by total stars (Search API)
//   hot  - repositories of any age ranked by stars gained today / this week / this month (GitHub Trending)
//   top  - the most-starred repositories of all time (Search API)
// Each view is split into categories (topics) and programming languages.
//
// Usage: GITHUB_TOKEN=xxx node scripts/fetch.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOKEN = process.env.GITHUB_TOKEN;
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../site/data/repos.json');
const PER_QUERY = 50;
const PER_LIST = 50;

const NEW_PERIODS = [
  { id: 'week', label: 'Week', days: 7 },
  { id: 'month', label: 'Month', days: 30 },
  { id: 'year', label: 'Year', days: 365 },
];

const HOT_PERIODS = [
  { id: 'day', label: 'Today', since: 'daily', phrase: 'today' },
  { id: 'week', label: 'Week', since: 'weekly', phrase: 'this week' },
  { id: 'month', label: 'Month', since: 'monthly', phrase: 'this month' },
];

// `topics: null` matches every repository. The search API cannot OR qualifiers together,
// so the new/top views run one query per topic and merge the results.
const CATEGORIES = [
  { id: 'all', label: 'All', topics: null },
  {
    id: 'ai-skills',
    label: 'AI dev skills',
    topics: [
      'agent-skills', 'claude-skills', 'claude-code-skills', 'claude-code-plugin',
      'codex-skills', 'cursor-rules', 'subagents', 'spec-driven-development',
    ],
  },
  { id: 'ai-tools', label: 'AI tools', topics: ['llm', 'ai', 'generative-ai', 'machine-learning', 'mcp', 'chatgpt'] },
  { id: 'ai-agents', label: 'AI agents', topics: ['ai-agent', 'ai-agents', 'agents', 'agentic-ai', 'multi-agent', 'claude-code'] },
  { id: 'mobile', label: 'Mobile', topics: ['android', 'ios', 'flutter', 'react-native', 'swiftui', 'jetpack-compose'] },
  { id: 'web', label: 'Web', topics: ['react', 'nextjs', 'vue', 'svelte', 'frontend', 'tailwindcss', 'web'] },
];

// [id, GitHub linguist name, github.com/trending slug]
const LANGUAGES = [
  ['typescript', 'TypeScript', 'typescript'],
  ['javascript', 'JavaScript', 'javascript'],
  ['python', 'Python', 'python'],
  ['go', 'Go', 'go'],
  ['rust', 'Rust', 'rust'],
  ['java', 'Java', 'java'],
  ['kotlin', 'Kotlin', 'kotlin'],
  ['swift', 'Swift', 'swift'],
  ['dart', 'Dart', 'dart'],
  ['cpp', 'C++', 'c++'],
  ['csharp', 'C#', 'c%23'],
  ['php', 'PHP', 'php'],
  ['ruby', 'Ruby', 'ruby'],
  ['zig', 'Zig', 'zig'],
];

// Extra trending pages that only widen the pool of hot repositories for topic categories.
const EXTRA_TRENDING_SLUGS = ['c', 'shell', 'html', 'css', 'jupyter-notebook', 'vue', 'svelte', 'lua', 'mdx'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isoDaysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
const topicQueries = (topics) => (topics ? topics.map((t) => `topic:${t}`) : ['']);

const API_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'github-stars-radar',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function waitForRateLimit(res, attempt) {
  if ((res.status !== 403 && res.status !== 429) || attempt > 4) return false;
  const retryAfter = Number(res.headers.get('retry-after'));
  const reset = Number(res.headers.get('x-ratelimit-reset'));
  const wait = retryAfter ? retryAfter * 1000 : reset ? Math.max(reset * 1000 - Date.now(), 0) + 1000 : 60000;
  console.warn(`  rate limited, waiting ${Math.ceil(wait / 1000)}s`);
  await sleep(wait);
  return true;
}

// ---------- Search API (new + top views) ----------

async function search(q, attempt = 1) {
  const url = new URL('https://api.github.com/search/repositories');
  url.searchParams.set('q', q);
  url.searchParams.set('sort', 'stars');
  url.searchParams.set('order', 'desc');
  url.searchParams.set('per_page', String(PER_QUERY));

  const res = await fetch(url, { headers: API_HEADERS });
  if (await waitForRateLimit(res, attempt)) return search(q, attempt + 1);
  if (!res.ok) {
    console.warn(`  ! ${res.status} for "${q}": ${(await res.text()).slice(0, 200)}`);
    return [];
  }
  // Stay under the search limit (30 req/min authenticated, 10 unauthenticated).
  if (res.headers.get('x-ratelimit-remaining') === '0') {
    const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000;
    await sleep(Math.max(reset - Date.now(), 0) + 1000);
  }
  return (await res.json()).items ?? [];
}

function slimSearchItem(r) {
  return {
    name: r.full_name,
    description: r.description ?? '',
    stars: r.stargazers_count,
    forks: r.forks_count,
    language: r.language,
    topics: (r.topics ?? []).slice(0, 6),
    avatar: r.owner?.avatar_url ?? '',
    homepage: r.homepage || '',
    createdAt: r.created_at,
  };
}

async function searchList(queries, qualifiers, repos) {
  const merged = new Map();
  for (const q of queries) {
    const query = `${q} ${qualifiers}`.trim();
    console.log(`  search: ${query}`);
    for (const item of await search(query)) merged.set(item.full_name, item);
  }
  const top = [...merged.values()].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, PER_LIST);
  for (const r of top) repos[r.full_name] = { ...repos[r.full_name], ...slimSearchItem(r) };
  return top.map((r) => r.full_name);
}

const searchJobs = (base) => [
  ...CATEGORIES.map((c) => ({
    key: c.id,
    queries: topicQueries(c.topics),
    // A qualifier-only query needs at least one term; a star floor keeps "all" meaningful.
    extra: c.topics ? '' : base.allExtra,
  })),
  ...LANGUAGES.map(([id, label]) => ({ key: `lang:${id}`, queries: [`language:"${label}"`], extra: '' })),
];

// ---------- GitHub Trending (hot view) ----------

// Parses github.com/trending HTML with plain string search (no regex over the page).
function parseTrending(html, phrase) {
  const out = [];
  for (const block of html.split('<article class="Box-row">').slice(1)) {
    const h2 = block.indexOf('<h2');
    const href = h2 < 0 ? -1 : block.indexOf('href="/', h2);
    if (href < 0) continue;
    const start = href + 'href="/'.length;
    const name = block.slice(start, block.indexOf('"', start));
    if (name.split('/').length !== 2) continue;

    let gained = 0;
    const at = block.indexOf(` ${phrase}`, block.indexOf('float-sm-right'));
    if (at > 0) {
      // Text looks like "23,310 stars this week" or "1 star today".
      const words = block.slice(Math.max(0, at - 40), at).trim().split(/\s+/);
      if (words.at(-1)?.startsWith('star')) gained = Number((words.at(-2) ?? '').replaceAll(',', '')) || 0;
    }
    out.push({ name, gained });
  }
  return out;
}

async function trendingPage(slug, period, attempt = 1) {
  const url = `https://github.com/trending${slug ? `/${slug}` : ''}?since=${period.since}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'github-stars-radar', Accept: 'text/html' } });
  if (res.status === 429 && attempt <= 3) {
    await sleep(30000 * attempt);
    return trendingPage(slug, period, attempt + 1);
  }
  if (!res.ok) {
    console.warn(`  ! ${res.status} for ${url}`);
    return [];
  }
  await sleep(700);
  return parseTrending(await res.text(), period.phrase);
}

// Fetches details for many repositories in a few GraphQL calls.
async function fetchRepoDetails(names) {
  const details = {};
  for (let i = 0; i < names.length; i += 40) {
    const chunk = names.slice(i, i + 40);
    const fields = chunk.map((full, j) => {
      const [owner, name] = full.split('/');
      return `r${j}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { ...F }`;
    });
    const query = `query { ${fields.join('\n')} }
      fragment F on Repository {
        nameWithOwner description stargazerCount forkCount homepageUrl createdAt
        primaryLanguage { name }
        owner { avatarUrl }
        repositoryTopics(first: 20) { nodes { topic { name } } }
      }`;
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { ...API_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      console.warn(`  ! GraphQL ${res.status}: ${(await res.text()).slice(0, 200)}`);
      continue;
    }
    // Renamed or deleted repositories come back as null with an error entry; skip them.
    const { data } = await res.json();
    for (const r of Object.values(data ?? {})) {
      if (!r) continue;
      details[r.nameWithOwner] = {
        name: r.nameWithOwner,
        description: r.description ?? '',
        stars: r.stargazerCount,
        forks: r.forkCount,
        language: r.primaryLanguage?.name ?? null,
        allTopics: r.repositoryTopics.nodes.map((n) => n.topic.name),
        avatar: r.owner.avatarUrl,
        homepage: r.homepageUrl || '',
        createdAt: r.createdAt,
      };
    }
  }
  return details;
}

async function buildHot(repos) {
  const slugs = ['', ...LANGUAGES.map(([, , slug]) => slug), ...EXTRA_TRENDING_SLUGS];
  const gains = {}; // period id -> Map(name -> stars gained)

  for (const period of HOT_PERIODS) {
    gains[period.id] = new Map();
    for (const slug of slugs) {
      console.log(`  trending: ${slug || '(all)'} ${period.since}`);
      for (const { name, gained } of await trendingPage(slug, period)) {
        if (gained > (gains[period.id].get(name) ?? 0)) gains[period.id].set(name, gained);
      }
    }
  }

  const names = [...new Set(Object.values(gains).flatMap((m) => [...m.keys()]))];
  console.log(`  details for ${names.length} trending repositories`);
  const details = await fetchRepoDetails(names);

  const lists = {};
  for (const period of HOT_PERIODS) {
    const pool = [...gains[period.id]]
      .filter(([name]) => details[name])
      .map(([name, gained]) => ({ ...details[name], gained }))
      .sort((a, b) => b.gained - a.gained);

    const take = (filter) => {
      const picked = pool.filter(filter).slice(0, PER_LIST);
      for (const r of picked) {
        const { allTopics, gained, ...rest } = r;
        repos[r.name] = {
          ...repos[r.name],
          ...rest,
          topics: allTopics.slice(0, 6),
          gained: { ...repos[r.name]?.gained, [period.id]: gained },
        };
      }
      return picked.map((r) => r.name);
    };

    lists[period.id] = {};
    for (const c of CATEGORIES) {
      lists[period.id][c.id] = take((r) => !c.topics || r.allTopics.some((t) => c.topics.includes(t)));
    }
    for (const [id, label] of LANGUAGES) {
      lists[period.id][`lang:${id}`] = take((r) => r.language === label);
    }
  }
  return lists;
}

// ---------- main ----------

async function main() {
  if (!TOKEN) throw new Error('GITHUB_TOKEN is required (search rate limits and GraphQL).');

  const repos = {};
  const lists = { new: {}, hot: {}, top: {} };

  console.log('[new]');
  for (const period of NEW_PERIODS) {
    period.since = isoDaysAgo(period.days);
    lists.new[period.id] = {};
    for (const job of searchJobs({ allExtra: '' })) {
      lists.new[period.id][job.key] = await searchList(job.queries, `${job.extra} created:>=${period.since} archived:false`, repos);
    }
  }

  console.log('[top]');
  lists.top.all = {};
  for (const job of searchJobs({ allExtra: 'stars:>=10000' })) {
    lists.top.all[job.key] = await searchList(job.queries, `${job.extra} archived:false`, repos);
  }

  console.log('[hot]');
  lists.hot = await buildHot(repos);

  const data = {
    generatedAt: new Date().toISOString(),
    modes: [
      { id: 'new', label: 'New', periods: NEW_PERIODS.map(({ id, label, since }) => ({ id, label, since })) },
      { id: 'hot', label: 'Hot', periods: HOT_PERIODS.map(({ id, label }) => ({ id, label })) },
      { id: 'top', label: 'All-time', periods: [{ id: 'all', label: 'All time' }] },
    ],
    categories: [
      ...CATEGORIES.map(({ id, label }) => ({ id, label })),
      { id: 'lang', label: 'Languages', subs: LANGUAGES.map(([id, label]) => ({ id, label })) },
    ],
    lists,
    repos,
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(data));
  console.log(`Wrote ${Object.keys(repos).length} repos to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
