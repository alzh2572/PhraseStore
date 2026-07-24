import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-совместимая часть конфига (providers, pages, базовые callbacks).
 * Prisma adapter подключается в auth.ts — там же database sessions.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    /**
     * Используется middleware: решаем, пускать ли на защищённый маршрут.
     * req.auth заполняется Auth.js (для database sessions — через cookie + lookup).
     */
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      const isProtected =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/my-phrases");

      if (isProtected) {
        return isLoggedIn;
      }

      // Уже вошёл → со /login сразу в кабинет
      if (pathname.startsWith("/login") && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
