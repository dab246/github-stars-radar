# Contributing to GitHub Stars Radar

Thanks for taking the time to contribute! 🎉 Every contribution helps, whether it's a bug report, an idea, a translation or code.

## Ways to contribute

- 🐛 **Report a bug**: [open a bug report](https://github.com/dab246/github-stars-radar/issues/new?template=bug_report.yml)
- 🗂️ **Suggest a category or language**: [open a category request](https://github.com/dab246/github-stars-radar/issues/new?template=category_request.yml)
- 💡 **Propose a feature**: [open a feature request](https://github.com/dab246/github-stars-radar/issues/new?template=feature_request.yml)
- 🧑‍💻 **Send a pull request**: look for issues labelled [`good first issue`](https://github.com/dab246/github-stars-radar/issues?q=is%3Aopen+label%3A%22good+first+issue%22) or [`help wanted`](https://github.com/dab246/github-stars-radar/issues?q=is%3Aopen+label%3A%22help+wanted%22)

## Development setup

The project has **no dependencies and no build step**. You only need Node.js 18+ (for the data script) and any static file server.

```bash
git clone https://github.com/<your-username>/github-stars-radar.git
cd github-stars-radar
python3 -m http.server -d site 8000   # open http://localhost:8000
```

`site/data/repos.json` is committed, so UI work does not need a token. To regenerate the data:

```bash
GITHUB_TOKEN=$(gh auth token) node scripts/fetch.mjs
```

The search API allows 30 requests per minute, so a full run takes about 5 minutes.

## Common changes

### Add a category

1. Add an entry to `CATEGORIES` in `scripts/fetch.mjs`, with one query per topic:
   ```js
   { id: 'devops', label: 'DevOps', queries: ['topic:devops', 'topic:kubernetes', 'topic:terraform'] },
   ```
2. Add the label to **every** locale in `I18N.*.categories` in `site/app.js`.
3. Run the fetch script, check the page locally, and commit the code. Leave `repos.json` out of the commit; the scheduled workflow regenerates it.

Each new topic adds 3 search requests per run (one per period), so keep the list focused.

### Add a language

Add `['id', 'Display name']` to `LANGUAGES` in `scripts/fetch.mjs`. The display name must match GitHub's [linguist name](https://github.com/github-linguist/linguist/blob/main/lib/linguist/languages.yml). Optionally add its color to `LANG_COLORS` in `site/app.js`.

### Add a translation

Copy the `en` block in `I18N` (`site/app.js`), translate the strings, and add a button with `data-locale="<code>"` to the `.locale` group in `site/index.html`.

## Guidelines

- **Keep it dependency-free.** Plain HTML, CSS and JavaScript; no frameworks or bundlers.
- **Write everything in English**: code, comments, commit messages and docs. Other languages belong in `I18N` only.
- **Escape untrusted text.** Repository names and descriptions come from GitHub users; always pass them through `esc()` before inserting HTML.
- **Check both layouts.** Test at desktop width and at phone width (about 390px), and in both EN and VI.
- **Keep regexes linear.** Avoid nested or overlapping quantifiers on untrusted input.

## Pull request process

1. Fork the repository and create a branch: `git checkout -b feat/devops-category`.
2. Make your change and test it locally.
3. Use a [Conventional Commit](https://www.conventionalcommits.org/) title, e.g. `feat: add devops category` or `fix: escape topic names`.
4. Open a pull request and fill in the template. Add a screenshot for UI changes.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be kind and constructive.
