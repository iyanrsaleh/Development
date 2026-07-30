/** Isu: Rename / pindah → window.rename / move */
import { nx, need } from './util.js';

export async function rename(from, to) {
  return need(nx()?.rename, 'rename')(from, to);
}

export async function move(from, to) {
  const n = nx();
  if (n?.move) return n.move(from, to);
  return rename(from, to);
}
