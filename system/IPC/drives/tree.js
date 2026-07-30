/** Isu: File Tree → window.listDir / statPath / pathExists / searchDir */
import { nx, need } from './util.js';

export async function listDir(pathOrOpts, opts) {
  return need(nx()?.listDir, 'listDir')(pathOrOpts, opts);
}

export async function statPath(pathOrOpts) {
  return need(nx()?.stat, 'stat')(pathOrOpts);
}

export async function pathExists(pathOrOpts) {
  return need(nx()?.exists, 'exists')(pathOrOpts);
}

export async function searchDir(pathOrOpts, opts) {
  return need(nx()?.searchDir, 'searchDir')(pathOrOpts, opts);
}
