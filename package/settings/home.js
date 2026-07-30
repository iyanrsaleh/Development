/**
 * Default Settings panel (#nxpackage) — About distro.
 * Logo + nama + versi + deskripsi dari package.json root.
 */
export async function home(page, route) {
  route.register(page, async (routeName, container, routeMeta = {
    title: 'About | Settings',
    description: 'Identitas distro (logo, nama, versi).',
  }, style, nav = {}) => {
    route.routeMetaByRoute.set(page, routeMeta);

    let meta = {
      title: 'Development',
      version: '1.0.0',
      brend: { icon: '/distro/Development/assets/brend/icon.png' },
    };
    try {
      if (window.NxDirectory?.readFile) {
        const { content } = await window.NxDirectory.readFile('package.json');
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object') meta = { ...meta, ...parsed };
      }
    } catch (_) {
      /* fallback meta di atas */
    }

    const title = String(meta.title || meta.id || 'Development');
    const version = String(meta.version || '').trim();
    const brend = meta.brend;
    let iconPath = '';
    if (typeof brend === 'string') {
      iconPath = brend.trim();
    } else if (brend && typeof brend === 'object') {
      iconPath = String(brend.icon || brend.ico || '').trim();
    }
    if (!iconPath) {
      iconPath = '/distro/Development/assets/brend/icon.png';
    }
    // Sama launcher: path di package.json relatif /templates…
    const iconSrc = iconPath.startsWith('/templates')
      ? iconPath
      : `/templates${iconPath.startsWith('/') ? '' : '/'}${iconPath}`;

    const versionHtml = version
      ? `<p class="nx-settings-about__version caption">Version ${escapeHtml(version)}</p>`
      : '';

    container.innerHTML = `
      <div class="ubuntu-workbench nx-settings-about">
        <div class="nx-settings-about__brand">
          <img
            class="nx-settings-about__logo"
            src="${escapeAttr(iconSrc)}"
            alt=""
            width="96"
            height="96"
            decoding="async"
          />
          <h1 class="nx-settings-about__name title-1">${escapeHtml(title)}</h1>
          ${versionHtml}
        </div>
      </div>
    `;
  });
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}
