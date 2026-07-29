# Panduan Developer Distro "Development"

> Dokumen ini untuk developer yang bekerja **DI DALAM** distro ini —
> menambah halaman, fitur, storage, dst. Untuk arsitektur KERNEL (kalau
> perlu mengubah `assets/modules/nxdom.js` atau menambah API global baru
> yang dipakai SEMUA distro), baca `templates/Karnel.md` dulu.
> Alur shell secara keseluruhan: `templates/FLOW.md`.

## 1. Apa itu "distro" di sini

Distro = satu extension/tema aplikasi. **Hanya SATU distro aktif** dalam
satu instalasi (dicatat di IndexedDB store `distroGrafis`, dibaca lewat
`window.NxExtension.getActiveExtension()`). `Development` adalah distro
**contoh/referensi** — pola-polanya (file browser, editor, context-menu,
resize kolom, SSH cache) dibangun di sini sebagai bukti-konsep yang bisa
ditiru distro lain.

Ganti distro aktif (install / tombol Aktifkan di `instal.js`) memakai
`window.NxExtension.setActiveExtension(meta)` — shell ikut soft-switch
(cache route, titlebar, sync main process) tanpa wajib restart penuh.
Developer distro **tidak perlu** memanggil helper soft-switch itu sendiri.

## 2. Struktur folder distro ini

```
templates/distro/Development/
  index.js          ← WAJIB, export async function NXHOME(container, routeMeta)
  home.js            ← route default (dimuat otomatis kalau App.js config "home")
  cotoh.js           ← contoh route tambahan di ROOT distro
  style.css          ← CSS khusus distro ini (auto-@import, lihat §5)
  package.json       ← manifest distro (id, title, gitrepo, dll — lihat §7)
  assets/
    fonts/            ← font khusus distro (lihat §5, contoh: Fluent Icons)
    brend/            ← favicon.ico, icon.png, logo.png (dirujuk package.json "brend")
  storage/            ← data JSON per-nama (window.NxStorage, lihat §4)
  package/
    manifest.json      ← { "componen": ["news","gallery","directory","models","settings",…] }
    news/             ← contoh componen + usePackageEndpoint
    gallery/          ← contoh componen (NxDirectory / NxStorage)
    directory/        ← contoh file browser + editor + resize
    models/           ← contoh endpoint per-package + NexaTables
    settings/         ← contoh shell + #nxpackage + home.js (rute #package/…)
    tables/           ← contoh halaman nested ke #nxpackage (tanpa home.js)
  system/
    index.js           ← titik registrasi TUNGGAL (lihat §3 — WAJIB paham ini duluan)
    titlebar/           ← custom titlebar (konvensi NXTITLEBAR)
    contextmenu/         ← context-menu klik-kanan (lihat §6) — icon PNG WAJIB 32×32
    buckets/              ← IndexedDB terpisah khusus distro ini
    directory/             ← file browser + editor (lihat §6)
    shortcut/              ← array shortcut dari manifest + package.json (lihat §6c)
    ssh/                    ← SSH tunnel + cache tabel (lihat §6a) — belum punya package UI
```

**Aturan penamaan fungsi entry** (konvensi baku):
- `index.js` root distro → `export async function NXHOME(container, routeMeta)`
- `system/titlebar/index.js` → `export async function NXTITLEBAR(container)`
- File di ROOT distro (`home.js`, `cotoh.js`) → nama fungsi = nama file
  (`home`, `cotoh`)
- `package/{nama}/index.js` → `export async function index(page, route)`
  karena URL-nya `#distro/package/{nama}/index` (segmen terakhir = `index`).
  Bukan nama folder — lihat `package/directory/index.js`,
  `package/gallery/index.js`, `package/news/index.js`,
  `package/models/index.js`, `package/settings/index.js`.
- `package/{nama}/home.js` → `export async function home(page, route)` —
  **wajib** hanya jika `index.js` memasang `<div id="nxpackage"></div>`
  (lihat §6d).
## 3. `system/index.js` — WAJIB dipahami sebelum menambah fitur apa pun

`templates/distro/grafis.js` (shell, generik untuk semua distro) memuat
`system/index.js` **SEKALI**, **SEBELUM** `NXHOME`/route `package/*` mana
pun bisa diakses. File ini adalah **satu-satunya** titik registrasi fitur
turunan milik distro ini — hasilnya di-assign ke `window.*` sebagai
side-effect.

**Kontrak yang SELALU dijaga**: `package/{nama}/index.js` (pemakai) TIDAK
PERNAH `import` apa pun dari `system/` — cukup panggil `window.fungsiItu(...)`
langsung. Lihat komentar di puncak `package/directory/index.js` yang
menegaskan ini ("TIDAK ADA import di file ini").

Cuplikan pola nyata (ringkas — file penuh lebih panjang karena SSH):

```js
// system/index.js — registrasi side-effect ke window.*
import { renderDirectoryTreeHtml, attachDirectoryTreePersistence } from './directory/index.js';
import { openFileEditor, attachFileClickViewer } from './directory/editor.js';
import { initDistroBuckets, bucket } from './buckets/index.js';
import { /* loadSSHConfig, syncTablesToIndexedDB, readTable, ... */ } from './ssh/index.js';

window.renderDirectoryTreeHtml = renderDirectoryTreeHtml;
window.attachDirectoryTreePersistence = attachDirectoryTreePersistence;
window.openFileEditor = openFileEditor;
window.attachFileClickViewer = attachFileClickViewer;
// + window.syncSSHTables / readSSHTable / runSSHQuery / ... (lihat file)

try {
  await initDistroBuckets('Development', ['nx-ssh-table-cache'], 2);
} catch (err) {
  console.error('[system/index.js] gagal inisialisasi DistroBuckets:', err);
}
window.DistroBuckets = bucket;
```

**Menambah fitur baru milik distro ini** = 3 langkah:
1. Tulis logic sebagai modul biasa di `system/{fitur baru}/index.js`
   (`export function ...`), TIDAK menyentuh `window` di file itu sendiri.
2. `import` modul itu di `system/index.js`, assign ke `window.namaFungsi`.
3. Pakai `window.namaFungsi(...)` dari `package/{nama}/index.js` mana pun
   — tanpa import.

## 4. API kernel yang SUDAH GLOBAL — TIDAK PERLU import sama sekali

Modul ini dipasang kernel (`assets/modules/nxdom.js` lewat `installNexa*`)
sebelum `NXHOME` bisa diakses — panggil langsung `window.NxX.method(...)`,
TANPA `import`, dari file mana pun di distro ini (termasuk dari dalam
`system/index.js` sendiri):

| | Kegunaan | Detail lengkap |
|---|---|---|
| `window.NxDirectory` | Baca/tulis file & folder di dalam distro ini (sandbox) — `readFile`, `writeFile`, `traverseDirectory`, `readImage`, `op` (copy/move/rename/delete/mkdir/mkfile), dll | `assets/modules/directory/README.md` |
| `window.NxStorage` | Baca/tulis JSON per-nama di `storage/{nama}.json` — `NxStorage('nama')`, `.save(data)`, `.list()` | `assets/modules/storage/README.md` |
| `window.NxResize` | Drag-to-resize panel dengan persistensi localStorage | `assets/modules/resize/README.md` |
| `window.NxExtension` | Data distro aktif & componen terinstal — `getActiveExtension()`, `setActiveExtension()`, `listInstalledComponenFor()`, dll | `assets/modules/extension/README.md` |
| `window.NxSSHTunnel` | SSH tunnel + query DB di main process Electron (dipakai lewat lapisan `system/ssh/`, biasanya bukan langsung dari package) | `assets/modules/SSHTunne/` |

**PENTING — jangan tertebak salah**: modul di atas TIDAK PERNAH dicari
lewat `import`. Kalau butuh, panggil `window.NxX.method(...)` — kalau
"belum ada", cek README modul terkait dulu, JANGAN tulis `import` path
relatif (rawan 404 kalau folder sumber dipindah). Histori:
`templates/storage/index.js` sudah dihapus → jadi `window.NxExtension`
(lihat `templates/Karnel.md` §7a).

Contoh pakai `NxStorage` (dari `package/directory/index.js`):
```js
const data = await window.NxStorage('tabel');       // GET
await window.NxStorage('tabel').save({ foo: 1 });   // POST, replace penuh
```

## 4a. Aturan pemakaian scroll — utamakan `.nx-scroll` bawaan

Elemen yang butuh scroll (daftar panjang, panel tinggi tetap, dll) **boleh**
custom `overflow`/scrollbar sendiri kalau memang ada kebutuhan khusus, TAPI
**sebaiknya pakai class `.nx-scroll`** (bawaan `assets/modules/scroll/`,
sudah global, sudah ter-`<link>` — TIDAK perlu import/definisi ulang) —
konsisten dengan scrollbar tema aplikasi (lihat
`assets/modules/scroll/index.css` untuk daftar varian: `.nx-scroll-x`,
`.nx-scroll-hidden`, `.nx-scroll-autohide`, dll).

**Kapan AMAN pasang `.nx-scroll` langsung ke elemen**: kontennya murni
(daftar/teks/list biasa), TIDAK ADA komponen pihak lain di dalamnya yang
mengurus scroll internalnya sendiri. Contoh nyata:
`#nx-directory-tree-mount` (`package/directory/index.js`) — daftar file,
aman diberi `.nx-scroll` langsung.

**Kapan TIDAK BOLEH** — kontainer yang isinya **komponen dengan scroll
internal sendiri** (mis. editor CodeMirror6 — lihat
`system/directory/editor.js`: `NexaCmirror6` membuat elemen
`.nexacmirror6-wrap`/`.cm-scroller` SENDIRI dengan overflow-nya sendiri).
Memaksa `.nx-scroll` di container LUAR komponen semacam itu menghasilkan
**scroll ganda bertumpuk** DAN — kalau container itu juga membungkus
header/judul — header ikut ter-scroll keluar pandangan.
Contoh nyata: `#editor`/`.nx-directory-layout__viewer`
(`package/directory/index.js`) **SENGAJA TIDAK** diberi `.nx-scroll`.

Tinggi kolom/panel juga **jangan** angka `vh` statis — hitung DINAMIS
lewat `window.NXUI.Window.height()` dikurangi posisi `top` elemen
(`getBoundingClientRect().top`), pasang ulang di listener `resize`.
Lihat contoh di `index.js` (NXHOME) dan `package/directory/index.js`.

## 5. CSS & aset distro — auto-import, bukan manual `<link>`

`templates/distro/Development/style.css` (dan `package/{nama}/style.css`
kalau ada) **otomatis** ter-`@import` ke `templates/workspace.css` saat
instalasi / regenerasi CSS — TIDAK perlu tambah `<link>` manual di HTML
mana pun. Logic shared: `cli/workspaceCss.cjs` (dipakai Express + CLI).

Font/aset statis khusus distro ini ditaruh di `assets/` (contoh:
`assets/fonts/FluentSystemIcons-Regular.{css,ttf,woff,woff2}`, didaftarkan
lewat `@import` di `style.css` root). **Hapus file yang tidak dipakai**
(demo `.html`, metadata mentah `.json` dari generator font).

## 6. Fitur contoh yang sudah dibangun di `system/directory/`

Referensi lengkap kalau mau membuat fitur sejenis di distro lain:

- **Tree file** (`system/directory/index.js`,
  `window.renderDirectoryTreeHtml()`) — persisten expand/collapse via
  localStorage, icon per-tipe file (`.icon-*`, class global sudah ada),
  file di `system/`+`package/directory/` ditandai `--protected`.
- **Editor baca-tulis** (`system/directory/editor.js`,
  `window.openFileEditor()`/`window.attachFileClickViewer()`) — CodeMirror6
  dari kernel (`window.NXUI.Codemirror`, WAJIB `await loadDependencies()`
  sebelum instansiasi), Ctrl+S untuk simpan. Gambar →
  `window.NxDirectory.readImage()`; `.md` → tab Markdown | Preview
  (`window.NXUI.NexaMarkdown` — **BUKAN** `window.NXUI.Markdown`).
- **Context-menu klik-kanan** (`system/contextmenu/`) — `REGISTRY` +
  `resolveContextMenuEntry()` di `index.js`, target statis atau dinamis
  (`match(targetId)`). Baca `system/contextmenu/README.md` SEBELUM
  menambah target. Icon item menu: PNG **persis 32×32** (aturan keras
  shell di `electronShell.js`).
- **Kolom resizable** (`package/directory/index.js`) — flexbox +
  `window.NxResize()`.

## 6a. Fitur contoh: SSH tunnel + database (`system/ssh/`)

Referensi lengkap: `system/ssh/README.md` (WAJIB dibaca sebelum mengubah
apa pun di sini).

- **Kernel** (`window.NxSSHTunnel`) — tunnel + query jalan di **Electron
  main process**. `system/ssh/` = lapisan preset dari `config.json`.
- **`system/ssh/config.json`** — SATU-SATUNYA tempat pengaturan (preset,
  SQL, kredensial). **Di-`.gitignore`** (boleh berisi password/key).
- **Pola baca tabel**: `window.readSSHTable(tableName)` HANYA baca cache
  IndexedDB (`DistroBuckets('nx-ssh-table-cache')`). Isi/perbarui cache
  lewat `window.syncSSHTables(tableName?)` — panggilan **eksplisit**,
  tidak ada interval otomatis.
  ```js
  await window.syncSSHTables('user');
  const { rows, fields } = await window.readSSHTable('user');
  ```
- **Status package UI**: API `window.*` SSH sudah terdaftar di
  `system/index.js` (termasuk warm-up kalau `config.json` `"enabled": true`).
  Folder `package/sshtest/` **belum ada** di disk saat ini — kalau butuh
  halaman uji, buat componen baru mengikuti §8 dan daftarkan di
  `package/manifest.json`.

## 6b. Endpoint per-package — `NXUI.usePackageEndpoint("nama")` (OPSIONAL)

Hanya package yang ingin backend berbeda dari `config.js` yang memanggil
`usePackageEndpoint()`. Yang tidak memanggil tetap pakai default —
`App.js` auto-restore `NEXA.apiBase` tiap ganti route.

```js
await NXUI.usePackageEndpoint("models");
// Semua NXUI.Storage() setelahnya ke endpoint package itu
```

**Contoh nyata di distro ini:**
- `package/models/index.js` — `NXUI.usePackageEndpoint("models")` + tabel
- `package/news/index.js` — juga memanggil `usePackageEndpoint("news")`
  (punya field `"endpoint"` di `package.json`)
- `package/gallery/index.js` / `package/directory/index.js` — **tidak**
  memanggil; pakai default `config.js`

## 6c. Shortcut componen — `system/shortcut/` (global di distro)

Dokumentasi lengkap: **`system/shortcut/README.md`**.

Ringkas: kumpulkan metadata dari `package/manifest.json` + tiap
`package/{nama}/package.json` → array shortcut global + launcher UI minim
(`window.renderShortcutLauncher({ disabled, add })`).

Href launcher default tetap **`#distro/package/{nama}/index`** (buka shell
package ke `#nxhome`). Nested konten di dalam shell yang punya `#nxpackage`
memakai href **`#package/{nama}`** — lihat §6d.

**Prefs dock (posisi / iconSize / disabled):** default native di NXHOME
(`NATIVE_LAUNCHER_DEFAULTS`). User mengubah lewat
`#package/settings/launcher` → `saveLauncherPrefs` (row `__prefs__` di
store `nx-launcher`) → `refreshShortcutLauncher()`. Lihat
`system/shortcut/README.md`.

## 6d. Rute lingkungan package — `#package/…` + `#nxpackage`

Cermin rute distro (`#distro/…` → `#nxhome`), bedanya **lingkungan** dan
**mount**. Dikonfigurasi di `App.js`:

```js
distro: ["home", "autoload"],   // → #nxhome
package: ["home", "autoload"],  // → #nxpackage (kalau ada)
```

### Dua lingkungan

| | Distro | Package |
|---|---|---|
| Config `App.js` | `distro: ["home","autoload"]` | `package: ["home","autoload"]` |
| Link | `#distro/{file}` | `#package/{nama}` / `#package/{nama}/{file}` |
| Mount | `<div id="nxhome">` di **NXHOME** (`index.js` distro) | `<div id="nxpackage">` di **package user** (bukan NXHOME) |
| Path fisik | `templates/distro/{id}/{file}.js` | `templates/distro/{id}/package/{nama}/…` |
| Render awal | `distro/home` → `#nxhome` (dari `grafis.js`) | `package/{shell}/home.js` → `#nxpackage` (setelah shell index) |

### `#nxpackage` — aturan ketat

1. **Bukan** elemen statis di NXHOME. Hanya package yang butuh nested
   `#package/…` yang memasang `<div id="nxpackage"></div>` di `index.js`-nya.
2. Kalau `index.js` memasang `#nxpackage`, **wajib** ada
   `package/{nama}/home.js` dengan `export async function home` — itu
   render awal ke mount (sama peran `distro/home.js` untuk `#nxhome`).
3. Package **tanpa** `#nxpackage` (mis. `tables`, `news` sebagai konten
   nested) **tidak** butuh `home.js`.

Contoh shell: `package/settings/index.js` + `package/settings/home.js`.

```html
<!-- di package/settings/index.js — mount nested -->
<a href="#package/tables">tables</a>
<div id="nxpackage"></div>
```

### Alur klik & refresh (cermin `#nxhome`)

**`#nxhome` (referensi):** URL = rute konten → refresh baca URL →
`__nexaPendingDeepRoute` → boot `distro/grafis` (buat `#nxhome`) →
`navigate` konten ke `#nxhome`.

**`#nxpackage` (sama pola):**

1. User buka shell: `#distro/package/settings/index` → ke `#nxhome`.
2. Index settings memasang `#nxpackage` → auto-muat `settings/home.js`.
3. Klik `#package/tables` → isi `#nxpackage`; **URL jadi** `/package/tables`
   (rute sebelumnya di URL, seperti `#distro/cotoh`).
4. History state menyimpan `shell` (induk settings) + `nestedPackage`.
5. **Refresh:** baca URL `package/tables` → boot NXHOME → restore shell
   settings (buat `#nxpackage`) → isi tables lagi ke mount.

Implementasi: `assets/modules/Route/NexaRoute.js`
(`isPackageNxpackageRoute`, `resolvePackageShorthand`,
`autoloadPackageHomeIfNeeded`, pending shell/nested). Alur shell:
`templates/FLOW.md` §4a.

### Scaffold CLI

Menu DevTools **“Buat package baru”** menulis `index.js` (dengan
`#nxpackage`) + `home.js` + `package.json` + update `manifest.json`.
Package leaf (hanya konten nested) boleh tanpa `#nxpackage`/`home.js`.

## 7. `package.json` distro & componen — field yang dipakai shell

Contoh field distro (lihat `package.json` di root folder ini):

```json
{
  "id": "Development",
  "title": "Development",
  "description": "...",
  "version": "1.0.0",
  "author": "...",
  "brend": {
    "ico": "/distro/Development/assets/brend/favicon.ico",
    "icon": "/distro/Development/assets/brend/icon.png"
  },
  "endpoint": "http://...",
  "gitrepo": "https://github.com/.../Development.git",
  "package": "https://github.com/.../Development/tree/main/package",
  "repodev": "D:/Extensions/Development"
}
```

`gitrepo`+`package` dipakai `templates/boot/componen.js` untuk daftar
componen (`/nexa-list-componen`). Tiap `package/{nama}/package.json`
(format lebih sederhana: `id`, `title`, `description`, `version`,
`author`, `brend`, `endpoint` opsional) dibaca saat listing.
`package/manifest.json` mencatat componen yang ada secara fisik:

```json
{ "componen": ["news", "gallery", "directory", "models"] }
```

## 8. Menambah halaman/route baru — checklist

### A. Package shell (punya nested `#package/…`)

1. Buat `package/{nama}/` — `index.js` (`export async function index`),
   `home.js` (`export async function home`), `package.json` (§7).
2. Di `index.js`: pasang `<div id="nxpackage"></div>` + link contoh
   `#package/{saudara}` bila perlu.
3. **TIDAK ADA import** dari `system/` — daftarkan dulu di `system/index.js`
   (§3) kalau butuh fungsi turunan distro.
4. Tambahkan `{nama}` ke `package/manifest.json`.
5. Launcher / NXHOME: `#distro/package/{nama}/index`.
6. Nested konten: `#package/{lain}` → mengisi `#nxpackage`.

Contoh: `package/settings/`.

### B. Package leaf / halaman biasa (tanpa `#nxpackage`)

1. Buat `package/{nama}/index.js` + `package.json` — **tanpa** wajib
   `home.js` kalau tidak memasang `#nxpackage`.
2. Daftarkan di `manifest.json`.
3. Buka sebagai halaman distro: `#distro/package/{nama}/index`, **atau**
   sebagai nested di dalam shell yang sudah punya `#nxpackage`:
   `#package/{nama}`.

Contoh: `package/tables/` (nested dari settings).

### C. Route di ROOT distro (bukan package)

File `templates/distro/Development/{file}.js` → link `#distro/{file}`
→ `#nxhome`. Lihat `home.js`, `cotoh.js`.

## 9. Sebelum menganggap perubahan di distro ini "selesai"

- [ ] `node --check` pada semua `.js` yang diubah.
- [ ] TIDAK ADA `import` baru dari `package/*/index.js` ke `system/*` —
      kalau butuh, daftarkan dulu di `system/index.js` (§3).
- [ ] TIDAK ADA `import` manual ke fungsi yang sudah punya versi
      `window.NxX.*` (§4).
- [ ] File sisa eksperimen/test **tidak** ditinggalkan di folder ini.
- [ ] Context-menu baru: baca `system/contextmenu/README.md`, daftarkan
      lewat `REGISTRY`; icon PNG 32×32.
- [ ] Menyentuh `system/ssh/`: baca `system/ssh/README.md`. JANGAN harap
      `readSSHTable()` menyentuh SSH — panggil `syncSSHTables` dulu.
      Pastikan `config.json` tetap di-`.gitignore` sebelum commit.
- [ ] Package dengan `#nxpackage`: ada `home.js`; nested `#package/…`
      diuji klik + **refresh** (URL konten, shell induk restore) — §6d.
