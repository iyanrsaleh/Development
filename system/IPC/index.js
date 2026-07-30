/**
 * system/IPC — SATU pintu IPC Distro Development.
 * Drives/FS: folder ./drives/ (satu isu = satu file).
 * TIDAK ADA UI di sini.
 */

export {
  listDrives,
  listUserPlaces,
  listDir,
  statPath,
  pathExists,
  searchDir,
  getOsFileIcon,
  openOsPath,
  emptyRecycleBin,
  restoreRecycleItems,
  permanentlyDeleteRecycleItems,
  readFile,
  writeFile,
  editFile,
  appendFile,
  unlink,
  mkdir,
  rm,
  rename,
  move,
  copy,
  watch,
  unwatch,
} from './drives/index.js';
