import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listMyPhrases } from "@/lib/phrases";
import styles from "../dashboard/cabinet.module.css";

export const dynamic = "force-dynamic";

export default async function MyPhrasesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Только фразы текущего пользователя (включая PRIVATE)
  const phrases = await listMyPhrases(session.user.id);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1>Мои фразы</h1>
          <p className={styles.lead}>
            Приватные фразы видите только вы. Публичные — все пользователи.
          </p>
        </div>
        <Link className={styles.btn} href="/db">
          БД
        </Link>
      </header>

      {phrases.length === 0 ? (
        <p className={styles.empty}>Пока нет фраз. Создайте первую через API/seed.</p>
      ) : (
        <ul className={styles.list}>
          {phrases.map((phrase) => (
            <li key={phrase.id}>
              <div>
                <strong>{phrase.title}</strong>
                <span className={styles.badge}>{phrase.visibility}</span>
              </div>
              <p className={styles.content}>{phrase.content}</p>
              <small className={styles.meta}>
                ownerId: {phrase.ownerId} · {phrase.updatedAt.toLocaleString("ru-RU")}
              </small>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
