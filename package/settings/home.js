// Render awal #nxpackage untuk package "settings".
// Wajib ada jika index.js memasang <div id="nxpackage"></div>.
export async function home(page, route) {
  route.register(page, async (routeName, container, routeMeta = {
    title: "Settings Home | Package",
    description: "Render awal #nxpackage (package/settings/home.js).",
  }, style, nav = {}) => {
    route.routeMetaByRoute.set(page, routeMeta);
    container.innerHTML = `
        <article class="nx-page">
          <h1 class="nx-page__title">settings / home</h1>
          <p class="nx-page__lead">Ini render awal <code>#nxpackage</code> dari <code>home.js</code>.</p>
          <p>Route: ${routeName}</p>
        </article>
      `;
  });
}
