/** Isu: ikon file OS → window.getOsFileIcon */
import { nx, need } from './util.js';

export async function getOsFileIcon(pathOrOpts, opts) {
  const n = nx();
  if (n?.getFileIcon) return n.getFileIcon(pathOrOpts, opts);
  const api = typeof window !== 'undefined' ? window.electronAPI : null;
  if (api?.getOsFileIcon) {
    const payload =
      typeof pathOrOpts === 'string'
        ? { path: pathOrOpts, ...(opts && typeof opts === 'object' ? opts : {}) }
        : { ...(pathOrOpts || {}), ...(opts && typeof opts === 'object' ? opts : {}) };
    const res = await api.getOsFileIcon(payload);
    if (!res?.ok) throw new Error(res?.error || 'getOsFileIcon gagal');
    return {
      path: res.path,
      source: res.source,
      dataUrl: String(res.dataUrl || ''),
      width: Number(res.width) || 0,
      height: Number(res.height) || 0,
    };
  }
  return need(n?.getFileIcon, 'getFileIcon')(pathOrOpts, opts);
}
