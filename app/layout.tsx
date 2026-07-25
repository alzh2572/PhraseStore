import type { Metadata } from "next";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "PhraseStore",
  description: "Phrase Store — фразы и цитаты",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="ru">
      <body>
        {/* Шапка только после входа — на старте только название + кнопка Google */}
        {session?.user ? (
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              alignItems: "center",
              maxWidth: "72rem",
              margin: "0 auto",
              padding: "1rem 1.25rem 0",
            }}
          >
            <Link href="/db" style={{ textDecoration: "none", fontWeight: 700 }}>
              PhraseStore
            </Link>
            <nav
              style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
            >
              <Link href="/db">БД</Link>
              <Link href="/dashboard">Кабинет</Link>
              <Link href="/my-phrases">Мои фразы</Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" style={{ cursor: "pointer" }}>
                  Выйти
                </button>
              </form>
            </nav>
          </header>
        ) : null}
        {children}
      </body>
    </html>
  );
}
