/**
 * Form pengaturan wallpaper NXHOME (path/URL + riwayat thumbnail).
 * Style: assets/components (Ubuntu workbench).
 * Default native: NATIVE_WALLPAPER_DEFAULTS (system/utilities/wallpaper).
 */
export async function wallpaper(page, route) {
  route.register(page, async (routeName, container, routeMeta = {
    title: "Wallpaper | Settings",
    description: "Pengaturan gambar, fit, posisi, blur, opacity, dan riwayat path/URL.",
  }, style, nav = {}) => {
    route.routeMetaByRoute.set(page, routeMeta);

    const native = window.NATIVE_WALLPAPER_DEFAULTS || {
      image: '',
      fit: 'cover',
      position: 'center',
      blur: 0,
      opacity: 1,
      color: '#2c2c2c',
      history: [],
    };
    const prefs = typeof window.loadWallpaperPrefs === 'function'
      ? await window.loadWallpaperPrefs()
      : null;
    const merged = typeof window.mergeWallpaperPrefs === 'function'
      ? window.mergeWallpaperPrefs({ ...native }, prefs)
      : { ...native, ...(prefs || {}) };

    const image = String(merged.image || '');
    const displayImage = image.startsWith('data:') ? '' : image;
    const fit = String(merged.fit || 'cover');
    const position = String(merged.position || 'center');
    const blur = Number(merged.blur) || 0;
    const opacity = Number(merged.opacity);
    const opacityVal = Number.isFinite(opacity) ? opacity : 1;
    const color = String(merged.color || '#2c2c2c');
    let history = Array.isArray(merged.history) ? merged.history.slice() : [];

    const fitOptions = [
      { value: 'cover', label: 'Cover' },
      { value: 'contain', label: 'Contain' },
      { value: 'fill', label: 'Fill' },
      { value: 'none', label: 'None (ukuran asli)' },
    ];

    const historyHtml = (list) => {
      if (!list.length) {
        return '<p class="caption" style="margin:0">Belum ada riwayat. Simpan path/URL untuk menambah thumbnail.</p>';
      }
      return list.map((src) => {
        const short = src.length > 42 ? `…${src.slice(-40)}` : src;
        const safeUrl = String(src).replace(/\\/g, '/').replace(/'/g, '%27').replace(/"/g, '%22');
        return (
          `<div class="nx-wallpaper-history__item" data-image="${escapeAttr(src)}">` +
          `<button type="button" class="nx-wallpaper-history__btn" data-image="${escapeAttr(src)}" title="${escapeAttr(src)}">` +
          `<span class="nx-wallpaper-history__thumb" style="background-image:url('${safeUrl}')"></span>` +
          `<span class="nx-wallpaper-history__label">${escapeHtml(short)}</span>` +
          `</button>` +
          `<button type="button" class="nx-wallpaper-history__remove" data-image="${escapeAttr(src)}" aria-label="Hapus dari riwayat" title="Hapus dari riwayat">` +
          `<i class="icon-ic_fluent_dismiss_16_regular" aria-hidden="true"></i>` +
          `</button>` +
          `</div>`
        );
      }).join('');
    };

    container.innerHTML = `
      <div class="ubuntu-workbench">
        <article class="card">
          <h1 class="title-2">Wallpaper</h1>
          <p class="body">
            Gambar lewat path atau URL. Kosongkan image untuk warna solid saja.
            Perubahan langsung diterapkan di NXHOME (layer di belakang konten).
          </p>

          <form id="nx-wallpaper-prefs-form">
            <div class="card" style="margin-top:1rem">
              <p class="heading">Image path / URL</p>
              <input
                type="text"
                class="entry"
                name="image"
                id="nx-wallpaper-image"
                placeholder="/distro/Development/assets/… atau https://…"
                value="${escapeAttr(displayImage)}"
                style="width:100%"
              />
              <p class="caption" style="margin-top:0.35rem">
                Relatif ke origin app, atau URL absolut / <span class="monospace">file://</span>.
              </p>

              <p class="heading" style="margin-top:1rem">Riwayat</p>
              <p class="caption">Klik thumbnail untuk memakai ulang. Tombol × menghapus dari riwayat.</p>
              <div id="nx-wallpaper-history" class="nx-wallpaper-history">
                ${historyHtml(history)}
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem">
              <div class="card">
                <p class="heading">Fit</p>
                <select name="fit" id="nx-wallpaper-fit" class="select" style="width:100%">
                  ${fitOptions.map((o) => (
                    `<option value="${o.value}"${o.value === fit ? ' selected' : ''}>${o.label}</option>`
                  )).join('')}
                </select>
              </div>
              <div class="card">
                <p class="heading">Position</p>
                <input
                  type="text"
                  class="entry"
                  name="position"
                  id="nx-wallpaper-position"
                  placeholder="center"
                  value="${escapeAttr(position)}"
                  style="width:100%"
                />
                <p class="caption" style="margin-top:0.35rem">
                  Mis. <span class="monospace">center</span>, <span class="monospace">top left</span>, <span class="monospace">50% 20%</span>
                </p>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-top:1rem">
              <div class="card">
                <p class="heading">Blur <span class="caption monospace" id="nx-wallpaper-blur-val">${blur}px</span></p>
                <input type="range" name="blur" id="nx-wallpaper-blur" min="0" max="20" step="1"
                  value="${escapeAttr(String(blur))}" style="width:100%" />
              </div>
              <div class="card">
                <p class="heading">Opacity <span class="caption monospace" id="nx-wallpaper-opacity-val">${opacityVal}</span></p>
                <input type="range" name="opacity" id="nx-wallpaper-opacity" min="0.1" max="1" step="0.05"
                  value="${escapeAttr(String(opacityVal))}" style="width:100%" />
              </div>
              <div class="card">
                <p class="heading">Background color</p>
                <input type="color" class="entry" name="color" id="nx-wallpaper-color"
                  value="${escapeAttr(/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#2c2c2c')}"
                  style="width:100%;min-height:2.5rem;padding:0.25rem" />
              </div>
            </div>

            <p style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:1rem">
              <button type="submit" class="button orange-action">Simpan</button>
              <button type="button" class="button" id="nx-wallpaper-prefs-reset">Reset ke native</button>
            </p>
            <p id="nx-wallpaper-prefs-status" class="caption" hidden></p>
          </form>
        </article>
      </div>
    `;

    const form = container.querySelector('#nx-wallpaper-prefs-form');
    const statusEl = container.querySelector('#nx-wallpaper-prefs-status');
    const resetBtn = container.querySelector('#nx-wallpaper-prefs-reset');
    const historyEl = container.querySelector('#nx-wallpaper-history');
    const imageInput = container.querySelector('#nx-wallpaper-image');
    const blurEl = container.querySelector('#nx-wallpaper-blur');
    const blurVal = container.querySelector('#nx-wallpaper-blur-val');
    const opacityEl = container.querySelector('#nx-wallpaper-opacity');
    const opacityValEl = container.querySelector('#nx-wallpaper-opacity-val');

    blurEl?.addEventListener('input', () => {
      if (blurVal) blurVal.textContent = `${blurEl.value}px`;
    });
    opacityEl?.addEventListener('input', () => {
      if (opacityValEl) opacityValEl.textContent = opacityEl.value;
    });

    const showStatus = (msg, ok = true) => {
      if (!statusEl) return;
      statusEl.hidden = false;
      statusEl.textContent = msg;
      statusEl.classList.toggle('error', !ok);
      statusEl.style.color = ok ? 'var(--success-bg-color)' : 'var(--error-bg-color)';
    };

    const renderHistory = (list) => {
      history = Array.isArray(list) ? list.slice() : [];
      if (historyEl) historyEl.innerHTML = historyHtml(history);
    };

    const readForm = () => {
      const fd = new FormData(form);
      return {
        image: String(fd.get('image') || '').trim(),
        fit: String(fd.get('fit') || 'cover'),
        position: String(fd.get('position') || 'center').trim() || 'center',
        blur: Number(fd.get('blur')),
        opacity: Number(fd.get('opacity')),
        color: String(fd.get('color') || '#2c2c2c'),
        history,
      };
    };

    const applyAndRefresh = async (prefsPayload, saveOpts = {}) => {
      if (typeof window.saveWallpaperPrefs !== 'function') {
        throw new Error('saveWallpaperPrefs belum terdaftar (system/index.js)');
      }
      const row = await window.saveWallpaperPrefs(prefsPayload, saveOpts);
      if (typeof window.refreshWallpaper === 'function') {
        await window.refreshWallpaper();
      }
      if (row && Array.isArray(row.history)) renderHistory(row.history);
      return row;
    };

    historyEl?.addEventListener('click', async (e) => {
      const removeBtn = e.target.closest('.nx-wallpaper-history__remove');
      if (removeBtn) {
        e.preventDefault();
        e.stopPropagation();
        const src = removeBtn.getAttribute('data-image') || '';
        if (!src) return;
        const nextHistory = history.filter((h) => h !== src);
        try {
          await applyAndRefresh(
            { ...readForm(), history: nextHistory },
            { replaceHistory: true },
          );
          showStatus('Dihapus dari riwayat.');
        } catch (err) {
          showStatus(err && err.message ? err.message : String(err), false);
        }
        return;
      }

      const btn = e.target.closest('.nx-wallpaper-history__btn');
      if (!btn) return;
      const src = btn.getAttribute('data-image') || '';
      if (!src || !imageInput) return;
      imageInput.value = src;
      try {
        await applyAndRefresh(readForm());
        showStatus('Dipakai ulang dari riwayat.');
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
      }, 200);
    };
    form?.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('change', scheduleLive);
      if (el.type === 'range' || el.type === 'text' || el.type === 'color') {
        el.addEventListener('input', scheduleLive);
      }
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await applyAndRefresh(readForm());
        showStatus('Tersimpan — wallpaper & riwayat diperbarui.');
      } catch (err) {
        showStatus(err && err.message ? err.message : String(err), false);
      }
    });

    resetBtn?.addEventListener('click', async () => {
      try {
        const d = window.NATIVE_WALLPAPER_DEFAULTS || native;
        await applyAndRefresh({
          ...d,
          history, // pertahankan riwayat saat reset tampilan
        });
        const img = form.querySelector('[name="image"]');
        const fitSel = form.querySelector('[name="fit"]');
        const pos = form.querySelector('[name="position"]');
        const bl = form.querySelector('[name="blur"]');
        const op = form.querySelector('[name="opacity"]');
        const col = form.querySelector('[name="color"]');
        if (img) img.value = d.image || '';
        if (fitSel) fitSel.value = d.fit || 'cover';
        if (pos) pos.value = d.position || 'center';
        if (bl) {
          bl.value = String(d.blur ?? 0);
          if (blurVal) blurVal.textContent = `${bl.value}px`;
        }
        if (op) {
          op.value = String(d.opacity ?? 1);
          if (opacityValEl) opacityValEl.textContent = op.value;
        }
        if (col) col.value = d.color || '#2c2c2c';
        showStatus('Direset ke default native (riwayat tetap).');
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
