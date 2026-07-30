/**
 * Form tema jendela app (.nx-app-window).
 * Logic/prefs: system/window/settings.js (window.*).
 * Preview: .nx-window-theme-mock (bukan jendela nyata).
 */
export async function stwindow(page, route) {
  route.register(page, async (routeName, container, routeMeta = {
    title: "Window | Settings",
    description: "Konsep visual bingkai jendela app (tema chrome).",
  }, style, nav = {}) => {
    route.routeMetaByRoute.set(page, routeMeta);

    const native = window.NATIVE_WINDOW_THEME_DEFAULTS || { theme: 'adwaita' };
    const themes = Array.isArray(window.WINDOW_THEMES) && window.WINDOW_THEMES.length
      ? window.WINDOW_THEMES
      : [
        { id: 'adwaita', label: 'Adwaita Light', description: 'Header abu lembut.' },
        { id: 'dark', label: 'Dark Chrome', description: 'Bingkai gelap.' },
        { id: 'ubuntu', label: 'Ubuntu Accent', description: 'Aksen oranye.' },
        { id: 'minimal', label: 'Minimal Flat', description: 'Flat ringkas.' },
        { id: 'glass', label: 'Glass', description: 'Transparan blur.' },
      ];

    const prefs = typeof window.loadWindowThemePrefs === 'function'
      ? await window.loadWindowThemePrefs()
      : null;
    const merged = typeof window.mergeWindowThemePrefs === 'function'
      ? window.mergeWindowThemePrefs({ ...native }, prefs)
      : { ...native, ...(prefs || {}) };

    const theme = String(merged.theme || 'adwaita');

    const previewWin = (id) => (
      `<div class="nx-window-theme-mock nx-window-theme-mock--${escapeAttr(id)}">` +
      `<div class="nx-window-theme-mock__header">` +
      `<span class="nx-window-theme-mock__title">Preview</span>` +
      `<span class="nx-window-theme-mock__controls">` +
      `<span class="nx-window-theme-mock__btn"></span>` +
      `<span class="nx-window-theme-mock__btn"></span>` +
      `<span class="nx-window-theme-mock__btn"></span>` +
      `</span></div>` +
      `<div class="nx-window-theme-mock__body">Isi jendela aplikasi</div>` +
      `</div>`
    );

    const cards = themes.map((t) => {
      const id = String(t.id || '');
      const selected = id === theme ? ' is-selected' : '';
      const checked = id === theme ? ' checked' : '';
      return (
        `<label class="nx-window-theme-preview__option${selected}" data-theme="${escapeAttr(id)}">` +
        `<input type="radio" name="theme" value="${escapeAttr(id)}"${checked} />` +
        previewWin(id) +
        `<div class="nx-window-theme-preview__meta">` +
        `<p class="heading">${escapeHtml(t.label || id)}</p>` +
        `<p class="caption">${escapeHtml(t.description || '')}</p>` +
        `</div></label>`
      );
    }).join('');

    container.innerHTML = `
      <div class="ubuntu-workbench">
        <article class="card">
          <h1 class="title-2">Window</h1>
          <p class="body">
            Tema visual bingkai <span class="monospace">.nx-app-window</span>
            (header, border, bayangan). Tidak mengubah ukuran/posisi tersimpan.
            Langsung diterapkan ke jendela yang sedang terbuka.
          </p>

          <form id="nx-window-theme-form">
            <div class="card" style="margin-top:1rem">
              <p class="heading">Konsep visual</p>
              <p class="caption">Pilih salah satu — tersimpan otomatis.</p>
              <div class="nx-window-theme-preview" id="nx-window-theme-list">
                ${cards}
              </div>
            </div>

            <p style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:1rem">
              <button type="button" class="button" id="nx-window-theme-reset">Reset ke native</button>
            </p>
            <p id="nx-window-theme-status" class="caption" hidden></p>
          </form>
        </article>
      </div>
    `;

    const form = container.querySelector('#nx-window-theme-form');
    const statusEl = container.querySelector('#nx-window-theme-status');
    const resetBtn = container.querySelector('#nx-window-theme-reset');
    const list = container.querySelector('#nx-window-theme-list');

    const showStatus = (msg, ok = true) => {
      if (!statusEl) return;
      statusEl.hidden = false;
      statusEl.textContent = msg;
      statusEl.style.color = ok ? 'var(--success-bg-color)' : 'var(--error-bg-color)';
    };

    const syncSelected = () => {
      const selected = form?.querySelector('input[name="theme"]:checked');
      const val = selected ? String(selected.value) : '';
      list?.querySelectorAll('.nx-window-theme-preview__option').forEach((el) => {
        el.classList.toggle('is-selected', el.getAttribute('data-theme') === val);
      });
    };

    const persistAndApply = async (payload) => {
      if (typeof window.saveWindowThemePrefs !== 'function') {
        throw new Error('saveWindowThemePrefs belum terdaftar (system/index.js)');
      }
      const saved = await window.saveWindowThemePrefs(payload);
      if (typeof window.applyWindowThemePrefs === 'function') {
        window.applyWindowThemePrefs(saved);
      }
      return saved;
    };

    form?.addEventListener('change', async (e) => {
      const t = e.target;
      if (!t || t.name !== 'theme') return;
      e.stopPropagation();
      syncSelected();
      try {
        const next = { theme: String(new FormData(form).get('theme') || 'adwaita') };
        await persistAndApply(next);
        showStatus(`Tersimpan — tema “${next.theme}”.`);
      } catch (err) {
        showStatus(err && err.message ? err.message : String(err), false);
      }
    });

    resetBtn?.addEventListener('click', async () => {
      try {
        const d = window.NATIVE_WINDOW_THEME_DEFAULTS || native;
        const next = { theme: d.theme || 'adwaita' };
        await persistAndApply(next);
        const radio = form.querySelector(`input[name="theme"][value="${next.theme}"]`);
        if (radio) radio.checked = true;
        syncSelected();
        showStatus('Reset ke native (Adwaita Light).');
      } catch (err) {
        showStatus(err && err.message ? err.message : String(err), false);
      }
    });
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
