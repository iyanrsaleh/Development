/**
 * Wallpaper NXHOME — path/URL + fit / position / blur / opacity / color.
 * Prefs user: DistroBuckets("nx-wallpaper") row __prefs__.
 * Settings UI: package/settings/wallpaper.js.
 */

export const WALLPAPER_STORE = 'nx-wallpaper';
export const WALLPAPER_PREFS_ID = '__prefs__';
export const WALLPAPER_EL_ID = 'nx-wallpaper';
export const WALLPAPER_HOST_ID = 'nx-wallpaper-host';

export const NATIVE_WALLPAPER_DEFAULTS = {
  image: '',
  fit: 'cover',
  position: 'center',
  blur: 0,
  opacity: 1,
  color: '#2c2c2c',
  history: [],
};

export const WALLPAPER_HISTORY_MAX = 12;

const FIT_MAP = {
  cover: 'cover',
  contain: 'contain',
  fill: '100% 100%',
  none: 'auto',
};

/** @type {object|null} */
let lastWallpaperOpts = null;
/** @type {HTMLElement|null} */
let lastWallpaperMount = null;

function wallpaperStore() {
  if (typeof window === 'undefined' || typeof window.DistroBuckets !== 'function') {
    throw new Error('wallpaperStore: window.DistroBuckets belum siap (init DistroBuckets dulu)');
  }
  return window.DistroBuckets(WALLPAPER_STORE);
}

/**
 * Normalize & clamp prefs fields.
 * @param {object} [p]
 */
export function normalizeWallpaperPrefs(p = {}) {
  const src = p && typeof p === 'object' ? p : {};
  const fitRaw = String(src.fit || NATIVE_WALLPAPER_DEFAULTS.fit).toLowerCase().trim();
  const fit = Object.prototype.hasOwnProperty.call(FIT_MAP, fitRaw)
    ? fitRaw
    : NATIVE_WALLPAPER_DEFAULTS.fit;

  let blur = Number(src.blur);
  if (!Number.isFinite(blur)) blur = NATIVE_WALLPAPER_DEFAULTS.blur;
  blur = Math.max(0, Math.min(20, blur));

  let opacity = Number(src.opacity);
  if (!Number.isFinite(opacity)) opacity = NATIVE_WALLPAPER_DEFAULTS.opacity;
  opacity = Math.max(0.1, Math.min(1, opacity));

  let color = String(src.color || NATIVE_WALLPAPER_DEFAULTS.color).trim();
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color)
    && !/^(rgb|rgba|hsl|hsla)\(/i.test(color)
    && !/^[a-z]+$/i.test(color)) {
    color = NATIVE_WALLPAPER_DEFAULTS.color;
  }

  const position = String(src.position || NATIVE_WALLPAPER_DEFAULTS.position).trim()
    || NATIVE_WALLPAPER_DEFAULTS.position;
  const image = String(src.image ?? '').trim();
  const history = normalizeWallpaperHistory(src.history);

  return { image, fit, position, blur, opacity, color, history };
}

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
export function normalizeWallpaperHistory(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    const s = String(item || '').trim();
    if (!s || s.startsWith('data:') || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= WALLPAPER_HISTORY_MAX) break;
  }
  return out;
}

/**
 * Sisipkan path/URL ke depan history (unik, max WALLPAPER_HISTORY_MAX).
 * @param {string[]} history
 * @param {string} image
 */
export function pushWallpaperHistory(history, image) {
  const src = String(image || '').trim();
  const base = normalizeWallpaperHistory(history);
  if (!src || src.startsWith('data:')) return base;
  return normalizeWallpaperHistory([src, ...base.filter((h) => h !== src)]);
}

/**
 * Baca prefs wallpaper user (null = belum pernah diset).
 * @returns {Promise<object|null>}
 */
export async function loadWallpaperPrefs() {
  try {
    const row = await wallpaperStore().get(WALLPAPER_PREFS_ID);
    if (!row || typeof row !== 'object') return null;
    return normalizeWallpaperPrefs(row);
  } catch (_) {
    return null;
  }
}

/**
 * Simpan prefs dari form settings + update history path/URL.
 * @param {object} prefs
 */
export async function saveWallpaperPrefs(prefs = {}) {
  const existing = await loadWallpaperPrefs();
  const n = normalizeWallpaperPrefs(prefs);
  const prevHistory = (existing && existing.history) || n.history || [];
  const history = pushWallpaperHistory(
    Array.isArray(prefs.history) ? prefs.history : prevHistory,
    n.image,
  );
  const row = {
    id: WALLPAPER_PREFS_ID,
    image: n.image,
    fit: n.fit,
    position: n.position,
    blur: n.blur,
    opacity: n.opacity,
    color: n.color,
    history,
    updatedAt: new Date().toISOString(),
  };
  await wallpaperStore().set(row);
  return row;
}

/**
 * Gabungkan native + prefs user. Prefs menang untuk field yang ada.
 */
export function mergeWallpaperPrefs(nativeOpts = {}, prefs = null) {
  const native = normalizeWallpaperPrefs({
    ...NATIVE_WALLPAPER_DEFAULTS,
    ...(nativeOpts && typeof nativeOpts === 'object' ? nativeOpts : {}),
  });
  if (!prefs || typeof prefs !== 'object') return { ...native };
  return normalizeWallpaperPrefs({ ...native, ...prefs });
}

function resolveWallpaperMount(opts = {}) {
  if (opts.mount && opts.mount.nodeType === 1) return opts.mount;
  const byId = document.getElementById(WALLPAPER_HOST_ID);
  if (byId) return byId;
  const page = document.querySelector('.nx-page');
  return page || null;
}

function cssUrl(image) {
  if (!image) return '';
  const safe = String(image).replace(/\\/g, '/').replace(/"/g, '\\"');
  return `url("${safe}")`;
}

function paintWallpaperEl(el, prefs) {
  const n = normalizeWallpaperPrefs(prefs);
  el.id = WALLPAPER_EL_ID;
  el.className = 'nx-wallpaper';
  el.setAttribute('aria-hidden', 'true');
  el.style.backgroundColor = n.color;
  el.style.backgroundImage = n.image ? cssUrl(n.image) : 'none';
  el.style.backgroundSize = FIT_MAP[n.fit] || FIT_MAP.cover;
  el.style.backgroundPosition = n.position;
  el.style.backgroundRepeat = 'no-repeat';
  el.style.filter = n.blur > 0 ? `blur(${n.blur}px)` : 'none';
  el.style.opacity = String(n.opacity);
}

/**
 * Buat/update layer #nx-wallpaper di host.
 * @param {{ mount?: HTMLElement, ...prefs }} [opts]
 */
export async function applyWallpaper(opts = {}) {
  const prefs = await loadWallpaperPrefs();
  const merged = mergeWallpaperPrefs(
    opts && typeof opts === 'object' ? opts : {},
    prefs,
  );
  if (opts && opts.mount) lastWallpaperMount = opts.mount;
  else if (!lastWallpaperMount || !document.contains(lastWallpaperMount)) {
    lastWallpaperMount = resolveWallpaperMount(opts);
  }

  lastWallpaperOpts = { ...merged, mount: lastWallpaperMount };

  const mount = lastWallpaperMount;
  if (!mount) {
    console.warn('[wallpaper] butuh #nx-wallpaper-host di NXHOME (atau opts.mount)');
    return null;
  }

  let el = mount.querySelector('#' + WALLPAPER_EL_ID)
    || document.getElementById(WALLPAPER_EL_ID);
  if (el && el.parentElement !== mount) {
    el.remove();
    el = null;
  }
  if (!el) {
    el = document.createElement('div');
    mount.appendChild(el);
  }
  paintWallpaperEl(el, merged);
  // Label launcher ikut kontras wallpaper baru
  if (typeof window.applyLauncherLabelContrast === 'function') {
    try {
      await window.applyLauncherLabelContrast();
    } catch (_) { /* ignore */ }
  }
  return el;
}

/**
 * Apply ulang dari prefs bucket + opts terakhir.
 */
export async function refreshWallpaper() {
  if (lastWallpaperMount && !document.contains(lastWallpaperMount)) {
    lastWallpaperMount = resolveWallpaperMount(lastWallpaperOpts || {});
  }
  const base = lastWallpaperOpts && typeof lastWallpaperOpts === 'object'
    ? { ...lastWallpaperOpts }
    : { ...NATIVE_WALLPAPER_DEFAULTS };
  if (lastWallpaperMount) base.mount = lastWallpaperMount;
  return applyWallpaper(base);
}
