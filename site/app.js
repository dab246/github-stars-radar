(() => {
  const SAVED_KEY = 'gsr.saved';
  const LOCALE_KEY = 'gsr.locale';
  const LANG_COLORS = {
    TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Go: '#00ADD8', Rust: '#dea584',
    Java: '#b07219', Kotlin: '#A97BFF', Swift: '#F05138', Dart: '#00B4AB', 'C++': '#f34b7d', C: '#555555',
    'C#': '#178600', PHP: '#4F5D95', Ruby: '#701516', Zig: '#ec915c', Shell: '#89e051', HTML: '#e34c26',
    CSS: '#663399', Vue: '#41b883', Svelte: '#ff3e00', 'Jupyter Notebook': '#DA5B0B', Lua: '#000080',
    'Objective-C': '#438eff', Scala: '#c22d40', Elixir: '#6e4a7e', Haskell: '#5e5086', MDX: '#fcb32c',
  };

  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const count = (shown, total, of) => `${shown}${total !== shown ? ` ${of} ${total}` : ''}`;

  const I18N = {
    en: {
      intl: 'en-US',
      subtitle: 'What is new, what is hot and what is biggest on GitHub, by category and language.',
      modes: { new: 'New', hot: 'Hot', top: 'All-time' },
      periods: { day: 'Today', week: 'Week', month: 'Month', year: 'Year', all: 'All time' },
      categories: {
        all: 'All', 'ai-skills': 'AI dev skills', 'ai-tools': 'AI tools', 'ai-agents': 'AI agents', mobile: 'Mobile',
        web: 'Web', lang: 'Languages', saved: 'Saved',
      },
      colRepo: 'Repository',
      colDesc: 'What it does',
      colStars: 'Stars',
      colGained: 'Stars gained',
      searchPlaceholder: 'Filter by name, description, topic…',
      localeAria: 'Interface language',
      modeAria: 'Ranking',
      periodAria: 'Time period',
      categoriesAria: 'Categories',
      languagesAria: 'Languages',
      source: {
        new: 'Data from the GitHub Search API · repos created in the selected period, ranked by total stars.',
        hot: 'Data from GitHub Trending · repos of any age, ranked by stars gained in the selected period.',
        top: 'Data from the GitHub Search API · repos ranked by total stars.',
      },
      hint: {
        new: (date, shown, total) => `Created since ${date} · ${count(shown, total, 'of')} results`,
        hot: (period, shown, total) => `Most stars gained ${period} · ${count(shown, total, 'of')} results`,
        top: (shown, total) => `Most-starred repos of all time · ${count(shown, total, 'of')} results`,
      },
      hotPhrase: { day: 'today', week: 'this week', month: 'this month' },
      hintSaved: (n) => `${plural(n, 'repo')} saved in this browser`,
      emptySaved: 'No saved repos yet. Click + on a row to save it.',
      emptyFilter: 'No repos match this filter.',
      loadError: 'Could not load data. Try reloading the page.',
      noDesc: 'No description',
      created: (when) => `Created ${when}`,
      totalStars: (n) => `${n} stars in total`,
      today: 'today',
      daysAgo: (n) => `${plural(n, 'day')} ago`,
      monthsAgo: (n) => `${plural(n, 'month')} ago`,
      yearsAgo: (n) => `${plural(n, 'year')} ago`,
      updated: (when) => `Updated: ${when}`,
      save: 'Save',
      unsave: 'Remove from saved',
    },
    vi: {
      intl: 'vi-VN',
      subtitle: 'Repo mới, repo đang hot và repo lớn nhất trên GitHub, theo danh mục và ngôn ngữ.',
      modes: { new: 'Mới', hot: 'Hot', top: 'Mọi thời đại' },
      periods: { day: 'Hôm nay', week: 'Tuần', month: 'Tháng', year: 'Năm', all: 'Mọi thời đại' },
      categories: {
        all: 'Tất cả', 'ai-skills': 'Skill AI cho dev', 'ai-tools': 'Công cụ AI', 'ai-agents': 'AI Agent',
        mobile: 'Mobile', web: 'Web', lang: 'Ngôn ngữ', saved: 'Đã lưu',
      },
      colRepo: 'Repository',
      colDesc: 'Dùng để làm gì',
      colStars: 'Sao',
      colGained: 'Sao tăng thêm',
      searchPlaceholder: 'Lọc theo tên, mô tả, topic…',
      localeAria: 'Ngôn ngữ giao diện',
      modeAria: 'Bảng xếp hạng',
      periodAria: 'Khoảng thời gian',
      categoriesAria: 'Danh mục',
      languagesAria: 'Ngôn ngữ lập trình',
      source: {
        new: 'Dữ liệu từ GitHub Search API · repo tạo trong khoảng thời gian đã chọn, xếp theo tổng số sao.',
        hot: 'Dữ liệu từ GitHub Trending · repo ở mọi độ tuổi, xếp theo số sao tăng thêm trong khoảng thời gian đã chọn.',
        top: 'Dữ liệu từ GitHub Search API · repo xếp theo tổng số sao.',
      },
      hint: {
        new: (date, shown, total) => `Repo tạo từ ${date} · ${count(shown, total, '/')} kết quả`,
        hot: (period, shown, total) => `Tăng nhiều sao nhất ${period} · ${count(shown, total, '/')} kết quả`,
        top: (shown, total) => `Repo nhiều sao nhất mọi thời đại · ${count(shown, total, '/')} kết quả`,
      },
      hotPhrase: { day: 'hôm nay', week: 'tuần này', month: 'tháng này' },
      hintSaved: (n) => `${n} repo đã lưu trên trình duyệt này`,
      emptySaved: 'Chưa lưu repo nào. Bấm + ở một dòng để lưu lại.',
      emptyFilter: 'Không có repo nào khớp bộ lọc.',
      loadError: 'Không tải được dữ liệu. Thử tải lại trang.',
      noDesc: 'Chưa có mô tả',
      created: (when) => `Tạo ${when}`,
      totalStars: (n) => `Tổng ${n} sao`,
      today: 'hôm nay',
      daysAgo: (n) => `${n} ngày trước`,
      monthsAgo: (n) => `${n} tháng trước`,
      yearsAgo: (n) => `${n} năm trước`,
      updated: (when) => `Cập nhật: ${when}`,
      save: 'Lưu lại',
      unsave: 'Bỏ lưu',
    },
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    locales: $('locales'), modes: $('modes'), periods: $('periods'), categories: $('categories'), subs: $('subs'),
    hint: $('hint'), q: $('q'), list: $('list'), empty: $('empty'), updated: $('updated'), source: $('source'),
    colStars: $('col-stars'),
  };

  let data = null;
  let saved = loadSaved();
  let locale = loadLocale();
  const state = { mode: 'new', period: 'week', category: 'all', sub: null, query: '' };
  const t = () => I18N[locale];

  function loadSaved() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVED_KEY) || '{}');
      return raw && typeof raw === 'object' ? raw : {};
    } catch { return {}; }
  }
  function persistSaved() {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(saved)); } catch { /* storage unavailable */ }
  }
  function loadLocale() {
    try {
      const stored = localStorage.getItem(LOCALE_KEY);
      if (I18N[stored]) return stored;
    } catch { /* storage unavailable */ }
    return 'en';
  }
  function persistLocale() {
    try { localStorage.setItem(LOCALE_KEY, locale); } catch { /* storage unavailable */ }
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmtNumber = (n) => new Intl.NumberFormat(t().intl).format(n);
  const fmtDate = (iso) => new Date(iso).toLocaleDateString(t().intl, { dateStyle: 'medium' });
  const categoryLabel = (c) => t().categories[c.id] || c.label;
  const currentMode = () => data.modes.find((m) => m.id === state.mode);
  const isSavedView = () => state.category === 'saved';

  // "claude-mem" -> "Claude Mem"; names that already have capitals keep them.
  function prettyName(full) {
    const name = full.split('/')[1] || full;
    if (/[A-Z]/.test(name)) return name.replace(/[-_]+/g, ' ');
    return name.split(/[-_.]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  }

  function ago(iso) {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days < 1) return t().today;
    if (days < 30) return t().daysAgo(days);
    if (days < 365) return t().monthsAgo(Math.floor(days / 30));
    return t().yearsAgo(Math.floor(days / 365));
  }

  function setMode(id, period) {
    const mode = data.modes.find((m) => m.id === id);
    if (!mode) return;
    state.mode = mode.id;
    state.period = mode.periods.some((p) => p.id === period) ? period : mode.periods[0].id;
  }

  function setCategory(id, sub) {
    const cat = data.categories.find((c) => c.id === id);
    if (!cat) return;
    state.category = cat.id;
    state.sub = cat.subs ? (cat.subs.find((s) => s.id === sub) || cat.subs[0]).id : null;
  }

  // URL hash: #/new/week/ai-agents, #/hot/day/lang/python, #/top/all/web, #/saved.
  // Older links without a mode (#/month/lang/rust) open the "new" view.
  function readHash() {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    if (parts[0] === 'saved') { state.category = 'saved'; state.sub = null; return; }
    if (!data.modes.some((m) => m.id === parts[0])) parts.unshift('new');
    const [mode, period, category, sub] = parts;
    setMode(mode, period);
    leaveSaved();
    setCategory(category, sub);
  }
  function writeHash() {
    const parts = isSavedView() ? ['saved'] : [state.mode, state.period, state.category, state.sub].filter(Boolean);
    history.replaceState(null, '', `#/${parts.join('/')}`);
  }

  function currentRepos() {
    if (isSavedView()) {
      return Object.values(saved)
        .map((r) => data.repos[r.name] || r)
        .sort((a, b) => b.stars - a.stars);
    }
    const key = state.sub ? `${state.category}:${state.sub}` : state.category;
    return (data.lists[state.mode]?.[state.period]?.[key] || []).map((n) => data.repos[n]).filter(Boolean);
  }

  function renderStatic() {
    document.documentElement.lang = locale;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t()[el.dataset.i18n]; });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t()[el.dataset.i18nPlaceholder]; });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t()[el.dataset.i18nAria]); });
    els.locales.querySelectorAll('[data-locale]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.locale === locale)));
    if (data) els.updated.textContent = t().updated(new Date(data.generatedAt).toLocaleString(t().intl, { dateStyle: 'medium', timeStyle: 'short' }));
  }

  function renderModes() {
    els.modes.innerHTML = data.modes.map((m) => `
      <button role="tab" data-mode="${esc(m.id)}" aria-selected="${!isSavedView() && m.id === state.mode}">${esc(t().modes[m.id] || m.label)}</button>
    `).join('');
    const periods = currentMode().periods;
    // A single period (all-time) needs no switch.
    els.periods.hidden = periods.length < 2;
    els.periods.innerHTML = periods.map((p) => `
      <button role="tab" data-period="${esc(p.id)}" aria-selected="${!isSavedView() && p.id === state.period}">${esc(t().periods[p.id] || p.label)}</button>
    `).join('');
  }

  function renderCategories() {
    const savedCount = Object.keys(saved).length;
    els.categories.innerHTML = data.categories.map((c) => `
      <button class="chip" data-category="${esc(c.id)}" aria-pressed="${c.id === state.category}">${esc(categoryLabel(c))}</button>
    `).join('') + `
      <button class="chip" data-category="saved" aria-pressed="${isSavedView()}">${esc(t().categories.saved)}${savedCount ? `<span class="count">${savedCount}</span>` : ''}</button>`;

    const cat = data.categories.find((c) => c.id === state.category);
    els.subs.hidden = !cat?.subs;
    els.subs.innerHTML = cat?.subs ? cat.subs.map((s) => `
      <button class="chip" data-sub="${esc(s.id)}" aria-pressed="${s.id === state.sub}">${esc(s.label)}</button>
    `).join('') : '';
  }

  function starsHtml(r) {
    const gained = !isSavedView() && state.mode === 'hot' ? r.gained?.[state.period] : undefined;
    if (gained === undefined) return `<span class="stars"><span class="s">★</span>${fmtNumber(r.stars)}</span>`;
    return `
      <span class="stars gain" title="${esc(t().totalStars(fmtNumber(r.stars)))}">
        <span class="up">+${fmtNumber(gained)}</span>
        <span class="total"><span class="s">★</span>${fmtNumber(r.stars)}</span>
      </span>`;
  }

  function rowHtml(r, i) {
    const url = `https://github.com/${r.name}`;
    const isSaved = Boolean(saved[r.name]);
    const action = isSaved ? t().unsave : t().save;
    const avatar = r.avatar ? `${r.avatar}${r.avatar.includes('?') ? '&' : '?'}s=104` : '';
    const lang = r.language
      ? `<span class="lang" style="--lang:${LANG_COLORS[r.language] || '#64748b'}">${esc(r.language)}</span>` : '';
    return `
      <li class="row">
        <span class="rank">${String(i + 1).padStart(2, '0')}</span>
        <div class="repo">
          <img src="${esc(avatar)}" alt="" loading="lazy" width="52" height="52">
          <div class="names">
            <a class="title" href="${esc(url)}" target="_blank" rel="noopener">${esc(prettyName(r.name))}</a>
            <span class="slug" title="${esc(r.name)}">${esc(r.name)}</span>
          </div>
        </div>
        <div class="desc">
          <p>${esc(r.description) || `<em>${esc(t().noDesc)}</em>`}</p>
          <div class="meta">
            ${lang}
            <span>⑂ ${fmtNumber(r.forks || 0)}</span>
            <span>${esc(t().created(ago(r.createdAt)))}</span>
            ${(r.topics || []).slice(0, 3).map((topic) => `<span>#${esc(topic)}</span>`).join('')}
          </div>
        </div>
        ${starsHtml(r)}
        <button class="save" data-save="${esc(r.name)}" aria-pressed="${isSaved}"
          aria-label="${esc(action)}: ${esc(r.name)}" title="${esc(action)}">${isSaved ? '✓' : '+'}</button>
      </li>`;
  }

  function renderList() {
    const q = state.query.trim().toLowerCase();
    const all = currentRepos();
    const items = q
      ? all.filter((r) => `${r.name} ${r.description} ${(r.topics || []).join(' ')} ${r.language || ''}`.toLowerCase().includes(q))
      : all;

    els.list.innerHTML = items.map(rowHtml).join('');
    els.empty.hidden = items.length > 0;
    els.empty.textContent = isSavedView() && !q ? t().emptySaved : t().emptyFilter;
    els.colStars.textContent = !isSavedView() && state.mode === 'hot' ? t().colGained : t().colStars;
    els.source.textContent = t().source[state.mode];

    if (isSavedView()) {
      els.hint.textContent = t().hintSaved(items.length);
    } else if (state.mode === 'new') {
      const period = currentMode().periods.find((p) => p.id === state.period);
      els.hint.textContent = t().hint.new(fmtDate(period.since), items.length, all.length);
    } else if (state.mode === 'hot') {
      els.hint.textContent = t().hint.hot(t().hotPhrase[state.period], items.length, all.length);
    } else {
      els.hint.textContent = t().hint.top(items.length, all.length);
    }
  }

  function render() {
    renderStatic();
    renderModes();
    renderCategories();
    renderList();
    writeHash();
  }

  // Leaving the saved view goes back to the first category.
  function leaveSaved() {
    if (isSavedView()) setCategory('all');
  }

  els.locales.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-locale]');
    if (!btn || btn.dataset.locale === locale) return;
    locale = btn.dataset.locale;
    persistLocale();
    if (data) render(); else renderStatic();
  });

  els.modes.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mode]');
    if (!btn) return;
    setMode(btn.dataset.mode, state.period);
    leaveSaved();
    render();
  });

  els.periods.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-period]');
    if (!btn) return;
    state.period = btn.dataset.period;
    leaveSaved();
    render();
  });

  els.categories.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-category]');
    if (!btn) return;
    if (btn.dataset.category === 'saved') { state.category = 'saved'; state.sub = null; }
    else setCategory(btn.dataset.category, state.sub);
    render();
  });

  els.subs.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sub]');
    if (!btn) return;
    state.sub = btn.dataset.sub;
    render();
  });

  els.list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-save]');
    if (!btn) return;
    const name = btn.dataset.save;
    if (saved[name]) delete saved[name];
    else if (data.repos[name]) saved[name] = data.repos[name];
    else return;
    persistSaved();
    renderCategories();
    renderList();
  });

  els.q.addEventListener('input', () => {
    state.query = els.q.value;
    renderList();
  });

  window.addEventListener('hashchange', () => { readHash(); render(); });

  function showSkeleton() {
    els.list.innerHTML = Array.from({ length: 8 }, () => `
      <li class="row skeleton">
        <span class="bar" style="width:28px"></span>
        <span class="bar" style="width:70%"></span>
        <span class="bar"></span>
        <span class="bar" style="width:60%;justify-self:end"></span>
        <span></span>
      </li>`).join('');
  }

  async function init() {
    renderStatic();
    showSkeleton();
    try {
      const res = await fetch('data/repos.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      data = await res.json();
      if (!data.modes) throw new Error('outdated data format');
    } catch {
      els.list.innerHTML = '';
      els.empty.hidden = false;
      els.empty.textContent = t().loadError;
      return;
    }
    // Refresh saved snapshots with the latest numbers.
    for (const name of Object.keys(saved)) if (data.repos[name]) saved[name] = data.repos[name];
    persistSaved();

    readHash();
    render();
  }

  init();
})();
