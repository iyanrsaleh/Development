// Title bar custom extension "Development" — dipanggil dari App.js
// (loadTitlebar()), sekali di awal, dirender ke <div id="nx-titlebar">
// di index.html. Shell TIDAK punya title bar sistem sendiri
// (electron/main.js: frame: false) — NXTITLEBAR adalah konvensi baku
// nama fungsi pembuka titlebar tiap extension, sama pola dengan NXHOME.
// Style di ./style.css (sudah otomatis ter-@import ke
// templates/workspace.css saat instalasi — lihat templates/README.md).
//
// Prefs (variant + show/hide/hover): system/titlebar/settings.js →
// DistroBuckets("nx-titlebar"), UI package/settings/titlebar.js.
//
// Ikon kontrol: Fluent System Icons (class icon-ic_fluent_*).

function fluentIcon(name, size = 16) {
  return `<i class="icon-ic_fluent_${name}_${size}_regular" aria-hidden="true"></i>`;
}

function setTitlebarMaximizeIcon(btn, maximized) {
  if (!btn) return;
  btn.innerHTML = maximized
    ? fluentIcon('square_multiple', 16)
    : fluentIcon('maximize', 16);
  btn.title = maximized ? 'Restore' : 'Maximize';
  btn.setAttribute('aria-label', btn.title);
}

export async function NXTITLEBAR(container) {
  const distro = await window.NxExtension.getActiveExtension();
  const title = distro?.title || distro?.id || 'App';
  const iconSrc = distro?.brend?.ico || distro?.brend?.icon || '';

  // Prefs: display + variant (fallback native kalau bucket belum siap)
  let prefs = { display: 'show', variant: 'classic' };
  try {
    if (typeof window.refreshTitlebar === 'function') {
      // refresh menerapkan ke host; kita render dulu lalu apply ulang di bawah
    }
    if (typeof window.loadTitlebarPrefs === 'function') {
      const saved = await window.loadTitlebarPrefs();
      if (typeof window.mergeTitlebarPrefs === 'function') {
        prefs = window.mergeTitlebarPrefs(window.NATIVE_TITLEBAR_DEFAULTS || prefs, saved);
      } else if (saved) {
        prefs = { ...prefs, ...saved };
      }
    }
  } catch (_) { /* ignore */ }

  const variant = prefs.variant || 'classic';

  container.innerHTML = `
    <div class="nx-titlebar nx-titlebar--${variant}" data-variant="${variant}">
      <div class="nx-titlebar__brand">
        ${iconSrc ? `<img class="nx-titlebar__icon" src="/templates${iconSrc}" alt="" />` : ''}
        <span class="nx-titlebar__title">${title}</span>
      </div>
      <div class="nx-titlebar__controls">
        <button type="button" class="nx-titlebar__btn" data-nx-win="minimize" aria-label="Minimize" title="Minimize">${fluentIcon('subtract', 16)}</button>
        <button type="button" class="nx-titlebar__btn" data-nx-win="maximize" aria-label="Maximize" title="Maximize">${fluentIcon('maximize', 16)}</button>
        <button type="button" class="nx-titlebar__btn nx-titlebar__btn--close" data-nx-win="close" aria-label="Close" title="Close">${fluentIcon('dismiss', 16)}</button>
      </div>
    </div>
  `;

  if (typeof window.applyTitlebarPrefs === 'function') {
    window.applyTitlebarPrefs(prefs, { host: container });
  }

  const maxBtn = container.querySelector('[data-nx-win="maximize"]');

  const syncMaxIcon = async () => {
    let maximized = false;
    try {
      if (typeof window.electronAPI?.windowIsMaximized === 'function') {
        const res = await window.electronAPI.windowIsMaximized();
        maximized = !!(res && res.maximized);
      } else if (window.NXUI?.Window?.isMaximized) {
        maximized = !!window.NXUI.Window.isMaximized();
      }
    } catch (_) { /* ignore */ }
    setTitlebarMaximizeIcon(maxBtn, maximized);
  };

  container.querySelector('[data-nx-win="minimize"]')?.addEventListener('click', () => {
    window.electronAPI?.windowMinimize?.();
  });
  maxBtn?.addEventListener('click', async () => {
    await window.electronAPI?.windowMaximizeToggle?.();
    await syncMaxIcon();
  });
  container.querySelector('[data-nx-win="close"]')?.addEventListener('click', () => {
    window.electronAPI?.windowClose?.();
  });

  void syncMaxIcon();
  if (window.NXUI?.Window?.onResize) {
    window.NXUI.Window.onResize(() => { void syncMaxIcon(); });
  } else {
    window.addEventListener('resize', () => { void syncMaxIcon(); });
  }
}
