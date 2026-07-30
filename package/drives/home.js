// Render awal #nxpackage — wajib jika index memasang #nxpackage.
export async function home(page, route) {
  route.register(page, async (routeName, container, routeMeta = {
    title: 'Files | Package',
    description: 'Render awal #nxpackage package drives.',
  }, style, nav = {}) => {
    route.routeMetaByRoute.set(page, routeMeta);
    container.innerHTML = `
        <article class="nx-page">
          <h1 class="nx-page__title">Files</h1>
          <p class="nx-page__lead">Buka <code>#distro/package/drives/index</code> untuk file manager.</p>
        </article>
      `;
  });
}
