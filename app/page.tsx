import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import styles from "./login/login.module.css";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{ error?: string }>;
};

/**
 * Стартовый экран: название программы + вход через Google.
 * После авторизации — доступ к БД (/db).
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await auth();
  if (session?.user) {
    redirect("/db");
  }

  const { error } = await searchParams;

  return (
    <main className={styles.main}>
      <section className={styles.card}>
        <h1>PhraseStore</h1>
        <p className={styles.lead}>
          Хранилище фраз и цитат. Войдите, чтобы получить доступ к базе данных.
        </p>

        {error ? (
          <p className={styles.error} role="alert">
            Ошибка входа ({error}). Проверьте AUTH_URL (порт!), Google redirect
            URI и GOOGLE_CLIENT_SECRET.
          </p>
        ) : null}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/db" });
          }}
        >
          <button type="submit" className={styles.googleBtn}>
            Войти через Google
          </button>
        </form>
      </section>
    </main>
  );
}
