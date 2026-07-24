import { auth } from "@/auth";

/**
 * Server-side проверка сессии.
 * Возвращает session или null (без редиректа).
 */
export async function getCurrentSession() {
  return auth();
}

/**
 * Требует авторизации; иначе бросает ошибку.
 * Для страниц дополнительно используйте middleware / redirect.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session.user;
}
