// Export function untuk route 'contact/data' (menjadi 'contact_data.js')
//
// TIDAK ADA import di file ini. window.renderDirectoryTreeHtml,
// window.attachDirectoryTreePersistence, window.attachFileClickViewer
// sudah didaftarkan GLOBAL oleh templates/distro/Development/system/index.js
// (dimuat otomatis oleh templates/distro/grafis.js sebelum route ini bisa
// diakses) — logic traverse + render HTML + persistensi expand/collapse +
// viewer isi file ada di system/directory/index.js dan
// system/directory/editor.js, bukan di sini. File ini murni PEMAKAI hasil jadi.
export async function index(page, route) {
  route.register(page, async (routeName, container, routeMeta = {
    title: "Contact Data | App",
    description: "Data kontak.",
  }, style, nav = {}) => {
    route.routeMetaByRoute.set(page, routeMeta);
    const data = await window.NxStorage('tabel');
    const treeHtml = await window.renderDirectoryTreeHtml();

    console.log("📍 NxStorage to:", data);
    container.innerHTML = `
        <article class="nx-page">
 
<div class="nx-directory-layout" id="nx-directory-layout">
    <div class="nx-directory-layout__tree nx-scroll" id="nx-directory-tree-mount">${treeHtml}</div>
    <div class="nx-directory-layout__resize-handle" id="nx-directory-resize-handle"></div>
    <div class="nx-directory-layout__viewer" id="editor">
      <div id="nx-file-viewer-mount"><p class="nx-file-viewer__placeholder">Klik salah satu file di daftar untuk melihat isinya.</p></div>
    </div>
</div>
        </article>
      `;

    // Pasang SETELAH innerHTML terpasang di DOM — attachDirectoryTreePersistence/
    // attachFileClickViewer butuh elemen nyata (<details>, <div data-nx-file-path>)
    // untuk dipasangi listener, bukan string HTML. relPath default '.' harus
    // SAMA dengan yang dipakai renderDirectoryTreeHtml() di atas (keduanya
    // default '.') supaya key localStorage & path file yang diklik cocok.
    const treeMount = document.getElementById('nx-directory-tree-mount');
    window.attachDirectoryTreePersistence(treeMount);
    window.attachFileClickViewer(treeMount, document.getElementById('nx-file-viewer-mount'));

    // Kolom tree bisa ditarik lebarnya (drag handle di antara tree dan
    // viewer) — beberapa nama file panjang terpotong di lebar tetap
    // col-2 (grid persentase) lama, TIDAK ada cara memperlebar sebelum ini.
    // window.NxResize (assets/modules/resize/NexaResize.js) — modul kernel
    // GENERIK (bukan spesifik distro ini), lebar tersimpan localStorage
    // (key di-scope per-distro) supaya bertahan lintas refresh, sama
    // prinsip persistensi dengan expand/collapse tree & file terakhir
    // dibuka (lihat system/directory/README.md).
    window.NxResize(document.getElementById('nx-directory-resize-handle'), {
      target: treeMount,
      axis: 'x',
      min: 160,
      max: 640,
      key: 'nx-resize::Development::directory-tree-width',
    });

    // Tinggi kolom tree/viewer dihitung DINAMIS (sisa viewport setelah
    // dikurangi posisi top elemen ini) — pola SAMA dengan
    // templates/distro/Development/index.js (NXHOME) — BUKAN angka vh
    // statis (min-height:60vh sebelumnya bisa memotong konten kalau judul
    // halaman di atasnya lebih tinggi dari perkiraan).
    //
    // Class .nx-scroll (assets/modules/scroll/) HANYA dipasang di
    // #nx-directory-tree-mount (daftar file murni, tidak ada sub-scroll
    // internal apa pun) — lihat templates/distro/Development/README.md
    // untuk aturan pemakaian scroll: boleh custom, TAPI utamakan
    // .nx-scroll bawaan.
    //
    // #editor (.nx-directory-layout__viewer) SENGAJA TIDAK diberi class
    // .nx-scroll LANGSUNG — isinya berganti-ganti (placeholder statis /
    // pratinjau gambar / editor CodeMirror / preview markdown, lihat
    // editor.js) dan saat editor CM6 terbuka, CM6 MEMBUAT scroll
    // internalnya SENDIRI (.nexacmirror6-wrap/.cm-scroller, lihat
    // NexaCmirror6.js) — memaksa .nx-scroll (overflow-y:auto) di container
    // LUAR akan membungkus SELURUH .nx-file-viewer termasuk headernya
    // (nama file + status simpan), menghasilkan DUA scrollbar bertumpuk
    // dan header ikut ter-scroll keluar pandangan alih-alih tetap terlihat.
    //
    // Scrollbar CM6 (.cm-scroller) diselaraskan tampilannya dengan tema
    // .nx-scroll — class ditempel LANGSUNG ke elemen via JS di editor.js
    // (editorEl.parentElement.querySelector('.nexacmirror6-wrap
    // .cm-scroller').classList.add('nx-scroll')), BUKAN CSS descendant
    // selector (.nexacmirror6-wrap adalah SIBLING dari
    // .nx-file-viewer__editor, bukan child-nya — selector CSS descendant
    // sempat salah ditulis dan tidak pernah match, lihat histori bug di
    // system/directory/style.css). Tinggi editor sendiri diatur lewat
    // `.nx-file-viewer > .nexacmirror6-wrap { flex:1 1 auto; ... }` di
    // style.css yang sama (menargetkan .nexacmirror6-wrap sebagai flex
    // SIBLING, bukan descendant). Kernel (NexaCmirror6.js) TIDAK disentuh
    // sama sekali — .nexacmirror6-wrap dibuat modul itu sendiri saat _init().
    const layoutEl = document.getElementById('nx-directory-layout');
    if (layoutEl && window.NXUI?.Window) {
      const applyHeight = () => {
        const top = layoutEl.getBoundingClientRect().top;
        const viewportHeight = window.NXUI.Window.height();
        layoutEl.style.height = Math.max(0, viewportHeight - top) + 'px';
      };
      applyHeight();
      window.addEventListener('resize', applyHeight);
    }
  });
}
