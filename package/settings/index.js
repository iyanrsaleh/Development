// Package "settings" — shell di work area.
// Bingkai window disiapkan NexaRoute via nxPrepareAppWindowContainer
// (container di sini = .nx-app-window__body). Jangan openAppWindow lagi.
//
// Scroll: kontrak system/window/README + Development/README §4a —
// .nx-app-window__body.nx-scroll (kernel assets/modules/scroll).
// Layout kolom: flex + window.NxResize (bukan row/col-*), lihat
// assets/modules/resize/README.md + package/directory/index.js.
export async function index(page, route) {
  route.register(page, async (routeName, container, routeMeta = {
    title: "settings | App",
    description: "Halaman package settings.",
  }, style, nav = {}) => {
    route.routeMetaByRoute.set(page, routeMeta);

    const sections = [
      {
        href: '#package/settings/home',
        icon: 'info',
        title: 'About',
        desc: 'Identitas distro — logo dan nama.',
      },
      {
        href: '#package/settings/launcher',
        icon: 'apps',
        title: 'Launcher',
        desc: 'Posisi dock, ikon, mode nama, item tersembunyi.',
      },
      {
        href: '#package/settings/wallpaper',
        icon: 'wallpaper',
        title: 'Wallpaper',
        desc: 'Gambar atau warna latar area kerja.',
      },
      {
        href: '#package/settings/drives',
        icon: 'folder',
        title: 'Files',
        desc: 'Warna folder, view default, file tersembunyi.',
      },
      {
        href: '#package/settings/titlebar',
        icon: 'tablet_laptop',
        title: 'Title bar',
        desc: 'Show / Hide / Hover dan gaya bar Electron.',
      },
      {
        href: '#package/settings/stwindow',
        icon: 'window',
        title: 'Window',
        desc: 'Tema visual bingkai jendela app.',
      },
      {
        href: '#package/settings/components',
        icon: 'grid',
        title: 'Components',
        desc: 'Showcase kontrol UI Ubuntu workbench.',
      },
    ];

    const items = sections.map((s) => (
      `<a class="nx-settings-nav__item" href="${s.href}">` +
      `<span class="nx-settings-nav__icon" aria-hidden="true">` +
      `<i class="icon-ic_fluent_${s.icon}_20_regular"></i>` +
      `</span>` +
      `<span class="nx-settings-nav__text">` +
      `<span class="nx-settings-nav__title">${s.title}</span>` +
      `<span class="nx-settings-nav__desc">${s.desc}</span>` +
      `</span>` +
      `</a>`
    )).join('');

    container.innerHTML = `
      <div class="ubuntu-workbench nx-settings-shell" id="nx-settings-shell">
        <aside class="nx-settings-shell__aside" id="nx-settings-aside">
          <nav class="nx-settings-nav" aria-label="Settings sections">
            ${items}
          </nav>
        </aside>
        <div class="nx-settings-shell__resize-handle" id="nx-settings-resize-handle" role="separator" aria-orientation="vertical" aria-label="Resize sidebar"></div>
        <div class="nx-settings-shell__main">
          <div id="nxpackage"></div>
        </div>
      </div>
    `;

    // Body: .nx-scroll (kernel) + padding 0 untuk shell edge-to-edge.
    if (container.classList.contains('nx-app-window__body')) {
      container.classList.add('nx-scroll', 'has-nx-settings-shell');
      container.classList.remove('nx-settings-lock-scroll');
      container.style.setProperty('padding', '0', 'important');
      container.style.removeProperty('overflow');
      container.style.removeProperty('min-height');
      container.style.removeProperty('position');
    }

    // Sidebar resize — pola sama package/directory (window.NxResize kernel).
    const aside = document.getElementById('nx-settings-aside');
    const handle = document.getElementById('nx-settings-resize-handle');
    if (aside && handle && typeof window.NxResize === 'function') {
      window.NxResize(handle, {
        target: aside,
        axis: 'x',
        min: 160,
        max: 420,
        key: 'nx-resize::Development::settings-aside-width',
      });
    }

    const hash = String(location.hash || '');
    container.querySelectorAll('.nx-settings-nav a[href^="#package/"]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      const path = href.replace(/^#\/?/, '');
      if (hash.indexOf(path) !== -1 || hash === href || hash === `#/${path}`) {
        a.classList.add('is-active');
      }
    });
  });
}
