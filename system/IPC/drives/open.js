/** Isu: buka path OS → window.openOsPath (.lnk / exe via shell / Start-Process) */
import { nx, need } from './util.js';

export async function openOsPath(pathOrOpts, opts) {
  const n = nx();
  if (n?.openOsPath) return n.openOsPath(pathOrOpts, opts);
  const api = typeof window !== 'undefined' ? window.electronAPI : null;
  if (api?.openOsPath) {
    const payload =
      typeof pathOrOpts === 'string'
        ? { path: pathOrOpts, ...(opts && typeof opts === 'object' ? opts : {}) }
        : { ...(pathOrOpts || {}), ...(opts && typeof opts === 'object' ? opts : {}) };
    const res = await api.openOsPath(payload);
    if (!res?.ok) throw new Error(res?.error || 'openOsPath gagal');
    return {
      path: res.path,
      method: res.method,
      source: res.source,
    };
  }
  return need(n?.openOsPath, 'openOsPath')(pathOrOpts, opts);
}
