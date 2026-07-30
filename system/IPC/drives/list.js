/** Isu: list logical drives → window.listDrives */
import { nx, need } from './util.js';

export async function listDrives() {
  const n = nx();
  if (n?.list) return n.list();
  const api = typeof window !== 'undefined' ? window.electronAPI : null;
  if (api?.listDrives) {
    const res = await api.listDrives();
    if (!res?.ok) throw new Error(res?.error || 'listDrives gagal');
    return Array.isArray(res.drives) ? res.drives : [];
  }
  throw new Error(
    'listDrives: NxDrives / electronAPI.listDrives belum siap (Electron + nxdom)',
  );
}
