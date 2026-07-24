import Link from "next/link";
import {
  APP_TABLES,
  fetchTableRows,
  isAppTable,
  type AppTable,
} from "@/lib/tables";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{ table?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const requested = params.table ?? "Note";
  const table: AppTable = isAppTable(requested) ? requested : "Note";

  let columns: string[] = [];
  let rows: Record<string, unknown>[] = [];
  let errorMessage: string | null = null;

  try {
    const data = await fetchTableRows(table);
    columns = data.columns;
    rows = data.rows;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Не удалось загрузить таблицу";
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1>PhraseStore</h1>
        <p className={styles.lead}>
          Данные из PostgreSQL через Prisma. Выберите таблицу.{" "}
          <Link href="/view-db">view-db</Link>
          {" · "}
          <Link href="/login">Войти через Google</Link>
        </p>
      </header>

      <nav className={styles.tabs} aria-label="Таблицы">
        {APP_TABLES.map((name) => (
          <Link
            key={name}
            href={`/?table=${name}`}
            className={name === table ? styles.tabActive : styles.tab}
            prefetch={false}
          >
            {name}
          </Link>
        ))}
      </nav>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>{table}</h2>
          <span className={styles.count}>
            {errorMessage ? "—" : `${rows.length} строк`}
          </span>
        </div>

        {errorMessage ? (
          <p className={styles.error}>{errorMessage}</p>
        ) : rows.length === 0 ? (
          <p className={styles.empty}>Таблица пуста.</p>
        ) : (
          <div className={styles.scroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={String(row.id ?? `${table}-${index}`)}>
                    {columns.map((col) => (
                      <td key={col}>{formatCell(row[col])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  return String(value);
}
