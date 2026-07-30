/**
 * Form pengaturan launcher (dock).
 * Style: assets/components (Ubuntu workbench) — lihat _README.md.
 * Default native: NATIVE_LAUNCHER_DEFAULTS (system/shortcut).
 */
export async function launcher(page, route) {
  route.register(page, async (routeName, container, routeMeta = {
    title: "Launcher | Settings",
    description: "Pengaturan posisi, ukuran ikon, label/tooltip, dan item tersembunyi launcher.",
  }, style, nav = {}) => {
    route.routeMetaByRoute.set(page, routeMeta);

    const native = window.NATIVE_LAUNCHER_DEFAULTS || {
      disabled: ['directory'],
      settings: { position: 'left', iconSize: '35px', labelStyle: 'auto', labelMode: 'both' },
    };
    const prefs = typeof window.loadLauncherPrefs === 'function'
      ? await window.loadLauncherPrefs()
      : null;
    const merged = typeof window.mergeLauncherOpts === 'function'
      ? window.mergeLauncherOpts({ ...native }, prefs)
      : { ...native, ...(prefs || {}) };

    const position = (merged.settings && merged.settings.position) || 'left';
    const iconSize = (merged.settings && merged.settings.iconSize) || '35px';
    const labelStyle = (merged.settings && merged.settings.labelStyle) || 'auto';
    const labelMode = (merged.settings && merged.settings.labelMode) || 'both';
    const disabledSet = new Set(
      Array.isArray(merged.disabled) ? merged.disabled.map(String) : [],
    );

    let catalog = [];
    try {
      catalog = typeof window.getDistroShortcuts === 'function'
        ? await window.getDistroShortcuts()
        : (window.DistroShortcuts || []);
    } catch (_) {
      catalog = [];
    }
    if (!Array.isArray(catalog)) catalog = [];

    const sizeOptions = ['24px', '28px', '32px', '35px', '40px', '48px', '56px'];
    if (!sizeOptions.includes(iconSize)) sizeOptions.unshift(iconSize);

    const posOptions = [
      { value: 'left', label: 'Kiri' },
      { value: 'right', label: 'Kanan' },
      { value: 'top', label: 'Atas' },
      { value: 'bottom', label: 'Bawah' },
    ];

    const labelOptions = [
      { value: 'auto', label: 'Otomatis (baca wallpaper)' },
      { value: 'light', label: 'Terang (+ bayangan)' },
      { value: 'dark', label: 'Gelap (+ bayangan)' },
    ];

    const modeOptions = [
      { value: 'both', label: 'Label + Tooltip' },
      { value: 'tooltip', label: 'Tooltip saja' },
      { value: 'hidden', label: 'Sembunyikan nama' },
    ];

    const disabledRows = catalog.length
      ? catalog.map((s) => {
        const id = String(s.id || '');
        const title = String(s.title || id).trim() || id;
        const checked = disabledSet.has(id) ? ' checked' : '';
        return (
          `<label class="checkbox" style="padding:0.65rem 0.75rem">` +
          `<input type="checkbox" name="disabled" value="${escapeAttr(id)}"${checked} />` +
          `<span>${escapeHtml(title)}</span>` +
          `</label>`
        );
      }).join('')
      : '<p class="body" style="padding:0.75rem">Catalog kosong (manifest / DistroShortcuts).</p>';

    container.innerHTML = `
      <div class="ubuntu-workbench">
        <article class="card">
          <h1 class="title-2">Launcher</h1>
          <p class="body">
            Default native: posisi <span class="monospace">left</span>,
            ikon <span class="monospace">35px</span>,
            label <span class="monospace">auto</span>,
            mode <span class="monospace">both</span>,
            sembunyikan <span class="monospace">directory</span>.
            Perubahan langsung diterapkan ke dock di NXHOME.
          </p>

          <form id="nx-launcher-prefs-form">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem">
              <div class="card">
                <p class="heading">Posisi dock</p>
                <select name="position" id="nx-launcher-pos" class="select" style="width:100%">
                  ${posOptions.map((o) => (
                    `<option value="${o.value}"${o.value === position ? ' selected' : ''}>${o.label}</option>`
                  )).join('')}
                </select>
              </div>
              <div class="card">
                <p class="heading">Ukuran ikon</p>
                <select name="iconSize" id="nx-launcher-size" class="select" style="width:100%">
                  ${sizeOptions.map((sz) => (
                    `<option value="${escapeAttr(sz)}"${sz === iconSize ? ' selected' : ''}>${escapeHtml(sz)}</option>`
                  )).join('')}
                </select>
              </div>
              <div class="card">
                <p class="heading">Mode nama</p>
                <select name="labelMode" id="nx-launcher-label-mode" class="select" style="width:100%">
                  ${modeOptions.map((o) => (
                    `<option value="${o.value}"${o.value === labelMode ? ' selected' : ''}>${o.label}</option>`
                  )).join('')}
                </select>
                <p class="caption" style="margin-top:0.35rem">
                  Tooltip memakai gaya components (<span class="monospace">data-tooltip</span>).
                </p>
              </div>
              <div class="card">
                <p class="heading">Warna label</p>
                <select name="labelStyle" id="nx-launcher-label" class="select" style="width:100%">
                  ${labelOptions.map((o) => (
                    `<option value="${o.value}"${o.value === labelStyle ? ' selected' : ''}>${o.label}</option>`
                  )).join('')}
                </select>
                <p class="caption" style="margin-top:0.35rem">Untuk mode tampilkan label di atas wallpaper.</p>
              </div>
            </div>

            <div class="card" style="margin-top:1rem">
              <p class="heading">Sembunyikan dari launcher</p>
              <p class="caption">Centang = tidak tampil di dock (<span class="monospace">disabled</span>).</p>
              <div class="boxed-list nx-scroll" style="max-height:14rem;margin-top:0.75rem">
                ${disabledRows}
              </div>
            </div>

            <p style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:1rem">
              <button type="submit" class="button orange-action">Simpan</button>
              <button type="button" class="button" id="nx-launcher-prefs-reset">Reset ke native</button>
            </p>
            <p id="nx-launcher-prefs-status" class="caption" hidden></p>
          </form>
        </article>
      </div>
    `;

    const form = container.querySelector('#nx-launcher-prefs-form');
    const statusEl = container.querySelector('#nx-launcher-prefs-status');
    const resetBtn = container.querySelector('#nx-launcher-prefs-reset');

    const showStatus = (msg, ok = true) => {
      if (!statusEl) return;
      statusEl.hidden = false;
      statusEl.textContent = msg;
      statusEl.classList.toggle('error', !ok);
      statusEl.style.color = ok ? 'var(--success-bg-color)' : 'var(--error-bg-color)';
    };

    const readSettingsFromForm = () => {
      const fd = new FormData(form);
      return {
        position: String(fd.get('position') || 'left'),
        iconSize: String(fd.get('iconSize') || '35px'),
        labelStyle: String(fd.get('labelStyle') || 'auto'),
        labelMode: String(fd.get('labelMode') || 'both'),
      };
    };

    const applyAndRefresh = async (prefsPayload) => {
      if (typeof window.saveLauncherPrefs !== 'function') {
        throw new Error('saveLauncherPrefs belum terdaftar (system/index.js)');
      }
      await window.saveLauncherPrefs(prefsPayload);
      if (typeof window.refreshShortcutLauncher === 'function') {
        await window.refreshShortcutLauncher();
      }
    };

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const settings = readSettingsFromForm();
      const disabled = new FormData(form).getAll('disabled').map((v) => String(v));
      try {
        await applyAndRefresh({ disabled, settings });
        showStatus(
          settings.labelMode === 'tooltip'
            ? 'Tersimpan — nama item lewat tooltip.'
            : settings.labelMode === 'both'
              ? 'Tersimpan — label + tooltip.'
              : settings.labelMode === 'hidden'
                ? 'Tersimpan — nama disembunyikan.'
                : 'Tersimpan — dock diperbarui.',
        );
      } catch (err) {
        showStatus(err && err.message ? err.message : String(err), false);
      }
    });

    // Langsung terapkan saat ganti mode/posisi (UX mirip title bar)
    form?.addEventListener('change', async (e) => {
      const t = e.target;
      if (!t || !['position', 'iconSize', 'labelStyle', 'labelMode'].includes(t.name)) return;
      const settings = readSettingsFromForm();
      const disabled = new FormData(form).getAll('disabled').map((v) => String(v));
      try {
        await applyAndRefresh({ disabled, settings });
        showStatus('Diterapkan.');
      } catch (err) {
        showStatus(err && err.message ? err.message : String(err), false);
      }
    });

    resetBtn?.addEventListener('click', async () => {
      try {
        const d = window.NATIVE_LAUNCHER_DEFAULTS || native;
        const settings = {
          position: (d.settings && d.settings.position) || 'left',
          iconSize: (d.settings && d.settings.iconSize) || '35px',
          labelStyle: (d.settings && d.settings.labelStyle) || 'auto',
          labelMode: (d.settings && d.settings.labelMode) || 'both',
        };
        await applyAndRefresh({
          disabled: (d.disabled || ['directory']).slice(),
          settings,
        });
        const posSel = form.querySelector('[name="position"]');
        const sizeSel = form.querySelector('[name="iconSize"]');
        const labelSel = form.querySelector('[name="labelStyle"]');
        const modeSel = form.querySelector('[name="labelMode"]');
        if (posSel) posSel.value = settings.position;
        if (sizeSel) sizeSel.value = settings.iconSize;
        if (labelSel) labelSel.value = settings.labelStyle;
        if (modeSel) modeSel.value = settings.labelMode;
        const nativeDisabled = new Set(d.disabled || ['directory']);
        form.querySelectorAll('input[name="disabled"]').forEach((el) => {
          el.checked = nativeDisabled.has(el.value);
        });
        showStatus('Direset ke default native.');
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
