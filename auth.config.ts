import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe конфиг (без Prisma).
 * Используется в middleware.ts — Edge Runtime не тянет Node-модули.
 */
export const authConfig = {
  providers: [
    Google({
      // Поддержка обоих имён переменных (Auth.js / явные)
      clientId:
        process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID,
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET,
      // Если в БД уже есть User с тем же email (seed) — связать аккаунт Google
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      const isProtected =
        pathname.startsWith("/db") ||
        pathname.startsWith("/view-db") ||
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/my-phrases");

      if (isProtected) {
        return isLoggedIn;
      }

      if ((pathname === "/" || pathname.startsWith("/login")) && isLoggedIn) {
        return Response.redirect(new URL("/db", request.nextUrl));
      }

      return true;
    },
  },
  // Критично для localhost / Vercel preview: доверять Host из запроса
  trustHost: true,
  // В dev смотрите логи [auth][error] в терминале
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig;
