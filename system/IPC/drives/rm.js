/** Isu: Hapus path → window.rm */
import { nx, need } from './util.js';

export async function rm(pathOrOpts, opts) {
  return need(nx()?.rm, 'rm')(pathOrOpts, opts);
}
