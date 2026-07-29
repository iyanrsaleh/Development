// Export function untuk route 'contact/data' (menjadi 'contact_data.js')
export async function index(page, route) {
  route.register(page, async (routeName, container, routeMeta = {
    title: "Contact Data | App",
    description: "Data kontak.",
  }, style, nav = {}) => {
    route.routeMetaByRoute.set(page, routeMeta);
    // const data = await NxStorage('package');
     await NXUI.usePackageEndpoint("news");
          const TABLE_NAME = "demo";
     const complexQuery = await NXUI.Storage()
     .model("demo")
     .select("*")
     .get();
      console.log("📍 data", complexQuery.data);
    // console.log("📍 NxStorage to:", data);
    container.innerHTML = `
        <article class="nx-page">
          <h1 class="nx-page__title">news Data Page</h1>
          <p class="nx-page__lead">Ini adalah halaman Contact Data.</p>

                 <h1 class="nx-page__title">Distro Grafis</h1>
         <a href="/distro/home">Cotoh 1</a>|
         <a href="#distro/tables">Cotoh 2</a>|
         <a href="/instal">instal 2</a>|
         <a href="/boot/componen">componen</a>|

<hr>

          </section>
        </article>
      `;
  });
}
