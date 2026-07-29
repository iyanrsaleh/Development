// Entry point extension "Development" — dipanggil dari templates/distro/grafis.js.
// NXHOME adalah konvensi baku fungsi pembuka utama extension. grafis.js
// SUDAH route.register duluan — NXHOME TIDAK boleh route.register lagi,
// cukup isi container yang sudah disiapkan.
export async function NXHOME(container, routeMeta) {
  // Host launcher + wallpaper di DALAM .nx-page (area index distro ini).
  // Wallpaper = sibling di belakang body/#nxhome — bukan isi #nxhome.
  container.innerHTML = `
      <article class="nx-page">
          <div id="nx-wallpaper-host" aria-hidden="true"></div>
          <div id="nx-launcher-host" class="nx-launcher-host"></div>
          <div class="nx-page__body">
             <div  id="nx-home-scroll">
               <div  id="nxhome"></div>
             </div>
           </div>
      </article>
    `;

  if (typeof window.applyWallpaper === 'function') {
    await window.applyWallpaper({
      mount: container.querySelector('#nx-wallpaper-host'),
      ...(window.NATIVE_WALLPAPER_DEFAULTS || {}),
    });
  }

  if (typeof window.renderShortcutLauncher === 'function') {
    await window.renderShortcutLauncher({
      mount: container.querySelector('#nx-launcher-host'),
      disabled: (window.NATIVE_LAUNCHER_DEFAULTS && window.NATIVE_LAUNCHER_DEFAULTS.disabled)
        ? window.NATIVE_LAUNCHER_DEFAULTS.disabled.slice()
        : ['directory'],
      settings: {
        position: 'left',
        iconSize: '35px',
        ...((window.NATIVE_LAUNCHER_DEFAULTS && window.NATIVE_LAUNCHER_DEFAULTS.settings) || {}),
      },
      add: [
        {
          id: 'home',
          title: 'home',
          description: 'GUI Development',
          brend: '/distro/Development/assets/brend/icon.png',
          href: '#distro/home',
        },
      ],
    });
  }

  const pageEl = container.querySelector('.nx-page');
  if (pageEl && window.NXUI?.Window) {
    const applyPageHeight = () => {
      const top = pageEl.getBoundingClientRect().top;
      const h = Math.max(0, window.NXUI.Window.height() - top);
      pageEl.style.height = h + 'px';
      pageEl.style.minHeight = h + 'px';
      pageEl.style.maxHeight = h + 'px';
    };
    applyPageHeight();
    window.addEventListener('resize', applyPageHeight);
  }

  // Scroll area = 100% dari .nx-page__body (sisa ruang setelah Launcher flex)
  const scrollEl = container.querySelector('#nx-home-scroll');
  if (scrollEl) {
    const applyHeight = () => {
      const body = scrollEl.parentElement;
      const h = body ? body.clientHeight : 0;
      if (h > 0) {
        scrollEl.style.height = h + 'px';
      } else if (window.NXUI?.Window) {
        const top = scrollEl.getBoundingClientRect().top;
        scrollEl.style.height = Math.max(0, window.NXUI.Window.height() - top) + 'px';
      }
    };
    applyHeight();
    window.addEventListener('resize', applyHeight);
  }
}
