# Ubuntu 24.04 Workbench — Component CSS

> Framework: **Libadwaita/Adwaita** style classes dengan palette Yaru (Ubuntu)
> Sumber: https://gnome.pages.gitlab.gnome.org/libadwaita/doc/main/style-classes.html

## 📁 File Structure

```
components/
├── _README.md          ← Dokumen ini
├── colors.css          ← CSS Variables (accent, ub-orange, success, warning, error, dll)
├── typography.css      ← .title-1/2/3/4, .heading, .body, .caption, .monospace
├── button.css          ← button, .suggested-action, .destructive-action, .orange-action
│                        .flat, .raised, .pill, .circular, .icon-button, .linked
├── input.css           ← input[type=*], textarea, .entry (+ sizes, states)
├── select.css          ← select (+ sizes, states, multiple)
├── checkbox.css        ← .checkbox, .switch, .radio
├── tabs.css            ← .tabs, .tab, .tabs-vertical, .accordion, .breadcrumb
├── card.css            ← .card, .boxed-list
├── table.css           ← table, .list
├── sidebar.css         ← .navigation-sidebar
├── dialog.css          ← .dialog, .toast, .progress, .spinner, [data-tooltip]
├── toolbar.css         ← .toolbar, .spacer
├── layout.css          ← .search(-input), .statusbar
├── linked.css          ← .linked (fallback — utama di button.css)
│
├── menu.css            ← .menu, .menu-item, .menu-separator, .has-submenu
├── context-menu.css    ← .context-menu, .ctx-item, .ctx-separator
├── top-bar.css         ← #top-bar (panel)
├── dock.css            ← #dock-container, .ubuntu-dock-item
│
├── avatar.css          ← .avatar (+ sizes, initials, .avatar-label)
├── badge.css           ← .badge (+ colors, sizes, outline, .badge-dot, .badge-counter)
├── file-manager.css    ← .ubuntu-fm-app (Nautilus-style file manager)
├── scrollbar.css       ← ::-webkit-scrollbar (thin, Yaru orange, dark variant)
└── slider.css          ← input[type=range], .slider-row
```

## 🎯 Style Classes — Index Cepat

| Komponen | Class |
|----------|-------|
| Button default | `button` / `.button` |
| Button accent primary (biru) | `.suggested-action` |
| Button danger | `.destructive-action` |
| Button **Ubuntu orange** | `.orange-action` |
| Button flat | `.flat` |
| Button raised | `.raised` |
| Button pill | `.pill` |
| Button circular | `.circular` |
| Icon-only button | `.icon-button` |
| Group (input+button) | `.linked` |
| Toolbar | `.toolbar` |
| Card | `.card` |
| Boxed list | `.boxed-list` |
| Sidebar | `.navigation-sidebar` |
| Tab | `.tabs > .tab.selected` |
| Tab vertical | `.tabs-vertical > .tab.selected` |
| Accordion | `.accordion > .accordion-section > .accordion-header/body` |
| Breadcrumb | `.breadcrumb > .breadcrumb-item` |
| Checkbox | `.checkbox > input[type=checkbox]` |
| Switch | `.switch > input[type=checkbox]` |
| Radio | `.radio > input[type=radio]` |
| Entry / Input | `input.entry` / `.entry` / `textarea.entry` |
| Select | `select` |
| Search | `.search > .search-input` |
| Toast | `.toast` |
| Progress bar | `.progress > .progress-bar` |
| Spinner | `.spinner` |
| Tooltip | `[data-tooltip]` |
| Popup menu | `.menu > .menu-item` |
| Context menu | `.context-menu > .ctx-item` |
| Avatar | `.avatar` (+ `.initials`, `.avatar-label`) |
| Badge | `.badge` (+ `.badge-dot`, `.badge-counter`) |
| Scrollbar | `::-webkit-scrollbar` (otomatis global, dark: `.ubuntu-dark`) |
| Slider | `input[type=range]` / `.slider-row` |
| Top bar | `#top-bar` |
| Dock | `#dock-container > #dock > .ubuntu-dock-item` |

## Font

Teks UI mengikuti `assets/style.css` saja:

- `--nx-font-sans` → Segoe UI Variable / Segoe UI
- `--nx-font-mono` → Cascadia Mono / Consolas

Di `components/*.css` pakai `var(--nx-font-sans)` / `var(--nx-font-mono)`.
**Jangan** hardcode `Ubuntu`, `Ubuntu Mono`, atau font lain.

## CSS Variables — Ubuntu 24.04 (warna)

```css
/* Dominant */
--ub-orange: #E95420

/* Accent (blue — standard HIG) */
--accent-bg-color: #3584e4
--accent-fg-color: #ffffff
--accent-color: #3584e4

/* Semantic */
--success-bg-color: #33d17a   /* Green 3 */
--warning-bg-color: #f6d32d   /* Yellow 3 */
--error-bg-color: #e01b24     /* Red 3 */

/* Window */
--window-bg-color: #f6f5f4
--window-fg-color: #241f31
--view-bg-color: #ffffff
--view-fg-color: #241f31
--border-color: #deddda
--border-radius: 6px

/* Panel/Dark */
--panel-bg: #151515
--panel-fg: #ffffff
```

## 🔧 Cara Pakai

Semua class harus discope dengan `.ubuntu-workbench`:

```html
<div class="ubuntu-workbench">
    <button class="suggested-action">Simpan</button>
    <label class="checkbox"><input type="checkbox" checked> Ingat saya</label>
    <div class="tabs">
        <div class="tab selected">Tab 1</div>
        <div class="tab">Tab 2</div>
    </div>
    <input type="text" class="entry" placeholder="Nama...">
    <span class="badge orange">Baru</span>
    <div class="avatar-label">
        <span class="avatar small initials">U</span>
        <div class="avatar-info">
            <div class="avatar-name">User</div>
        </div>
    </div>
</div>
```

Scrollbar otomatis terpasang di semua elemen dalam `.ubuntu-workbench`. Untuk dark background, tambah class `.ubuntu-dark` ke container.
