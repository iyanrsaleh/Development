/* ============================================================
   COMPONENTS — UI Component Showcase
   Class names sesuai CSS di components/
   Icons: Fluent System Icons (class icon-ic_fluent_{nama}_{ukuran}_regular — lihat templates/exsampel/fluent/FluentSystemIcons.js)
   ============================================================ */
// Render awal #nxpackage untuk package "settings".
// Wajib ada jika index.js memasang <div id="nxpackage"></div>.
export async function components(page, route) {
  route.register(page, async (routeName, container, routeMeta = {
    title: "Components | Settings",
    description: "UI component showcase (package/settings/components.js).",
  }, style, nav = {}) => {
    route.routeMetaByRoute.set(page, routeMeta);
    // Jangan bungkus dengan <template> — isi <template> tidak tampil di DOM
    // sampai di-clone; pakai innerHTML langsung seperti launcher.js.
    container.innerHTML = `
    <div class="ubuntu-workbench ubuntu-components-app components-app" style="display:flex; background:var(--window-bg-color); font-family:var(--nx-font-sans),sans-serif; color:var(--window-fg-color);">

        <!-- Sidebar navigasi — pola sama persis .ubuntu-icon-sidebar di
             template/icon.js (lihat index.css: width tetap, border-right,
             flex-shrink:0). Sticky mengikuti scroll body.nx-scroll.
             Klik item scroll ke section #cs-<slug>. -->
        <div class="ubuntu-components-sidebar" style="width:200px; flex-shrink:0; background:#fff; border-right:1px solid #ddd; padding:8px 0; position:sticky; top:0; align-self:flex-start; max-height:100%; overflow:visible;" id="components-nav">
            <div class="ubuntu-si-item" data-target="cs-typography">Typography</div>
            <div class="ubuntu-si-item" data-target="cs-buttons-style-variants">Buttons — Style Variants</div>
            <div class="ubuntu-si-item" data-target="cs-buttons-sizes">Buttons — Sizes</div>
            <div class="ubuntu-si-item" data-target="cs-buttons-icon-text">Buttons — Icon + Text</div>
            <div class="ubuntu-si-item" data-target="cs-buttons-icon-only">Buttons — Icon Only</div>
            <div class="ubuntu-si-item" data-target="cs-buttons-linked-segmented">Buttons — Linked (Segmented)</div>
            <div class="ubuntu-si-item" data-target="cs-input-entry">Input / Entry</div>
            <div class="ubuntu-si-item" data-target="cs-input-file-picker-button">Input — File Picker Button</div>
            <div class="ubuntu-si-item" data-target="cs-input-sizes-states">Input — Sizes &amp; States</div>
            <div class="ubuntu-si-item" data-target="cs-select">Select</div>
            <div class="ubuntu-si-item" data-target="cs-checkbox-switch-radio">Checkbox / Switch / Radio</div>
            <div class="ubuntu-si-item" data-target="cs-tabs-horizontal">Tabs — Horizontal</div>
            <div class="ubuntu-si-item" data-target="cs-tabs-sizes">Tabs — Sizes</div>
            <div class="ubuntu-si-item" data-target="cs-tabs-with-icon">Tabs — With Icon</div>
            <div class="ubuntu-si-item" data-target="cs-tabs-vertical">Tabs — Vertical</div>
            <div class="ubuntu-si-item" data-target="cs-accordion">Accordion</div>
            <div class="ubuntu-si-item" data-target="cs-breadcrumb">Breadcrumb</div>
            <div class="ubuntu-si-item" data-target="cs-table">Table</div>
            <div class="ubuntu-si-item" data-target="cs-list">List</div>
            <div class="ubuntu-si-item" data-target="cs-card-boxed-list">Card &amp; Boxed List</div>
            <div class="ubuntu-si-item" data-target="cs-progress">Progress</div>
            <div class="ubuntu-si-item" data-target="cs-spinner">Spinner</div>
            <div class="ubuntu-si-item" data-target="cs-toolbar">Toolbar</div>
            <div class="ubuntu-si-item" data-target="cs-search">Search</div>
            <div class="ubuntu-si-item" data-target="cs-toast">Toast</div>
            <div class="ubuntu-si-item" data-target="cs-tooltip">Tooltip</div>
            <div class="ubuntu-si-item" data-target="cs-sidebar">Sidebar</div>
            <div class="ubuntu-si-item" data-target="cs-avatar">Avatar</div>
            <div class="ubuntu-si-item" data-target="cs-scrollbar-yaru-style">Scrollbar — Yaru Style</div>
            <div class="ubuntu-si-item" data-target="cs-badge-tag">Badge / Tag</div>
            <div class="ubuntu-si-item" data-target="cs-slider">Slider</div>
            <div class="ubuntu-si-item" data-target="cs-menu-popup">Menu (Popup)</div>
            <div class="ubuntu-si-item" data-target="cs-form-inputs-primer-css-style">Form Inputs — Primer CSS Style</div>
            <div class="ubuntu-si-item" data-target="cs-form-group-states-variants">Form Group — States &amp; Variants</div>
            <div class="ubuntu-si-item" data-target="cs-checkbox-radio-details">Checkbox, Radio &amp; Details</div>
            <div class="ubuntu-si-item" data-target="cs-input-group-horizontal-fields">Input Group &amp; Horizontal Fields</div>
            <div class="ubuntu-si-item" data-target="cs-radio-group-warning-actions">Radio Group, Warning &amp; Actions</div>
            <div class="ubuntu-si-item" data-target="cs-input-dengan-icon">Input dengan Icon</div>
            <div class="ubuntu-si-item" data-target="cs-input-color-file-upload">Input Color &amp; File Upload</div>
            <div class="ubuntu-si-item" data-target="cs-grid-form-layouts">Grid Form Layouts</div>
        </div>

        <div class="ubuntu-components-main" style="flex:1; padding:20px; min-width:0;">

        <h2 class="ubuntu-title-2 title-2" style="margin:0 0 20px; color:var(--accent-bg-color);">
            <i class="icon-ic_fluent_grid_28_regular" style="font-size:28px; vertical-align:middle; color:#241f31;"></i>
            UI Component Showcase
        </h2>
        <p class="ubuntu-body body" style="margin-bottom:20px; color:#5e5c64;">Class sesuai CSS di components/</p>

        <!-- ============================================================ -->
        <!-- TYPOGRAPHY -->
        <!-- ============================================================ -->
        <div class="ubuntu-card card" id="cs-typography" style="margin-bottom:20px;">
            <div class="ubuntu-heading heading" style="margin-bottom:12px;">Typography</div>
            <div class="ubuntu-title-1 title-1">Title 1</div>
            <div class="ubuntu-title-2 title-2">Title 2</div>
            <div class="ubuntu-title-3 title-3">Title 3</div>
            <div class="ubuntu-title-4 title-4">Title 4</div>
            <div class="ubuntu-heading heading">Heading</div>
            <div class="ubuntu-body body">Body text with increased line height for readability.</div>
            <div class="ubuntu-caption-heading caption-heading">Caption Heading</div>
            <div class="ubuntu-caption caption">Caption text</div>
            <div class="ubuntu-monospace monospace">Monospace text</div>
        </div>

        <!-- ============================================================ -->
        <!-- BUTTONS -->
        <!-- ============================================================ -->
        <div class="ubuntu-card card" id="cs-buttons-style-variants" style="margin-bottom:20px;">
            <div class="ubuntu-heading heading" style="margin-bottom:12px;">Buttons — Style Variants</div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                <button class="ubuntu-button button">Default</button>
                <button class="ubuntu-suggested-action suggested-action">Suggested</button>
                <button class="ubuntu-destructive-action destructive-action">Destructive</button>
                <button class="ubuntu-orange-action orange-action">Orange</button>
                <button class="ubuntu-flat flat">Flat</button>
                <button class="ubuntu-raised raised">Raised</button>
                <button class="ubuntu-pill pill">Pill</button>
                <button class="ubuntu-circular circular" title="Close"><i class="icon-ic_fluent_dismiss_12_regular" style="font-size:12px; color:#241f31;"></i></button>
                <button class="ubuntu-button button" disabled>Disabled</button>
            </div>
        </div>

        <div class="ubuntu-card card" id="cs-buttons-sizes" style="margin-bottom:20px;">
            <div class="ubuntu-heading heading" style="margin-bottom:12px;">Buttons — Sizes</div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                <button class="ubuntu-small small">Small</button>
                <button class="ubuntu-button button">Default</button>
                <button class="ubuntu-large large">Large</button>
                <button class="ubuntu-small ubuntu-suggested-action small suggested-action">Small Suggested</button>
                <button class="ubuntu-large ubuntu-orange-action large orange-action">Large Orange</button>
            </div>
        </div>

        <div class="ubuntu-card card" id="cs-buttons-icon-text" style="margin-bottom:20px;">
            <div class="ubuntu-heading heading" style="margin-bottom:12px;">Buttons — Icon + Text</div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                <button class="ubuntu-button button"><i class="icon-ic_fluent_arrow_right_16_regular" style="font-size:14px;"></i> Icon Left</button>
                <button class="ubuntu-button button">Icon Right <i class="icon-ic_fluent_arrow_right_16_regular" style="font-size:14px;"></i></button>
                <button class="ubuntu-suggested-action suggested-action"><i class="icon-ic_fluent_play_16_regular" style="font-size:14px;"></i> Play</button>
                <button class="ubuntu-orange-action orange-action"><i class="icon-ic_fluent_search_16_regular" style="font-size:14px;"></i> Search</button>
                <button class="ubuntu-destructive-action destructive-action"><i class="icon-ic_fluent_delete_16_regular" style="font-size:14px;"></i> Delete</button>
            </div>
        </div>

        <div class="ubuntu-card card" id="cs-buttons-icon-only" style="margin-bottom:20px;">
            <div class="ubuntu-heading heading" style="margin-bottom:12px;">Buttons — Icon Only</div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                <button class="ubuntu-icon-button icon-button" title="Bold"><i class="icon-ic_fluent_text_bold_16_regular" style="font-size:16px;"></i></button>
                <button class="ubuntu-icon-button icon-button" title="Italic"><i class="icon-ic_fluent_text_italic_16_regular" style="font-size:16px;"></i></button>
                <button class="ubuntu-icon-button icon-button" title="Underline"><i class="icon-ic_fluent_text_underline_16_regular" style="font-size:16px;"></i></button>
                <button class="ubuntu-icon-button icon-button" title="Copy"><i class="icon-ic_fluent_copy_16_regular" style="font-size:16px;"></i></button>
                <button class="ubuntu-icon-button ubuntu-circular ubuntu-suggested-action icon-button circular suggested-action" title="Close"><i class="icon-ic_fluent_dismiss_16_regular" style="font-size:16px;"></i></button>
                <button class="ubuntu-icon-button ubuntu-circular ubuntu-destructive-action icon-button circular destructive-action" title="Delete"><i class="icon-ic_fluent_delete_16_regular" style="font-size:16px;"></i></button>
                <button class="ubuntu-icon-button ubuntu-circular ubuntu-orange-action icon-button circular orange-action" title="Settings"><i class="icon-ic_fluent_settings_16_regular" style="font-size:16px;"></i></button>
            </div>
        </div>

        <div class="ubuntu-card card" id="cs-buttons-linked-segmented" style="margin-bottom:20px;">
            <div class="ubuntu-heading heading" style="margin-bottom:12px;">Buttons — Linked (Segmented)</div>
            <div style="display:flex; gap:20px; flex-wrap:wrap; align-items:center;">
                <div class="ubuntu-linked linked">
                    <button class="ubuntu-button button">Cut</button>
                    <button class="ubuntu-button button">Copy</button>
                    <button class="ubuntu-button button">Paste</button>
                </div>
                <div class="ubuntu-linked linked">
                    <button class="ubuntu-suggested-action suggested-action">Day</button>
                    <button class="ubuntu-suggested-action suggested-action">Week</button>
                    <button class="ubuntu-suggested-action suggested-action">Month</button>
                </div>
                <div class="ubuntu-linked linked">
                    <button class="ubuntu-flat flat">B</button>
                    <button class="ubuntu-flat flat">I</button>
                    <button class="ubuntu-flat flat">U</button>
                </div>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- INPUT / ENTRY -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-input-entry" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Input / Entry</div>
            <div style="display:flex; flex-direction:column; gap:8px; max-width:350px;">
                <input type="text" class="entry ubuntu-entry" placeholder="Text input...">
                <input type="password" class="entry ubuntu-entry" placeholder="Password..." value="secret123">
                <div class="linked ubuntu-linked">
                    <input type="text" class="entry ubuntu-entry" placeholder="Search...">
                    <button class="suggested-action ubuntu-suggested-action">Go</button>
                </div>
                <textarea class="entry ubuntu-entry" placeholder="Textarea..." style="min-height:60px;"></textarea>
                <textarea class="entry code ubuntu-entry ubuntu-code" placeholder="Code editor..." style="min-height:70px;">&#x2F;&#x2F; type your code</textarea>
            </div>
        </div>

        <div class="card ubuntu-card" id="cs-input-file-picker-button" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Input — File Picker Button</div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                <label class="suggested-action ubuntu-suggested-action">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 512 512" fill="currentColor" style="display:block;"><path d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm-6 336H54a6 6 0 0 1-6-6V118a6 6 0 0 1 6-6h404a6 6 0 0 1 6 6v276a6 6 0 0 1-6 6zM128 152c-22.091 0-40 17.909-40 40s17.909 40 40 40 40-17.909 40-40-17.909-40-40-40zM96 352h320v-80l-87.515-103.515c-4.686-4.686-12.284-4.686-16.971 0L192 288l-39.515-39.515c-4.686-4.686-12.284-4.686-16.971 0L96 304v48z"/></svg>
                    Browse Image
                </label>
                <input type="file" accept="image/*" style="display:none;">
                <label class="orange-action ubuntu-orange-action">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 512 512" fill="currentColor" style="display:block;"><path d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm-6 336H54a6 6 0 0 1-6-6V118a6 6 0 0 1 6-6h404a6 6 0 0 1 6 6v276a6 6 0 0 1-6 6zM128 152c-22.091 0-40 17.909-40 40s17.909 40 40 40 40-17.909 40-40-17.909-40-40-40zM96 352h320v-80l-87.515-103.515c-4.686-4.686-12.284-4.686-16.971 0L192 288l-39.515-39.515c-4.686-4.686-12.284-4.686-16.971 0L96 304v48z"/></svg>
                    Upload File
                </label>
                <input type="file" accept="*" style="display:none;">
                <label class="flat ubuntu-flat">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 512 512" fill="currentColor" style="display:block;"><path d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm-6 336H54a6 6 0 0 1-6-6V118a6 6 0 0 1 6-6h404a6 6 0 0 1 6 6v276a6 6 0 0 1-6 6zM128 152c-22.091 0-40 17.909-40 40s17.909 40 40 40 40-17.909 40-40-17.909-40-40-40zM96 352h320v-80l-87.515-103.515c-4.686-4.686-12.284-4.686-16.971 0L192 288l-39.515-39.515c-4.686-4.686-12.284-4.686-16.971 0L96 304v48z"/></svg>
                    Attach File
                </label>
                <input type="file" accept="*" style="display:none;">
            </div>
            <p class="caption ubuntu-caption" style="margin-top:8px; color:#5e5c64;">
                Pakai <code>&lt;label class="suggested-action ubuntu-suggested-action"&gt;</code> + <code>&lt;input type="file" style="display:none;"&gt;</code>.
                Tidak perlu inline style manual lagi.
            </p>
        </div>

        <div class="card ubuntu-card" id="cs-input-sizes-states" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Input — Sizes & States</div>
            <div style="display:flex; flex-direction:column; gap:8px; max-width:350px;">
                <input type="text" class="entry small ubuntu-entry ubuntu-small" placeholder="Small input">
                <input type="text" class="entry ubuntu-entry" placeholder="Default input">
                <input type="text" class="entry large ubuntu-entry ubuntu-large" placeholder="Large input">
                <input type="text" class="entry ubuntu-entry" placeholder="Disabled input" disabled>
                <input type="text" class="entry ubuntu-entry" placeholder="Read-only input" readonly value="Can't edit">
                <input type="text" class="entry error ubuntu-entry ubuntu-error" placeholder="Error state" value="Invalid value">
                <input type="text" class="entry warning ubuntu-entry ubuntu-warning" placeholder="Warning state" value="Check this">
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- SELECT -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-select" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Select</div>
            <div style="display:flex; flex-direction:column; gap:8px; max-width:350px;">
                <select class="select ubuntu-select">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
            </select>
                <div class="linked ubuntu-linked">
                    <select class="select ubuntu-select">
                        <option>All files</option>
                        <option>Images</option>
                        <option>Documents</option>
                    </select>
                    <button class="suggested-action ubuntu-suggested-action">Filter</button>
                </div>
                <select class="select ubuntu-select" disabled>
                    <option>Disabled select</option>
                </select>
                <select class="select ubuntu-select" multiple>
                    <option>Option A</option>
                    <option>Option B</option>
                    <option>Option C</option>
                </select>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- CHECKBOX / SWITCH / RADIO -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-checkbox-switch-radio" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Checkbox / Switch / Radio</div>
            <div style="display:flex; flex-direction:column; gap:10px;">
                <label class="checkbox ubuntu-checkbox"><input type="checkbox" checked> Checked</label>
                <label class="checkbox ubuntu-checkbox"><input type="checkbox"> Unchecked</label>
                <label class="checkbox ubuntu-checkbox"><input type="checkbox" disabled> Disabled</label>
                <label class="switch ubuntu-switch"><input type="checkbox" checked> Switch on</label>
                <label class="switch ubuntu-switch"><input type="checkbox"> Switch off</label>
                <label class="switch ubuntu-switch"><input type="checkbox" disabled> Switch disabled</label>
                <label class="radio ubuntu-radio"><input type="radio" name="demo" checked> Radio 1</label>
                <label class="radio ubuntu-radio"><input type="radio" name="demo"> Radio 2</label>
                <label class="radio ubuntu-radio"><input type="radio" name="demo" disabled> Radio disabled</label>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- TABS -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-tabs-horizontal" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Tabs — Horizontal</div>
            <div class="tabs ubuntu-tabs">
                <div class="tab selected ubuntu-tab ubuntu-selected" onclick="this.closest('.ubuntu-components-app').querySelectorAll('.tab').forEach(t=>t.classList.remove('selected')); this.classList.add('selected');">Tab 1</div>
                <div class="tab ubuntu-tab" onclick="this.closest('.ubuntu-components-app').querySelectorAll('.tab').forEach(t=>t.classList.remove('selected')); this.classList.add('selected');">Tab 2</div>
                <div class="tab ubuntu-tab" onclick="this.closest('.ubuntu-components-app').querySelectorAll('.tab').forEach(t=>t.classList.remove('selected')); this.classList.add('selected');">Tab 3</div>
                <div class="tab disabled ubuntu-tab ubuntu-disabled">Disabled</div>
            </div>
        </div>

        <div class="card ubuntu-card" id="cs-tabs-sizes" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Tabs — Sizes</div>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <div class="tabs ubuntu-tabs">
                    <div class="tab small selected ubuntu-tab ubuntu-small ubuntu-selected" onclick="this.closest('.ubuntu-components-app').querySelectorAll('.tab').forEach(t=>t.classList.remove('selected')); this.classList.add('selected');">Small</div>
                    <div class="tab small ubuntu-tab ubuntu-small" onclick="this.closest('.ubuntu-components-app').querySelectorAll('.tab').forEach(t=>t.classList.remove('selected')); this.classList.add('selected');">Small</div>
                </div>
                <div class="tabs ubuntu-tabs">
                    <div class="tab selected ubuntu-tab ubuntu-selected" onclick="this.closest('.ubuntu-components-app').querySelectorAll('.tab').forEach(t=>t.classList.remove('selected')); this.classList.add('selected');">Default</div>
                    <div class="tab ubuntu-tab" onclick="this.closest('.ubuntu-components-app').querySelectorAll('.tab').forEach(t=>t.classList.remove('selected')); this.classList.add('selected');">Default</div>
                </div>
                <div class="tabs ubuntu-tabs">
                    <div class="tab large selected ubuntu-tab ubuntu-large ubuntu-selected" onclick="this.closest('.ubuntu-components-app').querySelectorAll('.tab').forEach(t=>t.classList.remove('selected')); this.classList.add('selected');">Large</div>
                    <div class="tab large ubuntu-tab ubuntu-large" onclick="this.closest('.ubuntu-components-app').querySelectorAll('.tab').forEach(t=>t.classList.remove('selected')); this.classList.add('selected');">Large</div>
                </div>
            </div>
        </div>

        <div class="card ubuntu-card" id="cs-tabs-with-icon" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Tabs — With Icon</div>
            <div class="tabs ubuntu-tabs">
                <div class="tab selected ubuntu-tab ubuntu-selected" onclick="this.closest('.ubuntu-components-app').querySelectorAll('.tab').forEach(t=>t.classList.remove('selected')); this.classList.add('selected');">
                    <i class="icon-ic_fluent_grid_16_regular" style="font-size:14px;"></i> Grid
                </div>
                <div class="tab ubuntu-tab" onclick="this.closest('.ubuntu-components-app').querySelectorAll('.tab').forEach(t=>t.classList.remove('selected')); this.classList.add('selected');">
                    <i class="icon-ic_fluent_list_16_regular" style="font-size:14px;"></i> List
                </div>
                <div class="tab icon-only ubuntu-tab ubuntu-icon-only" title="Search" onclick="this.closest('.ubuntu-components-app').querySelectorAll('.tab').forEach(t=>t.classList.remove('selected')); this.classList.add('selected');">
                    <i class="icon-ic_fluent_search_16_regular" style="font-size:14px;"></i>
                </div>
            </div>
        </div>

        <div class="card ubuntu-card" id="cs-tabs-vertical" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Tabs — Vertical</div>
            <div style="display:flex; gap:16px;">
                <div class="tabs-vertical ubuntu-tabs-vertical" style="width:120px;">
                    <div class="tab selected ubuntu-tab ubuntu-selected" onclick="this.closest('.tabs-vertical').querySelectorAll('.tab').forEach(t=>t.classList.remove('selected')); this.classList.add('selected');">General</div>
                    <div class="tab ubuntu-tab" onclick="this.closest('.tabs-vertical').querySelectorAll('.tab').forEach(t=>t.classList.remove('selected')); this.classList.add('selected');">Appearance</div>
                    <div class="tab ubuntu-tab" onclick="this.closest('.tabs-vertical').querySelectorAll('.tab').forEach(t=>t.classList.remove('selected')); this.classList.add('selected');">About</div>
                </div>
                <div class="tab-bar ubuntu-tab-bar" style="flex:1;">
                    <div class="tab-content ubuntu-tab-content">Content area for selected tab</div>
                </div>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- ACCORDION -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-accordion" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Accordion</div>
            <div class="accordion ubuntu-accordion">
                <div class="accordion-section expanded ubuntu-accordion-section ubuntu-expanded">
                    <div class="accordion-header ubuntu-accordion-header" onclick="this.parentElement.classList.toggle('expanded')">Section 1</div>
                    <div class="accordion-body ubuntu-accordion-body">Content 1</div>
                </div>
                <div class="accordion-section ubuntu-accordion-section">
                    <div class="accordion-header ubuntu-accordion-header" onclick="this.parentElement.classList.toggle('expanded')">Section 2</div>
                    <div class="accordion-body ubuntu-accordion-body">Content 2</div>
                </div>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- BREADCRUMB -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-breadcrumb" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Breadcrumb</div>
            <div class="breadcrumb ubuntu-breadcrumb">
                <span class="breadcrumb-item ubuntu-breadcrumb-item">Home</span>
                <span class="breadcrumb-separator ubuntu-breadcrumb-separator">/</span>
                <span class="breadcrumb-item ubuntu-breadcrumb-item">Docs</span>
                <span class="breadcrumb-separator ubuntu-breadcrumb-separator">/</span>
                <span class="breadcrumb-item selected ubuntu-breadcrumb-item ubuntu-selected">Project</span>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- TABLE -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-table" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Table</div>
            <table class="table ubuntu-table" style="width:100%;">
                <thead><tr><th>Name</th><th>Type</th><th>Size</th></tr></thead>
                <tbody>
                    <tr><td>doc.pdf</td><td>PDF</td><td>2.3 MB</td></tr>
                    <tr><td>img.png</td><td>Image</td><td>1.1 MB</td></tr>
                    <tr><td>script.js</td><td>JS</td><td>45 KB</td></tr>
                </tbody>
            </table>
        </div>

        <!-- ============================================================ -->
        <!-- LIST -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-list" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">List</div>
            <div class="list ubuntu-list nx-scroll" style="max-height:180px;">
                <div class="list-item selected ubuntu-list-item ubuntu-selected">Item selected</div>
                <div class="list-item ubuntu-list-item">Item 2</div>
                <div class="list-item ubuntu-list-item">Item 3</div>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- CARD / BOXED LIST -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-card-boxed-list" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Card & Boxed List</div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:16px;">
                <div class="card ubuntu-card"><div class="heading ubuntu-heading" style="margin-bottom:4px;">Card 1</div><div class="body ubuntu-body">Content</div></div>
                <div class="card ubuntu-card"><div class="heading ubuntu-heading" style="margin-bottom:4px;">Card 2</div><div class="body ubuntu-body">Content</div></div>
                <div class="card ubuntu-card"><div class="heading ubuntu-heading" style="margin-bottom:4px;">Card 3</div><div class="body ubuntu-body">Content</div></div>
            </div>
            <div class="boxed-list ubuntu-boxed-list">
                <div style="padding:12px 16px;">Row 1</div>
                <div style="padding:12px 16px;">Row 2</div>
                <div style="padding:12px 16px;">Row 3</div>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- PROGRESS -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-progress" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Progress</div>
            <div style="display:flex; flex-direction:column; gap:10px;">
                <div class="progress ubuntu-progress"><div class="progress-bar ubuntu-progress-bar" style="width:60%;"></div></div>
                <div class="progress ubuntu-progress"><div class="progress-bar ubuntu-progress-bar" style="width:100%;"></div></div>
                <div class="progress ubuntu-progress"><div class="progress-bar ubuntu-progress-bar" style="width:40%;"></div></div>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- SPINNER -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-spinner" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Spinner</div>
            <span class="spinner ubuntu-spinner"></span>
        </div>

        <!-- ============================================================ -->
        <!-- TOOLBAR -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-toolbar" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Toolbar</div>
            <div class="toolbar ubuntu-toolbar">
                <button><i class="icon-ic_fluent_text_bold_16_regular" style="font-size:14px; color:#241f31;"></i></button>
                <button><i class="icon-ic_fluent_text_italic_16_regular" style="font-size:14px; color:#241f31;"></i></button>
                <button><i class="icon-ic_fluent_text_underline_16_regular" style="font-size:14px; color:#241f31;"></i></button>
                <button><i class="icon-ic_fluent_copy_16_regular" style="font-size:14px; color:#241f31;"></i></button>
                <button><i class="icon-ic_fluent_cut_16_regular" style="font-size:14px; color:#241f31;"></i></button>
                <button><i class="icon-ic_fluent_clipboard_paste_16_regular" style="font-size:14px; color:#241f31;"></i></button>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- SEARCH -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-search" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Search</div>
            <div class="search ubuntu-search" style="max-width:300px;">
                <input class="search-input ubuntu-search-input" type="text" placeholder="Search...">
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- TOAST -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-toast" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Toast</div>
            <div style="display:flex; flex-direction:column; gap:8px; max-width:350px;">
                <div class="toast ubuntu-toast" style="color:#fff;">
                    <i class="icon-ic_fluent_info_16_regular" style="font-size:16px; flex-shrink:0;"></i>
                    <div><div class="toast-title ubuntu-toast-title">Info</div><div class="toast-message ubuntu-toast-message">Information message</div></div>
                </div>
                <div class="toast ubuntu-toast" style="color:#fff;">
                    <i class="icon-ic_fluent_error_circle_16_regular" style="font-size:16px; flex-shrink:0;"></i>
                    <div><div class="toast-title ubuntu-toast-title">Error</div><div class="toast-message ubuntu-toast-message">Something went wrong</div></div>
                </div>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- TOOLTIP -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-tooltip" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Tooltip</div>
            <button class="ubuntu-button button" data-tooltip="This is a tooltip">Hover me</button>
        </div>

        <!-- ============================================================ -->
        <!-- SIDEBAR -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-sidebar" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Sidebar</div>
            <div class="navigation-sidebar ubuntu-navigation-sidebar" style="width:200px;">
                <div class="row selected ubuntu-row ubuntu-selected">Item 1</div>
                <div class="row ubuntu-row">Item 2</div>
                <div class="row ubuntu-row">Item 3</div>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- AVATAR -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-avatar" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Avatar</div>
            <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:center;">
                <span class="avatar xlarge ubuntu-avatar ubuntu-xlarge" style="background:linear-gradient(135deg,#5E2750,#E95420);"></span>
                <span class="avatar large initials ubuntu-avatar ubuntu-large ubuntu-initials">JD</span>
                <span class="avatar medium initials ubuntu-avatar ubuntu-medium ubuntu-initials">AB</span>
                <span class="avatar small initials ubuntu-avatar ubuntu-small ubuntu-initials">C</span>
                <span class="avatar xsmall initials ubuntu-avatar ubuntu-xsmall ubuntu-initials">D</span>
            </div>
            <div class="avatar-label ubuntu-avatar-label" style="margin-top:12px;">
                <span class="avatar small initials ubuntu-avatar ubuntu-small ubuntu-initials" style="background:linear-gradient(135deg,#5E2750,#E95420);">U</span>
                <div class="avatar-info ubuntu-avatar-info">
                    <div class="avatar-name ubuntu-avatar-name">User Name</div>
                    <div class="avatar-desc ubuntu-avatar-desc">user@ubuntu.com</div>
                </div>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- SCROLLBAR -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-scrollbar-yaru-style" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Scrollbar — Yaru Style</div>
            <p class="caption ubuntu-caption" style="margin-bottom:8px; color:#5e5c64;">
                Scrollbar tipis, rounded, orange saat aktif. Arahkan mouse atau scroll untuk melihat.
            </p>
            <div class="nx-scroll" style="max-height:160px; border:1px solid var(--border-color); border-radius:var(--border-radius); padding:8px;">
                <div style="min-height:400px; display:flex; flex-direction:column; gap:6px;">
                    <div style="padding:8px 12px; background:var(--view-bg-color); border-radius:4px; border:1px solid var(--border-color);">Item 1 — scroll untuk lihat scrollbar</div>
                    <div style="padding:8px 12px; background:var(--view-bg-color); border-radius:4px; border:1px solid var(--border-color);">Item 2</div>
                    <div style="padding:8px 12px; background:var(--view-bg-color); border-radius:4px; border:1px solid var(--border-color);">Item 3</div>
                    <div style="padding:8px 12px; background:var(--view-bg-color); border-radius:4px; border:1px solid var(--border-color);">Item 4</div>
                    <div style="padding:8px 12px; background:var(--view-bg-color); border-radius:4px; border:1px solid var(--border-color);">Item 5</div>
                </div>
            </div>
            <p class="caption ubuntu-caption" style="margin-top:8px; color:#5e5c64;">
                Dark variant: tambah class <code>.ubuntu-dark</code> ke container. 
                Thin variant: tambah class <code>.ubuntu-thin-scroll</code> (4px).
            </p>
            <div class="ubuntu-dark dark nx-scroll" style="max-height:120px; border:1px solid rgba(255,255,255,0.1); border-radius:var(--border-radius); padding:8px; margin-top:8px; background:#2a2a2a;">
                <div style="min-height:300px; display:flex; flex-direction:column; gap:6px;">
                    <div style="padding:8px 12px; background:rgba(255,255,255,0.08); border-radius:4px; color:#ccc;">Dark scrollbar — juga orange saat aktif</div>
                    <div style="padding:8px 12px; background:rgba(255,255,255,0.08); border-radius:4px; color:#ccc;">Item 2</div>
                    <div style="padding:8px 12px; background:rgba(255,255,255,0.08); border-radius:4px; color:#ccc;">Item 3</div>
                </div>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- BADGE -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-badge-tag" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Badge / Tag</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                <span class="badge ubuntu-badge">Default</span>
                <span class="badge orange ubuntu-badge ubuntu-orange">Orange</span>
                <span class="badge success ubuntu-badge ubuntu-success">Success</span>
                <span class="badge warning ubuntu-badge ubuntu-warning">Warning</span>
                <span class="badge error ubuntu-badge ubuntu-error">Error</span>
                <span class="badge info ubuntu-badge ubuntu-info">Info</span>
                <span class="badge small ubuntu-badge ubuntu-small">Small</span>
                <span class="badge large ubuntu-badge ubuntu-large">Large</span>
                <span class="badge outline orange ubuntu-badge ubuntu-outline ubuntu-orange">Outline</span>
            </div>
            <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:center; margin-top:12px;">
                <span>Status:
                    <span class="badge-dot success ubuntu-badge-dot ubuntu-success"></span> Online
                    <span class="badge-dot warning ubuntu-badge-dot ubuntu-warning"></span> Away
                    <span class="badge-dot error ubuntu-badge-dot ubuntu-error"></span> Offline
                </span>
                <span class="badge-counter ubuntu-badge-counter">9</span>
                <span class="badge-counter ubuntu-badge-counter">99+</span>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- SLIDER -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-slider" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Slider</div>
            <div style="max-width:350px;">
                <div class="slider-row ubuntu-slider-row">
                    <i class="icon-ic_fluent_speaker_1_16_regular slider-icon ubuntu-slider-icon" style="font-size:16px;"></i>
                    <input type="range" min="0" max="100" value="60">
                    <span class="slider-value ubuntu-slider-value">60%</span>
                </div>
                <div class="slider-row ubuntu-slider-row">
                    <i class="icon-ic_fluent_brightness_high_16_regular slider-icon ubuntu-slider-icon" style="font-size:16px;"></i>
                    <input type="range" min="0" max="100" value="80">
                    <span class="slider-value ubuntu-slider-value">80%</span>
                </div>
                <input type="range" min="0" max="100" value="40" disabled>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- MENU (contoh popup) -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-menu-popup" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Menu (Popup)</div>
            <div class="menu ubuntu-menu" style="position:static; display:flex; max-width:250px;">
                <div class="menu-item ubuntu-menu-item"><i class="icon-ic_fluent_folder_open_16_regular" style="font-size:14px;"></i><span class="menu-label ubuntu-menu-label">Open</span><span class="menu-accelerator ubuntu-menu-accelerator">Ctrl+O</span></div>
                <div class="menu-item ubuntu-menu-item"><i class="icon-ic_fluent_save_16_regular" style="font-size:14px;"></i><span class="menu-label ubuntu-menu-label">Save</span><span class="menu-accelerator ubuntu-menu-accelerator">Ctrl+S</span></div>
                <div class="menu-item disabled ubuntu-menu-item ubuntu-disabled"><i class="icon-ic_fluent_arrow_export_16_regular" style="font-size:14px;"></i><span class="menu-label ubuntu-menu-label">Export</span></div>
                <div class="menu-separator ubuntu-menu-separator"></div>
                <div class="menu-item has-submenu ubuntu-menu-item ubuntu-has-submenu"><i class="icon-ic_fluent_search_16_regular" style="font-size:14px;"></i><span class="menu-label ubuntu-menu-label">Find &amp; Replace</span></div>
                <div class="menu-separator ubuntu-menu-separator"></div>
                <div class="menu-item ubuntu-menu-item"><i class="icon-ic_fluent_delete_16_regular" style="font-size:14px; color:#e01b24;"></i><span class="menu-label ubuntu-menu-label" style="color:#e01b24;">Delete</span></div>
            </div>
        </div>

        <!-- ============================================================ -->
        <!-- FORM INPUTS (dari fromindex.html) -->
        <!-- ============================================================ -->
        <div class="card ubuntu-card" id="cs-form-inputs-primer-css-style" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Form Inputs — Primer CSS Style</div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">1. .form-control — Input Text</h3>
            <input class="form-control ubuntu-form-control" type="text" placeholder="Default input">

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">2. .form-control — Textarea</h3>
            <textarea class="form-control ubuntu-form-control ubuntu-short" rows="3" placeholder="Default textarea"></textarea>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">3. .form-select — Select</h3>
            <select class="form-select ubuntu-form-select">
                <option>Pilih opsi</option>
                <option>Opsi 1</option>
                <option>Opsi 2</option>
            </select>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">4. .select-sm — Select Kecil</h3>
            <select class="form-select select-sm ubuntu-form-select ubuntu-select-sm">
                <option>Pilih opsi</option>
                <option>Opsi 1</option>
            </select>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">5. .form-select[multiple] — Select Multiple</h3>
            <select class="form-select ubuntu-form-select" multiple>
                <option>Opsi A</option>
                <option>Opsi B</option>
                <option>Opsi C</option>
            </select>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">6. .input-contrast</h3>
            <input class="form-control input-contrast ubuntu-form-control ubuntu-input-contrast" type="text" placeholder="Input contrast">

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">7. .input-sm — Input Kecil</h3>
            <input class="form-control input-sm ubuntu-form-control ubuntu-input-sm" type="text" placeholder="Input kecil">

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">8. .input-lg — Input Besar</h3>
            <input class="form-control input-lg ubuntu-form-control ubuntu-input-lg" type="text" placeholder="Input besar">

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">9. .input-block — Input Full Width</h3>
            <input class="form-control input-block ubuntu-form-control ubuntu-input-block" type="text" placeholder="Input block full width">

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">10. .input-monospace — Input Monospace</h3>
            <input class="form-control input-monospace ubuntu-form-control ubuntu-input-monospace" type="text" value="const x = 42;">

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">11. .form-control[disabled] — Input Disabled</h3>
            <input class="form-control ubuntu-form-control" type="text" value="Input disabled" disabled>
        </div>

        <div class="card ubuntu-card" id="cs-form-group-states-variants" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Form Group — States & Variants</div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">12. .form-group — Default</h3>
            <div class="form-group ubuntu-form-group">
                <div>
                    <div class="form-group-header ubuntu-form-group-header"><label for="fg1">Username</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <input id="fg1" class="form-control ubuntu-form-control" type="text" placeholder="Masukkan username">
                        <p class="note ubuntu-note">Nama pengguna minimal 3 karakter.</p>
                    </div>
                </div>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">13. .form-group.required — Field Wajib</h3>
            <div class="form-group required ubuntu-form-group ubuntu-required">
                <div>
                    <div class="form-group-header ubuntu-form-group-header"><label for="fg2">Email</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <input id="fg2" class="form-control ubuntu-form-control" type="email" placeholder="email@contoh.com">
                    </div>
                </div>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">14. .form-group.flattened — Layout Datar</h3>
            <div class="form-group flattened ubuntu-form-group ubuntu-flattened">
                <div>
                    <div class="form-group-header ubuntu-form-group-header"><label for="fg3">Nama</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <input id="fg3" class="form-control short ubuntu-form-control ubuntu-short" type="text" placeholder="Nama lengkap">
                    </div>
                </div>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">15. .form-group.errored — State Error</h3>
            <div class="form-group errored ubuntu-form-group ubuntu-errored">
                <div>
                    <div class="form-group-header ubuntu-form-group-header"><label for="fg4">Password</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <input id="fg4" class="form-control ubuntu-form-control" type="password" value="abc">
                        <div class="error ubuntu-error">Password minimal 8 karakter.</div>
                    </div>
                </div>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">16. .form-group.warn — State Peringatan</h3>
            <div class="form-group warn ubuntu-form-group ubuntu-warn">
                <div>
                    <div class="form-group-header ubuntu-form-group-header"><label for="fg5">Username</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <input id="fg5" class="form-control ubuntu-form-control" type="text" value="user123">
                        <div class="warning ubuntu-warning">Username mungkin sudah digunakan.</div>
                    </div>
                </div>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">17. .form-group.successful — State Berhasil</h3>
            <div class="form-group successful ubuntu-form-group ubuntu-successful">
                <div>
                    <div class="form-group-header ubuntu-form-group-header"><label for="fg6">Email</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <input id="fg6" class="form-control ubuntu-form-control" type="email" value="ok@example.com">
                        <span class="success ubuntu-success">Email tersedia!</span>
                    </div>
                </div>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">18. .form-group.loading — State Loading</h3>
            <div class="form-group loading ubuntu-form-group ubuntu-loading">
                <div>
                    <div class="form-group-header ubuntu-form-group-header"><label for="fg7">Cek Domain</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <input id="fg7" class="form-control ubuntu-form-control" type="text" value="nexaui">
                        <span class="indicator ubuntu-indicator">Mengecek&hellip;</span>
                    </div>
                </div>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">19. .form-group — Textarea</h3>
            <div class="form-group ubuntu-form-group">
                <div>
                    <div class="form-group-header ubuntu-form-group-header"><label for="fg8">Deskripsi</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <textarea id="fg8" class="form-control ubuntu-form-control" placeholder="Tulis deskripsi..."></textarea>
                    </div>
                </div>
            </div>
        </div>

        <div class="card ubuntu-card" id="cs-checkbox-radio-details" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Checkbox, Radio & Details</div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">20. .form-checkbox — Checkbox</h3>
            <div class="form-checkbox ubuntu-form-checkbox">
                <label>
                    <input type="checkbox"> Saya setuju dengan syarat &amp; ketentuan
                    <span class="note ubuntu-note">Baca terlebih dahulu sebelum menyetujui.</span>
                </label>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">21. .form-checkbox — Radio</h3>
            <div class="form-checkbox ubuntu-form-checkbox">
                <label><input type="radio" name="gender" value="L"> Laki-laki</label>
            </div>
            <div class="form-checkbox ubuntu-form-checkbox">
                <label><input type="radio" name="gender" value="P"> Perempuan</label>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">22. .form-checkbox — Checkbox dengan Highlight</h3>
            <div class="form-checkbox ubuntu-form-checkbox">
                <label>
                    <input type="checkbox">
                    Aktifkan fitur <em class="highlight ubuntu-highlight">Beta</em>
                </label>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">23. .form-checkbox-details — Detail Toggle</h3>
            <div class="form-checkbox ubuntu-form-checkbox">
                <label>
                    <input class="form-checkbox-details-trigger ubuntu-form-checkbox-details-trigger" type="checkbox"> Tampilkan detail
                </label>
                <div class="form-checkbox-details ubuntu-form-checkbox-details">
                    <p class="note ubuntu-note">Konten tambahan yang tampil saat checkbox dicentang.</p>
                </div>
            </div>
        </div>

        <div class="card ubuntu-card" id="cs-input-group-horizontal-fields" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Input Group & Horizontal Fields</div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">24. .input-group — Input + Button</h3>
            <div class="input-group ubuntu-input-group">
                <input class="form-control ubuntu-form-control" type="text" placeholder="Cari sesuatu...">
                <div class="input-group-button ubuntu-input-group-button">
                    <button class="btn ubuntu-btn" type="button">Cari</button>
                </div>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">25. .input-group.inline — Input Group Inline</h3>
            <div class="input-group inline ubuntu-input-group ubuntu-inline">
                <div class="input-group-button ubuntu-input-group-button">
                    <button class="btn ubuntu-btn" type="button">@</button>
                </div>
                <input class="form-control ubuntu-form-control" type="text" placeholder="nama pengguna">
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">26. .hfields — Horizontal Fields</h3>
            <div class="hfields ubuntu-hfields">
                <div class="form-group ubuntu-form-group">
                    <div class="form-group-header ubuntu-form-group-header"><label>Kota</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <select class="form-select ubuntu-form-select">
                            <option>Jakarta</option>
                            <option>Surabaya</option>
                        </select>
                    </div>
                </div>
                <div class="form-group ubuntu-form-group">
                    <div class="form-group-header ubuntu-form-group-header"><label>Tahun</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <select class="form-select ubuntu-form-select">
                            <option>2024</option>
                            <option>2025</option>
                            <option>2026</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div class="card ubuntu-card" id="cs-radio-group-warning-actions" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Radio Group, Warning & Actions</div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">27. .radio-group — Radio Button Group</h3>
            <div class="radio-group ubuntu-radio-group">
                <input class="radio-input ubuntu-radio-input" id="r1" type="radio" name="plan" value="free">
                <label class="radio-label ubuntu-radio-label" for="r1">Gratis</label>
                <input class="radio-input ubuntu-radio-input" id="r2" type="radio" name="plan" value="pro">
                <label class="radio-label ubuntu-radio-label" for="r2">Pro</label>
                <input class="radio-input ubuntu-radio-input" id="r3" type="radio" name="plan" value="enterprise" disabled>
                <label class="radio-label ubuntu-radio-label" for="r3">Enterprise</label>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">28. .form-warning — Kotak Peringatan</h3>
            <div class="form-warning ubuntu-form-warning">
                <p>Perhatian! Perubahan ini tidak dapat dibatalkan. Pastikan data sudah benar sebelum menyimpan.</p>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">29. .form-actions — Tombol Aksi Form</h3>
            <div class="form-actions ubuntu-form-actions">
                <button class="btn btn-primary ubuntu-btn ubuntu-btn-primary" type="submit">Simpan</button>
                <button class="btn ubuntu-btn" type="reset">Batal</button>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">30. .note — Catatan / Helper Text</h3>
            <p class="note ubuntu-note">Ini adalah teks catatan yang membantu pengguna mengisi formulir dengan benar.</p>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">31. fieldset[disabled] — Semua Input Disabled</h3>
            <fieldset disabled>
                <div class="form-group ubuntu-form-group">
                    <div class="form-group-header ubuntu-form-group-header"><label>Input Disabled via Fieldset</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <input class="form-control ubuntu-form-control" type="text" value="Tidak bisa diedit">
                        <select class="form-select ubuntu-form-select">
                            <option>Pilihan disabled</option>
                        </select>
                    </div>
                </div>
            </fieldset>
        </div>

        <div class="card ubuntu-card" id="cs-input-dengan-icon" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Input dengan Icon</div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">35. Input + Icon Kanan</h3>
            <div class="input-group ubuntu-input-group">
                <input class="form-control ubuntu-form-control" type="text" placeholder="Cari repository...">
                <div class="input-group-button ubuntu-input-group-button">
                    <button class="btn ubuntu-btn" type="button" aria-label="Search">
                        <i class="icon-ic_fluent_search_16_regular"></i>
                    </button>
                </div>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">36. Input + Icon Kiri</h3>
            <div class="input-group inline ubuntu-input-group ubuntu-inline">
                <div class="input-group-button ubuntu-input-group-button">
                    <button class="btn ubuntu-btn" type="button" aria-label="Link">
                        <i class="icon-ic_fluent_link_16_regular"></i>
                    </button>
                </div>
                <input class="form-control ubuntu-form-control" type="url" placeholder="https://example.com">
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">37. Input + Icon Kiri &amp; Kanan</h3>
            <div class="input-group ubuntu-input-group">
                <div class="input-group-button ubuntu-input-group-button">
                    <button class="btn ubuntu-btn" type="button" aria-label="User">
                        <i class="icon-ic_fluent_person_16_regular"></i>
                    </button>
                </div>
                <input class="form-control ubuntu-form-control" type="text" placeholder="Username">
                <div class="input-group-button ubuntu-input-group-button">
                    <button class="btn btn-primary ubuntu-btn ubuntu-btn-primary" type="button">Check</button>
                </div>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">38. Input + Icon — Variasi Ukuran</h3>
            <div style="display:flex;flex-direction:column;gap:8px;">
                <div class="input-group ubuntu-input-group">
                    <input class="form-control input-sm ubuntu-form-control ubuntu-input-sm" type="text" placeholder="Input kecil + icon">
                    <div class="input-group-button ubuntu-input-group-button">
                        <button class="btn btn-sm ubuntu-btn ubuntu-btn-sm" type="button"><i class="icon-ic_fluent_search_16_regular"></i></button>
                    </div>
                </div>
                <div class="input-group ubuntu-input-group">
                    <input class="form-control ubuntu-form-control" type="text" placeholder="Input normal + icon">
                    <div class="input-group-button ubuntu-input-group-button">
                        <button class="btn ubuntu-btn" type="button"><i class="icon-ic_fluent_search_16_regular"></i></button>
                    </div>
                </div>
                <div class="input-group ubuntu-input-group">
                    <input class="form-control input-lg ubuntu-form-control ubuntu-input-lg" type="text" placeholder="Input besar + icon">
                    <div class="input-group-button ubuntu-input-group-button">
                        <button class="btn btn-lg ubuntu-btn ubuntu-btn-lg" type="button"><i class="icon-ic_fluent_search_16_regular"></i></button>
                    </div>
                </div>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">39. Input + Multi-Icon Button</h3>
            <div class="input-group ubuntu-input-group">
                <input class="form-control ubuntu-form-control" type="text" placeholder="Nama branch...">
                <div class="input-group-button ubuntu-input-group-button">
                    <button class="btn ubuntu-btn" type="button">
                        <i class="icon-ic_fluent_branch_16_regular"></i>
                        Branch
                    </button>
                </div>
                <div class="input-group-button ubuntu-input-group-button">
                    <button class="btn ubuntu-btn" type="button" aria-label="Settings">
                        <i class="icon-ic_fluent_settings_16_regular"></i>
                    </button>
                </div>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">40. Input + Icon — Danger &amp; Success</h3>
            <div style="display:flex;flex-direction:column;gap:8px;">
                <div class="input-group ubuntu-input-group">
                    <input class="form-control ubuntu-form-control" type="text" placeholder="Input danger">
                    <div class="input-group-button ubuntu-input-group-button">
                        <button class="btn btn-danger ubuntu-btn ubuntu-btn-danger" type="button"><i class="icon-ic_fluent_delete_16_regular"></i></button>
                    </div>
                </div>
                <div class="input-group ubuntu-input-group">
                    <input class="form-control ubuntu-form-control" type="text" value="input-ok@example.com">
                    <div class="input-group-button ubuntu-input-group-button">
                        <button class="btn btn-primary ubuntu-btn ubuntu-btn-primary" type="button"><i class="icon-ic_fluent_checkmark_16_regular"></i></button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card ubuntu-card" id="cs-input-color-file-upload" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Input Color & File Upload</div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">41. input[type="color"] — Color Picker</h3>
            <div class="form-group ubuntu-form-group">
                <div class="form-group-header ubuntu-form-group-header"><label for="color1">Pilih Warna</label></div>
                <div class="form-group-body ubuntu-form-group-body">
                    <input id="color1" class="form-control ubuntu-form-control" type="color" value="#0969da">
                    <p class="note ubuntu-note">Klik untuk membuka color picker.</p>
                </div>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">42. input[type="color"] — Variasi</h3>
            <div style="display:flex;flex-direction:column;gap:12px;">
                <div>
                    <label class="text-bold d-block mb-1 ubuntu-text-bold ubuntu-d-block ubuntu-mb-1">Warna Default</label>
                    <input class="form-control ubuntu-form-control" type="color" value="#0969da">
                </div>
                <div>
                    <label class="text-bold d-block mb-1 ubuntu-text-bold ubuntu-d-block ubuntu-mb-1">Warna Disabled</label>
                    <input class="form-control ubuntu-form-control" type="color" value="#6e7781" disabled>
                </div>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">44. input[type="file"] — File Upload</h3>
            <div class="form-group ubuntu-form-group">
                <div class="form-group-header ubuntu-form-group-header"><label for="file1">Upload File</label></div>
                <div class="form-group-body ubuntu-form-group-body">
                    <label for="file1-input" class="file-upload-area ubuntu-file-upload-area" id="file1-drop">
                        <input id="file1-input" type="file" style="display:none" onchange="fileUploadUpdate(this,'file1-label','file1-drop')">
                        <span class="file-upload-icon ubuntu-file-upload-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </span>
                        <span class="file-upload-text ubuntu-file-upload-text">
                            <strong>Klik untuk memilih file</strong> atau seret &amp; lepas di sini
                        </span>
                        <span class="file-upload-hint ubuntu-file-upload-hint" id="file1-label">Semua tipe file didukung</span>
                    </label>
                    <p class="note ubuntu-note">Pilih satu file dari perangkat Anda.</p>
                </div>
            </div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">45. File Upload — Variasi</h3>
            <div style="display:flex;flex-direction:column;gap:12px;">
                <div class="form-group ubuntu-form-group" style="margin-bottom:0;">
                    <div class="form-group-header ubuntu-form-group-header"><label>Upload Gambar</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <label for="file-image" class="file-upload-area file-upload-area--image ubuntu-file-upload-area ubuntu-file-upload-area--image" id="file-image-drop">
                            <input id="file-image" type="file" accept="image/*" style="display:none" onchange="fileUploadUpdate(this,'file-image-label','file-image-drop')">
                            <span class="file-upload-icon ubuntu-file-upload-icon" style="color:var(--fgColor-accent,#0969da);">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            </span>
                            <span class="file-upload-text ubuntu-file-upload-text"><strong>Upload Gambar</strong></span>
                            <span class="file-upload-hint ubuntu-file-upload-hint" id="file-image-label">JPG, PNG, GIF, WEBP</span>
                        </label>
                    </div>
                </div>
                <div class="form-group ubuntu-form-group" style="margin-bottom:0;">
                    <div class="form-group-header ubuntu-form-group-header"><label>Upload Disabled</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <label class="file-upload-area file-upload-area--disabled ubuntu-file-upload-area ubuntu-file-upload-area--disabled">
                            <input type="file" disabled style="display:none">
                            <span class="file-upload-icon ubuntu-file-upload-icon">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                            </span>
                            <span class="file-upload-text ubuntu-file-upload-text"><strong>Upload tidak tersedia</strong></span>
                            <span class="file-upload-hint ubuntu-file-upload-hint">Input ini sedang dinonaktifkan</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div class="card ubuntu-card" id="cs-grid-form-layouts" style="margin-bottom:20px;">
            <div class="heading ubuntu-heading" style="margin-bottom:12px;">Grid Form Layouts</div>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">Grid Form — 2 Kolom</h3>
            <form class="nx-row ubuntu-nx-row">
                <div class="form-group col-12 col-md-6 ubuntu-form-group ubuntu-col-12 ubuntu-col-md-6">
                    <div class="form-group-header ubuntu-form-group-header"><label for="gf-fname">First Name</label></div>
                    <div class="form-group-body ubuntu-form-group-body"><input class="form-control ubuntu-form-control" id="gf-fname" type="text" placeholder="John"></div>
                </div>
                <div class="form-group col-12 col-md-6 ubuntu-form-group ubuntu-col-12 ubuntu-col-md-6">
                    <div class="form-group-header ubuntu-form-group-header"><label for="gf-lname">Last Name</label></div>
                    <div class="form-group-body ubuntu-form-group-body"><input class="form-control ubuntu-form-control" id="gf-lname" type="text" placeholder="Doe"></div>
                </div>
                <div class="form-group col-12 ubuntu-form-group ubuntu-col-12">
                    <div class="form-group-header ubuntu-form-group-header"><label for="gf-address">Address</label></div>
                    <div class="form-group-body ubuntu-form-group-body"><input class="form-control ubuntu-form-control" id="gf-address" type="text" placeholder="Jl. Sudirman No.1"></div>
                </div>
                <div class="form-group col-12 col-md-4 ubuntu-form-group ubuntu-col-12 ubuntu-col-md-4">
                    <div class="form-group-header ubuntu-form-group-header"><label for="gf-city">City</label></div>
                    <div class="form-group-body ubuntu-form-group-body"><input class="form-control ubuntu-form-control" id="gf-city" type="text" placeholder="Jakarta"></div>
                </div>
                <div class="form-group col-12 col-md-4 ubuntu-form-group ubuntu-col-12 ubuntu-col-md-4">
                    <div class="form-group-header ubuntu-form-group-header"><label for="gf-province">Province</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <select class="form-select ubuntu-form-select" id="gf-province">
                            <option value="">&mdash; Pilih &mdash;</option>
                            <option>DKI Jakarta</option>
                            <option>Jawa Barat</option>
                            <option>Jawa Tengah</option>
                        </select>
                    </div>
                </div>
                <div class="form-group col-12 col-md-4 ubuntu-form-group ubuntu-col-12 ubuntu-col-md-4">
                    <div class="form-group-header ubuntu-form-group-header"><label for="gf-zip">ZIP Code</label></div>
                    <div class="form-group-body ubuntu-form-group-body"><input class="form-control ubuntu-form-control" id="gf-zip" type="text" placeholder="10110"></div>
                </div>
                <div class="col-12 form-actions ubuntu-col-12 ubuntu-form-actions">
                    <button class="btn btn-primary ubuntu-btn ubuntu-btn-primary" type="submit">Simpan</button>
                    <button class="btn ubuntu-btn" type="reset">Reset</button>
                </div>
            </form>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">Grid Form — Payment</h3>
            <form class="nx-row ubuntu-nx-row">
                <div class="form-group col-12 ubuntu-form-group ubuntu-col-12">
                    <div class="form-group-header ubuntu-form-group-header"><label for="gp-card">Card Number</label></div>
                    <div class="form-group-body ubuntu-form-group-body"><input class="form-control ubuntu-form-control" id="gp-card" type="text" placeholder="1234 5678 9012 3456"></div>
                </div>
                <div class="form-group col-12 col-md-4 ubuntu-form-group ubuntu-col-12 ubuntu-col-md-4">
                    <div class="form-group-header ubuntu-form-group-header"><label for="gp-exp">Expiry</label></div>
                    <div class="form-group-body ubuntu-form-group-body"><input class="form-control ubuntu-form-control" id="gp-exp" type="text" placeholder="MM / YY"></div>
                </div>
                <div class="form-group col-12 col-md-4 ubuntu-form-group ubuntu-col-12 ubuntu-col-md-4">
                    <div class="form-group-header ubuntu-form-group-header"><label for="gp-cvv">CVV</label></div>
                    <div class="form-group-body ubuntu-form-group-body"><input class="form-control ubuntu-form-control" id="gp-cvv" type="text" placeholder="123"></div>
                </div>
                <div class="form-group col-12 col-md-4 ubuntu-form-group ubuntu-col-12 ubuntu-col-md-4">
                    <div class="form-group-header ubuntu-form-group-header"><label for="gp-zip2">ZIP</label></div>
                    <div class="form-group-body ubuntu-form-group-body"><input class="form-control ubuntu-form-control" id="gp-zip2" type="text" placeholder="10110"></div>
                </div>
                <div class="col-12 form-actions ubuntu-col-12 ubuntu-form-actions">
                    <button class="btn btn-primary ubuntu-btn ubuntu-btn-primary" type="submit">Pay Now</button>
                    <button class="btn ubuntu-btn" type="button">Cancel</button>
                </div>
            </form>

            <h3 class="ubuntu-title-4 title-4" style="margin:16px 0 8px;">Grid Form — Input dengan Icon</h3>
            <form class="nx-row ubuntu-nx-row">
                <div class="form-group col-12 ubuntu-form-group ubuntu-col-12">
                    <div class="form-group-header ubuntu-form-group-header"><label for="gi-search">Cari Repository</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <div class="input-group ubuntu-input-group">
                            <input class="form-control ubuntu-form-control" id="gi-search" type="text" placeholder="Cari repository...">
                            <div class="input-group-button ubuntu-input-group-button">
                                <button class="btn ubuntu-btn" type="button" aria-label="Search"><i class="icon-ic_fluent_search_16_regular"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-group col-12 col-md-6 ubuntu-form-group ubuntu-col-12 ubuntu-col-md-6">
                    <div class="form-group-header ubuntu-form-group-header"><label for="gi-user">Username</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <div class="input-group inline ubuntu-input-group ubuntu-inline">
                            <div class="input-group-button ubuntu-input-group-button">
                                <button class="btn ubuntu-btn" type="button" aria-label="User"><i class="icon-ic_fluent_person_16_regular"></i></button>
                            </div>
                            <input class="form-control ubuntu-form-control" id="gi-user" type="text" placeholder="octocat">
                        </div>
                    </div>
                </div>
                <div class="form-group col-12 col-md-6 ubuntu-form-group ubuntu-col-12 ubuntu-col-md-6">
                    <div class="form-group-header ubuntu-form-group-header"><label for="gi-email">Email</label></div>
                    <div class="form-group-body ubuntu-form-group-body">
                        <div class="input-group inline ubuntu-input-group ubuntu-inline">
                            <div class="input-group-button ubuntu-input-group-button">
                                <button class="btn ubuntu-btn" type="button" aria-label="Email"><i class="icon-ic_fluent_mail_16_regular"></i></button>
                            </div>
                            <input class="form-control ubuntu-form-control" id="gi-email" type="email" placeholder="user@example.com">
                        </div>
                    </div>
                </div>
                <div class="col-12 form-actions ubuntu-col-12 ubuntu-form-actions">
                    <button class="btn btn-primary ubuntu-btn ubuntu-btn-primary" type="submit">Simpan</button>
                    <button class="btn ubuntu-btn" type="reset">Reset</button>
                </div>
            </form>
        </div>

        </div>
    </div>
  `;

    const sidebar = container.querySelector('#components-nav');
    const main = container.querySelector('.ubuntu-components-main');
    if (sidebar && main) {
      sidebar.addEventListener('click', (e) => {
        const item = e.target.closest('.ubuntu-si-item');
        if (!item) return;
        const target = container.querySelector('#' + item.dataset.target);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  });
}


// export class Components {
//   constructor(winEl, sysRef) {
//     this.sys = sysRef;
//     this.el = winEl;

//     this.nav = winEl.querySelector('#components-nav');
//     this.main = winEl.querySelector('.ubuntu-components-main');
//     if (!this.nav || !this.main) return;

//     // Klik item sidebar → scroll ke card terkait di kolom kanan.
//     // Pola sama seperti pilihan kategori di template/icon.js (klik → aksi),
//     // bedanya di sini scroll-into-view, bukan render ulang grid.
//     this.nav.addEventListener('click', (e) => {
//       const item = e.target.closest('.ubuntu-si-item');
//       if (!item) return;
//       const target = winEl.querySelector('#' + item.dataset.target);
//       if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
//     });

//     // Highlight item sidebar sesuai section yang sedang terlihat saat scroll
//     // (IntersectionObserver di-scope ke .ubuntu-components-main, bukan
//     // viewport window, karena area scroll adalah div ini — bukan document).
//     const items = Array.from(this.nav.querySelectorAll('.ubuntu-si-item'));
//     const sections = items
//       .map((item) => winEl.querySelector('#' + item.dataset.target))
//       .filter(Boolean);
//     this._observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (!entry.isIntersecting) return;
//           const idx = sections.indexOf(entry.target);
//           if (idx === -1) return;
//           items.forEach((it) => it.classList.remove('ubuntu-si-active'));
//           items[idx].classList.add('ubuntu-si-active');
//         });
//       },
//       { root: this.main, threshold: 0, rootMargin: '0px 0px -70% 0px' },
//     );
//     sections.forEach((s) => this._observer.observe(s));
//   }
// }
