/**
 * Prefs title bar Electron (#nx-titlebar).
 * Store: DistroBuckets("nx-titlebar") row __prefs__.
 * UI: package/settings/titlebar.js
 *
 * display: show | hide | hover
 * variant: classic | light | ubuntu | compact | floating
 */

export const TITLEBAR_STORE = 'nx-titlebar';
export const TITLEBAR_PREFS_ID = '__prefs__';
export const TITLEBAR_HOST_ID = 'nx-titlebar';

/** Default native — classic gelap, selalu tampil. */
export const NATIVE_TITLEBAR_DEFAULTS = {
  display: 'show',
  variant: 'classic',
};

export const TITLEBAR_DISPLAY_OPTIONS = [
  {
    id: 'show',
    label: 'Tampilkan (Show)',
    description: 'Title bar selalu terlihat di atas.',
  },
  {
    id: 'hide',
    label: 'Sembunyikan (Hide)',
    description: 'Title bar tidak ditampilkan sama sekali.',
  },
  {
    id: 'hover',
    label: 'Hover',
    description: 'Tersembunyi; muncul hanya saat kursor diarahkan ke tepi atas jendela.',
  },
];

/**
 * Lima konsep title bar yang berbeda (id → meta UI).
 * CSS: .nx-titlebar--{id} di system/titlebar/style.css
 */
export const TITLEBAR_VARIANTS = [
  {
    id: 'classic',
    label: 'Classic Dark',
    description: 'Bar gelap penuh lebar — kontrol di kanan (default).',
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Bar terang, teks gelap — mirip toolbar aplikasi light.',
  },
  {
    id: 'ubuntu',
    label: 'Ubuntu Accent',
    description: 'Gelap hangat dengan strip aksen oranye di kiri.',
  },
  {
    id: 'compact',
    label: 'Compact',
    description: 'Kontrol lebih rapat — hemat ruang visual.',
  },
  {
    id: 'floating',
    label: 'Floating Glass',
    description: 'Inset membulat + transparan blur — terasa mengambang.',
  },
];

const VARIANT_IDS = new Set(TITLEBAR_VARIANTS.map((v) => v.id));
const DISPLAY_IDS = new Set(TITLEBAR_DISPLAY_OPTIONS.map((d) => d.id));

function titlebarStore() {
  if (typeof window === 'undefined' || typeof window.DistroBuckets !== 'function') {
    throw new Error('titlebarStore: window.DistroBuckets belum siap');
  }
  return window.DistroBuckets(TITLEBAR_STORE);
}

/**
 * @param {object} [p]
 * @returns {{ display: 'show'|'hide'|'hover', variant: string, visible: boolean }}
 */
export function normalizeTitlebarPrefs(p = {}) {
  const src = p && typeof p === 'object' ? p : {};

  let display = String(src.display || '').trim().toLowerCase();
  // Migrasi dari field visible lama
  if (!DISPLAY_IDS.has(display)) {
    if (src.visible === false || src.visible === 'false' || src.visible === 0) {
      display = 'hide';
    } else {
      display = NATIVE_TITLEBAR_DEFAULTS.display;
    }
  }

  let variant = String(src.variant || NATIVE_TITLEBAR_DEFAULTS.variant).trim().toLowerCase();
  if (!VARIANT_IDS.has(variant)) variant = NATIVE_TITLEBAR_DEFAULTS.variant;

  return {
    display,
    variant,
    // alias untuk kode lama / form yang masih cek visible
    visible: display !== 'hide',
  };
}

/**
 * @param {object} native
 * @param {object|null} prefs
 */
export function mergeTitlebarPrefs(native, prefs) {
  const base = normalizeTitlebarPrefs(native || NATIVE_TITLEBAR_DEFAULTS);
  if (!prefs || typeof prefs !== 'object') return { ...base };
  return normalizeTitlebarPrefs({ ...base, ...prefs });
}

/** @returns {Promise<object|null>} */
export async function loadTitlebarPrefs() {
  try {
    const row = await titlebarStore().get(TITLEBAR_PREFS_ID);
    if (!row || typeof row !== 'object') return null;
    const { id, updatedAt, ...rest } = row;
    return normalizeTitlebarPrefs(rest);
  } catch (err) {
    console.warn('[titlebar] load prefs gagal:', err);
    return null;
  }
}

/**
 * @param {{ display?: string, visible?: boolean, variant?: string }} prefs
 */
export async function saveTitlebarPrefs(prefs) {
  const normalized = normalizeTitlebarPrefs(prefs);
  await titlebarStore().set({
    id: TITLEBAR_PREFS_ID,
    display: normalized.display,
    variant: normalized.variant,
    updatedAt: new Date().toISOString(),
  });
  return normalized;
}

/** Mode layout yang memakan tinggi flow di dokumen (hanya show). */
function takesFlowSpace(display) {
  return display === 'show';
}

/**
 * Terapkan display + variant HANYA ke #nx-titlebar.
 * @param {{ display?: string, visible?: boolean, variant?: string }} [prefs]
 * @param {{ host?: HTMLElement|null }} [opts]
 */
export function applyTitlebarPrefs(prefs, opts = {}) {
  const p = normalizeTitlebarPrefs(prefs || NATIVE_TITLEBAR_DEFAULTS);
  let titleHost = typeof document !== 'undefined'
    ? document.getElementById(TITLEBAR_HOST_ID)
    : null;
  if (opts.host && opts.host.id === TITLEBAR_HOST_ID) {
    titleHost = opts.host;
  }
  if (!titleHost) return p;

  const wasFlow = !titleHost.classList.contains('nx-titlebar-host--hidden')
    && !titleHost.classList.contains('nx-titlebar-host--display-hover')
    && !titleHost.hidden;
  const willFlow = takesFlowSpace(p.display);

  titleHost.hidden = p.display === 'hide';
  titleHost.classList.toggle('nx-titlebar-host--hidden', p.display === 'hide');
  titleHost.classList.toggle('nx-titlebar-host--display-show', p.display === 'show');
  titleHost.classList.toggle('nx-titlebar-host--display-hover', p.display === 'hover');
  titleHost.classList.remove('is-reveal');

  titleHost.setAttribute('data-nx-titlebar-display', p.display);
  titleHost.setAttribute('data-nx-titlebar-visible', p.visible ? '1' : '0');
  titleHost.setAttribute('data-nx-titlebar-variant', p.variant);

  for (const v of VARIANT_IDS) {
    titleHost.classList.remove(`nx-titlebar-host--${v}`);
  }
  titleHost.classList.add(`nx-titlebar-host--${p.variant}`);

  const bar = titleHost.querySelector(':scope > .nx-titlebar');
  if (bar) {
    for (const v of VARIANT_IDS) {
      bar.classList.remove(`nx-titlebar--${v}`);
    }
    bar.classList.add('nx-titlebar', `nx-titlebar--${p.variant}`);
    bar.setAttribute('data-variant', p.variant);
  }

  attachTitlebarHoverReveal(titleHost, p.display === 'hover');

  // Reflow #main hanya jika space flow berubah (show ↔ hide/hover)
  if (wasFlow !== willFlow && typeof window !== 'undefined') {
    requestAnimationFrame(() => {
      try {
        window.dispatchEvent(new Event('resize'));
      } catch (_) { /* ignore */ }
    });
  }

  return p;
}

let hoverBoundHost = null;

/**
 * Mode hover: strip tipis di atas menangkap mouse; bar slide-in.
 * @param {HTMLElement} host
 * @param {boolean} enabled
 */
function attachTitlebarHoverReveal(host, enabled) {
  if (!host) return;

  if (hoverBoundHost && hoverBoundHost !== host) {
    detachTitlebarHoverReveal(hoverBoundHost);
  }
  detachTitlebarHoverReveal(host);

  if (!enabled) {
    hoverBoundHost = null;
    return;
  }

  const onEnter = () => host.classList.add('is-reveal');
  const onLeave = () => host.classList.remove('is-reveal');

  host.addEventListener('mouseenter', onEnter);
  host.addEventListener('mouseleave', onLeave);
  host.__nxTitlebarHover = { onEnter, onLeave };
  hoverBoundHost = host;
}

function detachTitlebarHoverReveal(host) {
  if (!host || !host.__nxTitlebarHover) return;
  const { onEnter, onLeave } = host.__nxTitlebarHover;
  host.removeEventListener('mouseenter', onEnter);
  host.removeEventListener('mouseleave', onLeave);
  delete host.__nxTitlebarHover;
  host.classList.remove('is-reveal');
}

/**
 * Muat prefs → apply.
 */
export async function refreshTitlebar() {
  const native = NATIVE_TITLEBAR_DEFAULTS;
  const saved = await loadTitlebarPrefs();
  const merged = mergeTitlebarPrefs(native, saved);
  applyTitlebarPrefs(merged);
  return merged;
}
