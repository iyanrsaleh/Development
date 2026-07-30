/**
 * Form pengaturan File Manager (package/drives).
 * Logic/prefs: system/utilities/drivesPrefs.js (window.*).
 */
const FOLDER_BASE = '/templates/distro/Development/assets/folder';

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

export async function drives(page, route) {
  route.register(page, async (routeName, container, routeMeta = {
    title: 'Files | Settings',
    description: 'Warna folder, view default, dan opsi File Manager.',
  }, style, nav = {}) => {
    route.routeMetaByRoute.set(page, routeMeta);

    const native = window.NATIVE_DRIVES_DEFAULTS || {
      folderColor: 'orange',
      view: 'grid',
      includeHidden: false,
      searchRecursiveDefault: false,
    };
    const colors = Array.isArray(window.FOLDER_COLORS) && window.FOLDER_COLORS.length
      ? window.FOLDER_COLORS
      : [
        'aubergine', 'blue', 'bordeaux', 'canonical', 'cyan', 'darkblue',
        'green', 'orange', 'purple', 'red', 'vermillion', 'yellow',
      ];

    const prefs = typeof window.loadDrivesPrefs === 'function'
      ? await window.loadDrivesPrefs()
      : null;
    const merged = typeof window.mergeDrivesPrefs === 'function'
      ? window.mergeDrivesPrefs({ ...native }, prefs)
      : { ...native, ...(prefs || {}) };

    let folderColor = String(merged.folderColor || 'orange');
    let view = String(merged.view || 'grid') === 'list' ? 'list' : 'grid';
    let includeHidden = !!merged.includeHidden;
    let searchRecursiveDefault = !!merged.searchRecursiveDefault;

    const colorCards = colors.map((c) => {
      const selected = c === folderColor ? ' is-selected' : '';
      const checked = c === folderColor ? ' checked' : '';
      const src = `${FOLDER_BASE}/folder-${c}.png`;
      const label = c.charAt(0).toUpperCase() + c.slice(1);
      return (
        `<label class="nx-drives-color__option${selected}" data-color="${escapeAttr(c)}">` +
        `<input type="radio" name="folderColor" value="${escapeAttr(c)}"${checked} />` +
        `<img class="nx-drives-color__thumb" src="${escapeAttr(src)}" alt="" draggable="false" />` +
        `<span class="nx-drives-color__label">${escapeHtml(label)}</span>` +
        `</label>`
      );
    }).join('');

    container.innerHTML = `
      <div class="ubuntu-workbench">
        <article class="card">
          <h1 class="title-2">Files</h1>
          <p class="body">
            Preferensi File Manager — warna ikon folder (Yaru), tampilan default, dan file tersembunyi.
            Perubahan langsung diterapkan jika jendela Files sedang terbuka.
          </p>

          <form id="nx-drives-prefs-form">
            <div class="card" style="margin-top:1rem">
              <p class="heading">Warna folder</p>
              <p class="caption">Palette dari <span class="monospace">assets/folder</span> (folder-{color}.png).</p>
              <div class="nx-drives-color" id="nx-drives-color" role="radiogroup" aria-label="Folder color">
                ${colorCards}
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem">
              <div class="card">
                <p class="heading">View default</p>
                <label class="checkbox" style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0">
                  <input type="radio" name="view" value="grid"${view === 'grid' ? ' checked' : ''} />
                  <span>Grid</span>
                </label>
                <label class="checkbox" style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0">
                  <input type="radio" name="view" value="list"${view === 'list' ? ' checked' : ''} />
                  <span>List</span>
                </label>
              </div>
              <div class="card">
                <p class="heading">Opsi</p>
                <label class="checkbox" style="display:flex;align-items:flex-start;gap:0.5rem;padding:0.4rem 0">
                  <input type="checkbox" name="includeHidden" id="nx-drives-hidden"${includeHidden ? ' checked' : ''} style="margin-top:0.2rem" />
                  <span>
                    <strong>Tampilkan file tersembunyi</strong>
                    <br /><span class="caption">Nama diawali titik (non-Windows).</span>
                  </span>
                </label>
                <label class="checkbox" style="display:flex;align-items:flex-start;gap:0.5rem;padding:0.4rem 0">
                  <input type="checkbox" name="searchRecursiveDefault" id="nx-drives-search-rec"${searchRecursiveDefault ? ' checked' : ''} style="margin-top:0.2rem" />
                  <span>
                    <strong>Search Subfolders default</strong>
                    <br /><span class="caption">Mode rekursif aktif saat buka Files.</span>
                  </span>
                </label>
              </div>
            </div>

            <div style="display:flex;gap:0.75rem;align-items:center;margin-top:1.25rem;flex-wrap:wrap">
              <button type="submit" class="suggested-action">Simpan</button>
              <button type="button" class="flat" id="nx-drives-prefs-reset">Reset ke default</button>
              <span class="caption" id="nx-drives-prefs-status" aria-live="polite"></span>
            </div>
          </form>
        </article>
      </div>
    `;

    const form = container.querySelector('#nx-drives-prefs-form');
    const statusEl = container.querySelector('#nx-drives-prefs-status');
    const resetBtn = container.querySelector('#nx-drives-prefs-reset');
    const colorHost = container.querySelector('#nx-drives-color');

    const showStatus = (msg, ok = true) => {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.style.color = ok ? '' : 'var(--error-color, #c01c28)';
    };

    const syncColorSelection = (color) => {
      folderColor = color;
      colorHost?.querySelectorAll('.nx-drives-color__option').forEach((el) => {
        const c = el.getAttribute('data-color') || '';
        el.classList.toggle('is-selected', c === color);
        const input = el.querySelector('input[type="radio"]');
        if (input) input.checked = c === color;
      });
    };

    const readForm = () => {
      const fd = new FormData(form);
      return {
        folderColor: String(fd.get('folderColor') || folderColor || 'orange'),
        view: String(fd.get('view') || 'grid') === 'list' ? 'list' : 'grid',
        includeHidden: !!form.querySelector('[name="includeHidden"]')?.checked,
        searchRecursiveDefault: !!form.querySelector('[name="searchRecursiveDefault"]')?.checked,
      };
    };

    const applyAndRefresh = async (payload) => {
      if (typeof window.saveDrivesPrefs !== 'function') {
        throw new Error('window.saveDrivesPrefs belum siap');
      }
      const row = await window.saveDrivesPrefs(payload);
      if (typeof window.applyDrivesPrefs === 'function') {
        await window.applyDrivesPrefs(row);
      }
      return row;
    };

    colorHost?.addEventListener('change', async (e) => {
      const input = e.target.closest?.('input[name="folderColor"]');
      if (!input) return;
      syncColorSelection(input.value);
      try {
        await applyAndRefresh(readForm());
        showStatus('Warna folder diterapkan.');
      } catch (err) {
        showStatus(err && err.message ? err.message : String(err), false);
      }
    });

    let liveTimer = 0;
    const scheduleLive = () => {
      clearTimeout(liveTimer);
      liveTimer = setTimeout(async () => {
        try {
          await applyAndRefresh(readForm());
        } catch (_) { /* diam */ }
      }, 150);
    };
    form?.querySelectorAll('input[name="view"], input[name="includeHidden"], input[name="searchRecursiveDefault"]').forEach((el) => {
      el.addEventListener('change', scheduleLive);
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await applyAndRefresh(readForm());
        showStatus('Tersimpan.');
      } catch (err) {
        showStatus(err && err.message ? err.message : String(err), false);
      }
    });

    resetBtn?.addEventListener('click', async () => {
      try {
        const d = window.NATIVE_DRIVES_DEFAULTS || native;
        await applyAndRefresh({ ...d });
        syncColorSelection(d.folderColor || 'orange');
        const grid = form.querySelector('input[name="view"][value="grid"]');
        const list = form.querySelector('input[name="view"][value="list"]');
        if (grid && list) {
          grid.checked = (d.view || 'grid') !== 'list';
          list.checked = (d.view || 'grid') === 'list';
        }
        const hid = form.querySelector('[name="includeHidden"]');
        const rec = form.querySelector('[name="searchRecursiveDefault"]');
        if (hid) hid.checked = !!d.includeHidden;
        if (rec) rec.checked = !!d.searchRecursiveDefault;
        showStatus('Direset ke default.');
      } catch (err) {
        showStatus(err && err.message ? err.message : String(err), false);
      }
    });
  });
}
