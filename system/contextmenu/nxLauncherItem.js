// Target DINAMIS untuk item launcher (system/shortcut/index.js).
// Tiap tile punya id="nxlauncher::<id-encoded>" — SATU modul ini menangani
// semua lewat decode targetId + match() di REGISTRY (bukan satu entry per
// shortcut). Pola sama nxDirectoryEntry / nxfile:: — lihat README.md §7a.
//
// Rename: INLINE di judul tile (input di tempat), BUKAN dialog/prompt —
// Electron tidak mendukung window.prompt, dan UX launcher desktop biasanya
// rename di tempat. Persist: window.updateLauncherShortcut → DistroBuckets.

const PREFIX = 'nxlauncher::';

function decodeLauncherId(targetId) {
  if (typeof targetId === 'string' && targetId.startsWith(PREFIX)) {
    try {
      return decodeURIComponent(targetId.slice(PREFIX.length));
    } catch {
      return targetId.slice(PREFIX.length);
    }
  }
  return null;
}

function tileEl(id) {
  return document.getElementById(PREFIX + encodeURIComponent(id));
}

function restoreTitleSpan(text) {
  const span = document.createElement('span');
  span.className = 'nx-launcher__title';
  span.textContent = text;
  return span;
}

/**
 * Mulai rename inline pada judul tile. Enter/blur = simpan, Escape = batal.
 * payload: { id } dari sendAction saat menu dibangun.
 */
export async function runRenameLauncherShortcut({ id } = {}) {
  const key = String(id || '').trim();
  if (!key) return { success: false, message: 'id shortcut kosong' };
  if (typeof window.updateLauncherShortcut !== 'function') {
    return { success: false, message: 'updateLauncherShortcut belum siap' };
  }

  const el = tileEl(key);
  if (!el) return { success: false, message: 'tile shortcut tidak ditemukan' };

  const existing = el.querySelector('.nx-launcher__rename');
  if (existing) {
    existing.focus();
    existing.select();
    return { success: true, already: true };
  }

  const titleEl = el.querySelector('.nx-launcher__title');
  if (!titleEl) return { success: false, message: 'judul tile tidak ditemukan' };

  const oldTitle = (titleEl.textContent || key).trim() || key;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'nx-launcher__rename';
  input.value = oldTitle;
  input.setAttribute('aria-label', 'Nama shortcut');
  input.autocomplete = 'off';
  input.spellcheck = false;

  el.classList.add('nx-launcher__item--renaming');
  titleEl.replaceWith(input);

  const blockNav = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  el.addEventListener('click', blockNav, true);

  return new Promise((resolve) => {
    let done = false;

    const finish = async (commit) => {
      if (done) return;
      done = true;
      el.removeEventListener('click', blockNav, true);
      input.removeEventListener('keydown', onKey);
      input.removeEventListener('blur', onBlur);

      const next = String(input.value || '').trim();
      const keep = commit && next && next !== oldTitle ? next : oldTitle;

      el.classList.remove('nx-launcher__item--renaming');
      if (input.parentNode) input.replaceWith(restoreTitleSpan(keep));
      if (keep !== oldTitle) {
        el.setAttribute('title', keep);
        if (el.hasAttribute('data-tooltip')) {
          el.setAttribute('data-tooltip', keep);
        }
        el.setAttribute('aria-label', keep);
      }

      if (!commit || !next || next === oldTitle) {
        resolve({ success: true, cancelled: !commit, unchanged: commit && next === oldTitle });
        return;
      }

      try {
        await window.updateLauncherShortcut(key, { title: next });
        if (typeof window.refreshShortcutLauncher === 'function') {
          await window.refreshShortcutLauncher();
        }
        resolve({ success: true, id: key, title: next });
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        window.alert('Gagal rename shortcut: ' + msg);
        // Kembalikan judul lama di DOM kalau refresh gagal / belum jalan
        const again = tileEl(key);
        const t = again && again.querySelector('.nx-launcher__title');
        if (t) t.textContent = oldTitle;
        resolve({ success: false, error: msg });
      }
    };

    const onKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        finish(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        finish(false);
      }
    };
    const onBlur = () => {
      finish(true);
    };

    input.addEventListener('keydown', onKey);
    input.addEventListener('blur', onBlur);
    requestAnimationFrame(() => {
      input.focus();
      input.select();
    });
  });
}

/**
 * Dipanggil dari system/contextmenu/index.js (REGISTRY match nxlauncher::*).
 * @param {string} targetId
 * @param {object} helpers sendAction / icon
 */
export function nxLauncherItem(targetId, helpers) {
  const id = decodeLauncherId(targetId);
  if (!id) return null;

  return [
    {
      label: 'Rename',
      click: () => helpers.sendAction('runRenameLauncherShortcut', { id }),
    },
    { type: 'separator' },
  ];
}
