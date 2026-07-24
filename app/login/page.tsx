import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import styles from "./login.module.css";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Server-side: уже вошёл → в личный кабинет
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className={styles.main}>
      <section className={styles.card}>
        <h1>PhraseStore</h1>
        <p className={styles.lead}>Войдите, чтобы управлять своими фразами и цитатами.</p>

        {/* Server Action: запускает OAuth Google */}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
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
