// Package "settings" — shell di work area.
// Bingkai window disiapkan NexaRoute via nxPrepareAppWindowContainer
// (container di sini = .nx-app-window__body). Jangan openAppWindow lagi.
export async function index(page, route) {
  route.register(page, async (routeName, container, routeMeta = {
    title: "settings | App",
    description: "Halaman package settings.",
  }, style, nav = {}) => {
    route.routeMetaByRoute.set(page, routeMeta);

    container.innerHTML = `
      <nav class="nx-app-shell__nav" aria-label="Settings sections">
        <a href="#package/settings/launcher">Launcher</a>
        <a href="#package/settings/wallpaper">Wallpaper</a>
        <a href="#package/settings/titlebar">Title bar</a>
        <a href="#package/settings/components">Components</a>
        <a href="/boot/componen">componen</a>
      </nav>
      <div id="nxpackage"></div>
    `;
    const hash = String(location.hash || '');
    container.querySelectorAll('.nx-app-shell__nav a[href^="#package/"]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (hash.indexOf(href.slice(1)) !== -1 || hash === href) {
        a.classList.add('is-active');
      }
    });
  });
}
