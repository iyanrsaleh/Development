/** Isu: Baca file → window.readFile */
import { nx, need } from './util.js';

export async function readFile(pathOrOpts, opts) {
  return need(nx()?.readFile, 'readFile')(pathOrOpts, opts);
}
