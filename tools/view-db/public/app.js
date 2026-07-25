/** @typedef {"local" | "remote"} DbProfile */
/** @typedef {{ name: string, dataType: string, isNullable: boolean, isPrimaryKey: boolean, hasDefault: boolean }} ColumnMeta */
/** @typedef {{ id: DbProfile, label: string, available: boolean, hint?: string }} DbProfileInfo */
/** @typedef {{ table: string, columns: ColumnMeta[], rows: Record<string, unknown>[], page: number, pageSize: number, total: number, totalPages: number }} TableRowsResponse */

const app = document.getElementById("app");

/** @type {{ view: "home" | "table", db: DbProfile, table: string, page: number, mode: "list" | "create" | "edit", editRow: Record<string, unknown> | null, profiles: DbProfileInfo[], tables: string[], data: TableRowsResponse | null, error: string | null, loading: boolean }} */
const state = {
  view: "home",
  db: "local",
  table: "",
  page: 1,
  mode: "list",
  editRow: null,
  profiles: [],
  tables: [],
  data: null,
  error: null,
  loading: false,
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatCell(value) {
  if (value === null || value === undefined) return "—";
  return escapeHtml(value);
}

async function api(path, options) {
  const response = await fetch(path, options);
  const json = await response.json();
  if (!response.ok) throw new Error(json.error ?? "Ошибка");
  return json;
}

function setHash() {
  if (state.view === "home") {
    location.hash = `#/?db=${state.db}`;
  } else {
    location.hash = `#/table/${encodeURIComponent(state.table)}?db=${state.db}&page=${state.page}`;
  }
}

function parseHash() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const url = new URL(raw, "http://local");
  const db = url.searchParams.get("db") === "remote" ? "remote" : "local";
  const match = url.pathname.match(/^\/table\/([^/]+)$/);
  if (match) {
    state.view = "table";
    state.table = decodeURIComponent(match[1]);
    state.db = db;
    state.page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  } else {
    state.view = "home";
    state.db = db;
    state.table = "";
    state.mode = "list";
    state.editRow = null;
  }
}

async function loadProfiles() {
  const json = await api("/api/tables");
  state.profiles = json.profiles ?? [];
}

async function loadTables() {
  state.loading = true;
  state.error = null;
  render();
  try {
    const json = await api(`/api/tables?db=${state.db}`);
    state.tables = json.tables ?? [];
  } catch (e) {
    state.tables = [];
    state.error = e instanceof Error ? e.message : "Ошибка";
  } finally {
    state.loading = false;
    render();
  }
}

async function loadRows() {
  state.loading = true;
  state.error = null;
  render();
  try {
    state.data = await api(
      `/api/rows?db=${state.db}&table=${encodeURIComponent(state.table)}&page=${state.page}&pageSize=20`
    );
  } catch (e) {
    state.data = null;
    state.error = e instanceof Error ? e.message : "Ошибка";
  } finally {
    state.loading = false;
    render();
  }
}

function rowKeys(row) {
  const keys = {};
  for (const col of state.data?.columns.filter((c) => c.isPrimaryKey) ?? []) {
    keys[col.name] = row[col.name];
  }
  return keys;
}

function renderHome() {
  const profiles = state.profiles
    .map((profile) => {
      const active = state.db === profile.id ? "dbOptionActive" : "dbOption";
      const hint =
        !profile.available && profile.hint
          ? `<em class="hint"> — ${escapeHtml(profile.hint)}</em>`
          : "";
      return `<label class="${active}">
        <input type="radio" name="db" value="${profile.id}" ${
          state.db === profile.id ? "checked" : ""
        } ${profile.available ? "" : "disabled"} />
        <span><strong>${escapeHtml(profile.label)}</strong>${hint}</span>
      </label>`;
    })
    .join("");

  const tables = state.tables
    .map(
      (table) => `<li>
        <span class="tableName">${escapeHtml(table)}</span>
        <button type="button" class="btnPrimary" data-open="${escapeHtml(table)}">Открыть</button>
      </li>`
    )
    .join("");

  app.innerHTML = `<main class="main">
    <p class="badge">Локальный инструмент · не часть PhraseStore</p>
    <header class="header">
      <h1>view-db</h1>
      <p class="lead">Тестовый просмотрщик БД: локальная или рабочая, список таблиц и CRUD.</p>
    </header>
    <div class="dbSelector" role="radiogroup" aria-label="База данных">${profiles}</div>
    ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
    ${state.loading ? `<p class="muted">Загрузка таблиц…</p>` : ""}
    ${
      !state.loading && state.tables.length === 0 && !state.error
        ? `<p class="muted">Таблиц нет.</p>`
        : ""
    }
    <ul class="tableList">${tables}</ul>
  </main>`;

  app.querySelectorAll('input[name="db"]').forEach((input) => {
    input.addEventListener("change", async (event) => {
      state.db = /** @type {HTMLInputElement} */ (event.target).value;
      setHash();
      await loadTables();
    });
  });

  app.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = "table";
      state.table = button.getAttribute("data-open") ?? "";
      state.page = 1;
      state.mode = "list";
      state.editRow = null;
      setHash();
      void loadRows();
    });
  });
}

function renderForm(columns, initial, submitLabel) {
  const fields = columns
    .map((column) => {
      const value =
        initial[column.name] == null ? "" : String(initial[column.name]);
      const mark = column.isPrimaryKey
        ? " (PK)"
        : !column.isNullable && !column.hasDefault
          ? " *"
          : "";
      return `<label class="field">
        <span>${escapeHtml(column.name)}${mark}</span>
        <input name="${escapeHtml(column.name)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(column.dataType)}" />
      </label>`;
    })
    .join("");

  return `<section class="card">
    <h2>${escapeHtml(submitLabel === "Создать" ? "Новая строка" : "Редактировать")}</h2>
    <form id="row-form">
      <div class="formGrid">${fields}</div>
      <div class="formActions">
        <button type="submit" class="btnPrimary">${escapeHtml(submitLabel)}</button>
        <button type="button" class="btn" id="cancel-form">Отмена</button>
      </div>
    </form>
  </section>`;
}

function renderTable() {
  const data = state.data;
  let body = "";

  if (state.mode === "create" && data) {
    body += renderForm(data.columns, {}, "Создать");
  }
  if (state.mode === "edit" && data && state.editRow) {
    body += renderForm(data.columns, state.editRow, "Сохранить");
  }

  if (state.mode === "list") {
    body += `<div class="toolbar">
      <button type="button" class="btnPrimary" id="btn-create">Создать</button>
      <button type="button" class="btn" id="btn-reload">Обновить</button>
    </div>`;
  }

  if (state.error) {
    body += `<p class="error">${escapeHtml(state.error)}</p>`;
  }
  if (state.loading) {
    body += `<p class="muted">Загрузка…</p>`;
  }

  if (state.mode === "list" && data && !state.loading) {
    const head = data.columns
      .map(
        (col) =>
          `<th>${escapeHtml(col.name)}${col.isPrimaryKey ? " *" : ""}</th>`
      )
      .join("");

    const rows =
      data.rows.length === 0
        ? `<tr><td colspan="${data.columns.length + 1}">Нет строк</td></tr>`
        : data.rows
            .map((row, index) => {
              const cells = data.columns
                .map((col) => `<td>${formatCell(row[col.name])}</td>`)
                .join("");
              return `<tr>
                ${cells}
                <td class="actions">
                  <button type="button" class="btn" data-edit="${index}">Изменить</button>
                  <button type="button" class="btnDanger" data-delete="${index}">Удалить</button>
                </td>
              </tr>`;
            })
            .join("");

    body += `<div class="scroll">
      <table class="table">
        <thead><tr>${head}<th>Действия</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="pager">
      <button type="button" class="btn" id="page-prev" ${state.page <= 1 ? "disabled" : ""}>Назад</button>
      <span>Стр. ${data.page} / ${data.totalPages}</span>
      <button type="button" class="btn" id="page-next" ${
        state.page >= data.totalPages ? "disabled" : ""
      }>Вперёд</button>
    </div>`;
  }

  app.innerHTML = `<main class="main">
    <button type="button" class="backLink" id="back-home">← К списку таблиц</button>
    <header class="header">
      <h1>${escapeHtml(state.table || "…")}</h1>
      <p class="lead">БД: <strong>${
        state.db === "remote" ? "рабочая" : "локальная"
      }</strong>${data ? ` · ${data.total} строк` : ""}</p>
    </header>
    ${body}
  </main>`;

  document.getElementById("back-home")?.addEventListener("click", () => {
    state.view = "home";
    state.mode = "list";
    state.editRow = null;
    setHash();
    void loadTables();
  });

  document.getElementById("btn-create")?.addEventListener("click", () => {
    state.mode = "create";
    render();
  });

  document.getElementById("btn-reload")?.addEventListener("click", () => {
    void loadRows();
  });

  document.getElementById("page-prev")?.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    setHash();
    void loadRows();
  });

  document.getElementById("page-next")?.addEventListener("click", () => {
    state.page += 1;
    setHash();
    void loadRows();
  });

  document.getElementById("cancel-form")?.addEventListener("click", () => {
    state.mode = "list";
    state.editRow = null;
    render();
  });

  document.getElementById("row-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = /** @type {HTMLFormElement} */ (event.target);
    const formData = new FormData(form);
    /** @type {Record<string, unknown>} */
    const payload = {};
    for (const column of state.data?.columns ?? []) {
      payload[column.name] = formData.get(column.name) ?? "";
    }

    try {
      if (state.mode === "create") {
        await api("/api/rows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ db: state.db, table: state.table, data: payload }),
        });
        state.mode = "list";
        state.page = 1;
      } else if (state.mode === "edit" && state.editRow) {
        await api("/api/rows", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            db: state.db,
            table: state.table,
            keys: rowKeys(state.editRow),
            data: payload,
          }),
        });
        state.mode = "list";
        state.editRow = null;
      }
      setHash();
      await loadRows();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка");
    }
  });

  app.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.getAttribute("data-edit"));
      state.editRow = state.data?.rows[index] ?? null;
      state.mode = "edit";
      render();
    });
  });

  app.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Удалить строку?")) return;
      const index = Number(button.getAttribute("data-delete"));
      const row = state.data?.rows[index];
      if (!row) return;
      try {
        await api("/api/rows", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            db: state.db,
            table: state.table,
            keys: rowKeys(row),
          }),
        });
        await loadRows();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Ошибка удаления");
      }
    });
  });
}

function render() {
  if (state.view === "table") renderTable();
  else renderHome();
}

async function boot() {
  parseHash();
  await loadProfiles();
  if (state.view === "table") {
    await loadRows();
  } else {
    await loadTables();
  }
}

window.addEventListener("hashchange", () => {
  parseHash();
  if (state.view === "table") void loadRows();
  else void loadTables();
});

void boot();
