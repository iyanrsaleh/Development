// Titik registrasi GLOBAL fitur sistem distro "Development" — dimuat
// SEKALI oleh templates/distro/grafis.js (shell, generik untuk semua
// distro) sebelum NXHOME/route distro/package/* mana pun diakses. File
// ini TIDAK di-import manual oleh file lain di dalam distro — sebaliknya,
// file ini yang meng-assign fungsi ke window supaya SEMUA file di distro
// ini (termasuk package/{nama}/index.js) bisa memanggilnya langsung
// TANPA import sama sekali.
//
// window.NxStorage / window.NxDirectory SUDAH global otomatis dari shell
// (di-scope dari stack trace pemanggil, lihat assets/modules/nxdom.js) —
// tidak perlu didaftarkan lagi di sini. Yang didaftarkan di sini adalah
// HASIL OLAHAN milik distro ini (traverse + render HTML, viewer isi file,
// bucket IndexedDB khusus distro ini), logicnya ada di
// system/directory/index.js, system/directory/editor.js, dan
// system/buckets/index.js (modul biasa, di-import HANYA dari sini).
import { renderDirectoryTreeHtml, attachDirectoryTreePersistence } from './directory/index.js';
import { openFileEditor, attachFileClickViewer } from './directory/editor.js';
import { initDistroBuckets, bucket } from './buckets/index.js';
import { loadSSHConfig, loadSSHPresets, getSSHPreset, runActiveConnection, runQuery, listTables, readTable, closeActiveConnection, syncTablesToIndexedDB, updateRow, deleteRow } from './ssh/index.js';
import { loadDistroShortcuts, getDistroShortcuts, clearDistroShortcutsCache, renderShortcutLauncher, refreshShortcutLauncher, attachLauncherDragReorder, normalizeLauncherSettings, applyLauncherLabelContrast, resolveLauncherShortcuts, loadLauncherShortcuts, saveLauncherShortcuts, syncLauncherShortcuts, updateLauncherShortcut, reorderLauncherShortcuts, loadLauncherPrefs, saveLauncherPrefs, mergeLauncherOpts, NATIVE_LAUNCHER_DEFAULTS, LAUNCHER_PREFS_ID } from './shortcut/index.js';
import {
  NATIVE_WALLPAPER_DEFAULTS,
  WALLPAPER_STORE,
  WALLPAPER_PREFS_ID,
  loadWallpaperPrefs,
  saveWallpaperPrefs,
  mergeWallpaperPrefs,
  normalizeWallpaperPrefs,
  applyWallpaper,
  refreshWallpaper,
} from './utilities/wallpaper.js';
import {
  openAppWindow,
  setAppWindowState,
  closeAppWindow,
  getAppWindowBody,
  getActiveAppWindow,
  wrapNxhomeInAppWindow,
  prepareAppWindowContainer,
  attachAutoAppWindow,
  setLauncherAutoHidden,
  WINDOW_STORE,
} from './window/index.js';
import {
  NATIVE_TITLEBAR_DEFAULTS,
  TITLEBAR_STORE,
  TITLEBAR_PREFS_ID,
  TITLEBAR_VARIANTS,
  TITLEBAR_DISPLAY_OPTIONS,
  loadTitlebarPrefs,
  saveTitlebarPrefs,
  mergeTitlebarPrefs,
  normalizeTitlebarPrefs,
  applyTitlebarPrefs,
  refreshTitlebar,
} from './titlebar/settings.js';

window.renderDirectoryTreeHtml = renderDirectoryTreeHtml;
window.attachDirectoryTreePersistence = attachDirectoryTreePersistence;
window.openFileEditor = openFileEditor;
window.attachFileClickViewer = attachFileClickViewer;
// Shortcut / launcher — data manifest + layout user di DistroBuckets("nx-launcher")
window.loadDistroShortcuts = loadDistroShortcuts;
window.getDistroShortcuts = getDistroShortcuts;
window.clearDistroShortcutsCache = clearDistroShortcutsCache;
window.resolveLauncherShortcuts = resolveLauncherShortcuts;
window.loadLauncherShortcuts = loadLauncherShortcuts;
window.saveLauncherShortcuts = saveLauncherShortcuts;
window.syncLauncherShortcuts = syncLauncherShortcuts;
window.updateLauncherShortcut = updateLauncherShortcut;
window.reorderLauncherShortcuts = reorderLauncherShortcuts;
window.loadLauncherPrefs = loadLauncherPrefs;
window.saveLauncherPrefs = saveLauncherPrefs;
window.mergeLauncherOpts = mergeLauncherOpts;
window.NATIVE_LAUNCHER_DEFAULTS = NATIVE_LAUNCHER_DEFAULTS;
window.LAUNCHER_PREFS_ID = LAUNCHER_PREFS_ID;
window.renderShortcutLauncher = renderShortcutLauncher;
window.refreshShortcutLauncher = refreshShortcutLauncher;
window.attachLauncherDragReorder = attachLauncherDragReorder;
window.normalizeLauncherSettings = normalizeLauncherSettings;
window.applyLauncherLabelContrast = applyLauncherLabelContrast;
attachLauncherDragReorder();
// Wallpaper NXHOME — prefs DistroBuckets("nx-wallpaper"), UI: package/settings/wallpaper
window.NATIVE_WALLPAPER_DEFAULTS = NATIVE_WALLPAPER_DEFAULTS;
window.WALLPAPER_STORE = WALLPAPER_STORE;
window.WALLPAPER_PREFS_ID = WALLPAPER_PREFS_ID;
window.loadWallpaperPrefs = loadWallpaperPrefs;
window.saveWallpaperPrefs = saveWallpaperPrefs;
window.mergeWallpaperPrefs = mergeWallpaperPrefs;
window.normalizeWallpaperPrefs = normalizeWallpaperPrefs;
window.applyWallpaper = applyWallpaper;
window.refreshWallpaper = refreshWallpaper;
// App window floating di work area (#nxhome)
window.openAppWindow = openAppWindow;
window.setAppWindowState = setAppWindowState;
window.closeAppWindow = closeAppWindow;
window.setLauncherAutoHidden = setLauncherAutoHidden;
window.getAppWindowBody = getAppWindowBody;
window.getActiveAppWindow = getActiveAppWindow;
window.wrapNxhomeInAppWindow = wrapNxhomeInAppWindow;
window.prepareAppWindowContainer = prepareAppWindowContainer;
window.attachAutoAppWindow = attachAutoAppWindow;
window.WINDOW_STORE = WINDOW_STORE;
// Title bar — prefs DistroBuckets("nx-titlebar"), UI: package/settings/titlebar
window.NATIVE_TITLEBAR_DEFAULTS = NATIVE_TITLEBAR_DEFAULTS;
window.TITLEBAR_STORE = TITLEBAR_STORE;
window.TITLEBAR_PREFS_ID = TITLEBAR_PREFS_ID;
window.TITLEBAR_VARIANTS = TITLEBAR_VARIANTS;
window.TITLEBAR_DISPLAY_OPTIONS = TITLEBAR_DISPLAY_OPTIONS;
window.loadTitlebarPrefs = loadTitlebarPrefs;
window.saveTitlebarPrefs = saveTitlebarPrefs;
window.mergeTitlebarPrefs = mergeTitlebarPrefs;
window.normalizeTitlebarPrefs = normalizeTitlebarPrefs;
window.applyTitlebarPrefs = applyTitlebarPrefs;
window.refreshTitlebar = refreshTitlebar;
// Pengaturan + logic koneksi SSH tunnel SEPENUHNYA ada di system/ssh/
// (config.json: activePreset, activeSql, presets). Package UI pemakai
// (kalau ada) TIDAK punya pengaturan sendiri — cukup panggil
// window.runActiveSSHTest() / syncSSHTables / readSSHTable. Folder
// package/sshtest belum ada di disk; API window.* tetap tersedia.
window.loadSSHPresets = loadSSHPresets;
window.getSSHPreset = getSSHPreset;
window.runActiveSSHTest = runActiveConnection;
// SQL bebas + daftar tabel + isi tabel (preset aktif yang sama).
window.runSSHQuery = runQuery;
window.listSSHTables = listTables;
// window.readSSHTable = readTable() — BACA IndexedDB SAJA, TIDAK PERNAH
// menyentuh SSH (lihat JSDoc readTable() di system/ssh/index.js). Data di
// IndexedDB diisi/diperbarui HANYA lewat window.syncSSHTables() (panggilan
// EKSPLISIT/manual, TIDAK ada interval/berkala otomatis) — lihat di bawah.
window.readSSHTable = readTable;
// closeSSHConnection TETAP diekspos untuk kasus butuh tutup manual (mis.
// ganti activePreset lalu ingin koneksi lama benar-benar diputus).
window.closeSSHConnection = closeActiveConnection;
// Sinkronisasi SSH -> IndexedDB SEBAGAI FUNGSI TERSENDIRI, dipanggil
// MANUAL kapan pun dibutuhkan (BUKAN otomatis berkala/interval) — lihat
// JSDoc syncTablesToIndexedDB() di system/ssh/index.js.
window.syncSSHTables = syncTablesToIndexedDB;
// updateRow / deleteRow — UPDATE & DELETE per-baris via SSH tunnel.
window.updateSSHRow = updateRow;
window.deleteSSHRow = deleteRow;
// saveActiveEditorFile TIDAK perlu window global — dipakai HANYA oleh
// system/contextmenu/nxEditorTarget.js, yang meng-import langsung dari
// directory/editor.js (modul biasa, sama-sama di dalam system/). Beda
// dari 4 fungsi di atas yang dipanggil dari package/* (file pemakai,
// kontrak "tanpa import" — lihat komentar atas file ini).

// Bucket IndexedDB TERPISAH dari database kernel — lihat
// templates/bucketsDistro.md. Tambahkan nama store di array kedua kalau
// distro ini butuh tabel custom baru (naikkan version kalau perlu
// migrasi skema). try/catch supaya kegagalan IndexedDB (quota, private
// mode, dst) TIDAK menggagalkan NXHOME — window.DistroBuckets tetap
// terdefinisi, method-nya sendiri yang akan reject kalau init gagal.
//
// "nx-ssh-table-cache" (version dinaikkan 1 -> 2, migrasi tambah store
// BARU — store lama TIDAK dihapus/diubah) — SATU-SATUNYA sumber data yang
// dibaca readTable()/window.readSSHTable (key = nama tabel). Diisi/
// diperbarui HANYA lewat window.syncSSHTables() (panggilan eksplisit),
// BUKAN oleh readTable() itu sendiri — lihat komentar arsitektur lengkap
// di system/ssh/index.js (syncTablesToIndexedDB()).
try {
  // version 7: pastikan store nx-titlebar ada (migrasi dari v5/v6)
  await initDistroBuckets('Development', ['nx-ssh-table-cache', 'nx-launcher', 'nx-wallpaper', 'nx-window', 'nx-titlebar'], 7);
} catch (err) {
  console.error('[system/index.js] gagal inisialisasi DistroBuckets:', err);
}
window.DistroBuckets = bucket;
// Auto-wrap setelah DistroBuckets siap (geometry persist + route listener)
attachAutoAppWindow();
// Terapkan prefs title bar (visible + variant) setelah bucket siap
try {
  await refreshTitlebar();
} catch (err) {
  console.warn('[system/index.js] refreshTitlebar:', err);
}

// Prefetch shortcut dari manifest, lalu sync ke bucket launcher (layout user).
try {
  window.DistroShortcuts = await loadDistroShortcuts();
} catch (err) {
  console.error('[system/index.js] gagal memuat DistroShortcuts:', err);
  window.DistroShortcuts = [];
}

// Warm-up SSH hanya kalau config.json "enabled": true. Flag eksplisit —
// bukan tebak dari kredensial kosong — supaya fitur yang sedang tidak
// dipakai benar-benar mati saat start.
(async () => {
  try {
    const config = await loadSSHConfig();
    // File config belum ada (gitignore) atau enabled:false — diam, jangan spam console.
    if (!config.enabled || config._missing) return;
    if (!config.activePreset) return;
    const preset = await getSSHPreset(config.activePreset);
    if (!preset?.sshUsername || (!preset.sshPassword && !preset.sshPrivateKey)) {
      console.info(
        '[system/index.js] warm-up SSH dilewati — isi sshUsername + password/key di system/ssh/config.json dulu'
      );
      return;
    }
    await runQuery('SELECT 1');
  } catch (err) {
    console.warn('[system/index.js] warm-up SSH tunnel gagal (akan dicoba saat dipakai):', err?.message || err);
  }
})();
