/**
 * Prefs tema visual jendela app (.nx-app-window).
 * Store: DistroBuckets("nx-window") row __prefs__
 * (baris geometry per-app memakai id lain — tidak bentrok).
 * UI: package/settings/stwindow.js
 *
 * theme: adwaita | dark | ubuntu | minimal | glass
 */

export const WINDOW_THEME_STORE = 'nx-window';
export const WINDOW_THEME_PREFS_ID = '__prefs__';

/** Default — chrome terang ala Adwaita / Yaru light. */
export const NATIVE_WINDOW_THEME_DEFAULTS = {
  theme: 'adwaita',
};

/**
 * Lima konsep visual bingkai jendela app.
 * CSS: .nx-app-window--theme-{id}
 */
export const WINDOW_THEMES = [
  {
    id: 'adwaita',
    label: 'Adwaita Light',
    description: 'Header abu lembut, bayangan sedang — default GNOME-like.',
  },
  {
    id: 'dark',
    label: 'Dark Chrome',
    description: 'Bingkai gelap, kontrol terang — nyaman di wallpaper gelap.',
  },
  {
    id: 'ubuntu',
    label: 'Ubuntu Accent',
    description: 'Header hangat + strip aksen oranye di kiri title bar.',
  },
  {
    id: 'minimal',
    label: 'Minimal Flat',
    description: 'Border tipis, sedikit bayangan, header rata.',
  },
  {
    id: 'glass',
    label: 'Glass',
    description: 'Header transparan blur, sudut membulat — terasa ringan.',
  },
];

const THEME_IDS = new Set(WINDOW_THEMES.map((t) => t.id));

function windowThemeStore() {
  if (typeof window === 'undefined' || typeof window.DistroBuckets !== 'function') {
    throw new Error('windowThemeStore: window.DistroBuckets belum siap');
  }
  return window.DistroBuckets(WINDOW_THEME_STORE);
}

/**
 * @param {object} [p]
 * @returns {{ theme: string }}
 */
export function normalizeWindowThemePrefs(p = {}) {
  const src = p && typeof p === 'object' ? p : {};
  let theme = String(src.theme || src.variant || NATIVE_WINDOW_THEME_DEFAULTS.theme)
    .trim()
    .toLowerCase();
  if (!THEME_IDS.has(theme)) theme = NATIVE_WINDOW_THEME_DEFAULTS.theme;
  return { theme };
}

/**
 * @param {object} native
 * @param {object|null} prefs
 */
export function mergeWindowThemePrefs(native, prefs) {
  const base = normalizeWindowThemePrefs(native || NATIVE_WINDOW_THEME_DEFAULTS);
  if (!prefs || typeof prefs !== 'object') return { ...base };
  return normalizeWindowThemePrefs({ ...base, ...prefs });
}

/** @returns {Promise<object|null>} */
export async function loadWindowThemePrefs() {
  try {
    const row = await windowThemeStore().get(WINDOW_THEME_PREFS_ID);
    if (!row || typeof row !== 'object') return null;
    const { id, updatedAt, ...rest } = row;
    return normalizeWindowThemePrefs(rest);
  } catch (err) {
    console.warn('[window-theme] load prefs gagal:', err);
    return null;
  }
}

/**
 * @param {{ theme?: string }} prefs
 */
export async function saveWindowThemePrefs(prefs) {
  const normalized = normalizeWindowThemePrefs(prefs);
  await windowThemeStore().set({
    id: WINDOW_THEME_PREFS_ID,
    theme: normalized.theme,
    updatedAt: new Date().toISOString(),
  });
  return normalized;
}

/**
 * Terapkan tema ke satu atau semua .nx-app-window di work area.
 * Theme "dark" juga mengaktifkan Dark Chrome global untuk .ubuntu-workbench
 * (html[data-nx-components-theme="dark"]).
 * @param {{ theme?: string }} [prefs]
 * @param {{ root?: ParentNode|null }} [opts]
 */
export function applyWindowThemePrefs(prefs, opts = {}) {
  const p = normalizeWindowThemePrefs(prefs || NATIVE_WINDOW_THEME_DEFAULTS);
  if (typeof document === 'undefined') return p;

  const root = opts.root
    || document.getElementById('nxhome')
    || document;

  const wins = root.querySelectorAll
    ? root.querySelectorAll('.nx-app-window')
    : [];

  for (const el of wins) {
    for (const id of THEME_IDS) {
      el.classList.remove(`nx-app-window--theme-${id}`);
    }
    el.classList.add(`nx-app-window--theme-${p.theme}`);
    el.setAttribute('data-nx-window-theme', p.theme);
  }

  const home = document.getElementById('nxhome');
  if (home) {
    home.setAttribute('data-nx-window-theme', p.theme);
  }

  // Components Dark Chrome — global saat theme = dark
  const rootEl = document.documentElement;
  if (p.theme === 'dark') {
    rootEl.setAttribute('data-nx-components-theme', 'dark');
  } else {
    rootEl.removeAttribute('data-nx-components-theme');
  }

  return p;
}

/**
 * Muat prefs → apply ke jendela yang terbuka.
 */
export async function refreshWindowTheme() {
  const native = NATIVE_WINDOW_THEME_DEFAULTS;
  const saved = await loadWindowThemePrefs();
  const merged = mergeWindowThemePrefs(native, saved);
  applyWindowThemePrefs(merged);
  return merged;
}
