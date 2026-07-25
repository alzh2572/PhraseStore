import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import styles from "./login/login.module.css";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{ error?: string }>;
};

/**
 * Стартовый экран: название программы + вход через Google.
 * После авторизации — личный кабинет.
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  const errorText =
    error === "Configuration"
      ? "Ошибка конфигурации Auth.js. Проверьте GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_SECRET и AUTH_URL на Vercel."
      : error === "AccessDenied"
        ? "Доступ запрещён Google."
        : error
          ? `Ошибка входа (${error}). Для Vercel: AUTH_URL=https://phrase-store-five.vercel.app и redirect URI в Google Console.`
          : null;

  return (
    <main className={styles.main}>
      <section className={styles.card}>
        <h1>PhraseStore</h1>
        <p className={styles.lead}>
          Хранилище фраз и цитат. Войдите, чтобы открыть личный кабинет.
        </p>

        {errorText ? (
          <p className={styles.error} role="alert">
            {errorText}
          </p>
        ) : null}

        {/* Прямой GET на наш handler — полный OAuth URL с response_type=code */}
        <Link className={styles.googleBtn} href="/api/auth/google">
          Войти через Google
        </Link>
      </section>
    </main>
  );
}
