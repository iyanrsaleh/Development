/** Isu: Watch → window.watch / unwatch */
import { nx, need } from './util.js';

export async function watch(pathOrOpts, onEventOrOpts, maybeOnEvent) {
  return need(nx()?.watch, 'watch')(pathOrOpts, onEventOrOpts, maybeOnEvent);
}

export async function unwatch(watchIdOrOpts) {
  return need(nx()?.unwatch, 'unwatch')(watchIdOrOpts);
}
