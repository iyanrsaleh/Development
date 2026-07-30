// Modul SISTEM — editor baca-tulis isi file untuk distro "Development".
// Logic BERADA DI SINI, di-registrasi jadi window global lewat
// system/index.js (titik registrasi tunggal) — pola SAMA PERSIS dengan
// system/directory/index.js (renderDirectoryTreeHtml). File ini TIDAK
// di-import langsung oleh file pemakai (package/*).
//
// window.NxDirectory.readFile/writeFile SUDAH global otomatis (di-scope
// dari stack trace pemanggil, lihat assets/modules/nxdom.js) — TIDAK
// perlu import untuk window.NxDirectory itu sendiri.
//
// Editor: memakai window.NXUI.Codemirror (alias window.NXUI.NexaCmirror)
// yang SUDAH GLOBAL tersedia lewat assets/modules/codemirror6/NexaCmirror6.js
// (terdaftar sebagai NXUI.Codemirror di assets/modules/nxdom.js) — TIDAK
// import manual dari assets/modules/codemirror6/, sama prinsip dengan
// icon .icon-* yang sudah global.
//
// Titik masuk developer saat ada kerusakan sistem: buka file langsung dari
// browser, edit, Ctrl+S untuk simpan — tanpa file explorer/text editor
// eksternal. TIDAK ADA window.confirm() sebelum overwrite (beda dari pola
// destruktif lain di project ini, mis. Uninstall componen) — Ctrl+S adalah
// gestur eksplisit developer yang sudah menandakan niat menyimpan, sama
// seperti Ctrl+S di editor kode biasa (VS Code dkk), meminta konfirmasi
// tiap kali justru mengganggu alur edit-simpan cepat.

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Persistensi file TERAKHIR yang dibuka — SAMA pola dengan
 * storageKey()/loadOpenState()/saveOpenState() di system/directory/index.js
 * (localStorage, per-distro, try/catch untuk quota/private mode). Dipakai
 * attachFileClickViewer() untuk memulihkan editor ke file yang sama
 * setelah user refresh halaman (F5), BUKAN cuma tree expand/collapse yang
 * sudah persisten — editor kembali ke posisi kerja terakhir juga.
 */
const LAST_OPEN_FILE_KEY = 'nx-directory-tree-last-open-file::Development';

function loadLastOpenPath() {
  try {
    return localStorage.getItem(LAST_OPEN_FILE_KEY) || null;
  } catch (_) {
    return null;
  }
}

function saveLastOpenPath(relPath) {
  try {
    if (relPath) localStorage.setItem(LAST_OPEN_FILE_KEY, relPath);
    else localStorage.removeItem(LAST_OPEN_FILE_KEY);
  } catch (_) {
    // localStorage penuh/private mode — abaikan, editor tetap berfungsi
    // untuk sesi ini, cuma tidak bertahan lintas refresh.
  }
}

/**
 * Ekstensi file → mode CodeMirror (lihat getLanguageExtension() di
 * assets/modules/codemirror6/NexaCmirror6.js untuk daftar mode yang
 * benar-benar didukung — subset relevan disalin di sini, BUKAN daftar
 * lengkap, supaya modul ini tidak perlu import file itu hanya untuk
 * membaca nama-nama mode).
 */
const MODE_BY_EXT = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  vue: 'javascript', svelte: 'javascript',
  html: 'htmlmixed', htm: 'htmlmixed', astro: 'htmlmixed',
  css: 'css', scss: 'css', sass: 'css', less: 'css',
  json: 'javascript', jsonc: 'javascript',
  md: 'markdown', mdx: 'markdown',
  xml: 'xml', svg: 'xml',
  php: 'php', yaml: 'yaml', yml: 'yaml',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  kt: 'kotlin', cs: 'csharp', swift: 'swift', lua: 'lua', dart: 'dart',
  sh: 'shell', bash: 'shell', zsh: 'shell', ps1: 'powershell',
  bat: 'shell', cmd: 'shell',
  toml: 'toml', pl: 'perl', sql: 'sql',
};

/** Ekstensi plain-text yang tetap dibuka di editor meski tanpa mode khusus. */
const PLAIN_TEXT_EXT = new Set([
  'txt', 'csv', 'tsv', 'log', 'ini', 'cfg', 'conf', 'env', 'gitignore',
  'editorconfig', 'npmrc', 'lock',
]);

/** Binary / office — jangan buka di CodeMirror. */
const NON_TEXT_EXT = new Set([
  'docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt', 'pdf', 'zip', 'rar', '7z',
  'exe', 'dll', 'wasm', 'bin',
  'nxtext', 'nxdocx', 'nxxlsx', 'nxpptx', 'nxstat', 'diagram',
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'avif', 'svg',
]);

function modeForFile(name) {
  const lower = String(name || '').toLowerCase();
  if (lower === 'dockerfile') return 'dockerfile';
  if (lower === '.env' || lower.startsWith('.env.')) return null;
  const ext = lower.includes('.') ? lower.slice(lower.lastIndexOf('.') + 1) : '';
  return MODE_BY_EXT[ext] || null;
}

function fileBaseName(filePath) {
  const s = String(filePath || '').replace(/[/\\]+$/, '');
  const i = Math.max(s.lastIndexOf('/'), s.lastIndexOf('\\'));
  return i < 0 ? s : s.slice(i + 1);
}

/**
 * Apakah path cocok dibuka di editor teks (sama CM6 directory / drives).
 * @param {string} nameOrPath
 */
export function canOpenInTextEditor(nameOrPath) {
  const name = fileBaseName(nameOrPath);
  const lower = String(name || '').toLowerCase();
  if (lower === '.env' || lower.startsWith('.env.')) return true;
  const ext = fileExt(name);
  if (!ext) return false;
  if (NON_TEXT_EXT.has(ext)) return false;
  return !!modeForFile(name) || PLAIN_TEXT_EXT.has(ext);
}

/**
 * File GAMBAR ditampilkan sebagai <img> (window.NxDirectory.readImage,
 * endpoint TERPISAH dari readFile teks) — BUKAN dibuka di CodeMirror.
 * Termasuk SVG (pratinjau visual, sama png/jpg).
 * Daftar ekstensi HARUS SAMA dengan DIRECTORY_IMAGE_MIME_BY_EXT di
 * index.js (root) — endpoint menolak ekstensi di luar daftar itu.
 */
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg', 'avif']);

/** MIME untuk data-URL pratinjau (selaras DIRECTORY_IMAGE_MIME_BY_EXT di index.js root). */
const IMAGE_MIME_BY_EXT = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
  avif: 'image/avif',
};

const OS_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const OS_PDF_MAX_BYTES = 32 * 1024 * 1024;

function fileExt(name) {
  const lower = String(name || '').toLowerCase();
  return lower.includes('.') ? lower.slice(lower.lastIndexOf('.') + 1) : '';
}

function isImageFile(name) {
  return IMAGE_EXTENSIONS.has(fileExt(name));
}

function isPdfFile(name) {
  return fileExt(name) === 'pdf';
}

/** Pratinjau gambar (termasuk SVG) sebagai <img>. */
export function canOpenOsImage(nameOrPath) {
  return IMAGE_EXTENSIONS.has(fileExt(fileBaseName(nameOrPath)));
}

/** PDF — pratinjau di iframe (Chromium PDF viewer). */
export function canOpenOsPdf(nameOrPath) {
  return isPdfFile(fileBaseName(nameOrPath));
}

/**
 * Boleh dibuka di jendela viewer FM (teks CM6, markdown, gambar, PDF).
 * @param {string} nameOrPath
 */
export function canOpenInFileViewer(nameOrPath) {
  return (
    canOpenInTextEditor(nameOrPath) ||
    canOpenOsImage(nameOrPath) ||
    canOpenOsPdf(nameOrPath)
  );
}

function isMarkdownFile(name) {
  const ext = fileExt(name);
  return ext === 'md' || ext === 'mdx';
}

/** Instance editor — mendukung beberapa jendela OS sekaligus. */
const instances = new Map();
let lastFocusedMount = null;
let globalSaveKeyInstalled = false;
let openSeq = 0;

/**
 * @typedef {{
 *   editor: object|null,
 *   path: string,
 *   saveFn: (() => Promise<void>)|null,
 *   originalId: string|null,
 *   container: HTMLElement,
 *   token: number,
 * }} EditorInstance
 */

function hashPath(p) {
  let h = 2166136261;
  const s = String(p || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function pruneDeadEditorInstances() {
  for (const [mount, rec] of [...instances.entries()]) {
    if (!mount.isConnected) disposeEditorInstance(rec);
  }
}

function disposeEditorInstance(rec) {
  if (!rec) return;
  if (rec.editor) {
    try { rec.editor.destroy(); } catch (_) { /* ignore */ }
    rec.editor = null;
  }
  const container = rec.container;
  if (container) {
    revokePdfObjectUrl(container);
    if (rec.originalId) container.id = rec.originalId;
    else if (container.id && container.id.startsWith('nx-file-viewer-editor')) {
      container.removeAttribute('id');
    }
    instances.delete(container);
    if (lastFocusedMount === container) lastFocusedMount = null;
  }
  rec.saveFn = null;
}

function revokePdfObjectUrl(el) {
  if (!el || !el._nxPdfObjectUrl) return;
  try {
    URL.revokeObjectURL(el._nxPdfObjectUrl);
  } catch (_) {
    /* ignore */
  }
  el._nxPdfObjectUrl = null;
}

/**
 * Bersihkan HANYA editor di container ini (bukan semua jendela).
 */
function disposeEditorForContainer(viewerContainer) {
  if (!viewerContainer) return;
  const rec = instances.get(viewerContainer);
  if (rec) disposeEditorInstance(rec);
}

function ensureGlobalSaveKeyHandler() {
  if (globalSaveKeyInstalled) return;
  globalSaveKeyInstalled = true;
  document.addEventListener(
    'keydown',
    (event) => {
      const isSaveCombo =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        String(event.key || '').toLowerCase() === 's';
      if (!isSaveCombo) return;
      const mount =
        (event.target instanceof Element &&
          event.target.closest('[id^="nx-file-viewer-editor"]')) ||
        lastFocusedMount;
      const rec = mount && instances.get(mount);
      if (!rec?.saveFn) return;
      event.preventDefault();
      rec.saveFn();
    },
    true,
  );
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (!(event.target instanceof Element)) return;
      const mount = event.target.closest('[id^="nx-file-viewer-editor"]');
      if (mount && instances.has(mount)) lastFocusedMount = mount;
    },
    true,
  );
}

/**
 * Simpan file editor — dari context-menu Save atau Ctrl+S.
 * @param {string} [editorId] id mount (nx-file-viewer-editor / nx-file-viewer-editor::…)
 */
export async function saveActiveEditorFile(editorId) {
  pruneDeadEditorInstances();
  if (editorId) {
    const mount = document.getElementById(editorId);
    const rec = mount && instances.get(mount);
    if (rec?.saveFn) {
      await rec.saveFn();
      return;
    }
  }
  const rec =
    (lastFocusedMount && instances.get(lastFocusedMount)) ||
    [...instances.values()].at(-1);
  if (rec?.saveFn) await rec.saveFn();
}

/**
 * Baca isi file lalu render editor CodeMirror BACA-TULIS ke
 * `viewerContainer`. Ctrl+S memicu simpan.
 *
 * Beberapa instance boleh hidup bersamaan (multi jendela OS). Membuka file
 * baru di container YANG SAMA mengganti editor sebelumnya di container itu
 * (package/directory tetap satu panel).
 *
 * @param {string} filePath path relatif distro (io directory) ATAU absolut OS (io os)
 * @param {HTMLElement} viewerContainer elemen tempat editor dipasang
 * @param {{ io?: 'directory'|'os' }} [opts]
 *   - `directory` (default): window.NxDirectory.readFile/writeFile (sandbox)
 *   - `os`: window.readFile/writeFile (File Manager drives, path absolut)
 */
export async function openFileEditor(filePath, viewerContainer, opts = {}) {
  if (!viewerContainer) return;
  pruneDeadEditorInstances();
  disposeEditorForContainer(viewerContainer);

  const io = opts.io === 'os' ? 'os' : 'directory';
  const token = ++openSeq;
  const originalId = viewerContainer.id || null;
  /** @type {EditorInstance} */
  const rec = {
    editor: null,
    path: filePath,
    saveFn: null,
    originalId,
    container: viewerContainer,
    token,
  };
  instances.set(viewerContainer, rec);

  const fileName = fileBaseName(filePath);
  const safePath = escapeHtml(filePath);
  const stillMine = () => instances.get(viewerContainer)?.token === token;

  // Gambar (termasuk SVG): sandbox → NxDirectory.readImage; OS → data URL.
  if (isImageFile(fileName)) {
    return openImagePreview(filePath, fileName, safePath, viewerContainer, stillMine, {
      io,
    });
  }

  // PDF — iframe + blob URL (viewer PDF bawaan Chromium).
  if (isPdfFile(fileName)) {
    return openPdfPreview(filePath, fileName, safePath, viewerContainer, stillMine, {
      io,
    });
  }

  let initial;
  try {
    if (io === 'os') {
      if (typeof window.readFile !== 'function') {
        throw new Error('window.readFile belum siap');
      }
      initial = await window.readFile(filePath);
    } else {
      initial = await window.NxDirectory.readFile(filePath);
    }
  } catch (err) {
    if (!stillMine()) return;
    if (io === 'directory') saveLastOpenPath(null);
    viewerContainer.innerHTML = `<div class="nx-file-viewer nx-file-viewer--error">
      <div class="nx-file-viewer__header">
        <span class="icon icon-delete"></span>
        <span class="nx-file-viewer__name">${safePath}</span>
      </div>
      <p class="nx-file-viewer__error-message">${escapeHtml(err && err.message ? err.message : String(err))}</p>
    </div>`;
    return;
  }
  if (!stillMine()) return;

  // Persist last-open HANYA untuk sandbox directory (attachFileClickViewer).
  if (io === 'directory') saveLastOpenPath(filePath);

  viewerContainer.id =
    io === 'os'
      ? `nx-file-viewer-editor::${hashPath(filePath)}`
      : 'nx-file-viewer-editor';
  viewerContainer.setAttribute('data-nx-file-editor', '1');

  viewerContainer.innerHTML = `<div class="nx-file-viewer">
    <div class="nx-file-viewer__header">
      <span class="icon ${modeForFile(fileName) ? 'icon-' + fileName.toLowerCase().split('.').pop() : 'icon'}"></span>
      <span class="nx-file-viewer__name" title="${safePath}">${escapeHtml(fileName)}</span>
      <span class="nx-file-viewer__status">memuat editor…</span>
      <span class="nx-file-viewer__meta">Ctrl+S untuk simpan</span>
    </div>
    <div class="nx-file-viewer__editor"></div>
  </div>`;

  const editorEl = viewerContainer.querySelector('.nx-file-viewer__editor');
  const statusEl = viewerContainer.querySelector('.nx-file-viewer__status');

  await window.NXUI.Codemirror.loadDependencies();
  if (!stillMine()) return;

  const content =
    initial && typeof initial.content === 'string'
      ? initial.content
      : String(initial?.content ?? initial ?? '');

  const editor = new window.NXUI.Codemirror(editorEl, {
    value: content,
    mode: modeForFile(fileName) || undefined,
    theme: 'dracula',
    lineNumbers: true,
    tabSize: 2,
  });
  rec.editor = editor;
  lastFocusedMount = viewerContainer;
  if (statusEl) statusEl.textContent = '';

  // JANGAN tambah .nx-scroll ke .cm-scroller — CM6 punya scroll sendiri;
  // class itu (overflow/width) ikut mengganggu measure/tile → crash
  // "Cannot destructure property 'tile'" (codemirror/dev#1652). Scrollbar
  // .cm-scroller di-style di system/directory/style.css.

  const setStatus = (text, cls) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = 'nx-file-viewer__status' + (cls ? ` nx-file-viewer__status--${cls}` : '');
  };

  editor.on('change', () => setStatus('belum disimpan', 'dirty'));

  async function saveThisEditor() {
    const cur = instances.get(viewerContainer);
    if (!cur?.editor || cur.path !== filePath) return;
    setStatus('menyimpan…', 'saving');
    try {
      const value = cur.editor.getValue();
      if (io === 'os') await window.writeFile(filePath, value);
      else await window.NxDirectory.writeFile(filePath, value);
      setStatus('tersimpan', 'saved');
    } catch (err) {
      setStatus('gagal simpan: ' + (err && err.message ? err.message : String(err)), 'error');
    }
  }
  rec.saveFn = saveThisEditor;
  ensureGlobalSaveKeyHandler();

  if (isMarkdownFile(fileName)) {
    wireMarkdownPreviewToggle(viewerContainer, () => {
      const cur = instances.get(viewerContainer);
      return cur?.editor?.getValue() ?? content;
    });
  }
}

/**
 * Pasang tab toggle [Markdown | Preview] di header viewer (disisipkan
 * SETELAH header yang sudah ada, sebelum area editor) — klik "Preview"
 * merender markdown TERKINI (isi editor SAAT diklik, lewat getCurrentMd(),
 * bukan snapshot awal file) ke HTML pakai NexaMarkdown, klik "Markdown"
 * balik menampilkan CodeMirror. Area editor CM6 disembunyikan (BUKAN
 * dilepas dari DOM) saat mode Preview aktif — instance CM6 tetap hidup,
 * tidak perlu destroy+rebuild saat toggle balik ke Markdown.
 * @param {HTMLElement} viewerContainer
 * @param {() => string} getCurrentMd
 */
function wireMarkdownPreviewToggle(viewerContainer, getCurrentMd) {
  const header = viewerContainer.querySelector('.nx-file-viewer__header');
  const editorEl = viewerContainer.querySelector('.nx-file-viewer__editor');
  if (!header || !editorEl) return;

  const tabs = document.createElement('div');
  tabs.className = 'nx-file-viewer__md-tabs';
  tabs.innerHTML = `
    <button type="button" class="nx-file-viewer__md-tab is-active" data-md-view="source">Markdown</button>
    <button type="button" class="nx-file-viewer__md-tab" data-md-view="preview">Preview</button>
  `;
  header.insertAdjacentElement('afterend', tabs);

  const previewEl = document.createElement('div');
  previewEl.className = 'nx-file-viewer__md-preview nx-scroll';
  previewEl.hidden = true;
  editorEl.insertAdjacentElement('afterend', previewEl);

  const tabSource = tabs.querySelector('[data-md-view="source"]');
  const tabPreview = tabs.querySelector('[data-md-view="preview"]');

  // .nx-file-viewer__editor SUDAH di-display:none-kan oleh CM6 setelah
  // _init() — elemen yang terlihat adalah .nexacmirror6-wrap (sibling).
  // Toggle editorEl.hidden saja tidak cukup; ikut sembunyikan wrap.
  const cmWrap = editorEl.parentElement?.querySelector('.nexacmirror6-wrap') || null;

  tabSource.addEventListener('click', () => {
    tabSource.classList.add('is-active');
    tabPreview.classList.remove('is-active');
    editorEl.hidden = false;
    if (cmWrap) cmWrap.style.display = '';
    previewEl.hidden = true;
  });

  tabPreview.addEventListener('click', async () => {
    tabPreview.classList.add('is-active');
    tabSource.classList.remove('is-active');
    editorEl.hidden = true;
    if (cmWrap) cmWrap.style.display = 'none';
    previewEl.hidden = false;
    // window.NXUI.Markdown BUKAN NexaMarkdown — itu fungsi lain (nxdom.js,
    // beda API sama sekali). Alias kelas NexaMarkdown yang benar adalah
    // NXUI.NexaMarkdown (atau NXUI.md, alias pendek) — lihat nxdom.js
    // `const NexaMarkdown = _nxDefault(_mMarkdown); ... NexaMarkdown, md:NexaMarkdown,`.
    const Markdown = window.NXUI?.NexaMarkdown || window.NXUI?.md;
    if (typeof Markdown?.fromContent !== 'function') {
      previewEl.innerHTML = '<p class="nx-file-viewer__error-message">NexaMarkdown tidak tersedia (modul "markdown" belum terinstal).</p>';
      return;
    }
    previewEl.innerHTML = '<p class="nx-file-viewer__loading">Merender preview…</p>';
    try {
      const html = await Markdown.fromContent(getCurrentMd()).html();
      previewEl.innerHTML = html;
    } catch (err) {
      previewEl.innerHTML = `<p class="nx-file-viewer__error-message">${escapeHtml(err && err.message ? err.message : String(err))}</p>`;
    }
  });
}

/**
 * File GAMBAR — jalur TERPISAH dari openFileEditor() teks.
 * - directory: window.NxDirectory.readImage()
 * - os: window.readFile({ encoding: 'binary' }) → data URL
 * TIDAK ada CodeMirror/Ctrl+S. Untuk OS, id mount diganti
 * `nx-file-viewer-editor::<hash>` supaya restore jendela FM mendeteksi viewer.
 *
 * @param {string} filePath
 * @param {string} fileName
 * @param {string} safePath fileName/path ter-escape HTML (pesan error)
 * @param {HTMLElement} viewerContainer
 * @param {() => boolean} stillMine
 * @param {{ io?: 'directory'|'os' }} [opts]
 */
async function openImagePreview(filePath, fileName, safePath, viewerContainer, stillMine, opts = {}) {
  const io = opts.io === 'os' ? 'os' : 'directory';
  let result;
  try {
    if (io === 'os') {
      result = await readOsImageAsDataUrl(filePath);
    } else {
      result = await window.NxDirectory.readImage(filePath);
      saveLastOpenPath(filePath);
    }
  } catch (err) {
    if (typeof stillMine === 'function' ? !stillMine() : false) return;
    if (io === 'directory') saveLastOpenPath(null);
    viewerContainer.innerHTML = `<div class="nx-file-viewer nx-file-viewer--error">
      <div class="nx-file-viewer__header">
        <span class="icon icon-delete"></span>
        <span class="nx-file-viewer__name">${safePath}</span>
      </div>
      <p class="nx-file-viewer__error-message">${escapeHtml(err && err.message ? err.message : String(err))}</p>
    </div>`;
    return;
  }
  if (typeof stillMine === 'function' ? !stillMine() : false) return;

  if (io === 'os') {
    viewerContainer.id = `nx-file-viewer-editor::${hashPath(filePath)}`;
    viewerContainer.setAttribute('data-nx-file-editor', 'image');
  }

  const ext = fileExt(fileName);
  const sizeLabel = formatFileSizeBrief(result.size);
  const mimeLabel = result.mime || 'image';
  viewerContainer.innerHTML = `<div class="nx-file-viewer nx-file-viewer--image">
    <div class="nx-file-viewer__header">
      <span class="icon ${ext === 'svg' ? 'icon-svg' : 'icon-png'}"></span>
      <span class="nx-file-viewer__name">${escapeHtml(fileName)}</span>
      <span class="nx-file-viewer__meta" data-nx-image-meta>${escapeHtml(sizeLabel)} · ${escapeHtml(mimeLabel)} · pratinjau · Ctrl+scroll zoom</span>
    </div>
    <div class="nx-file-viewer__image-stage nx-scroll" tabindex="0" title="Ctrl + scroll untuk zoom">
      <img class="nx-file-viewer__image" src="${escapeHtml(result.dataUrl)}" alt="${escapeHtml(fileName)}" draggable="false" decoding="async" />
    </div>
  </div>`;

  const stage = viewerContainer.querySelector('.nx-file-viewer__image-stage');
  const img = viewerContainer.querySelector('.nx-file-viewer__image');
  const metaEl = viewerContainer.querySelector('[data-nx-image-meta]');
  if (stage && img) attachImagePreviewZoom(stage, img, metaEl, { sizeLabel, mimeLabel });
}

/**
 * Ukuran awal: fit di dalam stage (tidak melebar). Ctrl/Meta + wheel = zoom.
 * @param {HTMLElement} stage
 * @param {HTMLImageElement} img
 * @param {HTMLElement|null} metaEl
 * @param {{ sizeLabel: string, mimeLabel: string }} labels
 */
function attachImagePreviewZoom(stage, img, metaEl, labels) {
  const MIN = 0.1;
  const MAX = 8;
  let zoom = 1;
  let baseW = 0;
  let baseH = 0;
  let ready = false;

  const paintMeta = () => {
    if (!metaEl) return;
    const pct = Math.round(zoom * 100);
    metaEl.textContent = `${labels.sizeLabel} · ${labels.mimeLabel} · ${pct}% · Ctrl+scroll zoom`;
  };

  const apply = () => {
    if (!ready || !baseW || !baseH) return;
    img.style.maxWidth = 'none';
    img.style.maxHeight = 'none';
    img.style.width = `${Math.max(1, Math.round(baseW * zoom))}px`;
    img.style.height = `${Math.max(1, Math.round(baseH * zoom))}px`;
    paintMeta();
  };

  const fitToStage = () => {
    const nw = img.naturalWidth || 0;
    const nh = img.naturalHeight || 0;
    if (!nw || !nh) return;
    baseW = nw;
    baseH = nh;
    const pad = 24;
    const sw = Math.max(40, stage.clientWidth - pad);
    const sh = Math.max(40, stage.clientHeight - pad);
    // Muat dalam stage; jangan perbesar gambar kecil di atas 100%.
    zoom = Math.min(1, sw / nw, sh / nh);
    ready = true;
    apply();
  };

  if (img.complete && img.naturalWidth) fitToStage();
  else img.addEventListener('load', fitToStage, { once: true });

  stage.addEventListener(
    'wheel',
    (ev) => {
      if (!ev.ctrlKey && !ev.metaKey) return;
      ev.preventDefault();
      if (!ready) return;
      const factor = ev.deltaY > 0 ? 0.9 : 1.1;
      zoom = Math.min(MAX, Math.max(MIN, zoom * factor));
      apply();
    },
    { passive: false },
  );
}

/**
 * Baca gambar OS → { dataUrl, mime, size } (pola sama NxDirectory.readImage).
 * @param {string} absPath
 */
async function readOsImageAsDataUrl(absPath) {
  if (typeof window.readFile !== 'function') {
    throw new Error('window.readFile belum siap');
  }
  const ext = fileExt(fileBaseName(absPath));
  const mime = IMAGE_MIME_BY_EXT[ext];
  if (!mime) {
    throw new Error(`Ekstensi bukan format gambar yang didukung: .${ext || '?'}`);
  }
  const res = await window.readFile(absPath, {
    encoding: 'binary',
    maxBytes: OS_IMAGE_MAX_BYTES,
  });
  const b64 = res && typeof res.content === 'string' ? res.content : '';
  if (!b64) throw new Error('Konten gambar kosong');
  return {
    dataUrl: `data:${mime};base64,${b64}`,
    mime,
    size: Number(res.size) || 0,
  };
}

/**
 * PDF — baca biner → blob URL → iframe (viewer PDF Chromium).
 * @param {string} filePath
 * @param {string} fileName
 * @param {string} safePath
 * @param {HTMLElement} viewerContainer
 * @param {() => boolean} stillMine
 * @param {{ io?: 'directory'|'os' }} [opts]
 */
async function openPdfPreview(filePath, fileName, safePath, viewerContainer, stillMine, opts = {}) {
  const io = opts.io === 'os' ? 'os' : 'directory';
  revokePdfObjectUrl(viewerContainer);

  let size = 0;
  let objectUrl = '';
  try {
    if (io !== 'os') {
      throw new Error('Pratinjau PDF sandbox (directory) belum tersedia — buka dari File Manager.');
    }
    if (typeof window.readFile !== 'function') {
      throw new Error('window.readFile belum siap');
    }
    const res = await window.readFile(filePath, {
      encoding: 'binary',
      maxBytes: OS_PDF_MAX_BYTES,
    });
    const b64 = res && typeof res.content === 'string' ? res.content : '';
    if (!b64) throw new Error('Konten PDF kosong');
    size = Number(res.size) || 0;
    objectUrl = base64ToPdfObjectUrl(b64);
  } catch (err) {
    if (typeof stillMine === 'function' ? !stillMine() : false) return;
    viewerContainer.innerHTML = `<div class="nx-file-viewer nx-file-viewer--error">
      <div class="nx-file-viewer__header">
        <span class="icon icon-pdf"></span>
        <span class="nx-file-viewer__name">${safePath}</span>
      </div>
      <p class="nx-file-viewer__error-message">${escapeHtml(err && err.message ? err.message : String(err))}</p>
    </div>`;
    return;
  }
  if (typeof stillMine === 'function' ? !stillMine() : false) {
    try { URL.revokeObjectURL(objectUrl); } catch (_) { /* ignore */ }
    return;
  }

  viewerContainer.id = `nx-file-viewer-editor::${hashPath(filePath)}`;
  viewerContainer.setAttribute('data-nx-file-editor', 'pdf');
  viewerContainer._nxPdfObjectUrl = objectUrl;

  viewerContainer.innerHTML = `<div class="nx-file-viewer nx-file-viewer--pdf">
    <div class="nx-file-viewer__header">
      <span class="icon icon-pdf"></span>
      <span class="nx-file-viewer__name">${escapeHtml(fileName)}</span>
      <span class="nx-file-viewer__meta">${escapeHtml(formatFileSizeBrief(size))} · PDF · hanya pratinjau</span>
    </div>
    <div class="nx-file-viewer__pdf-stage">
      <iframe class="nx-file-viewer__pdf-frame" src="${escapeHtml(objectUrl)}" title="${escapeHtml(fileName)}" type="application/pdf"></iframe>
    </div>
  </div>`;
}

/**
 * @param {string} b64
 * @returns {string} blob: URL
 */
function base64ToPdfObjectUrl(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

function formatFileSizeBrief(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

/** Tandai SATU elemen file di tree sebagai aktif (highlight), lepas dari elemen lain — dipakai klik manual MAUPUN restore otomatis (lihat attachFileClickViewer()). */
function markActiveTreeEntry(treeContainer, el) {
  treeContainer.querySelectorAll('.nx-directory-tree__file--active').forEach((n) => n.classList.remove('nx-directory-tree__file--active'));
  if (el) el.classList.add('nx-directory-tree__file--active');
}

/**
 * Pasang listener klik pada elemen file di dalam tree hasil
 * renderDirectoryTreeHtml() (lihat system/directory/index.js,
 * `data-nx-file-path`) — begitu diklik, buka editor baca-tulis untuk file
 * itu di `viewerContainer`. Dipanggil pemakai SETELAH tree DAN viewer
 * container sama-sama ada di DOM.
 *
 * PERSISTENSI: setelah listener klik terpasang, kalau ada file yang
 * TERAKHIR dibuka tersimpan (localStorage, lihat saveLastOpenPath()) DAN
 * file itu masih ada di tree yang baru saja dirender (elemen
 * `[data-nx-file-path="..."]` ditemukan), editor otomatis dibuka kembali
 * ke file itu — supaya refresh halaman (F5) mengembalikan user ke posisi
 * kerja yang sama, bukan ke placeholder kosong. Kalau file sudah tidak ada
 * lagi di tree (dihapus/dipindah), TIDAK ada error — cukup dibiarkan
 * kosong (placeholder awal tetap tampil).
 * @param {HTMLElement} treeContainer elemen yang berisi hasil renderDirectoryTreeHtml()
 * @param {HTMLElement} viewerContainer elemen tempat editor ditampilkan
 */
export function attachFileClickViewer(treeContainer, viewerContainer) {
  if (!treeContainer || !viewerContainer) return;
  treeContainer.querySelectorAll('.nx-directory-tree__file[data-nx-file-path]').forEach((el) => {
    el.addEventListener('click', () => {
      const relPath = el.getAttribute('data-nx-file-path');
      markActiveTreeEntry(treeContainer, el);
      openFileEditor(relPath, viewerContainer);
    });
  });

  const lastPath = loadLastOpenPath();
  if (lastPath) {
    const el = treeContainer.querySelector(`.nx-directory-tree__file[data-nx-file-path="${CSS.escape(lastPath)}"]`);
    if (el) {
      markActiveTreeEntry(treeContainer, el);
      openFileEditor(lastPath, viewerContainer);
    }
  }
}
