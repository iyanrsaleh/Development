/** Isu: folder khusus user → window.listUserPlaces */
import { nx, need } from './util.js';

export async function listUserPlaces() {
  const n = nx();
  if (n?.listUserPlaces) return n.listUserPlaces();
  const api = typeof window !== 'undefined' ? window.electronAPI : null;
  if (api?.listUserPlaces) {
    const res = await api.listUserPlaces();
    if (!res?.ok) throw new Error(res?.error || 'listUserPlaces gagal');
    return Array.isArray(res.places) ? res.places : [];
  }
  throw new Error(
    'listUserPlaces: NxDrives / electronAPI.listUserPlaces belum siap',
  );
}
