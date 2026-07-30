// Target DINAMIS File Manager OS (package/drives).
//
// PENTING: buildMenu (nxDriveEntry) dijalankan di MAIN PROCESS lewat
// electronShell.js dynamic import — TIDAK ada `document` / DOM di sini.
// Path & tipe HARUS terkode di targetId. Handler aksi (nxOpenDriveEntry
// dll.) dijalankan di RENDERER lewat nexaContextAction.js — boleh DOM /
// window.* FS.
//
// Skema id:
//   nxdrive::drive::<encPath>      — item drive (This PC)
//   nxdrive::directory::<encPath>  — folder
//   nxdrive::file::<encPath>       — file
//   nxdrive-cwd::<encPath>         — area kosong / cwd (#fm-view)
//   nx-drives-app                  — chrome app; cwd di-resolve di renderer
//
// Recycle Bin (path cwd `nx:recycle-bin` atau item di `$Recycle.Bin` / Trash):
//   menu khusus Restore / Empty / Delete permanently (bukan New/Paste/Rename).

let clipboard = null; // legacy mirror; sumber kebenaran: window.__nxDriveClipboard

function setClipboard(mode, paths) {
  const list = (Array.isArray(paths) ? paths : paths ? [paths] : [])
    .filter(Boolean)
    .map(String);
  if (!list.length) return;
  clipboard = { mode, paths: list, path: list[0] };
  window.__nxDriveClipboard = clipboard;
}

function getClipboard() {
  return window.__nxDriveClipboard || clipboard;
}

function isRecycleVirtualPath(p) {
  const s = String(p || '').trim().toLowerCase();
  return (
    s === 'nx:recycle-bin' ||
    s === 'shell:recyclebinfolder' ||
    s === 'recyclebin:' ||
    s === 'recycle:'
  );
}

/** Path fisik item di dalam Recycle Bin / Trash OS. */
function isRecycleItemPath(p) {
  const s = String(p || '').replace(/\//g, '\\');
  if (/\\\$recycle\.bin\\/i.test(s)) return true;
  const unix = String(p || '').replace(/\\/g, '/');
  if (/\/\.Trash(\/|$)/i.test(unix)) return true;
  if (/\/\.local\/share\/Trash\/files(\/|$)/i.test(unix)) return true;
  return false;
}

/**
 * @returns {{ path: string, type: string, kind: string, isEmptyArea: boolean, resolveCwd: boolean, recycle: boolean } | null}
 */
function targetMeta(targetId) {
  if (targetId === 'nx-drives-app' || targetId === 'fm-view') {
    return {
      path: '',
      type: 'directory',
      kind: 'cwd',
      isEmptyArea: true,
      resolveCwd: true,
      recycle: false,
    };
  }
  if (typeof targetId === 'string' && targetId.startsWith('nxdrive-cwd::')) {
    const path = decodeURIComponent(targetId.slice('nxdrive-cwd::'.length));
    return {
      path,
      type: 'directory',
      kind: 'cwd',
      isEmptyArea: true,
      resolveCwd: false,
      recycle: isRecycleVirtualPath(path),
    };
  }
  if (typeof targetId === 'string' && targetId.startsWith('nxdrive::')) {
    const rest = targetId.slice('nxdrive::'.length);
    const sep = rest.indexOf('::');
    let typeKey = 'directory';
    let enc = rest;
    if (sep > 0) {
      const head = rest.slice(0, sep);
      if (head === 'file' || head === 'directory' || head === 'drive') {
        typeKey = head;
        enc = rest.slice(sep + 2);
      }
    }
    const path = decodeURIComponent(enc);
    if (typeKey === 'drive' || isDriveRoot(path)) {
      return {
        path,
        type: 'directory',
        kind: 'drive',
        isEmptyArea: false,
        resolveCwd: false,
        recycle: false,
      };
    }
    return {
      path,
      type: typeKey === 'file' ? 'file' : 'directory',
      kind: 'entry',
      isEmptyArea: false,
      resolveCwd: false,
      recycle: isRecycleItemPath(path),
    };
  }
  return null;
}

function isDriveRoot(p) {
  const s = String(p || '').replace(/\//g, '\\');
  return /^[a-zA-Z]:\\?$/.test(s);
}

function pathSep(p) {
  const s = String(p || '');
  return s.includes('/') && !s.includes('\\') ? '/' : '\\';
}

function dirnameOf(p) {
  const s = String(p || '').replace(/[/\\]+$/, '');
  const i = Math.max(s.lastIndexOf('\\'), s.lastIndexOf('/'));
  if (i < 0) return '';
  if (/^[a-zA-Z]:$/i.test(s.slice(0, i))) return `${s.slice(0, i)}\\`;
  return s.slice(0, i) || '';
}

function basenameOf(p) {
  const s = String(p || '').replace(/[/\\]+$/, '');
  const i = Math.max(s.lastIndexOf('\\'), s.lastIndexOf('/'));
  return i < 0 ? s : s.slice(i + 1);
}

function joinPath(dir, name) {
  if (!dir) return String(name || '');
  const sep = pathSep(dir);
  return dir.endsWith('\\') || dir.endsWith('/') ? `${dir}${name}` : `${dir}${sep}${name}`;
}

function duplicateDest(src) {
  const dir = dirnameOf(src);
  const base = basenameOf(src);
  const m = base.match(/^(.*?)(\.[^.]+)?$/);
  const stem = (m && m[1]) || base;
  const ext = (m && m[2]) || '';
  return joinPath(dir, `${stem} - Copy${ext}`);
}

function pasteDestPath(meta) {
  if (!meta) return '';
  if (meta.isEmptyArea || meta.kind === 'cwd') return meta.path;
  if (meta.type === 'file') return dirnameOf(meta.path);
  return meta.path;
}

/** Resolve cwd di RENDERER (handler aksi). */
function cwdFromDom() {
  const el =
    document.querySelector('[data-fm-cwd]') ||
    document.getElementById('nx-drives-app');
  return el?.getAttribute('data-fm-cwd') ?? '';
}

/** Item-item terpilih di grid/list File Manager. */
function selectedEntriesFromDom() {
  return [
    ...document.querySelectorAll(
      '#nx-drives-app .fm-item.selected, #nx-drives-app .fm-list-item.selected',
    ),
  ]
    .map((el) => ({
      path: el.getAttribute('data-fm-open') || '',
      type: el.getAttribute('data-fm-type') || 'file',
      kind: el.getAttribute('data-fm-kind') || 'entry',
    }))
    .filter((e) => e.path);
}

function selectedEntryFromDom() {
  return selectedEntriesFromDom()[0] || null;
}

function resolvePaths(payload) {
  if (payload && Array.isArray(payload.paths) && payload.paths.length) {
    return payload.paths.map(String).filter(Boolean);
  }
  if (payload && payload.resolveSelection) {
    return selectedEntriesFromDom().map((e) => e.path);
  }
  const one = resolvePath(payload);
  // Klik kanan salah satu item yang sudah terpilih → aksi ke seluruh seleksi
  // (Select All lalu Delete permanently / Restore).
  if (one) {
    const selected = selectedEntriesFromDom().map((e) => e.path);
    if (selected.length > 1 && selected.includes(one)) return selected;
  }
  return one ? [one] : [];
}

function resolvePath(payload) {
  if (payload && payload.resolveSelection) {
    return selectedEntryFromDom()?.path || '';
  }
  if (payload && payload.resolveCwd) return cwdFromDom();
  return payload?.path ?? '';
}

function resolveType(payload) {
  if (payload && payload.resolveSelection) {
    return selectedEntryFromDom()?.type || payload?.type || 'file';
  }
  return payload?.type || 'file';
}

function refreshFm() {
  if (typeof window.refreshDrivesFm === 'function') return window.refreshDrivesFm();
}

function navigateFm(p) {
  if (typeof window.navigateDrivesFm === 'function') return window.navigateDrivesFm(p);
}

/**
 * Operasi panjang tanpa blok UI — status bar + background.
 * @param {string} label
 * @param {() => Promise<void>} fn
 */
function runFmOp(label, fn) {
  if (typeof window.beginDrivesFmOp === 'function') {
    return window.beginDrivesFmOp(label, fn);
  }
  return fn();
}

function removeFmItems(paths) {
  if (typeof window.removeDrivesFmItems === 'function') {
    window.removeDrivesFmItems(paths);
  }
}

function setFmStatus(left, right) {
  if (typeof window.setDrivesFmStatus === 'function') {
    window.setDrivesFmStatus(left, right);
  }
}

export async function nxOpenDriveEntry(payload) {
  const p = resolvePath(payload);
  if (!p) return;
  const type = resolveType(payload);
  if (type === 'directory' || type === 'drive') {
    return navigateFm(p);
  }
  // File teks → jendela app editor terpisah (openAppWindow)
  if (typeof window.openDrivesFileEditor === 'function') {
    return window.openDrivesFileEditor(p);
  }
}

export async function nxRefreshDriveFm() {
  return refreshFm();
}

export async function nxSelectAllDriveEntry() {
  if (typeof window.selectAllDrivesFm === 'function') {
    return window.selectAllDrivesFm();
  }
}

export async function nxCopyDriveEntry(payload) {
  const paths = resolvePaths(payload);
  if (!paths.length) {
    window.alert('Pilih file/folder dulu untuk Copy.');
    return;
  }
  setClipboard('copy', paths);
}

export async function nxCutDriveEntry(payload) {
  const paths = resolvePaths(payload);
  if (!paths.length) {
    window.alert('Pilih file/folder dulu untuk Cut.');
    return;
  }
  setClipboard('cut', paths);
}

export async function nxPasteDriveEntry(payload) {
  const clip = getClipboard();
  if (!clip || !clip.paths?.length) {
    return { success: false, message: 'Clipboard kosong — Copy/Cut sesuatu dulu.' };
  }
  const destPath = resolvePath(payload);
  if (!destPath) {
    window.alert('Tidak bisa paste di This PC — buka drive/folder dulu.');
    return { success: false };
  }
  void runFmOp(`Menempel ${clip.paths.length} item…`, async () => {
    const errors = [];
    for (let i = 0; i < clip.paths.length; i++) {
      const src = clip.paths[i];
      try {
        const to = joinPath(destPath, basenameOf(src));
        if (src === to || src === destPath) continue;
        if (clip.mode === 'cut') await window.rename(src, to);
        else await window.copy(src, to);
      } catch (err) {
        errors.push(err && err.message ? err.message : String(err));
      }
      if (i % 2 === 1) await new Promise((r) => setTimeout(r, 0));
    }
    if (clip.mode === 'cut') {
      clipboard = null;
      window.__nxDriveClipboard = null;
    }
    await refreshFm();
    if (errors.length) {
      setFmStatus(`Paste selesai · ${errors.length} gagal`, destPath);
    } else {
      setFmStatus('Siap', destPath);
    }
  });
}

export async function nxDuplicateDriveEntry(payload) {
  const paths = resolvePaths(payload);
  if (!paths.length) {
    window.alert('Pilih file/folder dulu untuk Duplicate.');
    return;
  }
  void runFmOp(`Menduplikasi ${paths.length} item…`, async () => {
    const errors = [];
    for (let i = 0; i < paths.length; i++) {
      try {
        await window.copy(paths[i], duplicateDest(paths[i]));
      } catch (err) {
        errors.push(err && err.message ? err.message : String(err));
      }
      if (i % 2 === 1) await new Promise((r) => setTimeout(r, 0));
    }
    await refreshFm();
    if (errors.length) setFmStatus(`Duplicate selesai · ${errors.length} gagal`, '');
    else setFmStatus('Siap', '');
  });
}

export async function nxRenameDriveEntry(payload) {
  const p = resolvePath(payload);
  if (!p) {
    window.alert('Pilih file/folder dulu untuk Rename.');
    return;
  }
  if (typeof window.startDrivesFmNameEdit !== 'function') {
    window.alert('Inline rename belum siap — buka jendela Files dulu.');
    return;
  }
  return window.startDrivesFmNameEdit({ mode: 'rename', path: p });
}

export async function nxDeleteDriveEntry(payload) {
  const paths = resolvePaths(payload).filter((p) => p && !isDriveRoot(p));
  if (!paths.length) {
    window.alert('Pilih file/folder dulu untuk Delete.');
    return;
  }
  const label = paths.length === 1 ? `"${paths[0]}"` : `${paths.length} item`;
  if (!window.confirm(`Hapus ${label}? Tindakan ini tidak bisa dibatalkan.`)) return;

  const types = new Map();
  for (const p of paths) {
    const hit = selectedEntriesFromDom().find((e) => e.path === p);
    if (hit) types.set(p, hit.type);
  }
  removeFmItems(paths);
  void runFmOp(`Menghapus ${paths.length} item…`, async () => {
    const errors = [];
    for (let i = 0; i < paths.length; i++) {
      const p = paths[i];
      try {
        let type = types.get(p) || 'file';
        try {
          const st = await window.statPath(p);
          type = st?.type || type;
        } catch (_) {
          /* fallback */
        }
        if (type === 'directory') await window.rm(p, { recursive: true });
        else await window.unlink(p);
      } catch (err) {
        errors.push(err && err.message ? err.message : String(err));
      }
      if (i % 3 === 2) await new Promise((r) => setTimeout(r, 0));
    }
    await refreshFm();
    if (errors.length) setFmStatus(`Selesai · ${errors.length} gagal`, '');
    else setFmStatus('Siap', '');
  });
}

export async function nxNewFileDriveEntry(payload) {
  const parentPath = resolvePath(payload);
  if (!parentPath) {
    window.alert('Tidak bisa membuat file di This PC — buka drive/folder dulu.');
    return;
  }
  if (typeof window.startDrivesFmNameEdit !== 'function') {
    window.alert('Inline new file belum siap — buka jendela Files dulu.');
    return;
  }
  return window.startDrivesFmNameEdit({
    mode: 'newFile',
    parentPath,
    fileName: payload?.fileName || 'New File.txt',
  });
}

export async function nxNewFolderDriveEntry(payload) {
  const parentPath = resolvePath(payload);
  if (!parentPath) {
    window.alert('Tidak bisa membuat folder di This PC — buka drive/folder dulu.');
    return;
  }
  if (typeof window.startDrivesFmNameEdit !== 'function') {
    window.alert('Inline new folder belum siap — buka jendela Files dulu.');
    return;
  }
  return window.startDrivesFmNameEdit({ mode: 'newFolder', parentPath });
}

export async function nxCopyDrivePath(payload) {
  const text = String(resolvePath(payload) ?? '');
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      window.prompt('Copy path:', text);
    }
  } catch (err) {
    window.alert('Gagal copy path: ' + (err && err.message ? err.message : String(err)));
  }
}

export async function nxEmptyRecycleBin() {
  if (
    !window.confirm(
      'Kosongkan Recycle Bin? Semua item akan dihapus permanen dan tidak bisa dikembalikan.',
    )
  ) {
    return;
  }
  // Kosongkan view segera — UI tetap bisa dipakai (navigasi, dsb.)
  const all = selectedEntriesFromDom().map((e) => e.path);
  const visible = [
    ...document.querySelectorAll(
      '#nx-drives-app [data-fm-open][data-fm-recycle], #nx-drives-app [data-fm-open]',
    ),
  ]
    .filter((el) => {
      const cwd =
        document.querySelector('[data-fm-cwd]')?.getAttribute('data-fm-cwd') || '';
      return /^nx:recycle-bin$/i.test(cwd) || el.hasAttribute('data-fm-recycle');
    })
    .map((el) => el.getAttribute('data-fm-open') || '')
    .filter(Boolean);
  removeFmItems(visible.length ? visible : all);

  void runFmOp('Mengosongkan Recycle Bin…', async () => {
    if (typeof window.emptyRecycleBin !== 'function') {
      throw new Error('emptyRecycleBin tidak tersedia — restart Electron.');
    }
    await window.emptyRecycleBin();
    await refreshFm();
    setFmStatus('Recycle Bin kosong', 'nx:recycle-bin');
  });
}

export async function nxRestoreRecycleEntry(payload) {
  const paths = resolvePaths(payload).filter(Boolean);
  if (!paths.length) {
    window.alert('Pilih item Recycle Bin dulu untuk Restore.');
    return;
  }
  removeFmItems(paths);
  void runFmOp(`Memulihkan ${paths.length} item…`, async () => {
    if (typeof window.restoreRecycleItems !== 'function') {
      throw new Error('restoreRecycleItems tidak tersedia — restart Electron.');
    }
    const res = await window.restoreRecycleItems(paths);
    await refreshFm();
    if (res?.failed?.length) {
      setFmStatus(`Restore selesai · ${res.failed.length} gagal`, '');
    } else {
      setFmStatus('Siap', '');
    }
  });
}

export async function nxDeleteRecycleEntry(payload) {
  const paths = resolvePaths(payload).filter(Boolean);
  if (!paths.length) {
    window.alert('Pilih item Recycle Bin dulu untuk hapus permanen.');
    return;
  }
  const label = paths.length === 1 ? `"${basenameOf(paths[0])}"` : `${paths.length} item`;
  if (
    !window.confirm(
      `Hapus permanen ${label}? Tindakan ini tidak bisa dibatalkan.`,
    )
  ) {
    return;
  }
  removeFmItems(paths);
  void runFmOp(`Menghapus permanen ${paths.length} item…`, async () => {
    if (typeof window.permanentlyDeleteRecycleItems !== 'function') {
      throw new Error(
        'permanentlyDeleteRecycleItems tidak tersedia — restart Electron.',
      );
    }
    const res = await window.permanentlyDeleteRecycleItems(paths);
    await refreshFm();
    if (res?.failed?.length) {
      setFmStatus(`Selesai · ${res.failed.length} gagal`, '');
    } else {
      setFmStatus('Siap', '');
    }
  });
}

/**
 * Submenu New File dikelompokkan per tipe (Web / Backend / …).
 * @param {object} helpers
 * @param {object} parentPayload path parent folder (+ resolveCwd bila perlu)
 */
function buildNewFileSubmenu(helpers, parentPayload) {
  const send = (fileName) => () =>
    helpers.sendAction('nxNewFileDriveEntry', { ...parentPayload, fileName });

  return [
    {
      label: 'Web',
      submenu: [
        { label: 'JavaScript', click: send('index.js') },
        { label: 'TypeScript', click: send('index.ts') },
        { label: 'React JSX', click: send('Component.jsx') },
        { label: 'React TSX', click: send('Component.tsx') },
        { label: 'Vue', click: send('Component.vue') },
        { label: 'Svelte', click: send('Component.svelte') },
        { label: 'Astro', click: send('page.astro') },
        { label: 'HTML', click: send('index.html') },
        { label: 'CSS', click: send('style.css') },
      ],
    },
    {
      label: 'Backend',
      submenu: [
        { label: 'PHP', click: send('index.php') },
        { label: 'Python', click: send('main.py') },
        { label: 'Node.js', click: send('server.js') },
        { label: 'Go', click: send('main.go') },
        { label: 'Java', click: send('Main.java') },
        { label: 'Kotlin', click: send('Main.kt') },
        { label: 'Rust', click: send('main.rs') },
        { label: 'C#', click: send('Program.cs') },
        { label: 'Dart', click: send('main.dart') },
      ],
    },
    {
      label: 'Styles',
      submenu: [
        { label: 'CSS', click: send('style.css') },
        { label: 'SCSS', click: send('style.scss') },
        { label: 'SASS', click: send('style.sass') },
        { label: 'LESS', click: send('style.less') },
      ],
    },
    {
      label: 'Data & Config',
      submenu: [
        { label: 'JSON', click: send('data.json') },
        { label: 'JSONC', click: send('config.jsonc') },
        { label: 'YAML', click: send('config.yaml') },
        { label: 'TOML', click: send('config.toml') },
        { label: 'SQL', click: send('query.sql') },
        { label: 'CSV', click: send('data.csv') },
        { label: 'ENV', click: send('.env') },
      ],
    },
    {
      label: 'Documents',
      submenu: [
        { label: 'Markdown', click: send('README.md') },
        { label: 'Text File', click: send('notes.txt') },
        { label: 'XML', click: send('data.xml') },
        { label: 'SVG', click: send('icon.svg') },
      ],
    },
    {
      label: 'Shell',
      submenu: [
        { label: 'Bash', click: send('script.sh') },
        { label: 'Shell Script', click: send('run.sh') },
        { label: 'PowerShell', click: send('script.ps1') },
        { label: 'Windows Batch', click: send('run.bat') },
      ],
    },
    {
      label: 'LibreOffice',
      submenu: [
        { label: 'Textsheet', click: send('document.nxtext') },
        { label: 'Docxsheet', click: send('document.nxdocx') },
        { label: 'Spreadsheet', click: send('spreadsheet.nxxlsx') },
        { label: 'Presentation', click: send('presentation.nxpptx') },
        { label: 'Diagram', click: send('diagram.diagram') },
        { label: 'Statistics', click: send('penelitian.nxstat') },
      ],
    },
    {
      label: 'Office',
      submenu: [
        { label: 'Word Document', click: send('Document.docx') },
        { label: 'Excel Workbook', click: send('Workbook.xlsx') },
        { label: 'PowerPoint Presentation', click: send('Presentation.pptx') },
      ],
    },
  ];
}

function newFileMenuItem(helpers, parentPayload) {
  return {
    label: 'New File',
    submenu: buildNewFileSubmenu(helpers, parentPayload),
  };
}

function recycleEmptyMenu(helpers, pathPayload, selPayload) {
  return [
    {
      label: 'Refresh',
      click: () => helpers.sendAction('nxRefreshDriveFm', pathPayload),
    },
    {
      label: 'Select All',
      click: () => helpers.sendAction('nxSelectAllDriveEntry', {}),
    },
    {
      label: 'Empty Recycle Bin',
      click: () => helpers.sendAction('nxEmptyRecycleBin', {}),
    },
    { type: 'separator' },
    {
      label: 'Restore',
      click: () => helpers.sendAction('nxRestoreRecycleEntry', selPayload),
    },
    {
      label: 'Delete permanently',
      click: () => helpers.sendAction('nxDeleteRecycleEntry', selPayload),
    },
  ];
}

function recycleItemMenu(helpers, p, type) {
  return [
    {
      label: 'Restore',
      click: () => helpers.sendAction('nxRestoreRecycleEntry', { path: p }),
    },
    {
      label: 'Delete permanently',
      click: () => helpers.sendAction('nxDeleteRecycleEntry', { path: p, type }),
    },
    { type: 'separator' },
    {
      label: 'Open',
      click: () =>
        helpers.sendAction('nxOpenDriveEntry', {
          path: p,
          type: type === 'directory' ? 'directory' : 'file',
        }),
    },
    {
      label: 'Select All',
      click: () => helpers.sendAction('nxSelectAllDriveEntry', {}),
    },
    {
      label: 'Copy path',
      click: () => helpers.sendAction('nxCopyDrivePath', { path: p }),
    },
  ];
}

/**
 * buildMenu — MAIN PROCESS aman (tanpa document).
 * @param {string} targetId
 * @param {object} helpers
 */
export function nxDriveEntry(targetId, helpers) {
  const meta = targetMeta(targetId);
  if (!meta) return null;

  const { path: p, type, kind, isEmptyArea, resolveCwd, recycle } = meta;
  const isThisPc = !p && !resolveCwd;
  const treatAsFolderCwd = isEmptyArea && (resolveCwd || !!p);
  const isDrive = kind === 'drive';
  const isDir = type === 'directory' || isDrive || isEmptyArea;
  const pastePath = pasteDestPath(meta);
  const newParent = isEmptyArea || isDir ? p : dirnameOf(p);
  const pathPayload = (path) =>
    resolveCwd ? { path: path || '', resolveCwd: true } : { path };
  const selPayload = { resolveSelection: true };
  const newParentPayload = pathPayload(newParent);

  if (recycle && isEmptyArea) {
    return recycleEmptyMenu(helpers, pathPayload(p), selPayload);
  }
  if (recycle && !isEmptyArea) {
    return recycleItemMenu(helpers, p, type);
  }

  const items = [];

  if (isEmptyArea) {
    items.push({
      label: 'Refresh',
      click: () => helpers.sendAction('nxRefreshDriveFm', pathPayload(p)),
    });
    items.push({
      label: 'Select All',
      click: () => helpers.sendAction('nxSelectAllDriveEntry', {}),
    });
    if (treatAsFolderCwd || resolveCwd) {
      if (resolveCwd || !isThisPc) {
        items.push(
          { type: 'separator' },
          {
            label: 'Open',
            click: () => helpers.sendAction('nxOpenDriveEntry', selPayload),
          },
          {
            label: 'Copy',
            click: () => helpers.sendAction('nxCopyDriveEntry', selPayload),
          },
          {
            label: 'Cut',
            click: () => helpers.sendAction('nxCutDriveEntry', selPayload),
          },
          {
            label: 'Paste',
            click: () => helpers.sendAction('nxPasteDriveEntry', pathPayload(pastePath)),
          },
          {
            label: 'Duplicate',
            click: () => helpers.sendAction('nxDuplicateDriveEntry', selPayload),
          },
          { type: 'separator' },
          {
            label: 'Rename',
            click: () => helpers.sendAction('nxRenameDriveEntry', selPayload),
          },
          {
            label: 'Delete',
            click: () => helpers.sendAction('nxDeleteDriveEntry', selPayload),
          },
          { type: 'separator' },
          {
            label: 'New Folder',
            click: () => helpers.sendAction('nxNewFolderDriveEntry', newParentPayload),
          },
          newFileMenuItem(helpers, newParentPayload),
          { type: 'separator' },
          {
            label: 'Copy path',
            click: () => helpers.sendAction('nxCopyDrivePath', pathPayload(p)),
          },
        );
      }
    }
    return items;
  }

  if (isDrive) {
    items.push(
      {
        label: 'Open',
        click: () => helpers.sendAction('nxOpenDriveEntry', { path: p, type: 'directory' }),
      },
      {
        label: 'Select All',
        click: () => helpers.sendAction('nxSelectAllDriveEntry', {}),
      },
      {
        label: 'Copy path',
        click: () => helpers.sendAction('nxCopyDrivePath', { path: p }),
      },
      { type: 'separator' },
      {
        label: 'Refresh',
        click: () => helpers.sendAction('nxRefreshDriveFm', { path: p }),
      },
    );
    return items;
  }

  if (isDir) {
    items.push({
      label: 'Open',
      click: () => helpers.sendAction('nxOpenDriveEntry', { path: p, type: 'directory' }),
    });
  } else {
    items.push({
      label: 'Open',
      click: () => helpers.sendAction('nxOpenDriveEntry', { path: p, type: 'file' }),
    });
  }

  items.push(
    {
      label: 'Select All',
      click: () => helpers.sendAction('nxSelectAllDriveEntry', {}),
    },
    { label: 'Copy', click: () => helpers.sendAction('nxCopyDriveEntry', { path: p }) },
    { label: 'Cut', click: () => helpers.sendAction('nxCutDriveEntry', { path: p }) },
    {
      label: 'Paste',
      click: () => helpers.sendAction('nxPasteDriveEntry', { path: pastePath }),
    },
    {
      label: 'Duplicate',
      click: () => helpers.sendAction('nxDuplicateDriveEntry', { path: p }),
    },
    { type: 'separator' },
    {
      label: 'Rename',
      click: () => helpers.sendAction('nxRenameDriveEntry', { path: p }),
    },
    {
      label: 'Delete',
      click: () => helpers.sendAction('nxDeleteDriveEntry', { path: p, type }),
    },
    { type: 'separator' },
    {
      label: 'Copy path',
      click: () => helpers.sendAction('nxCopyDrivePath', { path: p }),
    },
  );

  if (isDir) {
    items.push(
      { type: 'separator' },
      {
        label: 'New Folder',
        click: () => helpers.sendAction('nxNewFolderDriveEntry', { path: newParent }),
      },
      newFileMenuItem(helpers, { path: newParent }),
    );
  }

  return items;
}
