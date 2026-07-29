# `system/ssh/` — pengaturan & logic koneksi SSH tunnel distro "Development"

Modul SISTEM (level distro, BUKAN kernel) — satu-satunya tempat pengaturan
koneksi SSH tunnel + database untuk distro ini: preset mana yang aktif, SQL
apa yang dijalankan, dan kredensial. Logic BERADA DI SINI (`system/ssh/`),
di-registrasi jadi window global lewat `system/index.js` (titik registrasi
tunggal) — pola SAMA dengan `system/directory/`.

Pemakai (`package/sshtest/index.js`) **TIDAK PUNYA pengaturan apa pun
sendiri** — cukup panggil fungsi yang sudah didaftarkan di `window` dan
menampilkan hasilnya. Semua yang bisa diubah (preset aktif, SQL, kredensial)
diedit di sini / `config.json`, bukan di `package/sshtest/`.

## Kaitan dengan modul kernel

Modul ini adalah **pemakai** `window.NxSSHTunnel` (kernel,
`assets/modules/SSHTunne/NexaSSHTunnel.js`) — logic connect/query/disconnect
sungguhan (SSH tunnel + driver MySQL/PostgreSQL) ada di kernel itu (jalan di
Electron main process, lihat `electron/sshTunnelManager.js`). `system/ssh/`
hanya menambahkan lapisan "preset dari file config" di atasnya, supaya
pemakai (`package/sshtest/`) tidak perlu tahu detail `opts` koneksi sama
sekali.

## `config.json`

```json
{
  "enabled": false,
  "activePreset": "nx-mysql-lokal",
  "activeSql": "SELECT 1",
  "presets": [
    {
      "name": "nx-mysql-lokal",
      "kind": "mysql",
      "sshHost": "203.0.113.10",
      "sshPort": 22,
      "sshUsername": "deploy",
      "sshPassword": null,
      "sshPrivateKey": null,
      "sshPassphrase": null,
      "dbHost": "127.0.0.1",
      "dbPort": 3306,
      "dbUsername": null,
      "dbPassword": null,
      "dbName": "appdb"
    }
  ]
}
```

- `enabled` — **flag utama**. `false` (default kalau field absen/null) =
  SSH tunnel MATI total: tidak ada warm-up saat start, dan
  `runQuery`/`runActiveConnection`/`syncTablesToIndexedDB` menolak connect
  dengan pesan jelas. Set `true` HANYA kalau fitur DB/SSH sedang dipakai
  dan kredensial sudah diisi.
- `activePreset` — menunjuk salah satu `presets[].name`, dipakai SEMUA
  fungsi di bawah (`runActiveConnection`, `runQuery`, `listTables`,
  `readTable`) untuk memilih kredensial mana yang dipakai.
- `activeSql` — SQL tetap yang dijalankan `runActiveConnection()` (dipakai
  tombol/aksi "test koneksi" paling dasar).
- `presets[]` — daftar profil koneksi. `kind`: `'mysql'` \| `'postgres'`.
  Field `sshPassword`/`sshPrivateKey`/`sshPassphrase`/`dbUsername`/
  `dbPassword` **BOLEH diisi kredensial asli** — file ini **di-`.gitignore`**
  (lihat `.gitignore` root project: `templates/distro/*/system/ssh/
  config.json`), TIDAK ikut ter-commit ke repo.

Alternatif device-bound (tersimpan terenkripsi per-device di Electron main
process, tidak bergantung file plaintext di disk) tetap tersedia lewat
`window.NxSSHTunnel.saveProfile()`/`loadProfile()` — lihat
`assets/modules/SSHTunne/README.md` — kalau suatu saat dibutuhkan.

`config.json` dibaca lewat `window.NxDirectory.readFile()` (bukan `fetch()`
manual) — otomatis di-sandbox ke root distro "Development" (deteksi stack
trace, lihat `NexaDirectory.js`), tidak perlu pusing base URL server. Hasil
baca di-cache di memori (module-level `_cachedConfig`) — panggil
`loadSSHConfig({ forceReload: true })` kalau `config.json` baru saja diedit
manual dan ingin dibaca ulang tanpa refresh halaman penuh.

## API (`system/ssh/index.js`)

### `loadSSHConfig({ forceReload? })`

Baca seluruh isi `config.json` apa adanya. `Promise<{enabled, activePreset, activeSql, presets}>`.

### `loadSSHPresets({ forceReload? })` / `getSSHPreset(name)`

Daftar preset / satu preset berdasar `name`. `getSSHPreset` mengembalikan
`null` kalau tidak ketemu (tidak throw).

### `runActiveConnection()`

Jalankan `activePreset` + `activeSql` dari `config.json` — connect → query
→ disconnect satu kali jalan. **Signature TIDAK BOLEH diubah** (dipakai
`package/sshtest/index.js` via `window.runActiveSSHTest()` tanpa argumen).
`Promise<{rows, fields}>`.

### `runQuery(sql, params = [])`

Sama seperti `runActiveConnection()` tapi SQL bebas (bukan `activeSql`
tetap) — dipakai `listTables()`/`readTable()` di bawah, dan bisa dipanggil
langsung untuk kebutuhan lain. Connect+disconnect baru setiap panggilan
(tunnel SSH cukup murah dibuka ulang untuk kebutuhan eksplorasi seperti
ini — BUKAN satu koneksi persisten dipakai berulang).

### `listTables()`

Daftar nama tabel di `dbName` preset aktif — LEWAT SSH langsung (dipakai
`syncTablesToIndexedDB()` di bawah, BUKAN `readTable()`). Pakai
`SHOW TABLES` kalau `kind: 'mysql'` (satu kolom, nama kolom dinamis
`Tables_in_{dbName}` — ambil `Object.values(row)[0]` apa pun nama
kolomnya), atau query `information_schema.tables` kalau `kind: 'postgres'`.
`Promise<string[]>`.

## Arsitektur baca/tulis data tabel — IndexedDB sebagai satu-satunya sumber untuk UI

**`readTable(tableName)` TIDAK PERNAH menyentuh SSH sama sekali** — dia
HANYA baca `window.DistroBuckets('nx-ssh-table-cache')` (IndexedDB, key =
nama tabel). Kalau tabel belum pernah disinkron, hasilnya
`{ rows: [], fields: [] }` apa adanya (BUKAN menunggu SSH untuk mengisi).

**`syncTablesToIndexedDB()` adalah SATU-SATUNYA jalur yang mengisi/
memperbarui IndexedDB** — `listTables()` (SSH) lalu untuk SETIAP tabel,
query isi lewat SSH, tulis ke `nx-ssh-table-cache`. Fungsi ini **TIDAK
otomatis berkala/interval** — sengaja dibuat sebagai fungsi tersendiri yang
dipanggil EKSPLISIT oleh pemanggil (mis. `package/sshtest/index.js`
memanggilnya sekali sebelum baca tabel). Kalau butuh data terbaru,
panggil ini dulu sebelum `readTable()`.

Alasan pemisahan ini: SSH handshake (~1.8 detik, sudah diukur `console.time`)
jauh lebih lambat dari sekadar baca IndexedDB — UI yang memanggil
`readTable()` berkali-kali (mis. re-render tabel) tidak boleh ikut menunggu
biaya itu tiap kali. Kapan/seberapa sering `syncTablesToIndexedDB()`
dipanggil sepenuhnya keputusan pemanggil (tidak ada jadwal tersembunyi di
modul ini).

### `readTable(tableName)`

Baca IndexedDB SAJA (lihat penjelasan arsitektur di atas).
`Promise<{rows, fields}>` — `{rows: [], fields: []}` kalau belum pernah
disinkron.

### `syncTablesToIndexedDB(tableName?)`

- **`tableName` diisi** — sinkron **HANYA** tabel itu: satu query
  `SELECT * FROM {tableName} LIMIT 100` lewat SSH, tulis ke
  `nx-ssh-table-cache`. Lebih ringan/cepat, cocok dipanggil sebelum
  `readTable(tableName)` untuk tabel spesifik yang sedang dibutuhkan:
  ```js
  await window.syncSSHTables('user');
  const { rows, fields } = await window.readSSHTable('user');
  ```
- **`tableName` kosong** (default) — sinkron **SEMUA** tabel:
  `listTables()` lewat SSH, lalu untuk setiap tabel `SELECT * FROM
  {name} LIMIT 100`, tulis semua hasilnya ke `nx-ssh-table-cache`.
  Kegagalan SATU tabel (mis. dihapus di server) tidak menghentikan
  sinkronisasi tabel lain dalam panggilan yang sama.

Nama tabel divalidasi whitelist karakter (`/^[a-zA-Z0-9_]+$/`) — TIDAK bisa
di-parameterize lewat placeholder driver (`?`/`$1`, itu untuk VALUE bukan
identifier SQL). Guard `_syncInFlight` (per-tabel, atau `"*"` untuk mode
semua tabel) mencegah dua panggilan tumpang tindih untuk tabel/mode yang
SAMA — tabel BEDA tetap boleh sinkron paralel satu sama lain.
`Promise<void>`.

## Registrasi window (`system/index.js`)

| Window global | Fungsi |
|---|---|
| `window.loadSSHPresets` | `loadSSHPresets` |
| `window.getSSHPreset` | `getSSHPreset` |
| `window.runActiveSSHTest` | `runActiveConnection` |
| `window.runSSHQuery` | `runQuery` |
| `window.listSSHTables` | `listTables` |
| `window.readSSHTable` | `readTable` (baca IndexedDB saja) |
| `window.syncSSHTables` | `syncTablesToIndexedDB` (isi IndexedDB dari SSH) |
| `window.closeSSHConnection` | `closeActiveConnection` |

## Pemakaian saat ini — `package/sshtest/index.js`

Halaman uji coba SEMENTARA (tahap verifikasi data, BELUM dihubungkan ke
`NexaTables`/`tables.js`) — TIDAK ADA tombol/form apa pun. Begitu halaman
dibuka: `listSSHTables()` → `readSSHTable()` per tabel (baca IndexedDB
apa adanya), semua hasil `console.log()` ke DevTools (F12).
`window.syncSSHTables()` **sengaja tidak dipanggil otomatis di sini** (baris
pemanggilannya di-comment) — isi IndexedDB dipicu terpisah sesuai kebutuhan
(lihat arsitektur di atas: sinkronisasi adalah fungsi tersendiri, bukan
dipanggil implisit oleh halaman pembaca data). Menghubungkan hasil ini ke
UI tabel (`NXUI.NexaTables`, lihat `tables.js`) adalah tahap BERIKUTNYA,
belum dikerjakan.
