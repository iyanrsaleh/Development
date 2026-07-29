// Export function untuk route home (isi #nxhome).
export async function home(page, route) {
  route.register(page, async (routeName, container, routeMeta = {
    title: "Home | Development",
    description: "Beranda distro Development.",
  }, style, nav = {}) => {
    route.routeMetaByRoute.set(page, routeMeta);
    container.innerHTML = ` `;
  });
}
