# ★ GitHub Stars Radar

A site that lists the **most-starred new GitHub repositories of the week, month and year**, grouped by category:

- **Trending**: all repositories
- **AI tools**: `llm`, `ai`, `generative-ai`, `machine-learning`, `mcp`, `chatgpt`
- **AI agents**: `ai-agent`, `ai-agents`, `agents`, `agentic-ai`, `multi-agent`, `claude-code`
- **Mobile**: `android`, `ios`, `flutter`, `react-native`, `swiftui`, `jetpack-compose`
- **Web**: `react`, `nextjs`, `vue`, `svelte`, `frontend`, `tailwindcss`, `web`
- **Languages**: TypeScript, JavaScript, Python, Go, Rust, Java, Kotlin, Swift, Dart, C++, C#, PHP, Ruby, Zig

Live site: https://dab246.github.io/github-stars-radar/

Click **+** to save a repository to the **Saved** tab (stored in your browser). The interface is available in English and Vietnamese (EN / VI switch in the header).

## How it works

- `scripts/fetch.mjs` queries the GitHub Search API for repositories **created** in the last 7 / 30 / 365 days, ranks them by total stars, and writes `site/data/repos.json`. GitHub does not expose stars gained per period, so "top of the week" means the most-starred repositories created that week.
- `site/` is a static page (plain HTML/CSS/JS, no build step). UI strings live in the `I18N` table in `site/app.js`.
- GitHub Actions (`.github/workflows/update.yml`) runs every 6 hours: it refreshes the data, commits it, and deploys to GitHub Pages.

## Run locally

```bash
GITHUB_TOKEN=$(gh auth token) node scripts/fetch.mjs   # Node 18+
python3 -m http.server -d site 8000                    # open http://localhost:8000
```

To add a category or language, edit `CATEGORIES` / `LANGUAGES` in `scripts/fetch.mjs` and add its label to `I18N` in `site/app.js`.
