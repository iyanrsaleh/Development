# `system/shortcut/` — shortcut componen & launcher UI

Modul SISTEM distro "Development" — mengumpulkan metadata tiap componen
dari `package/manifest.json` + `package/{nama}/package.json`, lalu
menyediakan UI launcher standar minim. **Layout user** (urutan, rename,
item custom) disimpan di DistroBuckets store `nx-launcher` — bukan
hanya dibaca ulang dari manifest setiap kali.

Logic di `index.js`. Registrasi `window.*` lewat `system/index.js` —
pemakai **TIDAK** `import` dari sini.

## File

```
system/shortcut/
  index.js    ← catalog manifest + sync bucket + render
  style.css   ← class .nx-launcher*
  README.md   ← dokumen ini
```

Bucket: lihat `system/buckets/README.md`. Store didaftarkan di
`system/index.js`:

```js
await initDistroBuckets('Development', ['nx-ssh-table-cache', 'nx-launcher'], 3);
```

## Dua lapis data

| Lapisan | Sumber | Peran |
|---|---|---|
| **Catalog** | `manifest.json` + tiap `package.json` (+ opts `disabled`/`add`) | Apa yang *tersedia* dari disk / kode |
| **Layout** | DistroBuckets `nx-launcher` | Apa yang *ditampilkan*: urutan, title/brend/href hasil rename user |

`renderShortcutLauncher(opts)` memanggil `syncLauncherShortcuts(opts)`:
gabungkan catalog + layout, simpan balik ke bucket, return daftar final.

## API global

| | |
|---|---|
| `window.DistroShortcuts` | Prefetch catalog (manifest) |
| `window.getDistroShortcuts()` / `loadDistroShortcuts({ force? })` | Baca catalog |
| `window.clearDistroShortcutsCache()` | Cache catalog saja (bukan bucket) |
| `window.resolveLauncherShortcuts(list, opts?)` | Filter `disabled` + sisip `add` (tanpa bucket) |
| `window.syncLauncherShortcuts(opts?)` | Merge catalog ↔ bucket, simpan, return layout |
| `window.loadLauncherShortcuts()` | Baca bucket, urut `position` |
| `window.saveLauncherShortcuts(items)` | Timpa seluruh layout di bucket |
| `window.updateLauncherShortcut(id, patch)` | Rename / ubah satu item |
| `window.reorderLauncherShortcuts(orderedIds)` | Pindah urutan |
| `window.renderShortcutLauncher(opts?)` | Sync + markup; **dock** kalau `settings.position`; merge prefs user |
| `window.refreshShortcutLauncher()` | Refresh dock/body atau `.nx-launcher` inline |
| `window.loadLauncherPrefs()` / `saveLauncherPrefs(prefs)` | Prefs UI — row `__prefs__` di `nx-launcher` |
| `window.mergeLauncherOpts(native, prefs)` | Gabung native NXHOME + prefs bucket |
| `window.NATIVE_LAUNCHER_DEFAULTS` | Native: disabled `directory`, `left`, `35px` |
| `window.attachLauncherDragReorder()` | Aktifkan drag-geser urutan (sekali / idempotent) |
| `window.normalizeLauncherSettings?(…)` | (internal via module) normalisasi settings |

### Bentuk item di bucket

```js
{
  id, componenName, title, description, brend, href,
  position,       // 0..n urutan tampil
  _added,         // true kalau dari opts.add / custom (bukan folder package)
  updatedAt,
  // + field catalog lain (version, author, endpoint, meta) saat sync
}
```

`id` = keyPath store (string, mis. `"home"`, `"gallery"`).

## Opsi `renderShortcutLauncher` / `syncLauncherShortcuts`

| Opsi | Arti |
|---|---|
| *(tanpa opsi)* | Catalog = semua dari manifest |
| `disabled: string[]` | id yang **tidak** masuk catalog (disembunyikan) |
| `add: object[]` | Item ekstra. `id: 'home'` → urutan pertama saat seed/catalog |
| `settings.position` | `top` \| `left` \| `right` \| `bottom` → **dock tetap** di tepi jendela (body), bukan aliran konten. Alias typo: `battom` → `bottom` |
| `settings.iconSize` | Ukuran ikon CSS (default `"40px"`). Alias: `iconSze` |

### Dock vs inline

- **Ada `settings.position`**: launcher dipasang ke `#nx-launcher-host`
  di **halaman index** (`.nx-page`) — absolute di area itu, **bukan**
  body/title bar. Return `''`. Wajib ada host di markup index (atau
  `opts.mount`).
- **Tanpa `position`**: return markup HTML inline.

```js
// Di NXHOME: buat host dulu, lalu mount dock ke dalamnya
container.innerHTML = `<article class="nx-page"><div id="nx-launcher-host"></div>...</article>`;
await window.renderShortcutLauncher({
  mount: container.querySelector('#nx-launcher-host'),
  disabled: ['directory'],
  settings: {
    position: 'top',   // top | left | right | bottom — di area index
    iconSize: '40px',
  },
  add: [{
    id: 'home',
    title: 'home',
    brend: '/distro/Development/assets/brend/icon.png',
    href: '#distro/home',
  }],
});
```

### Prefs dock (form settings)

Default **native** (hardcode NXHOME / `NATIVE_LAUNCHER_DEFAULTS`):

```js
{ disabled: ['directory'], settings: { position: 'left', iconSize: '35px' } }
```

User mengubah lewat `#package/settings/launcher` (`package/settings/launcher.js`):

1. Form → `saveLauncherPrefs({ disabled, settings })`
2. Disimpan di DistroBuckets `nx-launcher`, id `__prefs__` (bukan item ikon)
3. `refreshShortcutLauncher()` — `renderShortcutLauncher` merge prefs di atas native

Reset di form mengembalikan ke `NATIVE_LAUNCHER_DEFAULTS`.

### Item `add` (pendek)

```js
{
  id: 'home',
  title: 'home',
  description: 'GUI Development',
  brend: '/distro/Development/assets/brend/icon.png', // atau { ico, icon }
  href: '#distro/home',
}
```

### Contoh render (inline, tanpa dock)

```js
const launcher = await window.renderShortcutLauncher({
  disabled: ['directory'],
  add: [{
    id: 'home',
    title: 'home',
    brend: '/distro/Development/assets/brend/icon.png',
    href: '#distro/home',
  }],
});
// sisipkan launcher ke HTML halaman
```

### Rename lewat context menu

Klik-kanan tile → **Rename** → edit judul **inline** (Enter/blur simpan,
Escape batal) → `updateLauncherShortcut` + refresh grid. Tanpa dialog.

### Geser urutan (drag)

Tarik tile ke posisi lain — urutan DOM di-update live, lalu
`reorderLauncherShortcuts(ids)` menyimpan `position` ke bucket.
Selama rename inline, drag dimatikan.

Pola: `id="nxlauncher::<id-encoded>"` + modul
`system/contextmenu/nxLauncherItem.js` (REGISTRY `match`), sama seperti
`nxfile::` di README contextmenu §7a.

```js
// Programatik (tanpa menu)
await window.updateLauncherShortcut('gallery', { title: 'Galeri Saya' });
await window.refreshShortcutLauncher();
```

### Urutan posisi

```js
await window.reorderLauncherShortcuts(['home', 'news', 'gallery', 'models']);
await window.refreshShortcutLauncher();
```

Setelah `update` / `reorder`, panggil `refreshShortcutLauncher()` (atau
`renderShortcutLauncher` lagi dengan opts yang sama). Sync **mempertahankan**
urutan + title/brend/href yang sudah di bucket; item package baru dari
manifest ditambah di akhir.

## Alur sync

```
manifest + package.json  ──► getDistroShortcuts()     ┐
opts.disabled / opts.add ──► resolveLauncherShortcuts()├─ catalog
                                                      ┘
                            DistroBuckets('nx-launcher') ── layout tersimpan
                                      │
                          syncLauncherShortcuts(opts)
                                      │
                    seed (kosong) / merge (ada data user)
                                      │
                          saveLauncherShortcuts(...)
                                      │
                          renderShortcutLauncher → UI
```

## Style

Class `.nx-launcher*` di `style.css`. Ubah bebas untuk UI ala
Ubuntu/Windows — data tetap dari bucket + catalog.

## Kontrak

1. Jangan `import` `system/shortcut/` dari `package/*` — pakai `window.*`.
2. Manifest = sumber componen di disk; bucket = preferensi tampilan user.
3. Jangan mengisi layout hanya dari manifest di UI panjang-umur — selalu
   lewat `syncLauncherShortcuts` / `renderShortcutLauncher` supaya rename
   & urutan tidak hilang.
4. Reset layout manual: DevTools → IndexedDB → `nexaui-distro-Development`
   → store `nx-launcher` → Clear (atau hapus database).
5. **Href launcher** default: `#distro/package/{nama}/index` (shell →
   `#nxhome`). Jangan ganti massal ke `#package/…` — itu nested ke
   `#nxpackage` (butuh shell induk). Lihat
   `templates/distro/Development/README.md` §6d.
