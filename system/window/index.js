/**
 * App window floating di work area (#nxhome / #nx-home-scroll).
 * Bukan Electron BrowserWindow — lihat README.md.
 */
export const WINDOW_STORE = 'nx-window';
export const WINDOW_EL_CLASS = 'nx-app-window';
export const MIN_W = 320;
export const MIN_H = 200;

/** @type {HTMLElement|null} */
let activeWindowEl = null;
/** @type {string|null} */
let activeAppId = null;
/** Geom normal terakhir per elemen jendela (multi-window). */
const savedGeomByEl = new WeakMap();
/**
 * State visual sebelum minimize — 'normal' | 'maximized'.
 * Tanpa ini, restore dari maximize+minimize selalu jatuh ke normal (tampil “flat”).
 */
const restoreTargetByEl = new WeakMap();
/** Z-index stack fokus */
let windowZTop = 20;

let dragAbort = null;

/** @type {Map<string, { left: number, top: number, width: number, height: number, state?: string }>} */
const geomCache = new Map();

const OPENING_CLASS = 'nx-app-opening';

function openingHost() {
  return document.getElementById('nx-home-scroll')
    || document.getElementById('nxhome');
}

function escapeAppIdSelector(id) {
  return String(id || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * @param {ParentNode|null|undefined} root
 * @returns {HTMLElement[]}
 */
export function listAppWindows(root) {
  const scope = root
    || document.getElementById('nxhome')
    || document;
  return [...scope.querySelectorAll('.' + WINDOW_EL_CLASS)];
}

/**
 * @param {string} id
 * @param {ParentNode|null|undefined} root
 * @returns {HTMLElement|null}
 */
export function findAppWindow(id, root) {
  const appId = String(id || '').trim();
  if (!appId) return null;
  // Bandingkan dataset (bukan querySelector) — aman untuk id apa pun.
  const wins = listAppWindows(root);
  const hit = wins.find((w) => String(w.dataset.app || '') === appId);
  if (hit) return hit;
  if (root) return null;
  // Fallback: scan seluruh dokumen (mount non-#nxhome).
  return listAppWindows(document).find((w) => String(w.dataset.app || '') === appId) || null;
}

/**
 * Pastikan jendela terlihat (override sisa animasi / CSS minimize).
 * @param {HTMLElement} el
 */
function showAppWindowChrome(el) {
  el.classList.remove(
    'nx-app-window--minimized',
    'nx-app-window--enter',
    'nx-app-window--entered',
    'nx-app-window--no-motion',
  );
  el.dataset.enterPlayed = '1';
  el.style.visibility = 'visible';
  el.style.opacity = '1';
  el.style.pointerEvents = 'auto';
  el.style.display = 'flex';
  const body = el.querySelector('.nx-app-window__body');
  if (body) body.style.removeProperty('display');
}

/**
 * Baca target restore setelah minimize (dataset / WeakMap / default normal).
 * @param {HTMLElement} el
 * @returns {'normal'|'maximized'}
 */
function peekRestoreTarget(el) {
  const raw = el.dataset.restoreTo || restoreTargetByEl.get(el) || 'normal';
  return raw === 'maximized' ? 'maximized' : 'normal';
}

/**
 * @param {HTMLElement} el
 * @param {'normal'|'maximized'} target
 */
function rememberRestoreTarget(el, target) {
  const t = target === 'maximized' ? 'maximized' : 'normal';
  el.dataset.restoreTo = t;
  restoreTargetByEl.set(el, t);
}

/**
 * @param {HTMLElement} el
 */
function clearRestoreTarget(el) {
  delete el.dataset.restoreTo;
  restoreTargetByEl.delete(el);
}

/**
 * Terapkan layout maximized penuh work area (sync).
 * @param {HTMLElement} el
 */
function applyMaximizedLayout(el) {
  const mount = workHost();
  if (mount) ensureWorkAreaHost(mount);
  showAppWindowChrome(el);
  el.dataset.state = 'maximized';
  el.classList.add('nx-app-window--maximized');
  const b = workAreaSize();
  applyGeom(el, { left: 0, top: 0, width: b.width, height: b.height });
  syncWindowChromeButtons(el, 'maximized');
  bringAppWindowToFront(el);
  setLauncherAutoHidden(true);
}

/**
 * Terapkan layout normal + geom tersimpan.
 * @param {HTMLElement} el
 */
function applyNormalLayout(el) {
  showAppWindowChrome(el);
  el.dataset.state = 'normal';
  el.classList.remove('nx-app-window--maximized');
  const g = savedGeomByEl.get(el) || readGeom(el);
  const usable =
    g
    && Number.isFinite(g.width)
    && g.width >= MIN_W
    && Number.isFinite(g.height)
    && g.height >= Math.max(MIN_H / 2, 120);
  applyGeom(el, usable ? g : defaultGeometry());
  savedGeomByEl.set(el, readGeom(el));
  syncWindowChromeButtons(el, 'normal');
  bringAppWindowToFront(el);
  scheduleLauncherAutoHide(el);
}

/**
 * Pulihkan jendela yang diminimize / tersembunyi — paksa terlihat + fokus.
 * Jika sebelumnya maximized, kembali ke maximize penuh (bukan normal “flat”).
 * Dipakai History FM, klik launcher, dll. (jangan andalkan class saja).
 * @param {HTMLElement} el
 * @returns {HTMLElement|null}
 */
export function restoreAppWindow(el) {
  if (!el || !el.classList.contains(WINDOW_EL_CLASS)) return null;

  const target = peekRestoreTarget(el);
  clearRestoreTarget(el);

  if (target === 'maximized') {
    applyMaximizedLayout(el);
  } else {
    applyNormalLayout(el);
  }

  syncLauncherWindowBadge();
  return el;
}

/**
 * Fokus + naikkan z-index (multi-window).
 * @param {HTMLElement} el
 */
export function bringAppWindowToFront(el) {
  if (!el || !el.classList.contains(WINDOW_EL_CLASS)) return;
  windowZTop += 1;
  el.style.zIndex = String(windowZTop);
  activeWindowEl = el;
  activeAppId = el.dataset.app || null;
  listAppWindows().forEach((w) => {
    w.classList.toggle('is-focused', w === el);
  });
  syncLauncherWindowBadge();
  scheduleLauncherAutoHide(el);
}

/** Sembunyikan flash konten penuh sebelum wrap (survive clear #nxhome). */
export function markAppWindowOpening() {
  const host = openingHost();
  if (host) host.classList.add(OPENING_CLASS);
}

export function clearAppWindowOpening() {
  const host = openingHost();
  if (host) host.classList.remove(OPENING_CLASS);
}

/** Animasi masuk ringan (sekali per instance chrome). */
function playWindowEnter(el) {
  if (!el || el.dataset.enterPlayed === '1') return;
  el.dataset.enterPlayed = '1';
  el.classList.add('nx-app-window--enter');
  void el.offsetWidth;
  requestAnimationFrame(() => {
    el.classList.add('nx-app-window--entered');
    const done = () => {
      el.classList.remove('nx-app-window--enter', 'nx-app-window--entered');
      el.removeEventListener('transitionend', done);
    };
    el.addEventListener('transitionend', done);
    setTimeout(done, 280);
  });
}

function windowStore() {
  if (typeof window === 'undefined' || typeof window.DistroBuckets !== 'function') {
    throw new Error('windowStore: DistroBuckets belum siap');
  }
  return window.DistroBuckets(WINDOW_STORE);
}

function workHost() {
  return document.getElementById('nxhome')
    || document.getElementById('nx-home-scroll')
    || document.querySelector('.nx-page__body');
}

function workAreaEl() {
  return workHost();
}

/** Viewport height helper (NXUI.Window atau window.innerHeight). */
function viewportH() {
  try {
    if (window.NXUI?.Window?.height) return window.NXUI.Window.height();
  } catch (_) { /* ignore */ }
  return window.innerHeight || 700;
}

/**
 * Pastikan #nx-home-scroll + #nxhome punya tinggi px nyata.
 * Tanpa ini, height:100% + overflow:hidden bisa clip window ke 0px.
 */
function ensureWorkAreaHost(mount) {
  const scroll = document.getElementById('nx-home-scroll');
  if (scroll) {
    const top = scroll.getBoundingClientRect().top;
    const need = Math.max(MIN_H, Math.floor(viewportH() - top));
    if ((scroll.clientHeight || 0) < MIN_H) {
      scroll.style.height = `${need}px`;
    }
  }

  const host = mount && mount.nodeType === 1
    ? mount
    : document.getElementById('nxhome');
  if (!host) return;

  host.classList.add('nx-work-area');
  host.style.position = 'relative';
  host.style.boxSizing = 'border-box';
  host.style.width = '100%';
  host.style.overflow = 'hidden';

  const h = (scroll && scroll.clientHeight)
    || Math.max(MIN_H, Math.floor(viewportH() * 0.7));
  host.style.height = `${h}px`;
  host.style.minHeight = `${h}px`;
}

/** Ukuran work area (koordinat lokal host). Fallback agar window tidak 0×0. */
function workAreaSize() {
  const home = document.getElementById('nxhome');
  const scroll = document.getElementById('nx-home-scroll');
  let width = (home && home.clientWidth) || 0;
  let height = (home && home.clientHeight) || 0;
  if (width < MIN_W && scroll) width = scroll.clientWidth || 0;
  if (height < MIN_H && scroll) height = scroll.clientHeight || 0;
  if (width < MIN_W) {
    width = Math.max(MIN_W, Math.floor((window.innerWidth || 900) * 0.7));
  }
  if (height < MIN_H) {
    height = Math.max(MIN_H, Math.floor(viewportH() * 0.65));
  }
  return { width, height };
}

/** CSS kritis kalau import workspace.css belum memuat style window. */
function ensureWindowStyles() {
  if (typeof document === 'undefined') return;
  const css = `
#nxhome.nx-work-area{position:relative;overflow:hidden;box-sizing:border-box;width:100%}
#nx-home-scroll.nx-app-opening #nxhome>:not(.nx-app-window),
#nxhome.nx-app-opening>:not(.nx-app-window){opacity:0!important;pointer-events:none!important}
.nx-app-window{position:absolute;z-index:10;display:flex;flex-direction:column;
  min-width:320px;min-height:200px;box-sizing:border-box;background:#f6f5f4;color:#241f31;
  border:1px solid rgba(0,0,0,.18);border-radius:8px;
  box-shadow:0 8px 28px rgba(0,0,0,.28);overflow:hidden;will-change:opacity,transform}
.nx-app-window--enter{opacity:0;transform:translateY(12px) scale(.985);transition:none}
.nx-app-window--entered{opacity:1;transform:none;transition:opacity .2s ease,transform .22s cubic-bezier(.22,1,.36,1)}
.nx-app-window--no-motion{transition:none!important}
.nx-app-window__header{flex:0 0 auto;display:flex;align-items:center;gap:8px;height:36px;
  padding:0 6px 0 12px;background:linear-gradient(to bottom,#faf9f8,#ebe9e6);
  border-bottom:1px solid rgba(0,0,0,.1);cursor:grab;user-select:none;position:relative;z-index:3}
.nx-app-window__title{flex:1;font-size:13px;font-weight:600;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.nx-app-window__controls{display:flex;gap:2px}
.nx-app-window__btn{width:28px;height:24px;border:0;border-radius:4px;background:transparent;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:inherit}
.nx-app-window__btn [class*="icon-ic_fluent_"]{font-size:16px;line-height:1;color:inherit}
.nx-app-window__btn--close:hover{background:#e95420;color:#fff}
.nx-app-window__body{flex:1 1 auto;min-height:0;overflow:auto;padding:0;position:relative;z-index:3}
.nx-app-window__resize{position:absolute;z-index:20}
.nx-app-window__resize--n,.nx-app-window__resize--s{left:8px;right:8px;height:6px;cursor:ns-resize}
.nx-app-window__resize--n{top:0}.nx-app-window__resize--s{bottom:0}
.nx-app-window__resize--e,.nx-app-window__resize--w{top:8px;bottom:8px;width:6px;cursor:ew-resize}
.nx-app-window__resize--e{right:0}.nx-app-window__resize--w{left:0}
.nx-app-window__resize--ne,.nx-app-window__resize--nw,.nx-app-window__resize--se,.nx-app-window__resize--sw{width:10px;height:10px}
.nx-app-window__resize--ne{top:0;right:0;cursor:nesw-resize}
.nx-app-window__resize--nw{top:0;left:0;cursor:nwse-resize}
.nx-app-window__resize--se{bottom:0;right:0;cursor:nwse-resize}
.nx-app-window__resize--sw{bottom:0;left:0;cursor:nesw-resize}
.nx-app-window--minimized{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
.nx-app-window--minimized .nx-app-window__body,.nx-app-window--minimized .nx-app-window__resize{display:none!important}
.nx-app-window--maximized{border-radius:0;box-shadow:none}
.nx-app-window--maximized .nx-app-window__resize{display:none!important}
#nx-launcher-host.is-auto-hidden{opacity:0!important;visibility:hidden!important;pointer-events:none!important}
`;
  let s = document.getElementById('nx-app-window-critical-css');
  if (!s) {
    s = document.createElement('style');
    s.id = 'nx-app-window-critical-css';
    document.head.appendChild(s);
  }
  s.textContent = css;
}

/**
 * Parse id package dari route distro ATAU package.
 * Launcher href:  #distro/package/settings/index
 * Setelah resolve: distro/Development/package/settings/index
 * Nested:          package/settings/wallpaper
 * @returns {{ pkgId: string, via?: string }|null}
 */
export function parsePackageAppRoute(route) {
  const r = String(route || '').replace(/^#\/?/, '').replace(/^\/+/, '').trim();
  if (!r) return null;

  // distro/{distroId}/package/{pkg}/…
  let m = r.match(/^distro\/[^/]+\/package\/([^/]+)/);
  if (m) return { pkgId: m[1], via: 'distroId' };

  // distro/package/{pkg}/… (shorthand launcher)
  m = r.match(/^distro\/package\/([^/]+)/);
  if (m) return { pkgId: m[1], via: 'distro' };

  // package/{pkg}/…
  m = r.match(/^package\/([^/]+)/);
  if (m) return { pkgId: m[1], via: 'package' };

  return null;
}

/** Id launcher yang TIDAK dibungkus app window (klik shortcut → halaman penuh). */
export const APP_WINDOW_EXCLUDED_IDS = new Set(['home']);

/**
 * @param {string} id launcher id / componenName
 * @returns {boolean}
 */
export function isAppWindowExcludedId(id) {
  return APP_WINDOW_EXCLUDED_IDS.has(String(id || '').trim().toLowerCase());
}

/** Route home distro (bukan package) — tanpa bingkai. */
export function isHomeWorkRoute(route) {
  const r = String(route || '').replace(/^#\/?/, '').replace(/^\/+/, '').trim();
  if (!r) return false;
  if (/^distro\/home(?:\/|$)/.test(r)) return true;
  // distro/{extId}/home — hasil resolveDistroShorthand
  if (/^distro\/[^/]+\/home(?:\/|$)/.test(r) && !r.includes('/package/')) return true;
  return false;
}

/**
 * Geometry relatif work area (bukan viewport).
 */
function defaultGeometry() {
  const b = workAreaSize();
  const width = Math.max(MIN_W, Math.floor(b.width * 0.82));
  const height = Math.max(MIN_H, Math.floor(b.height * 0.82));
  const left = Math.max(0, Math.floor((b.width - width) / 2));
  const top = Math.max(0, Math.floor((b.height - height) / 2));
  return { left, top, width, height };
}

function clampGeom(g) {
  const b = workAreaSize();
  let { left, top, width, height } = g;
  width = Math.max(MIN_W, Math.min(width, b.width));
  height = Math.max(MIN_H, Math.min(height, b.height));
  left = Math.max(0, Math.min(left, Math.max(0, b.width - width)));
  top = Math.max(0, Math.min(top, Math.max(0, b.height - height)));
  return { left, top, width, height };
}

function applyGeom(el, g) {
  const c = clampGeom(g);
  el.style.left = `${c.left}px`;
  el.style.top = `${c.top}px`;
  el.style.width = `${c.width}px`;
  el.style.height = `${c.height}px`;
  return c;
}

function readGeom(el) {
  return {
    left: parseFloat(el.style.left) || 0,
    top: parseFloat(el.style.top) || 0,
    width: parseFloat(el.style.width) || el.offsetWidth,
    height: parseFloat(el.style.height) || el.offsetHeight,
  };
}

/** Posisi dock aktif (class host / dock / overlay marker). */
function launcherLayoutEdge() {
  if (typeof document === 'undefined') return null;
  const host = document.getElementById('nx-launcher-host');
  if (host) {
    for (const pos of ['left', 'right', 'top', 'bottom']) {
      if (host.classList.contains(`nx-launcher-host--${pos}`)) return pos;
    }
  }
  const dock = document.getElementById('nx-launcher-dock')
    || document.querySelector('.nx-launcher--dock');
  if (dock) {
    for (const pos of ['left', 'right', 'top', 'bottom']) {
      if (dock.classList.contains(`nx-launcher--${pos}`)) return pos;
    }
  }
  const page = host && host.closest ? host.closest('.nx-page') : null;
  if (page) {
    for (const pos of ['left', 'right', 'top', 'bottom']) {
      if (page.classList.contains(`nx-launcher-overlay-${pos}`)) return pos;
    }
  }
  return null;
}

/**
 * Overlay: hide/show visual saja (tanpa reflow layout).
 * @param {boolean} hidden
 */
export function setLauncherAutoHidden(hidden) {
  if (typeof document === 'undefined') return;
  const host = document.getElementById('nx-launcher-host');
  if (!host) return;
  const next = !!hidden;
  if (host.classList.contains('is-auto-hidden') === next) return;

  host.classList.toggle('is-auto-hidden', next);
  host.setAttribute('aria-hidden', next ? 'true' : 'false');

  if (next) {
    host.style.setProperty('opacity', '0', 'important');
    host.style.setProperty('visibility', 'hidden', 'important');
    host.style.setProperty('pointer-events', 'none', 'important');
  } else {
    host.style.removeProperty('opacity');
    host.style.removeProperty('visibility');
    host.style.removeProperty('pointer-events');
  }
}

/**
 * Zona “dekat dock”: strip penuh di tepi work area (bukan cuma bbox ikon
 * yang pendek di tengah layar — itu menyebabkan jendela overlap kiri
 * tapi miss host max-content → launcher tetap di atas window).
 * @returns {{ left: number, top: number, right: number, bottom: number }|null}
 */
function dockNearZoneRect() {
  const host = document.getElementById('nx-launcher-host');
  if (!host) return null;
  const edge = launcherLayoutEdge() || 'left';
  const home = document.getElementById('nxhome')
    || host.closest('#nx-home-scroll')
    || host.closest('.nx-page__body')
    || host.parentElement;
  if (!home) return null;

  const pr = home.getBoundingClientRect();
  const hr = host.getBoundingClientRect();
  const pad = 16;
  const thickX = Math.max(hr.width > 4 ? hr.width : 0, 56) + pad;
  const thickY = Math.max(hr.height > 4 ? hr.height : 0, 56) + pad;

  if (edge === 'left') {
    return { left: pr.left, top: pr.top, right: pr.left + thickX, bottom: pr.bottom };
  }
  if (edge === 'right') {
    return { left: pr.right - thickX, top: pr.top, right: pr.right, bottom: pr.bottom };
  }
  if (edge === 'top') {
    return { left: pr.left, top: pr.top, right: pr.right, bottom: pr.top + thickY };
  }
  if (edge === 'bottom') {
    return { left: pr.left, top: pr.bottom - thickY, right: pr.right, bottom: pr.bottom };
  }
  return null;
}

/**
 * Sembunyikan Launcher jika ADA jendela overlap / dekat area dock.
 * @param {HTMLElement} [winEl] — diabaikan; cek semua jendela visible
 */
function updateLauncherAutoHideForWindow(winEl) {
  void winEl;
  const host = document.getElementById('nx-launcher-host');
  if (!host) {
    setLauncherAutoHidden(false);
    return;
  }
  const wins = listAppWindows().filter((w) => w.dataset.state !== 'minimized');
  if (!wins.length) {
    setLauncherAutoHidden(false);
    return;
  }
  if (wins.some((w) => w.dataset.state === 'maximized')) {
    setLauncherAutoHidden(true);
    return;
  }

  const zone = dockNearZoneRect();
  let near = false;
  for (const win of wins) {
    const wr = win.getBoundingClientRect();
    if (zone) {
      near = !(
        wr.right < zone.left
        || wr.left > zone.right
        || wr.bottom < zone.top
        || wr.top > zone.bottom
      );
    } else {
      const hr = host.getBoundingClientRect();
      const pad = 12;
      near = !(
        wr.right < hr.left - pad
        || wr.left > hr.right + pad
        || wr.bottom < hr.top - pad
        || wr.top > hr.bottom + pad
      );
    }
    if (near) break;
  }
  setLauncherAutoHidden(near);
}

/** Panggil setelah layout window stabil (buka / restore geom). */
function scheduleLauncherAutoHide(winEl) {
  const el = winEl || activeWindowEl;
  if (!el) return;
  updateLauncherAutoHideForWindow(el);
  requestAnimationFrame(() => updateLauncherAutoHideForWindow(el));
}

async function loadWindowGeom(appId) {
  const key = String(appId);
  if (geomCache.has(key)) return { ...geomCache.get(key) };
  try {
    const row = await windowStore().get(key);
    if (!row || typeof row !== 'object') return null;
    if (typeof row.left !== 'number') return null;
    const g = {
      left: row.left,
      top: row.top,
      width: row.width,
      height: row.height,
      state: row.state || 'normal',
    };
    geomCache.set(key, g);
    return { ...g };
  } catch (_) {
    return null;
  }
}

async function saveWindowGeom(appId, geom, state = 'normal') {
  const key = String(appId);
  const row = {
    id: key,
    ...geom,
    state,
    updatedAt: new Date().toISOString(),
  };
  geomCache.set(key, {
    left: geom.left,
    top: geom.top,
    width: geom.width,
    height: geom.height,
    state,
  });
  try {
    await windowStore().set(row);
  } catch (err) {
    console.warn('[window] gagal simpan geometry:', err);
  }
}

function ensureDragResizeHandlers() {
  if (typeof document === 'undefined') return;
  // Selalu re-bind agar revisi auto-hide tidak tertahan di handler lama
  if (dragAbort) {
    try { dragAbort.abort(); } catch (_) { /* ignore */ }
  }
  dragAbort = new AbortController();
  const { signal } = dragAbort;

  let mode = null;
  let startX = 0;
  let startY = 0;
  let startG = null;

  document.addEventListener('pointerdown', (e) => {
    const win = e.target.closest && e.target.closest('.' + WINDOW_EL_CLASS);
    if (!win || win.dataset.state === 'maximized') return;
    // Strip minimize: jangan drag — klik title/Minimize = restore
    if (win.dataset.state === 'minimized') return;
    if (e.target.closest && e.target.closest('[data-nx-app]')) return;

    const handle = e.target.closest && e.target.closest('[data-nx-resize]');
    const header = e.target.closest && e.target.closest('.nx-app-window__header');

    if (handle) {
      mode = handle.getAttribute('data-nx-resize');
    } else if (
      header
      && !e.target.closest('.nx-app-window__controls')
      && !e.target.closest('.nx-app-window__body')
    ) {
      mode = 'drag';
    } else {
      return;
    }

    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    startG = readGeom(win);
    activeWindowEl = win;
    win.classList.add('is-dragging');
    try {
      win.setPointerCapture(e.pointerId);
    } catch (_) { /* ignore */ }
  }, { signal });

  document.addEventListener('pointermove', (e) => {
    if (!mode || !activeWindowEl || !startG) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3 && !activeWindowEl.classList.contains('is-resizing')) {
      return;
    }
    activeWindowEl.classList.add('is-resizing');
    let g = { ...startG };

    if (mode === 'drag') {
      g.left = startG.left + dx;
      g.top = startG.top + dy;
    } else {
      if (mode.includes('e')) g.width = startG.width + dx;
      if (mode.includes('s')) g.height = startG.height + dy;
      if (mode.includes('w')) {
        g.left = startG.left + dx;
        g.width = startG.width - dx;
      }
      if (mode.includes('n')) {
        g.top = startG.top + dy;
        g.height = startG.height - dy;
      }
    }
    // Clamp di work area penuh; Launcher overlay hide/show visual saja
    applyGeom(activeWindowEl, g);
    updateLauncherAutoHideForWindow(activeWindowEl);
  }, { signal });

  document.addEventListener('pointerup', () => {
    if (activeWindowEl) {
      activeWindowEl.classList.remove('is-dragging', 'is-resizing');
    }
    if (!mode || !activeWindowEl) {
      mode = null;
      return;
    }
    const id = activeWindowEl.dataset.app;
    if (id && activeWindowEl.dataset.state === 'normal') {
      const clamped = applyGeom(activeWindowEl, readGeom(activeWindowEl));
      savedGeomByEl.set(activeWindowEl, clamped);
      void saveWindowGeom(id, clamped, 'normal');
    }
    updateLauncherAutoHideForWindow(activeWindowEl);
    mode = null;
    startG = null;
  }, { signal });
}

function fluentIcon(name, size = 16) {
  return `<i class="icon-ic_fluent_${name}_${size}_regular" aria-hidden="true"></i>`;
}

function buildWindowChrome(title) {
  const handles = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw']
    .map((d) => `<div class="nx-app-window__resize nx-app-window__resize--${d}" data-nx-resize="${d}"></div>`)
    .join('');
  return (
    `<header class="nx-app-window__header">` +
    `<span class="nx-app-window__title"></span>` +
    `<div class="nx-app-window__controls">` +
    `<button type="button" class="nx-app-window__btn" data-nx-app="minimize" aria-label="Minimize" title="Minimize">${fluentIcon('subtract', 16)}</button>` +
    `<button type="button" class="nx-app-window__btn" data-nx-app="maximize" aria-label="Maximize" title="Maximize">${fluentIcon('maximize', 16)}</button>` +
    `<button type="button" class="nx-app-window__btn nx-app-window__btn--close" data-nx-app="close" aria-label="Close" title="Close">${fluentIcon('dismiss', 16)}</button>` +
    `</div></header>` +
    `<div class="nx-app-window__body nx-scroll"></div>` +
    handles
  );
}

function bindWindowControls(el) {
  ensureWindowControlDelegation();
  ensureWindowFocusDelegation();
  void el;
}

let focusDelegated = false;
function ensureWindowFocusDelegation() {
  if (focusDelegated || typeof document === 'undefined') return;
  focusDelegated = true;
  document.addEventListener('pointerdown', (e) => {
    const win = e.target && e.target.closest && e.target.closest('.' + WINDOW_EL_CLASS);
    if (!win || win.dataset.state === 'minimized') return;
    if (activeWindowEl !== win) bringAppWindowToFront(win);
  }, true);
}

let controlsDelegated = false;
function ensureWindowControlDelegation() {
  if (controlsDelegated || typeof document === 'undefined') return;
  controlsDelegated = true;
  document.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest && e.target.closest('[data-nx-app]');
    if (!btn) return;
    const win = btn.closest('.' + WINDOW_EL_CLASS);
    if (!win) return;
    e.stopPropagation();
    e.preventDefault();
    bringAppWindowToFront(win);
    const action = btn.getAttribute('data-nx-app');
    if (action === 'minimize') {
      void setAppWindowState('minimized', win);
    } else if (action === 'maximize') {
      const cur = win.dataset.state || 'normal';
      void setAppWindowState(cur === 'maximized' ? 'normal' : 'maximized', win);
    } else if (action === 'close') {
      closeAppWindow();
    }
  }, true);
}

/**
 * Buka / reuse app window di mount (#nxhome).
 * @param {{ id: string, title?: string, mount?: HTMLElement, animate?: boolean, reuse?: boolean }} opts
 */
export async function openAppWindow(opts = {}) {
  ensureWindowStyles();
  ensureDragResizeHandlers();
  ensureWindowFocusDelegation();
  const id = String(opts.id || 'app').trim() || 'app';
  const title = String(opts.title || id);
  const animate = opts.animate === true;
  const reuse = opts.reuse !== false;
  const mount = opts.mount
    || document.getElementById('nxhome')
    || workAreaEl();
  if (!mount) {
    throw new Error('openAppWindow: mount / #nxhome tidak ada');
  }

  ensureWorkAreaHost(mount);

  // Multi-window: cari by data-app — jangan hapus jendela app lain
  let el = findAppWindow(id, mount);
  let isNew = false;

  if (el && !reuse) {
    el.remove();
    el = null;
  }

  if (!el) {
    [...mount.children].forEach((ch) => {
      if (!ch.classList || !ch.classList.contains(WINDOW_EL_CLASS)) ch.remove();
    });
    el = document.createElement('div');
    el.className = WINDOW_EL_CLASS;
    el.dataset.app = id;
    el.dataset.state = 'normal';
    el.innerHTML = buildWindowChrome(title);
    mount.appendChild(el);
    bindWindowControls(el);
    isNew = true;
  }

  el.dataset.app = id;
  const titleEl = el.querySelector('.nx-app-window__title');
  if (titleEl) titleEl.textContent = title;

  // Geom dari cache dulu (tanpa menunggu IDB)
  let geom = defaultGeometry();
  let state = 'normal';
  const cached = geomCache.get(id);
  if (
    cached
    && Number.isFinite(cached.left)
    && Number.isFinite(cached.width)
    && cached.width >= MIN_W
    && cached.height >= Math.max(MIN_H, 280)
  ) {
    geom = {
      left: cached.left,
      top: cached.top,
      width: cached.width,
      height: cached.height,
    };
    state = cached.state === 'maximized' ? 'maximized' : 'normal';
  } else if (isNew) {
    const stack = Math.max(0, listAppWindows(mount).length - 1);
    if (stack > 0) {
      const b = workAreaSize();
      geom.left = Math.min(geom.left + stack * 28, Math.max(0, b.width - geom.width));
      geom.top = Math.min(geom.top + stack * 28, Math.max(0, b.height - geom.height));
    }
  }

  savedGeomByEl.set(el, { ...geom });
  el.classList.add('nx-app-window--no-motion');
  if (isNew || el.dataset.state !== 'minimized') {
    applyGeom(el, geom);
  }
  bringAppWindowToFront(el);

  void loadWindowGeom(id).then((saved) => {
    if (!el.isConnected) return;
    if (!(
      saved
      && Number.isFinite(saved.left)
      && Number.isFinite(saved.top)
      && Number.isFinite(saved.width)
      && Number.isFinite(saved.height)
      && saved.width >= MIN_W
      && saved.height >= Math.max(MIN_H, 280)
    )) {
      if (saved) geomCache.delete(id);
      scheduleLauncherAutoHide(el);
      return;
    }
    const nextState = saved.state === 'maximized' ? 'maximized' : 'normal';
    const cur = readGeom(el);
    const dx = Math.abs(cur.left - saved.left) + Math.abs(cur.top - saved.top)
      + Math.abs(cur.width - saved.width) + Math.abs(cur.height - saved.height);
    if (dx < 4 && el.dataset.state === nextState) {
      scheduleLauncherAutoHide(el);
      return;
    }

    savedGeomByEl.set(el, {
      left: saved.left,
      top: saved.top,
      width: saved.width,
      height: saved.height,
    });
    if (nextState === 'maximized') {
      void setAppWindowState('maximized', el);
    } else if (el.dataset.state !== 'minimized') {
      el.dataset.state = 'normal';
      applyGeom(el, savedGeomByEl.get(el));
      scheduleLauncherAutoHide(el);
    }
  });

  if (state === 'maximized') {
    await setAppWindowState('maximized', el);
  } else if (el.dataset.state === 'minimized') {
    // Hormati data-restore-to / restoreTarget (bisa kembali ke maximized).
    restoreAppWindow(el);
    const persistId = el.dataset.app || id;
    if (persistId) {
      const g = savedGeomByEl.get(el) || readGeom(el);
      void saveWindowGeom(persistId, g, el.dataset.state || 'normal');
    }
  } else {
    el.dataset.state = 'normal';
    el.classList.remove('nx-app-window--maximized', 'nx-app-window--minimized');
    syncLauncherWindowBadge();
  }

  requestAnimationFrame(() => {
    el.classList.remove('nx-app-window--no-motion');
    syncLauncherWindowBadge();
  });

  if (animate && isNew) playWindowEnter(el);
  clearAppWindowOpening();

  try {
    if (typeof window.applyWindowThemePrefs === 'function') {
      if (typeof window.loadWindowThemePrefs === 'function') {
        void window.loadWindowThemePrefs().then((saved) => {
          const native = window.NATIVE_WINDOW_THEME_DEFAULTS || { theme: 'adwaita' };
          const merged = typeof window.mergeWindowThemePrefs === 'function'
            ? window.mergeWindowThemePrefs(native, saved)
            : { ...native, ...(saved || {}) };
          window.applyWindowThemePrefs(merged, { root: mount });
        });
      } else {
        window.applyWindowThemePrefs(window.NATIVE_WINDOW_THEME_DEFAULTS || { theme: 'adwaita' }, { root: mount });
      }
    }
  } catch (_) { /* ignore */ }

  return {
    el,
    body: el.querySelector('.nx-app-window__body'),
    header: el.querySelector('.nx-app-window__header'),
  };
}

/**
 * Titik indikator di tile launcher: semua jendela terbuka / diminimize.
 */
export function syncLauncherWindowBadge() {
  if (typeof document === 'undefined') return;
  const byId = new Map();
  listAppWindows().forEach((w) => {
    const id = String(w.dataset.app || '');
    if (id) byId.set(id, String(w.dataset.state || 'normal'));
  });
  document.querySelectorAll('.nx-launcher__item[data-launcher-id]').forEach((item) => {
    const id = String(item.getAttribute('data-launcher-id') || '');
    const state = byId.get(id);
    item.classList.toggle('is-window-open', !!(state && state !== 'minimized'));
    item.classList.toggle('is-window-minimized', state === 'minimized');
  });
}

function syncWindowChromeButtons(el, state) {
  const minBtn = el.querySelector('[data-nx-app="minimize"]');
  if (minBtn) {
    minBtn.title = 'Minimize';
    minBtn.setAttribute('aria-label', 'Minimize');
  }
  const maxBtn = el.querySelector('[data-nx-app="maximize"]');
  if (maxBtn) {
    maxBtn.innerHTML = state === 'maximized'
      ? fluentIcon('square_multiple', 16)
      : fluentIcon('maximize', 16);
    maxBtn.title = state === 'maximized' ? 'Restore' : 'Maximize';
    maxBtn.setAttribute('aria-label', maxBtn.title);
    maxBtn.disabled = false;
    maxBtn.style.opacity = '';
  }
}

/**
 * @param {'normal'|'maximized'|'minimized'} state
 * @param {HTMLElement} [targetEl] jendela spesifik (multi-window — jangan andalkan active saja)
 */
export async function setAppWindowState(state, targetEl) {
  const el = (targetEl && targetEl.classList?.contains?.(WINDOW_EL_CLASS))
    ? targetEl
    : (activeWindowEl || document.querySelector('.' + WINDOW_EL_CLASS));
  if (!el) return null;
  const next = ['normal', 'maximized', 'minimized'].includes(state) ? state : 'normal';
  const prev = el.dataset.state || 'normal';

  // Simpan geom normal sebelum tinggalkan normal (max / min).
  if (prev === 'normal' && next !== 'normal') {
    savedGeomByEl.set(el, readGeom(el));
  }
  // Maximize tanpa geom normal tersimpan (langsung max saat buka) — fallback.
  if (prev === 'maximized' && next === 'minimized' && !savedGeomByEl.get(el)) {
    savedGeomByEl.set(el, defaultGeometry());
  }

  let applied = next;

  if (next === 'minimized') {
    const restoreTo = prev === 'maximized' ? 'maximized' : 'normal';
    rememberRestoreTarget(el, restoreTo);
    el.dataset.state = 'minimized';
    el.classList.remove('nx-app-window--maximized');
    el.classList.add('nx-app-window--minimized');
    // Geom tetap ukuran normal tersimpan (jendela sudah hidden) — siap un-maximize.
    const g = savedGeomByEl.get(el);
    if (g) applyGeom(el, g);
    syncWindowChromeButtons(el, 'minimized');
    scheduleLauncherAutoHide(el);
    applied = 'minimized';
  } else if (next === 'maximized') {
    clearRestoreTarget(el);
    applyMaximizedLayout(el);
    applied = 'maximized';
  } else {
    // next === 'normal'
    if (prev === 'minimized') {
      // Dari minimize: hormati restoreTo (bisa kembali ke maximized).
      restoreAppWindow(el);
      applied = el.dataset.state || 'normal';
    } else {
      // Un-maximize dari tombol chrome — sengaja ke normal, buang restoreTo.
      clearRestoreTarget(el);
      applyNormalLayout(el);
      applied = 'normal';
    }
  }

  syncLauncherWindowBadge();

  const id = el.dataset.app || activeAppId;
  if (id) {
    const g = applied === 'normal'
      ? readGeom(el)
      : (savedGeomByEl.get(el) || readGeom(el));
    // minimized → persist target restore (maximized|normal), bukan literal 'minimized'.
    const saveState =
      applied === 'minimized'
        ? (el.dataset.restoreTo === 'maximized' ? 'maximized' : 'normal')
        : applied;
    await saveWindowGeom(id, g, saveState);
  }
  return applied;
}

/**
 * Tutup app window → navigasi home (bukan tutup Electron).
 */
export function closeAppWindow() {
  const el = activeWindowEl || document.querySelector('.' + WINDOW_EL_CLASS);
  if (el) el.remove();

  const rest = listAppWindows();
  if (rest.length) {
    const next = rest[rest.length - 1];
    bringAppWindowToFront(next);
  } else {
    activeWindowEl = null;
    activeAppId = null;
    setLauncherAutoHidden(false);
    syncLauncherWindowBadge();
    if (typeof window.nexaRoute?.navigate === 'function') {
      window.nexaRoute.navigate('distro/home');
      return;
    }
    if (typeof location !== 'undefined') {
      location.hash = '#distro/home';
    }
  }
}

/**
 * @returns {HTMLElement|null}
 */
export function getAppWindowBody() {
  const el = activeWindowEl || document.querySelector('.' + WINDOW_EL_CLASS);
  return el ? el.querySelector('.nx-app-window__body') : null;
}

export function getActiveAppWindow() {
  return activeWindowEl || document.querySelector('.' + WINDOW_EL_CLASS);
}

/**
 * Bungkus isi #nxhome yang sudah di-render ke dalam .nx-app-window.
 * Legacy helper — alur utama pakai nxPrepareAppWindowContainer (sebelum handler).
 * @param {{ id?: string, title?: string }} [opts]
 */
export async function wrapNxhomeInAppWindow(opts = {}) {
  const mount = document.getElementById('nxhome');
  if (!mount) return null;

  const id = String(opts.id || 'app').trim() || 'app';
  const title = String(opts.title || id);

  const existing = mount.querySelector('.' + WINDOW_EL_CLASS);
  if (existing && existing.dataset.app === id) {
    activeWindowEl = existing;
    activeAppId = id;
    const titleEl = existing.querySelector('.nx-app-window__title');
    if (titleEl && title) titleEl.textContent = title;
    return {
      el: existing,
      body: existing.querySelector('.nx-app-window__body'),
      header: existing.querySelector('.nx-app-window__header'),
    };
  }

  if (existing) {
    const body = existing.querySelector('.nx-app-window__body');
    if (body) {
      while (body.firstChild) mount.insertBefore(body.firstChild, existing);
    }
    existing.remove();
  }

  if (!mount.childNodes.length) return null;

  const frag = document.createDocumentFragment();
  while (mount.firstChild) frag.appendChild(mount.firstChild);

  const win = await openAppWindow({ id, title, mount, animate: true });
  if (win.body) win.body.appendChild(frag);
  clearAppWindowOpening();
  return win;
}

function titleFromRouteMeta(meta, fallbackId) {
  if (meta && typeof meta.title === 'string' && meta.title.trim()) {
    return meta.title.split('|')[0].trim() || fallbackId;
  }
  if (!fallbackId) return 'App';
  return fallbackId.charAt(0).toUpperCase() + fallbackId.slice(1);
}

/**
 * Dipanggil dari NexaRoute.navigate SEBELUM clear target.
 * Siapkan bingkai di #nxhome (reuse), return .nx-app-window__body sebagai
 * target render — clear hanya body, bingkai tidak dihancurkan (anti-kedip).
 *
 * @param {{
 *   route: string,
 *   container: HTMLElement,
 *   isNestedPackageFill?: boolean,
 * }} ctx
 * @returns {Promise<{ container: HTMLElement }|null>}
 */
export async function prepareAppWindowContainer(ctx = {}) {
  const route = String(ctx.route || '').replace(/^#\/?/, '').replace(/^\/+/, '');
  const container = ctx.container;
  if (!container || ctx.isNestedPackageFill) return null;
  if (container.id === 'nxpackage') return null;

  // Home → biarkan NexaRoute clear #nxhome penuh (tanpa bingkai)
  if (isHomeWorkRoute(route)) {
    clearAppWindowOpening();
    if (container.id === 'nxhome') {
      listAppWindows(container).forEach((w) => w.remove());
    }
    activeWindowEl = null;
    activeAppId = null;
    syncLauncherWindowBadge();
    return null;
  }

  const parsed = parsePackageAppRoute(route);
  if (!parsed || isAppWindowExcludedId(parsed.pkgId)) return null;

  if (container.id && container.id !== 'nxhome') return null;
  if (!container.id && container !== document.getElementById('nxhome')) return null;

  let meta = null;
  try {
    meta = window.nexaRoute?.routeMetaByRoute?.get?.(`package/${parsed.pkgId}`)
      || window.nexaRoute?.routeMetaByRoute?.get?.(`distro/package/${parsed.pkgId}`)
      || window.nexaRoute?.routeMetaByRoute?.get?.(`distro/package/${parsed.pkgId}/index`)
      || window.nexaRoute?.routeMetaByRoute?.get?.(route)
      || null;
  } catch (_) { /* ignore */ }

  const win = await openAppWindow({
    id: parsed.pkgId,
    title: titleFromRouteMeta(meta, parsed.pkgId),
    mount: container,
    animate: false,
    reuse: true,
  });
  if (!win || !win.body) return null;

  // Buang sisa konten non-window (home lama) — jendela app lain tetap
  [...container.children].forEach((ch) => {
    if (ch.classList && ch.classList.contains(WINDOW_EL_CLASS)) return;
    ch.remove();
  });

  return { container: win.body };
}

/**
 * Daftarkan hook ke alur NexaRoute (bukan listener paralel / wrap setelah load).
 */
export function attachAutoAppWindow() {
  if (typeof window === 'undefined') return;
  window.nxPrepareAppWindowContainer = prepareAppWindowContainer;

  if (typeof window.__nxAutoAppWindowHandler === 'function') {
    window.removeEventListener('nxui:routeChange', window.__nxAutoAppWindowHandler);
  }
  window.__nxAutoAppWindowHandler = (e) => {
    const route = (e && e.detail && e.detail.route) || '';
    if (!isHomeWorkRoute(route)) return;
    clearAppWindowOpening();
    activeWindowEl = null;
    activeAppId = null;
    syncLauncherWindowBadge();
  };
  window.addEventListener('nxui:routeChange', window.__nxAutoAppWindowHandler);

  // Klik ulang tile launcher saat jendela app sudah ada:
  // - minimized → restore saja (jangan navigasi ulang — cegah #nxpackage kosong)
  // - normal/maximized → abaikan navigasi, fokuskan jendela
  if (typeof window.__nxAutoAppWindowLauncherClick === 'function') {
    window.removeEventListener('click', window.__nxAutoAppWindowLauncherClick, true);
  }
  window.__nxAutoAppWindowLauncherClick = (e) => {
    if (e.button != null && e.button !== 0) return;
    const item = e.target && e.target.closest && e.target.closest('a.nx-launcher__item');
    if (!item || !item.closest('.nx-launcher')) return;
    if (item.classList.contains('nx-launcher__item--renaming')) return;
    if (e.target.closest && e.target.closest('.nx-launcher__rename')) return;

    const id = String(item.getAttribute('data-launcher-id') || '').trim();
    if (!id || isAppWindowExcludedId(id)) return;

    const el = findAppWindow(id);
    if (!(el && el.isConnected)) return;

    const state = el.dataset.state || 'normal';
    if (state === 'minimized') {
      e.preventDefault();
      e.stopPropagation();
      // Hormati restoreTo (maximized vs normal) — jangan paksa normal.
      restoreAppWindow(el);
      const id = el.dataset.app;
      if (id) {
        const g = savedGeomByEl.get(el) || readGeom(el);
        void saveWindowGeom(id, g, el.dataset.state || 'normal');
      }
      return;
    }

    // Sudah terbuka — fokus saja, jangan re-navigate
    e.preventDefault();
    e.stopPropagation();
    bringAppWindowToFront(el);
  };
  window.addEventListener('click', window.__nxAutoAppWindowLauncherClick, true);

  // Sinyal legacy pointerdown (minimize restore sudah di-handle click di atas)
  if (typeof window.__nxAutoAppWindowLauncherHandler === 'function') {
    window.removeEventListener('nx-launcher:open', window.__nxAutoAppWindowLauncherHandler);
  }
  window.__nxAutoAppWindowLauncherHandler = null;

  window.__nxAutoAppWindowBound = true;
}
