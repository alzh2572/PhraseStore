import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe конфиг (без Prisma).
 * Используется в middleware.ts — Edge Runtime не тянет Node-модули.
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
     * Middleware: пускать ли на защищённый маршрут.
     * При false Auth.js сам редиректит на pages.signIn (/login).
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

      if (pathname.startsWith("/login") && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
