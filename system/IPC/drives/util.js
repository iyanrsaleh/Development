/** Thin wrapper helpers — system/IPC/drives */
export function nx() {
  return typeof window !== 'undefined' ? window.NxDrives : null;
}

export function need(fn, name) {
  if (!fn) {
    throw new Error(`${name}: NxDrives.${name} belum siap (Electron + nxdom)`);
  }
  return fn;
}
