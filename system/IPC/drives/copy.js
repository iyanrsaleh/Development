/** Isu: Copy → window.copy */
import { nx, need } from './util.js';

export async function copy(from, to, opts) {
  return need(nx()?.copy, 'copy')(from, to, opts);
}
