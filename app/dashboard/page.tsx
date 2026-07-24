import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import styles from "./cabinet.module.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Дублирующая server-side проверка (middleware уже защищает маршрут)
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { user } = session;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1>Личный кабинет</h1>
          <p className={styles.lead}>Добро пожаловать в PhraseStore</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className={styles.btn}>
            Выйти
          </button>
        </form>
      </header>

      <section className={styles.card}>
        <h2>Профиль</h2>
        <dl className={styles.dl}>
          <div>
            <dt>userId</dt>
            <dd>
              <code>{user.id}</code>
            </dd>
          </div>
          <div>
            <dt>email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>name</dt>
            <dd>{user.name ?? "—"}</dd>
          </div>
        </dl>
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.avatar}
            src={user.image}
            alt={user.name ?? "avatar"}
            width={64}
            height={64}
          />
        ) : null}
      </section>

      <nav className={styles.nav}>
        <Link href="/db">База данных →</Link>
        <Link href="/my-phrases">Мои фразы →</Link>
      </nav>
    </main>
  );
}
