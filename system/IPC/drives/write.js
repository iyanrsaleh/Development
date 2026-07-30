/** Isu: Tulis / edit → window.writeFile / editFile / appendFile */
import { nx, need } from './util.js';

export async function writeFile(filePathOrOpts, content, opts) {
  return need(nx()?.writeFile, 'writeFile')(filePathOrOpts, content, opts);
}

export async function editFile(filePathOrOpts, content, opts) {
  const n = nx();
  if (n?.editFile) return n.editFile(filePathOrOpts, content, opts);
  return writeFile(filePathOrOpts, content, opts);
}

export async function appendFile(filePathOrOpts, content, opts) {
  return need(nx()?.appendFile, 'appendFile')(filePathOrOpts, content, opts);
}
