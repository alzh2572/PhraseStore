"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DbProfile, DbProfileInfo } from "@/lib/view-db/types";
import { DbSelector } from "./components/DbSelector";
import styles from "./view-db.module.css";

function ViewDbHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDb =
    searchParams.get("db") === "remote" ? "remote" : ("local" as DbProfile);

  const [db, setDb] = useState<DbProfile>(initialDb);
  const [profiles, setProfiles] = useState<DbProfileInfo[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/view-db/api/tables")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Ошибка");
        setProfiles(json.profiles ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    router.replace(`/view-db?db=${db}`);
    fetch(`/view-db/api/tables?db=${db}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Ошибка");
        setTables(json.tables ?? []);
      })
      .catch((e) => {
        setTables([]);
        setError(e instanceof Error ? e.message : "Ошибка");
      })
      .finally(() => setLoading(false));
  }, [db, router]);

  return (
    <main className={styles.main}>
      <Link className={styles.backLink} href="/db">
        ← К базе данных
      </Link>

      <header className={styles.header}>
        <h1>view-db</h1>
        <p className={styles.lead}>
          Тестовый просмотрщик БД: локальная или рабочая, список таблиц и CRUD.
        </p>
      </header>

      <DbSelector profiles={profiles} value={db} onChange={setDb} />

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading ? <p className={styles.muted}>Загрузка таблиц…</p> : null}

      {!loading && tables.length === 0 && !error ? (
        <p className={styles.muted}>Таблиц нет.</p>
      ) : null}

      <ul className={styles.tableList}>
        {tables.map((table) => (
          <li key={table}>
            <span className={styles.tableName}>{table}</span>
            <Link
              className={styles.btnPrimary}
              href={`/view-db/${encodeURIComponent(table)}?db=${db}`}
            >
              Открыть
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function ViewDbPage() {
  return (
    <Suspense fallback={<main className={styles.main}>Загрузка…</main>}>
      <ViewDbHome />
    </Suspense>
  );
}
