/**
 * Package "drives" — File Manager (Yaru / Nautilus).
 * Hanya PEMAKAI window.* global (listDrives, listDir, NxResize, …).
 * Tanpa import modul terpisah.
 *
 * Style: assets/components/file-manager.css + assets/folder/ + assets/file/
 */

const FOLDER_BASE = '/templates/distro/Development/assets/folder';
const DEVICES_BASE = '/templates/distro/Development/assets/devices';
const FILE_BASE = '/templates/distro/Development/assets/file';

/** Warna folder — diisi dari prefs (default orange). Jangan hardcode permanen. */
let FOLDER_COLOR = 'orange';

function syncFolderColorFromPrefs() {
  if (typeof window.getFolderColor === 'function') {
    FOLDER_COLOR = window.getFolderColor() || 'orange';
  } else if (window.__nxDrivesPrefs?.folderColor) {
    FOLDER_COLOR = String(window.__nxDrivesPrefs.folderColor);
  }
}
syncFolderColorFromPrefs();

const FOLDER_NAME_KIND = {
  documents: 'documents',
  document: 'documents',
  docs: 'documents',
  downloads: 'download',
  download: 'download',
  pictures: 'pictures',
  picture: 'pictures',
  photos: 'pictures',
  photo: 'photo',
  images: 'pictures',
  image: 'photo',
  music: 'music',
  videos: 'video',
  video: 'video',
  movies: 'video',
  desktop: 'desktop',
  templates: 'templates',
  public: 'network',
  favorites: 'favorites',
  games: 'games',
  fonts: 'fonts',
  icons: 'icons',
  git: 'git',
  github: 'github',
  gitlab: 'gitlab',
  dropbox: 'dropbox',
  development: 'development',
  dev: 'development',
  src: 'development',
  vscode: 'vscode',
  java: 'java',
  linux: 'linux',
  mail: 'mail',
  apps: 'apps',
  applications: 'apps',
  'program files': 'apps',
  'program files (x86)': 'apps',
  users: 'home',
  home: 'home',
  trash: 'trash',
  '$recycle.bin': 'trash',
  network: 'network',
  remote: 'remote',
  recent: 'recent',
  bookmarks: 'bookmarks',
  private: 'private',
  script: 'script',
  scripts: 'script',
  steam: 'steam',
  wine: 'wine',
};

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBytes(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return '—';
  if (v < 1024) return `${v} B`;
  const u = ['KB', 'MB', 'GB', 'TB'];
  let x = v;
  let i = -1;
  while (x >= 1024 && i < u.length - 1) {
    x /= 1024;
    i += 1;
  }
  return `${x.toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

function formatDate(ms) {
  const t = Number(ms);
  if (!Number.isFinite(t) || t <= 0) return '—';
  try {
    return new Date(t).toLocaleString();
  } catch (_) {
    return '—';
  }
}

function resolveFolderKind(name) {
  const key = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[_]+/g, ' ');
  if (!key) return 'default';
  if (FOLDER_NAME_KIND[key]) return FOLDER_NAME_KIND[key];
  for (const [token, kind] of Object.entries(FOLDER_NAME_KIND)) {
    if (key.includes(token)) return kind;
  }
  return 'default';
}

function folderIconUrl(name, opts = {}) {
  const color = FOLDER_COLOR;
  const kind = opts.kind || resolveFolderKind(name);
  if (kind === 'home') return `${FOLDER_BASE}/user-${color}-home.png`;
  if (kind === 'desktop') return `${FOLDER_BASE}/user-${color}-desktop.png`;
  if (kind === 'trash') return `${FOLDER_BASE}/user-trash.png`;
  if (kind === 'network') return `${FOLDER_BASE}/network-workgroup.png`;
  if (opts.open) return `${FOLDER_BASE}/folder-${color}-open.png`;
  if (kind === 'default') return `${FOLDER_BASE}/folder-${color}.png`;
  return `${FOLDER_BASE}/folder-${color}-${kind}.png`;
}

/**
 * Ikon drive dari assets/devices (bukan folder).
 * Win32 DriveType: 2 Removable, 3 Local, 4 Network, 5 CD-ROM, 6 RAM.
 */
function driveIconUrl(drive) {
  const type = Number(drive && drive.driveType);
  const label = String((drive && drive.driveTypeLabel) || '').toLowerCase();
  const id = String((drive && drive.id) || '').toUpperCase().replace(/\\+$/, '');
  const name = String((drive && drive.name) || '').toLowerCase();
  const fs = String((drive && drive.fileSystem) || '').toLowerCase();

  if (type === 5 || label.includes('cd') || label.includes('dvd') || label.includes('optical')) {
    return `${DEVICES_BASE}/media-optical.png`;
  }
  if (type === 4 || label.includes('network')) {
    return `${DEVICES_BASE}/network-wireless.png`;
  }
  if (type === 6 || label.includes('ram')) {
    return `${DEVICES_BASE}/media-flash.png`;
  }
  if (
    type === 2 ||
    label.includes('removable') ||
    label.includes('usb') ||
    name.includes('usb')
  ) {
    if (label.includes('usb') || name.includes('usb')) {
      return `${DEVICES_BASE}/drive-removable-media-usb.png`;
    }
    return `${DEVICES_BASE}/drive-removable-media.png`;
  }

  // Local disk (3) / default
  if (id === 'C:' || id === 'C') {
    return `${DEVICES_BASE}/drive-harddisk-system.png`;
  }
  if (fs.includes('ssd') || name.includes('ssd') || name.includes('nvme')) {
    return `${DEVICES_BASE}/drive-harddisk-solidstate.png`;
  }
  if (label.includes('ieee') || label.includes('1394') || label.includes('firewire')) {
    return `${DEVICES_BASE}/drive-harddisk-ieee1394.png`;
  }
  return `${DEVICES_BASE}/drive-harddisk.png`;
}

function folderIconHtml(name, opts = {}) {
  const size = opts.size || 'md';
  const src = folderIconUrl(name, opts);
  return `<img class="fm-folder-icon fm-folder-icon--${size}" src="${src}" alt="" draggable="false" loading="lazy" />`;
}

function driveIconHtml(drive, opts = {}) {
  const size = opts.size || 'md';
  const src = driveIconUrl(drive);
  return `<img class="fm-folder-icon fm-device-icon fm-folder-icon--${size}" src="${src}" alt="" draggable="false" loading="lazy" />`;
}

/** Ikon tipe file — PNG MIME di assets/file/{32x32|50x50} (bukan CSS kernel icon-*). */
const FILE_ICON_BY_FILENAME = {
  dockerfile: 'text-x-script',
  makefile: 'text-x-makefile',
  cmakelists: 'text-x-cmake',
  'cmakelists.txt': 'text-x-cmake',
  'package.json': 'application-json',
  'package-lock.json': 'application-json',
  'composer.json': 'application-json',
  'tsconfig.json': 'application-typescript',
  'jsconfig.json': 'application-javascript',
  readme: 'text-x-readme',
  'readme.md': 'text-markdown',
  'readme.txt': 'text-x-readme',
  license: 'text-x-copying',
  'license.md': 'text-x-copying',
  'license.txt': 'text-x-copying',
  authors: 'text-x-authors',
  copying: 'text-x-copying',
  changelog: 'text-x-credits',
  '.gitignore': 'text-x-generic',
  '.gitattributes': 'text-x-generic',
  '.dockerignore': 'text-x-generic',
  '.npmignore': 'text-x-generic',
  '.editorconfig': 'text-x-generic',
  '.env': 'text-x-generic',
  '.htaccess': 'text-html',
  '.eslintrc': 'application-json',
  '.prettierrc': 'application-json',
};

const FILE_ICON_BY_EXT = {
  html: 'text-html',
  htm: 'text-html',
  xhtml: 'text-html',
  css: 'text-css',
  scss: 'text-x-scss',
  sass: 'text-x-sass',
  less: 'text-less',
  js: 'application-javascript',
  mjs: 'application-javascript',
  cjs: 'application-javascript',
  jsx: 'application-javascript',
  ts: 'application-typescript',
  tsx: 'application-typescript',
  vue: 'text-html',
  svelte: 'text-html',
  astro: 'text-html',
  php: 'application-x-php',
  py: 'text-x-python',
  pyw: 'text-x-python',
  pyc: 'application-x-python-bytecode',
  rb: 'text-x-ruby',
  java: 'text-x-java',
  jar: 'application-x-java-archive',
  kt: 'text-x-java',
  kts: 'text-x-java',
  go: 'text-x-go',
  rs: 'text-rust',
  c: 'text-x-c',
  h: 'text-x-chdr',
  cpp: 'text-x-c++',
  cc: 'text-x-c++',
  cxx: 'text-x-c++',
  hpp: 'text-x-c++',
  hh: 'text-x-c++',
  cs: 'text-x-csharp',
  dart: 'text-x-script',
  lua: 'text-x-lua',
  r: 'text-x-r',
  swift: 'text-x-script',
  pl: 'application-x-perl',
  pm: 'application-x-perl',
  sh: 'application-x-shellscript',
  bash: 'application-x-shellscript',
  zsh: 'application-x-shellscript',
  fish: 'application-x-shellscript',
  ps1: 'text-x-script',
  bat: 'application-x-executable-script',
  cmd: 'application-x-executable-script',
  json: 'application-json',
  jsonc: 'application-json',
  json5: 'application-json',
  xml: 'text-xml',
  xsl: 'text-xml',
  xsd: 'text-xml',
  yaml: 'application-x-yaml',
  yml: 'application-x-yaml',
  toml: 'text-x-generic',
  ini: 'text-x-generic',
  conf: 'text-x-generic',
  cfg: 'text-x-generic',
  env: 'text-x-generic',
  sql: 'application-sql',
  graphql: 'text-x-generic',
  gql: 'text-x-generic',
  csv: 'text-spreadsheet',
  tsv: 'text-spreadsheet',
  md: 'text-markdown',
  markdown: 'text-markdown',
  mdx: 'text-markdown',
  txt: 'text-plain',
  log: 'text-x-generic',
  rtf: 'application-rtf',
  tex: 'text-x-tex',
  pdf: 'application-pdf',
  epub: 'application-epub+zip',
  doc: 'application-msword',
  docx: 'application-vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application-msexcel',
  xlsx: 'application-vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application-mspowerpoint',
  pptx: 'application-vnd.openxmlformats-officedocument.presentationml.presentation',
  ppsx: 'application-vnd.openxmlformats-officedocument.presentationml.slideshow',
  odt: 'application-vnd.oasis.opendocument.text',
  ods: 'office-spreadsheet',
  odp: 'application-vnd.oasis.opendocument.presentation',
  odb: 'application-vnd.oasis.opendocument.database',
  odg: 'application-vnd.oasis.opendocument.graphics',
  png: 'image-x-generic',
  jpg: 'image-x-generic',
  jpeg: 'image-x-generic',
  gif: 'image-x-generic',
  webp: 'image-x-generic',
  bmp: 'image-x-generic',
  ico: 'image-x-generic',
  tif: 'image-x-generic',
  tiff: 'image-x-generic',
  svg: 'image-svg+xml',
  svgz: 'image-svg+xml-compressed',
  psd: 'image-vnd.adobe.photoshop',
  ai: 'image-vnd.adobe.illustrator',
  xcf: 'image-x-xcf',
  eps: 'image-eps',
  mp3: 'audio-mpeg',
  wav: 'audio-x-wav',
  flac: 'audio-x-flac',
  ogg: 'audio-x-vorbis+ogg',
  oga: 'audio-x-vorbis+ogg',
  wma: 'audio-x-ms-wma',
  m3u: 'audio-x-mpegurl',
  m3u8: 'audio-x-mpegurl',
  mp4: 'video-x-generic',
  mkv: 'video-x-generic',
  avi: 'video-x-generic',
  mov: 'video-x-generic',
  webm: 'video-x-generic',
  wmv: 'video-x-generic',
  zip: 'application-zip',
  rar: 'application-vnd.rar',
  '7z': 'application-x-7z-compressed',
  tar: 'application-x-archive',
  gz: 'application-x-gzip',
  tgz: 'application-x-gzip',
  bz2: 'application-x-compress',
  xz: 'application-x-compress',
  iso: 'application-x-cd-image',
  ttf: 'font-ttf',
  otf: 'font-otf',
  woff: 'application-font',
  woff2: 'application-font',
  exe: 'application-x-ms-dos-executable',
  msi: 'application-x-msi',
  dll: 'application-x-msdownload',
  com: 'application-x-ms-dos-executable',
  scr: 'application-x-ms-dos-executable',
  apk: 'application-vnd.android.package-archive',
  deb: 'application-vnd.debian.binary-package',
  rpm: 'package-x-generic',
  snap: 'application-vnd.snap',
  flatpak: 'application-vnd.flatpak',
  appimage: 'application-x-executable',
  bin: 'application-x-bin',
  so: 'application-x-object',
  o: 'application-x-object',
  torrent: 'application-x-bittorrent',
  desktop: 'application-x-desktop',
  db: 'application-x-sqlite3',
  sqlite: 'application-x-sqlite3',
  sqlite3: 'application-x-sqlite3',
  blend: 'application-x-blender',
  stl: 'model-x.stl-binary',
  drawio: 'drawio',
};

const FILE_ICON_DEFAULT = 'text-x-generic';

/** Ext yang tetap pakai ikon native OS (shortcut / shell link). */
const OS_ICON_EXTS = new Set(['lnk', 'url', 'appref-ms']);

function fileExtOf(nameOrPath) {
  const raw = String(nameOrPath || '').toLowerCase().replace(/[/\\]+$/, '');
  const base = raw.split(/[/\\]/).pop() || raw;
  const dot = base.lastIndexOf('.');
  return dot >= 0 ? base.slice(dot + 1) : '';
}

function needsOsFileIcon(nameOrPath) {
  return OS_ICON_EXTS.has(fileExtOf(nameOrPath));
}

/** Ext yang diluncurkan OS (bukan viewer internal). */
const OPEN_EXTERNAL_EXTS = new Set([
  'lnk',
  'url',
  'exe',
  'msi',
  'bat',
  'cmd',
  'com',
  'scr',
  'appref-ms',
]);

function shouldOpenExternally(nameOrPath) {
  return OPEN_EXTERNAL_EXTS.has(fileExtOf(nameOrPath));
}

/**
 * Basename MIME di assets/file (tanpa .png).
 * @param {string} name
 */
function resolveFileMimeIcon(name) {
  const lower = String(name || '').toLowerCase();
  const base = lower.split(/[/\\]/).pop() || lower;
  if (FILE_ICON_BY_FILENAME[base]) return FILE_ICON_BY_FILENAME[base];
  const stem = base.includes('.') ? base.slice(0, base.lastIndexOf('.')) : base;
  if (FILE_ICON_BY_FILENAME[stem]) return FILE_ICON_BY_FILENAME[stem];
  const ext = fileExtOf(base);
  return FILE_ICON_BY_EXT[ext] || FILE_ICON_DEFAULT;
}

/**
 * URL PNG ikon file (32x32 list/sidebar, 50x50 grid).
 * @param {string} name
 * @param {{ size?: 'sm'|'md'|'lg' }} [opts]
 */
function fileIconUrl(name, opts = {}) {
  const sizeKey = opts.size === 'lg' ? '50x50' : '32x32';
  const mime = resolveFileMimeIcon(name);
  return `${FILE_BASE}/${sizeKey}/${encodeURIComponent(mime)}.png`;
}

/**
 * Markup ikon file — PNG distro assets/file, atau placeholder OS untuk .lnk.
 * @param {string} name
 * @param {string} [absPath]
 * @param {{ size?: 'sm'|'md'|'lg' }} [opts]
 */
function fileIconHtml(name, absPath, opts = {}) {
  const size = opts.size || 'md';
  const useOs = absPath && (needsOsFileIcon(name) || needsOsFileIcon(absPath));
  if (useOs) {
    return (
      `<span class="icon fm-os-icon-ph" data-fm-os-icon="${encodeURIComponent(absPath)}" aria-hidden="true"></span>`
    );
  }
  const src = fileIconUrl(name, { size });
  return `<img class="fm-file-icon fm-file-icon--${size}" src="${src}" alt="" draggable="false" loading="lazy" />`;
}

function parentPath(p) {
  const raw = String(p || '').replace(/[/\\]+$/, '');
  if (!raw) return '';
  if (/^nx:recycle-bin$/i.test(raw) || /^shell:recyclebinfolder$/i.test(raw)) return '';
  if (/^[a-zA-Z]:$/i.test(raw)) return '';
  if (/^[a-zA-Z]:\\$/i.test(String(p || ''))) return '';
  const parts = raw.split(/[/\\]/).filter(Boolean);
  if (parts.length <= 1) return '';
  parts.pop();
  if (parts.length === 1 && /^[a-zA-Z]:$/i.test(parts[0])) return `${parts[0]}\\`;
  return parts.join('\\');
}

function pathSegments(p) {
  const raw = String(p || '');
  if (!raw) return [];
  if (/^nx:recycle-bin$/i.test(raw) || /^shell:recyclebinfolder$/i.test(raw)) {
    return [{ label: 'Recycle Bin', path: 'nx:recycle-bin' }];
  }
  const m = raw.match(/^([a-zA-Z]:)[\\/]?(.*)$/);
  if (m) {
    const root = `${m[1]}\\`;
    const rest = String(m[2] || '').split(/[/\\]/).filter(Boolean);
    const segs = [{ label: m[1], path: root }];
    let acc = root;
    for (const name of rest) {
      acc = acc.endsWith('\\') ? `${acc}${name}` : `${acc}\\${name}`;
      segs.push({ label: name, path: acc });
    }
    return segs;
  }
  const parts = raw.split(/[/\\]/).filter(Boolean);
  const segs = [];
  let acc = '';
  for (const name of parts) {
    acc = acc ? `${acc}/${name}` : `/${name}`;
    segs.push({ label: name, path: acc });
  }
  return segs;
}

/**
 * id HTML untuk context-menu (system/contextmenu/nxDriveEntry.js).
 * Tipe dikode di id karena buildMenu jalan di main process (tanpa DOM).
 * @param {string} absPath
 * @param {'file'|'directory'|'drive'} [kind='directory']
 */
function nxDriveTargetId(absPath, kind = 'directory') {
  const k = kind === 'file' || kind === 'drive' ? kind : 'directory';
  return `nxdrive::${k}::${encodeURIComponent(String(absPath || ''))}`;
}

/** id area kosong / cwd — path terkode (main process tidak bisa baca data-fm-cwd). */
function nxDriveCwdId(cwd) {
  return `nxdrive-cwd::${encodeURIComponent(String(cwd || ''))}`;
}

/** Id jendela editor OS unik per path absolut (sama algoritma di openOsFile). */
function osEditorWinId(absPath) {
  const p = String(absPath || '');
  let h = 2166136261;
  for (let i = 0; i < p.length; i++) {
    h ^= p.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `nx-os-editor-${(h >>> 0).toString(36)}`;
}

/** Store DistroBuckets untuk prefs FM (lihat system/buckets + system/index.js). */
const DRIVES_STORE = 'nx-drives';
const OPEN_HISTORY_ID = '__open-history__';
const OPEN_HISTORY_MAX = 20;

function drivesBucket() {
  if (typeof window === 'undefined' || typeof window.DistroBuckets !== 'function') {
    return null;
  }
  return window.DistroBuckets(DRIVES_STORE);
}

function normalizeHistoryList(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((x) => x && typeof x.path === 'string' && x.path)
    .map((x) => ({
      path: String(x.path),
      name: String(x.name || fmBasename(x.path)),
    }))
    .slice(0, OPEN_HISTORY_MAX);
}

/** Baca History dari DistroBuckets saja (SOP system/buckets — tanpa localStorage). */
async function loadOpenHistory() {
  try {
    const store = drivesBucket();
    if (!store) return { items: [], expanded: true };
    const row = await store.get(OPEN_HISTORY_ID);
    const items = normalizeHistoryList(row?.items);
    // expanded default true kalau field belum ada (row lama sebelum fitur toggle).
    const expanded = row?.expanded !== false;
    return { items, expanded };
  } catch (err) {
    console.warn('[drives] loadOpenHistory:', err);
    return { items: [], expanded: true };
  }
}

/**
 * Tulis History + status buka/tutup panel ke DistroBuckets (persist F5).
 * @param {unknown} list
 * @param {boolean} [expanded]
 * @returns {Promise<boolean>} true kalau berhasil tertulis
 */
async function saveOpenHistory(list, expanded = true) {
  const items = normalizeHistoryList(list);
  const open = expanded !== false;
  try {
    const store = drivesBucket();
    if (!store) return false;
    await store.set({
      id: OPEN_HISTORY_ID,
      items,
      expanded: open,
      updatedAt: Date.now(),
    });
    const verify = await store.get(OPEN_HISTORY_ID);
    return (
      Array.isArray(verify?.items) &&
      verify.items.length === items.length &&
      verify.expanded === open
    );
  } catch (err) {
    console.warn('[drives] saveOpenHistory:', err);
    return false;
  }
}

function fmPathSep(p) {
  const s = String(p || '');
  return s.includes('/') && !s.includes('\\') ? '/' : '\\';
}

function fmJoinPath(dir, name) {
  if (!dir) return String(name || '');
  const sep = fmPathSep(dir);
  return dir.endsWith('\\') || dir.endsWith('/') ? `${dir}${name}` : `${dir}${sep}${name}`;
}

function fmBasename(p) {
  const s = String(p || '').replace(/[/\\]+$/, '');
  const i = Math.max(s.lastIndexOf('\\'), s.lastIndexOf('/'));
  return i < 0 ? s : s.slice(i + 1);
}

function fmDirname(p) {
  const s = String(p || '').replace(/[/\\]+$/, '');
  const i = Math.max(s.lastIndexOf('\\'), s.lastIndexOf('/'));
  if (i < 0) return '';
  if (/^[a-zA-Z]:$/i.test(s.slice(0, i))) return `${s.slice(0, i)}\\`;
  return s.slice(0, i) || '';
}

/** Pilih stem nama file (tanpa ekstensi) — pola Explorer/Nautilus. */
function selectNameStem(input, name) {
  const n = String(name || '');
  const dot = n.lastIndexOf('.');
  if (dot > 0) input.setSelectionRange(0, dot);
  else input.select();
}

export async function index(page, route) {
  route.register(page, async (routeName, container, routeMeta = {
    title: 'Files',
    description: 'File manager OS — window.listDrives + listDir.',
  }, style, nav = {}) => {
    route.routeMetaByRoute.set(page, routeMeta);

    const state = {
      path: '',
      history: [''],
      histIdx: 0,
      view: 'grid',
      includeHidden: false,
      drives: [],
      places: [],
      children: [],
      selected: new Set(),
      anchorPath: null,
      loading: false,
      error: '',
      /** Operasi panjang (hapus/restore/empty) — status bar, bukan overlay blokir. */
      opBusy: false,
      statusBase: { left: 'Ready', right: '' },
      /** @type {{ path: string, name: string }[]} file editor yang pernah dibuka */
      openHistory: [],
      /** Panel daftar History terbuka (tombol chevron sebelum Clear). */
      historyExpanded: true,
      /** Filter cwd / hasil searchDir */
      searchQuery: '',
      searchRecursive: false,
      /** null = tampil children/drives biasa; array = mode hasil (filter atau IPC) */
      searchResults: null,
      searchToken: 0,
      /** Sort list: name | size | mtime | type */
      sortKey: 'name',
      sortDir: 'asc',
    };

    // Prefs Settings → Files (warna, view, hidden, search default)
    {
      const cached =
        typeof window.getDrivesPrefsCached === 'function'
          ? window.getDrivesPrefsCached()
          : window.__nxDrivesPrefs || null;
      if (cached && typeof cached === 'object') {
        if (cached.folderColor) FOLDER_COLOR = String(cached.folderColor);
        state.view = cached.view === 'list' ? 'list' : 'grid';
        state.includeHidden = !!cached.includeHidden;
        state.searchRecursive = !!cached.searchRecursiveDefault;
      }
    }

    container.innerHTML = `
<div class="ubuntu-workbench" id="nx-drives-root">
  <div class="ubuntu-fm-app" id="nx-drives-app">
    <div class="ubuntu-fm-toolbar">
      <div class="linked">
        <button type="button" class="flat icon-button" id="fm-back" title="Back" aria-label="Back"><i class="icon-ic_fluent_arrow_left_16_regular" aria-hidden="true"></i></button>
        <button type="button" class="flat icon-button" id="fm-forward" title="Forward" aria-label="Forward"><i class="icon-ic_fluent_arrow_right_16_regular" aria-hidden="true"></i></button>
        <button type="button" class="flat icon-button" id="fm-up" title="Up" aria-label="Up"><i class="icon-ic_fluent_arrow_up_16_regular" aria-hidden="true"></i></button>
        <button type="button" class="flat icon-button" id="fm-refresh" title="Refresh" aria-label="Refresh"><i class="icon-ic_fluent_arrow_sync_16_regular" aria-hidden="true"></i></button>
      </div>
      <input class="ubuntu-fm-pathbar" id="fm-pathbar" type="text" spellcheck="false" placeholder="This PC" />
      <div class="fm-search" id="fm-search">
        <i class="icon-ic_fluent_search_16_regular fm-search-icon" aria-hidden="true"></i>
        <input class="fm-search-input" id="fm-search-input" type="search" spellcheck="false" placeholder="Search" aria-label="Search" />
        <button type="button" class="flat icon-button fm-search-clear" id="fm-search-clear" title="Clear search" aria-label="Clear search" hidden><i class="icon-ic_fluent_dismiss_16_regular" aria-hidden="true"></i></button>
        <button type="button" class="flat icon-button fm-search-recursive" id="fm-search-recursive" title="Search subfolders" aria-label="Search subfolders" aria-pressed="false"><i class="icon-ic_fluent_folder_search_16_regular" aria-hidden="true"></i></button>
      </div>
      <div class="linked">
        <button type="button" class="flat icon-button" id="fm-view-grid" title="Grid" aria-label="Grid"><i class="icon-ic_fluent_grid_16_regular" aria-hidden="true"></i></button>
        <button type="button" class="flat icon-button" id="fm-view-list" title="List" aria-label="List"><i class="icon-ic_fluent_list_16_regular" aria-hidden="true"></i></button>
      </div>
    </div>
    <div class="ubuntu-fm-breadcrumb" id="fm-breadcrumb"></div>
    <div class="ubuntu-fm-body">
      <aside class="ubuntu-fm-sidebar" id="fm-sidebar">
        <!-- Scroll kernel seluruh sidebar (§4a) — bukan overflow native di aside -->
        <div class="fm-sidebar-scroll nx-scroll" id="fm-sidebar-scroll">
          <div class="fm-section-label">Places</div>
          <button type="button" class="fm-place" data-fm-nav="">
            <span class="fm-place-icon"><img class="fm-folder-icon fm-folder-icon--sm" src="${folderIconUrl('home', { kind: 'home' })}" alt="" /></span>
            <span>This PC</span>
          </button>
          <div class="fm-places-section" id="fm-places"></div>
          <div class="fm-drives-section" id="fm-drives"></div>
          <div class="fm-history-section" id="fm-history-section">
            <div class="fm-history-head">
              <div class="fm-section-label">History</div>
              <div class="fm-history-actions">
                <button type="button" class="fm-history-toggle" id="fm-history-toggle" title="Tutup History" aria-label="Toggle history" aria-expanded="true"><i class="icon-ic_fluent_chevron_down_16_regular" aria-hidden="true"></i></button>
                <button type="button" class="fm-history-clear" id="fm-history-clear" title="Hapus semua history" aria-label="Clear history" hidden><i class="icon-ic_fluent_delete_16_regular" aria-hidden="true"></i></button>
              </div>
            </div>
            <div class="fm-history-scroll nx-scroll" id="fm-history-scroll">
              <div class="fm-open-history" id="fm-open-history"></div>
            </div>
          </div>
        </div>
      </aside>
      <div class="ubuntu-fm-sidebar-resizer" id="fm-sidebar-resizer" title="Resize"></div>
      <div class="ubuntu-fm-content" id="fm-content">
        <!-- Scroll = DIV .nx-scroll (README §4a); bukan overflow native di #fm-view -->
        <div class="fm-view-scroll nx-scroll" id="fm-view-scroll">
          <div class="ubuntu-fm-grid" id="fm-view"></div>
        </div>
        <!-- Host spinner kernel — overlay penuh content (bukan di dalam grid/list) -->
        <div class="fm-loading-host" id="fm-loading" hidden></div>
      </div>
    </div>
    <div class="ubuntu-fm-status" id="fm-status"><span>Ready</span><span></span></div>
  </div>
</div>`;

    const root = container.querySelector('#nx-drives-root');
    const viewEl = container.querySelector('#fm-view');
    const viewScrollEl = container.querySelector('#fm-view-scroll');
    const loadingHostEl = container.querySelector('#fm-loading');
    const pathbar = container.querySelector('#fm-pathbar');
    const breadcrumb = container.querySelector('#fm-breadcrumb');
    const drivesEl = container.querySelector('#fm-drives');
    const placesEl = container.querySelector('#fm-places');
    const openHistoryEl = container.querySelector('#fm-open-history');
    const historySectionEl = container.querySelector('#fm-history-section');
    const historyScrollEl = container.querySelector('#fm-history-scroll');
    const btnHistoryToggle = container.querySelector('#fm-history-toggle');
    const btnHistoryClear = container.querySelector('#fm-history-clear');
    const statusEl = container.querySelector('#fm-status');
    const btnBack = container.querySelector('#fm-back');
    const btnForward = container.querySelector('#fm-forward');
    const btnUp = container.querySelector('#fm-up');
    const btnRefresh = container.querySelector('#fm-refresh');
    const btnGrid = container.querySelector('#fm-view-grid');
    const btnList = container.querySelector('#fm-view-list');
    const searchWrap = container.querySelector('#fm-search');
    const searchInput = container.querySelector('#fm-search-input');
    const btnSearchClear = container.querySelector('#fm-search-clear');
    const btnSearchRecursive = container.querySelector('#fm-search-recursive');
    let searchDebounceTimer = null;
    /** Cache dataUrl ikon OS: `${path}|${size}` → dataUrl */
    const osIconCache = new Map();
    let osIconToken = 0;

    /**
     * Ambil ikon OS — window.getOsFileIcon atau electronAPI langsung.
     * @param {string} filePath
     * @param {{ size?: string }} opts
     */
    async function fetchOsFileIcon(filePath, opts) {
      if (typeof window.getOsFileIcon === 'function') {
        return window.getOsFileIcon(filePath, opts);
      }
      const api = window.electronAPI;
      if (!api?.getOsFileIcon) {
        throw new Error('getOsFileIcon belum siap (restart Electron)');
      }
      const res = await api.getOsFileIcon({ path: filePath, ...(opts || {}) });
      if (!res?.ok) throw new Error(res?.error || 'getOsFileIcon gagal');
      return res;
    }

    /**
     * Ganti placeholder .lnk/.exe dengan ikon native Windows (per perangkat).
     * @param {ParentNode} [root=viewEl]
     * @param {'small'|'normal'|'large'} [sizeHint]
     */
    async function hydrateOsFileIcons(root = viewEl, sizeHint) {
      if (!root) return;
      const nodes = [...root.querySelectorAll('[data-fm-os-icon]')];
      if (!nodes.length) return;
      const token = ++osIconToken;
      const size =
        sizeHint || (state.view === 'list' ? 'small' : 'normal');

      await Promise.all(
        nodes.map(async (el) => {
          let p = '';
          try {
            p = decodeURIComponent(el.getAttribute('data-fm-os-icon') || '');
          } catch (_) {
            p = el.getAttribute('data-fm-os-icon') || '';
          }
          if (!p) return;
          const cacheKey = `${p}|${size}`;
          let dataUrl = osIconCache.get(cacheKey);
          if (!dataUrl) {
            try {
              const res = await fetchOsFileIcon(p, { size });
              dataUrl = res && res.dataUrl ? String(res.dataUrl) : '';
              if (dataUrl) osIconCache.set(cacheKey, dataUrl);
            } catch (err) {
              console.warn('[drives] getOsFileIcon:', p, err);
              return;
            }
          }
          if (token !== osIconToken || !el.isConnected || !dataUrl) return;
          const img = document.createElement('img');
          img.className = 'fm-os-icon';
          img.src = dataUrl;
          img.alt = '';
          img.draggable = false;
          el.replaceWith(img);
        }),
      );
    }

    function setStatus(left, right = '') {
      state.statusBase = { left: String(left ?? ''), right: String(right ?? '') };
      paintStatus();
    }

    function paintStatus() {
      // Saat operasi panjang (hapus/restore), prioritaskan status op — jangan tertutup "N selected".
      if (state.opBusy) {
        statusEl.innerHTML = `<span>${escapeHtml(state.statusBase.left)}</span><span>${escapeHtml(state.statusBase.right)}</span>`;
        return;
      }
      const n = state.selected.size;
      const left =
        n > 0 ? `${n} selected` : state.statusBase.left;
      statusEl.innerHTML = `<span>${escapeHtml(left)}</span><span>${escapeHtml(state.statusBase.right)}</span>`;
    }

    /** Lepas event loop supaya UI tetap bisa paint / terima input. */
    function yieldUi() {
      return new Promise((resolve) => setTimeout(resolve, 0));
    }

    /**
     * Jalankan operasi panjang tanpa memblok interaksi UI (tanpa overlay).
     * Confirm dialog tetap boleh sebelum memanggil ini.
     * @param {string} label
     * @param {() => Promise<void>} fn
     */
    async function beginFmOp(label, fn) {
      if (state.opBusy) {
        setStatus('Menunggu operasi sebelumnya…', state.path || '');
        return { ok: false, busy: true };
      }
      state.opBusy = true;
      setStatus(label, state.path || '');
      try {
        await fn();
        return { ok: true };
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        setStatus(`Gagal: ${msg}`, state.path || '');
        return { ok: false, error: msg };
      } finally {
        state.opBusy = false;
      }
    }

    /** Hapus node item dari view segera (optimistic) agar UI tidak menunggu IPC. */
    function removeItemsFromView(paths) {
      const want = new Set((paths || []).map(String).filter(Boolean));
      if (!want.size) return;
      itemEls().forEach((el) => {
        const p = el.getAttribute('data-fm-open') || '';
        if (want.has(p)) el.remove();
      });
      for (const p of want) state.selected.delete(p);
      if (state.anchorPath && want.has(state.anchorPath)) {
        state.anchorPath = state.selected.size ? [...state.selected][0] : null;
      }
      paintStatus();
    }

    function itemEls() {
      return [...viewEl.querySelectorAll('[data-fm-open]')];
    }

    function clearSelection() {
      state.selected.clear();
      state.anchorPath = null;
      syncSelectionDom();
      paintStatus();
    }

    function setSelection(paths, { anchor } = {}) {
      state.selected = new Set((paths || []).filter(Boolean).map(String));
      if (anchor !== undefined) state.anchorPath = anchor;
      else if (state.selected.size === 1) state.anchorPath = [...state.selected][0];
      syncSelectionDom();
      paintStatus();
    }

    function toggleSelection(path) {
      const p = String(path || '');
      if (!p) return;
      if (state.selected.has(p)) state.selected.delete(p);
      else state.selected.add(p);
      state.anchorPath = p;
      syncSelectionDom();
      paintStatus();
    }

    function selectRange(toPath) {
      const paths = itemEls().map((el) => el.getAttribute('data-fm-open') || '');
      const anchor = state.anchorPath || toPath;
      const a = paths.indexOf(anchor);
      const b = paths.indexOf(toPath);
      if (a < 0 || b < 0) {
        setSelection([toPath], { anchor: toPath });
        return;
      }
      const [lo, hi] = a < b ? [a, b] : [b, a];
      setSelection(paths.slice(lo, hi + 1), { anchor });
    }

    function selectAllVisible() {
      const paths = itemEls()
        .map((el) => el.getAttribute('data-fm-open') || '')
        .filter(Boolean);
      setSelection(paths, { anchor: paths[0] || null });
    }

    function syncSelectionDom() {
      itemEls().forEach((el) => {
        const p = el.getAttribute('data-fm-open') || '';
        el.classList.toggle('selected', state.selected.has(p));
      });
    }

    function selectedPaths() {
      return [...state.selected];
    }

    function isEditing() {
      return !!viewEl.querySelector('.fm-name-edit');
    }

    function persistOpenHistory() {
      return saveOpenHistory(state.openHistory, state.historyExpanded);
    }

    function pushOpenHistory(absPath, displayName) {
      const path = String(absPath || '');
      if (!path) return;
      const name = displayName || fmBasename(path);
      state.openHistory = [
        { path, name },
        ...state.openHistory.filter((x) => x.path !== path),
      ].slice(0, OPEN_HISTORY_MAX);
      paintOpenHistory();
      void persistOpenHistory();
    }

    async function removeOpenHistoryItem(absPath) {
      const path = String(absPath || '');
      if (!path) return;
      const before = state.openHistory.length;
      state.openHistory = state.openHistory.filter((x) => x.path !== path);
      if (state.openHistory.length === before) return;
      paintOpenHistory();
      const ok = await persistOpenHistory();
      setStatus(
        ok ? 'History item dihapus' : 'Hapus item — gagal simpan persist',
        path,
      );
    }

    async function clearOpenHistory() {
      if (!state.openHistory.length) return;
      state.openHistory = [];
      paintOpenHistory();
      const ok = await persistOpenHistory();
      setStatus(
        ok ? 'History dikosongkan' : 'Clear history — gagal simpan persist',
        '',
      );
    }

    /** Status jendela editor untuk item History (open / minimized / closed). */
    function editorWinState(absPath) {
      const id = osEditorWinId(absPath);
      const el =
        typeof window.findAppWindow === 'function' ? window.findAppWindow(id) : null;
      if (!(el && el.isConnected)) return 'closed';
      return el.dataset.state === 'minimized' || el.classList.contains('nx-app-window--minimized')
        ? 'minimized'
        : 'open';
    }

    function syncHistoryBadges() {
      if (!openHistoryEl) return;
      openHistoryEl.querySelectorAll('.fm-history-row').forEach((row) => {
        const btn = row.querySelector('.fm-history-item');
        const path = btn?._nxHistoryPath || '';
        if (!path) return;
        const st = editorWinState(path);
        row.classList.toggle('is-window-minimized', st === 'minimized');
        row.classList.toggle('is-window-open', st === 'open');
        if (btn) {
          btn.title =
            st === 'minimized'
              ? `${path} (minimized — klik untuk pulihkan)`
              : st === 'open'
                ? `${path} (terbuka)`
                : path;
        }
      });
    }

    /**
     * Render History + pasang onclick PER tombol (path di closure — tidak lewat
     * attribute HTML yang bisa rusak encode). MutationObserver hanya sync badge.
     */
    function paintOpenHistory() {
      if (!openHistoryEl) return;
      if (btnHistoryClear) {
        btnHistoryClear.hidden = !state.openHistory.length;
      }
      openHistoryEl.innerHTML = '';
      if (!state.openHistory.length) {
        const empty = document.createElement('div');
        empty.className = 'fm-history-empty';
        empty.textContent = 'Belum ada file dibuka';
        openHistoryEl.appendChild(empty);
      } else {
        state.openHistory.forEach((item) => {
          const st = editorWinState(item.path);
          const row = document.createElement('div');
          row.className =
            'fm-history-row' +
            (st === 'minimized' ? ' is-window-minimized' : st === 'open' ? ' is-window-open' : '');

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'fm-place fm-history-item';
          btn.title =
            st === 'minimized'
              ? `${item.path} (minimized — klik untuk pulihkan)`
              : st === 'open'
                ? `${item.path} (terbuka)`
                : item.path;
          btn._nxHistoryPath = item.path;
          btn._nxHistoryName = item.name;
          btn.setAttribute('data-path', encodeURIComponent(item.path));
          btn.setAttribute('data-fm-history', '1');
          btn.innerHTML =
            `<span class="fm-place-icon">${fileIconHtml(item.name, item.path, { size: 'sm' })}</span>` +
            `<span class="fm-history-name">${escapeHtml(item.name)}</span>` +
            `<span class="fm-history-dot" aria-hidden="true"></span>`;

          btn.onclick = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            setStatus(`History: ${item.name}`, item.path);
            void openFmEntry(item.path, item.name, 'file', { fromHistory: true });
          };

          const rm = document.createElement('button');
          rm.type = 'button';
          rm.className = 'fm-history-remove';
          rm.title = `Hapus dari history: ${item.name}`;
          rm.setAttribute('aria-label', `Hapus ${item.name}`);
          rm.setAttribute('data-fm-history-remove', encodeURIComponent(item.path));
          rm.innerHTML = '<i class="icon-ic_fluent_dismiss_16_regular" aria-hidden="true"></i>';
          rm.onclick = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            removeOpenHistoryItem(item.path);
          };

          row.appendChild(btn);
          row.appendChild(rm);
          openHistoryEl.appendChild(row);
        });
      }
      applyHistoryScrollHeight();
    }

    /** Sync tombol chevron + class collapsed pada section History. */
    function applyHistoryExpanded({ persist = false } = {}) {
      const section =
        historySectionEl || container.querySelector('#fm-history-section');
      const scrollEl =
        historyScrollEl || container.querySelector('#fm-history-scroll');
      const open = !!state.historyExpanded;
      if (section) section.classList.toggle('is-collapsed', !open);
      if (scrollEl) scrollEl.hidden = !open;
      if (btnHistoryToggle) {
        btnHistoryToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        btnHistoryToggle.title = open ? 'Tutup History' : 'Buka History';
        const icon = btnHistoryToggle.querySelector('i');
        if (icon) {
          icon.className = open
            ? 'icon-ic_fluent_chevron_down_16_regular'
            : 'icon-ic_fluent_chevron_right_16_regular';
        }
      }
      applyHistoryScrollHeight();
      if (persist) void persistOpenHistory();
    }

    /**
     * Panel History di dalam #fm-sidebar-scroll.
     * Collapse → height 0; buka → max-height CSS (bukan fill sisa sidebar).
     * .nx-scroll: #fm-sidebar-scroll (sidebar) + #fm-history-scroll (daftar).
     */
    function applyHistoryScrollHeight() {
      const scrollEl =
        historyScrollEl || container.querySelector('#fm-history-scroll');
      if (!scrollEl) return;
      scrollEl.classList.add('nx-scroll');
      if (!state.historyExpanded || scrollEl.hidden) {
        scrollEl.style.height = '0';
        scrollEl.style.maxHeight = '0';
        scrollEl.style.minHeight = '0';
        return;
      }
      scrollEl.style.height = '';
      scrollEl.style.maxHeight = '';
      scrollEl.style.minHeight = '';
      scrollEl.style.overflowY = '';
      scrollEl.style.overflowX = '';
    }

    /**
     * Buka .lnk/.exe via OS (nxcode25 openExternal / launchShortcut).
     * @param {string} absPath
     * @param {string} [displayName]
     */
    async function openExternalOs(absPath, displayName) {
      const p = String(absPath || '');
      const name = displayName || fmBasename(p);
      if (!p) return;
      setStatus(`Launching: ${name}`, p);
      try {
        let res;
        if (typeof window.openOsPath === 'function') {
          res = await window.openOsPath(p);
        } else if (window.electronAPI?.openOsPath) {
          const raw = await window.electronAPI.openOsPath({ path: p });
          if (!raw?.ok) throw new Error(raw?.error || 'openOsPath gagal');
          res = raw;
        } else {
          throw new Error('openOsPath belum siap (restart Electron)');
        }
        setStatus(`Opened: ${name}`, res?.source || p);
      } catch (err) {
        console.warn('[drives] openOsPath:', p, err);
        setStatus(`Cannot open: ${name}`, String(err && err.message ? err.message : err));
      }
    }

    /**
     * Buka entry FM: folder → navigate; .lnk/exe → OS; lain → viewer/editor.
     * @param {string} absPath
     * @param {string} [displayName]
     * @param {string} [type]
     * @param {{ fromHistory?: boolean }} [opts]
     */
    async function openFmEntry(absPath, displayName, type, opts = {}) {
      const p = String(absPath || '');
      if (!p) return;
      const name = displayName || fmBasename(p);
      if (type === 'directory') {
        await navigate(p);
        return;
      }
      if (shouldOpenExternally(name) || shouldOpenExternally(p)) {
        await openExternalOs(p, name);
        return;
      }
      await openOsFile(p, name, opts);
    }

    /**
     * Buka file di jendela app TERPISAH per path (teks / markdown / gambar).
     * @param {string} absPath
     * @param {string} [displayName]
     * @param {{ fromHistory?: boolean }} [opts]
     */
    async function openOsFile(absPath, displayName, opts = {}) {
      const p = String(absPath || '');
      if (!p) return;
      const name = displayName || fmBasename(p);
      const can =
        typeof window.canOpenInFileViewer === 'function'
          ? window.canOpenInFileViewer(name)
          : typeof window.canOpenInTextEditor === 'function'
            ? window.canOpenInTextEditor(name)
            : true;
      if (!can) {
        setStatus(`Tidak bisa dibuka di sini: ${name}`, p);
        return;
      }
      if (typeof window.openFileEditor !== 'function') {
        setStatus(`Editor belum siap: ${name}`, p);
        return;
      }
      if (typeof window.openAppWindow !== 'function') {
        setStatus(`openAppWindow belum siap: ${name}`, p);
        return;
      }

      const winId = osEditorWinId(p);
      pushOpenHistory(p, name);

      const existing =
        typeof window.findAppWindow === 'function' ? window.findAppWindow(winId) : null;

      // Restore jendela hidup (minimized) tanpa remount — kecuali dari History
      // dan restore gagal terlihat, lanjut buka/remount di bawah.
      if (existing && existing.isConnected && !opts.fromHistory) {
        const mount = existing.querySelector('.nx-os-editor-mount');
        const hasEditor =
          !!mount &&
          (!!mount.querySelector('.nx-file-viewer, .nexacmirror6-wrap') ||
            String(mount.id || '').startsWith('nx-file-viewer-editor') ||
            mount.getAttribute('data-nx-file-editor') === '1' ||
            mount.getAttribute('data-nx-file-editor') === 'image' ||
            mount.getAttribute('data-nx-file-editor') === 'pdf');
        if (hasEditor) {
          if (typeof window.restoreAppWindow === 'function') {
            window.restoreAppWindow(existing);
          } else {
            window.bringAppWindowToFront?.(existing);
            await window.setAppWindowState?.('normal', existing);
          }
          setStatus(`Focused: ${name}`, p);
          syncHistoryBadges();
          return;
        }
      }

      if (existing && existing.isConnected && opts.fromHistory) {
        if (typeof window.restoreAppWindow === 'function') {
          window.restoreAppWindow(existing);
        }
        const mount = existing.querySelector('.nx-os-editor-mount');
        const hasEditor =
          !!mount &&
          (!!mount.querySelector('.nx-file-viewer, .nexacmirror6-wrap') ||
            String(mount.id || '').startsWith('nx-file-viewer-editor') ||
            mount.getAttribute('data-nx-file-editor') === 'image' ||
            mount.getAttribute('data-nx-file-editor') === 'pdf');
        // Kalau editor masih ada & jendela terlihat — cukup restore.
        if (
          hasEditor &&
          existing.dataset.state !== 'minimized' &&
          !existing.classList.contains('nx-app-window--minimized')
        ) {
          setStatus(`Restored: ${name}`, p);
          syncHistoryBadges();
          return;
        }
      }

      setStatus(`Opening: ${name}`, p);
      let win;
      try {
        win = await window.openAppWindow({
          id: winId,
          title: name,
          animate: true,
          reuse: true,
        });
      } catch (err) {
        console.error('[drives] openAppWindow:', err);
        setStatus(`Gagal buka jendela: ${name}`, String(err && err.message));
        return;
      }
      const body = win?.body;
      if (!body) {
        setStatus(`Gagal buka jendela editor: ${name}`, p);
        return;
      }

      if (win.el && typeof window.restoreAppWindow === 'function') {
        window.restoreAppWindow(win.el);
      } else if (win.el) {
        win.el.classList.remove('nx-app-window--minimized');
        win.el.dataset.state = 'normal';
        window.bringAppWindowToFront?.(win.el);
      }

      body.classList.add('has-nx-os-editor-layout');
      body.classList.remove('has-nx-drives-layout', 'nx-scroll');
      body.style.setProperty('overflow', 'hidden', 'important');
      body.innerHTML =
        `<div class="nx-os-editor-shell">` +
        `<div class="nx-os-editor-mount"></div>` +
        `</div>`;

      const titleEl = win.el?.querySelector?.('.nx-app-window__title');
      if (titleEl) titleEl.textContent = name;

      const mount = body.querySelector('.nx-os-editor-mount');
      try {
        await window.openFileEditor(p, mount, { io: 'os' });
        setStatus(`Opened: ${name}`, p);
      } catch (err) {
        console.error('[drives] openFileEditor:', err);
        setStatus(`Gagal baca file: ${name}`, err && err.message ? err.message : String(err));
      }
      syncHistoryBadges();
    }

    function setDriveClipboard(mode, paths) {
      const list = (paths || []).filter(Boolean).map(String);
      if (!list.length) return;
      window.__nxDriveClipboard = { mode, paths: list };
    }

    function getDriveClipboard() {
      return window.__nxDriveClipboard || null;
    }

    function syncCwdAttrs() {
      const cwd = state.path || '';
      const app = container.querySelector('#nx-drives-app');
      if (app) app.setAttribute('data-fm-cwd', cwd);
      if (viewEl) {
        // id membawa cwd: buildMenu di main process tidak punya akses DOM.
        viewEl.id = nxDriveCwdId(cwd);
        viewEl.setAttribute('data-fm-cwd', cwd);
      }
    }

    function breadcrumbSegIcon(seg, index, total) {
      const isRoot = index === 0;
      const isCurrent = index === total - 1;
      if (isRoot) {
        const want = String(seg.label || '')
          .toUpperCase()
          .replace(/[/\\]+$/, '');
        const drive = (state.drives || []).find((d) => {
          const id = String(d.id || '')
            .toUpperCase()
            .replace(/[/\\]+$/, '');
          const p = String(d.path || `${d.id}\\`)
            .replace(/[/\\]+$/, '')
            .toUpperCase();
          const sp = String(seg.path || '')
            .replace(/[/\\]+$/, '')
            .toUpperCase();
          return id === want || p === sp;
        });
        if (drive) return driveIconHtml(drive, { size: 'sm' });
        return (
          `<img class="fm-folder-icon fm-device-icon fm-folder-icon--sm"` +
          ` src="${DEVICES_BASE}/drive-harddisk.png" alt="" draggable="false" />`
        );
      }
      return folderIconHtml(seg.label, { size: 'sm', open: isCurrent });
    }

    function paintBreadcrumb() {
      const segs = pathSegments(state.path);
      if (!state.path || !segs.length) {
        breadcrumb.hidden = true;
        breadcrumb.innerHTML = '';
        breadcrumb.style.display = 'none';
        return;
      }
      breadcrumb.hidden = false;
      breadcrumb.style.display = 'flex';
      const n = segs.length;
      breadcrumb.innerHTML = segs
        .map((s, i) => {
          const cur = i === n - 1;
          const sep =
            i > 0
              ? `<span class="fm-bc-sep" aria-hidden="true"><i class="icon-ic_fluent_chevron_right_12_regular"></i></span>`
              : '';
          return (
            sep +
            `<button type="button"` +
            ` class="fm-bc-seg${cur ? ' is-current' : ''}"` +
            ` data-fm-nav="${escapeHtml(s.path)}"` +
            ` title="${escapeHtml(s.path)}"` +
            (cur ? ' aria-current="location"' : '') +
            `>` +
            `<span class="fm-bc-icon">${breadcrumbSegIcon(s, i, n)}</span>` +
            `<span class="fm-bc-label">${escapeHtml(s.label)}</span>` +
            `</button>`
          );
        })
        .join('');
    }

    function updateChrome() {
      const recycle =
        /^nx:recycle-bin$/i.test(state.path) ||
        /^shell:recyclebinfolder$/i.test(state.path);
      pathbar.value = recycle ? 'Recycle Bin' : state.path || '';
      pathbar.placeholder = state.path ? (recycle ? 'Recycle Bin' : state.path) : 'This PC';
      btnBack.disabled = state.histIdx <= 0;
      btnForward.disabled = state.histIdx >= state.history.length - 1;
      btnUp.disabled = !state.path;
      btnGrid.classList.toggle('active', state.view === 'grid');
      btnList.classList.toggle('active', state.view === 'list');
      updateSearchChrome();
      syncCwdAttrs();
      paintBreadcrumb();

      container.querySelectorAll('.fm-place[data-fm-nav]').forEach((el) => {
        const navPath = el.getAttribute('data-fm-nav') ?? '';
        el.classList.toggle('active', navPath === state.path);
      });
    }

    function renderPlacesSidebar() {
      if (!placesEl) return;
      if (!state.places.length) {
        placesEl.innerHTML = '';
        return;
      }
      placesEl.innerHTML = state.places
        .map((p) => {
          const path = p.path || '';
          const kind = p.kind || resolveFolderKind(p.name);
          const title =
            p.special === 'recycleBin' || p.key === 'trash'
              ? `${p.name} — isi di File Manager`
              : path;
          return (
            `<button type="button" class="fm-place" data-fm-nav="${escapeHtml(path)}" title="${escapeHtml(title)}">` +
            `<span class="fm-place-icon">${folderIconHtml(p.name, { size: 'sm', kind })}</span>` +
            `<span>${escapeHtml(p.name || p.key)}</span>` +
            `</button>`
          );
        })
        .join('');
    }

    function renderDrivesSidebar() {
      if (!state.drives.length) {
        drivesEl.innerHTML = '';
        return;
      }
      drivesEl.innerHTML =
        `<div class="fm-section-label">Drives</div>` +
        state.drives
          .map((d) => {
            const path = d.path || `${d.id}\\`;
            return (
              `<button type="button" class="fm-place" data-fm-nav="${escapeHtml(path)}">` +
              `<span class="fm-place-icon">${driveIconHtml(d, { size: 'sm' })}</span>` +
              `<span>${escapeHtml(d.name || d.id)}</span>` +
              `<span style="margin-left:auto;font-size:11px">${escapeHtml(formatBytes(d.freeSpace))}</span>` +
              `</button>`
            );
          })
          .join('');
    }

    function updateSearchChrome() {
      const atRoot = !state.path;
      if (btnSearchRecursive) {
        btnSearchRecursive.disabled = atRoot;
        const on = !!state.searchRecursive && !atRoot;
        btnSearchRecursive.classList.toggle('active', on);
        btnSearchRecursive.setAttribute('aria-pressed', on ? 'true' : 'false');
        btnSearchRecursive.title = atRoot
          ? 'Search subfolders (buka drive/folder dulu)'
          : on
            ? 'Subfolders on'
            : 'Search subfolders';
      }
      if (btnSearchClear) {
        btnSearchClear.hidden = !String(state.searchQuery || '').length;
      }
      if (searchWrap) {
        searchWrap.classList.toggle('has-query', !!String(state.searchQuery || '').trim());
        searchWrap.classList.toggle('is-recursive', !!state.searchRecursive && !atRoot);
      }
    }

    function clearSearch({ skipRender = false } = {}) {
      state.searchQuery = '';
      state.searchResults = null;
      state.searchToken += 1;
      state.error = '';
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = null;
      }
      if (searchInput) searchInput.value = '';
      updateSearchChrome();
      if (!skipRender) renderView();
    }

    /** Parent relatif ke folder aktif (untuk hasil search rekursif). */
    function searchParentLabel(itemPath) {
      const root = String(state.path || '').replace(/[/\\]+$/, '');
      const parent = parentPath(itemPath);
      if (!parent) return '';
      if (!root) return parent;
      const rootL = root.toLowerCase();
      const parentNorm = parent.replace(/[/\\]+$/, '');
      const parentL = parentNorm.toLowerCase();
      if (parentL === rootL) return '.';
      const sep = '\\';
      if (parentL.startsWith(rootL + sep) || parentL.startsWith(rootL + '/')) {
        return parentNorm.slice(root.length).replace(/^[/\\]+/, '') || '.';
      }
      return parentNorm;
    }

    function nameHitsQuery(name, q) {
      return String(name || '')
        .toLowerCase()
        .includes(q);
    }

    /**
     * Item yang ditampilkan di view.
     * @returns {{ mode: 'drives'|'entries', items: any[], showSearchPath: boolean, query: string }}
     */
    function displayPayload() {
      const q = String(state.searchQuery || '').trim().toLowerCase();
      if (!q) {
        if (!state.path) {
          return {
            mode: 'drives',
            items: sortFmItems('drives', state.drives),
            showSearchPath: false,
            query: '',
          };
        }
        return {
          mode: 'entries',
          items: sortFmItems('entries', state.children),
          showSearchPath: false,
          query: '',
        };
      }

      // Mode hasil IPC (Subfolders / Enter)
      if (state.searchResults !== null) {
        return {
          mode: 'entries',
          items: sortFmItems('entries', state.searchResults),
          showSearchPath: true,
          query: q,
        };
      }

      // Filter lokal cwd / nama drive
      if (!state.path) {
        const items = state.drives.filter((d) => {
          const label = `${d.name || ''} ${d.id || ''}`;
          return nameHitsQuery(label, q);
        });
        return {
          mode: 'drives',
          items: sortFmItems('drives', items),
          showSearchPath: false,
          query: q,
        };
      }
      const items = state.children.filter((n) => nameHitsQuery(n.name, q));
      return { mode: 'entries', items: sortFmItems('entries', items), showSearchPath: false, query: q };
    }

    /**
     * Sort daftar FM (dirs dulu untuk entries).
     * @param {'drives'|'entries'} mode
     * @param {object[]} items
     */
    function sortFmItems(mode, items) {
      const key = state.sortKey || 'name';
      const dirMul = state.sortDir === 'desc' ? -1 : 1;
      const list = (items || []).slice();
      list.sort((a, b) => {
        if (mode === 'entries') {
          const ad = a.type === 'directory' ? 0 : 1;
          const bd = b.type === 'directory' ? 0 : 1;
          if (ad !== bd) return ad - bd;
        }
        let cmp = 0;
        if (key === 'size') {
          if (mode === 'drives') {
            cmp = (Number(a.freeSpace) || 0) - (Number(b.freeSpace) || 0);
          } else {
            cmp = (Number(a.size) || 0) - (Number(b.size) || 0);
          }
        } else if (key === 'mtime') {
          cmp = (Number(a.mtime) || 0) - (Number(b.mtime) || 0);
        } else if (key === 'type') {
          const at =
            mode === 'drives'
              ? String(a.driveTypeLabel || a.driveType || '')
              : String(a.type || '');
          const bt =
            mode === 'drives'
              ? String(b.driveTypeLabel || b.driveType || '')
              : String(b.type || '');
          cmp = at.localeCompare(bt, undefined, { sensitivity: 'base' });
        } else {
          const an =
            mode === 'drives' ? String(a.name || a.id || '') : String(a.name || '');
          const bn =
            mode === 'drives' ? String(b.name || b.id || '') : String(b.name || '');
          cmp = an.localeCompare(bn, undefined, { sensitivity: 'base', numeric: true });
        }
        return cmp * dirMul;
      });
      return list;
    }

    function sortHeaderLabel(key, label) {
      if (state.sortKey !== key) {
        return `<button type="button" class="fm-sort" data-fm-sort="${escapeHtml(key)}">${escapeHtml(label)}</button>`;
      }
      const mark = state.sortDir === 'desc' ? ' ↓' : ' ↑';
      return `<button type="button" class="fm-sort is-active" data-fm-sort="${escapeHtml(key)}" aria-sort="${state.sortDir === 'desc' ? 'descending' : 'ascending'}">${escapeHtml(label)}${mark}</button>`;
    }

    function toggleSort(key) {
      const k = String(key || 'name');
      if (state.sortKey === k) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortKey = k;
        state.sortDir = 'asc';
      }
      renderView();
    }

    function scheduleRecursiveSearch() {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      const token = ++state.searchToken;
      searchDebounceTimer = setTimeout(() => {
        searchDebounceTimer = null;
        void runRecursiveSearch(token);
      }, 250);
    }

    async function runRecursiveSearch(token) {
      const q = String(state.searchQuery || '').trim();
      if (!q || !state.path) return;
      if (token !== state.searchToken) return;
      if (typeof window.searchDir !== 'function') {
        state.error = 'window.searchDir belum siap';
        state.searchResults = [];
        renderView();
        return;
      }

      state.loading = true;
      state.error = '';
      renderView();
      try {
        const res = await window.searchDir(state.path, { query: q });
        if (token !== state.searchToken) return;
        state.searchResults = Array.isArray(res.matches) ? res.matches : [];
        state.error = '';
      } catch (err) {
        if (token !== state.searchToken) return;
        state.searchResults = [];
        state.error = err && err.message ? err.message : String(err);
      } finally {
        if (token === state.searchToken) {
          state.loading = false;
          renderView();
          updateChrome();
        }
      }
    }

    function onSearchQueryChange() {
      state.searchQuery = searchInput ? searchInput.value : '';
      updateSearchChrome();
      const q = String(state.searchQuery || '').trim();
      if (!q) {
        state.searchResults = null;
        state.searchToken += 1;
        if (searchDebounceTimer) {
          clearTimeout(searchDebounceTimer);
          searchDebounceTimer = null;
        }
        renderView();
        return;
      }
      if (state.searchRecursive && state.path) {
        scheduleRecursiveSearch();
      } else {
        state.searchResults = null;
        state.error = '';
        renderView();
      }
    }

    /** Spinner kernel di overlay `.ubuntu-fm-content` — tidak di dalam grid/list. */
    let viewSpinner = null;

    function hideViewSpinner() {
      if (viewSpinner) {
        try {
          viewSpinner.destroy();
        } catch (_) {
          /* ignore */
        }
        viewSpinner = null;
      }
      if (loadingHostEl) {
        loadingHostEl.hidden = true;
        loadingHostEl.replaceChildren();
      }
      if (viewEl) viewEl.classList.remove('is-loading');
      const content = container.querySelector('#fm-content');
      if (content) content.classList.remove('is-loading');
    }

    function showViewSpinner() {
      hideViewSpinner();
      const host = loadingHostEl;
      const content = container.querySelector('#fm-content');
      if (!host) return;
      host.hidden = false;
      host.replaceChildren();
      if (content) content.classList.add('is-loading');
      if (viewEl) viewEl.classList.add('is-loading');
      const make =
        typeof window.NXUI?.spinner === 'function' ? window.NXUI.spinner : null;
      if (!make) return;
      // Samakan warna dengan sesi App.js → NXUI.Tatiye({ spinner: { color } }) / nexaRoute.spinnerConfig
      const routeSpin = window.nexaRoute?.spinnerConfig;
      const color =
        (routeSpin && typeof routeSpin.color === 'string' && routeSpin.color) ||
        '#CB2F2F';
      const size =
        (routeSpin && typeof routeSpin.size === 'string' && routeSpin.size) ||
        'medium';
      viewSpinner = make({
        target: host,
        type: 'inline',
        size,
        color,
        position: 'center',
        autoShow: true,
      });
    }

    function renderView() {
      viewEl.className = state.view === 'list' ? 'ubuntu-fm-list' : 'ubuntu-fm-grid';
      viewEl.classList.toggle('has-empty', false);

      if (state.loading) {
        showViewSpinner();
        return;
      }
      hideViewSpinner();
      if (state.error) {
        viewEl.classList.add('has-empty');
        viewEl.innerHTML = `<div class="ubuntu-fm-empty"><div class="fm-empty-text">${escapeHtml(state.error)}</div></div>`;
        return;
      }

      const { mode, items, showSearchPath, query } = displayPayload();
      const searching = !!query;

      if (mode === 'drives') {
        if (!items.length) {
          viewEl.classList.add('has-empty');
          viewEl.innerHTML = `<div class="ubuntu-fm-empty"><div class="fm-empty-text">${
            searching ? 'Tidak ada drive yang cocok' : 'Tidak ada drive'
          }</div></div>`;
          setStatus(searching ? '0 hasil' : 'Tidak ada drive', 'This PC');
          clearSelection();
          return;
        }
        if (state.view === 'list') {
          viewEl.innerHTML =
            `<div class="fm-list-header">` +
            `<span class="fm-sort-wrap" style="flex:1">${sortHeaderLabel('name', 'Name')}</span>` +
            `<span class="fm-sort-wrap" style="width:72px;text-align:right">${sortHeaderLabel('size', 'Free')}</span>` +
            `<span class="fm-sort-wrap" style="width:130px;text-align:right">${sortHeaderLabel('type', 'Type')}</span>` +
            `</div>` +
            items
              .map((d) => {
                const path = d.path || `${d.id}\\`;
                const tid = nxDriveTargetId(path, 'drive');
                return (
                  `<div class="fm-list-item" id="${escapeHtml(tid)}" data-fm-open="${escapeHtml(path)}" data-fm-type="directory" data-fm-kind="drive" tabindex="0">` +
                  `<span class="fm-icon">${driveIconHtml(d, { size: 'md' })}</span>` +
                  `<span class="fm-name">${escapeHtml(d.name || d.id)} (${escapeHtml(d.id)})</span>` +
                  `<span class="fm-size">${escapeHtml(formatBytes(d.freeSpace))}</span>` +
                  `<span class="fm-date">${escapeHtml(d.driveTypeLabel || '')}</span>` +
                  `</div>`
                );
              })
              .join('');
        } else {
          viewEl.innerHTML = items
            .map((d) => {
              const path = d.path || `${d.id}\\`;
              const tid = nxDriveTargetId(path, 'drive');
              return (
                `<div class="fm-item" id="${escapeHtml(tid)}" data-fm-open="${escapeHtml(path)}" data-fm-type="directory" data-fm-kind="drive" tabindex="0">` +
                `<div class="fm-icon">${driveIconHtml(d, { size: 'lg' })}</div>` +
                `<div class="fm-name">${escapeHtml(d.name || d.id)}</div>` +
                `<div class="fm-drive-info">${escapeHtml(d.id)} · ${escapeHtml(formatBytes(d.freeSpace))} free</div>` +
                `</div>`
              );
            })
            .join('');
        }
        setStatus(
          searching ? `${items.length} hasil` : `${items.length} drive`,
          'This PC',
        );
        clearSelection();
        return;
      }

      // entries (folder / hasil search)
      if (!items.length) {
        viewEl.classList.add('has-empty');
        const emptyMsg = searching
          ? 'Tidak ada hasil'
          : 'Folder kosong';
        viewEl.innerHTML = `<div class="ubuntu-fm-empty"><img class="fm-folder-icon fm-folder-icon--lg" src="${folderIconUrl('', { open: true })}" alt="" /><div class="fm-empty-text">${emptyMsg}</div></div>`;
        setStatus(searching ? '0 hasil' : 'Kosong', state.path);
        clearSelection();
        return;
      }

      const nameCell = (n) => {
        const loc =
          showSearchPath
            ? `<span class="fm-search-path">${escapeHtml(searchParentLabel(n.path))}</span>`
            : '';
        return (
          `<span class="fm-name">${escapeHtml(n.name)}${loc ? loc : ''}</span>`
        );
      };
      const nameBlock = (n) => {
        const loc =
          showSearchPath
            ? `<div class="fm-search-path">${escapeHtml(searchParentLabel(n.path))}</div>`
            : '';
        return (
          `<div class="fm-name">${escapeHtml(n.name)}</div>${loc}`
        );
      };

      if (state.view === 'list') {
        viewEl.innerHTML =
          `<div class="fm-list-header">` +
          `<span class="fm-sort-wrap" style="flex:1">${sortHeaderLabel('name', 'Name')}</span>` +
          `<span class="fm-sort-wrap" style="width:72px;text-align:right">${sortHeaderLabel('size', 'Size')}</span>` +
          `<span class="fm-sort-wrap" style="width:130px;text-align:right">${sortHeaderLabel('mtime', 'Modified')}</span>` +
          `</div>` +
          items
            .map((n) => {
              const isDir = n.type === 'directory';
              const icon = isDir
                ? folderIconHtml(n.name, { size: 'md' })
                : fileIconHtml(n.name, n.path, { size: 'md' });
              const tid = nxDriveTargetId(n.path, isDir ? 'directory' : 'file');
              const recycleAttr =
                n.recycle || /^nx:recycle-bin$/i.test(state.path)
                  ? ' data-fm-recycle="1"'
                  : '';
              return (
                `<div class="fm-list-item" id="${escapeHtml(tid)}" data-fm-open="${escapeHtml(n.path)}" data-fm-type="${escapeHtml(n.type)}" data-fm-kind="entry" data-fm-name="${escapeHtml(n.name)}"${recycleAttr} tabindex="0" draggable="true">` +
                `<span class="fm-icon">${icon}</span>` +
                nameCell(n) +
                `<span class="fm-size">${isDir ? '—' : escapeHtml(formatBytes(n.size))}</span>` +
                `<span class="fm-date">${escapeHtml(formatDate(n.mtime))}</span>` +
                `</div>`
              );
            })
            .join('');
      } else {
        viewEl.innerHTML = items
          .map((n) => {
            const isDir = n.type === 'directory';
            const icon = isDir
              ? folderIconHtml(n.name, { size: 'lg' })
              : fileIconHtml(n.name, n.path, { size: 'lg' });
            const tid = nxDriveTargetId(n.path, isDir ? 'directory' : 'file');
            const recycleAttr =
              n.recycle || /^nx:recycle-bin$/i.test(state.path)
                ? ' data-fm-recycle="1"'
                : '';
            return (
              `<div class="fm-item" id="${escapeHtml(tid)}" data-fm-open="${escapeHtml(n.path)}" data-fm-type="${escapeHtml(n.type)}" data-fm-kind="entry" data-fm-name="${escapeHtml(n.name)}"${recycleAttr} tabindex="0" draggable="true">` +
              `<div class="fm-icon">${icon}</div>` +
              nameBlock(n) +
              `</div>`
            );
          })
          .join('');
      }

      const dirs = items.filter((c) => c.type === 'directory').length;
      const files = items.length - dirs;
      setStatus(
        searching
          ? `${items.length} hasil · ${dirs} folder · ${files} file`
          : `${items.length} item · ${dirs} folder · ${files} file`,
        state.path,
      );
      const alive = new Set(items.map((c) => c.path));
      state.selected = new Set([...state.selected].filter((p) => alive.has(p)));
      syncSelectionDom();
      paintStatus();
      void hydrateOsFileIcons();
    }

    async function loadDrives() {
      if (typeof window.listDrives !== 'function') {
        throw new Error('window.listDrives belum siap');
      }
      state.drives = await window.listDrives();
      renderDrivesSidebar();
      await loadUserPlaces();
    }

    async function loadUserPlaces() {
      if (typeof window.listUserPlaces !== 'function') {
        state.places = [];
        renderPlacesSidebar();
        return;
      }
      try {
        state.places = await window.listUserPlaces();
      } catch (err) {
        console.warn('[drives] listUserPlaces:', err);
        state.places = [];
      }
      renderPlacesSidebar();
      updateChrome();
    }

    async function navigate(toPath, { push = true } = {}) {
      const next = String(toPath || '');
      clearSearch({ skipRender: true });
      state.loading = true;
      state.error = '';
      state.selected.clear();
      state.anchorPath = null;
      renderView();
      updateChrome();
      try {
        if (!next) {
          await loadDrives();
          state.children = [];
          state.path = '';
        } else {
          if (typeof window.listDir !== 'function') {
            throw new Error('window.listDir belum siap');
          }
          const res = await window.listDir(next, {
            includeHidden: !!state.includeHidden,
          });
          state.path = res.path || next;
          state.children = Array.isArray(res.children) ? res.children : [];
        }
        if (push) {
          state.history = state.history.slice(0, state.histIdx + 1);
          state.history.push(state.path);
          state.histIdx = state.history.length - 1;
        }
        replaceFmSessionState();
        void syncFmWatch(state.path);
      } catch (err) {
        state.error = err && err.message ? err.message : String(err);
        state.children = [];
        void syncFmWatch('');
      } finally {
        state.loading = false;
        renderView();
        updateChrome();
      }
    }

    /** @type {{ stop: () => Promise<unknown> }|null} */
    let fmWatcher = null;
    let fmWatchPath = '';
    let fmWatchTimer = null;

    async function stopFmWatch() {
      if (fmWatchTimer) {
        clearTimeout(fmWatchTimer);
        fmWatchTimer = null;
      }
      const w = fmWatcher;
      fmWatcher = null;
      fmWatchPath = '';
      if (w && typeof w.stop === 'function') {
        try {
          await w.stop();
        } catch (_) {
          /* ignore */
        }
      }
    }

    /**
     * Live refresh folder aktif (chokidar). This PC (path kosong) = stop.
     * @param {string} absPath
     */
    async function syncFmWatch(absPath) {
      const next = String(absPath || '');
      if (!next || /^nx:recycle-bin$/i.test(next) || /^shell:/i.test(next)) {
        await stopFmWatch();
        return;
      }
      if (fmWatchPath === next && fmWatcher) return;
      await stopFmWatch();
      if (typeof window.watch !== 'function') return;
      try {
        fmWatchPath = next;
        fmWatcher = await window.watch(next, { recursive: false }, () => {
          if (fmWatchTimer) clearTimeout(fmWatchTimer);
          fmWatchTimer = setTimeout(() => {
            fmWatchTimer = null;
            if (state.path !== next || state.loading) return;
            if (typeof isEditing === 'function' && isEditing()) return;
            void navigate(next, { push: false });
          }, 450);
        });
      } catch (err) {
        fmWatcher = null;
        fmWatchPath = '';
        console.warn('[drives] watch:', err);
      }
    }

    function goHistory(delta) {
      const i = state.histIdx + delta;
      if (i < 0 || i >= state.history.length) return;
      state.histIdx = i;
      navigate(state.history[i], { push: false });
    }

    /**
     * Sesi history FM di jendela Files — mouse back/forward & Alt+←/→
     * harus pakai state.history, BUKAN window.history rute package lain
     * (NexaRoute popstate).
     */
    const fmSessionHref = String(location.href || '');
    let fmHistNavLock = false;

    function isDrivesSessionActive() {
      if (!container?.isConnected) return false;
      const app = container.querySelector('#nx-drives-app');
      if (!app) return false;
      const win =
        typeof window.getActiveAppWindow === 'function'
          ? window.getActiveAppWindow()
          : null;
      if (win && win.isConnected) {
        if (win.contains(app) || win.contains(container)) return true;
        // Jendela lain aktif — jangan curi history
        return false;
      }
      return true;
    }

    function replaceFmSessionState() {
      try {
        const prev =
          history.state && typeof history.state === 'object' ? { ...history.state } : {};
        history.replaceState(
          {
            ...prev,
            nxDrivesFm: true,
            path: state.path,
            histIdx: state.histIdx,
          },
          '',
          fmSessionHref || location.href,
        );
      } catch (_) {
        /* ignore */
      }
    }

    /** Mouse X1/X2 (button 3/4) → history FM, bukan rute package lain. */
    function onFmMouseHistory(ev) {
      if (ev.button !== 3 && ev.button !== 4) return;
      if (!isDrivesSessionActive()) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (ev.type !== 'mouseup' && ev.type !== 'auxclick') return;
      if (fmHistNavLock) return;
      fmHistNavLock = true;
      try {
        if (ev.button === 3) goHistory(-1);
        else goHistory(1);
      } finally {
        queueMicrotask(() => {
          fmHistNavLock = false;
        });
      }
    }

    function onFmKeyHistory(ev) {
      if (!isDrivesSessionActive()) return;
      if (!ev.altKey) return;
      if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
      const tag = String(ev.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || ev.target?.isContentEditable) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (ev.key === 'ArrowLeft') goHistory(-1);
      else goHistory(1);
    }

    /**
     * Blokir NexaRoute popstate selama jendela Files aktif — jangan lompat
     * ke rute package lain. State `nxDrivesFm` → terapkan path sesi FM.
     */
    function onFmPopState(ev) {
      if (!isDrivesSessionActive()) return;
      ev.stopImmediatePropagation();
      const st = ev.state;
      if (st && st.nxDrivesFm === true && typeof st.path === 'string') {
        if (typeof st.histIdx === 'number' && Number.isFinite(st.histIdx)) {
          state.histIdx = Math.max(
            0,
            Math.min(state.history.length - 1, st.histIdx),
          );
        }
        void navigate(st.path, { push: false });
        return;
      }
      // History asing → kembalikan URL/state sesi FM
      replaceFmSessionState();
    }

    window.addEventListener('mousedown', onFmMouseHistory, true);
    window.addEventListener('mouseup', onFmMouseHistory, true);
    window.addEventListener('auxclick', onFmMouseHistory, true);
    window.addEventListener('keydown', onFmKeyHistory, true);
    window.addEventListener('popstate', onFmPopState, true);
    replaceFmSessionState();

    async function deletePaths(paths) {
      const list = (paths || []).filter((p) => {
        if (!p) return false;
        const s = String(p).replace(/\//g, '\\');
        return !/^[a-zA-Z]:\\?$/.test(s);
      });
      if (!list.length) return;

      const inRecycle =
        /^nx:recycle-bin$/i.test(state.path) ||
        /^shell:recyclebinfolder$/i.test(state.path) ||
        list.every((p) => /\\\$recycle\.bin\\/i.test(String(p).replace(/\//g, '\\')));

      if (inRecycle) {
        const label = list.length === 1 ? list[0] : `${list.length} item`;
        if (
          !window.confirm(
            `Hapus permanen ${label}? Tindakan ini tidak bisa dibatalkan.`,
          )
        ) {
          return;
        }
        removeItemsFromView(list);
        void beginFmOp(`Menghapus permanen ${list.length} item…`, async () => {
          if (typeof window.permanentlyDeleteRecycleItems !== 'function') {
            throw new Error('permanentlyDeleteRecycleItems tidak tersedia');
          }
          const res = await window.permanentlyDeleteRecycleItems(list);
          await navigate(state.path, { push: false });
          if (res?.failed?.length) {
            setStatus(
              `Selesai · ${res.failed.length} gagal`,
              state.path || '',
            );
          } else {
            setStatus('Siap', state.path || '');
          }
        });
        return;
      }

      const label = list.length === 1 ? list[0] : `${list.length} item`;
      if (!window.confirm(`Hapus ${label}? Tindakan ini tidak bisa dibatalkan.`)) return;
      removeItemsFromView(list);
      void beginFmOp(`Menghapus ${list.length} item…`, async () => {
        const errors = [];
        for (let i = 0; i < list.length; i++) {
          const p = list[i];
          try {
            let type = 'file';
            const elType = viewEl
              .querySelector(`[data-fm-open="${CSS.escape(p)}"]`)
              ?.getAttribute('data-fm-type');
            if (elType) type = elType;
            else {
              try {
                const st = await window.statPath(p);
                type = st?.type || type;
              } catch (_) {
                /* ignore */
              }
            }
            if (type === 'directory') await window.rm(p, { recursive: true });
            else await window.unlink(p);
          } catch (err) {
            errors.push(err && err.message ? err.message : String(err));
          }
          if (i % 3 === 2) {
            setStatus(`Menghapus ${i + 1}/${list.length}…`, state.path || '');
            await yieldUi();
          }
        }
        await navigate(state.path, { push: false });
        if (errors.length) {
          setStatus(`Selesai · ${errors.length} gagal`, state.path || '');
        } else {
          setStatus('Siap', state.path || '');
        }
      });
    }

    async function pasteClipboardTo(destPath) {
      const clip = getDriveClipboard();
      if (!clip || !clip.paths?.length) return;
      if (!destPath) {
        window.alert('Tidak bisa paste di This PC — buka drive/folder dulu.');
        return;
      }
      const paths = clip.paths.slice();
      const mode = clip.mode;
      void beginFmOp(`Menempel ${paths.length} item…`, async () => {
        const errors = [];
        for (let i = 0; i < paths.length; i++) {
          const src = paths[i];
          try {
            const to = fmJoinPath(destPath, fmBasename(src));
            if (src === to || src === destPath) continue;
            if (mode === 'cut') await window.rename(src, to);
            else await window.copy(src, to);
          } catch (err) {
            errors.push(err && err.message ? err.message : String(err));
          }
          if (i % 2 === 1) await yieldUi();
        }
        if (mode === 'cut') window.__nxDriveClipboard = null;
        await navigate(state.path, { push: false });
        if (errors.length) setStatus(`Paste selesai · ${errors.length} gagal`, destPath);
        else setStatus('Siap', destPath);
      });
    }

    async function movePathsToFolder(paths, destFolder) {
      const dest = String(destFolder || '');
      if (!dest || !paths?.length) return;
      const list = paths.slice();
      removeItemsFromView(list);
      void beginFmOp(`Memindahkan ${list.length} item…`, async () => {
        const errors = [];
        for (let i = 0; i < list.length; i++) {
          const src = list[i];
          if (!src || src === dest) continue;
          const norm = (p) => String(p).replace(/[/\\]+$/, '').toLowerCase();
          if (
            norm(dest) === norm(src) ||
            norm(dest).startsWith(norm(src) + '\\') ||
            norm(dest).startsWith(norm(src) + '/')
          ) {
            continue;
          }
          if (
            fmDirname(src) === dest ||
            fmDirname(src).replace(/[/\\]+$/, '') === dest.replace(/[/\\]+$/, '')
          ) {
            continue;
          }
          try {
            await window.rename(src, fmJoinPath(dest, fmBasename(src)));
          } catch (err) {
            errors.push(err && err.message ? err.message : String(err));
          }
          if (i % 2 === 1) await yieldUi();
        }
        await navigate(state.path, { push: false });
        if (errors.length) setStatus(`Pindah selesai · ${errors.length} gagal`, dest);
        else setStatus('Siap', dest);
      });
    }

    // —— Klik / multi-select ——
    // History WAJIB ditangani di sini (delegation). Jangan `return` kosong —
    // onclick per-tombol bisa hilang setelah re-paint.
    // Setelah marquee-drag, klik berikutnya (lepas mouse di item/area kosong)
    // harus diabaikan supaya seleksi kotak tidak langsung hilang.
    let suppressClickAfterMarquee = false;
    container.addEventListener(
      'click',
      (ev) => {
        if (suppressClickAfterMarquee) {
          suppressClickAfterMarquee = false;
          ev.preventDefault();
          ev.stopPropagation();
          return;
        }

        // Toggle buka/tutup daftar History
        if (ev.target.closest?.('#fm-history-toggle')) {
          ev.preventDefault();
          ev.stopPropagation();
          state.historyExpanded = !state.historyExpanded;
          applyHistoryExpanded({ persist: true });
          return;
        }

        // Clear semua history
        if (ev.target.closest?.('#fm-history-clear')) {
          ev.preventDefault();
          ev.stopPropagation();
          clearOpenHistory();
          return;
        }

        // Hapus satu item (tombol × hover)
        const rmBtn = ev.target.closest?.('[data-fm-history-remove]');
        if (rmBtn && container.contains(rmBtn)) {
          ev.preventDefault();
          ev.stopPropagation();
          let rp = rmBtn.getAttribute('data-fm-history-remove') || '';
          try {
            rp = decodeURIComponent(rp);
          } catch (_) {
            /* raw */
          }
          if (rp) void removeOpenHistoryItem(rp);
          return;
        }

        const histBtn = ev.target.closest?.('.fm-history-item');
        if (histBtn && container.contains(histBtn)) {
          ev.preventDefault();
          ev.stopPropagation();
          const path =
            histBtn._nxHistoryPath ||
            (() => {
              try {
                return decodeURIComponent(histBtn.getAttribute('data-path') || '');
              } catch (_) {
                return histBtn.getAttribute('data-path') || '';
              }
            })();
          const name = histBtn._nxHistoryName || fmBasename(path);
          setStatus(`History: ${name}`, path);
          if (path) void openFmEntry(path, name, 'file', { fromHistory: true });
          return;
        }

        if (ev.target.closest?.('.fm-name-edit')) return;
        if (isEditing()) return;

        const sortBtn = ev.target.closest?.('[data-fm-sort]');
        if (sortBtn && viewEl.contains(sortBtn)) {
          ev.preventDefault();
          toggleSort(sortBtn.getAttribute('data-fm-sort') || 'name');
          return;
        }

        const place = ev.target.closest('[data-fm-nav]');
        if (place && container.contains(place) && !viewEl.contains(place)) {
          navigate(place.getAttribute('data-fm-nav') || '');
          return;
        }

        const item = ev.target.closest('[data-fm-open]');
        if (!item || !viewEl.contains(item)) {
          if (ev.target === viewEl || ev.target.closest?.('.ubuntu-fm-empty')) {
            clearSelection();
          }
          return;
        }
        const path = item.getAttribute('data-fm-open') || '';
        const type = item.getAttribute('data-fm-type');
        const name = item.getAttribute('data-fm-name') || path;

        if (ev.detail === 2) {
          if (type === 'directory') navigate(path);
          else void openFmEntry(path, name, type);
          return;
        }

        if (ev.shiftKey) selectRange(path);
        else if (ev.ctrlKey || ev.metaKey) toggleSelection(path);
        else setSelection([path], { anchor: path });

        if (state.selected.size === 1) setStatus(name, type || '');
        else paintStatus();
      },
      true,
    );

    if (btnHistoryToggle) {
      btnHistoryToggle.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        state.historyExpanded = !state.historyExpanded;
        applyHistoryExpanded({ persist: true });
      });
    }

    if (btnHistoryClear) {
      btnHistoryClear.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        clearOpenHistory();
      });
    }

    container.addEventListener('contextmenu', (ev) => {
      const item = ev.target.closest('[data-fm-open]');
      if (!item || !viewEl.contains(item)) return;
      const path = item.getAttribute('data-fm-open') || '';
      if (!state.selected.has(path)) {
        setSelection([path], { anchor: path });
      }
    });

    // —— Marquee select ——
    // Hit-test di koordinat viewport; box relatif #fm-view (scroll di #fm-view-scroll).
    // Setelah drag, suppress click (kosong = clearSelection, di atas item = setSelection 1).
    let marquee = null;
    viewEl.addEventListener('mousedown', (ev) => {
      if (ev.button !== 0 || isEditing()) return;
      if (ev.target.closest('[data-fm-open]')) return;
      if (ev.target.closest('.fm-list-header')) return;
      if (ev.target.closest('.fm-name-edit')) return;

      const startX = ev.clientX;
      const startY = ev.clientY;
      const additive = ev.ctrlKey || ev.metaKey;
      const base = additive ? new Set(state.selected) : new Set();
      let moved = false;

      const box = document.createElement('div');
      box.className = 'fm-select-box';
      viewEl.appendChild(box);
      marquee = { box, startX, startY, base, additive };

      if (!additive) clearSelection();

      const onMove = (e) => {
        if (!marquee) return;
        if (
          !moved &&
          (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3)
        ) {
          moved = true;
        }
        const left = Math.min(startX, e.clientX);
        const top = Math.min(startY, e.clientY);
        const right = Math.max(startX, e.clientX);
        const bottom = Math.max(startY, e.clientY);
        const vr = viewEl.getBoundingClientRect();
        box.style.left = `${left - vr.left}px`;
        box.style.top = `${top - vr.top}px`;
        box.style.width = `${right - left}px`;
        box.style.height = `${bottom - top}px`;

        const next = new Set(base);
        itemEls().forEach((el) => {
          const er = el.getBoundingClientRect();
          const hit =
            er.left < right &&
            er.right > left &&
            er.top < bottom &&
            er.bottom > top;
          const p = el.getAttribute('data-fm-open') || '';
          if (hit && p) next.add(p);
        });
        state.selected = next;
        if (next.size === 1) state.anchorPath = [...next][0];
        else if (next.size > 1 && !state.anchorPath) {
          state.anchorPath = [...next][0];
        }
        syncSelectionDom();
        paintStatus();
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (marquee?.box) marquee.box.remove();
        marquee = null;
        if (moved) {
          // Recycle Bin & folder padat: lepas mouse sering di atas item →
          // tanpa flag ini, click mengganti multi-select jadi 1 item / clear.
          suppressClickAfterMarquee = true;
        }
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      ev.preventDefault();
    });

    // —— Drag & drop ——
    const DnD_MIME = 'application/x-nx-drives-paths';
    let dragPaths = [];

    viewEl.addEventListener('dragstart', (ev) => {
      if (isEditing()) {
        ev.preventDefault();
        return;
      }
      const item = ev.target.closest('[data-fm-open]');
      if (!item || item.getAttribute('data-fm-kind') === 'drive') {
        ev.preventDefault();
        return;
      }
      const path = item.getAttribute('data-fm-open') || '';
      dragPaths = state.selected.has(path) ? selectedPaths() : [path];
      if (!state.selected.has(path)) setSelection([path], { anchor: path });
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData(DnD_MIME, JSON.stringify(dragPaths));
      ev.dataTransfer.setData('text/plain', dragPaths.join('\n'));
      requestAnimationFrame(() => {
        itemEls().forEach((el) => {
          const p = el.getAttribute('data-fm-open') || '';
          el.classList.toggle('fm-dragging', dragPaths.includes(p));
        });
      });
    });

    viewEl.addEventListener('dragend', () => {
      itemEls().forEach((el) => el.classList.remove('fm-dragging', 'fm-drag-over'));
      container.querySelectorAll('.fm-drag-over').forEach((el) => el.classList.remove('fm-drag-over'));
      dragPaths = [];
    });

    function clearDragOver() {
      container.querySelectorAll('.fm-drag-over').forEach((el) => el.classList.remove('fm-drag-over'));
    }

    function dropTargetFolder(el) {
      if (!el) return null;
      const item = el.closest?.('[data-fm-open]');
      if (item && viewEl.contains(item) && item.getAttribute('data-fm-type') === 'directory') {
        return item.getAttribute('data-fm-open');
      }
      const nav = el.closest?.('[data-fm-nav]');
      if (nav && container.contains(nav)) {
        const p = nav.getAttribute('data-fm-nav');
        if (p) return p;
      }
      return null;
    }

    container.addEventListener('dragover', (ev) => {
      const dest = dropTargetFolder(ev.target);
      if (!dest || !dragPaths.length) return;
      if (dragPaths.some((p) => p === dest)) return;
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'move';
      clearDragOver();
      const item = ev.target.closest('[data-fm-open]');
      const nav = ev.target.closest('[data-fm-nav]');
      if (item && viewEl.contains(item)) item.classList.add('fm-drag-over');
      else if (nav) nav.classList.add('fm-drag-over');
    });

    container.addEventListener('dragleave', (ev) => {
      const t = ev.target;
      if (t?.classList?.contains('fm-drag-over')) t.classList.remove('fm-drag-over');
    });

    container.addEventListener('drop', (ev) => {
      const dest = dropTargetFolder(ev.target);
      clearDragOver();
      if (!dest) return;
      ev.preventDefault();
      let paths = dragPaths;
      try {
        const raw = ev.dataTransfer.getData(DnD_MIME);
        if (raw) paths = JSON.parse(raw);
      } catch (_) {
        /* keep dragPaths */
      }
      movePathsToFolder(paths, dest);
    });

    // —— Keyboard ——
    const appEl = container.querySelector('#nx-drives-app');
    if (appEl && !appEl.hasAttribute('tabindex')) appEl.setAttribute('tabindex', '-1');

    container.addEventListener('keydown', (ev) => {
      // Inline rename / new file — biarkan browser mengisi karakter.
      if (ev.target?.closest?.('.fm-name-edit') || isEditing()) return;

      const mod = ev.ctrlKey || ev.metaKey;
      const key = ev.key.toLowerCase();

      if (mod && key === 'f') {
        ev.preventDefault();
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      const inSearch =
        ev.target === searchInput ||
        (ev.target && searchWrap && searchWrap.contains(ev.target));

      if (inSearch) {
        if (ev.key === 'Escape') {
          ev.preventDefault();
          clearSearch();
          appEl?.focus?.();
          return;
        }
        if (ev.key === 'Enter') {
          ev.preventDefault();
          const q = String(state.searchQuery || '').trim();
          if (q && state.path) {
            const token = ++state.searchToken;
            void runRecursiveSearch(token);
          }
          return;
        }
        return;
      }

      if (ev.target === pathbar || ev.target.closest?.('input, textarea')) return;

      if (ev.key === 'Enter') {
        const item = ev.target.closest?.('[data-fm-open]');
        if (item && viewEl.contains(item)) {
          const p = item.getAttribute('data-fm-open') || '';
          const t = item.getAttribute('data-fm-type') || '';
          const n = item.getAttribute('data-fm-name') || p;
          if (p) void openFmEntry(p, n, t);
          return;
        }
        if (state.selected.size === 1) {
          const p = [...state.selected][0];
          const el = itemEls().find((e) => e.getAttribute('data-fm-open') === p);
          if (el) {
            void openFmEntry(
              p,
              el.getAttribute('data-fm-name') || p,
              el.getAttribute('data-fm-type') || '',
            );
          }
        }
        return;
      }

      if (ev.key === 'Escape') {
        if (String(state.searchQuery || '').length) {
          clearSearch();
          return;
        }
        clearSelection();
        return;
      }

      if (ev.key === 'F2') {
        if (
          /^nx:recycle-bin$/i.test(state.path) ||
          /^shell:recyclebinfolder$/i.test(state.path)
        ) {
          return;
        }
        ev.preventDefault();
        const p = state.anchorPath && state.selected.has(state.anchorPath)
          ? state.anchorPath
          : selectedPaths().slice(-1)[0];
        if (p && typeof window.startDrivesFmNameEdit === 'function') {
          window.startDrivesFmNameEdit({ mode: 'rename', path: p });
        }
        return;
      }

      if (ev.key === 'Delete') {
        ev.preventDefault();
        deletePaths(selectedPaths());
        return;
      }

      if (mod && key === 'a') {
        ev.preventDefault();
        selectAllVisible();
        return;
      }

      if (mod && key === 'c') {
        if (/^nx:recycle-bin$/i.test(state.path)) return;
        ev.preventDefault();
        setDriveClipboard('copy', selectedPaths());
        return;
      }

      if (mod && key === 'x') {
        if (/^nx:recycle-bin$/i.test(state.path)) return;
        ev.preventDefault();
        setDriveClipboard('cut', selectedPaths());
        return;
      }

      if (mod && key === 'v') {
        if (/^nx:recycle-bin$/i.test(state.path)) return;
        ev.preventDefault();
        pasteClipboardTo(state.path);
      }
    });

    if (searchInput) {
      searchInput.addEventListener('input', () => onSearchQueryChange());
    }
    if (btnSearchClear) {
      btnSearchClear.addEventListener('click', () => {
        clearSearch();
        searchInput?.focus?.();
      });
    }
    if (btnSearchRecursive) {
      btnSearchRecursive.addEventListener('click', () => {
        if (!state.path) return;
        state.searchRecursive = !state.searchRecursive;
        updateSearchChrome();
        const q = String(state.searchQuery || '').trim();
        if (!q) {
          state.searchResults = null;
          renderView();
          return;
        }
        if (state.searchRecursive) {
          scheduleRecursiveSearch();
        } else {
          state.searchResults = null;
          state.searchToken += 1;
          if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = null;
          }
          renderView();
        }
      });
    }

    pathbar.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter') return;
      let dest = pathbar.value.trim();
      if (/^recycle\s*bin$/i.test(dest) || /^trash$/i.test(dest)) {
        dest = 'nx:recycle-bin';
      }
      navigate(dest);
    });

    btnBack.addEventListener('click', () => goHistory(-1));
    btnForward.addEventListener('click', () => goHistory(1));
    btnUp.addEventListener('click', () => navigate(parentPath(state.path)));
    btnRefresh.addEventListener('click', () => navigate(state.path, { push: false }));
    btnGrid.addEventListener('click', () => {
      state.view = 'grid';
      renderView();
      updateChrome();
    });
    btnList.addEventListener('click', () => {
      state.view = 'list';
      renderView();
      updateChrome();
    });

    const handle = container.querySelector('#fm-sidebar-resizer');
    const sidebar = container.querySelector('#fm-sidebar');
    if (handle && sidebar && typeof window.NxResize === 'function') {
      window.NxResize(handle, {
        target: sidebar,
        axis: 'x',
        min: 160,
        max: 420,
        key: 'nx-resize::Development::drives-sidebar-width',
      });
    }

    const winBody =
      root?.closest('.nx-app-window__body') ||
      (container.classList.contains('nx-app-window__body') ? container : null);
    const winFrame = winBody?.closest('.nx-app-window') || null;

    function lockDrivesLayout() {
      if (!winBody) return;
      winBody.classList.add('has-nx-drives-layout');
      winBody.classList.remove('nx-scroll');
      winBody.style.setProperty('overflow', 'hidden', 'important');
      // Hapus sisa height pixel lama (kalau ada) — biar flex yang atur.
      if (root) {
        root.style.removeProperty('height');
        root.style.minHeight = '0';
      }
      applyHistoryScrollHeight();
    }

    if (winBody) {
      lockDrivesLayout();

      // Maximize / restore / drag-resize mengubah size frame (bukan window.resize).
      // ResizeObserver + mutasi class state memastikan status bar ikut kaki.
      if (typeof ResizeObserver === 'function') {
        const ro = new ResizeObserver(() => {
          lockDrivesLayout();
        });
        ro.observe(winBody);
        if (winFrame) ro.observe(winFrame);
        const sideEl = container.querySelector('#fm-sidebar');
        if (sideEl) ro.observe(sideEl);
      }

      if (winFrame && typeof MutationObserver === 'function') {
        const mo = new MutationObserver(() => {
          lockDrivesLayout();
        });
        mo.observe(winFrame, {
          attributes: true,
          attributeFilter: ['class', 'style', 'data-state'],
        });
      }
    }

    window.addEventListener('resize', applyHistoryScrollHeight);

    // Hook global untuk system/contextmenu/nxDriveEntry.js
    window.refreshDrivesFm = () => navigate(state.path, { push: false });
    window.navigateDrivesFm = (p) => navigate(String(p || ''), { push: true });
    window.openDrivesFileEditor = (p) => openOsFile(p);
    window.selectAllDrivesFm = () => selectAllVisible();
    window.beginDrivesFmOp = (label, fn) => beginFmOp(label, fn);
    window.removeDrivesFmItems = (paths) => removeItemsFromView(paths);
    window.setDrivesFmStatus = (left, right) => setStatus(left, right);

    // Sync badge History saat jendela editor di-minimize / restore / close.
    // Jangan paint ulang penuh (itu menghapus tombol + onclick) — cukup sync class.
    const nxhome =
      document.getElementById('nxhome') ||
      document.getElementById('nx-home-scroll');
    if (nxhome && typeof MutationObserver === 'function') {
      let histPaintScheduled = false;
      const scheduleHistPaint = () => {
        if (histPaintScheduled) return;
        histPaintScheduled = true;
        requestAnimationFrame(() => {
          histPaintScheduled = false;
          syncHistoryBadges();
        });
      };
      const histMo = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === 'attributes' && m.attributeName === 'data-state') {
            const t = m.target;
            if (
              t?.classList?.contains?.('nx-app-window') &&
              String(t.dataset.app || '').startsWith('nx-os-editor-')
            ) {
              scheduleHistPaint();
              return;
            }
          }
          if (m.type === 'childList') {
            scheduleHistPaint();
            return;
          }
        }
      });
      histMo.observe(nxhome, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['data-state', 'data-app', 'class'],
      });
    }

    paintOpenHistory();
    applyHistoryExpanded();

    function refreshFolderIconsInDom() {
      // Places "This PC" (home) — src di-bake saat innerHTML
      const homeImg = container.querySelector(
        '.fm-place[data-fm-nav=""] .fm-folder-icon',
      );
      if (homeImg) {
        homeImg.setAttribute('src', folderIconUrl('home', { kind: 'home' }));
      }
      renderPlacesSidebar();
      paintBreadcrumb();
      paintOpenHistory();
      renderView();
      updateChrome();
    }

    function onDrivesPrefsEvent(ev) {
      const p = (ev && ev.detail) || (typeof window.getDrivesPrefsCached === 'function'
        ? window.getDrivesPrefsCached()
        : null);
      if (!p || typeof p !== 'object') return;
      const prevHidden = state.includeHidden;
      if (p.folderColor) FOLDER_COLOR = String(p.folderColor);
      state.view = p.view === 'list' ? 'list' : 'grid';
      state.includeHidden = !!p.includeHidden;
      // Jangan paksa recursive off jika user sedang search; hanya sync toggle default saat idle
      if (!String(state.searchQuery || '').trim()) {
        state.searchRecursive = !!p.searchRecursiveDefault;
      }
      updateSearchChrome();
      if (prevHidden !== state.includeHidden && state.path) {
        void navigate(state.path, { push: false });
        return;
      }
      refreshFolderIconsInDom();
    }

    window.addEventListener('nx-drives-prefs', onDrivesPrefsEvent);

    /**
     * Rename / New File / New Folder — edit nama INLINE (bukan modal).
     * @param {{ mode: 'rename'|'newFile'|'newFolder', path?: string, parentPath?: string, fileName?: string }} opts
     */
    window.startDrivesFmNameEdit = async (opts = {}) => {
      const mode = opts.mode || 'rename';
      const existing = viewEl.querySelector('.fm-name-edit');
      if (existing) {
        existing.focus();
        return { success: true, already: true };
      }

      const finishBusy = { v: false };

      const makeInput = (initial) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'fm-name-edit';
        input.value = initial;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.draggable = false;
        input.setAttribute('aria-label', mode === 'rename' ? 'Rename' : 'Name');
        return input;
      };

      /**
       * Pasang focus + key/blur. Blur di-arm setelah delay agar tutup context-menu
       * Electron tidak langsung commit/cancel. Item draggable dimatikan selama edit
       * (Chrome: input di dalam draggable=true sering tidak bisa diketik).
       */
      const wireInlineInput = (input, hostEl, { onCommit, onCancel }) => {
        const prevDrag = hostEl.getAttribute('draggable');
        hostEl.setAttribute('draggable', 'false');
        hostEl.classList.add('fm-item--editing');

        let armed = false;
        let cleaned = false;

        const blockBubble = (e) => {
          e.stopPropagation();
        };

        const onKey = (e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            finish(true);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            finish(false);
          }
        };

        const onBlur = () => {
          if (!armed || cleaned) return;
          // Jangan commit jika fokus pindah ke elemen lain di dalam host (jarang).
          const ae = document.activeElement;
          if (ae && hostEl.contains(ae)) return;
          finish(true);
        };

        const cleanupUi = () => {
          if (cleaned) return;
          cleaned = true;
          hostEl.removeEventListener('click', blockBubble, true);
          input.removeEventListener('keydown', onKey, true);
          input.removeEventListener('keyup', blockBubble, true);
          input.removeEventListener('keypress', blockBubble, true);
          input.removeEventListener('input', blockBubble, true);
          input.removeEventListener('blur', onBlur);
          if (prevDrag == null) hostEl.removeAttribute('draggable');
          else hostEl.setAttribute('draggable', prevDrag);
          hostEl.classList.remove('fm-item--editing');
        };

        const finish = async (commit) => {
          if (finishBusy.v) return;
          finishBusy.v = true;
          cleanupUi();
          try {
            if (commit) await onCommit(String(input.value || '').trim());
            else await onCancel();
          } catch (_) {
            /* caller handles */
          }
        };

        hostEl.addEventListener('click', blockBubble, true);
        input.addEventListener('keydown', onKey, true);
        input.addEventListener('keyup', blockBubble, true);
        input.addEventListener('keypress', blockBubble, true);
        input.addEventListener('input', blockBubble, true);
        input.addEventListener('blur', onBlur);

        // Tunggu fokus stabil setelah menu konteks / F2.
        const focusNow = () => {
          try {
            input.focus({ preventScroll: true });
          } catch (_) {
            input.focus();
          }
        };
        requestAnimationFrame(() => {
          focusNow();
          selectNameStem(input, input.value);
          // Electron: tutup menu sering blur input sekali — abaikan blur awal.
          window.setTimeout(() => {
            armed = true;
            if (document.activeElement !== input) focusNow();
          }, 120);
        });

        return { finish, cleanupUi };
      };

      const uniqueName = (base, isFile) => {
        const names = new Set(
          (state.children || []).map((c) => String(c.name || '').toLowerCase()),
        );
        if (!names.has(base.toLowerCase())) return base;
        if (isFile) {
          const m = base.match(/^(.*?)(\.[^.]+)?$/);
          const stem = (m && m[1]) || base;
          const ext = (m && m[2]) || '';
          // .env dll. tanpa stem sebelum ekstensi
          if (base.startsWith('.') && !stem) {
            let i = 2;
            while (names.has(`${base}.${i}`.toLowerCase())) i += 1;
            return `${base}.${i}`;
          }
          let i = 2;
          while (names.has(`${stem} (${i})${ext}`.toLowerCase())) i += 1;
          return `${stem} (${i})${ext}`;
        }
        let i = 2;
        while (names.has(`${base} (${i})`.toLowerCase())) i += 1;
        return `${base} (${i})`;
      };

      if (mode === 'rename') {
        const absPath = String(opts.path || '');
        if (!absPath) return { success: false, message: 'path kosong' };
        const item =
          viewEl.querySelector(`[data-fm-open="${CSS.escape(absPath)}"]`) ||
          [...viewEl.querySelectorAll('[data-fm-open]')].find(
            (el) => el.getAttribute('data-fm-open') === absPath,
          );
        if (!item) return { success: false, message: 'item tidak ditemukan' };
        if (item.getAttribute('data-fm-kind') === 'drive') {
          return { success: false, message: 'drive tidak bisa di-rename' };
        }

        const nameEl = item.querySelector('.fm-name');
        if (!nameEl) return { success: false, message: 'label nama tidak ditemukan' };

        const oldName = fmBasename(absPath);
        const input = makeInput(oldName);
        item.classList.add('selected');
        nameEl.replaceWith(input);

        return new Promise((resolve) => {
          wireInlineInput(input, item, {
            onCommit: async (next) => {
              if (!next || next === oldName) {
                if (input.parentNode) input.replaceWith(nameEl);
                nameEl.textContent = oldName;
                resolve({ success: true, cancelled: true });
                return;
              }
              try {
                await window.rename(absPath, fmJoinPath(fmDirname(absPath), next));
                await navigate(state.path, { push: false });
                resolve({ success: true, name: next });
              } catch (err) {
                if (input.parentNode) input.replaceWith(nameEl);
                nameEl.textContent = oldName;
                window.alert(
                  'Gagal rename: ' + (err && err.message ? err.message : String(err)),
                );
                resolve({ success: false, error: err && err.message });
              }
            },
            onCancel: async () => {
              if (input.parentNode) input.replaceWith(nameEl);
              nameEl.textContent = oldName;
              resolve({ success: true, cancelled: true });
            },
          });
        });
      }

      // newFile / newFolder — placeholder item + input
      const parentPath = String(opts.parentPath || state.path || '');
      if (!parentPath) {
        window.alert('Tidak bisa membuat di This PC — buka drive/folder dulu.');
        return { success: false };
      }
      if (parentPath !== state.path) {
        await navigate(parentPath, { push: true });
      }

      const isFolder = mode === 'newFolder';
      const seedName = isFolder
        ? 'New Folder'
        : String(opts.fileName || 'New File.txt').trim() || 'New File.txt';
      const defaultName = uniqueName(seedName, !isFolder);
      const isList = state.view === 'list';
      const placeholder = document.createElement('div');
      placeholder.className = `${isList ? 'fm-list-item' : 'fm-item'} selected fm-item--editing`;
      placeholder.setAttribute('data-fm-temp', '1');
      placeholder.setAttribute('draggable', 'false');

      const iconHtml = isFolder
        ? folderIconHtml(defaultName, { size: isList ? 'md' : 'lg' })
        : fileIconHtml(defaultName, '', { size: isList ? 'md' : 'lg' });
      const input = makeInput(defaultName);

      if (isList) {
        placeholder.innerHTML =
          `<span class="fm-icon">${iconHtml}</span>` +
          `<span class="fm-name-slot"></span>` +
          `<span class="fm-size">—</span>` +
          `<span class="fm-date"></span>`;
      } else {
        placeholder.innerHTML =
          `<div class="fm-icon">${iconHtml}</div>` + `<div class="fm-name-slot"></div>`;
      }
      placeholder.querySelector('.fm-name-slot').replaceWith(input);

      viewEl.classList.remove('has-empty');
      const empty = viewEl.querySelector('.ubuntu-fm-empty');
      if (empty) empty.remove();
      if (isList) {
        const header = viewEl.querySelector('.fm-list-header');
        if (header && header.nextSibling) header.after(placeholder);
        else viewEl.prepend(placeholder);
      } else {
        viewEl.prepend(placeholder);
      }

      return new Promise((resolve) => {
        wireInlineInput(input, placeholder, {
          onCommit: async (next) => {
            if (!next) {
              placeholder.remove();
              if (!state.children.length && !viewEl.querySelector('[data-fm-open]')) {
                renderView();
              }
              resolve({ success: true, cancelled: true });
              return;
            }
            try {
              const dest = fmJoinPath(parentPath, next);
              if (isFolder) await window.mkdir(dest);
              else await window.writeFile(dest, '');
              await navigate(state.path, { push: false });
              resolve({ success: true, name: next });
            } catch (err) {
              placeholder.remove();
              window.alert(
                'Gagal membuat: ' + (err && err.message ? err.message : String(err)),
              );
              resolve({ success: false, error: err && err.message });
            }
          },
          onCancel: async () => {
            placeholder.remove();
            if (!state.children.length && !viewEl.querySelector('[data-fm-open]')) {
              renderView();
            }
            resolve({ success: true, cancelled: true });
          },
        });
      });
    };

    syncCwdAttrs();

    // Muat History + status chevron dari DistroBuckets (async).
    void loadOpenHistory().then((data) => {
      state.openHistory = data.items;
      state.historyExpanded = data.expanded !== false;
      paintOpenHistory();
      applyHistoryExpanded();
      requestAnimationFrame(applyHistoryScrollHeight);
    });

    navigate('');
    requestAnimationFrame(applyHistoryScrollHeight);
  });
}
