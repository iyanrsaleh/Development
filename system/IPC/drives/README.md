# `system/IPC/drives/`

Dokumentasi teknis **satu pintu** untuk File System OS + File Manager distro Development.  
Banyak orang akan baca file ini dulu sebelum menyentuh kode — jaga agar tetap akurat.

---

## Isi

1. [Peran folder ini](#1-peran-folder-ini)
2. [Stack (lapisan)](#2-stack-lapisan)
3. [Kontrak package vs system](#3-kontrak-package-vs-system)
4. [API `window.*` (IPC FS)](#4-api-window-ipc-fs)
5. [UI File Manager — `package/drives`](#5-ui-file-manager--packagedrives)
6. [Editor teks multi-jendela](#6-editor-teks-multi-jendela)
7. [Sidebar History](#7-sidebar-history)
8. [Context menu](#8-context-menu)
9. [Hook global (renderer)](#9-hook-global-renderer)
10. [Belum / non-goals](#10-belum--non-goals)
11. [Cara pakai singkat](#11-cara-pakai-singkat)
12. [Peta file terkait](#12-peta-file-terkait)
13. [Keputusan teknis & bug yang sudah ditutup](#13-keputusan-teknis--bug-yang-sudah-ditutup)
14. [Riwayat](#14-riwayat)

---

## 1. Peran folder ini

Thin wrapper → `window.NxDrives` (kernel `assets/modules/drives`).

| Aturan | Artinya |
|--------|---------|
| **Satu isu = satu file** | Nama file selaras `electron/distro/drives/` + method kernel |
| **Tanpa UI** | Tidak ada HTML/CSS di sini; UI di `package/drives` |
| **Assign di `system/index.js`** | Package memanggil `window.listDir` dll., **bukan** import dari folder ini |

Tidak ada modul kernel terpisah “fileTree”. Semua FS OS lewat **satu** `NxDrives`.

---

## 2. Stack (lapisan)

```
package/drives (UI Files)
        │  window.listDrives / listDir / copy / openAppWindow / openFileEditor …
        ▼
system/IPC/drives/*.js          ← folder ini (alias tipis)
        ▼
window.NxDrives                 ← assets/modules/drives (kernel)
        ▼
electronAPI → electron/distro/drives (IPC + fs / chokidar)
```

Editor teks **bukan** bagian IPC folder ini, tapi memakai API yang sama:

```
package/drives openOsFile()
        │  openAppWindow({ id: 'nx-os-editor-<hash>' })
        │  openFileEditor(path, mount, { io: 'os' })
        ▼
system/directory/editor.js      ← multi-instance CodeMirror
        │  window.readFile / writeFile   (io: 'os')
        │  window.NxDirectory.*          (io: 'directory' — package directory)
        ▼
system/IPC/drives (read/write) → NxDrives → OS
```

---

## 3. Kontrak package vs system

| Lapisan | Boleh | Jangan |
|---------|-------|--------|
| `package/drives` | `window.*` saja | Import `system/`, `assets/modules/`, path relatif ke IPC |
| `system/IPC/drives` | Alias ke `NxDrives` / fallback `electronAPI` | UI, state FM, DOM |
| `system/directory/editor.js` | Multi editor, `io: 'os'\|'directory'` | Asumsi hanya satu jendela OS |
| `system/contextmenu/*` | buildMenu (main) + aksi (renderer) | Baca `document` di **buildMenu** |

Path FS OS: **absolut** (mis. `D:\AI\notes.txt`). Argumen mendukung `(path, opts)` / `{ path, … }` lewat `mergePathOpts` di kernel.

---

## 4. API `window.*` (IPC FS)

Assign di [`system/index.js`](../../index.js).

| File | API | Status |
|------|-----|--------|
| `list.js` | `listDrives()` | ✅ |
| `places.js` | `listUserPlaces()` — Desktop/Documents/Downloads/Music/Pictures/Videos (`app.getPath`) | ✅ |
| `tree.js` | `listDir`, `statPath`, `pathExists`, `searchDir` | ✅ |
| `icon.js` | `getOsFileIcon` — ExtractAssociatedIcon (nxcode25) + resolve `.lnk` | ✅ |
| `open.js` | `openOsPath` — Start-Process `.lnk` / `shell.openPath` | ✅ |
| `read.js` | `readFile` | ✅ |
| `write.js` | `writeFile`, `editFile`, `appendFile` | ✅ |
| `unlink.js` | `unlink` (file) | ✅ |
| `mkdir.js` | `mkdir` | ✅ |
| `rm.js` | `rm` (folder recursive) | ✅ |
| `rename.js` | `rename`, `move` | ✅ |
| `copy.js` | `copy` | ✅ |
| `watch.js` | `watch`, `unwatch` (chokidar) | ✅ |
| `index.js` | barrel re-export | ✅ |
| `util.js` | `nx()`, `need()` — helper internal | — |

`listDrives` punya fallback `electronAPI.listDrives` jika `NxDrives.list` belum siap; API lain melempar lewat `need()` jika kernel belum ada.

### `listUserPlaces()`

Folder khusus user lewat Electron `app.getPath` (Windows 11 / macOS / Linux):

```js
const places = await window.listUserPlaces();
// [{ id, key, name, path, kind, special? }, …]
// key: desktop | documents | downloads | music | pictures | videos | trash
```

- Hanya folder yang ada di disk (skip jika `getPath` gagal / bukan directory).
- **Recycle Bin / Trash** selalu di akhir daftar:
  - Windows: `path: 'nx:recycle-bin'` → klik menampilkan isi di FM lewat **fs `$Recycle.Bin`** (sama listDir C:/D:) + nama asli dari file `$I`.
  - macOS: `~/.Trash` · Linux: `~/.local/share/Trash/files` (navigasi FM biasa).
- Channel: `nexa-distro-list-places` → preload `listUserPlaces` → `NxDrives.listUserPlaces`.
- UI: sidebar Places di bawah “This PC” (`package/drives`).
- List isi: `listDir('nx:recycle-bin')` → `electron/distro/drives/recycle.js`.

### `getOsFileIcon(path, opts?)`

Ikon file native OS — pola **nxcode25 `extractShortcutIcon`**:

1. WScript.Shell → `TargetPath` / `IconLocation` (otomatis per perangkat)
2. `[System.Drawing.Icon]::ExtractAssociatedIcon` → PNG base64  
3. Fallback: ekstrak dari file `.lnk` sendiri; lalu `app.getFileIcon`

```js
const { path, source, dataUrl, method } = await window.getOsFileIcon(
  'C:\\Users\\…\\Desktop\\Chrome.lnk',
  { size: 'normal' },
);
// method: 'extractAssociatedIcon' | 'getFileIcon'
```

- Channel: `nexa-distro-file-icon` → preload `getOsFileIcon` → `NxDrives.getFileIcon`.
- FM: setelah render, hydrate `.lnk` / `.exe` / … jadi `<img class="fm-os-icon">` (cache per path+size).

### `searchDir(path, opts?)`

Cari nama file/folder di bawah `path` (BFS di main process).

```js
const { path, query, matches, truncated } = await window.searchDir('D:\\AI', {
  query: 'readme',
  maxDepth: 8,      // default 8, max 32
  maxResults: 200,  // default 200, max 1000
  includeHidden: false,
});
// matches: [{ name, path, type, size, mtime, … }, …]
```

- Match case-insensitive pada **nama** (substring).
- Skip `node_modules`, `.git`, `.svn`, `.hg`, `$Recycle.Bin`, System Volume Information.
- Channel: `nexa-distro-filetree-search` → preload `fileTreeSearch` → `NxDrives.searchDir`.

### UI search (package/drives)

| Mode | Perilaku |
|------|----------|
| Query kosong | Tampil isi folder / This PC normal |
| Query, Subfolders **off** | Filter lokal `children` / nama drive |
| Query, Subfolders **on** (+ ada path) | Debounce ~250ms → `searchDir`; spinner overlay |
| This PC (`path === ''`) | Hanya filter drive; tombol Subfolders disabled |
| Enter di search | Paksa search rekursif (jika ada path + query) |
| Ctrl+F | Fokus input search |
| Esc | Kosongkan query + keluar mode hasil |
| Navigasi folder | Clear search (hindari hasil stale) |
| Double-click folder hasil | `navigate` + clear search |
| Double-click file | `openOsFile` |

---

## 5. UI File Manager — `package/drives`

Judul launcher: **Files** (id package tetap `drives`).

### Sudah jalan

| Area | Fitur |
|------|--------|
| Navigasi | This PC → Places (Desktop/…) → drive → folder; back/forward/up/refresh; pathbar; breadcrumb |
| View | Grid / list; icon folder (`assets/folder/`), drive (`assets/devices/`), tipe file (kernel icons) |
| Layout | Status bar menempel bawah (`has-nx-drives-layout`); sidebar resize |
| Context menu | Native Electron; target `nxdrive::…` / `nxdrive-cwd::…` → [`nxDriveEntry.js`](../../contextmenu/nxDriveEntry.js) |
| Menu item | Open, Copy/Cut/Paste, Duplicate, Rename, Delete, Copy path, New Folder |
| New File | Submenu per tipe: Web, Backend, Styles, Data & Config, Documents, Shell, LibreOffice, Office |
| Inline edit | Rename / New File / New Folder **tanpa modal** (input di nama item; Enter/Esc) |
| Multi-select | Ctrl+klik, Shift+range, marquee (`.fm-select-box`) |
| Drag-drop | Tarik selection ke folder / sidebar / breadcrumb → **move** (`rename`) |
| Keyboard | Ctrl+A, Ctrl+C/X/V, Delete, F2, Esc; **Ctrl+F** fokus search |
| Search | Filter cwd / nama drive; Subfolders → `window.searchDir` (lihat §4) |
| Multi-ops | Clipboard & Delete multi-path (`window.__nxDriveClipboard`) |
| Editor teks | Double-click / Open → **jendela app per file** (`nx-os-editor-<hash>`); lihat §6 |
| Sidebar History | Places → Drives → **History**; toggle chevron + Clear; persist DistroBuckets; lihat §7 |
| Breadcrumb | Path bar Nautilus: ikon drive/folder + label + chevron Fluent; class `.fm-bc-seg` (bukan `.badge` pill) |
| Prefs Settings | Warna folder / view / hidden / search default — `system/utilities/drivesPrefs.js` + Settings → Files |

### Id HTML context-menu (penting)

buildMenu jalan di **main process** (tanpa DOM). Path & tipe **harus** terkode di `id`:

| Pola | Arti |
|------|------|
| `nxdrive::file::<enc>` | Item file |
| `nxdrive::directory::<enc>` | Item folder |
| `nxdrive::drive::<enc>` | Item drive (This PC) |
| `nxdrive-cwd::<enc>` | Area kosong / cwd view |

`enc` = `encodeURIComponent(absPath)`. Helper: `nxDriveTargetId` / `nxDriveCwdId` di `package/drives/index.js`.

---

## 6. Editor teks multi-jendela

**Masalah lama:** satu id jendela (`nx-os-file-editor`) + `reuse: true` → buka file lain hanya **berganti konten**.

**Sekarang:** setiap path absolut punya jendela sendiri; file yang sama reuse jendela itu.

### Alur buka file (FM)

1. Double-click / Open / `window.openDrivesFileEditor(path)` → `openOsFile(absPath)`.
2. Cek `window.canOpenInFileViewer(name)` (teks / markdown / gambar / PDF; tolak office/binary lain).
3. Hash FNV-1a path → id jendela:

   ```
   nx-os-editor-<hashBase36>
   ```

4. `window.openAppWindow({ id, title: fileName, reuse: true, animate: true })`.
5. Body diisi shell:

   ```html
   <div class="nx-os-editor-shell">
     <div class="nx-os-editor-mount"></div>
   </div>
   ```

6. `window.openFileEditor(absPath, mount, { io: 'os' })`.

File **beda** → hash beda → jendela baru.  
File **sama** → id sama → jendela lama di-focus/reuse, konten di-mount ulang.

### `openFileEditor` — multi-instance

Sumber: [`system/directory/editor.js`](../../directory/editor.js).

| Konsep | Perilaku |
|--------|----------|
| `instances` Map | Key = mount HTMLElement; value = `{ editor, path, saveFn, originalId, token }` |
| Scope dispose | Hanya container yang dibuka ulang — **bukan** semua jendela |
| `io: 'os'` | Baca/tulis `window.readFile` / `window.writeFile` |
| `io: 'directory'` (default) | `window.NxDirectory.*` — package directory (satu panel, ganti file di mount sama) |
| Id mount OS | `nx-file-viewer-editor::<hashPath>` |
| Id mount directory | `nx-file-viewer-editor` (statis) |
| Race load | `token` / `stillMine()` — abaikan hasil async jika mount sudah diganti |
| Ctrl+S | Handler global sekali; simpan editor di bawah fokus / `lastFocusedMount` |
| Context Save | `saveActiveEditorFile(editorId)` — id dari target klik-kanan |

### CSS jendela editor

`package/drives/style.css`: class `has-nx-os-editor-layout` pada `.nx-app-window__body`, plus `.nx-os-editor-shell` / `.nx-os-editor-mount`.

Directory package: `#nx-file-viewer-mount`, `#nx-file-viewer-editor`, `[id^="nx-file-viewer-editor"]` di `system/directory/style.css`.

### CodeMirror 6 — aturan scroll & versi

| Aturan | Detail |
|--------|--------|
| **Jangan** `.nx-scroll` di `.cm-scroller` | CM6 punya scroll sendiri; class itu mengganggu measure/tile → crash `Cannot destructure property 'tile'` |
| Scrollbar editor | CSS lokal `.nx-file-viewer .cm-scroller` di `system/directory/style.css` |
| Bundle | `assets/modules/codemirror6/codemirror6.bundle.js` |
| Pin | `@codemirror/view@6.43.2` (hindari regresi tile 6.39.x / 6.43.3–6.43.4; lihat [codemirror/dev#1652](https://github.com/codemirror/dev/issues/1652)) |

### Bukan tanggung jawab editor ini

- LibreOffice / Office binary (`.docx`, `.xlsx`, …) — tidak dibuka di CodeMirror.
- Pratinjau gambar OS — `readFile({ encoding: 'binary' })` → data URL (sama pola directory `readImage`); SVG tetap teks CM6.
- Markdown OS — CM6 + tab Preview (`NexaMarkdown`), sama directory.
- Satu panel directory tree tetap single-mount (bukan multi-window).

---

## 7. Sidebar History

Urutan sidebar: **Places → Drives → History** (History di bawah supaya daftar panjang tidak mendorong Drives).

### Markup (scroll terpisah dari header)

```
#fm-sidebar
  #fm-sidebar-scroll.nx-scroll   ← scroll utama Places / Drives / History
    Places + This PC + #fm-places + #fm-drives
    .fm-history-section
      .fm-history-head …
      #fm-history-scroll.nx-scroll   ← daftar History (max-height)
        #fm-open-history
```

| Elemen | Peran |
|--------|--------|
| `#fm-sidebar-scroll.nx-scroll` | Scroll kernel seluruh isi sidebar |
| `.fm-history-section` | Induk flex (header + scroll). **Tanpa** `.nx-scroll` |
| `#fm-history-scroll.nx-scroll` | Panel daftar; `max-height: min(280px, 40vh)` |
| `#fm-history-toggle` | Chevron bawah = terbuka; kanan = tertutup (`is-collapsed`) |
| `#fm-history-clear` | Clear all; `hidden` jika daftar kosong |
| Per-item × | Fluent `dismiss_16` on hover → hapus satu path |

### Persistensi DistroBuckets

Hanya DistroBuckets — **tanpa** localStorage (SOP sama wallpaper/launcher).

| | |
|--|--|
| Store | `nx-drives` (`system/index.js` → `initDistroBuckets`, version ≥ 8) |
| Row id | `__open-history__` |
| Shape | `{ id, items: [{ path, name }, …], expanded?: boolean, updatedAt? }` |
| `expanded` | `true` = panel terbuka (chevron bawah); default `true` jika field belum ada |
| API | `window.DistroBuckets('nx-drives').get/set` |
| Max | 20 (MRU) |

Setelah F5: daftar + status chevron tetap. Clear / hapus item → `saveOpenHistory` menulis ulang row. Toggle chevron → `persist: true`.

### Klik item History

1. `openOsFile(path, name, { fromHistory: true })`.
2. Jendela masih ada (minimized) → `restoreAppWindow`.
3. Jendela hilang → `openAppWindow` + `openFileEditor` ulang.
4. Badge row: `is-window-open` / `is-window-minimized` (MutationObserver di `#nxhome`).

### Scroll — aturan wajib (distro README §4a)

1. Sidebar FM: `overflow: hidden` di `#fm-sidebar` — scroll di `#fm-sidebar-scroll.nx-scroll`.
2. Content FM: scroll di `#fm-view-scroll.nx-scroll` (bukan di `#fm-view`).
3. History daftar: `#fm-history-scroll.nx-scroll` dengan `max-height` (nested OK).
4. Di dalam `.ubuntu-workbench`, reset `scrollbar-width` / `scrollbar-color` pada `.nx-scroll` — tanpa ini Chromium mengabaikan `::-webkit-scrollbar` kernel. Lihat `assets/components/scrollbar.css`.

---

## 8. Context menu

### Rantai target

```
klik-kanan (renderer, capture)
  App.js → notifyContextMenuTarget(id)   ← sendSync
  main: lastContextMenuTargetId
  electronShell → NXCONTEXTMENU(targetId, helpers)
  klik item → nexaContextAction → modul aksi di system/contextmenu/
```

### Registry relevan ([`contextmenu/index.js`](../../contextmenu/index.js))

| Match | Modul |
|-------|--------|
| `nxdrive::…` / `nxdrive-cwd::…` / `#nx-drives-app` | `nxDriveEntry` |
| `nx-file-viewer-editor` **atau** `nx-file-viewer-editor::…` | `nxFileViewerEditor` |
| `nx-file-viewer-mount` | `nxFileViewerMount` |

### Save editor (multi-window)

```js
// buildMenu
helpers.sendAction('nxSaveActiveFile', { editorId: targetId });

// aksi
await saveActiveEditorFile(payload?.editorId);
```

Tanpa `editorId`, fallback ke `lastFocusedMount` / instance terakhir.

### Catatan teknis

- **buildMenu** = main → jangan `document` / `window` DOM.
- **Aksi** = renderer → boleh `window.*` + DOM.
- Target id ke main **wajib sync** (`notifyContextMenuTarget` sendSync) sebelum popup dibangun — async sempat race (menu salah target).

---

## 9. Hook global (renderer)

Dipasang oleh `package/drives` saat app Files hidup:

| Hook | Fungsi |
|------|--------|
| `window.refreshDrivesFm()` | Reload isi cwd |
| `window.navigateDrivesFm(path)` | Navigasi ke path absolut / This PC (`''`) |
| `window.startDrivesFmNameEdit(opts)` | Mulai inline rename / new |
| `window.openDrivesFileEditor(path)` | Buka editor OS multi-jendela |

Editor (dari `system/index.js`):

| Hook | Fungsi |
|------|--------|
| `window.openFileEditor` | Buka CM6 di mount |
| `window.canOpenInFileViewer` | Filter ekstensi (teks + gambar + PDF) |
| `window.canOpenOsPdf` | `.pdf` → iframe blob URL |
| `window.canOpenInTextEditor` | Subset teks saja |
| `window.attachFileClickViewer` | Package directory saja |

Clipboard FM (bukan API resmi, state runtime):

```js
window.__nxDriveClipboard = { mode: 'copy'|'cut', paths: string[] };
```

---

## 10. Belum / non-goals

| Fitur | Catatan |
|-------|---------|
| Sort kolom list | ✅ Klik header Name / Size|Free / Modified|Type |
| Drop file dari luar OS | Hanya DnD internal app |
| Undo / Recycle Bin | Sidebar Places `nx:recycle-bin`; context menu Restore / Empty / Delete permanently; Delete key = hapus permanen di recycle |

| Progress UI copy besar | Sync await; error → alert |
| Pratinjau PDF OS | ✅ `readFile` binary → blob URL → iframe (max 32 MB) |
| Pratinjau gambar OS | ✅ data URL (max 5 MB); **SVG ikut pratinjau** + Ctrl+scroll zoom |
| LibreOffice / Office binary | Bukan lewat CodeMirror |
| `watch` di UI FM | ✅ subscribe folder aktif (non-recursive), debounce refresh |
| Index global / Everything.exe | Hanya search di bawah path aktif, bukan seluruh disk |
| Mouse back/forward di Files | ✅ history FM sesi; blokir popstate rute package lain |

---

## 11. Cara pakai singkat

```js
// FS OS
const drives = await window.listDrives();
const { path, children } = await window.listDir('D:\\AI');
const { matches } = await window.searchDir('D:\\AI', { query: 'readme' });
await window.mkdir('D:\\AI\\New Folder');
await window.writeFile('D:\\AI\\notes.txt', 'hello');
await window.copy(src, dest);
await window.rename(from, to);
await window.rm(folder, { recursive: true });
await window.unlink(file);

// Buka editor (dari UI / hook)
await window.openDrivesFileEditor('D:\\AI\\notes.txt');
// atau manual:
const win = await window.openAppWindow({
  id: 'nx-os-editor-…', // unik per path
  title: 'notes.txt',
  reuse: true,
});
await window.openFileEditor('D:\\AI\\notes.txt', mountEl, { io: 'os' });
```

---

## 12. Peta file terkait

| Path | Peran |
|------|--------|
| `system/IPC/drives/*` | Alias IPC FS (folder ini) |
| `system/index.js` | Assign `window.listDrives`, `searchDir`, `openFileEditor`, DistroBuckets `nx-drives` |
| `package/drives/index.js` | UI FM + History + search + `openOsFile` multi-window |
| `package/drives/style.css` | Layout FM, History scroll, `.fm-search`, jendela editor OS |
| `assets/components/scrollbar.css` | Reset `scrollbar-width` untuk `.nx-scroll` di workbench |
| `assets/components/file-manager.css` | Base Nautilus; sidebar override di package style |
| `system/directory/editor.js` | CM6 multi-instance + save (**tanpa** `.nx-scroll` di scroller) |
| `system/directory/style.css` | Flex height chain + scrollbar `.cm-scroller` |
| `assets/modules/codemirror6/` | Bundle CM6 (view pin 6.43.2) |
| `system/contextmenu/nxDriveEntry.js` | Menu item / cwd FM |
| `system/contextmenu/nx-file-viewer-editor.js` | Menu Save / Undo editor |
| `system/contextmenu/index.js` | REGISTRY match target |
| `App.js` | `notifyContextMenuTarget` (prioritas id `nxdrive::`, `nx-file-viewer-editor`, …) |
| `assets/modules/drives` | Kernel `NxDrives` |
| `electron/distro/drives` | IPC main + fs |

---

## 13. Keputusan teknis & bug yang sudah ditutup

Ringkasan supaya tidak diulang / di-rollback tanpa sadar.

| Topik | Keputusan | Alasan / gejala yang sudah terjadi |
|-------|-----------|-------------------------------------|
| Persist History | DistroBuckets `nx-drives` saja | Hindari localStorage; konsisten SOP distro |
| Shape History | `items` + `expanded` satu row | Chevron buka/tutup ikut F5 |
| Urutan sidebar | Places → Drives → History | History panjang tidak mendorong daftar drive |
| Scroll content | Div `#fm-view-scroll.nx-scroll` di sekitar `#fm-view` | Bukan overflow native di grid/list |
| Tinggi History | Dinamis (`getBoundingClientRect`) + `flex: 1 1 0` | `vh` statis / flex ikut konten = overflow salah elemen |
| Sidebar overflow | `hidden` di aside; scroll `#fm-sidebar-scroll.nx-scroll` | Override `file-manager.css` `overflow-y: auto` |
| Scrollbar kernel di workbench | Reset `scrollbar-width` pada `.nx-scroll` | Inherit `thin` dari `.ubuntu-workbench` → Chromium abaikan `::-webkit-scrollbar` → scrollbar native Windows |
| Multi-window editor | Id `nx-os-editor-<hash>` per path | Satu jendela reuse = ganti file, bukan paralel |
| CM6 `.nx-scroll` | **Dilarang** di `.cm-scroller` | Ganggu measure → crash tile |
| CM6 bundle | Pin `@codemirror/view@6.43.2` | Regresi tile di 6.39.x / 6.43.3–4 |
| Loading view | Overlay `#fm-loading` + `NXUI.spinner`; warna/size dari `nexaRoute.spinnerConfig` (= `App.js` Tatiye spinner, fallback `#CB2F2F`) | Bukan di dalam `#fm-view` / warna accent distro |
| Search cwd | Filter lokal `children` / nama drive (case-insensitive) | Instan; This PC = filter drive saja |
| Search rekursif | `window.searchDir` → IPC `nexa-distro-filetree-search` (BFS, maxDepth 8, maxResults 200) | Hanya di bawah path aktif; skip `node_modules`/`.git`/… |
| Search UI | Toolbar `.fm-search` + toggle Subfolders; Ctrl+F / Esc; navigasi clear query | Hasil stale dihindari; Enter = paksa IPC |
| Prefs warna folder | DistroBuckets `nx-drives` `__prefs__`; FM baca `getFolderColor()` / event `nx-drives-prefs` | Bukan hardcode `FOLDER_COLOR = 'orange'` |
| Non-goal search | Bukan index global / Everything.exe | Lingkup = folder/drive yang sedang dibuka |
| Brace korup search | Jangan sisipkan `}` ekstra setelah `renderDrivesSidebar` saat menambah helper search | Gejala: module Files gagal parse → jendela app tidak terbuka; diperbaiki Jul 2026 |

---

## 14. Riwayat

1. **IPC FS OS** — split per isu (list/tree/read/write/…/watch), shell + kernel + distro IPC.
2. **UI Files** — Nautilus-like workbench di `package/drives`, asset folder/devices.
3. **Context menu** — pola sama directory tree; FS lewat `window.*` (bukan `NxDirectory.op`).
4. **Inline rename/new** + **New File** bertipe submenu.
5. **Multi-select, marquee, drag-drop move, keyboard, clipboard multi**.
6. **Editor OS** — jendela app terpisah dari FM (`openAppWindow` + `io: 'os'`).
7. **Multi-window editor** — id `nx-os-editor-<hash>` per path; instance CM6 paralel; Save/Ctrl+S per jendela.
8. **Sidebar History** — DistroBuckets, restore minimize, Clear / hapus per item.
9. **History scroll + chevron** — `#fm-history-scroll.nx-scroll`, tinggi dinamis, toggle persist `expanded`.
10. **Scrollbar workbench** — reset `scrollbar-width` agar gaya kernel `.nx-scroll` aktif.
11. **CM6 stabil** — lepas `.nx-scroll` dari scroller; pin view `6.43.2`.
12. **Search FM** — filter cwd + `searchDir` rekursif (IPC tree); toolbar Subfolders; Ctrl+F/Esc. Bug sisipan: `}` ekstra setelah `renderDrivesSidebar` mematahkan parse package → jendela Files tidak terbuka (diperbaiki).
13. **Settings Files** — warna folder Yaru (`assets/folder`), view default, includeHidden, searchRecursiveDefault; store `nx-drives` `__prefs__`.
14. **Viewer OS gambar + markdown** — FM buka jendela app untuk img (data URL) dan `.md`/`.mdx` (CM6 + Preview); `canOpenInFileViewer`.
15. **Places IPC** — `listUserPlaces` via `app.getPath` (Desktop, Documents, Downloads, Music, Pictures, Videos) di sidebar FM.
16. **Viewer PDF OS** — double-click `.pdf` → jendela app + iframe Chromium (`canOpenOsPdf`).
17. **Ikon native OS** — pola nxcode25: WScript.Shell + `ExtractAssociatedIcon` (bukan hanya `app.getFileIcon`).
18. **Launch `.lnk`** — double-click / Enter / History → `openOsPath` (Start-Process target atau `shell.openPath`).
19. **SVG pratinjau** — sama image viewer; Ctrl+scroll zoom (fit awal).
20. **Mouse history FM** — X1/X2 + Alt+←/→ → `goHistory`; blokir SPA popstate saat jendela Files aktif.
21. **Sort list** — klik header Name/Size/Modified (atau Free/Type di This PC).
22. **Watch live** — `window.watch` pada folder aktif → refresh daftar (debounce).
23. **Recycle Bin di Places** — Windows `nx:recycle-bin` → list `$Recycle.Bin` via fs (sama C:/D:) + parse `$I` nama asli; macOS/Linux Trash folder.
24. **Context menu Recycle Bin** — empty area: Refresh / Empty Recycle Bin / Restore+Delete (selection); item: Restore / Delete permanently / Open / Copy path. IPC: `nexa-distro-recycle-{empty,restore,delete}`.

---

**Saat mengubah perilaku:** perbarui bagian terkait di README ini di commit yang sama — ini sumber kebenaran untuk orang berikutnya.
