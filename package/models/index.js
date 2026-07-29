// Export function untuk route 'contact/models' (menjadi 'contact_models.js')
//
// Endpoint per-package dari package.json field "endpoint" via
// NXUI.usePackageEndpoint("models") — fungsi kernel global (api-scope.js).

let _modelsPageInstances = [];

function detectIdColumn(row) {
  const keys = Object.keys(row);
  return keys.find((k) => /^id$/i.test(k))
    || keys.find((k) => /_id$/i.test(k))
    || keys.find((k) => /id$/i.test(k))
    || null;
}

export async function index(page, route) {
  route.register(page, async (routeName, container, routeMeta = {
    title: "Models API | App",
    description: "Contoh endpoint per-package via NexaModels API.",
  }, style, nav = {}) => {
    route.routeMetaByRoute.set(page, routeMeta);

    _modelsPageInstances.forEach((t) => {
      try { t.destroy(); } catch (_) {}
    });
    _modelsPageInstances = [];

    container.innerHTML = `
        <article class="nx-page">
          <h1 class="nx-page__title">Models API (Endpoint Per-Package)</h1>
          <p class="nx-page__lead">Endpoint dari <code>package.json</code> → <code>NXUI.Storage()</code></p>
          <div id="nx-models-table"></div>
        </article>
      `;

    try {
      const TABLE_NAME = "opendata";
      await NXUI.usePackageEndpoint("models");

      const api = NXUI.Storage();
console.log("📍 NxStorage to:", NEXA);
      const result = await api
        .model(TABLE_NAME)
        .select("*")
        .get("Fetch");
      const rows = Array.isArray(result?.data) ? result.data
        : Array.isArray(result) ? result
        : [];

      // Inline editing — dibangun dinamis dari kolom row pertama
      const editing = {};
      const isIdColumn = (key) => /(^id$|_id$|id$)/i.test(key);
      const hideColumnKeys = [];
      if (rows[0]) {
        for (const key of Object.keys(rows[0])) {
          editing[key] = { type: "text" };
          if (isIdColumn(key)) hideColumnKeys.push(key);
        }
      }

      let _tableInstance;

      const t = new NXUI.NexaTables({
        container: "#nx-models-table",
        data: rows,
        caption: 'Tabel "demo"',
        pageSize: 10,
        paginationActiveBg:"red",
        // columns: [
        //   { key: "id", title: "ID" },
        //   { key: "nama", title: "Nama Lengkap" },
        //   { key: "title", title: "number" }
        // ],
        rowNumberColumn: true,
        rowNumberColumnTitle: "No",
        actionsColumnTitle: "#",
        actionsColumnPosition: "start",
        hideColumnKeys,
        editing,
        onEdit: (key, value, row) => {
          const idCol = detectIdColumn(row);
          if (!idCol) { console.warn("onEdit: tidak ditemukan kolom ID"); return; }
          console.log("📍 UPDATE:", key, value, row[idCol]);
          NXUI.Storage()
            .model(TABLE_NAME)
            .where(idCol, "=", row[idCol])
            .update({ [key]: value }, "Update")
            .catch((err) => console.warn("UPDATE gagal:", err?.message || err));
        },
        actions: {
          edit: true,
          delete: true,
          view: true,
          add: true,
          export: false,
          import: false,
          print: false,
          share: true,
        },
        onRefresh: async () => {
          const res = await NXUI.Storage()
            .model(TABLE_NAME)
            .select("*")
            .get("Fetch");
          const fresh = Array.isArray(res?.data) ? res.data
            : Array.isArray(res) ? res
            : [];
          _tableInstance.setData(fresh);
        },
        onAction: (action, row) => {
          if (action === "delete") {
            const idCol = detectIdColumn(row);
            if (!idCol) { console.warn("onAction delete: tidak ditemukan kolom ID"); return; }
            // Optimistic UI
            _tableInstance.deleteRow((r) => r === row);
            // Persist via API
            NXUI.Storage()
              .model(TABLE_NAME)
              .where(idCol, "=", row[idCol])
              .delete("Delete")
              .catch((err) => {
                console.warn("DELETE gagal:", err?.message || err);
                // Rollback dari API
                NXUI.Storage().model(TABLE_NAME).select("*").get("Fetch")
                  .then((res) => {
                    const back = Array.isArray(res?.data) ? res.data
                      : Array.isArray(res) ? res
                      : [];
                    _tableInstance.setData(back);
                  });
              });
          } else {
            console.log("📍 action:", action, row);
          }
        },
        export: {
          enabled: true,
          types: ["csv", "json", "xlsx", "pdf"],
          include: "filtered",
          fileName: "demo",
        },
      });

      _tableInstance = t;
      await t.mount();
      _modelsPageInstances.push(t);
    } catch (err) {
      console.error('[models] error:', err);
    }
  });
}
