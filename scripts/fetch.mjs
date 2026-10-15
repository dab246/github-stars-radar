// Fetches the most-starred GitHub repositories created in the last week / month / year,
// grouped by category, and writes them to site/data/repos.json.
//
// Usage: GITHUB_TOKEN=xxx node scripts/fetch.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOKEN = process.env.GITHUB_TOKEN;
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../site/data/repos.json');
const PER_QUERY = 50;
const PER_LIST = 50;

const PERIODS = [
  { id: 'week', label: 'Tuần', days: 7 },
  { id: 'month', label: 'Tháng', days: 30 },
  { id: 'year', label: 'Năm', days: 365 },
];

// The search API cannot OR qualifiers together, so each category runs one query
// per topic and the results are merged.
const CATEGORIES = [
  { id: 'all', label: 'Xu hướng', queries: [''] },
  {
    id: 'ai-tools',
    label: 'Công cụ AI',
    queries: ['topic:llm', 'topic:ai', 'topic:generative-ai', 'topic:machine-learning', 'topic:mcp', 'topic:chatgpt'],
  },
  {
    id: 'ai-agents',
    label: 'AI Agent',
    queries: ['topic:ai-agent', 'topic:ai-agents', 'topic:agents', 'topic:agentic-ai', 'topic:multi-agent', 'topic:claude-code'],
  },
  {
    id: 'mobile',
    label: 'Mobile',
    queries: ['topic:android', 'topic:ios', 'topic:flutter', 'topic:react-native', 'topic:swiftui', 'topic:jetpack-compose'],
  },
  {
    id: 'web',
    label: 'Web',
    queries: ['topic:react', 'topic:nextjs', 'topic:vue', 'topic:svelte', 'topic:frontend', 'topic:tailwindcss', 'topic:web'],
  },
];

const LANGUAGES = [
  ['typescript', 'TypeScript'],
  ['javascript', 'JavaScript'],
  ['python', 'Python'],
  ['go', 'Go'],
  ['rust', 'Rust'],
  ['java', 'Java'],
  ['kotlin', 'Kotlin'],
  ['swift', 'Swift'],
  ['dart', 'Dart'],
  ['cpp', 'C++'],
  ['csharp', 'C#'],
  ['php', 'PHP'],
  ['ruby', 'Ruby'],
  ['zig', 'Zig'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isoDaysAgo(days) {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().slice(0, 10);
}

async function search(q, attempt = 1) {
  const url = new URL('https://api.github.com/search/repositories');
  url.searchParams.set('q', q);
  url.searchParams.set('sort', 'stars');
  url.searchParams.set('order', 'desc');
  url.searchParams.set('per_page', String(PER_QUERY));

  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  });

  if ((res.status === 403 || res.status === 429) && attempt <= 4) {
    const retryAfter = Number(res.headers.get('retry-after'));
    const reset = Number(res.headers.get('x-ratelimit-reset'));
    const wait = retryAfter ? retryAfter * 1000 : reset ? Math.max(reset * 1000 - Date.now(), 0) + 1000 : 60000;
    console.warn(`  rate limited, waiting ${Math.ceil(wait / 1000)}s`);
    await sleep(wait);
    return search(q, attempt + 1);
  }
  if (!res.ok) {
    console.warn(`  ! ${res.status} for "${q}": ${(await res.text()).slice(0, 200)}`);
    return [];
  }

  // Stay under the search limit (30 req/min authenticated, 10 unauthenticated).
  if (res.headers.get('x-ratelimit-remaining') === '0') {
    const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000;
    await sleep(Math.max(reset - Date.now(), 0) + 1000);
  }

  const body = await res.json();
  return body.items ?? [];
}

function slim(r) {
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

async function main() {
  if (!TOKEN) console.warn('GITHUB_TOKEN is not set: unauthenticated search is limited to 10 requests/min.');

  const repos = {};
  const lists = {};
  const categories = [
    ...CATEGORIES.map(({ id, label }) => ({ id, label })),
    { id: 'lang', label: 'Ngôn ngữ', subs: LANGUAGES.map(([id, label]) => ({ id, label })) },
  ];
  const jobs = [
    ...CATEGORIES.map((c) => ({ key: c.id, queries: c.queries })),
    ...LANGUAGES.map(([id, label]) => ({ key: `lang:${id}`, queries: [`language:"${label}"`] })),
  ];

  for (const period of PERIODS) {
    const since = isoDaysAgo(period.days);
    period.since = since;
    lists[period.id] = {};

    for (const job of jobs) {
      const merged = new Map();
      for (const q of job.queries) {
        const query = `${q} created:>=${since} archived:false`.trim();
        console.log(`[${period.id}] ${query}`);
        for (const item of await search(query)) merged.set(item.full_name, item);
      }
      const top = [...merged.values()]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, PER_LIST);
      for (const r of top) repos[r.full_name] = slim(r);
      lists[period.id][job.key] = top.map((r) => r.full_name);
    }
  }

  const data = {
    generatedAt: new Date().toISOString(),
    periods: PERIODS.map(({ id, label, since }) => ({ id, label, since })),
    categories,
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
