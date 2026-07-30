/** Isu: Buat folder → window.mkdir */
import { nx, need } from './util.js';

export async function mkdir(pathOrOpts, opts) {
  return need(nx()?.mkdir, 'mkdir')(pathOrOpts, opts);
}
