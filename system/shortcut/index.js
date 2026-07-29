// Shortcut distro — kumpulkan metadata tiap componen dari
// package/manifest.json + package/{nama}/package.json menjadi SATU array
// yang bisa diakses global di lingkungan distro ini (via system/index.js →
// window.getDistroShortcuts / window.loadDistroShortcuts).
//
// Logic murni di sini; TIDAK assign ke window. Registrasi di
// system/index.js (pola sama directory/buckets/ssh).

let _cache = null;
let _loadPromise = null;

async function readJsonRel(relPath) {
  if (!window.NxDirectory?.readFile) {
    throw new Error('loadDistroShortcuts: window.NxDirectory belum siap');
  }
  const { content } = await window.NxDirectory.readFile(relPath);
  return JSON.parse(content);
}

/**
 * Satu item shortcut dari package.json componen.
 * @param {string} componenName nama folder di package/
 * @param {object|null} meta isi package.json (boleh null)
 */
function toShortcutItem(componenName, meta) {
  const id = (meta && typeof meta.id === 'string' && meta.id.trim())
    || componenName;
  return {
    id,
    componenName,
    title: (meta && typeof meta.title === 'string' && meta.title.trim())
      || componenName,
    description: (meta && typeof meta.description === 'string')
      ? meta.description
      : '',
    version: meta?.version || null,
    author: meta?.author || null,
    brend: meta?.brend || null,
    endpoint: meta?.endpoint || null,
    // Route shorthand ke halaman entry componen (selalu .../index)
    href: `#distro/package/${componenName}/index`,
    meta: meta || null,
  };
}

/**
 * Baca manifest + tiap package.json → array shortcut.
 * @param {{ force?: boolean }} [opts] force=true abaikan cache
 * @returns {Promise<Array<object>>}
 */
export async function loadDistroShortcuts(opts = {}) {
  const force = !!opts.force;
  if (!force && _cache) return _cache;
  if (!force && _loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    let names = [];
    try {
      const manifest = await readJsonRel('package/manifest.json');
      names = Array.isArray(manifest?.componen) ? manifest.componen : [];
    } catch (err) {
      console.warn('[shortcut] gagal baca package/manifest.json:', err?.message || err);
      names = [];
    }

    const items = [];
    for (const rawName of names) {
      const componenName = String(rawName || '').trim();
      if (!componenName) continue;
      let meta = null;
      try {
        meta = await readJsonRel(`package/${componenName}/package.json`);
      } catch (err) {
        // Toleran: componen tanpa package.json tetap masuk daftar (fallback nama folder)
        console.warn(
          `[shortcut] package/${componenName}/package.json tidak terbaca:`,
          err?.message || err,
        );
      }
      items.push(toShortcutItem(componenName, meta));
    }

    _cache = items;
    if (typeof window !== 'undefined') {
      window.DistroShortcuts = items;
    }
    return items;
  })();

  try {
    return await _loadPromise;
  } finally {
    _loadPromise = null;
  }
}

/**
 * Ambil array shortcut (cache). Kalau belum pernah di-load, load dulu.
 * @returns {Promise<Array<object>>}
 */
export async function getDistroShortcuts() {
  if (_cache) return _cache;
  return loadDistroShortcuts();
}

/** Buang cache — panggil lagi loadDistroShortcuts({ force: true }) atau getDistroShortcuts setelah ini. */
export function clearDistroShortcutsCache() {
  _cache = null;
  _loadPromise = null;
  if (typeof window !== 'undefined') {
    window.DistroShortcuts = [];
  }
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Icon path dari brend — string langsung ATAU { icon, ico }.
 * @param {string|{icon?:string,ico?:string}|null|undefined} brend
 * @returns {string|null}
 */
function resolveBrendIcon(brend) {
  if (!brend) return null;
  if (typeof brend === 'string') {
    const path = brend.trim();
    return path || null;
  }
  if (typeof brend === 'object') {
    const path = brend.icon || brend.ico;
    return typeof path === 'string' && path.trim() ? path.trim() : null;
  }
  return null;
}

/**
 * Item ekstra di luar manifest (opts.add).
 * brend boleh string path ATAU objek { ico, icon }.
 * @param {object} raw
 */
function normalizeAddItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || raw.componenName || '').trim();
  if (!id) return null;

  let brend = raw.brend || null;
  if (typeof brend === 'string') {
    const path = brend.trim();
    brend = path ? { icon: path, ico: path } : null;
  }

  return {
    id,
    componenName: raw.componenName || id,
    title: (typeof raw.title === 'string' && raw.title.trim()) ? raw.title.trim() : id,
    description: typeof raw.description === 'string' ? raw.description : '',
    version: raw.version || null,
    author: raw.author || null,
    brend,
    endpoint: raw.endpoint || null,
    href: raw.href || `#distro/package/${id}/index`,
    meta: raw,
    _added: true,
  };
}

/**
 * Susun daftar launcher dari shortcut manifest + opsi filter/tambahan.
 *
 * @param {object[]} fromManifest hasil getDistroShortcuts()
 * @param {{
 *   disabled?: string[],
 *   add?: object[],
 * }} [opts]
 *   - disabled: id/componenName yang DISEMBUNYIKAN dari launcher
 *     (tidak ditampilkan). Tanpa `disabled` → semua dari manifest tampil.
 *   - add: item ekstra di luar manifest (boleh punya href custom).
 *     id "home" selalu di urutan pertama launcher.
 * @returns {object[]}
 */
export function resolveLauncherShortcuts(fromManifest, opts = {}) {
  const base = Array.isArray(fromManifest) ? fromManifest : [];
  let list = base.slice();

  // disabled = daftar yang TIDAK ditampilkan
  if (Array.isArray(opts.disabled) && opts.disabled.length) {
    const hide = new Set(
      opts.disabled.map((k) => String(k || '').trim()).filter(Boolean),
    );
    list = list.filter((s) => !hide.has(s.id) && !hide.has(s.componenName));
  }

  if (Array.isArray(opts.add) && opts.add.length) {
    const homes = [];
    const rest = [];
    for (const raw of opts.add) {
      const item = normalizeAddItem(raw);
      if (!item) continue;
      // id "home" → selalu urutan pertama di launcher
      if (item.id === 'home' || item.componenName === 'home') {
        homes.push(item);
      } else {
        rest.push(item);
      }
    }
    list = [...homes, ...list, ...rest];
  }

  return list;
}

/** Nama store DistroBuckets untuk layout launcher (lihat system/buckets/). */
export const LAUNCHER_STORE = 'nx-launcher';

/** Row khusus di store yang sama — prefs UI (bukan item shortcut). */
export const LAUNCHER_PREFS_ID = '__prefs__';

/**
 * Default native (hardcode di NXHOME). User override lewat
 * package/settings/launcher.js → saveLauncherPrefs.
 */
export const NATIVE_LAUNCHER_DEFAULTS = {
  disabled: ['directory'],
  settings: {
    position: 'left',
    iconSize: '35px',
    /** auto = baca kecerahan wallpaper; light/dark = paksa */
    labelStyle: 'auto',
  },
};

function launcherStore() {
  if (typeof window === 'undefined' || typeof window.DistroBuckets !== 'function') {
    throw new Error('launcherStore: window.DistroBuckets belum siap (init DistroBuckets dulu)');
  }
  return window.DistroBuckets(LAUNCHER_STORE);
}

function isLauncherPrefsRow(row) {
  return row && String(row.id) === LAUNCHER_PREFS_ID;
}

/**
 * Baca prefs launcher user (null = belum pernah diset → pakai native).
 * @returns {Promise<{ disabled?: string[], settings?: object }|null>}
 */
export async function loadLauncherPrefs() {
  try {
    const row = await launcherStore().get(LAUNCHER_PREFS_ID);
    if (!row || typeof row !== 'object') return null;
    return {
      disabled: Array.isArray(row.disabled)
        ? row.disabled.map((k) => String(k || '').trim()).filter(Boolean)
        : undefined,
      settings: row.settings && typeof row.settings === 'object'
        ? { ...row.settings }
        : undefined,
    };
  } catch (_) {
    return null;
  }
}

/**
 * Simpan prefs dari form settings. Lalu panggil refreshShortcutLauncher().
 * @param {{ disabled?: string[], settings?: { position?: string, iconSize?: string } }} prefs
 */
export async function saveLauncherPrefs(prefs = {}) {
  const disabled = Array.isArray(prefs.disabled)
    ? prefs.disabled.map((k) => String(k || '').trim()).filter(Boolean)
    : [];
  const normalized = normalizeLauncherSettings(prefs.settings);
  const position = normalized.position || NATIVE_LAUNCHER_DEFAULTS.settings.position;
  const iconSize = normalized.iconSize || NATIVE_LAUNCHER_DEFAULTS.settings.iconSize;
  const labelStyle = normalized.labelStyle || NATIVE_LAUNCHER_DEFAULTS.settings.labelStyle;
  const row = {
    id: LAUNCHER_PREFS_ID,
    disabled,
    settings: { position, iconSize, labelStyle },
    updatedAt: new Date().toISOString(),
  };
  await launcherStore().set(row);
  return row;
}

/**
 * Gabungkan opts native (NXHOME) dengan prefs user di bucket.
 * Prefs menang kalau sudah ada; mount/add tetap dari nativeOpts.
 */
export function mergeLauncherOpts(nativeOpts = {}, prefs = null) {
  const native = nativeOpts && typeof nativeOpts === 'object' ? nativeOpts : {};
  const baseDisabled = Array.isArray(native.disabled)
    ? native.disabled.slice()
    : NATIVE_LAUNCHER_DEFAULTS.disabled.slice();
  const baseSettings = {
    ...NATIVE_LAUNCHER_DEFAULTS.settings,
    ...(native.settings && typeof native.settings === 'object' ? native.settings : {}),
  };
  if (!prefs) {
    return {
      ...native,
      disabled: baseDisabled,
      settings: baseSettings,
    };
  }
  return {
    ...native,
    disabled: Array.isArray(prefs.disabled) ? prefs.disabled.slice() : baseDisabled,
    settings: {
      ...baseSettings,
      ...(prefs.settings && typeof prefs.settings === 'object' ? prefs.settings : {}),
    },
  };
}

function stampLauncherRow(item, position) {
  return {
    ...item,
    id: item.id,
    position: typeof position === 'number' ? position : (item.position ?? 0),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Baca layout launcher dari DistroBuckets, urut `position`.
 * @returns {Promise<object[]>}
 */
export async function loadLauncherShortcuts() {
  const rows = await launcherStore().getAll();
  return (rows || [])
    .filter((r) => !isLauncherPrefsRow(r))
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

/**
 * Timpa seluruh layout launcher di bucket (sumber UI rename/reorder).
 * Prefs `__prefs__` dipertahankan.
 * @param {object[]} items
 * @returns {Promise<object[]>} items tersimpan (dengan position)
 */
export async function saveLauncherShortcuts(items) {
  const store = launcherStore();
  const prev = await store.getAll();
  const prefsRow = (prev || []).find(isLauncherPrefsRow) || null;
  for (const row of prev || []) {
    if (isLauncherPrefsRow(row)) continue;
    await store.delete(row.id);
  }
  const stamped = (Array.isArray(items) ? items : []).map((item, i) =>
    stampLauncherRow(item, i),
  );
  for (const row of stamped) {
    if (isLauncherPrefsRow(row)) continue;
    await store.set(row);
  }
  if (prefsRow) {
    await store.set(prefsRow);
  }
  return stamped;
}

/**
 * Gabungkan catalog (manifest + opts) dengan layout tersimpan di bucket.
 * - Bucket kosong → seed dari catalog, simpan, return.
 * - Bucket ada → pertahankan urutan + override title/brend/href user;
 *   item catalog baru ditambah di akhir; item manifest yang hilang dibuang
 *   (kecuali `_added`).
 *
 * @param {{ disabled?: string[], add?: object[] }} [opts]
 * @returns {Promise<object[]>}
 */
export async function syncLauncherShortcuts(opts = {}) {
  const fromManifest = await getDistroShortcuts();
  const catalog = resolveLauncherShortcuts(fromManifest, opts);
  const saved = await loadLauncherShortcuts();

  if (!saved.length) {
    return saveLauncherShortcuts(catalog);
  }

  const catalogMap = new Map(catalog.map((s) => [s.id, s]));
  const used = new Set();
  const merged = [];

  for (const row of saved) {
    const base = catalogMap.get(row.id);
    if (base) {
      merged.push({
        ...base,
        title: row.title || base.title,
        description: row.description ?? base.description,
        brend: row.brend ?? base.brend,
        href: row.href || base.href,
        _added: !!(row._added || base._added),
      });
      used.add(row.id);
    } else if (row._added) {
      // Custom add: tetap ada meski tidak di opts.add panggilan ini
      merged.push(row);
      used.add(row.id);
    }
    // else: dulu dari manifest, sekarang tidak ada di catalog → drop
  }

  for (const item of catalog) {
    if (!used.has(item.id)) merged.push(item);
  }

  return saveLauncherShortcuts(merged);
}

/**
 * Patch satu item di bucket (rename title, ganti brend/href, dll).
 * @param {string} id
 * @param {object} patch
 * @returns {Promise<object[]>} layout baru
 */
export async function updateLauncherShortcut(id, patch = {}) {
  const key = String(id || '').trim();
  if (!key) throw new Error('updateLauncherShortcut: id wajib');
  const list = await loadLauncherShortcuts();
  const next = list.map((row) => {
    if (row.id !== key) return row;
    const { id: _ignore, position: _pos, ...rest } = patch;
    return { ...row, ...rest, id: key };
  });
  return saveLauncherShortcuts(next);
}

/**
 * Pindah urutan launcher menurut daftar id.
 * Id yang tidak disebut tetap di akhir (urutan lama relatif).
 * @param {string[]} orderedIds
 * @returns {Promise<object[]>}
 */
export async function reorderLauncherShortcuts(orderedIds) {
  const list = await loadLauncherShortcuts();
  const map = new Map(list.map((r) => [r.id, r]));
  const next = [];
  for (const rawId of Array.isArray(orderedIds) ? orderedIds : []) {
    const id = String(rawId || '').trim();
    if (!id || !map.has(id)) continue;
    next.push(map.get(id));
    map.delete(id);
  }
  for (const row of map.values()) next.push(row);
  return saveLauncherShortcuts(next);
}

function launcherItemMarkup(s) {
  const id = String(s.id || s.componenName || '').trim();
  const title = escapeHtml(s.title || s.componenName);
  const desc = escapeHtml(s.description || '');
  const href = escapeHtml(s.href || '#');
  // id HTML untuk context-menu dinamis (system/contextmenu/nxLauncherItem.js)
  const htmlId = id
    ? ` id="nxlauncher::${escapeHtml(encodeURIComponent(id))}"`
    : '';
  const dataId = id ? ` data-launcher-id="${escapeHtml(id)}"` : '';
  const iconPath = resolveBrendIcon(s.brend);
  const icon = iconPath
    ? `<img class="nx-launcher__icon" src="/templates${escapeHtml(iconPath)}" alt="" draggable="false" />`
    : `<span class="nx-launcher__icon nx-launcher__icon--fallback" aria-hidden="true">${title.slice(0, 1)}</span>`;
  return (
    `<a class="nx-launcher__item"${htmlId}${dataId} href="${href}" title="${desc || title}" draggable="true">` +
    `${icon}<span class="nx-launcher__title">${title}</span>` +
    `</a>`
  );
}

/** Id elemen dock di dalam host halaman (bukan body / title bar). */
export const LAUNCHER_DOCK_ID = 'nx-launcher-dock';
/** Id host default di templates/distro/Development/index.js */
export const LAUNCHER_HOST_ID = 'nx-launcher-host';

/**
 * Normalisasi opts.settings.
 * position: top|left|right|bottom (alias battom→bottom). Ada position = mode dock.
 * iconSize / iconSze: ukuran ikon (default 40px).
 */
export function normalizeLauncherSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  let position = String(s.position || '').toLowerCase().trim();
  if (position === 'battom') position = 'bottom';
  if (!['top', 'left', 'right', 'bottom'].includes(position)) position = '';
  const iconSize = String(s.iconSize || s.iconSze || '40px').trim() || '40px';
  let labelStyle = String(s.labelStyle || NATIVE_LAUNCHER_DEFAULTS.settings.labelStyle || 'auto')
    .toLowerCase()
    .trim();
  if (!['auto', 'light', 'dark'].includes(labelStyle)) labelStyle = 'auto';
  return {
    position,
    iconSize,
    labelStyle,
    dock: position !== '',
  };
}

/**
 * Relative luminance 0–1 dari warna CSS (#hex / rgb()).
 * @param {string} color
 */
function colorLuminance(color) {
  const c = String(color || '').trim();
  let r = 0;
  let g = 0;
  let b = 0;
  const hex = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else {
    const rgb = c.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (rgb) {
      r = Number(rgb[1]);
      g = Number(rgb[2]);
      b = Number(rgb[3]);
    } else {
      return 0.35;
    }
  }
  const toLin = (v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

/**
 * Tentukan light|dark dari wallpaper (prefs color / computed / image).
 * @returns {Promise<'light'|'dark'>}
 */
async function resolveLabelToneFromWallpaper() {
  let color = '';
  try {
    if (typeof window.loadWallpaperPrefs === 'function') {
      const wp = await window.loadWallpaperPrefs();
      if (wp && wp.color) color = String(wp.color);
    }
  } catch (_) { /* ignore */ }

  const el = typeof document !== 'undefined' ? document.getElementById('nx-wallpaper') : null;
  if (el) {
    const cs = getComputedStyle(el);
    if (!color) color = cs.backgroundColor || '';
    const bgImg = cs.backgroundImage || '';
    if (bgImg && bgImg !== 'none') {
      const lum = color ? colorLuminance(color) : 0.25;
      return lum > 0.72 ? 'dark' : 'light';
    }
  }
  return colorLuminance(color || '#2c2c2c') > 0.55 ? 'dark' : 'light';
}

/**
 * Terapkan class kontras label di dock yang sedang aktif.
 * @param {ReturnType<typeof normalizeLauncherSettings>} [settings]
 */
export async function applyLauncherLabelContrast(settings) {
  const nav = document.getElementById(LAUNCHER_DOCK_ID)
    || document.querySelector('.nx-launcher--dock');
  if (!nav) return null;
  const s = settings || normalizeLauncherSettings(
    (lastLauncherRenderOpts && lastLauncherRenderOpts.settings) || {},
  );
  let tone = s.labelStyle === 'dark' ? 'dark' : 'light';
  if (s.labelStyle === 'auto') {
    tone = await resolveLabelToneFromWallpaper();
  }
  nav.classList.remove(
    'nx-launcher--label-auto',
    'nx-launcher--label-light',
    'nx-launcher--label-dark',
    'nx-launcher--label-tone-light',
    'nx-launcher--label-tone-dark',
  );
  nav.classList.add(`nx-launcher--label-${s.labelStyle || 'auto'}`);
  nav.classList.add(`nx-launcher--label-tone-${tone}`);
  nav.dataset.labelStyle = s.labelStyle || 'auto';
  nav.dataset.labelTone = tone;
  return tone;
}

function launcherNavMarkup(itemsHtml, settings) {
  const size = escapeHtml(settings.iconSize || '40px');
  const labelStyle = escapeHtml(settings.labelStyle || 'auto');
  if (settings.dock) {
    const pos = escapeHtml(settings.position);
    return (
      `<nav id="${LAUNCHER_DOCK_ID}" class="nx-launcher nx-launcher--dock nx-launcher--${pos} nx-launcher--label-${labelStyle} nx-scroll"` +
      ` style="--nx-launcher-icon-size:${size}"` +
      ` data-position="${pos}" data-label-style="${labelStyle}"` +
      ` aria-label="Shortcut launcher">${itemsHtml}</nav>`
    );
  }
  return (
    `<nav class="nx-launcher"` +
    ` style="--nx-launcher-icon-size:${size}"` +
    ` data-position="inline"` +
    ` aria-label="Shortcut componen">${itemsHtml}</nav>`
  );
}

const LAUNCHER_LAYOUT_CLASSES = [
  'nx-launcher-layout-top',
  'nx-launcher-layout-bottom',
  'nx-launcher-layout-left',
  'nx-launcher-layout-right',
];

/** Legacy pad class — dibersihkan agar tidak dobel dengan layout flex. */
const LAUNCHER_PAD_CLASSES = [
  'nx-launcher-pad-top',
  'nx-launcher-pad-bottom',
  'nx-launcher-pad-left',
  'nx-launcher-pad-right',
];

function clearLauncherDockPad() {
  const root = document.documentElement;
  const main = document.getElementById('main');
  root.classList.remove(...LAUNCHER_LAYOUT_CLASSES, ...LAUNCHER_PAD_CLASSES);
  root.style.removeProperty('--nx-launcher-dock-inset');
  if (main) {
    main.classList.remove(...LAUNCHER_LAYOUT_CLASSES, ...LAUNCHER_PAD_CLASSES);
    main.style.removeProperty('--nx-launcher-dock-inset');
  }
  document.querySelectorAll('.nx-page').forEach((page) => {
    page.classList.remove(...LAUNCHER_LAYOUT_CLASSES, ...LAUNCHER_PAD_CLASSES);
    page.style.removeProperty('--nx-launcher-dock-inset');
  });
}

/**
 * Cadangan ruang konten lewat flex layout di .nx-page
 * (dock + body), bukan overlay absolute + padding perkiraan.
 */
function applyLauncherDockPad(settings, hostEl) {
  clearLauncherDockPad();
  if (!settings || !settings.dock) return;
  const page = (hostEl && hostEl.closest && hostEl.closest('.nx-page'))
    || document.querySelector('.nx-page');
  if (!page) return;
  const pos = settings.position || 'left';
  page.classList.add(`nx-launcher-layout-${pos}`);

  // Ukuran nyata dock → var (opsional), work area ikut flex otomatis
  requestAnimationFrame(() => {
    try {
      const dock = hostEl && hostEl.querySelector
        ? hostEl.querySelector('.nx-launcher--dock')
        : null;
      const el = dock || hostEl;
      if (!el || !page) return;
      const rect = el.getBoundingClientRect();
      const inset = (pos === 'left' || pos === 'right')
        ? `${Math.ceil(rect.width)}px`
        : `${Math.ceil(rect.height)}px`;
      page.style.setProperty('--nx-launcher-dock-inset', inset);
    } catch (_) { /* ignore */ }
    try {
      window.dispatchEvent(new Event('resize'));
    } catch (_) { /* ignore */ }
  });
}

function resolveLauncherMount(opts = {}) {
  const raw = opts.mount;
  if (raw) {
    if (typeof raw === 'string') return document.querySelector(raw);
    if (raw.nodeType === 1) return raw;
  }
  return document.getElementById(LAUNCHER_HOST_ID);
}

/**
 * Pasang dock ke host di dalam halaman index (bukan body / title bar).
 * Host ikut flex di tepi .nx-page (layout-left|right|top|bottom) —
 * area kerja (.nx-page__body) mengisi sisa ruang sampai batas Launcher.
 * @param {string} html
 * @param {ReturnType<typeof normalizeLauncherSettings>} settings
 * @param {Element} mountEl #nx-launcher-host
 */
function mountLauncherDock(html, settings, mountEl) {
  if (!mountEl) return null;
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  const next = wrap.firstElementChild;
  if (!next) return null;

  // Hapus dock lama di body (sisa mode fixed window) kalau ada.
  const stale = document.getElementById(LAUNCHER_DOCK_ID);
  if (stale && stale.parentElement !== mountEl) stale.remove();

  const pos = settings.position || 'top';
  mountEl.classList.remove(
    'nx-launcher-host--top',
    'nx-launcher-host--bottom',
    'nx-launcher-host--left',
    'nx-launcher-host--right',
  );
  mountEl.classList.add('nx-launcher-host', `nx-launcher-host--${pos}`);
  mountEl.replaceChildren(next);
  applyLauncherDockPad(settings, mountEl);
  return next;
}

/** Opts terakhir renderShortcutLauncher — dipakai refresh setelah rename. */
let lastLauncherRenderOpts = {};
let lastLauncherMountEl = null;

let launcherDragBound = false;
let launcherDragEl = null;
let launcherDragMoved = false;
let launcherSuppressClick = false;
let launcherOpenEmitBound = false;

function launcherIsVerticalDock(nav) {
  return !!(nav && (
    nav.classList.contains('nx-launcher--left')
    || nav.classList.contains('nx-launcher--right')
  ));
}

/**
 * Drag-and-drop urutan tile launcher (sekali, document-level).
 * Persist lewat reorderLauncherShortcuts setelah dragend.
 */
export function attachLauncherDragReorder() {
  if (launcherDragBound || typeof document === 'undefined') return;
  launcherDragBound = true;

  document.addEventListener('dragstart', (e) => {
    const item = e.target && e.target.closest && e.target.closest('.nx-launcher__item');
    if (!item || !item.closest('.nx-launcher')) return;
    if (item.classList.contains('nx-launcher__item--renaming')) {
      e.preventDefault();
      return;
    }
    if (e.target.closest && e.target.closest('.nx-launcher__rename')) {
      e.preventDefault();
      return;
    }
    launcherDragEl = item;
    launcherDragMoved = false;
    item.classList.add('nx-launcher__item--dragging');
    try {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.dataset.launcherId || '');
    } catch {
      /* ignore */
    }
  }, true);

  document.addEventListener('dragover', (e) => {
    if (!launcherDragEl) return;
    const nav = launcherDragEl.closest('.nx-launcher');
    if (!nav) return;
    const over = e.target && e.target.closest && e.target.closest('.nx-launcher__item');
    if (!over || !nav.contains(over)) return;
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {
      /* ignore */
    }
    if (over === launcherDragEl) return;
    const rect = over.getBoundingClientRect();
    const before = launcherIsVerticalDock(nav)
      ? e.clientY < rect.top + rect.height / 2
      : e.clientX < rect.left + rect.width / 2;
    if (before) {
      if (over.previousElementSibling !== launcherDragEl) {
        nav.insertBefore(launcherDragEl, over);
        launcherDragMoved = true;
      }
    } else if (over.nextElementSibling !== launcherDragEl) {
      over.after(launcherDragEl);
      launcherDragMoved = true;
    }
  }, true);

  document.addEventListener('drop', (e) => {
    if (!launcherDragEl) return;
    e.preventDefault();
  }, true);

  document.addEventListener('dragend', async () => {
    if (!launcherDragEl) return;
    const nav = launcherDragEl.closest('.nx-launcher');
    launcherDragEl.classList.remove('nx-launcher__item--dragging');
    const moved = launcherDragMoved;
    launcherDragEl = null;
    if (moved) launcherSuppressClick = true;
    if (!moved || !nav) return;

    const ids = [...nav.querySelectorAll('.nx-launcher__item')]
      .map((el) => el.dataset.launcherId)
      .filter(Boolean);
    try {
      await reorderLauncherShortcuts(ids);
    } catch (err) {
      console.warn('[launcher] reorder gagal:', err);
      await refreshShortcutLauncher();
    }
  }, true);

  document.addEventListener('click', (e) => {
    if (!launcherSuppressClick) return;
    const item = e.target && e.target.closest && e.target.closest('.nx-launcher__item');
    if (!item) {
      launcherSuppressClick = false;
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    launcherSuppressClick = false;
  }, true);

  // Opsional: sinyal klik tile (pemakai lain). Window TIDAK listen di sini —
  // bingkai mengikuti alur NexaRoute.navigate → nxPrepareAppWindowContainer.
  if (!launcherOpenEmitBound) {
    launcherOpenEmitBound = true;
    document.addEventListener('pointerdown', (e) => {
      if (e.button != null && e.button !== 0) return;
      if (launcherSuppressClick) return;
      const item = e.target && e.target.closest && e.target.closest('a.nx-launcher__item');
      if (!item || !item.closest('.nx-launcher')) return;
      if (item.classList.contains('nx-launcher__item--renaming')) return;
      if (e.target.closest && e.target.closest('.nx-launcher__rename')) return;

      const href = item.getAttribute('href') || '';
      if (!href || href === '#') return;
      const route = href.startsWith('#')
        ? href.slice(1)
        : href.replace(/^\//, '');
      const id = item.getAttribute('data-launcher-id') || '';

      try {
        window.dispatchEvent(new CustomEvent('nx-launcher:open', {
          detail: {
            id,
            href,
            route,
            useAppWindow: String(id).trim().toLowerCase() !== 'home',
          },
        }));
      } catch (_) { /* ignore */ }
    }, true);
  }
}

/**
 * Sync + render launcher.
 *
 * Mode dock (settings.position): dipasang ke `opts.mount` / `#nx-launcher-host`
 * di dalam halaman index distro — flex di tepi `.nx-page` (bukan overlay).
 * JANGAN mount ke document.body / #nx-titlebar: itu layer kernel/shell,
 * di luar distro, dan mengganggu chrome aplikasi (title bar, window controls).
 * Return `''` (jangan embed string ke konten).
 *
 * Tanpa position → return markup inline.
 *
 * @param {{
 *   mount?: string|Element,
 *   disabled?: string[],
 *   settings?: {
 *     position?: 'top'|'left'|'right'|'bottom',
 *     iconSize?: string,
 *     iconSze?: string,
 *   },
 *   add?: Array<object>,
 * }} [opts]
 * @returns {Promise<string>}
 */
export async function renderShortcutLauncher(opts = {}) {
  const prefs = await loadLauncherPrefs();
  const merged = mergeLauncherOpts(opts && typeof opts === 'object' ? opts : {}, prefs);
  // mount / add dari pemanggil (NXHOME) selalu menang
  if (opts && opts.mount) merged.mount = opts.mount;
  if (opts && Array.isArray(opts.add)) merged.add = opts.add;
  lastLauncherRenderOpts = merged;
  attachLauncherDragReorder();
  const settings = normalizeLauncherSettings(lastLauncherRenderOpts.settings);
  const shortcuts = await syncLauncherShortcuts(lastLauncherRenderOpts);

  if (!shortcuts.length) {
    if (settings.dock) {
      const mountEl = resolveLauncherMount(lastLauncherRenderOpts);
      lastLauncherMountEl = mountEl;
      const empty = launcherNavMarkup(
        '<p class="nx-launcher__empty">Tidak ada item</p>',
        settings,
      );
      mountLauncherDock(empty, settings, mountEl);
      await applyLauncherLabelContrast(settings);
      return '';
    }
    return '<p class="nx-launcher__empty">Tidak ada item launcher (cek disabled / add / manifest / bucket)</p>';
  }

  const items = shortcuts.map(launcherItemMarkup).join('');
  const html = launcherNavMarkup(items, settings);

  if (settings.dock) {
    const mountEl = resolveLauncherMount(lastLauncherRenderOpts);
    lastLauncherMountEl = mountEl;
    if (!mountEl) {
      console.warn(
        '[launcher] mode dock butuh #nx-launcher-host di halaman index (atau opts.mount)',
      );
      return '';
    }
    mountLauncherDock(html, settings, mountEl);
    await applyLauncherLabelContrast(settings);
    return '';
  }

  // Mode inline: bersihkan dock host / sisa body
  const stale = document.getElementById(LAUNCHER_DOCK_ID);
  if (stale) stale.remove();
  clearLauncherDockPad();
  lastLauncherMountEl = null;
  return html;
}

/**
 * Refresh dock di host halaman, atau .nx-launcher inline.
 */
export async function refreshShortcutLauncher() {
  attachLauncherDragReorder();
  const settings = normalizeLauncherSettings(lastLauncherRenderOpts.settings);
  if (settings.dock) {
    if (lastLauncherMountEl && !document.contains(lastLauncherMountEl)) {
      lastLauncherMountEl = resolveLauncherMount(lastLauncherRenderOpts);
    }
    if (lastLauncherMountEl) {
      lastLauncherRenderOpts = { ...lastLauncherRenderOpts, mount: lastLauncherMountEl };
    }
    await renderShortcutLauncher(lastLauncherRenderOpts);
    return document.getElementById(LAUNCHER_DOCK_ID);
  }
  const nav = document.querySelector('.nx-launcher:not(.nx-launcher--dock)')
    || document.querySelector('.nx-launcher');
  if (!nav) return null;
  const html = await renderShortcutLauncher(lastLauncherRenderOpts);
  if (!html) return null;
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  const next = wrap.firstElementChild;
  if (!next) return null;
  nav.replaceWith(next);
  return next;
}
