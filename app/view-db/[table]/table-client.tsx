"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  ColumnMeta,
  DbProfile,
  TableRowsResponse,
} from "@/lib/view-db/types";
import { RowForm } from "../components/RowForm";
import styles from "../view-db.module.css";

type Props = {
  params: Promise<{ table: string }>;
};

export default function ViewDbTableClient({ params }: Props) {
  const searchParams = useSearchParams();
  const db = (
    searchParams.get("db") === "remote" ? "remote" : "local"
  ) as DbProfile;

  const [table, setTable] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<TableRowsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void params.then((p) => setTable(decodeURIComponent(p.table)));
  }, [params]);

  const load = useCallback(async () => {
    if (!table) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/view-db/api/rows?db=${db}&table=${encodeURIComponent(table)}&page=${page}&pageSize=20`
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Ошибка загрузки");
      setData(json as TableRowsResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [db, table, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const pkColumns = useMemo(
    () => data?.columns.filter((c) => c.isPrimaryKey) ?? [],
    [data]
  );

  function rowKeys(row: Record<string, unknown>): Record<string, unknown> {
    const keys: Record<string, unknown> = {};
    for (const col of pkColumns) {
      keys[col.name] = row[col.name];
    }
    return keys;
  }

  async function handleCreate(formData: Record<string, unknown>) {
    try {
      const response = await fetch("/view-db/api/rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ db, table, data: formData }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Ошибка создания");
      setMode("list");
      setPage(1);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка создания");
    }
  }

  async function handleUpdate(formData: Record<string, unknown>) {
    if (!editRow) return;
    try {
      const response = await fetch("/view-db/api/rows", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          db,
          table,
          keys: rowKeys(editRow),
          data: formData,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Ошибка обновления");
      setMode("list");
      setEditRow(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка обновления");
    }
  }

  async function handleDelete(row: Record<string, unknown>) {
    if (!confirm("Удалить строку?")) return;
    const response = await fetch("/view-db/api/rows", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ db, table, keys: rowKeys(row) }),
    });
    const json = await response.json();
    if (!response.ok) {
      alert(json.error ?? "Ошибка удаления");
      return;
    }
    await load();
  }

  const editableColumns: ColumnMeta[] = data?.columns ?? [];

  return (
    <main className={styles.main}>
      <Link className={styles.backLink} href={`/view-db?db=${db}`}>
        ← К списку таблиц
      </Link>

      <header className={styles.header}>
        <h1>{table || "…"}</h1>
        <p className={styles.lead}>
          БД: <strong>{db === "remote" ? "рабочая" : "локальная"}</strong>
          {data ? ` · ${data.total} строк` : null}
        </p>
      </header>

      {mode === "list" ? (
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setMode("create")}
          >
            Создать
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => void load()}
          >
            Обновить
          </button>
        </div>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.muted}>Загрузка…</p> : null}

      {mode === "create" && data ? (
        <section className={styles.card}>
          <h2>Новая строка</h2>
          <RowForm
            columns={editableColumns}
            submitLabel="Создать"
            onSubmit={handleCreate}
            onCancel={() => setMode("list")}
          />
        </section>
      ) : null}

      {mode === "edit" && data && editRow ? (
        <section className={styles.card}>
          <h2>Редактировать</h2>
          <RowForm
            columns={editableColumns}
            initial={editRow}
            submitLabel="Сохранить"
            onSubmit={handleUpdate}
            onCancel={() => {
              setMode("list");
              setEditRow(null);
            }}
          />
        </section>
      ) : null}

      {mode === "list" && data && !loading ? (
        <>
          <div className={styles.scroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {data.columns.map((col) => (
                    <th key={col.name}>
                      {col.name}
                      {col.isPrimaryKey ? " *" : ""}
                    </th>
                  ))}
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={data.columns.length + 1}>Нет строк</td>
                  </tr>
                ) : (
                  data.rows.map((row, index) => (
                    <tr key={index}>
                      {data.columns.map((col) => (
                        <td key={col.name}>{formatCell(row[col.name])}</td>
                      ))}
                      <td className={styles.actions}>
                        <button
                          type="button"
                          className={styles.btn}
                          onClick={() => {
                            setEditRow(row);
                            setMode("edit");
                          }}
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          className={styles.btnDanger}
                          onClick={() => void handleDelete(row)}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.pager}>
            <button
              type="button"
              className={styles.btn}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Назад
            </button>
            <span>
              Стр. {data.page} / {data.totalPages}
            </span>
            <button
              type="button"
              className={styles.btn}
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Вперёд
            </button>
          </div>
        </>
      ) : null}
    </main>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  return String(value);
}
