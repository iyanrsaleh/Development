/**
 * Form pengaturan title bar (#nx-titlebar).
 * Logic/prefs: system/titlebar/settings.js (window.*).
 * display: show | hide | hover — preview pakai .nx-titlebar-mock.
 */
export async function titlebar(page, route) {
  route.register(page, async (routeName, container, routeMeta = {
    title: "Title bar | Settings",
    description: "Konsep visual title bar + tampilan Show / Hide / Hover.",
  }, style, nav = {}) => {
    route.routeMetaByRoute.set(page, routeMeta);

    const native = window.NATIVE_TITLEBAR_DEFAULTS || {
      display: 'show',
      variant: 'classic',
    };
    const variants = Array.isArray(window.TITLEBAR_VARIANTS) && window.TITLEBAR_VARIANTS.length
      ? window.TITLEBAR_VARIANTS
      : [
        { id: 'classic', label: 'Classic Dark', description: 'Bar gelap penuh.' },
        { id: 'light', label: 'Light', description: 'Bar terang.' },
        { id: 'ubuntu', label: 'Ubuntu Accent', description: 'Aksen oranye.' },
        { id: 'compact', label: 'Compact', description: 'Lebih rapat.' },
        { id: 'floating', label: 'Floating Glass', description: 'Inset blur.' },
      ];
    const displayOpts = Array.isArray(window.TITLEBAR_DISPLAY_OPTIONS) && window.TITLEBAR_DISPLAY_OPTIONS.length
      ? window.TITLEBAR_DISPLAY_OPTIONS
      : [
        { id: 'show', label: 'Tampilkan (Show)', description: 'Selalu terlihat.' },
        { id: 'hide', label: 'Sembunyikan (Hide)', description: 'Tidak ditampilkan.' },
        { id: 'hover', label: 'Hover', description: 'Muncul saat kursor di tepi atas.' },
      ];

    const prefs = typeof window.loadTitlebarPrefs === 'function'
      ? await window.loadTitlebarPrefs()
      : null;
    const merged = typeof window.mergeTitlebarPrefs === 'function'
      ? window.mergeTitlebarPrefs({ ...native }, prefs)
      : { ...native, ...(prefs || {}) };

    const display = String(merged.display || 'show');
    const variant = String(merged.variant || 'classic');

    const previewBar = (id) => (
      `<div class="nx-titlebar-mock nx-titlebar-mock--${escapeAttr(id)}" data-variant="${escapeAttr(id)}">` +
      `<div class="nx-titlebar-mock__brand">` +
      `<i class="icon-ic_fluent_apps_16_regular" aria-hidden="true" style="font-size:14px"></i>` +
      `<span class="nx-titlebar-mock__title">Preview</span>` +
      `</div>` +
      `<div class="nx-titlebar-mock__controls">` +
      `<span class="nx-titlebar-mock__btn" aria-hidden="true"><i class="icon-ic_fluent_subtract_16_regular"></i></span>` +
      `<span class="nx-titlebar-mock__btn" aria-hidden="true"><i class="icon-ic_fluent_maximize_16_regular"></i></span>` +
      `<span class="nx-titlebar-mock__btn" aria-hidden="true"><i class="icon-ic_fluent_dismiss_16_regular"></i></span>` +
      `</div></div>`
    );

    const variantCards = variants.map((v) => {
      const id = String(v.id || '');
      const selected = id === variant ? ' is-selected' : '';
      const checked = id === variant ? ' checked' : '';
      return (
        `<label class="nx-titlebar-preview__option${selected}" data-variant="${escapeAttr(id)}">` +
        `<input type="radio" name="variant" value="${escapeAttr(id)}"${checked} />` +
        previewBar(id) +
        `<div class="nx-titlebar-preview__meta">` +
        `<p class="heading">${escapeHtml(v.label || id)}</p>` +
        `<p class="caption">${escapeHtml(v.description || '')}</p>` +
        `</div></label>`
      );
    }).join('');

    const displayRows = displayOpts.map((d) => {
      const id = String(d.id || '');
      const checked = id === display ? ' checked' : '';
      return (
        `<label class="checkbox" style="padding:0.65rem 0.75rem;display:flex;align-items:flex-start;gap:0.55rem">` +
        `<input type="radio" name="display" value="${escapeAttr(id)}"${checked} style="margin-top:0.2rem" />` +
        `<span>` +
        `<strong>${escapeHtml(d.label || id)}</strong>` +
        `<br /><span class="caption">${escapeHtml(d.description || '')}</span>` +
        `</span></label>`
      );
    }).join('');

    container.innerHTML = `
      <div class="ubuntu-workbench">
        <article class="card">
          <h1 class="title-2">Title bar</h1>
          <p class="body">
            Atur cara tampil <span class="monospace">#nx-titlebar</span>
            (Show / Hide / Hover) dan konsep visualnya. Tersimpan otomatis.
          </p>

          <form id="nx-titlebar-prefs-form">
            <div class="card" style="margin-top:1rem">
              <p class="heading">Tampilan</p>
              <div class="boxed-list" style="margin-top:0.5rem">
                ${displayRows}
              </div>
              <p class="caption" style="margin-top:0.5rem">
                <strong>Hover</strong>: arahkan mouse ke tepi atas jendela Electron —
                bar slide turun; jauhkan kursor maka tersembunyi lagi.
              </p>
            </div>

            <div class="card" style="margin-top:1rem">
              <p class="heading">Konsep visual</p>
              <p class="caption">Pilih salah satu — langsung diterapkan &amp; disimpan.</p>
              <div class="nx-titlebar-preview" id="nx-titlebar-variant-list">
                ${variantCards}
              </div>
            </div>

            <p style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:1rem">
              <button type="button" class="button" id="nx-titlebar-prefs-reset">Reset ke native</button>
            </p>
            <p id="nx-titlebar-prefs-status" class="caption" hidden></p>
          </form>
        </article>
      </div>
    `;

    const form = container.querySelector('#nx-titlebar-prefs-form');
    const statusEl = container.querySelector('#nx-titlebar-prefs-status');
    const resetBtn = container.querySelector('#nx-titlebar-prefs-reset');
    const list = container.querySelector('#nx-titlebar-variant-list');

    const showStatus = (msg, ok = true) => {
      if (!statusEl) return;
      statusEl.hidden = false;
      statusEl.textContent = msg;
      statusEl.style.color = ok ? 'var(--success-bg-color)' : 'var(--error-bg-color)';
    };

    const syncSelectedClass = () => {
      const selected = form?.querySelector('input[name="variant"]:checked');
      const val = selected ? String(selected.value) : '';
      list?.querySelectorAll('.nx-titlebar-preview__option').forEach((el) => {
        el.classList.toggle('is-selected', el.getAttribute('data-variant') === val);
      });
    };

    const readForm = () => {
      const fd = new FormData(form);
      return {
        display: String(fd.get('display') || 'show'),
        variant: String(fd.get('variant') || 'classic'),
      };
    };

    const statusFor = (next) => {
      if (next.display === 'hide') return 'Tersimpan — title bar disembunyikan (Hide).';
      if (next.display === 'hover') {
        return `Tersimpan — Hover + “${next.variant}”. Arahkan mouse ke tepi atas.`;
      }
      return `Tersimpan — Show + “${next.variant}”.`;
    };

    const persistAndApply = async (payload) => {
      if (typeof window.saveTitlebarPrefs !== 'function') {
        throw new Error('saveTitlebarPrefs belum terdaftar (system/index.js)');
      }
      const saved = await window.saveTitlebarPrefs(payload);
      if (typeof window.applyTitlebarPrefs === 'function') {
        window.applyTitlebarPrefs(saved);
      }
      return saved;
    };

    form?.addEventListener('change', async (e) => {
      const t = e.target;
      if (!t || !form.contains(t)) return;
      if (t.name !== 'variant' && t.name !== 'display') return;
      e.stopPropagation();
      syncSelectedClass();
      const next = readForm();
      try {
        await persistAndApply(next);
        showStatus(statusFor(next));
      } catch (err) {
        showStatus(err && err.message ? err.message : String(err), false);
      }
    });

    resetBtn?.addEventListener('click', async () => {
      try {
        const d = window.NATIVE_TITLEBAR_DEFAULTS || native;
        const next = {
          display: d.display || 'show',
          variant: d.variant || 'classic',
        };
        await persistAndApply(next);
        const disp = form.querySelector(`input[name="display"][value="${next.display}"]`);
        if (disp) disp.checked = true;
        const radio = form.querySelector(`input[name="variant"][value="${next.variant}"]`);
        if (radio) radio.checked = true;
        syncSelectedClass();
        showStatus('Reset ke native (Show + classic).');
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
