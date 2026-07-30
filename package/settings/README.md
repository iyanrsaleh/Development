# Package `settings` — panel pengaturan Distro Development

Shell package di jendela app (`.nx-app-window__body`).  
Nav: `index.js` → `#package/settings/{section}`.

Style form: `assets/components` (`.ubuntu-workbench`).  
Logic & persistensi: modul `system/*/settings.js` + DistroBuckets — **bukan** di file package.

---

## Menu

| Nav | File UI | Logic / store |
|-----|---------|----------------|
| Launcher | `launcher.js` | `system/shortcut/` → store `nx-launcher` |
| Wallpaper | `wallpaper.js` | `system/utilities/wallpaper.js` → `nx-wallpaper` |
| Files | `drives.js` | `system/utilities/drivesPrefs.js` → `nx-drives` row `__prefs__` |
| Title bar | `titlebar.js` | `system/titlebar/settings.js` → `nx-titlebar` |
| Window | `stwindow.js` | `system/window/settings.js` → `nx-window` row `__prefs__` |
| Components | `components.js` | Showcase UI only |

Reset di tiap form mengembalikan ke `NATIVE_*_DEFAULTS` di `system/`.

---

## Launcher

**UI:** posisi dock, ukuran ikon, **Mode nama**, warna label, item `disabled`.

| `labelMode` | Perilaku |
|-------------|----------|
| `both` | Label di bawah ikon + tooltip hover (`data-tooltip`, gaya components) |
| `tooltip` | Tooltip saja (label disembunyikan) |
| `hidden` | Tanpa nama / tooltip |

Dock = **overlay** absolute di tepi `.nx-page` (di atas jendela).  
Jendela overlap zona dock → Launcher hide visual (`is-auto-hidden`), tanpa reflow.

API: `window.renderShortcutLauncher`, `refreshShortcutLauncher`, `loadLauncherPrefs` / `saveLauncherPrefs`.

---

## Title bar (`#nx-titlebar`)

Bingkai Electron (bukan jendela app).

| `display` | |
|-----------|--|
| `show` | Selalu tampil |
| `hide` | Disembunyikan |
| `hover` | Muncul saat kursor di tepi atas |

**Variant:** `classic` · `light` · `ubuntu` · `compact` · `floating`  
Preview di settings memakai `.nx-titlebar-mock` (tanpa `-webkit-app-region: drag`).

API: `loadTitlebarPrefs` / `saveTitlebarPrefs` / `applyTitlebarPrefs` / `refreshTitlebar`.

---

## Window (tema jendela app)

Tema chrome `.nx-app-window` (header / border / bayangan).  
Tidak mengubah geometry tersimpan per-app.

| `theme` | |
|---------|--|
| `adwaita` | Default terang |
| `dark` | Dark Chrome — juga set `html[data-nx-components-theme="dark"]` agar `.ubuntu-workbench` ikut gelap |
| `ubuntu` | Header gelap + strip oranye |
| `minimal` | Flat ringkas |
| `glass` | Header blur |

Persist: DistroBuckets `nx-window` id `__prefs__` (baris geometry tetap pakai id app).

API: `loadWindowThemePrefs` / `saveWindowThemePrefs` / `applyWindowThemePrefs` / `refreshWindowTheme`.

---

## Files (`#package/settings/drives`)

Preferensi File Manager (`package/drives`).

| Field | Default | |
|-------|---------|--|
| `folderColor` | `orange` | Palette Yaru di `assets/folder` (12 warna) |
| `view` | `grid` | `grid` \| `list` saat buka Files |
| `includeHidden` | `false` | File `.…` via `listDir({ includeHidden })` |
| `searchRecursiveDefault` | `false` | Toggle Subfolders awal |

Persist: DistroBuckets `nx-drives` id `__prefs__` (terpisah dari `__open-history__`).  
Live: event `nx-drives-prefs` → FM yang terbuka update ikon / reload.

API: `loadDrivesPrefs` / `saveDrivesPrefs` / `applyDrivesPrefs` / `refreshDrivesPrefs` / `getFolderColor`.

---

## Alur umum

1. Form baca prefs → merge native.  
2. Ubah opsi → `save*Prefs` → `apply*` / `refresh*`.  
3. Buka jendela baru → `openAppWindow` menerapkan tema tersimpan.

Store diinisialisasi di `system/index.js` (`initDistroBuckets`, termasuk `nx-launcher`, `nx-wallpaper`, `nx-window`, `nx-titlebar`, `nx-drives`).
