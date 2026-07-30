// Export function untuk route 'contact/data' (menjadi 'contact_data.js')
//
// TIDAK ADA import di file ini. window.renderDirectoryTreeHtml,
// window.attachDirectoryTreePersistence, window.attachFileClickViewer
// sudah didaftarkan GLOBAL oleh templates/distro/Development/system/index.js
// (dimuat otomatis oleh templates/distro/grafis.js sebelum route ini bisa
// diakses) — logic traverse + render HTML + persistensi expand/collapse +
// viewer isi file ada di system/directory/index.js dan
// system/directory/editor.js, bukan di sini. File ini murni PEMAKAI hasil jadi.
//
// Scroll (Development/README §4a + system/window/README):
// - Tree: .nx-scroll di #nx-directory-tree-mount
// - Editor CM6: scroll sendiri (.cm-scroller + nx-scroll di editor.js)
// - .nx-app-window__body: JANGAN .nx-scroll / JANGAN overflow scroll — double-scroll
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
<div class="nx-directory-layout" id="nx-directory-layout">
  <div class="nx-directory-layout__tree nx-scroll" id="nx-directory-tree-mount">${treeHtml}</div>
  <div class="nx-directory-layout__resize-handle" id="nx-directory-resize-handle"></div>
  <div class="nx-directory-layout__viewer" id="editor">
    <div id="nx-file-viewer-mount"><p class="nx-file-viewer__placeholder">Klik salah satu file di daftar untuk melihat isinya.</p></div>
  </div>
</div>
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
    // viewer) — window.NxResize (assets/modules/resize/README.md).
    window.NxResize(document.getElementById('nx-directory-resize-handle'), {
      target: treeMount,
      axis: 'x',
      min: 160,
      max: 640,
      key: 'nx-resize::Development::directory-tree-width',
    });

    // Tinggi layout = sisa tinggi BODY jendela (bukan viewport desktop).
    // Body dikunci: tanpa .nx-scroll — scroll editor/tree masing-masing.
    const layoutEl = document.getElementById('nx-directory-layout');
    const winBody = layoutEl?.closest('.nx-app-window__body')
      || (container.classList.contains('nx-app-window__body') ? container : null);

    if (winBody) {
      winBody.classList.add('has-nx-directory-layout');
      winBody.classList.remove('nx-scroll');
      winBody.style.setProperty('overflow', 'hidden', 'important');
    }

    const applyHeight = () => {
      if (!layoutEl) return;
      if (winBody) {
        const bodyRect = winBody.getBoundingClientRect();
        const top = layoutEl.getBoundingClientRect().top;
        layoutEl.style.height = Math.max(0, Math.floor(bodyRect.bottom - top)) + 'px';
        return;
      }
      if (window.NXUI?.Window) {
        const top = layoutEl.getBoundingClientRect().top;
        const viewportHeight = window.NXUI.Window.height();
        layoutEl.style.height = Math.max(0, viewportHeight - top) + 'px';
      }
    };

    applyHeight();
    window.addEventListener('resize', applyHeight);
    if (winBody && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => applyHeight());
      ro.observe(winBody);
    }
  });
}
