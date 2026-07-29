// Pengganti window.prompt() — Electron renderer: "prompt() is and will not
// be supported." Dipakai aksi context-menu yang butuh input teks (rename
// launcher, rename/new file directory, dll).
//
// API mirip prompt: resolve string (OK/Enter) atau null (Cancel/Escape).

/**
 * @param {string} message
 * @param {string} [defaultValue='']
 * @returns {Promise<string|null>}
 */
export function promptText(message, defaultValue = '') {
  return new Promise((resolve) => {
    const prev = document.getElementById('nx-prompt-text-overlay');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.id = 'nx-prompt-text-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2147483000',
      'display:flex', 'align-items:center', 'justify-content:center',
      'background:rgba(0,0,0,.45)', 'font-family:system-ui,sans-serif',
    ].join(';');

    const panel = document.createElement('div');
    panel.style.cssText = [
      'min-width:280px', 'max-width:min(420px,92vw)', 'padding:16px 18px',
      'border-radius:8px', 'background:#fff', 'color:#111',
      'box-shadow:0 12px 40px rgba(0,0,0,.25)',
    ].join(';');

    const label = document.createElement('label');
    label.style.cssText = 'display:block;font-size:13px;margin-bottom:8px;';
    label.textContent = String(message || 'Masukkan nilai:');

    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue == null ? '' : String(defaultValue);
    input.style.cssText = [
      'width:100%', 'box-sizing:border-box', 'padding:8px 10px',
      'border:1px solid #ccc', 'border-radius:6px', 'font-size:14px',
      'outline:none',
    ].join(';');

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;margin-top:14px;';

    const btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.textContent = 'Batal';
    btnCancel.style.cssText = 'padding:6px 12px;border:1px solid #ccc;border-radius:6px;background:#f5f5f5;cursor:pointer;';

    const btnOk = document.createElement('button');
    btnOk.type = 'button';
    btnOk.textContent = 'OK';
    btnOk.style.cssText = 'padding:6px 14px;border:1px solid #2563eb;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;';

    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      resolve(value);
    };

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        finish(null);
      } else if (e.key === 'Enter' && document.activeElement === input) {
        e.preventDefault();
        finish(input.value);
      }
    };

    btnCancel.addEventListener('click', () => finish(null));
    btnOk.addEventListener('click', () => finish(input.value));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) finish(null);
    });
    document.addEventListener('keydown', onKey, true);

    row.append(btnCancel, btnOk);
    panel.append(label, input, row);
    overlay.append(panel);
    document.body.append(overlay);
    requestAnimationFrame(() => {
      input.focus();
      input.select();
    });
  });
}
