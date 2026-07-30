/** Isu: Recycle Bin → window.emptyRecycleBin / restore / permanentlyDelete */
import { nx, need } from './util.js';

export async function emptyRecycleBin() {
  return need(nx()?.emptyRecycleBin, 'emptyRecycleBin')();
}

export async function restoreRecycleItems(pathsOrOpts) {
  return need(nx()?.restoreRecycleItems, 'restoreRecycleItems')(pathsOrOpts);
}

export async function permanentlyDeleteRecycleItems(pathsOrOpts) {
  return need(
    nx()?.permanentlyDeleteRecycleItems,
    'permanentlyDeleteRecycleItems',
  )(pathsOrOpts);
}
