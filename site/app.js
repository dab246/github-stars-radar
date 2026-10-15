(() => {
  const SAVED_KEY = 'gsr.saved';
  const LANG_COLORS = {
    TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Go: '#00ADD8', Rust: '#dea584',
    Java: '#b07219', Kotlin: '#A97BFF', Swift: '#F05138', Dart: '#00B4AB', 'C++': '#f34b7d', C: '#555555',
    'C#': '#178600', PHP: '#4F5D95', Ruby: '#701516', Zig: '#ec915c', Shell: '#89e051', HTML: '#e34c26',
    CSS: '#663399', Vue: '#41b883', Svelte: '#ff3e00', 'Jupyter Notebook': '#DA5B0B', Lua: '#000080',
    'Objective-C': '#438eff', Scala: '#c22d40', Elixir: '#6e4a7e', Haskell: '#5e5086', MDX: '#fcb32c',
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    periods: $('periods'), categories: $('categories'), subs: $('subs'), hint: $('hint'),
    q: $('q'), list: $('list'), empty: $('empty'), updated: $('updated'),
  };
  const nf = new Intl.NumberFormat('vi-VN');

  let data = null;
  let saved = loadSaved();
  const state = { period: 'week', category: 'all', sub: null, query: '' };

  function loadSaved() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVED_KEY) || '{}');
      return raw && typeof raw === 'object' ? raw : {};
    } catch { return {}; }
  }
  function persistSaved() {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(saved)); } catch { /* storage unavailable */ }
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // "claude-mem" -> "Claude Mem", keeps names that already have capitals as-is.
  function prettyName(full) {
    const name = full.split('/')[1] || full;
    if (/[A-Z]/.test(name)) return name.replace(/[-_]+/g, ' ');
    return name.split(/[-_.]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  }

  function ago(iso) {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days < 1) return 'hôm nay';
    if (days < 30) return `${days} ngày trước`;
    if (days < 365) return `${Math.floor(days / 30)} tháng trước`;
    return `${Math.floor(days / 365)} năm trước`;
  }

  const fmtDate = (iso) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

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

  function renderPeriods() {
    els.periods.innerHTML = data.periods.map((p) => `
      <button role="tab" data-period="${esc(p.id)}" aria-selected="${state.category !== 'saved' && p.id === state.period}">${esc(p.label)}</button>
    `).join('');
  }

  function renderCategories() {
    const savedCount = Object.keys(saved).length;
    els.categories.innerHTML = data.categories.map((c) => `
      <button class="chip" data-category="${esc(c.id)}" aria-pressed="${c.id === state.category}">${esc(c.label)}</button>
    `).join('') + `
      <button class="chip" data-category="saved" aria-pressed="${state.category === 'saved'}">Đã lưu${savedCount ? `<span class="count">${savedCount}</span>` : ''}</button>`;

    const cat = data.categories.find((c) => c.id === state.category);
    els.subs.hidden = !cat?.subs;
    els.subs.innerHTML = cat?.subs ? cat.subs.map((s) => `
      <button class="chip" data-sub="${esc(s.id)}" aria-pressed="${s.id === state.sub}">${esc(s.label)}</button>
    `).join('') : '';
  }

  function rowHtml(r, i) {
    const url = `https://github.com/${r.name}`;
    const isSaved = Boolean(saved[r.name]);
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
          <p>${esc(r.description) || '<em>Chưa có mô tả</em>'}</p>
          <div class="meta">
            ${lang}
            <span>⑂ ${nf.format(r.forks || 0)}</span>
            <span>Tạo ${ago(r.createdAt)}</span>
            ${(r.topics || []).slice(0, 3).map((t) => `<span>#${esc(t)}</span>`).join('')}
          </div>
        </div>
        <span class="stars"><span class="s">★</span>${nf.format(r.stars)}</span>
        <button class="save" data-save="${esc(r.name)}" aria-pressed="${isSaved}"
          aria-label="${isSaved ? 'Bỏ lưu' : 'Lưu'} ${esc(r.name)}" title="${isSaved ? 'Bỏ lưu' : 'Lưu lại'}">${isSaved ? '✓' : '+'}</button>
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
    els.empty.textContent = state.category === 'saved' && !q
      ? 'Chưa lưu repo nào. Bấm + ở một dòng để lưu lại.'
      : 'Không có repo nào khớp bộ lọc.';

    if (state.category === 'saved') {
      els.hint.textContent = `${items.length} repo đã lưu trên trình duyệt này`;
    } else {
      const period = data.periods.find((p) => p.id === state.period);
      els.hint.textContent = `Repo tạo từ ${fmtDate(period.since)} · ${items.length} kết quả${q ? ` / ${all.length}` : ''}`;
    }
  }

  function render() {
    renderPeriods();
    renderCategories();
    renderList();
    writeHash();
  }

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
    showSkeleton();
    try {
      const res = await fetch('data/repos.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      data = await res.json();
    } catch (err) {
      els.list.innerHTML = '';
      els.empty.hidden = false;
      els.empty.textContent = 'Không tải được dữ liệu. Thử tải lại trang.';
      return;
    }
    // Refresh saved snapshots with the latest numbers.
    for (const name of Object.keys(saved)) if (data.repos[name]) saved[name] = data.repos[name];
    persistSaved();

    els.updated.textContent = `Cập nhật: ${new Date(data.generatedAt).toLocaleString('vi-VN')}`;
    readHash();
    render();
  }

  init();
})();
