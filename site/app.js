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

  const I18N = {
    en: {
      intl: 'en-US',
      subtitle: 'The most-starred new repositories on GitHub, by week, month and year.',
      periods: { week: 'Week', month: 'Month', year: 'Year' },
      categories: {
        all: 'Trending', 'ai-tools': 'AI tools', 'ai-agents': 'AI agents', mobile: 'Mobile', web: 'Web',
        lang: 'Languages', saved: 'Saved',
      },
      colRepo: 'Repository',
      colDesc: 'What it does',
      colStars: 'Stars',
      searchPlaceholder: 'Filter by name, description, topic…',
      localeAria: 'Interface language',
      periodAria: 'Time period',
      categoriesAria: 'Categories',
      languagesAria: 'Languages',
      source: 'Data from the GitHub Search API · repos created in the selected period, ranked by total stars.',
      hintPeriod: (date, shown, total) => `Created since ${date} · ${shown}${total !== shown ? ` of ${total}` : ''} results`,
      hintSaved: (n) => `${plural(n, 'repo')} saved in this browser`,
      emptySaved: 'No saved repos yet. Click + on a row to save it.',
      emptyFilter: 'No repos match this filter.',
      loadError: 'Could not load data. Try reloading the page.',
      noDesc: 'No description',
      created: (when) => `Created ${when}`,
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
      subtitle: 'Repository mới nhiều sao nhất trên GitHub, theo tuần, tháng và năm.',
      periods: { week: 'Tuần', month: 'Tháng', year: 'Năm' },
      categories: {
        all: 'Xu hướng', 'ai-tools': 'Công cụ AI', 'ai-agents': 'AI Agent', mobile: 'Mobile', web: 'Web',
        lang: 'Ngôn ngữ', saved: 'Đã lưu',
      },
      colRepo: 'Repository',
      colDesc: 'Dùng để làm gì',
      colStars: 'Sao',
      searchPlaceholder: 'Lọc theo tên, mô tả, topic…',
      localeAria: 'Ngôn ngữ giao diện',
      periodAria: 'Khoảng thời gian',
      categoriesAria: 'Danh mục',
      languagesAria: 'Ngôn ngữ lập trình',
      source: 'Dữ liệu từ GitHub Search API · repo tạo trong khoảng thời gian đã chọn, xếp theo tổng số sao.',
      hintPeriod: (date, shown, total) => `Repo tạo từ ${date} · ${shown}${total !== shown ? ` / ${total}` : ''} kết quả`,
      hintSaved: (n) => `${n} repo đã lưu trên trình duyệt này`,
      emptySaved: 'Chưa lưu repo nào. Bấm + ở một dòng để lưu lại.',
      emptyFilter: 'Không có repo nào khớp bộ lọc.',
      loadError: 'Không tải được dữ liệu. Thử tải lại trang.',
      noDesc: 'Chưa có mô tả',
      created: (when) => `Tạo ${when}`,
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
    locales: $('locales'), periods: $('periods'), categories: $('categories'), subs: $('subs'), hint: $('hint'),
    q: $('q'), list: $('list'), empty: $('empty'), updated: $('updated'),
  };

  let data = null;
  let saved = loadSaved();
  let locale = loadLocale();
  const state = { period: 'week', category: 'all', sub: null, query: '' };
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

  // URL hash: #/week/ai-agents, #/month/lang/python, #/saved
  function readHash() {
    const [period, category, sub] = location.hash.replace(/^#\/?/, '').split('/');
    if (data?.periods.some((p) => p.id === period)) state.period = period;
    if (period === 'saved') { state.category = 'saved'; state.sub = null; return; }
    const cat = data?.categories.find((c) => c.id === category);
    if (cat) {
      state.category = cat.id;
      state.sub = cat.subs ? (cat.subs.find((s) => s.id === sub) || cat.subs[0]).id : null;
    }
  }
  function writeHash() {
    const parts = state.category === 'saved' ? ['saved'] : [state.period, state.category, state.sub].filter(Boolean);
    history.replaceState(null, '', `#/${parts.join('/')}`);
  }

  function currentRepos() {
    if (state.category === 'saved') {
      return Object.values(saved)
        .map((r) => data.repos[r.name] || r)
        .sort((a, b) => b.stars - a.stars);
    }
    const key = state.sub ? `${state.category}:${state.sub}` : state.category;
    return (data.lists[state.period]?.[key] || []).map((n) => data.repos[n]).filter(Boolean);
  }

  function renderStatic() {
    document.documentElement.lang = locale;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t()[el.dataset.i18n]; });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t()[el.dataset.i18nPlaceholder]; });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t()[el.dataset.i18nAria]); });
    els.locales.querySelectorAll('[data-locale]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.locale === locale)));
    if (data) els.updated.textContent = t().updated(new Date(data.generatedAt).toLocaleString(t().intl, { dateStyle: 'medium', timeStyle: 'short' }));
  }

  function renderPeriods() {
    els.periods.innerHTML = data.periods.map((p) => `
      <button role="tab" data-period="${esc(p.id)}" aria-selected="${state.category !== 'saved' && p.id === state.period}">${esc(t().periods[p.id] || p.label)}</button>
    `).join('');
  }

  function renderCategories() {
    const savedCount = Object.keys(saved).length;
    els.categories.innerHTML = data.categories.map((c) => `
      <button class="chip" data-category="${esc(c.id)}" aria-pressed="${c.id === state.category}">${esc(categoryLabel(c))}</button>
    `).join('') + `
      <button class="chip" data-category="saved" aria-pressed="${state.category === 'saved'}">${esc(t().categories.saved)}${savedCount ? `<span class="count">${savedCount}</span>` : ''}</button>`;

    const cat = data.categories.find((c) => c.id === state.category);
    els.subs.hidden = !cat?.subs;
    els.subs.innerHTML = cat?.subs ? cat.subs.map((s) => `
      <button class="chip" data-sub="${esc(s.id)}" aria-pressed="${s.id === state.sub}">${esc(s.label)}</button>
    `).join('') : '';
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
        <span class="stars"><span class="s">★</span>${fmtNumber(r.stars)}</span>
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
    els.empty.textContent = state.category === 'saved' && !q ? t().emptySaved : t().emptyFilter;

    if (state.category === 'saved') {
      els.hint.textContent = t().hintSaved(items.length);
    } else {
      const period = data.periods.find((p) => p.id === state.period);
      els.hint.textContent = t().hintPeriod(fmtDate(period.since), items.length, all.length);
    }
  }

  function render() {
    renderStatic();
    renderPeriods();
    renderCategories();
    renderList();
    writeHash();
  }

  els.locales.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-locale]');
    if (!btn || btn.dataset.locale === locale) return;
    locale = btn.dataset.locale;
    persistLocale();
    if (data) render(); else renderStatic();
  });

  els.periods.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-period]');
    if (!btn) return;
    state.period = btn.dataset.period;
    if (state.category === 'saved') state.category = 'all';
    render();
  });

  els.categories.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-category]');
    if (!btn) return;
    state.category = btn.dataset.category;
    const cat = data.categories.find((c) => c.id === state.category);
    state.sub = cat?.subs ? (state.sub && cat.subs.some((s) => s.id === state.sub) ? state.sub : cat.subs[0].id) : null;
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
