// Target "nx-file-viewer-editor" / "nx-file-viewer-editor::<hash>" —
// area editor CodeMirror (system/directory/editor.js). Directory package
// memakai id STATIS; File Manager OS memakai id unik per path (multi-window).
//
// Nama file/fungsi BEBAS — index.js (REGISTRY) men-deklarasikan eksplisit
// modul+fungsi mana yang menangani id ini.
import { saveActiveEditorFile } from '../directory/editor.js';

export function nxFileViewerEditor(targetId, helpers) {
  return [
    {
      label: 'Save',
      // editorId = targetId supaya Save menyimpan jendela yang diklik-kanan,
      // bukan editor lain yang kebetulan last-focused.
      click: () => helpers.sendAction('nxSaveActiveFile', { editorId: targetId }),
    },
    { type: 'separator' },
    { role: 'undo', label: 'Undo' },
    { role: 'redo', label: 'Redo' },
    { type: 'separator' },
    { role: 'cut', label: 'Cut' },
    { role: 'copy', label: 'Copy' },
    { role: 'paste', label: 'Paste' },
    { role: 'selectAll', label: 'Select All' },
  ];
}

export async function nxSaveActiveFile(payload) {
  await saveActiveEditorFile(payload?.editorId);
  return { success: true };
}
