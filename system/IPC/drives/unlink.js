/** Isu: Hapus file → window.unlink */
import { nx, need } from './util.js';

export async function unlink(pathOrOpts) {
  return need(nx()?.unlink, 'unlink')(pathOrOpts);
}
