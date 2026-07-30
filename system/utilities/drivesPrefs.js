/**
 * Prefs File Manager (package/drives).
 * DistroBuckets("nx-drives") row __prefs__ (terpisah dari __open-history__).
 * Settings UI: package/settings/drives.js.
 */
export const DRIVES_STORE = 'nx-drives';
export const DRIVES_PREFS_ID = '__prefs__';

/** Warna Yaru di assets/folder (folder-{color}.png / user-{color}-home.png). */
export const FOLDER_COLORS = [
  'aubergine',
  'blue',
  'bordeaux',
  'canonical',
  'cyan',
  'darkblue',
  'green',
  'orange',
  'purple',
  'red',
  'vermillion',
  'yellow',
];

export const NATIVE_DRIVES_DEFAULTS = {
  folderColor: 'orange',
  view: 'grid',
  includeHidden: false,
  searchRecursiveDefault: false,
};

const FOLDER_COLOR_SET = new Set(FOLDER_COLORS);

function drivesStore() {
  if (typeof window === 'undefined' || typeof window.DistroBuckets !== 'function') {
    throw new Error('drivesStore: window.DistroBuckets belum siap (init DistroBuckets dulu)');
  }
  return window.DistroBuckets(DRIVES_STORE);
}

/**
 * @param {object} [p]
 */
export function normalizeDrivesPrefs(p = {}) {
  const src = p && typeof p === 'object' ? p : {};
  let folderColor = String(src.folderColor || NATIVE_DRIVES_DEFAULTS.folderColor)
    .toLowerCase()
    .trim();
  if (!FOLDER_COLOR_SET.has(folderColor)) {
    folderColor = NATIVE_DRIVES_DEFAULTS.folderColor;
  }

  const viewRaw = String(src.view || NATIVE_DRIVES_DEFAULTS.view).toLowerCase().trim();
  const view = viewRaw === 'list' ? 'list' : 'grid';

  return {
    folderColor,
    view,
    includeHidden: !!src.includeHidden,
    searchRecursiveDefault: !!src.searchRecursiveDefault,
  };
}

/**
 * @returns {Promise<object|null>}
 */
export async function loadDrivesPrefs() {
  try {
    const row = await drivesStore().get(DRIVES_PREFS_ID);
    if (!row || typeof row !== 'object') return null;
    return normalizeDrivesPrefs(row);
  } catch (_) {
    return null;
  }
}

/**
 * @param {object} prefs
 */
export async function saveDrivesPrefs(prefs = {}) {
  const n = normalizeDrivesPrefs(prefs);
  const row = {
    id: DRIVES_PREFS_ID,
    ...n,
    updatedAt: Date.now(),
  };
  await drivesStore().set(row);
  cacheDrivesPrefs(n);
  return row;
}

/**
 * @param {object} nativeOpts
 * @param {object|null} prefs
 */
export function mergeDrivesPrefs(nativeOpts = {}, prefs = null) {
  const native = normalizeDrivesPrefs({
    ...NATIVE_DRIVES_DEFAULTS,
    ...(nativeOpts && typeof nativeOpts === 'object' ? nativeOpts : {}),
  });
  if (!prefs || typeof prefs !== 'object') return { ...native };
  return normalizeDrivesPrefs({ ...native, ...prefs });
}

/** Cache sync untuk icon URL di FM (tanpa await tiap render). */
let _cached = null;

export function cacheDrivesPrefs(prefs) {
  _cached = normalizeDrivesPrefs(prefs || NATIVE_DRIVES_DEFAULTS);
  if (typeof window !== 'undefined') {
    window.__nxDrivesPrefs = { ..._cached };
  }
  return _cached;
}

export function getDrivesPrefsCached() {
  if (_cached) return { ..._cached };
  if (typeof window !== 'undefined' && window.__nxDrivesPrefs) {
    return normalizeDrivesPrefs(window.__nxDrivesPrefs);
  }
  return { ...NATIVE_DRIVES_DEFAULTS };
}

export function getFolderColor() {
  return getDrivesPrefsCached().folderColor;
}

/**
 * Terapkan prefs + beri tahu FM yang sedang terbuka.
 * @param {object} [prefs]
 */
export async function applyDrivesPrefs(prefs) {
  const n = prefs
    ? normalizeDrivesPrefs(prefs)
    : mergeDrivesPrefs(
        NATIVE_DRIVES_DEFAULTS,
        await loadDrivesPrefs(),
      );
  cacheDrivesPrefs(n);
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('nx-drives-prefs', { detail: { ...n } }),
      );
    } catch (_) {
      /* ignore */
    }
  }
  return n;
}

/** Muat dari bucket + apply (boot / refresh settings). */
export async function refreshDrivesPrefs() {
  const prefs = await loadDrivesPrefs();
  return applyDrivesPrefs(
    mergeDrivesPrefs(NATIVE_DRIVES_DEFAULTS, prefs),
  );
}
