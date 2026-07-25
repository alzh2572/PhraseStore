import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
};

/**
 * Страница входа (гость). Авторизованных отправляем в кабинет.
 */
export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;
  const errorText =
    error === "Configuration"
      ? "Ошибка конфигурации Auth.js. Проверьте GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_SECRET и AUTH_URL."
      : error === "AccessDenied"
        ? "Доступ запрещён Google."
        : error
          ? `Ошибка входа (${error}).`
          : null;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Вход</h1>
        <p className="mt-2 text-sm text-muted">
          Войдите через Google, чтобы добавлять и редактировать фразы в кабинете.
          Просмотр публичных записей доступен без входа.
        </p>

        {errorText ? (
          <p
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {errorText}
          </p>
        ) : null}

        <Button asChild className="mt-6 w-full" size="lg">
          <Link href="/api/auth/google">Войти через Google</Link>
        </Button>

        <p className="mt-4 text-center text-sm text-muted">
          <Link href="/" className="underline hover:text-slate-800">
            На главную
          </Link>
        </p>
      </div>
    </main>
  );
}
