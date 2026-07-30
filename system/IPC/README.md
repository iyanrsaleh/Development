# `system/IPC/` — pintu IPC Distro

Drives/FS ada di **`drives/`** — satu isu = satu file (nama selaras electron + kernel).

```text
system/IPC/drives/{list,tree,read,write,unlink,mkdir,rm,rename,copy,watch}.js
```

`index.js` re-export dari `./drives/index.js`. Package pakai `window.*` tanpa import.
