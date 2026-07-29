// Modul SISTEM — SATU-SATUNYA tempat pengaturan koneksi SSH tunnel untuk
// distro "Development" (preset MANA yang aktif, SQL apa yang dijalankan,
// kredensial). Logic BERADA DI SINI (system/), di-registrasi jadi window
// global lewat system/index.js (titik registrasi tunggal) — pola SAMA
// dengan system/directory/index.js.
//
// package/sshtest/index.js (pemakai) TIDAK PUNYA pengaturan apa pun sendiri
// (BUKAN developer-only config lagi) — cukup panggil window.runActiveSSHTest()
// dan menampilkan hasilnya. Semua yang bisa diubah (preset aktif, SQL,
// kredensial) diedit di sini/config.json, BUKAN di package/sshtest/.
//
// system/ssh/config.json BOLEH berisi kredensial (password/private key) —
// file ini di-.gitignore (lihat .gitignore root project: "templates/distro/
// */system/ssh/config.json"), TIDAK ikut ter-commit ke repo. Skema:
//   { activePreset: string, activeSql: string, presets: [...] }
// activePreset menunjuk salah satu presets[].name — itu yang dipakai
// runActiveConnection() di bawah. Alternatif device-bound (tersimpan
// terenkripsi per-device di main process Electron) tetap tersedia lewat
// window.NxSSHTunnel.saveProfile()/loadProfile() (lihat
// assets/modules/SSHTunne/README.md) kalau suatu saat dibutuhkan
// penyimpanan yang tidak bergantung file plaintext di disk.
//
// Dibaca lewat window.NxDirectory.readFile() (bukan fetch() manual) — sudah
// otomatis di-sandbox ke root distro "Development" (deteksi stack trace,
// lihat NexaDirectory.js), tidak perlu pusing base URL server.

let _cachedConfig = null;

/**
 * Muat seluruh isi system/ssh/config.json (activePreset, activeSql,
 * presets) apa adanya. Hasil di-cache di memori (module-level) — file
 * config TIDAK berubah selama sesi aplikasi berjalan, dibaca ulang tiap
 * panggil itu boros round-trip tanpa manfaat. Panggil dengan
 * `forceReload: true` kalau config.json baru saja diedit manual dan ingin
 * dibaca ulang tanpa refresh halaman penuh.
 * @param {{forceReload?: boolean}} [opts]
 * @returns {Promise<{enabled:boolean, activePreset?:string, activeSql?:string, presets:Array<object>}>}
 */
export async function loadSSHConfig(opts = {}) {
  if (_cachedConfig && !opts.forceReload) return _cachedConfig;
  try {
    // Cek ada file dulu — hindari GET /nexa-directory-file/... yang 404
    // (noise merah di DevTools). config.json di-.gitignore, sering belum
    // ada di clone fresh.
    const entries = await window.NxDirectory.readDirectory('system/ssh');
    const hasConfig = Array.isArray(entries)
      && entries.some((e) => e.name === 'config.json' && e.type === 'file');
    if (!hasConfig) {
      _cachedConfig = {
        enabled: false,
        activePreset: null,
        activeSql: 'SELECT 1',
        presets: [],
        _missing: true,
      };
      return _cachedConfig;
    }

    const { content } = await window.NxDirectory.readFile('system/ssh/config.json');
    const parsed = JSON.parse(content);
    _cachedConfig = {
      // Flag eksplisit: false = SSH tunnel MATI total (warm-up + connect).
      // Default false supaya distro yang belum pakai DB/SSH tidak pernah
      // mencoba connect saat start. Set true di config.json kalau mau pakai.
      enabled: parsed?.enabled === true,
      activePreset: parsed?.activePreset || null,
      activeSql: parsed?.activeSql || 'SELECT 1',
      presets: Array.isArray(parsed?.presets) ? parsed.presets : [],
    };
  } catch (err) {
    console.warn('[system/ssh/index.js] gagal membaca system/ssh/config.json:', err?.message || err);
    _cachedConfig = { enabled: false, activePreset: null, activeSql: 'SELECT 1', presets: [] };
  }
  return _cachedConfig;
}

/**
 * Muat seluruh preset dari system/ssh/config.json.
 * @param {{forceReload?: boolean}} [opts]
 * @returns {Promise<Array<object>>}
 */
export async function loadSSHPresets(opts = {}) {
  const config = await loadSSHConfig(opts);
  return config.presets;
}

/**
 * Ambil satu preset berdasar `name`. Mengembalikan `null` kalau tidak ada
 * (bukan throw — pemanggil cukup fallback ke pesan error jelas).
 * @param {string} name
 * @returns {Promise<object|null>}
 */
export async function getSSHPreset(name) {
  const presets = await loadSSHPresets();
  return presets.find((p) => p.name === name) || null;
}

/**
 * connectionId tunnel SSH yang SEDANG TERBUKA (module-level, satu per
 * sesi halaman) — dipakai ulang oleh runQuery()/listTables()/readTable()
 * SUPAYA HANDSHAKE SSH (bagian PALING LAMBAT: negosiasi kriptografi + auth
 * ke server jarak jauh, jauh lebih berat dari query SQL itu sendiri) HANYA
 * terjadi SEKALI per sesi, bukan setiap panggilan. Sebelum ini, tiap
 * runQuery() connect+disconnect dari nol — buka 1 tabel saja tetap kena
 * biaya penuh handshake SSH itu. Ditutup lewat closeActiveConnection()
 * (dipanggil manual setelah semua query selesai) atau otomatis dibuka
 * ulang kalau connectionId lama ternyata sudah putus (lihat try/catch di
 * _ensureActiveConnection()).
 */
let _activeConnectionId = null;
let _connectFailed = null; // timestamp gagal terakhir — jangan retry sebelum jeda

async function _ensureActiveConnection() {
  if (_activeConnectionId) return _activeConnectionId;
  // Jangan retry terus-menerus — kalau koneksi gagal, tunggu 10 detik
  // baru izinkan retry (hindari spam connect saat server maintenance / penuh)
  if (_connectFailed) {
    const elapsed = Date.now() - _connectFailed;
    if (elapsed < 10_000) {
      throw new Error('Koneksi database gagal — coba lagi dalam beberapa detik');
    }
    _connectFailed = null;
  }

  const config = await loadSSHConfig();
  if (!config.enabled) {
    throw new Error(
      'system/ssh/config.json: "enabled" masih false — set true kalau mau memakai SSH tunnel'
    );
  }
  if (!config.activePreset) {
    throw new Error('system/ssh/config.json: "activePreset" belum diisi');
  }
  const preset = await getSSHPreset(config.activePreset);
  if (!preset) {
    throw new Error(`system/ssh/config.json: preset "${config.activePreset}" tidak ditemukan`);
  }
  if (preset.sshUsername == null || String(preset.sshUsername).trim() === '') {
    throw new Error(
      `system/ssh/config.json: preset "${config.activePreset}" belum punya sshUsername (isi kredensial dulu, atau matikan warm-up)`
    );
  }
  if (!preset.sshHost || String(preset.sshHost).trim() === '') {
    throw new Error(`system/ssh/config.json: preset "${config.activePreset}" belum punya sshHost`);
  }
  if (!preset.sshPassword && !preset.sshPrivateKey) {
    throw new Error(
      `system/ssh/config.json: preset "${config.activePreset}" belum punya sshPassword/sshPrivateKey`
    );
  }

  try {
    const connectionId = crypto.randomUUID();
    await window.NxSSHTunnel.connect(connectionId, {
      kind: preset.kind || 'mysql',
      sshHost: preset.sshHost,
      sshPort: preset.sshPort || 22,
      sshUsername: preset.sshUsername,
      sshPassword: preset.sshPassword || undefined,
      sshPrivateKey: preset.sshPrivateKey || undefined,
      sshPassphrase: preset.sshPassphrase || undefined,
      dbHost: preset.dbHost || '127.0.0.1',
      dbPort: preset.dbPort,
      dbUsername: preset.dbUsername || undefined,
      dbPassword: preset.dbPassword || undefined,
      dbName: preset.dbName,
    });
    _activeConnectionId = connectionId;
    _connectFailed = null;
    return connectionId;
  } catch (err) {
    _connectFailed = Date.now();
    throw err;
  }
}

/**
 * Tutup tunnel SSH aktif (kalau ada) — panggil SETELAH semua query yang
 * dibutuhkan selesai (mis. akhir halaman sshtest), BUKAN di antara tiap
 * query (itu yang membuat lambat sebelumnya). Aman dipanggil meski tidak
 * ada koneksi aktif (no-op).
 */
export async function closeActiveConnection() {
  if (!_activeConnectionId) return;
  const id = _activeConnectionId;
  _activeConnectionId = null;
  await window.NxSSHTunnel.disconnect(id).catch(() => {});
}

/**
 * Jalankan `activePreset` + `activeSql` dari system/ssh/config.json —
 * dipakai package/sshtest/index.js (window.runActiveSSHTest(), TANPA
 * argumen) yang hanya perlu MENAMPILKAN hasilnya, TIDAK menentukan
 * preset/SQL/kredensial apa pun sendiri (itu semua diedit di
 * sini/config.json). TIDAK diubah signature-nya — lihat runQuery() di
 * bawah untuk SQL bebas (daftar tabel, isi tabel tertentu, dst). Memakai
 * tunnel aktif yang SAMA dengan runQuery() (lihat _ensureActiveConnection()) —
 * TIDAK disconnect otomatis di sini, panggil closeActiveConnection() manual
 * kalau ini pemanggilan terakhir dalam sesi.
 * @returns {Promise<{rows:any[], fields:string[]}>}
 */
export async function runActiveConnection() {
  const config = await loadSSHConfig();
  const connectionId = await _ensureActiveConnection();
  return await window.NxSSHTunnel.query(connectionId, config.activeSql);
}

/**
 * Jalankan SQL BEBAS lewat preset aktif (activePreset di config.json) —
 * dipakai untuk kebutuhan selain `activeSql` tetap, mis. "SHOW TABLES" atau
 * "SELECT * FROM {tabel} LIMIT n" saat user memilih nama tabel. Memakai
 * SATU tunnel SSH yang dibuka sekali per sesi (_ensureActiveConnection())
 * — TIDAK connect+disconnect setiap panggilan lagi (handshake SSH ke
 * server jarak jauh jauh lebih lambat dari query SQL-nya sendiri; buka
 * ulang tiap panggilan artinya SATU tabel pun kena biaya penuh handshake).
 * Panggil closeActiveConnection() manual setelah semua query selesai.
 * @param {string} sql
 * @param {any[]} [params]
 * @returns {Promise<{rows:any[], fields:string[]}>}
 */
export async function runQuery(sql, params = []) {
  if (!sql) throw new Error('runQuery: sql wajib diisi');
  const connectionId = await _ensureActiveConnection();
  return await window.NxSSHTunnel.query(connectionId, sql, params);
}

/**
 * Daftar nama tabel di database `dbName` preset aktif — pakai
 * information_schema (bekerja sama untuk MySQL & PostgreSQL, TIDAK pakai
 * "SHOW TABLES" yang sintaksnya MySQL-only) atau SHOW TABLES kalau
 * `kind: 'mysql'` (lebih ringan, satu kolom saja). Preset aktif dibaca
 * ulang di sini supaya tahu `kind` sebelum memilih query yang tepat.
 * @returns {Promise<string[]>}
 */
export async function listTables() {
  const config = await loadSSHConfig();
  const preset = await getSSHPreset(config.activePreset);
  if (!preset) {
    throw new Error(`system/ssh/config.json: preset "${config.activePreset}" tidak ditemukan`);
  }
  if (preset.kind === 'postgres') {
    const { rows } = await runQuery(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    return rows.map((r) => r.table_name);
  }
  const { rows } = await runQuery('SHOW TABLES');
  // SHOW TABLES mengembalikan SATU kolom dengan nama dinamis
  // ("Tables_in_{dbName}") — ambil value pertama tiap row apa pun nama kolomnya.
  return rows.map((r) => Object.values(r)[0]);
}

/**
 * Query MENTAH ke database LEWAT SSH tunnel (TANPA cache) — HANYA dipakai
 * syncTablesToIndexedDB() di bawah. BUKAN untuk dipanggil pemanggil UI
 * (readTable() di bawah tidak menyentuh SSH sama sekali) — lihat komentar
 * besar di atas syncTablesToIndexedDB() untuk arsitektur lengkap: UI baca
 * IndexedDB SAJA, SSH cuma mengisi IndexedDB lewat pemanggilan eksplisit.
 * Nama tabel divalidasi whitelist karakter (TIDAK bisa di-parameterize
 * lewat placeholder driver ?/[$1] — itu hanya untuk VALUE, bukan
 * identifier SQL) supaya tidak bisa dipakai untuk injection.
 * @param {string} tableName
 * @param {number} [limit]
 * @returns {Promise<{rows:any[], fields:string[]}>}
 */
async function _fetchTableFromSSH(tableName, limit = 100) {
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error(`_fetchTableFromSSH: nama tabel tidak valid: "${tableName}"`);
  }
  return await runQuery(`SELECT * FROM \`${tableName}\` LIMIT ${Number(limit) || 100}`);
}

/** Set<tableName> yang sinkronisasinya SEDANG berjalan — guard PER-TABEL supaya panggilan berulang untuk tabel yang SAMA tidak tumpang tindih (mis. jaringan lambat), sementara tabel BEDA tetap boleh sinkron paralel. Sinkron SEMUA tabel (tableName kosong) pakai key khusus "*" supaya tidak tabrakan dengan guard per-tabel. */
const _syncInFlight = new Set();

/**
 * Sinkronisasi SSH → IndexedDB — SATU fungsi tersendiri yang dipanggil
 * SECARA EKSPLISIT (manual trigger) kapan pun dibutuhkan, BUKAN otomatis
 * berkala/interval. Ini SATU-SATUNYA tempat yang boleh menyentuh SSH untuk
 * mengisi data tabel — readTable() (dipanggil UI) TIDAK PERNAH memanggil
 * ini secara langsung/menunggu ini selesai; readTable() murni baca
 * IndexedDB apa adanya (lihat JSDoc-nya di bawah).
 *
 * @param {string} [tableName] Kalau DIISI, HANYA sinkron tabel ini
 *   (satu query _fetchTableFromSSH(), lebih ringan/cepat — cocok dipanggil
 *   sebelum readTable(tableName) untuk tabel spesifik yang sedang
 *   dibutuhkan). Kalau KOSONG (default), sinkron SEMUA tabel:
 *   listTables() (SSH) lalu _fetchTableFromSSH() untuk tiap tabel satu
 *   per satu, dibungkus try/catch per tabel supaya SATU tabel gagal
 *   (mis. dihapus di server) tidak menghentikan sinkronisasi tabel lain.
 * @returns {Promise<void>}
 */
export async function syncTablesToIndexedDB(tableName) {
  const guardKey = tableName || '*';
  if (_syncInFlight.has(guardKey)) return; // panggilan sebelumnya (tabel/mode sama) belum selesai, skip
  _syncInFlight.add(guardKey);
  try {
    const store = window.DistroBuckets('nx-ssh-table-cache');

    if (tableName) {
      const result = await _fetchTableFromSSH(tableName);
      await store.set({ id: tableName, result, syncedAt: Date.now() });
      return;
    }

    const tables = await listTables();
    for (const name of tables) {
      try {
        const result = await _fetchTableFromSSH(name);
        await store.set({ id: name, result, syncedAt: Date.now() });
      } catch (err) {
        console.warn(`[system/ssh/index.js] sinkronisasi gagal untuk tabel "${name}":`, err?.message || err);
      }
    }
  } catch (err) {
    console.warn(`[system/ssh/index.js] sinkronisasi gagal${tableName ? ` untuk tabel "${tableName}"` : ' (listTables)'}:`, err?.message || err);
  } finally {
    _syncInFlight.delete(guardKey);
  }
}

/**
 * Isi satu tabel — baca LANGSUNG dari IndexedDB (window.DistroBuckets
 * ('nx-ssh-table-cache')), TIDAK PERNAH menyentuh SSH/jaringan sama sekali
 * di sini. Kalau tabel belum pernah disinkron (IndexedDB masih kosong
 * untuk tabel ini), kembalikan `{ rows: [], fields: [] }` APA ADANYA —
 * TIDAK menunggu SSH untuk mengisi (itu tugas syncTablesToIndexedDB()
 * di atas, dipanggil EKSPLISIT oleh pemanggil lain, bukan otomatis di
 * sini). Panggil syncTablesToIndexedDB() dulu (mis. window.syncSSHTables())
 * kalau butuh data terbaru sebelum readTable() dipanggil.
 * @param {string} tableName
 * @returns {Promise<{rows:any[], fields:string[]}>}
 */
export async function readTable(tableName) {
  if (!tableName) throw new Error('readTable: tableName wajib diisi');
  const store = window.DistroBuckets('nx-ssh-table-cache');
  const cached = await store.get(tableName).catch(() => null);
  if (!cached) return { rows: [], fields: [] };
  return cached.result;
}

/**
 * Deteksi nama kolom ID di sebuah row (kasus-insensitive, akhiran _id/id).
 * @param {object} row
 * @returns {string|null}
 */
function _detectIdColumn(row) {
  const keys = Object.keys(row);
  // Prioritas: "id" (eksak, case-insensitive) > akhiran "_id" (PK pattern) > akhiran "id" (compound)
  let found = keys.find((k) => /^id$/i.test(k));
  if (found) return found;
  found = keys.find((k) => /_id$/i.test(k));
  if (found) return found;
  found = keys.find((k) => /id$/i.test(k));
  return found || null;
}

/**
 * Jalankan UPDATE via SSH tunnel pada satu baris tabel.
 * @param {string} tableName
 * @param {object} row — objek baris LENGKAP (punya kolom ID)
 * @param {string} colKey — nama kolom yang diedit
 * @param {*} value — nilai baru
 * @returns {Promise<{updated:boolean}>}
 */
export async function updateRow(tableName, row, colKey, value) {
  if (!tableName || !row || !colKey) throw new Error('updateRow: tableName, row, colKey wajib');
  const idCol = _detectIdColumn(row);
  if (!idCol) throw new Error('updateRow: tidak ditemukan kolom ID di row');
  const idVal = row[idCol];
  // 1. Optimistic — perbarui IndexedDB cache DULU (instant, tanpa SSH)
  await _updateCache(tableName, (r) => r[idCol] === idVal, (r) => ({ ...r, [colKey]: value }));
  // 2. Sinkron SSH di background (fire-and-forget — tidak blocking UI)
  runQuery(`UPDATE \`${tableName}\` SET \`${colKey}\` = ? WHERE \`${idCol}\` = ?`, [value, idVal])
    .catch((err) => console.warn('[updateRow] SSH gagal (cache IndexedDB sudah diperbarui):', err?.message || err));
  return { updated: true };
}

export async function deleteRow(tableName, row) {
  if (!tableName || !row) throw new Error('deleteRow: tableName, row wajib');
  const idCol = _detectIdColumn(row);
  if (!idCol) throw new Error('deleteRow: tidak ditemukan kolom ID di row');
  const idVal = row[idCol];
  // 1. Optimistic — hapus dari IndexedDB cache DULU (instant, tanpa SSH)
  await _updateCache(tableName, (r) => r[idCol] === idVal, null);
  // 2. Sinkron SSH di background (fire-and-forget — tidak blocking UI)
  runQuery(`DELETE FROM \`${tableName}\` WHERE \`${idCol}\` = ?`, [idVal])
    .catch((err) => console.warn('[deleteRow] SSH gagal (cache IndexedDB sudah dihapus):', err?.message || err));
  return { deleted: true };
}

/**
 * Perbarui IndexedDB cache TANPA koneksi SSH — modifikasi data di
 * cache secara langsung (update satu row atau hapus satu row) supaya
 * readTable() langsung mengembalikan data terbaru tanpa membuat
 * koneksi database baru (menghindari "Too many connections").
 * @param {string} tableName
 * @param {function} match — predicate(row) → true untuk row target
 * @param {function|null} transform — null = hapus, else fungsi (row) → row baru
 */
async function _updateCache(tableName, match, transform) {
  const store = window.DistroBuckets('nx-ssh-table-cache');
  const cached = await store.get(tableName).catch(() => null);
  if (!cached?.result) return;
  const { rows, fields } = cached.result;
  const updated = transform
    ? rows.map((r) => (match(r) ? transform(r) : r))
    : rows.filter((r) => !match(r));
  await store.set({ id: tableName, result: { rows: updated, fields }, syncedAt: Date.now() });
}
