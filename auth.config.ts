import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID ?? "";
const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET ?? "";

/**
 * Edge-safe конфиг (без Prisma).
 * Используется в middleware.ts — Edge Runtime не тянет Node-модули.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
      // Явно требуем authorization code flow (иначе Google: missing response_type)
      authorization: {
        params: {
          response_type: "code",
          scope: "openid email profile",
          access_type: "offline",
          prompt: "consent",
        },
      },
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
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig;
